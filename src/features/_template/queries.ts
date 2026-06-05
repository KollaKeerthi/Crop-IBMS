import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { things } from "@/db/schema";
import type { Thing } from "./schema";

type ThingRow = typeof things.$inferSelect;

function toThing(row: ThingRow): Thing {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listUserThings(userId: string): Promise<Thing[]> {
  const rows = await db.query.things.findMany({
    where: eq(things.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return rows.map(toThing);
}

export async function findUserThing(userId: string, id: string): Promise<Thing | null> {
  const row = await db.query.things.findFirst({
    where: and(eq(things.id, id), eq(things.userId, userId)),
  });
  return row ? toThing(row) : null;
}
