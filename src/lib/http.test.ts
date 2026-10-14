import { afterEach, describe, expect, it, vi } from "vitest";
import { mutationOriginAllowed } from "./http";

afterEach(() => vi.unstubAllEnvs());

describe("mutation origin protection", () => {
  const target = "https://preview-scam.vercel.app/auth/logout";
  it("accepts same-origin requests on an alias even with a stale canonical URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(mutationOriginAllowed(new Request(target, { headers: { origin: "https://preview-scam.vercel.app" } }))).toBe(true);
  });
  it.each([null, "null", "https://evil.test", "https://preview-scam.vercel.app.evil.test", "http://preview-scam.vercel.app", "https://preview-scam.vercel.app:444", "https://preview-scam.vercel.app/path", "https://user@preview-scam.vercel.app"])("rejects an unrelated or malformed origin: %s", (origin) => {
    expect(mutationOriginAllowed(new Request(target, { headers: origin ? { origin } : {} }))).toBe(false);
  });
});
