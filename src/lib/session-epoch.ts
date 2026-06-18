import { getRedis } from "./redis";

// Per-user "password epoch" used to invalidate existing JWT sessions when a
// password changes. We store the change timestamp (ms) in Redis because the
// NextAuth jwt callback runs on every middleware request on the edge runtime,
// where a Postgres read is not possible — but an Upstash REST read is.
//
// A JWT carries the epoch it was issued under (`pwdAt`). If the stored epoch is
// newer, the token predates the password change and is rejected. The key is set
// without expiry so the signal is durable. Reads/writes fail open: a Redis
// outage must not log every user out, it only delays invalidation.

const key = (userId: string) => `pwd-epoch:${userId}`;

export async function getPasswordEpoch(userId: string): Promise<number | null> {
  try {
    const value = await getRedis().get<number | string>(key(userId));
    if (value === null || value === undefined) return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function bumpPasswordEpoch(userId: string, epochMs: number): Promise<void> {
  try {
    await getRedis().set(key(userId), epochMs);
  } catch {
    // Best effort: the DB `passwordChangedAt` remains the source of truth.
  }
}
