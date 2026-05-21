import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { farms, farmMemberships, users } from "@/db/schema";
import type { CreateFarmInput, UpdateFarmInput, Farm } from "./schema";
import { getFarmById } from "./queries";

export async function createFarm(userId: string, input: CreateFarmInput): Promise<Farm | null> {
  const [farmRow] = await db
    .insert(farms)
    .values({
      name: input.name,
      location: input.location ?? null,
      address: input.address ?? null,
      country: input.country ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon ?? null,
      areaSqm: input.areaSqm ?? null,
      ownerId: userId,
    })
    .returning();

  if (!farmRow) return null;

  await db.insert(farmMemberships).values({
    userId,
    farmId: farmRow.id,
    role: "OWNER",
  });

  // Set primaryFarmId on the user if not already set
  await db
    .update(users)
    .set({ primaryFarmId: farmRow.id })
    .where(and(eq(users.id, userId), isNull(users.primaryFarmId)));

  return getFarmById(farmRow.id, userId);
}

export async function updateFarm(farmId: string, input: UpdateFarmInput): Promise<Farm | null> {
  await db
    .update(farms)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...((input.boundary !== undefined ||
        input.boundaryPolygon !== undefined ||
        input.boundary_polygon !== undefined) && {
        boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon,
      }),
      ...(input.areaSqm !== undefined && { areaSqm: input.areaSqm }),
      updatedAt: new Date(),
    })
    .where(eq(farms.id, farmId));

  const [row] = await db.select().from(farms).where(eq(farms.id, farmId));
  if (!row) return null;

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

export async function deleteFarm(farmId: string): Promise<void> {
  await db.delete(farms).where(eq(farms.id, farmId));
}
