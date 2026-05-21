"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEvents, createEvent, updateEvent, deleteEvent } from "../api";
import type { CreateEventInput, UpdateEventInput } from "../schema";

export const eventKey = (farmId: string, from?: Date, to?: Date) =>
  ["events", farmId, from?.toISOString(), to?.toISOString()] as const;

export function useEvents(farmId: string | null, from?: Date, to?: Date) {
  return useQuery({
    queryKey: farmId ? eventKey(farmId, from, to) : ["events", null],
    queryFn: () => listEvents(farmId!, from, to),
    enabled: !!farmId,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["events", variables.farmId] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      farmId,
      id,
      input,
    }: {
      farmId: string;
      id: string;
      input: UpdateEventInput;
    }) => updateEvent(farmId, id, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["events", variables.farmId] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, id }: { farmId: string; id: string }) =>
      deleteEvent(farmId, id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["events", variables.farmId] });
    },
  });
}
