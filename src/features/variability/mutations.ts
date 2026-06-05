import { eq } from "drizzle-orm";
import { db } from "@/db";
import { variability } from "@/db/schema";
import type { CreateVariabilityInput, UpdateVariabilityInput } from "./schema";

export async function insertVariability(input: CreateVariabilityInput) {
  const [row] = await db
    .insert(variability)
    .values({
      farmId: input.farmId ?? null,
      productionTypeId: input.productionTypeId,
      variability: input.variability,
    })
    .returning();
  return row!;
}

export async function updateVariabilityRow(id: string, input: UpdateVariabilityInput) {
  const patch: Partial<typeof variability.$inferInsert> = { updatedAt: new Date() };
  if (input.productionTypeId !== undefined) patch.productionTypeId = input.productionTypeId;
  if (input.variability !== undefined) patch.variability = input.variability;
  const [row] = await db.update(variability).set(patch).where(eq(variability.id, id)).returning();
  return row ?? null;
}

export async function deleteVariability(id: string) {
  await db.delete(variability).where(eq(variability.id, id));
}
