import { afterEach, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => [...store.values].map(([name, value]) => ({ name, value })),
  set: (name: string, value: string, options?: { maxAge?: number }) => {
    store.set(name, value, options);
    if (options?.maxAge === 0) store.values.delete(name);
    else store.values.set(name, value);
  },
}) }));
import { createSupabaseServerClient } from "./server";

afterEach(() => { store.values.clear(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("persists the exchanged account, clears its cookies on local logout, and reads account B next", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "fixture-public-key");
  let account = "a";
  const user = () => ({ id: `account-${account}`, email: `${account}@example.test`, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
  const accessToken = () => [
    { alg: "HS256", typ: "JWT" },
    { sub: `account-${account}`, exp: Math.floor(Date.now() / 1000) + 3600 },
  ].map((item) => Buffer.from(JSON.stringify(item)).toString("base64url")).join(".") + ".fixture-signature";
  const fetcher = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("/token")) return Response.json({ access_token: accessToken(), refresh_token: `fixture-refresh-${account}`, expires_in: 3600, token_type: "bearer", user: user() });
    if (url.includes("/user")) return Response.json(user());
    if (url.includes("/logout")) return new Response(null, { status: 204 });
    throw new Error("Unexpected fixture request");
  });
  vi.stubGlobal("fetch", fetcher);

  const first = (await createSupabaseServerClient())!;
  await first.auth.signInWithOAuth({ provider: "google", options: { skipBrowserRedirect: true } });
  expect([...store.values.keys()].some((key) => key.includes("code-verifier"))).toBe(true);
  expect((await first.auth.exchangeCodeForSession("fixture-code-a")).error).toBeNull();
  expect((await (await createSupabaseServerClient())!.auth.getUser()).data.user?.email).toBe("a@example.test");

  expect((await first.auth.signOut({ scope: "local" })).error).toBeNull();
  expect(store.values.size).toBe(0);
  expect((await (await createSupabaseServerClient())!.auth.getUser()).data.user).toBeNull();

  account = "b";
  const second = (await createSupabaseServerClient())!;
  await second.auth.signInWithOAuth({ provider: "google", options: { skipBrowserRedirect: true } });
  expect((await second.auth.exchangeCodeForSession("fixture-code-b")).error).toBeNull();
  expect((await (await createSupabaseServerClient())!.auth.getUser()).data.user?.email).toBe("b@example.test");
});
