import { expect, test } from "@playwright/test";

test("landing explains the product and links to the analysis tool", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Kiểm tra trước khi tin/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Bắt đầu kiểm tra" })).toHaveAttribute("href", "/analyze");
  await expect(page.locator(".landing-input-grid article")).toHaveCount(4);
});

test("analysis tool offers 18 sourced examples across three types", async ({ page }) => {
  await page.goto("/analyze");
  await expect(page.getByRole("tab", { name: "Tin nhắn" })).toBeVisible();
  await page.getByRole("button", { name: /Thử tình huống mẫu/ }).click();
  await expect(page.getByRole("option")).toHaveCount(18);
  await page.getByRole("option", { name: /Đối chứng · nhắc lịch hẹn/ }).click();
  await expect(page.getByText("Mẫu đối chứng bình thường · tình huống giả lập")).toBeVisible();
  await expect(page.getByText(/Nguồn tham khảo:/)).toBeVisible();
});

test("editable prepared text is the body sent for analysis", async ({ page }) => {
  await page.route("**/api/analyze", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.content).toBe("Chuyển tiền ngay.");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ report: {
      schemaVersion: "1.0", id: "849e4317-74ef-4d17-b81a-6e04e5470bf2", createdAt: "2026-10-22T10:00:00.000Z", type: "message",
      riskLevel: "high", summary: "Có dấu hiệu cần dừng lại và tự xác minh.",
      findings: [{ category: "money_request", severity: "high", title: "Có yêu cầu chuyển tiền", explanation: "Nội dung yêu cầu chuyển tiền ngay.", evidence: "Chuyển tiền ngay", evidenceRefs: [{ sourceId: "sample-source", quote: "Chuyển tiền ngay", start: 10, end: 26, confirmedByUser: false }] }],
      localFindings: [], aiFindings: [], checklist: ["Tự mở ứng dụng ngân hàng để kiểm tra."], limitations: ["Người gửi chưa được xác minh."],
      source: { id: "sample-source", content: "Nội dung: Chuyển tiền ngay.", confirmedOcr: false }, model: { text: "fixture-model" },
    }, demo: false, saved: false }) });
  });
  await page.goto("/analyze");
  await page.getByLabel("Nội dung tin nhắn").fill("Chuyển 1.500.000 VND ngay.");
  await page.getByLabel("Nội dung đã chuẩn bị để gửi").fill("Chuyển tiền ngay.");
  await page.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ }).click();
  await expect(page.getByRole("heading", { name: "Báo cáo phân tích và bằng chứng" })).toBeVisible();
  await expect(page.getByText("MÃ BÁO CÁO:")).toHaveCount(1);
});

test("local preview does not flag a safety warning as a credential request", async ({ page }) => {
  await page.goto("/analyze");
  await page.getByLabel("Nội dung tin nhắn").fill("Không chia sẻ OTP hoặc mật khẩu cho bất kỳ ai.");
  await expect(page.locator(".live-sensor-alert")).toHaveCount(0);
  await page.getByLabel("Nội dung tin nhắn").fill("Hãy gửi mã OTP ngay để nhận tiền.");
  await expect(page.locator(".live-sensor-alert")).toContainText("Yêu cầu thông tin xác thực");
});

test("optional Web Risk sends only the previewed URL after a separate consent", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ services: { webRiskConfigured: true, jev: false } }) }));
  await page.route("**/api/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ report: {
    schemaVersion: "1.0", id: "1db3c481-2c8d-4bb8-9ae2-0bfc9e7ac2e8", createdAt: "2026-10-22T10:00:00.000Z", type: "message", riskLevel: "insufficient", summary: "Chưa đủ dữ liệu.",
    findings: [], localFindings: [], aiFindings: [], checklist: [], limitations: [], source: { id: "s1", content: "Nội dung: https://example.test/login", confirmedOcr: false }, model: { text: "fixture" },
  } }) }));
  let requestedUrl = "";
  await page.route("**/api/check-url", async (route) => { requestedUrl = route.request().postDataJSON().url; await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "not_listed", message: "Chưa thấy trong danh sách tại thời điểm kiểm tra.", checkedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 300000).toISOString() }) }); });
  await page.goto("/analyze");
  await page.getByLabel("Nội dung tin nhắn").fill("Kiểm tra https://example.test/login");
  await page.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ }).click();
  await page.getByText("Tra cứu URL với Google Web Risk (tùy chọn)").click();
  await expect(page.getByLabel("URL sẽ gửi")).toHaveValue("https://example.test/login");
  const consent = page.getByRole("checkbox", { name: /Tôi đồng ý gửi chính URL/ });
  await expect(consent).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Tra cứu URL" })).toBeDisabled();
  await expect.poll(() => requestedUrl).toBe("");
  await consent.check();
  await page.getByRole("button", { name: "Tra cứu URL" }).click();
  await expect.poll(() => requestedUrl).toBe("https://example.test/login");
  await expect(page.getByText("Chưa thấy trong danh sách tại thời điểm kiểm tra", { exact: true })).toBeVisible();
});

test("landing and analysis layouts fit common mobile, tablet, and desktop widths", async ({ page }) => {
  for (const path of ["/", "/analyze"]) {
    await page.goto(path);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(widths.content, `${path} horizontal overflow at ${width}px`).toBeLessThanOrEqual(widths.viewport);
    }
  }
});

test("OCR text requires explicit confirmation and any edit resets it", async ({ page }) => {
  await page.route("**/api/ocr", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "Hãy xác nhận nội dung", confirmedByUser: false }) }));
  await page.goto("/analyze");
  await page.getByRole("tab", { name: "Ảnh chụp" }).click();
  const imageBase64 = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 4; canvas.height = 4; const context = canvas.getContext("2d")!; context.fillStyle = "#fff"; context.fillRect(0, 0, 4, 4); return canvas.toDataURL("image/png").split(",")[1]; });
  await page.locator('input[type="file"]').setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: Buffer.from(imageBase64!, "base64") });
  await page.getByRole("radio", { name: "Kiểm tra từng bước" }).click();
  await page.getByRole("button", { name: "Đọc chữ trong ảnh" }).click();
  const confirm = page.getByRole("checkbox", { name: "Tôi đã kiểm tra chữ trong ảnh này là chính xác" });
  await expect(confirm).not.toBeChecked();
  const analyze = page.getByRole("button", { name: /Quét dấu hiệu lừa đảo ngay/ });
  await expect(analyze).toBeDisabled();
  await confirm.check();
  await expect(analyze).toBeEnabled();
  await page.getByLabel("Chữ đọc được từ ảnh").fill("Đã sửa nội dung");
  await expect(confirm).not.toBeChecked();
  await expect(analyze).toBeDisabled();
});

test("legacy /#analyze navigates to the tool", async ({ page }) => {
  await page.goto("/#analyze");
  await expect(page).toHaveURL(/\/analyze$/);
  await expect(page.getByRole("tab", { name: "Tin nhắn" })).toBeVisible();
});

test("guide explains independent verification and privacy", async ({ page }) => {
  await page.goto("/guide");
  await expect(page.getByRole("heading", { name: "Bình tĩnh trước khi làm theo." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "4. Quyền riêng tư và AI" })).toBeVisible();
});
