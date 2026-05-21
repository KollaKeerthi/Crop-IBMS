import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productionSites } from "@/db/schema";
import type { ProductionSite } from "./schema";

type SiteRow = typeof productionSites.$inferSelect;

function toSite(row: SiteRow): ProductionSite {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listProductionSites(): Promise<ProductionSite[]> {
  const rows = await db.select().from(productionSites).orderBy(productionSites.code);
  return rows.map(toSite);
}

export async function getProductionSiteById(siteId: string): Promise<ProductionSite | null> {
  const [row] = await db
    .select()
    .from(productionSites)
    .where(eq(productionSites.id, siteId));
  return row ? toSite(row) : null;
}
