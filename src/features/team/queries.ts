import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { farmMemberships, users } from "@/db/schema";
import type { Member } from "./schema";

function toMember(row: {
  userId: string;
  name: string | null;
  email: string;
  role: "OWNER" | "MANAGER" | "WORKER";
  joinedAt: Date;
}): Member {
  return {
    userId: row.userId,
    name: row.name,
    email: row.email,
    role: row.role,
    joinedAt: row.joinedAt.toISOString(),
  };
}

export async function listFarmMembers(farmId: string): Promise<Member[]> {
  const rows = await db
    .select({
      userId: farmMemberships.userId,
      name: users.name,
      email: users.email,
      role: farmMemberships.role,
      joinedAt: farmMemberships.createdAt,
    })
    .from(farmMemberships)
    .innerJoin(users, eq(farmMemberships.userId, users.id))
    .where(eq(farmMemberships.farmId, farmId))
    .orderBy(users.name);
  return rows.map(toMember);
}

export async function getFarmMember(farmId: string, userId: string): Promise<Member | null> {
  const rows = await db
    .select({
      userId: farmMemberships.userId,
      name: users.name,
      email: users.email,
      role: farmMemberships.role,
      joinedAt: farmMemberships.createdAt,
    })
    .from(farmMemberships)
    .innerJoin(users, eq(farmMemberships.userId, users.id))
    .where(and(eq(farmMemberships.farmId, farmId), eq(farmMemberships.userId, userId)));
  const row = rows[0];
  return row ? toMember(row) : null;
}

export async function getMemberByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}
