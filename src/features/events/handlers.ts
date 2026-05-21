import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listEvents, getEventById } from "./queries";
import { insertEvent, updateEvent, deleteEvent } from "./mutations";
import type { CreateEventInput, UpdateEventInput, Event } from "./schema";

export async function listEventsHandler(
  ctx: ApiContext,
  farmId: string,
  from?: Date,
  to?: Date
): Promise<Event[]> {
  return listEvents(farmId, from, to);
}

export async function getEventHandler(ctx: ApiContext, id: string, farmId: string): Promise<Event> {
  const event = await getEventById(id, farmId);
  if (!event) throw new ApiError(404, "not_found", "Event not found.");
  return event;
}

export async function createEventHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateEventInput
): Promise<Event> {
  const event = await insertEvent(farmId, input);
  if (!event) throw new ApiError(500, "internal_error", "Could not create event.");

  log.info({ userId: ctx.userId, farmId, eventId: event.id }, "events.created");
  await logAudit({
    userId: ctx.userId,
    action: "event.created",
    resource: event.id,
    metadata: { title: input.title, farmId },
  });

  return event;
}

export async function updateEventHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateEventInput
): Promise<Event> {
  const existing = await getEventById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Event not found.");

  const updated = await updateEvent(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update event.");

  log.info({ userId: ctx.userId, eventId: id }, "events.updated");
  await logAudit({ userId: ctx.userId, action: "event.updated", resource: id });

  return updated;
}

export async function deleteEventHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getEventById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Event not found.");

  await deleteEvent(id, farmId);

  log.info({ userId: ctx.userId, eventId: id }, "events.deleted");
  await logAudit({ userId: ctx.userId, action: "event.deleted", resource: id });
}
