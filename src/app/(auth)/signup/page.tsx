import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { SignUpForm } from "@/features/auth/components/signup-form";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-muted-foreground">Enter your details to get started</p>
      </div>
      <SignUpForm />
    </div>
  );
}
