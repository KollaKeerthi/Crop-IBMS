import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { apiError, apiOk, firstError } from "@/lib/api/response";
import { createRateLimiter } from "@/lib/rate-limit";
import { db } from "@/db";
import { farms, tasks, plantings, crops, farmMemberships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AiChatRequestSchema } from "@/features/ai/schema";

export const runtime = "nodejs";

// LLM calls are expensive — gate per user, tighter than the global API limiter.
const aiLimiter = createRateLimiter({ windowMs: 60_000, max: 20, name: "ai" });

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();

    const ai = await aiLimiter(ctx.userId);
    if (!ai.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many AI requests." } },
        { status: 429, headers: { "Retry-After": String(ai.retryAfter) } }
      );
    }
    const body = await req.json().catch(() => null);
    const parsedBody = AiChatRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new ApiError(
        422,
        "validation_error",
        firstError(parsedBody.error.issues, "Invalid input.")
      );
    }

    const { message, farmId, history } = parsedBody.data;

    // Verify farm access
    const membership = await db
      .select()
      .from(farmMemberships)
      .where(and(eq(farmMemberships.userId, ctx.userId), eq(farmMemberships.farmId, farmId)))
      .limit(1);
    if (!membership[0]) return apiError(new ApiError(403, "forbidden", "No access to this farm."));

    // Gather farm context for the AI
    const [farmData, taskList, plantingList, cropList] = await Promise.all([
      db.select().from(farms).where(eq(farms.id, farmId)).limit(1),
      db
        .select()
        .from(tasks)
        .where(eq(tasks.farmId, farmId))
        .orderBy(desc(tasks.createdAt))
        .limit(10),
      db.select().from(plantings).where(eq(plantings.farmId, farmId)).limit(10),
      db.select().from(crops).limit(20),
    ]);

    const farmContext = `
Farm: ${farmData[0]?.name ?? "Unknown"}, Location: ${farmData[0]?.location ?? "Unknown"}
Recent Tasks (${taskList.length}): ${taskList.map((t) => `${t.title} (${t.status})`).join(", ") || "None"}
Plantings (${plantingList.length}): ${plantingList.length} plantings on record
Crops available: ${cropList.map((c) => c.name).join(", ") || "None"}
    `.trim();

    const systemPrompt = `You are an agricultural management assistant for ${farmData[0]?.name ?? "this farm"}.
You help farmers with planning, scheduling, crop management, and farm operations.
Current farm context:
${farmContext}

Be concise, practical, and helpful. If you don't know something specific about this farm, say so.`;

    // Use Anthropic API if ANTHROPIC_API_KEY is set, otherwise return a helpful fallback
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback: return a non-streaming helpful message
      const fallbackResponse = `I'm your farm assistant for ${farmData[0]?.name ?? "your farm"}.

To enable AI responses, please add your ANTHROPIC_API_KEY to your environment variables.

In the meantime, here's what I can tell you about your farm:
- You have ${taskList.length} recent tasks
- You have ${plantingList.length} plantings on record
- ${cropList.length} crops are in the system

Your question was: "${message}"`;

      return apiOk({ response: fallbackResponse });
    }

    // Build messages for Anthropic API (no system role in messages array)
    const anthropicMessages = [
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: "user" as const, content: message },
    ];

    // Stream response using Anthropic API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return apiError(new ApiError(502, "ai_error", `AI service error: ${errText}`));
    }

    // Stream the SSE response through to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (
                    parsed.type === "content_block_delta" &&
                    parsed.delta?.type === "text_delta"
                  ) {
                    const text = parsed.delta.text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                  if (parsed.type === "message_stop") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                } catch {
                  /* skip unparseable lines */
                }
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
