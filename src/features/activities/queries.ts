import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import type { Activity } from "./schema";

type ActivityRow = typeof activities.$inferSelect;

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    description: row.description ?? null,
    category: row.category ?? null,
    code: row.code ?? null,
    displayOrder: row.displayOrder ?? 0,
    maxSimultaneous: row.maxSimultaneous ?? 1,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listActivities(farmId: string): Promise<Activity[]> {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.farmId, farmId))
    .orderBy(asc(activities.displayOrder), asc(activities.name));
  return rows.map(toActivity);
}

export async function getActivityById(
  activityId: string,
  farmId: string
): Promise<Activity | null> {
  const [row] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.farmId, farmId)));
  return row ? toActivity(row) : null;
}
