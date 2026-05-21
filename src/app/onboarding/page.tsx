import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { getUserFarms } from "@/lib/selected-farm";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const farms = await getUserFarms(session.user.id);
  if (farms.length > 0) redirect("/dashboard");

  return <OnboardingClient initialName={session.user.name ?? ""} />;
}
