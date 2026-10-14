const safeErrors: Record<string, { status: number; message: string }> = {
  gemini_not_configured: { status: 503, message: "Chưa cấu hình GEMINI_API_KEY hoặc GEMINI_MODEL. Phân tích AI đang tạm thời không khả dụng." },
  gemini_timeout: { status: 504, message: "Gemini phản hồi quá lâu. Hãy thử lại sau." },
  gemini_network_error: { status: 502, message: "Không kết nối được với Gemini." },
  gemini_auth_failed: { status: 502, message: "Gemini từ chối API key hoặc quyền truy cập model." },
  gemini_rate_limited: { status: 429, message: "Gemini đã giới hạn lượt gọi. Hãy thử lại sau." },
  gemini_provider_unavailable: { status: 502, message: "Gemini hiện chưa sẵn sàng." },
  gemini_request_rejected: { status: 502, message: "Gemini không chấp nhận yêu cầu này." },
  gemini_invalid_response: { status: 502, message: "Gemini trả về nội dung chưa dùng được." },
  gemini_invalid_json: { status: 502, message: "Gemini trả về định dạng không hợp lệ." },
  gemini_invalid_schema: { status: 502, message: "Gemini trả về cấu trúc không hợp lệ." },
  quota_unavailable: { status: 503, message: "Không xác nhận được giới hạn lượt dùng. Thử lại sau." },
  quota_exceeded: { status: 429, message: "Bạn đã dùng hết lượt phân tích hiện tại. Hãy thử lại vào ngày mai." },
  unauthenticated: { status: 401, message: "Hãy đăng nhập Google để dùng lịch sử phân tích." },
};

export function publicError(error: unknown) {
  const key = error instanceof Error ? error.message : "unknown";
  return safeErrors[key] ?? { status: 500, message: "Không thể hoàn tất yêu cầu. Mã lỗi: request_failed." };
}
