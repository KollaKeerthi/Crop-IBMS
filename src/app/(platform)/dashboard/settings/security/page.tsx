import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { ChangePasswordForm } from "@/features/settings/components/change-password-form";

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <ChangePasswordForm />;
}
