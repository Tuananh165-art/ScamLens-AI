import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), exchange: vi.fn(), signOut: vi.fn(), create: vi.fn(),
  cookies: { get: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
vi.mock("next/headers", () => ({ cookies: async () => mocks.cookies }));
import { GET as login } from "./login/route";
import { GET as callback } from "./callback/route";
import { POST as logout } from "./logout/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  mocks.create.mockResolvedValue({ auth: { signInWithOAuth: mocks.signIn, exchangeCodeForSession: mocks.exchange, signOut: mocks.signOut } });
  mocks.signIn.mockResolvedValue({ data: { url: "https://accounts.google.com/test" }, error: null });
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("Google OAuth and logout routes", () => {
  const origin = "https://scamlens-demo.vercel.app";
  it("uses an exact callback on the PKCE cookie host and asks Google to choose an account", async () => {
    const response = await login(new Request(`${origin}/auth/login?next=%2Fhistory`));
    expect(mocks.signIn).toHaveBeenCalledWith(expect.objectContaining({ options: { redirectTo: `${origin}/auth/callback`, queryParams: { prompt: "select_account" } } }));
    expect(response.cookies.get("scamlens-auth-next")?.value).toBe("/history");
    expect(response.status).toBe(307);
  });
  it("returns a completed login to home on the same host, without retaining the code", async () => {
    const response = await callback(new Request(`${origin}/auth/callback?code=fake-code`));
    expect(mocks.exchange).toHaveBeenCalledWith("fake-code");
    expect(response.headers.get("location")).toBe(`${origin}/`);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("restores an internal history destination from the login cookie", async () => {
    mocks.cookies.get.mockReturnValue({ value: "/history" });
    expect((await callback(new Request(`${origin}/auth/callback?code=fake`))).headers.get("location")).toBe(`${origin}/history`);
  });
  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "/auth/login"])("rejects an unsafe post-login destination: %s", async (value) => {
    mocks.cookies.get.mockReturnValue({ value });
    const response = await callback(new Request(`${origin}/auth/callback?code=fake`));
    expect(response.headers.get("location")).toBe(`${origin}/`);
  });
  it("does not render an old session as a successful login after code exchange fails", async () => {
    mocks.exchange.mockResolvedValue({ error: { message: "invalid verifier" } });
    expect((await callback(new Request(`${origin}/auth/callback?code=fake`))).headers.get("location")).toBe(`${origin}/analyze?auth=error`);
  });
  it("logs out locally and returns to home on the current alias", async () => {
    const response = await logout(new Request(`${origin}/auth/logout`, { method: "POST", headers: { origin } }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/`);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("rejects a cross-site logout before touching the session", async () => {
    const response = await logout(new Request(`${origin}/auth/logout`, { method: "POST", headers: { origin: "https://evil.test" } }));
    expect(response.status).toBe(403);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("reports a sign-out failure instead of pretending the session was cleared", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
    mocks.signOut.mockResolvedValue({ error: { message: "network" } });
    const response = await logout(new Request(`${origin}/auth/logout`, { method: "POST", headers: { origin } }));
    expect(response.status).toBe(502);
  });
});
