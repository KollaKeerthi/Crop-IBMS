import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

export function createRateLimiter(config: { windowMs: number; max: number }) {
  let limiter: Ratelimit | null = null;
  function getLimiter(): Ratelimit {
    if (!limiter) {
      limiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(config.max, `${config.windowMs} ms`),
        prefix: `rl:${config.windowMs}:${config.max}`,
      });
    }
    return limiter;
  }

  return async function check(ip: string): Promise<RateLimitResult> {
    const { success, reset } = await getLimiter().limit(ip);
    if (!success) {
      return { allowed: false, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
    }
    return { allowed: true };
  };
}
