const safeErrors: Record<string, { status: number; message: string }> = {
  missing_ai_endpoint: { status: 503, message: "Chưa cấu hình địa chỉ dịch vụ phân tích văn bản." },
  missing_ai_api_key: { status: 503, message: "Chưa cấu hình khóa dịch vụ phân tích văn bản." },
  missing_ai_model: { status: 503, message: "Chưa cấu hình model văn bản." },
  missing_gemini_api_key: { status: 503, message: "Chưa cấu hình khóa đọc ảnh Gemini." },
  missing_gemini_model: { status: 503, message: "Chưa cấu hình model đọc ảnh." },
  invalid_ai_endpoint: { status: 503, message: "Địa chỉ dịch vụ phân tích chưa đúng định dạng." },
  insecure_ai_endpoint: { status: 503, message: "Dịch vụ phân tích phải dùng HTTPS." },
  ai_timeout: { status: 504, message: "Dịch vụ phân tích phản hồi quá lâu. Thử lại sau." },
  ai_network_error: { status: 502, message: "Không kết nối được với dịch vụ phân tích." },
  ai_auth_failed: { status: 502, message: "Nhà cung cấp từ chối khóa hoặc quyền truy cập." },
  ai_rate_limited: { status: 429, message: "Nhà cung cấp đã giới hạn lượt gọi. Hãy thử lại sau." },
  ai_provider_unavailable: { status: 502, message: "Nhà cung cấp AI hiện chưa sẵn sàng." },
  ai_request_rejected: { status: 502, message: "Nhà cung cấp không chấp nhận yêu cầu này." },
  ai_invalid_response: { status: 502, message: "Nhà cung cấp trả về nội dung chưa dùng được." },
  ai_invalid_json: { status: 502, message: "Nhà cung cấp trả về định dạng không hợp lệ." },
  ai_invalid_schema: { status: 502, message: "Nhà cung cấp trả về cấu trúc không hợp lệ." },
  gemini_not_configured: { status: 503, message: "Chưa cấu hình Gemini. Phân tích ảnh đang tạm thời không khả dụng." },
  gemini_invalid_response: { status: 502, message: "Gemini trả về nội dung ảnh chưa dùng được." },
  gemini_invalid_json: { status: 502, message: "Gemini trả về định dạng đọc ảnh không hợp lệ." },
  gemini_invalid_schema: { status: 502, message: "Gemini trả về cấu trúc đọc ảnh không hợp lệ." },
  quota_unavailable: { status: 503, message: "Không xác nhận được giới hạn lượt dùng. Thử lại sau." },
  quota_exceeded: { status: 429, message: "Bạn đã dùng hết lượt phân tích hiện tại. Hãy thử lại vào ngày mai." },
  unauthenticated: { status: 401, message: "Hãy đăng nhập Google để dùng lịch sử phân tích." },
};

export function publicError(error: unknown) {
  const key = error instanceof Error ? error.message : "unknown";
  return safeErrors[key] ?? { status: 500, message: "Không thể hoàn tất yêu cầu. Mã lỗi: request_failed." };
}
