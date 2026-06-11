import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { stakeholderMaster } from "@/db/schema";
import type { Stakeholder } from "./schema";

type StakeholderRow = typeof stakeholderMaster.$inferSelect;

function toStakeholder(row: StakeholderRow): Stakeholder {
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listStakeholders(farmId: string): Promise<Stakeholder[]> {
  const rows = await db
    .select()
    .from(stakeholderMaster)
    .where(eq(stakeholderMaster.farmId, farmId))
    .orderBy(stakeholderMaster.name);
  return rows.map(toStakeholder);
}

export async function getStakeholderById(id: string, farmId: string): Promise<Stakeholder | null> {
  const [row] = await db
    .select()
    .from(stakeholderMaster)
    .where(and(eq(stakeholderMaster.id, id), eq(stakeholderMaster.farmId, farmId)));
  return row ? toStakeholder(row) : null;
}
