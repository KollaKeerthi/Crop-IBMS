import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/features/auth";
import { db } from "@/db";
import { farms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveSelectedFarmId } from "@/lib/selected-farm";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { WeatherWidget } from "@/features/weather/components/weather-widget";
import { DashboardRecentTasks } from "@/features/dashboard/components/dashboard-recent-tasks";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { selectedFarmId } = await resolveSelectedFarmId(session.user.id);

  let farm: (typeof farms.$inferSelect) | null = null;

  if (selectedFarmId) {
    const farmRows = await db.select().from(farms).where(eq(farms.id, selectedFarmId)).limit(1);
    farm = farmRows[0] ?? null;
  }

  return (
    <PageShell>
      <SectionHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.name ?? session.user.email}. Here is your agricultural snapshot.`}
      >
        {!selectedFarmId ? (
          <div className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-8 text-center">
            <p className="text-h4 font-semibold text-foreground">No farm selected</p>
            <p className="text-small text-muted-foreground">
              Create or select a farm to get started.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/farms">
                <Button>Go to Farms</Button>
              </Link>
            </div>
          </div>
        ) : (
          <WeatherWidget
            latitude={farm?.latitude ?? null}
            longitude={farm?.longitude ?? null}
            locationName={farm?.name ?? "Farm"}
          />
        )}
      </SectionHeader>

      {selectedFarmId && <DashboardRecentTasks farmId={selectedFarmId} />}
    </PageShell>
  );
}
