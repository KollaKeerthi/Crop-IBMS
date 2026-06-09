"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReservation, deleteReservation, listReservations, updateReservation } from "../api";
import type { CreateReservationInput, UpdateReservationInput } from "../schema";

export const reservationKey = (farmId: string, year?: number) =>
  year ? ["reservations", farmId, year] : ["reservations", farmId];

export function useReservations(farmId: string | null, year?: number) {
  return useQuery({
    queryKey: farmId ? reservationKey(farmId, year) : ["reservations", null],
    queryFn: () => listReservations(farmId!, year),
    enabled: !!farmId,
  });
}

export function useCreateReservation(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations", farmId] }),
  });
}

export function useUpdateReservation(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) =>
      updateReservation(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations", farmId] }),
  });
}

export function useDeleteReservation(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReservation(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations", farmId] }),
  });
}
