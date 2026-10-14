const safeErrors: Record<string, { status: number; message: string }> = {
  deepseek_not_configured: { status: 503, message: "Dịch vụ AI hiện chưa sẵn sàng. Vui lòng thử lại sau." },
  deepseek_timeout: { status: 504, message: "AI phản hồi hơi lâu. Bạn hãy thử lại sau ít phút." },
  deepseek_network_error: { status: 502, message: "Hiện chưa kết nối được với dịch vụ AI. Vui lòng thử lại sau." },
  deepseek_auth_failed: { status: 502, message: "Dịch vụ AI đang gặp sự cố quyền truy cập. Vui lòng thử lại sau." },
  deepseek_balance_insufficient: { status: 402, message: "Dịch vụ AI hiện chưa thể xử lý yêu cầu. Vui lòng thử lại sau." },
  deepseek_rate_limited: { status: 429, message: "AI đang nhận nhiều yêu cầu. Hãy đợi một chút rồi thử lại." },
  deepseek_provider_unavailable: { status: 502, message: "Dịch vụ AI tạm thời chưa sẵn sàng. Vui lòng thử lại sau." },
  deepseek_request_rejected: { status: 502, message: "AI chưa thể xử lý yêu cầu này. Hãy thử lại với nội dung ngắn hơn hoặc định dạng khác." },
  deepseek_vision_model_unsupported: { status: 503, message: "Tính năng đọc ảnh chưa được bật cho cấu hình AI hiện tại." },
  deepseek_invalid_response: { status: 502, message: "AI chưa tạo được phản hồi hoàn chỉnh. Vui lòng thử lại." },
  deepseek_invalid_json: { status: 502, message: "AI chưa thể hoàn tất câu trả lời. Vui lòng thử lại." },
  deepseek_invalid_schema: { status: 502, message: "AI chưa tạo được kết quả theo định dạng cần thiết. Vui lòng thử lại sau ít phút." },
  quota_unavailable: { status: 503, message: "Không xác nhận được giới hạn lượt dùng. Thử lại sau." },
  quota_exceeded: { status: 429, message: "Bạn đã dùng hết lượt phân tích hiện tại. Hãy thử lại vào ngày mai." },
  unauthenticated: { status: 401, message: "Hãy đăng nhập Google để dùng lịch sử phân tích." },
};

export function publicError(error: unknown) {
  const key = error instanceof Error ? error.message : "unknown";
  return safeErrors[key] ?? { status: 500, message: "Không thể hoàn tất yêu cầu. Mã lỗi: request_failed." };
}
