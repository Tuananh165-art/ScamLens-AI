import type { AnalyzeRequest } from "./schema";

export type DemoCase = {
  id: string;
  label: string;
  type: AnalyzeRequest["type"];
  content: string;
  subject?: string;
  sender?: string;
  replyTo?: string;
};

// Composite training examples based on common fraud patterns. These are invented
// for UI demonstration and are not claims about documented local victims or cases.
export const demoCaseStudies: DemoCase[] = [
  { id: "public-service", label: "Dịch vụ công · tên miền giả", type: "message", content: "[TÌNH HUỐNG GIẢ LẬP]\nCán bộ hỗ trợ: Hệ thống đối soát phát hiện thông tin định danh chưa khớp. Anh/chị cần chuẩn hóa dữ liệu trước 16h30 hôm nay để tránh gián đoạn thủ tục. Nếu đang bận, truy cập https://dichvucong-dongnai-portal.gov-vn.info/cap-nhat-dinh-danh để hoàn tất trong 2 phút.\n\nĐây là tình huống minh họa; không đại diện cho vụ việc đã xác minh." },
  { id: "task-scam", label: "Việc làm online · lợi nhuận bất thường", type: "message", content: "[TÌNH HUỐNG GIẢ LẬP]\nChuyên viên tuyển dụng: Em hoàn thành hai lượt đánh giá rất tốt. Suất nhiệm vụ VIP này chỉ mở đến hết ca sáng. Em chuyển 1.500.000đ qua cổng của hệ thống, kế toán sẽ hoàn lại gốc và 350.000đ hoa hồng sau đúng 5 phút.\n\nĐây là tình huống minh họa; không đại diện cho vụ việc đã xác minh." },
  { id: "emergency-loan", label: "Mạo danh người quen · viện phí", type: "message", content: "[TÌNH HUỐNG GIẢ LẬP]\nBạn cũ: Mẹ tao đang cấp cứu, app ngân hàng lại bảo trì. Khoa yêu cầu tạm ứng ngay 4 triệu. Mày chuyển giúp tao vào tài khoản bác sĩ trực này nhé, trưa người nhà tao trả lại.\n\nĐây là tình huống minh họa; hãy xác minh qua số điện thoại đã lưu từ trước." },
  { id: "mistaken-transfer", label: "Chuyển nhầm · yêu cầu trả bên thứ ba", type: "message", content: "[TÌNH HUỐNG GIẢ LẬP]\nTin nhắn lạ: Em chuyển nhầm 5 triệu vào tài khoản chị. Đó là tiền học phí của em, trưa nay trường khóa cổng rồi. Chị thương tình chuyển trả vào tài khoản mẹ em: 0987654321, Vietcombank.\n\nĐây là tình huống minh họa; không tự chuyển tiền sang tài khoản do người lạ gửi." },
  { id: "fake-remittance", label: "Cổng nhận tiền · link giả", type: "url", content: "https://western-union.vietnam-remittance.online/receive-portal?ref=6000K" },
  { id: "fake-receipt", label: "Biên lai · thúc giao hàng", type: "image", content: "[TÌNH HUỐNG GIẢ LẬP — BẢN ĐỌC OCR]\nNgân hàng: Vietcombank\nSố tiền: 14.800.000 VND\nSố tiền bằng chữ: Mười bốn triệu đồng\nLoại giao dịch: Chuyển thường\nMã tham chiếu: 123456789\nTin nhắn kèm theo: Chuyển thường ngoài giờ nên có thể mai mới vào. Anh gửi laptop cho tài xế ngay giúp em, em đang cần gấp.\n\nDữ liệu minh họa, không phải biên lai thật và không xác nhận giao dịch." },
  { id: "copyright-email", label: "Email · cảnh báo bản quyền giả", type: "email", sender: "Policy Review <notice@example.test>", replyTo: "appeal@example.test", subject: "Yêu cầu kháng nghị trong 24 giờ", content: "[TÌNH HUỐNG GIẢ LẬP]\nTrang của bạn vi phạm chính sách bản quyền. Hãy tải báo cáo đính kèm và đăng nhập để kháng nghị trong 24 giờ, nếu không quyền quản trị sẽ bị đình chỉ. Không chuyển tiếp email này để tránh mất hiệu lực hồ sơ.\n\nĐây là tình huống minh họa; header email và danh tính người gửi chưa được xác minh." },
  { id: "free-gift", label: "Quà tặng · kéo vào nhóm đầu tư", type: "message", content: "[TÌNH HUỐNG GIẢ LẬP]\nChúc mừng bạn nhận suất quà tri ân miễn phí. Tham gia nhóm VIP hôm nay để nhận hướng dẫn giao dịch và nhân đôi số vốn. Nhắn riêng quản trị viên để giữ chỗ ưu tiên, chương trình chỉ còn vài suất.\n\nĐây là tình huống minh họa; lợi nhuận và danh tính nhóm chưa được xác minh." },
];
