import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redis: { incr: vi.fn(), expire: vi.fn() },
  minuteLimit: vi.fn(),
}));

vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => mocks.redis } }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => ({}));
    async limit(key: string) { return mocks.minuteLimit(key); }
  },
}));

import { quotaLimitMessage, takeAdditionalProviderQuota, takeQuota } from "./rate-limit";

describe("DeepSeek quota limits", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "test-secret");
    vi.stubEnv("RATE_LIMIT_GUEST_DAILY", "5");
    vi.stubEnv("RATE_LIMIT_DEEPSEEK_DAILY", "30");
    vi.stubEnv("RATE_LIMIT_TYPESAFE_DAILY", "3");
    mocks.redis.incr.mockReset();
    mocks.redis.expire.mockReset().mockResolvedValue(1);
    mocks.minuteLimit.mockReset().mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("expires daily Upstash counters at the next UTC midnight", async () => {
    mocks.redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const result = await takeQuota({ ip: "203.0.113.8", provider: "deepseek" });

    expect(result.allowed).toBe(true);
    expect(mocks.redis.expire).toHaveBeenNthCalledWith(1, expect.stringContaining("scamlens:daily:2026-10-15:"), 43_200);
    expect(mocks.redis.expire).toHaveBeenNthCalledWith(2, "scamlens:provider:2026-10-15:deepseek", 43_200);
  });

  it("identifies the per-minute limit and reports its retry delay", async () => {
    mocks.minuteLimit.mockResolvedValue({ success: false, reset: Date.now() + 18_000 });

    const result = await takeQuota({ ip: "203.0.113.8", provider: "deepseek" });

    expect(result).toMatchObject({ allowed: false, reason: "per_minute", retryAfterSeconds: 18 });
    expect(quotaLimitMessage(result)).toContain("18 giây");
    expect(mocks.redis.incr).not.toHaveBeenCalled();
  });

  it("identifies the account daily limit separately from the provider cap", async () => {
    mocks.redis.incr.mockResolvedValueOnce(6);

    const result = await takeQuota({ ip: "203.0.113.8", provider: "deepseek" });

    expect(result).toMatchObject({ allowed: false, reason: "daily_actor", retryAfterSeconds: 43_200 });
    expect(quotaLimitMessage(result)).toContain("quota được làm mới lúc 00:00 UTC");
    expect(mocks.redis.incr).toHaveBeenCalledOnce();
  });

  it("identifies the app-wide provider daily cap", async () => {
    mocks.redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(31);

    const result = await takeQuota({ ip: "203.0.113.8", provider: "deepseek" });

    expect(result).toMatchObject({ allowed: false, reason: "provider_daily", retryAfterSeconds: 43_200 });
    expect(quotaLimitMessage(result)).toContain("hạn mức AI trong ngày");
  });

  it("applies an independent JEV daily provider cap without incrementing the user quota again", async () => {
    mocks.redis.incr.mockResolvedValueOnce(4);

    const result = await takeAdditionalProviderQuota("typesafe");

    expect(result).toMatchObject({ allowed: false, reason: "provider_daily", retryAfterSeconds: 43_200 });
    expect(mocks.redis.incr).toHaveBeenCalledOnce();
    expect(mocks.redis.incr).toHaveBeenCalledWith("scamlens:provider:2026-10-15:typesafe");
  });
});
