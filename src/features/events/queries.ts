import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import type { Event } from "./schema";

type EventRow = typeof events.$inferSelect;

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    farmId: row.farmId,
    title: row.title,
    description: row.description ?? null,
    location: row.location ?? null,
    startDate: row.startDate.toISOString().split("T")[0],
    endDate: row.endDate ? row.endDate.toISOString().split("T")[0] : null,
    startTime: row.startTime ?? null,
    endTime: row.endTime ?? null,
    allDay: row.allDay,
    recurrenceType: row.recurrenceType,
    color: row.color ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listEvents(farmId: string, from?: Date, to?: Date): Promise<Event[]> {
  const conditions = [eq(events.farmId, farmId)];
  if (from) conditions.push(gte(events.startDate, from));
  if (to) conditions.push(lte(events.startDate, to));

  const rows = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(events.startDate);

  return rows.map(toEvent);
}

export async function getEventById(id: string, farmId: string): Promise<Event | null> {
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.farmId, farmId)));

  return row ? toEvent(row) : null;
}
