import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import {
  buildAuthorizeUrl,
  isCalendarProvider,
} from "@/lib/integrations/calendar-oauth";

type Params = { params: Promise<{ provider: string }> };

const STATE_COOKIE_PREFIX = "calendar_oauth_state_";

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { provider } = await params;
    if (!isCalendarProvider(provider)) {
      throw new ApiError(400, "invalid_provider", "Unknown calendar provider.");
    }
    const state = crypto.randomUUID();
    const url = buildAuthorizeUrl(provider, state);
    const res = NextResponse.redirect(url);
    res.cookies.set(`${STATE_COOKIE_PREFIX}${provider}`, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (err) {
    return apiError(err);
  }
}
