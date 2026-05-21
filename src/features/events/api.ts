import { apiFetch } from "@/lib/api/client";
import {
  EventSchema,
  EventsResponseSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type Event,
} from "./schema";

export function listEvents(farmId: string, from?: Date, to?: Date): Promise<Event[]> {
  const params = new URLSearchParams({ farmId });
  if (from) params.set("from", from.toISOString().split("T")[0]!);
  if (to) params.set("to", to.toISOString().split("T")[0]!);
  return apiFetch(`/api/v1/events?${params.toString()}`, {
    responseSchema: EventsResponseSchema,
  });
}

export function getEvent(farmId: string, id: string): Promise<Event> {
  return apiFetch(`/api/v1/events/${id}?farmId=${farmId}`, {
    responseSchema: EventSchema,
  });
}

export function createEvent(input: CreateEventInput): Promise<Event> {
  return apiFetch(`/api/v1/events?farmId=${input.farmId}`, {
    method: "POST",
    body: input,
    responseSchema: EventSchema,
  });
}

export function updateEvent(farmId: string, id: string, input: UpdateEventInput): Promise<Event> {
  return apiFetch(`/api/v1/events/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: EventSchema,
  });
}

export function deleteEvent(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/events/${id}?farmId=${farmId}`, { method: "DELETE" });
}
