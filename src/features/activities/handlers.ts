import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listActivities, getActivityById } from "./queries";
import { insertActivity, updateActivity, deleteActivity } from "./mutations";
import type { CreateActivityInput, UpdateActivityInput, Activity } from "./schema";
import { assertActivityCanDelete } from "@/features/crop-information/delete-guards";

export async function listActivitiesHandler(ctx: ApiContext, farmId: string): Promise<Activity[]> {
  return listActivities(farmId);
}

export async function getActivityHandler(
  ctx: ApiContext,
  activityId: string,
  farmId: string
): Promise<Activity> {
  const activity = await getActivityById(activityId, farmId);
  if (!activity) throw new ApiError(404, "not_found", "Activity not found.");
  return activity;
}

export async function createActivityHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateActivityInput
): Promise<Activity> {
  const activity = await insertActivity(farmId, input);
  if (!activity) throw new ApiError(500, "internal_error", "Could not create activity.");

  log.info({ userId: ctx.userId, farmId, activityId: activity.id }, "activities.created");
  await logAudit({
    userId: ctx.userId,
    action: "activity.created",
    resource: activity.id,
    metadata: { name: input.name, farmId },
    newValue: activity,
  });

  return activity;
}

export async function updateActivityHandler(
  ctx: ApiContext,
  activityId: string,
  farmId: string,
  input: UpdateActivityInput
): Promise<Activity> {
  const existing = await getActivityById(activityId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Activity not found.");

  const updated = await updateActivity(activityId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update activity.");

  log.info({ userId: ctx.userId, activityId }, "activities.updated");
  await logAudit({
    userId: ctx.userId,
    action: "activity.updated",
    resource: activityId,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteActivityHandler(
  ctx: ApiContext,
  activityId: string,
  farmId: string
): Promise<void> {
  const existing = await getActivityById(activityId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Activity not found.");

  await assertActivityCanDelete(activityId);
  await deleteActivity(activityId, farmId);

  log.info({ userId: ctx.userId, activityId }, "activities.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "activity.deleted",
    resource: activityId,
    previousValue: existing,
  });
}
