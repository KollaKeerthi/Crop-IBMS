import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarIntegrations } from "@/db/schema";
import { apiOk, apiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth";

export async function GET(_req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const rows = await db
      .select({
        provider: calendarIntegrations.provider,
        connectedAt: calendarIntegrations.createdAt,
      })
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.userId, ctx.userId));
    return apiOk(
      rows.map((r) => ({ provider: r.provider, connectedAt: r.connectedAt.toISOString() }))
    );
  } catch (err) {
    return apiError(err);
  }
}
