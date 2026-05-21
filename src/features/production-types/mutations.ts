import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productionTypes } from "@/db/schema";
import type { CreateProductionTypeInput, UpdateProductionTypeInput } from "./schema";

export async function insertProductionType(input: CreateProductionTypeInput) {
  const [row] = await db
    .insert(productionTypes)
    .values({ code: input.code, description: input.description ?? null })
    .returning();
  return row!;
}

export async function updateProductionType(id: string, input: UpdateProductionTypeInput) {
  if (input.code === undefined && input.description === undefined) return null;
  const [row] = await db
    .update(productionTypes)
    .set({
      ...(input.code !== undefined && { code: input.code }),
      ...(input.description !== undefined && { description: input.description ?? null }),
    })
    .where(eq(productionTypes.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProductionType(id: string) {
  await db.delete(productionTypes).where(eq(productionTypes.id, id));
}
