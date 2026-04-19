import Redis from "ioredis";
import logger from "../utils/logger";

let redisClient: Redis;

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error("Redis not connected. Call connectRedis() first.");
  }
  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on("connect", () => logger.info("✅ Redis connected"));
  redisClient.on("error", (err) => logger.error("Redis error:", err));
  redisClient.on("reconnecting", () => logger.warn("Redis reconnecting..."));

  await redisClient.connect();
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}
