import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { productionTypes, variability } from "@/db/schema";
import type { Variability } from "./schema";

function toVariability(
  row: typeof variability.$inferSelect,
  productionTypeName: string | null
): Variability {
  return {
    id: row.id,
    farmId: row.farmId,
    productionTypeId: row.productionTypeId,
    productionTypeName,
    variability: row.variability,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listVariability(farmId: string | null): Promise<Variability[]> {
  const rows = await db
    .select({ v: variability, ptName: productionTypes.code })
    .from(variability)
    .leftJoin(productionTypes, eq(productionTypes.id, variability.productionTypeId))
    .where(farmId ? eq(variability.farmId, farmId) : isNull(variability.farmId))
    .orderBy(desc(variability.createdAt));
  return rows.map((r) => toVariability(r.v, r.ptName));
}

export async function getVariabilityById(id: string): Promise<Variability | null> {
  const [row] = await db
    .select({ v: variability, ptName: productionTypes.code })
    .from(variability)
    .leftJoin(productionTypes, eq(productionTypes.id, variability.productionTypeId))
    .where(eq(variability.id, id));
  return row ? toVariability(row.v, row.ptName) : null;
}
