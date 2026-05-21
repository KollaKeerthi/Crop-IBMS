"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listActivities, createActivity, updateActivity, deleteActivity } from "../api";
import type { CreateActivityInput, UpdateActivityInput } from "../schema";

export const activityKey = (farmId: string) => ["activities", farmId];

export function useActivities(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? activityKey(farmId) : ["activities", null],
    queryFn: () => listActivities(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateActivity(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) => createActivity(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKey(farmId) }),
  });
}

export function useUpdateActivity(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateActivityInput }) =>
      updateActivity(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKey(farmId) }),
  });
}

export function useDeleteActivity(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActivity(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKey(farmId) }),
  });
}
