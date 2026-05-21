import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import type { CreateEventInput, UpdateEventInput, Event } from "./schema";
import { getEventById } from "./queries";

export async function insertEvent(farmId: string, input: CreateEventInput): Promise<Event | null> {
  const [row] = await db
    .insert(events)
    .values({
      farmId,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      allDay: input.allDay ?? true,
      recurrenceType: input.recurrenceType ?? "none",
      color: input.color ?? null,
    })
    .returning();

  if (!row) return null;
  return getEventById(row.id, farmId);
}

export async function updateEvent(
  id: string,
  farmId: string,
  input: UpdateEventInput
): Promise<Event | null> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
  if (input.endDate !== undefined)
    updateData.endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.startTime !== undefined) updateData.startTime = input.startTime;
  if (input.endTime !== undefined) updateData.endTime = input.endTime;
  if (input.allDay !== undefined) updateData.allDay = input.allDay;
  if (input.recurrenceType !== undefined) updateData.recurrenceType = input.recurrenceType;
  if (input.color !== undefined) updateData.color = input.color;

  await db
    .update(events)
    .set(updateData)
    .where(and(eq(events.id, id), eq(events.farmId, farmId)));

  return getEventById(id, farmId);
}

export async function deleteEvent(id: string, farmId: string): Promise<void> {
  await db.delete(events).where(and(eq(events.id, id), eq(events.farmId, farmId)));
}
