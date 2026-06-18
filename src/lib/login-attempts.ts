import { getRedis } from "./redis";

// Per-account failed-login throttle. Complements the per-IP login limiter: an
// attacker rotating IPs can't keep guessing one account's password indefinitely.
// Keyed by normalized email. All operations fail open — a Redis outage must never
// lock legitimate users out, it only relaxes this extra layer.

const MAX_FAILURES = 10; // failures within the window before the account locks
const WINDOW_SECONDS = 15 * 60; // 15 minutes

const key = (email: string) => `login-fail:${normalizeEmail(email)}`;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export type LockState = { locked: boolean; retryAfter: number };

export async function getLoginLock(email: string): Promise<LockState> {
  try {
    const count = await getRedis().get<number>(key(email));
    if (count !== null && Number(count) >= MAX_FAILURES) {
      const ttl = await getRedis().ttl(key(email));
      return { locked: true, retryAfter: ttl > 0 ? ttl : WINDOW_SECONDS };
    }
  } catch {
    // fail open
  }
  return { locked: false, retryAfter: 0 };
}

export async function recordFailedLogin(email: string): Promise<void> {
  try {
    const redis = getRedis();
    const count = await redis.incr(key(email));
    // Start the expiry window on the first failure so the counter self-clears.
    if (count === 1) await redis.expire(key(email), WINDOW_SECONDS);
  } catch {
    // fail open
  }
}

export async function clearLoginAttempts(email: string): Promise<void> {
  try {
    await getRedis().del(key(email));
  } catch {
    // fail open
  }
}
