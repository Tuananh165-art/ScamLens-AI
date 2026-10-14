import { expect, test } from "@playwright/test";

test("home renders Vietnamese analysis choices and privacy notice", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tin nhắn này có/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tin nhắn" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /nội dung đã che sẽ được gửi cho AI/ })).toBeVisible();
  await expect(page.getByText(/DeepSeek/i)).toHaveCount(0);
});

test("message can be prepared and its review checkbox gates sending", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Nội dung tin nhắn").fill("[MẪU GIẢ LẬP] Gửi OTP ngay để tránh khóa tài khoản.");
  await page.getByRole("button", { name: /Xem trước nội dung sẽ gửi/ }).click();
  await expect(page.getByText("Nội dung sẽ gửi đến AI")).toBeVisible();
  await expect(page.getByText("Không có mẫu được nhận diện")).toBeVisible();
  await expect(page.getByText(/Không có mẫu trong danh sách tự che/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Phân tích tin nhắn/ })).toHaveCount(0);
  await page.getByLabel(/Tôi đã đối chiếu nội dung/).check();
  await page.getByRole("checkbox", { name: /nội dung đã che sẽ được gửi cho AI/ }).check();
  await expect(page.getByRole("button", { name: /Phân tích tin nhắn/ })).toBeVisible();
});

test("OCR provider failure preserves the locally redacted image for retry", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/ocr", async (route) => {
    attempts += 1;
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Dịch vụ AI hiện chưa sẵn sàng." }) });
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "Ảnh chụp" }).click();
  const imageBase64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4; canvas.height = 4;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#fff"; context.fillRect(0, 0, 4, 4);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from(imageBase64!, "base64"),
  });
  await page.getByRole("button", { name: "Tiếp tục với ảnh đã che" }).click();
  await page.getByRole("button", { name: "Đọc ảnh đã che bằng AI" }).click();
  await expect(page.locator(".feedback-error")).toContainText("Dịch vụ AI hiện chưa sẵn sàng");
  await expect(page.getByRole("img", { name: "Ảnh đã che được chuẩn bị trong trình duyệt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đọc ảnh đã che bằng AI" })).toBeVisible();
  await page.getByRole("button", { name: "Đọc ảnh đã che bằng AI" }).click();
  await expect.poll(() => attempts).toBe(2);
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
