import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/features/auth";
import { verifyEmailHandler } from "@/features/auth/handlers";
import { getEmailForVerificationToken } from "@/features/auth/queries";
import { Button } from "@/components/ui/button";
import { VerifyEmailClient } from "@/features/auth/components/verify-email-client";
import { ApiError } from "@/lib/api/errors";

function renderVerifiedEmailState(verifiedEmail: string) {
  return (
    <Shell>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold">Email verified!</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{verifiedEmail}</span> is confirmed.
          You can now sign in.
        </p>
      </div>
      <Link href="/login">
        <Button className="w-full">Sign in</Button>
      </Link>
    </Shell>
  );
}

function renderVerificationErrorState({
  isExpired,
  recoveredEmail,
}: {
  isExpired: boolean;
  recoveredEmail: string | null;
}) {
  return (
    <Shell>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-2xl">
          ✕
        </div>
        <h1 className="text-2xl font-semibold">{isExpired ? "Link expired" : "Link invalid"}</h1>
        <p className="text-sm text-muted-foreground">
          {isExpired
            ? "This verification link has expired. Request a new one below."
            : "This verification link is invalid or has already been used."}
        </p>
      </div>
      <div className="space-y-3 text-center">
        <VerifyEmailClient email={recoveredEmail ?? undefined} />
        <Link href="/login" className="block text-sm text-muted-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </Shell>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  // ── Token verification ───────────────────────────────────────────────────
  // IMPORTANT: run before the session check. Otherwise a user with a stale or
  // unrelated session would be redirected to /dashboard without their newly
  // signed-up account ever getting `emailVerified` set, breaking sign-in.
  if (token) {
    try {
      const { email: verifiedEmail } = await verifyEmailHandler(token);
      return renderVerifiedEmailState(verifiedEmail);
    } catch (err) {
      const isExpired = err instanceof ApiError && err.code === "token_expired";
      // Recover the email from the token (kept around for expired/invalid
      // cases) so the user can resend without re-typing it.
      const recoveredEmail = await getEmailForVerificationToken(token).catch(() => null);
      return renderVerificationErrorState({ isExpired, recoveredEmail });
    }
  }

  const session = await auth();
  if (session?.user) redirect("/dashboard");

  // ── "Check your email" state (redirected here after signup) ──────────────
  return (
    <Shell>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
          ✉
        </div>
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email address"
          )}
          . Click the link in that email to activate your account.
        </p>
      </div>

      <div className="space-y-3 text-center">
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder or:
        </p>
        <VerifyEmailClient email={email} />
        <Link
          href="/login"
          className="block text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8">{children}</div>
    </div>
  );
}
