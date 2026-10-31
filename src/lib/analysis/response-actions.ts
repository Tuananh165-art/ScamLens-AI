export const EXPOSURE_OPTIONS = [
  ["viewed", "Tôi mới đọc nội dung"],
  ["clicked", "Tôi đã bấm liên kết"],
  ["installed", "Tôi đã tải/cài tệp hoặc ứng dụng"],
  ["credentials", "Tôi đã nhập mật khẩu hoặc OTP"],
  ["paid", "Tôi đã chuyển tiền"],
] as const;
export type Exposure = (typeof EXPOSURE_OPTIONS)[number][0];
export const RESPONSE_ACTIONS: Record<Exposure, string[]> = {
  viewed: ["Tạm dừng làm theo yêu cầu. Tự mở ứng dụng hoặc kênh chính thức để kiểm tra.", "Không cung cấp thêm dữ liệu riêng tư; giữ lại tin nhắn nếu cần đối chiếu."],
  clicked: ["Đóng trang lạ và ngừng nhập thông tin. Nếu chỉ mới mở trang, chưa đủ căn cứ kết luận tài khoản đã bị chiếm.", "Nếu đã tải tệp, cài ứng dụng hoặc nhập dữ liệu, chọn đúng thao tác ở trên để xem bước tiếp theo."],
  installed: ["Ngừng mở tệp hoặc ứng dụng lạ. Nếu đã cài/cấp quyền, tạm ngắt kết nối thiết bị và dùng thiết bị tin cậy khác để liên hệ đơn vị hỗ trợ.", "Không đăng nhập ngân hàng trên thiết bị nghi bị ảnh hưởng. Nhờ bộ phận kỹ thuật kiểm tra; không chuyển tiền cho dịch vụ tự xưng lấy lại tiền."],
  credentials: ["Dùng thiết bị tin cậy để đổi mật khẩu qua ứng dụng/trang chính thức, đăng xuất các phiên lạ và kiểm tra xác thực hai bước.", "Nếu đã cung cấp OTP hoặc thông tin ngân hàng, liên hệ ngay ngân hàng qua số trên thẻ/ứng dụng để yêu cầu bảo vệ tài khoản và kiểm tra giao dịch."],
  paid: ["Liên hệ ngay ngân hàng chuyển tiền qua số trên thẻ/ứng dụng; đề nghị ghi nhận sự việc và hỗ trợ tra soát, thu hồi nếu còn khả năng. Không có bảo đảm lấy lại được tiền.", "Giữ biên nhận, mã giao dịch và hội thoại; trình báo cơ quan Công an qua kênh chính thức. Không nộp thêm phí để được hứa lấy lại tiền."],
};
