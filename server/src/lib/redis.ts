import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let redisConfigured = false;

export function initRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redis = null;
    redisConfigured = false;
    return null;
  }
  redis = new Redis({ url, token });
  redisConfigured = true;
  return redis;
}

export function getRedis(): Redis | null {
  return redis;
}

export function isRedisConfigured(): boolean {
  return redisConfigured;
}

export async function pingRedis(): Promise<"connected" | "unavailable" | "not_configured"> {
  if (!redisConfigured || !redis) return "not_configured";
  try {
    const pong = await redis.ping();
    return pong === "PONG" || pong === "pong" ? "connected" : "unavailable";
  } catch {
    return "unavailable";
  }
}

/** Distributed lock via SET NX EX. Falls back to local Map when Redis is absent. */
const localLocks = new Map<string, number>();

export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  if (redis) {
    const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
    return result === "OK";
  }
  const now = Date.now();
  const expires = localLocks.get(key);
  if (expires && expires > now) return false;
  localLocks.set(key, now + ttlSeconds * 1000);
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  localLocks.delete(key);
}
