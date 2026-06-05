import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { farmMemberships, users } from "@/db/schema";
import type { MemberRole } from "./schema";

export async function addFarmMember(
  farmId: string,
  userId: string,
  role: MemberRole
): Promise<void> {
  await db.insert(farmMemberships).values({ farmId, userId, role });
}

export async function updateMemberRole(
  farmId: string,
  userId: string,
  role: MemberRole
): Promise<void> {
  await db
    .update(farmMemberships)
    .set({ role })
    .where(and(eq(farmMemberships.farmId, farmId), eq(farmMemberships.userId, userId)));
}

export async function removeFarmMember(farmId: string, userId: string): Promise<void> {
  await db
    .delete(farmMemberships)
    .where(and(eq(farmMemberships.farmId, farmId), eq(farmMemberships.userId, userId)));
}

export async function createMemberUser(
  name: string,
  email: string,
  passwordHash: string
): Promise<{ id: string }> {
  const [row] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
    })
    .returning({ id: users.id });
  return row!;
}
