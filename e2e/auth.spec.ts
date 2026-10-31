import { expect, test } from "@playwright/test";

test("Site URL code goes to callback before home can render a stale account", async ({ request }) => {
  const response = await request.get("/?code=fixture-code", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  const target = new URL(response.headers().location, response.url());
  expect(target.pathname).toBe("/auth/callback");
  expect(target.searchParams.get("code")).toBe("fixture-code");
});

test("same-origin guest logout works and foreign-origin logout is rejected", async ({ request }) => {
  const home = await request.get("/");
  const origin = new URL(home.url()).origin;
  const allowed = await request.post("/auth/logout", { headers: { origin }, maxRedirects: 0 });
  expect(allowed.status()).toBe(303);
  expect(new URL(allowed.headers().location!, allowed.url()).pathname).toBe("/");
  const denied = await request.post("/auth/logout", { headers: { origin: "https://evil.example.test" } });
  expect(denied.status()).toBe(403);
});

test("OAuth failure is visible to the user", async ({ page }) => {
  await page.goto("/analyze?auth=error");
  await expect(page.getByRole("alert").filter({ hasText: "Chưa hoàn tất đăng nhập Google" })).toBeVisible();
});
