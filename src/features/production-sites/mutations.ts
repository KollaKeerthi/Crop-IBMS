import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productionSites } from "@/db/schema";
import type { CreateProductionSiteInput, UpdateProductionSiteInput, ProductionSite } from "./schema";
import { getProductionSiteById } from "./queries";

export async function insertProductionSite(
  input: CreateProductionSiteInput
): Promise<ProductionSite | null> {
  const [row] = await db
    .insert(productionSites)
    .values({ code: input.code, description: input.description ?? null })
    .returning();
  if (!row) return null;
  return getProductionSiteById(row.id);
}

export async function updateProductionSite(
  siteId: string,
  input: UpdateProductionSiteInput
): Promise<ProductionSite | null> {
  await db
    .update(productionSites)
    .set({
      ...(input.code !== undefined && { code: input.code }),
      ...(input.description !== undefined && { description: input.description ?? null }),
    })
    .where(eq(productionSites.id, siteId));
  return getProductionSiteById(siteId);
}

export async function deleteProductionSite(siteId: string): Promise<void> {
  await db.delete(productionSites).where(eq(productionSites.id, siteId));
}
