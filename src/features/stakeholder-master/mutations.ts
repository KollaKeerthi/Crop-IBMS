import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { stakeholderMaster } from "@/db/schema";
import type { CreateStakeholderInput, UpdateStakeholderInput, Stakeholder } from "./schema";
import { getStakeholderById } from "./queries";

export async function insertStakeholder(
  farmId: string,
  input: CreateStakeholderInput
): Promise<Stakeholder | null> {
  const [row] = await db
    .insert(stakeholderMaster)
    .values({
      farmId,
      name: input.name,
      description: input.description ?? null,
    })
    .returning();

  if (!row) return null;
  return getStakeholderById(row.id, farmId);
}

export async function updateStakeholder(
  id: string,
  farmId: string,
  input: UpdateStakeholderInput
): Promise<Stakeholder | null> {
  await db
    .update(stakeholderMaster)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      updatedAt: new Date(),
    })
    .where(and(eq(stakeholderMaster.id, id), eq(stakeholderMaster.farmId, farmId)));

  return getStakeholderById(id, farmId);
}

export async function deleteStakeholder(id: string, farmId: string): Promise<void> {
  await db
    .delete(stakeholderMaster)
    .where(and(eq(stakeholderMaster.id, id), eq(stakeholderMaster.farmId, farmId)));
}
