"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listActiveTimes,
  createActiveTime,
  updateActiveTime,
  deleteActiveTime,
  addActivityToActiveTime,
  removeActivityFromActiveTime,
} from "../api";
import type {
  CreateActiveTimeInput,
  UpdateActiveTimeInput,
  AddActivityToActiveTimeInput,
} from "../schema";

export const activeTimeKey = (farmId: string) => ["active-times", farmId];

export function useActiveTimes(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? activeTimeKey(farmId) : ["active-times", null],
    queryFn: () => listActiveTimes(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateActiveTime(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActiveTimeInput) => createActiveTime(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: activeTimeKey(farmId) }),
  });
}

export function useUpdateActiveTime(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateActiveTimeInput }) =>
      updateActiveTime(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: activeTimeKey(farmId) }),
  });
}

export function useDeleteActiveTime(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActiveTime(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: activeTimeKey(farmId) }),
  });
}

export function useAddActivityToActiveTime(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activeTimeId,
      input,
    }: {
      activeTimeId: string;
      input: AddActivityToActiveTimeInput;
    }) => addActivityToActiveTime(farmId, activeTimeId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: activeTimeKey(farmId) }),
  });
}

export function useRemoveActivityFromActiveTime(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activeTimeId, activityId }: { activeTimeId: string; activityId: string }) =>
      removeActivityFromActiveTime(farmId, activeTimeId, activityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: activeTimeKey(farmId) }),
  });
}
