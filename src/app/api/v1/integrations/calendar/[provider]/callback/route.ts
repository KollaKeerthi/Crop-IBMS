import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarIntegrations } from "@/db/schema";
import { apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { logAudit } from "@/lib/audit";
import { exchangeCodeForToken, isCalendarProvider } from "@/lib/integrations/calendar-oauth";

type Params = { params: Promise<{ provider: string }> };

const STATE_COOKIE_PREFIX = "calendar_oauth_state_";

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { provider } = await params;
    if (!isCalendarProvider(provider)) {
      throw new ApiError(400, "invalid_provider", "Unknown calendar provider.");
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const errorParam = req.nextUrl.searchParams.get("error");
    if (errorParam) {
      throw new ApiError(400, "oauth_denied", `Provider returned error: ${errorParam}`);
    }
    if (!code || !state) {
      throw new ApiError(400, "missing_code_or_state", "OAuth callback missing code/state.");
    }

    const cookieName = `${STATE_COOKIE_PREFIX}${provider}`;
    const expectedState = req.cookies.get(cookieName)?.value;
    if (!expectedState || expectedState !== state) {
      throw new ApiError(400, "invalid_state", "OAuth state mismatch.");
    }

    const token = await exchangeCodeForToken(provider, code);

    const existing = await db
      .select()
      .from(calendarIntegrations)
      .where(
        and(
          eq(calendarIntegrations.userId, ctx.userId),
          eq(calendarIntegrations.provider, provider)
        )
      );

    if (existing.length > 0) {
      await db
        .update(calendarIntegrations)
        .set({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken ?? existing[0]!.refreshToken,
          tokenExpiry: token.expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(calendarIntegrations.id, existing[0]!.id));
    } else {
      await db.insert(calendarIntegrations).values({
        userId: ctx.userId,
        provider,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenExpiry: token.expiresAt,
      });
    }

    await logAudit({
      userId: ctx.userId,
      action: "calendar_integration.connected",
      resource: provider,
    });

    const redirect = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/dashboard/settings/integrations?connected=${provider}`
    );
    redirect.cookies.delete(cookieName);
    return redirect;
  } catch (err) {
    return apiError(err);
  }
}
