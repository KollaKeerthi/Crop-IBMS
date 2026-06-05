import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { farms, farmMemberships } from "@/db/schema";
import type { Farm } from "./schema";

type FarmRow = typeof farms.$inferSelect;

function toFarm(row: FarmRow): Farm {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? null,
    address: row.address ?? null,
    country: row.country ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    boundary: row.boundary ?? null,
    boundaryPolygon: row.boundary ?? null,
    boundary_polygon: row.boundary ?? null,
    areaSqm: row.areaSqm ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getFarmsByUserId(userId: string): Promise<Farm[]> {
  const rows = await db
    .select({ farm: farms })
    .from(farmMemberships)
    .innerJoin(farms, eq(farmMemberships.farmId, farms.id))
    .where(eq(farmMemberships.userId, userId))
    .orderBy(farms.name);
  return rows.map((r) => toFarm(r.farm));
}

export async function getFarmById(farmId: string, userId: string): Promise<Farm | null> {
  const rows = await db
    .select({ farm: farms })
    .from(farmMemberships)
    .innerJoin(farms, eq(farmMemberships.farmId, farms.id))
    .where(and(eq(farmMemberships.userId, userId), eq(farms.id, farmId)));
  const row = rows[0];
  return row ? toFarm(row.farm) : null;
}

export async function checkFarmAccess(farmId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ farmId: farmMemberships.farmId })
    .from(farmMemberships)
    .where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.farmId, farmId)));
  return rows.length > 0;
}
