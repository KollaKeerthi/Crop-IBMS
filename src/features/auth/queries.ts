import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens, passwordResetTokens } from "@/db/schema";

export async function getUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getVerificationToken(token: string) {
  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function getEmailForVerificationToken(token: string): Promise<string | null> {
  const rows = await db
    .select({ email: users.email })
    .from(emailVerificationTokens)
    .innerJoin(users, eq(users.id, emailVerificationTokens.userId))
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);
  return rows[0]?.email ?? null;
}

export async function getPasswordResetToken(token: string) {
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return rows[0] ?? null;
}
