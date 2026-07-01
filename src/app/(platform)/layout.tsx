import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/features/auth";
import { db } from "@/db";
import { farmMemberships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getUserFarms, resolveSelectedFarmIdFromList } from "@/lib/selected-farm";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { FarmProvider } from "@/lib/farm-context";
import { SidebarProvider } from "@/lib/sidebar-context";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userFarms = await getUserFarms(session.user.id);

  // First-time user: no farms → send to onboarding
  if (userFarms.length === 0) redirect("/onboarding");

  const ownerRows = await db
    .select({ role: farmMemberships.role })
    .from(farmMemberships)
    .where(and(eq(farmMemberships.userId, session.user.id), eq(farmMemberships.role, "OWNER")))
    .limit(1);
  const isOwner = ownerRows.length > 0;

  const cookieStore = await cookies();
  const selectedFarmId = resolveSelectedFarmIdFromList(
    userFarms,
    cookieStore.get("selected_farm_id")?.value
  );

  const sessionUser = {
    name: session.user.name ?? null,
    email: session.user.email!,
    image: session.user.image ?? null,
  };

  return (
    <FarmProvider defaultFarmId={selectedFarmId}>
      <SidebarProvider>
        <div className="min-h-screen bg-transparent p-2 sm:p-3">
          <div className="app-frame flex h-[calc(100vh-1rem)] overflow-hidden rounded-[2.5rem] sm:h-[calc(100vh-1.5rem)]">
            <Sidebar farms={userFarms} user={sessionUser} isOwner={isOwner} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar user={sessionUser} />
              <main className="flex-1 overflow-y-auto bg-transparent pb-4">{children}</main>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </FarmProvider>
  );
}
