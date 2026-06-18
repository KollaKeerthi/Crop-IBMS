"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/features/auth";
import { createRateLimiter } from "@/lib/rate-limit";
import { ipFromHeaders } from "@/lib/get-ip";
import { rateLimitMessage } from "@/lib/api/rate-limit-message";
import { getLoginLock, recordFailedLogin } from "@/lib/login-attempts";

// Credential sign-in runs in-process via this server action, so the /api/v1
// middleware limiter never sees it — gate brute force / credential stuffing here.
const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 10, name: "login" });

export async function signInWithGoogle(redirectTo?: string) {
  await signIn("google", { redirectTo: redirectTo ?? "/dashboard" });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithCredentials(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = (formData.get("email") as string) ?? "";

  const ip = ipFromHeaders(await headers());
  const limit = await loginLimiter(ip);
  if (!limit.allowed) {
    return { error: rateLimitMessage(limit.retryAfter, "Too many sign-in attempts.") };
  }

  // Per-account lockout (survives IP rotation). Cleared on success in authorize().
  const lock = await getLoginLock(email);
  if (lock.locked) {
    return {
      error: rateLimitMessage(lock.retryAfter, "Account temporarily locked after failed sign-ins."),
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password") as string,
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await recordFailedLogin(email);
      return { error: "Invalid email or password." };
    }
    // redirect() throws - re-throw so Next.js can handle it
    throw error;
  }
  return { error: null };
}
