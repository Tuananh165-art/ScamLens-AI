import { test, expect } from "@playwright/test";
import path from "node:path";

test("decodes a real QR image locally and lets the user review it before analysis", async ({ page }) => {
  let providerRequests = 0;
  await page.route("**/api/analyze", route => { providerRequests++; return route.abort(); });
  await page.route("**/api/ocr", route => { providerRequests++; return route.abort(); });
  await page.goto("/analyze");
  await page.getByRole("tab", { name: "Ảnh chụp" }).click();
  await page.locator('input[type="file"]').setInputFiles(path.resolve("e2e/fixtures/qr-demo.png"));
  await page.getByRole("button", { name: "Đọc QR trên thiết bị" }).click();
  await expect(page.locator(".qr-result pre")).toHaveText("https://demo.example/qr");
  expect(providerRequests).toBe(0);
  await page.getByRole("button", { name: "Đưa nội dung QR vào bản xem trước" }).click();
  await expect(page.getByRole("tab", { name: "Đường dẫn" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Nội dung đã chuẩn bị để gửi")).toHaveValue("https://demo.example/qr");
  expect(providerRequests).toBe(0);
});

test("imports a real EML through the application and keeps metadata in the redacted preview", async ({ page }) => {
  let analyzed = false;
  await page.route("**/api/analyze", route => { analyzed = true; return route.abort(); });
  await page.goto("/analyze");
  await page.getByRole("tab", { name: "Email" }).click();
  const eml = "From: Example <notice@sender.example>\r\nReply-To: reply@outside.example\r\nSubject: Demo email\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nPlease review this message.";
  await page.getByLabel("Nhập từ tệp .eml (tối đa 2 MiB)").setInputFiles({ name: "demo.eml", mimeType: "message/rfc822", buffer: Buffer.from(eml) });
  await expect(page.getByLabel("Bản gửi · Người gửi")).toHaveValue(/Example.*<\[PHẦN EMAIL ĐÃ CHE\]@sender\.example>/);
  await expect(page.getByLabel("Bản gửi · Reply-To")).toHaveValue("[PHẦN EMAIL ĐÃ CHE]@outside.example");
  await expect(page.getByLabel("Toàn bộ bản gửi sau khi che")).toContainText("Demo email");
  await expect(page.locator(".live-sensor-alert")).toContainText("Thông tin không khớp");
  expect(analyzed).toBe(false);
});

test("evidence and layer comparison remain readable on mobile and print across pages", async ({ page }, info) => {
  const source = "Nội dung: Gửi OTP ngay.";
  const finding = { category: "secret_request", severity: "high", title: "Yêu cầu cung cấp mã xác thực", explanation: "Nội dung yêu cầu đọc mã cho người khác. Hãy kiểm tra qua kênh chính thức. ".repeat(6), evidence: "Gửi OTP ngay", evidenceRefs: [{ sourceId: "s1", quote: "Gửi OTP ngay", start: 10, end: 22, confirmedByUser: false }] };
  const report = {
    schemaVersion: "1.0", id: "849e4317-74ef-4d17-b81a-6e04e5470bf2", createdAt: "2026-10-31T10:00:00Z", type: "message",
    riskLevel: "high", summary: "Có yêu cầu cung cấp mã xác thực; hãy tạm dừng và kiểm tra nguồn.",
    findings: Array.from({ length: 8 }, (_, index) => ({ ...finding, title: finding.title + " " + (index + 1) })),
    localFindings: [finding], aiFindings: [finding], checklist: ["Không gửi mã.", "Tự liên hệ ngân hàng."],
    limitations: Array.from({ length: 12 }, (_, index) => "Giới hạn " + (index + 1) + ": " + "Chưa xác minh thông tin ngoài đời. ".repeat(6)),
    source: { id: "s1", content: source, confirmedOcr: false }, model: { text: "fixture" },
  };
  await page.route("**/api/analyze", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ report }) }));
  await page.goto("/analyze");
  await page.getByLabel("Nội dung tin nhắn").fill("Gửi OTP ngay.");
  await page.getByRole("button", { name: /Quét dấu hiệu/ }).click();
  await expect(page.getByRole("heading", { name: "Vì sao cần chú ý?" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "JEV" })).toBeVisible();
  await page.getByLabel("Bạn đã thao tác gì?").selectOption("paid");
  await expect(page.locator(".response-actions")).toContainText("tra soát, thu hồi");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#report-section").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("report-desktop.png") });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.locator("#report-section").evaluate(element => element.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.screenshot({ path: info.outputPath("report-mobile.png") });
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Nội dung trích xuất trong ngữ cảnh" })).toBeVisible();
  const pdf = await page.pdf({ path: info.outputPath("report-a4.pdf"), format: "A4", printBackground: true });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
});
