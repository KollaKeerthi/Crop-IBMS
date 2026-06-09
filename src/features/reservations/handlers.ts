import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import { log } from "@/lib/log";
import { getReservationById, listReservations, listUnallocatedReservations } from "./queries";
import { deleteReservation, insertReservation, updateReservation } from "./mutations";
import type { CreateReservationInput, Reservation, UpdateReservationInput } from "./schema";

export async function listReservationsHandler(
  ctx: ApiContext,
  farmId: string,
  year?: number
): Promise<Reservation[]> {
  return listReservations(farmId, year);
}

export async function listUnallocatedReservationsHandler(
  ctx: ApiContext,
  farmId: string
): Promise<Reservation[]> {
  return listUnallocatedReservations(farmId);
}

export async function getReservationHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<Reservation> {
  const reservation = await getReservationById(id, farmId);
  if (!reservation) throw new ApiError(404, "not_found", "Reservation not found.");
  return reservation;
}

export async function createReservationHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateReservationInput
): Promise<Reservation> {
  const reservation = await insertReservation(farmId, input);
  if (!reservation) throw new ApiError(500, "internal_error", "Could not create reservation.");

  log.info({ userId: ctx.userId, farmId, reservationId: reservation.id }, "reservation.created");
  await logAudit({
    userId: ctx.userId,
    action: "reservation.created",
    resource: reservation.id,
    metadata: { farmId },
    newValue: reservation,
  });

  return reservation;
}

export async function updateReservationHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateReservationInput
): Promise<Reservation> {
  const existing = await getReservationById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Reservation not found.");

  const updated = await updateReservation(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update reservation.");

  log.info({ userId: ctx.userId, reservationId: id }, "reservation.updated");
  await logAudit({
    userId: ctx.userId,
    action: "reservation.updated",
    resource: id,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteReservationHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getReservationById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Reservation not found.");

  await deleteReservation(id, farmId);

  log.info({ userId: ctx.userId, reservationId: id }, "reservation.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "reservation.deleted",
    resource: id,
    previousValue: existing,
  });
}
