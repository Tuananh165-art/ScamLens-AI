import { expect, test } from "@playwright/test";

test("Site URL code goes to callback before home can render a stale account", async ({ request }) => {
  const response = await request.get("/?code=fixture-code", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers().location, response.url()).href).toBe("http://localhost:3000/auth/callback?code=fixture-code");
});

test("same-origin guest logout works and foreign-origin logout is rejected", async ({ page, request }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const response = await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
    return { ok: response.ok, redirected: response.redirected, path: new URL(response.url).pathname };
  });
  expect(result).toEqual({ ok: true, redirected: true, path: "/" });
  const denied = await request.post("/auth/logout", { headers: { origin: "https://evil.example.test" } });
  expect(denied.status()).toBe(403);
});

test("OAuth failure is visible to the user", async ({ page }) => {
  await page.goto("/?auth=error");
  await expect(page.getByRole("alert").filter({ hasText: "Chưa hoàn tất đăng nhập Google" })).toBeVisible();
});
