import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens, passwordResetTokens } from "@/db/schema";
import { bumpPasswordEpoch } from "@/lib/session-epoch";

export async function createUser(data: { name: string; email: string; passwordHash: string }) {
  const rows = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
    })
    .returning();
  return rows[0]!;
}

export async function markEmailVerified(userId: string) {
  const rows = await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return rows[0] ?? null;
}

export async function createVerificationToken(data: {
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  const rows = await db.insert(emailVerificationTokens).values(data).returning();
  return rows[0]!;
}

export async function deleteVerificationToken(token: string) {
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
}

export async function deleteVerificationTokensByUserId(userId: string) {
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
}

export async function createPasswordResetToken(data: {
  userId: string;
  token: string;
  expiresAt: Date;
}) {
  const rows = await db.insert(passwordResetTokens).values(data).returning();
  return rows[0]!;
}

export async function deletePasswordResetToken(token: string) {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
}

export async function deletePasswordResetTokensByUserId(userId: string) {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const changedAt = new Date();
  const rows = await db
    .update(users)
    .set({ passwordHash, passwordChangedAt: changedAt })
    .where(eq(users.id, userId))
    .returning();
  // Invalidate every JWT issued before this change (see lib/session-epoch).
  await bumpPasswordEpoch(userId, changedAt.getTime());
  return rows[0] ?? null;
}
