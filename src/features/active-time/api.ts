import { apiFetch } from "@/lib/api/client";
import {
  ActiveTimeSchema,
  ActiveTimesResponseSchema,
  ActiveTimeActivitySchema,
  type CreateActiveTimeInput,
  type UpdateActiveTimeInput,
  type AddActivityToActiveTimeInput,
  type ActiveTime,
  type ActiveTimeActivity,
} from "./schema";

export function listActiveTimes(farmId: string): Promise<ActiveTime[]> {
  return apiFetch(`/api/v1/active-time?farmId=${farmId}`, {
    responseSchema: ActiveTimesResponseSchema,
  });
}

export function getActiveTime(id: string, farmId: string): Promise<ActiveTime> {
  return apiFetch(`/api/v1/active-time/${id}?farmId=${farmId}`, {
    responseSchema: ActiveTimeSchema,
  });
}

export function createActiveTime(
  farmId: string,
  input: CreateActiveTimeInput
): Promise<ActiveTime> {
  return apiFetch(`/api/v1/active-time`, {
    method: "POST",
    body: { farmId, ...input },
    responseSchema: ActiveTimeSchema,
  });
}

export function updateActiveTime(
  farmId: string,
  id: string,
  input: UpdateActiveTimeInput
): Promise<ActiveTime> {
  return apiFetch(`/api/v1/active-time/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: ActiveTimeSchema,
  });
}

export function deleteActiveTime(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/active-time/${id}?farmId=${farmId}`, { method: "DELETE" });
}

export function addActivityToActiveTime(
  farmId: string,
  activeTimeId: string,
  input: AddActivityToActiveTimeInput
): Promise<ActiveTimeActivity> {
  return apiFetch(`/api/v1/active-time/${activeTimeId}/activities?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: ActiveTimeActivitySchema,
  });
}

export function removeActivityFromActiveTime(
  farmId: string,
  activeTimeId: string,
  activityId: string
): Promise<void> {
  return apiFetch(
    `/api/v1/active-time/${activeTimeId}/activities/${activityId}?farmId=${farmId}`,
    { method: "DELETE" }
  );
}
