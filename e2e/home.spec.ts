import { expect, test } from "@playwright/test";

test("home renders Vietnamese analysis choices and privacy notice", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tin nhắn này có/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tin nhắn" })).toBeVisible();
  await expect(page.getByText(/DeepSeek API để phân tích/)).toBeVisible();
});

test("message can be prepared and its review checkbox gates sending", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Nội dung tin nhắn").fill("[MẪU GIẢ LẬP] Gửi OTP ngay để tránh khóa tài khoản.");
  await page.getByRole("button", { name: /Chuẩn bị kiểm tra/ }).click();
  await expect(page.getByText("Xem lại bản sẽ gửi đến AI")).toBeVisible();
  await expect(page.getByRole("button", { name: /Phân tích tin nhắn/ })).toHaveCount(0);
  await page.getByLabel(/Tôi đã đối chiếu nội dung/).check();
  await page.getByLabel(/DeepSeek API để phân tích/).check();
  await expect(page.getByRole("button", { name: /Phân tích tin nhắn/ })).toBeVisible();
});

test("guide explains independent verification and privacy", async ({ page }) => {
  await page.goto("/guide");
  await expect(page.getByRole("heading", { name: "Bình tĩnh trước khi làm theo." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "4. Quyền riêng tư và AI" })).toBeVisible();
});

test("root hydration tolerates attributes injected by browser extensions", async ({ page }) => {
  await page.addInitScript(() => {
    const injectExtensionAttributes = () => {
      document.documentElement?.setAttribute("data-yd-metadata-content-site", "common");
      document.documentElement?.setAttribute("data-yd-content-ready", "true");
    };
    injectExtensionAttributes();
    new MutationObserver(injectExtensionAttributes).observe(document, { childList: true, subtree: true });
  });

  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrated|hydration/i.test(message.text())) hydrationErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("body")).toContainText("ScamLens AI");
  expect(hydrationErrors).toEqual([]);
});

test("theme toggle persists across app pages", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("scamlens-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  const lightBackground = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
  const inputFontSize = await page.getByLabel("Nội dung tin nhắn").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(inputFontSize).toBeGreaterThanOrEqual(15);
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);
  await page.goto("/guide");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
});
