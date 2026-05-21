import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { UpdateProfileForm } from "@/features/settings/components/update-profile-form";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <UpdateProfileForm
      user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}
    />
  );
}
