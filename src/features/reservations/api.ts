import { apiFetch } from "@/lib/api/client";
import {
  ReservationSchema,
  ReservationsResponseSchema,
  type CreateReservationInput,
  type Reservation,
  type UpdateReservationInput,
} from "./schema";

export function listReservations(farmId: string, year?: number): Promise<Reservation[]> {
  const params = new URLSearchParams({ farmId });
  if (year) params.set("year", String(year));
  return apiFetch(`/api/v1/reservations?${params}`, {
    responseSchema: ReservationsResponseSchema,
  });
}

export function createReservation(
  farmId: string,
  input: CreateReservationInput
): Promise<Reservation> {
  return apiFetch(`/api/v1/reservations?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: ReservationSchema,
  });
}

export function updateReservation(
  farmId: string,
  id: string,
  input: UpdateReservationInput
): Promise<Reservation> {
  return apiFetch(`/api/v1/reservations/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: ReservationSchema,
  });
}

export function deleteReservation(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/reservations/${id}?farmId=${farmId}`, { method: "DELETE" });
}
