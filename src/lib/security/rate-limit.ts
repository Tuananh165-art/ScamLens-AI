import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const localCounts = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_MINUTE = 60_000;
const WINDOW_DAY = 86_400_000;

type LimitResult = { allowed: boolean; retryAfterSeconds: number; backend: "upstash" | "local" };

function hashed(value: string) {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET || "scamlens-local-development-only";
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}

export async function takeQuota(input: { ip: string; userId?: string; provider: "gemini" }): Promise<LimitResult> {
  const minuteLimit = numberEnv("RATE_LIMIT_PER_MINUTE", 3);
  const dailyLimit = input.userId ? numberEnv("RATE_LIMIT_USER_DAILY", 20) : numberEnv("RATE_LIMIT_GUEST_DAILY", 5);
  const actor = input.userId ? `user:${input.userId}` : `guest:${input.ip}`;
  const backend: "upstash" | "local" = redisConfigured() ? "upstash" : "local";
  if (process.env.NODE_ENV === "production" && backend === "local") throw new Error("quota_unavailable");
  if (process.env.NODE_ENV === "production" && !process.env.RATE_LIMIT_HMAC_SECRET?.trim()) throw new Error("quota_unavailable");

  if (backend === "upstash") {
    try {
      const redis = Redis.fromEnv();
      const perMinute = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(minuteLimit, "1 m"), prefix: "scamlens:minute" });
      const minute = await perMinute.limit(hashed(actor));
      if (!minute.success) return { allowed: false, retryAfterSeconds: Math.ceil(Math.max(0, minute.reset - Date.now()) / 1000), backend };
      const dayBucket = new Date().toISOString().slice(0, 10);
      const userKey = `scamlens:daily:${dayBucket}:${hashed(actor)}`;
      const providerKey = `scamlens:provider:${dayBucket}:${input.provider}`;
      const dailyCount = await redis.incr(userKey);
      if (dailyCount === 1) await redis.expire(userKey, 90_000);
      if (dailyCount > dailyLimit) return { allowed: false, retryAfterSeconds: 86_400, backend };
      const providerCount = await redis.incr(providerKey);
      if (providerCount === 1) await redis.expire(providerKey, 90_000);
      const providerCap = numberEnv("RATE_LIMIT_GEMINI_DAILY", 30);
      return { allowed: dailyCount <= dailyLimit && providerCount <= providerCap, retryAfterSeconds: 86_400, backend };
    } catch {
      throw new Error("quota_unavailable");
    }
  }

  const now = Date.now();
  if (localCounts.size > 2_000) {
    for (const [key, entry] of localCounts) if (entry.expiresAt <= now) localCounts.delete(key);
    if (localCounts.size > 5_000) {
      const excess = localCounts.size - 5_000;
      let removed = 0;
      for (const key of localCounts.keys()) { localCounts.delete(key); if (++removed >= excess) break; }
    }
  }
  const minute = hitLocal(`minute:${actor}`, now, WINDOW_MINUTE, minuteLimit);
  if (!minute.allowed) return { ...minute, backend };
  const daily = hitLocal(`daily:${new Date().toISOString().slice(0, 10)}:${actor}`, now, WINDOW_DAY, dailyLimit);
  if (!daily.allowed) return { ...daily, backend };
  const provider = hitLocal(`provider:${new Date().toISOString().slice(0, 10)}:${input.provider}`, now, WINDOW_DAY,
    numberEnv("RATE_LIMIT_GEMINI_DAILY", 30));
  return { ...provider, backend };
}

function hitLocal(key: string, now: number, duration: number, maximum: number) {
  const entry = localCounts.get(key);
  if (!entry || entry.expiresAt <= now) {
    localCounts.set(key, { count: 1, expiresAt: now + duration });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  entry.count += 1;
  return { allowed: entry.count <= maximum, retryAfterSeconds: Math.ceil((entry.expiresAt - now) / 1000) };
}

function redisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
