import { expect, test } from "@playwright/test";

test("home renders Vietnamese analysis choices, eight sample situations, and privacy notice", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tin nhắn này có.*đáng tin không/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tin nhắn" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Tôi đã rà soát nội dung và đồng ý gửi/ })).toBeVisible();
  await expect(page.locator("#demo-case-select option")).toHaveCount(8);
  await expect(page.getByText(/DeepSeek/i)).toHaveCount(0);
});

test("message uses inline redaction preview and a single consent gate", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Nội dung tin nhắn").fill("Gửi OTP 123456 ngay để tránh khóa tài khoản.");
  await expect(page.getByText("Phát hiện: 1 mục")).toBeVisible();
  await page.getByText("Xem nội dung sẽ gửi", { exact: true }).click();
  await expect(page.locator(".payload-preview pre")).toContainText("OTP [OTP ĐÃ CHE]");
  const analyze = page.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ });
  await expect(analyze).toBeDisabled();
  await page.getByRole("checkbox", { name: /Tôi đã rà soát nội dung và đồng ý gửi/ }).check();
  await expect(analyze).toBeEnabled();
  await page.getByLabel("Nội dung tin nhắn").fill("Gửi OTP 654321 ngay để tránh khóa tài khoản.");
  await expect(analyze).toBeDisabled();
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
  await page.getByRole("checkbox", { name: /Tôi đã rà soát nội dung và đồng ý gửi/ }).check();
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
  const inputFontSize = await page.getByLabel("Nội dung tin nhắn").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(inputFontSize).toBeGreaterThanOrEqual(15);
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);
  await page.goto("/guide");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".guide-topline").getByRole("button", { name: "Điều chỉnh cỡ chữ" })).toBeVisible();
  await page.locator(".guide-topline").getByRole("button", { name: "Điều chỉnh cỡ chữ" }).click();
  await page.getByRole("button", { name: "Tăng cỡ chữ" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await page.goto("/history");
  await expect(page.locator(".history-topline").getByRole("button", { name: "Điều chỉnh cỡ chữ" })).toBeVisible();
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
  const undersizedText = await page.locator("body *").evaluateAll((elements) => elements.flatMap((element) => {
    const text = element.textContent?.trim();
    const size = Number.parseFloat(getComputedStyle(element).fontSize);
    return text && size < 12 ? [{ tag: element.tagName, className: typeof element.className === "string" ? element.className : "", size, text: text.slice(0, 45) }] : [];
  }));
  expect(undersizedText).toEqual([]);
});

test("text size controls work at mobile width, persist, and keep the layout inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const mobileNav = page.getByRole("navigation", { name: "Điều hướng nhanh" });
  const control = mobileNav.getByRole("button", { name: "Điều chỉnh cỡ chữ" });
  await control.click();
  const body = page.locator("body");
  const defaultSize = await body.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  await page.getByRole("button", { name: "Tăng cỡ chữ" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  const largeSize = await body.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(largeSize).toBeGreaterThan(defaultSize);
  await expect(page.getByLabel("Nội dung tin nhắn")).toBeVisible();
  const tabBox = await page.getByRole("tablist").boundingBox();
  const navBox = await mobileNav.boundingBox();
  const tabBottom = tabBox ? tabBox.y + tabBox.height : Number.POSITIVE_INFINITY;
  const navTop = navBox?.y ?? 0;
  expect(tabBottom).toBeLessThan(navTop);
  await page.setViewportSize({ width: 320, height: 740 });
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  const undersizedText = await page.locator("body *").evaluateAll((elements) => elements.flatMap((element) => {
    const text = element.textContent?.trim();
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    return text && fontSize < 12 ? [{ className: typeof element.className === "string" ? element.className : "", fontSize, text: text.slice(0, 40) }] : [];
  }));
  expect(undersizedText).toEqual([]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await mobileNav.getByRole("button", { name: "Điều chỉnh cỡ chữ" }).click();
  await page.getByRole("button", { name: "Giảm cỡ chữ" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "default");
  await page.getByRole("button", { name: "Giảm cỡ chữ" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "small");
  const smallMobileSize = await body.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(smallMobileSize).toBeLessThan(defaultSize);
  const smallText = await page.locator("body *").evaluateAll((elements) => elements.flatMap((element) => {
    const text = element.textContent?.trim();
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    return text && fontSize < 12 ? [{ className: typeof element.className === "string" ? element.className : "", fontSize, text: text.slice(0, 40) }] : [];
  }));
  expect(smallText).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const desktopScale = await page.locator(".hero-lede").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  await page.locator(".account-area").getByRole("button", { name: "Điều chỉnh cỡ chữ" }).click();
  await page.getByRole("button", { name: "Tăng cỡ chữ" }).click();
  await page.getByRole("button", { name: "Tăng cỡ chữ" }).click();
  const largeDesktopScale = await page.locator(".hero-lede").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(largeDesktopScale).toBeGreaterThan(desktopScale);
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
