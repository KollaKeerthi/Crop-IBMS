import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { CalendarIntegrations } from "@/features/settings/components/calendar-integrations";

export default async function IntegrationsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <CalendarIntegrations />;
}
