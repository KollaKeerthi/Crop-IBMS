import { apiFetch } from "@/lib/api/client";
import {
  ActivitySchema,
  ActivitiesResponseSchema,
  type CreateActivityInput,
  type UpdateActivityInput,
  type Activity,
} from "./schema";

export function listActivities(farmId: string): Promise<Activity[]> {
  return apiFetch(`/api/v1/activities?farmId=${farmId}`, {
    responseSchema: ActivitiesResponseSchema,
  });
}

export function createActivity(farmId: string, input: CreateActivityInput): Promise<Activity> {
  return apiFetch(`/api/v1/activities?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: ActivitySchema,
  });
}

export function updateActivity(
  farmId: string,
  id: string,
  input: UpdateActivityInput
): Promise<Activity> {
  return apiFetch(`/api/v1/activities/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: ActivitySchema,
  });
}

export function deleteActivity(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/activities/${id}?farmId=${farmId}`, { method: "DELETE" });
}
