import { afterEach, describe, expect, it, vi } from "vitest";
import { takeQuota } from "@/lib/security/rate-limit";
import { POST } from "./route";

vi.mock("@/lib/security/rate-limit", () => ({
  takeQuota: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0, backend: "local" }),
  quotaLimitMessage: () => "Hết lượt tra cứu.",
}));
vi.mock("@/lib/supabase/server", () => ({ getAuthenticatedUser: vi.fn().mockResolvedValue({ configured: false, client: null, user: null }) }));

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.mocked(takeQuota).mockResolvedValue({ allowed: true, retryAfterSeconds: 0, backend: "local" }); });

function request(url: string, consent = true) {
  return new Request("https://scamlens.test/api/check-url", {
    method: "POST", headers: { origin: "https://scamlens.test", "content-type": "application/json" },
    body: JSON.stringify({ url, consent }),
  });
}

describe("POST /api/check-url", () => {
  it("rejects an expired provider match instead of assigning a fresh session lifetime", async () => {
    vi.stubEnv("WEBRISK_ENABLED", "true"); vi.stubEnv("WEBRISK_API_KEY", "fixture");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ threat: { threatTypes: ["MALWARE"], expireTime: "2020-01-01T00:00:00Z" } })));
    expect(await (await POST(request("https://demo.example/x"))).json()).toMatchObject({ status: "unavailable", queriedUrl: "https://demo.example/x" });
  });
  it("does not call the provider unless server configuration and explicit consent are present", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    vi.stubEnv("WEBRISK_ENABLED", "false"); vi.stubEnv("WEBRISK_API_KEY", "fixture");
    expect((await POST(request("https://example.test"))).status).toBe(503);
    vi.stubEnv("WEBRISK_ENABLED", "true");
    expect((await POST(request("https://example.test", false))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks likely personal data and sends only the chosen URL to the Web Risk endpoint", async () => {
    vi.stubEnv("WEBRISK_ENABLED", "true"); vi.stubEnv("WEBRISK_API_KEY", "fixture-key");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ threat: { threatTypes: ["SOCIAL_ENGINEERING"], expireTime: new Date(Date.now() + 300000).toISOString() } }), { status: 200 }));
    expect((await POST(request("https://example.test/reset?email=linh@example.test"))).status).toBe(400);
    expect((await POST(request("https://example.test/path/%5BOTP%20%C4%90%C3%83%20CHE%5D"))).status).toBe(400);
    const response = await POST(request("https://brand.example.test/login"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "matched", threatTypes: ["SOCIAL_ENGINEERING"], source: "Google Web Risk Lookup API" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const target = new URL(String(fetchMock.mock.calls[0][0]));
    expect(target.origin).toBe("https://webrisk.googleapis.com");
    expect(target.searchParams.get("uri")).toBe("https://brand.example.test/login");
    expect(target.searchParams.get("key")).toBe("fixture-key");
  });

  it("keeps provider and quota failure separate from the main analysis", async () => {
    vi.stubEnv("WEBRISK_ENABLED", "true"); vi.stubEnv("WEBRISK_API_KEY", "fixture-key");
    vi.mocked(takeQuota).mockResolvedValue({ allowed: false, retryAfterSeconds: 120, backend: "local", reason: "provider_daily" });
    const response = await POST(request("https://example.test"));
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ status: "unavailable", retryAfterSeconds: 120 });
  });
});
