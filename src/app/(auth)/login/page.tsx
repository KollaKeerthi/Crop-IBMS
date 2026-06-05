import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { callbackUrl, error } = await searchParams;

  const oauthErrors: Record<string, string> = {
    OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
    OAuthCallbackError: "Sign-in failed. Please try again.",
    Default: "Something went wrong. Please try again.",
  };
  const oauthError = error ? (oauthErrors[error] ?? oauthErrors.Default) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      {oauthError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {oauthError}
        </p>
      )}

      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
