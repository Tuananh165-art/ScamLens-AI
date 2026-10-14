import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
import { proxy } from "./proxy";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "fixture-public-key");
  mocks.create.mockReturnValue({ auth: { getUser: mocks.getUser } });
});
afterEach(() => vi.unstubAllEnvs());

describe("SSR session proxy", () => {
  it("routes a Site URL auth code to the exchange handler before rendering an old account", async () => {
    const response = await proxy(new NextRequest("https://scamlens.vercel.app/?code=fixture-code"));
    expect(response.headers.get("location")).toBe("https://scamlens.vercel.app/auth/callback?code=fixture-code");
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("passes refreshed cookies to both the page request and browser response", async () => {
    mocks.getUser.mockImplementation(async () => {
      const options = mocks.create.mock.calls[0][2];
      options.cookies.setAll([{ name: "sb-session", value: "refreshed", options: { path: "/", maxAge: 3600 } }], { "Cache-Control": "private, no-store" });
      return { data: { user: { id: "account-b" } }, error: null };
    });
    const request = new NextRequest("https://scamlens.vercel.app/", { headers: { cookie: "sb-session=expired" } });
    const response = await proxy(request);
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("sb-session=refreshed");
    expect(request.cookies.get("sb-session")?.value).toBe("refreshed");
  });
  it("keeps guest access available when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await proxy(new NextRequest("https://scamlens.vercel.app/"))).headers.get("x-middleware-next")).toBe("1");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
