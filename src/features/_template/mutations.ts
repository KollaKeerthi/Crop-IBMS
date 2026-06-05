import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { things } from "@/db/schema";
import type { CreateThingInput, UpdateThingInput, Thing } from "./schema";
import { findUserThing } from "./queries";

export async function insertThing(userId: string, input: CreateThingInput): Promise<Thing | null> {
  const [row] = await db
    .insert(things)
    .values({
      userId,
      name: input.name,
      description: input.description ?? null,
    })
    .returning();
  if (!row) return null;
  return findUserThing(userId, row.id);
}

export async function updateThing(
  userId: string,
  id: string,
  fields: UpdateThingInput
): Promise<Thing | null> {
  await db
    .update(things)
    .set({ ...fields, updatedAt: new Date() })
    .where(and(eq(things.id, id), eq(things.userId, userId)));
  return findUserThing(userId, id);
}

export async function deleteThing(userId: string, id: string): Promise<void> {
  await db.delete(things).where(and(eq(things.id, id), eq(things.userId, userId)));
}
