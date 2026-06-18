import { Redis } from "@upstash/redis";

// Single lazily-initialized Upstash client. Uses the REST API, so it is safe to
// call from the edge runtime (middleware, NextAuth jwt callback) as well as Node.
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}
