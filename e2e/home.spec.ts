import { expect, test } from "@playwright/test";

test("home renders Vietnamese analysis choices and eight sample situations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tin nhắn này có.*đáng tin không/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tin nhắn" })).toBeVisible();
  await expect(page.locator("#demo-case-select option")).toHaveCount(8);
  await expect(page.getByText(/DeepSeek/i)).toHaveCount(0);
});

test("message shows the redacted payload and can be analyzed without extra acknowledgement", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Nội dung tin nhắn").fill("Gửi OTP 123456 ngay để tránh khóa tài khoản.");
  await expect(page.getByText("Phát hiện: 1 mục")).toBeVisible();
  await page.getByText("Xem nội dung sẽ gửi", { exact: true }).click();
  await expect(page.locator(".payload-preview pre")).toContainText("OTP [OTP ĐÃ CHE]");
  const analyze = page.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ });
  await expect(analyze).toBeEnabled();
  await page.getByLabel("Nội dung tin nhắn").fill("Gửi OTP 654321 ngay để tránh khóa tài khoản.");
  await expect(analyze).toBeEnabled();
});

test("analysis report highlights verified source quotes and saves checklist state locally", async ({ page }) => {
  const content = "Chuyển tiền ngay.";
  const source = `Nội dung: ${content}`;
  const quote = "Chuyển tiền ngay";
  await page.route("**/api/analyze", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ report: {
      schemaVersion: "1.0", id: "849e4317-74ef-4d17-b81a-6e04e5470bf2", createdAt: "2026-10-22T10:00:00.000Z", type: "message",
      riskLevel: "high", summary: "Nội dung thúc ép chuyển tiền ngay.",
      findings: [{ category: "urgency", severity: "high", title: "Có áp lực hành động", explanation: "Cụm từ thúc ép thời gian cần được xác minh.", evidence: quote, evidenceRefs: [{ sourceId: "sample-source", quote, start: source.indexOf(quote), end: source.indexOf(quote) + quote.length, confirmedByUser: false }] }],
      checklist: ["Tự mở ứng dụng ngân hàng để kiểm tra."], limitations: ["Người gửi chưa được xác minh."],
      source: { id: "sample-source", content: source, confirmedOcr: false }, model: { text: "deepseek-v4-flash" },
    }, demo: false, saved: false }),
  }));
  await page.goto("/");
  await page.getByLabel("Nội dung tin nhắn").fill(content);
  await page.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ }).click();
  await expect(page.locator("mark.evidence-mark")).toHaveText(quote);
  const action = page.getByRole("checkbox", { name: "Tự mở ứng dụng ngân hàng để kiểm tra." });
  await action.check();
  await expect(action).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("scamlens-checklist-849e4317-74ef-4d17-b81a-6e04e5470bf2"))).toContain("Tự mở ứng dụng ngân hàng");
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
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);
  await page.goto("/guide");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/history");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guide");
  await expect(page.getByRole("navigation", { name: "Điều hướng nhanh" })).toBeVisible();
  await page.goto("/");
  const mobileNav = page.getByRole("navigation", { name: "Điều hướng nhanh" });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link")).toHaveCount(3);
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
});

test("analysis layout fits supported viewport widths", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 360, 390, 768, 900, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => {
      const tabs = document.querySelector(".type-tabs")?.getBoundingClientRect();
      const nav = document.querySelector(".mobile-bottom-bar");
      const navRect = nav?.getBoundingClientRect();
      return {
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
        tabsVisible: Boolean(tabs && tabs.width > 0),
        tabsAboveNav: !nav || getComputedStyle(nav).display === "none" || !tabs || !navRect || tabs.bottom <= navRect.top,
      };
    });
    expect(layout.content, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(layout.viewport);
    if (width <= 650) expect(layout.tabsAboveNav, `input tabs hidden by bottom navigation at ${width}px`).toBe(true);
    expect(layout.tabsVisible, `input tabs hidden at ${width}px`).toBe(true);
  }
});
