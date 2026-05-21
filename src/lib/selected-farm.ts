import { cookies } from "next/headers";
import { db } from "@/db";
import { farmMemberships, farms } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserFarmOption = { id: string; name: string };

export async function getUserFarms(userId: string): Promise<UserFarmOption[]> {
  return db
    .select({ id: farms.id, name: farms.name })
    .from(farms)
    .innerJoin(farmMemberships, eq(farmMemberships.farmId, farms.id))
    .where(eq(farmMemberships.userId, userId));
}

/** Match platform layout: cookie if valid for user, else first farm. */
export function resolveSelectedFarmIdFromList(
  userFarms: UserFarmOption[],
  cookieFarmId: string | undefined
): string | null {
  if (userFarms.length === 0) return null;
  if (cookieFarmId && userFarms.some((f) => f.id === cookieFarmId)) return cookieFarmId;
  return userFarms[0]?.id ?? null;
}

export async function resolveSelectedFarmId(userId: string): Promise<{
  selectedFarmId: string | null;
  userFarms: UserFarmOption[];
}> {
  const userFarms = await getUserFarms(userId);
  const cookieStore = await cookies();
  const cookieFarmId = cookieStore.get("selected_farm_id")?.value;
  const selectedFarmId = resolveSelectedFarmIdFromList(userFarms, cookieFarmId);
  return { selectedFarmId, userFarms };
}
