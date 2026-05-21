import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import { farmMemberships } from "@/db/schema";
import { listVariability, getVariabilityById } from "./queries";
import { insertVariability, updateVariabilityRow, deleteVariability } from "./mutations";
import type { CreateVariabilityInput, UpdateVariabilityInput, Variability } from "./schema";

async function assertFarmAccess(farmId: string, userId: string) {
  const [m] = await db
    .select()
    .from(farmMemberships)
    .where(and(eq(farmMemberships.farmId, farmId), eq(farmMemberships.userId, userId)));
  if (!m) throw new ApiError(403, "forbidden", "Access denied.");
}

export async function listVariabilityHandler(
  ctx: ApiContext,
  farmId: string | null
): Promise<Variability[]> {
  if (farmId) await assertFarmAccess(farmId, ctx.userId);
  return listVariability(farmId);
}

export async function createVariabilityHandler(
  ctx: ApiContext,
  input: CreateVariabilityInput
): Promise<Variability> {
  if (input.farmId) await assertFarmAccess(input.farmId, ctx.userId);
  const row = await insertVariability(input);
  const full = await getVariabilityById(row.id);
  if (!full) throw new ApiError(500, "internal_error", "Could not load created record.");
  await logAudit({
    userId: ctx.userId,
    action: "variability.created",
    resource: row.id,
    metadata: { productionTypeId: input.productionTypeId, variability: input.variability },
  });
  return full;
}

export async function updateVariabilityHandler(
  ctx: ApiContext,
  id: string,
  input: UpdateVariabilityInput
): Promise<Variability> {
  const existing = await getVariabilityById(id);
  if (!existing) throw new ApiError(404, "not_found", "Variability record not found.");
  if (existing.farmId) await assertFarmAccess(existing.farmId, ctx.userId);
  const updated = await updateVariabilityRow(id, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update record.");
  const full = await getVariabilityById(id);
  if (!full) throw new ApiError(500, "internal_error", "Could not load updated record.");
  await logAudit({ userId: ctx.userId, action: "variability.updated", resource: id });
  return full;
}

export async function deleteVariabilityHandler(ctx: ApiContext, id: string): Promise<void> {
  const existing = await getVariabilityById(id);
  if (!existing) throw new ApiError(404, "not_found", "Variability record not found.");
  if (existing.farmId) await assertFarmAccess(existing.farmId, ctx.userId);
  await deleteVariability(id);
  await logAudit({ userId: ctx.userId, action: "variability.deleted", resource: id });
}
