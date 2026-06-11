import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listStakeholders, getStakeholderById } from "./queries";
import { insertStakeholder, updateStakeholder, deleteStakeholder } from "./mutations";
import type { CreateStakeholderInput, UpdateStakeholderInput, Stakeholder } from "./schema";

export async function listStakeholdersHandler(
  ctx: ApiContext,
  farmId: string
): Promise<Stakeholder[]> {
  return listStakeholders(farmId);
}

export async function getStakeholderHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<Stakeholder> {
  const stakeholder = await getStakeholderById(id, farmId);
  if (!stakeholder) throw new ApiError(404, "not_found", "Stakeholder not found.");
  return stakeholder;
}

export async function createStakeholderHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateStakeholderInput
): Promise<Stakeholder> {
  const stakeholder = await insertStakeholder(farmId, input);
  if (!stakeholder) throw new ApiError(500, "internal_error", "Could not create stakeholder.");

  log.info(
    { userId: ctx.userId, farmId, stakeholderId: stakeholder.id },
    "stakeholder_master.created"
  );
  await logAudit({
    userId: ctx.userId,
    action: "stakeholder_master.created",
    resource: stakeholder.id,
    metadata: { farmId },
    newValue: stakeholder,
  });

  return stakeholder;
}

export async function updateStakeholderHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateStakeholderInput
): Promise<Stakeholder> {
  const existing = await getStakeholderById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Stakeholder not found.");

  const updated = await updateStakeholder(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update stakeholder.");

  log.info({ userId: ctx.userId, stakeholderId: id }, "stakeholder_master.updated");
  await logAudit({
    userId: ctx.userId,
    action: "stakeholder_master.updated",
    resource: id,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteStakeholderHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getStakeholderById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Stakeholder not found.");

  await deleteStakeholder(id, farmId);

  log.info({ userId: ctx.userId, stakeholderId: id }, "stakeholder_master.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "stakeholder_master.deleted",
    resource: id,
    previousValue: existing,
  });
}
