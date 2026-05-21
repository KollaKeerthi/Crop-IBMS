import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/features/auth/lib/config";
import { createRateLimiter } from "@/lib/rate-limit";
import { getIp } from "@/lib/get-ip";

const { auth } = NextAuth(authConfig);

const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const isApiV1 = pathname.startsWith("/api/v1/");
  if (isApiV1) {
    const result = await apiLimiter(getIp(req as unknown as NextRequest));
    if (!result.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests." } },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
      );
    }
  }

  const isLoggedIn = !!req.auth;
  const isAuthRoute = pathname.startsWith("/api/auth");
  const isWebhook = pathname.startsWith("/api/webhooks");
  const isPublicPage = [
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/privacy",
  ].includes(pathname);

  if (isAuthRoute || isWebhook || isPublicPage) return;

  if (isApiV1) return;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
