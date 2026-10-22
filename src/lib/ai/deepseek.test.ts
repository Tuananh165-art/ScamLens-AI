import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWithDeepSeek, readImage } from "./deepseek";
import { publicError } from "./errors";

const report = {
  summary: "Nội dung yêu cầu mã xác thực.",
  riskLevel: "high",
  findings: [{
    category: "secret_request",
    severity: "high",
    title: "Yêu cầu OTP",
    explanation: "Không chia sẻ mã xác thực với người gửi.",
    evidence: "Gửi OTP ngay",
  }],
  checklist: ["Tự mở ứng dụng chính thức để kiểm tra."],
  limitations: ["Chưa xác minh danh tính người gửi."],
};

function mockCompletion(content: string, finishReason = "stop") {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ finish_reason: finishReason, message: { content } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } })));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("DeepSeek adapter", () => {
  it("requests JSON mode from configured model and validates report schema", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify(report));

    await expect(analyzeWithDeepSeek("SOURCE: Gửi OTP ngay")).resolves.toMatchObject(report);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
    const request = JSON.parse(String(init?.body));
    expect(request).toMatchObject({
      model: "deepseek-v4-flash",
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
    });
    expect(request.messages[0].content).toContain('"findings":[]');
    expect(request.messages[0].content).toContain("suspicious_url");
    expect(request.messages[0].content).toContain("Tất cả khóa dưới đây là bắt buộc");
    expect(request.messages[0].content).toContain("tự nhiên, thân thiện, bình tĩnh và chuyên nghiệp");
  });

  it("sanitizes long summaries and trims oversized lists before schema validation", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify({ ...report, summary: "a".repeat(1_700), checklist: [...report.checklist, ...Array.from({ length: 17 }, (_, i) => `Kiểm tra bước ${i + 1}`)], limitations: [...report.limitations, ...Array.from({ length: 17 }, (_, i) => `Giới hạn kiểm chứng ${i + 1}`)] }));
    const result = await analyzeWithDeepSeek("sample");
    expect(result.summary.length).toBeLessThanOrEqual(1_500);
    expect(result.checklist).toHaveLength(15);
    expect(result.limitations).toHaveLength(15);
  });

  it("sends the redacted image inline and validates OCR JSON", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify({ text: "Nội dung đã che", uncertainParts: [], notes: [] }));

    const result = await readImage(Buffer.from([1, 2, 3]), "image/png");
    expect(result.text).toBe("Nội dung đã che");
    expect(result.model).toBe("deepseek-v4-flash");
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(request.messages[1].content[1].image_url.url).toBe("data:image/png;base64,AQID");
    expect(request.messages[0].content).toContain("Chỉ trả về một JSON object hợp lệ");
    expect(request.messages[0].content).toContain('"text":"Nội dung đọc được","uncertainParts":[],"notes":[]');
    expect(request.messages[0].content).toContain("text, uncertainParts và notes luôn bắt buộc");
  });

  it("keeps readable OCR text when optional receipt fields have incompatible types", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify({
      text: "Số tiền 3.600.000 VND; người nhận: cửa hàng.",
      notes: [],
      structuredData: {
        amount: "3.600.000 VND",
        bankName: 42,
        recipientName: "x".repeat(200),
        transferType: "instant",
        inconsistencies: ["Cần kiểm tra lại", 42],
      },
    }));

    const result = await readImage(Buffer.from([1, 2, 3]), "image/png");
    expect(result.text).toContain("Số tiền 3.600.000 VND");
    expect(result.structuredData).toMatchObject({ amount: 3_600_000, transferType: "unknown", inconsistencies: ["Cần kiểm tra lại"] });
    expect(result.notes).toContain("Một số trường thông tin giao dịch chưa đọc được rõ; vui lòng kiểm tra lại ảnh.");
  });

  it("maps DeepSeek rate limiting to HTTP 429 without exposing provider data", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider body", { status: 429 })));

    await expect(analyzeWithDeepSeek("sample")).rejects.toThrow("deepseek_rate_limited");
    expect(publicError(new Error("deepseek_rate_limited"))).toEqual({
      status: 429,
      message: "AI đang nhận nhiều yêu cầu. Hãy đợi một chút rồi thử lại.",
    });
  });

  it("uses a separately configured vision model for OCR", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-chat");
    vi.stubEnv("DEEPSEEK_VISION_MODEL", "deepseek-v4-flash");
    mockCompletion(JSON.stringify({ text: "Nội dung đã che", uncertainParts: [], notes: [] }));
    const result = await readImage(Buffer.from([1]), "image/png");
    expect(result.model).toBe("deepseek-v4-flash");
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).model).toBe("deepseek-v4-flash");
  });
});
