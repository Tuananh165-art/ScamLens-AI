const safeErrors: Record<string, { status: number; message: string }> = {
  deepseek_not_configured: { status: 503, message: "Chưa cấu hình DEEPSEEK_API_KEY hoặc DEEPSEEK_MODEL. Phân tích AI đang tạm thời không khả dụng." },
  deepseek_timeout: { status: 504, message: "DeepSeek phản hồi quá lâu. Hãy thử lại sau." },
  deepseek_network_error: { status: 502, message: "Không kết nối được với DeepSeek." },
  deepseek_auth_failed: { status: 502, message: "DeepSeek từ chối API key hoặc quyền truy cập model." },
  deepseek_balance_insufficient: { status: 402, message: "Tài khoản DeepSeek không đủ số dư hoặc quyền sử dụng API." },
  deepseek_rate_limited: { status: 429, message: "DeepSeek đã giới hạn lượt gọi. Hãy thử lại sau." },
  deepseek_provider_unavailable: { status: 502, message: "DeepSeek hiện chưa sẵn sàng." },
  deepseek_request_rejected: { status: 502, message: "DeepSeek không chấp nhận yêu cầu này hoặc model chưa hỗ trợ tính năng." },
  deepseek_vision_model_unsupported: { status: 503, message: "Model DeepSeek trong cấu hình chưa hỗ trợ ảnh. Hãy dùng deepseek-flash để bật OCR." },
  deepseek_invalid_response: { status: 502, message: "DeepSeek trả về nội dung chưa dùng được hoặc bị cắt." },
  deepseek_invalid_json: { status: 502, message: "DeepSeek trả về nội dung JSON không hợp lệ." },
  deepseek_invalid_schema: { status: 502, message: "DeepSeek trả về cấu trúc không hợp lệ." },
  quota_unavailable: { status: 503, message: "Không xác nhận được giới hạn lượt dùng. Thử lại sau." },
  quota_exceeded: { status: 429, message: "Bạn đã dùng hết lượt phân tích hiện tại. Hãy thử lại vào ngày mai." },
  unauthenticated: { status: 401, message: "Hãy đăng nhập Google để dùng lịch sử phân tích." },
};

export function publicError(error: unknown) {
  const key = error instanceof Error ? error.message : "unknown";
  return safeErrors[key] ?? { status: 500, message: "Không thể hoàn tất yêu cầu. Mã lỗi: request_failed." };
}
