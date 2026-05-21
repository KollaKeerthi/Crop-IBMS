import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import type { CreateActivityInput, UpdateActivityInput, Activity } from "./schema";
import { getActivityById } from "./queries";

export async function insertActivity(
  farmId: string,
  input: CreateActivityInput
): Promise<Activity | null> {
  const [row] = await db
    .insert(activities)
    .values({
      farmId,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      code: input.code ?? null,
      displayOrder: input.displayOrder ?? 0,
      maxSimultaneous: input.maxSimultaneous ?? 1,
    })
    .returning();

  if (!row) return null;
  return getActivityById(row.id, farmId);
}

export async function updateActivity(
  activityId: string,
  farmId: string,
  input: UpdateActivityInput
): Promise<Activity | null> {
  await db
    .update(activities)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.maxSimultaneous !== undefined && { maxSimultaneous: input.maxSimultaneous }),
    })
    .where(and(eq(activities.id, activityId), eq(activities.farmId, farmId)));

  return getActivityById(activityId, farmId);
}

export async function deleteActivity(activityId: string, farmId: string): Promise<void> {
  await db
    .delete(activities)
    .where(and(eq(activities.id, activityId), eq(activities.farmId, farmId)));
}
