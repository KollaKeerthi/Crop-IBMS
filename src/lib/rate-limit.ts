import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

export function createRateLimiter(config: { windowMs: number; max: number }) {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, `${config.windowMs} ms`),
    prefix: `rl:${config.windowMs}:${config.max}`,
  });

  return async function check(ip: string): Promise<RateLimitResult> {
    const { success, reset } = await limiter.limit(ip);
    if (!success) {
      return { allowed: false, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
    }
    return { allowed: true };
  };
}
