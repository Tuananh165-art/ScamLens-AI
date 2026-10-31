import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const localCounts = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_MINUTE = 60_000;

type LimitReason = "per_minute" | "daily_actor" | "provider_daily";
type Provider = "deepseek" | "typesafe" | "webrisk";
export type LimitResult = { allowed: boolean; retryAfterSeconds: number; backend: "upstash" | "local"; reason?: LimitReason };

export function quotaLimitMessage(result: LimitResult) {
  if (result.reason === "per_minute") {
    const seconds = Math.max(1, result.retryAfterSeconds);
    return `Bạn đã đạt giới hạn lượt trong một phút. Hãy thử lại sau khoảng ${seconds} giây.`;
  }
  if (result.reason === "provider_daily") return "ScamLens đã đạt hạn mức dịch vụ trong ngày. Hãy thử lại sau khi quota được làm mới lúc 00:00 UTC.";
  return "Bạn đã dùng hết lượt hôm nay. Hãy thử lại sau khi quota được làm mới lúc 00:00 UTC.";
}

function hashed(value: string) {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET || "scamlens-local-development-only";
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}

export async function takeQuota(input: { ip: string; userId?: string; provider: Provider }): Promise<LimitResult> {
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
      if (!minute.success) return { allowed: false, retryAfterSeconds: Math.ceil(Math.max(0, minute.reset - Date.now()) / 1000), backend, reason: "per_minute" };
      const now = Date.now();
      const dayBucket = new Date(now).toISOString().slice(0, 10);
      const dayResetSeconds = secondsUntilUtcReset(now);
      const userKey = `scamlens:daily:${dayBucket}:${hashed(actor)}`;
      const providerKey = `scamlens:provider:${dayBucket}:${input.provider}`;
      const dailyCount = await redis.incr(userKey);
      if (dailyCount === 1) await redis.expire(userKey, dayResetSeconds);
      if (dailyCount > dailyLimit) return { allowed: false, retryAfterSeconds: dayResetSeconds, backend, reason: "daily_actor" };
      const providerCount = await redis.incr(providerKey);
      if (providerCount === 1) await redis.expire(providerKey, dayResetSeconds);
      const providerCap = providerDailyCap(input.provider);
      if (providerCount > providerCap) return { allowed: false, retryAfterSeconds: dayResetSeconds, backend, reason: "provider_daily" };
      return { allowed: true, retryAfterSeconds: 0, backend };
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
  if (!minute.allowed) return { ...minute, backend, reason: "per_minute" };
  const dayBucket = new Date(now).toISOString().slice(0, 10);
  const dayResetMilliseconds = secondsUntilUtcReset(now) * 1000;
  const daily = hitLocal(`daily:${dayBucket}:${actor}`, now, dayResetMilliseconds, dailyLimit);
  if (!daily.allowed) return { ...daily, retryAfterSeconds: Math.ceil(dayResetMilliseconds / 1000), backend, reason: "daily_actor" };
  const provider = hitLocal(`provider:${dayBucket}:${input.provider}`, now, dayResetMilliseconds,
    providerDailyCap(input.provider));
  if (!provider.allowed) return { ...provider, retryAfterSeconds: Math.ceil(dayResetMilliseconds / 1000), backend, reason: "provider_daily" };
  return { ...provider, backend };
}

// The main DeepSeek request already consumes the actor and per-minute quota.
// This secondary cap protects the optional JEV provider without charging the
// actor quota a second time for one user action.
export async function takeAdditionalProviderQuota(provider: Provider): Promise<LimitResult> {
  const now = Date.now();
  const dayBucket = new Date(now).toISOString().slice(0, 10);
  const dayResetSeconds = secondsUntilUtcReset(now);
  const cap = providerDailyCap(provider);
  const backend: "upstash" | "local" = redisConfigured() ? "upstash" : "local";
  if (process.env.NODE_ENV === "production" && backend === "local") throw new Error("quota_unavailable");
  if (backend === "upstash") {
    try {
      const redis = Redis.fromEnv();
      const providerKey = `scamlens:provider:${dayBucket}:${provider}`;
      const count = await redis.incr(providerKey);
      if (count === 1) await redis.expire(providerKey, dayResetSeconds);
      return count > cap
        ? { allowed: false, retryAfterSeconds: dayResetSeconds, backend, reason: "provider_daily" }
        : { allowed: true, retryAfterSeconds: 0, backend };
    } catch {
      throw new Error("quota_unavailable");
    }
  }
  const result = hitLocal(`provider:${dayBucket}:${provider}`, now, dayResetSeconds * 1000, cap);
  return result.allowed
    ? { ...result, backend }
    : { ...result, backend, reason: "provider_daily", retryAfterSeconds: dayResetSeconds };
}

function providerDailyCap(provider: Provider) {
  const capName = provider === "typesafe" ? "RATE_LIMIT_TYPESAFE_DAILY" : provider === "webrisk" ? "RATE_LIMIT_WEBRISK_DAILY" : "RATE_LIMIT_DEEPSEEK_DAILY";
  return numberEnv(capName, 30);
}

function secondsUntilUtcReset(now: number) {
  const date = new Date(now);
  const nextUtcDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return Math.max(1, Math.ceil((nextUtcDay - now) / 1000));
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
