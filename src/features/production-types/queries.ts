import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productionTypes } from "@/db/schema";
import type { ProductionType } from "./schema";

function toProductionType(row: typeof productionTypes.$inferSelect): ProductionType {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listProductionTypes(): Promise<ProductionType[]> {
  const rows = await db.select().from(productionTypes).orderBy(productionTypes.code);
  return rows.map(toProductionType);
}

export async function getProductionTypeById(id: string): Promise<ProductionType | null> {
  const [row] = await db.select().from(productionTypes).where(eq(productionTypes.id, id));
  return row ? toProductionType(row) : null;
}
