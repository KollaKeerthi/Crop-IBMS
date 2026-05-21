import { auth } from "@/features/auth";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password below.</p>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
            This reset link is invalid or has expired. Please{" "}
            <a href="/forgot-password" className="font-medium underline underline-offset-4">
              request a new one
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
