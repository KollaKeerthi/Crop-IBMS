import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listActiveTimes, getActiveTimeById } from "./queries";
import {
  createActiveTime,
  updateActiveTime,
  deleteActiveTime,
  addActivityToActiveTime,
  removeActivityFromActiveTime,
} from "./mutations";
import type {
  CreateActiveTimeInput,
  UpdateActiveTimeInput,
  AddActivityToActiveTimeInput,
  ActiveTime,
  ActiveTimeActivity,
} from "./schema";

export async function listActiveTimesHandler(
  ctx: ApiContext,
  farmId: string
): Promise<ActiveTime[]> {
  return listActiveTimes(farmId);
}

export async function getActiveTimeHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<ActiveTime> {
  const activeTime = await getActiveTimeById(id, farmId);
  if (!activeTime) throw new ApiError(404, "not_found", "Active time not found.");
  return activeTime;
}

export async function createActiveTimeHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateActiveTimeInput
): Promise<ActiveTime> {
  const activeTime = await createActiveTime(farmId, input);
  if (!activeTime) throw new ApiError(500, "internal_error", "Could not create active time.");

  log.info({ userId: ctx.userId, farmId, activeTimeId: activeTime.id }, "active_time.created");
  await logAudit({
    userId: ctx.userId,
    action: "active_time.created",
    resource: activeTime.id,
    metadata: { farmId },
  });

  return activeTime;
}

export async function updateActiveTimeHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateActiveTimeInput
): Promise<ActiveTime> {
  const existing = await getActiveTimeById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Active time not found.");

  await updateActiveTime(id, input);

  const updated = await getActiveTimeById(id, farmId);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update active time.");

  log.info({ userId: ctx.userId, activeTimeId: id }, "active_time.updated");
  await logAudit({ userId: ctx.userId, action: "active_time.updated", resource: id });

  return updated;
}

export async function deleteActiveTimeHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getActiveTimeById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Active time not found.");

  await deleteActiveTime(id);

  log.info({ userId: ctx.userId, activeTimeId: id }, "active_time.deleted");
  await logAudit({ userId: ctx.userId, action: "active_time.deleted", resource: id });
}

export async function addActivityToActiveTimeHandler(
  ctx: ApiContext,
  activeTimeId: string,
  farmId: string,
  input: AddActivityToActiveTimeInput
): Promise<ActiveTimeActivity> {
  const existing = await getActiveTimeById(activeTimeId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Active time not found.");

  const activity = await addActivityToActiveTime(activeTimeId, input);
  if (!activity) throw new ApiError(500, "internal_error", "Could not add activity.");

  log.info(
    { userId: ctx.userId, activeTimeId, activityId: activity.id },
    "active_time.activity_added"
  );

  return activity;
}

export async function removeActivityFromActiveTimeHandler(
  ctx: ApiContext,
  activeTimeId: string,
  activityId: string,
  farmId: string
): Promise<void> {
  const existing = await getActiveTimeById(activeTimeId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Active time not found.");

  await removeActivityFromActiveTime(activityId);

  log.info({ userId: ctx.userId, activeTimeId, activityId }, "active_time.activity_removed");
}
