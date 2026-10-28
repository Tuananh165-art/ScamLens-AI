// 14 Quy trình ứng phó khẩn cấp chính thức
// Trích xuất từ ScamLens_AI_Official_Dataset_2026-10-27.xlsx (Sheet 07_QUY_TRINH_UNG_PHO)

export interface Playbook {
  playbookId: string;
  situation: string;
  immediateAction: string;
  nextStep: string;
  agencyIds: string[];
  inputTypes: string[];
  caution: string;
  sourceUrl: string;
}

export const emergencyPlaybooks: Playbook[] = [
  {
    "playbookId": "PB01",
    "situation": "Chưa nhấn link / chưa gửi tiền",
    "immediateAction": "Không nhấn link, không cài app, không chia sẻ OTP",
    "nextStep": "Xác minh qua ứng dụng hoặc website do tự mở",
    "agencyIds": [
      "AG014",
      "AG012"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "caution": "Không khẳng định tin là lừa đảo; nêu dấu hiệu trích dẫn.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB02",
    "situation": "Đã chuyển tiền hoặc nghi bị trừ tiền",
    "immediateAction": "Liên hệ ngân hàng qua app/thẻ để yêu cầu hỗ trợ khẩn",
    "nextStep": "Lưu giao dịch và trình báo Công an nơi gần nhất",
    "agencyIds": [
      "AG011",
      "AG010",
      "AG001"
    ],
    "inputTypes": [
      "message",
      "email",
      "image"
    ],
    "caution": "Không hứa hẹn thu hồi tiền.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB03",
    "situation": "Đã tiết lộ OTP hoặc mật khẩu",
    "immediateAction": "Khóa hoặc đổi thông tin xác thực qua kênh chính thức",
    "nextStep": "Bật bảo mật mạnh, rà soát các phiên và liên hệ ngân hàng nếu có rủi ro",
    "agencyIds": [
      "AG011",
      "AG001"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "caution": "Không yêu cầu người dùng nhập OTP vào ScamLens.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB04",
    "situation": "Đã tải/cài APK giả hay cấp quyền truy cập",
    "immediateAction": "Ngắt kết nối thiết bị đáng nghi nếu cần; dùng thiết bị sạch liên hệ ngân hàng",
    "nextStep": "Tìm hỗ trợ chuyên môn để làm sạch thiết bị, trình báo Công an",
    "agencyIds": [
      "AG011",
      "AG001"
    ],
    "inputTypes": [
      "url",
      "image",
      "message"
    ],
    "caution": "Không tự đưa các bước kỹ thuật có thể khiến mất bằng chứng hoặc khóa nhầm thiết bị.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB05",
    "situation": "Bị chiếm Facebook/Zalo/email",
    "immediateAction": "Dùng quy trình khôi phục tài khoản chính thức trên thiết bị tin cậy",
    "nextStep": "Cảnh báo người quen, bảo vệ email và tài khoản ngân hàng; trình báo khi bị chiếm đoạt",
    "agencyIds": [
      "AG001",
      "AG010"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "caution": "Không coi tài khoản hiển thị tên quen là danh tính đã xác thực.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB06",
    "situation": "Biên lai chuyển tiền nghi giả",
    "immediateAction": "Không giao hàng chỉ vì ảnh biên lai",
    "nextStep": "Mở ứng dụng ngân hàng của bên nhận, kiểm tra lịch sử số dư/giao dịch",
    "agencyIds": [
      "AG011",
      "AG001"
    ],
    "inputTypes": [
      "image"
    ],
    "caution": "ScamLens chỉ phân tích ảnh; KHÔNG xác thực tiền đến.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB07",
    "situation": "Giả công an / phạt nguội",
    "immediateAction": "Ngừng tương tác với cuộc gọi tin nhắn đòi chuyển tiền/OTP",
    "nextStep": "Tự truy cập kênh CSGT/VNeTraffic/VNeID chính thức",
    "agencyIds": [
      "AG006",
      "AG010"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "caution": "Không tra cứu đường link đưa trong tin nhắn nghi vấn.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB08",
    "situation": "Giả CCCD/VNeID/sổ đỏ",
    "immediateAction": "Không cài APK và không cấp quyền truy cập theo cuộc gọi lạ",
    "nextStep": "Ra trực tiếp cơ quan hành chính hoặc Công an cấp xã để xác minh",
    "agencyIds": [
      "AG007",
      "AG008",
      "AG010"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "caution": "Dùng nguồn tin Đồng Nai cập nhật 20-23/10/2026.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB09",
    "situation": "Spam/điện thoại nghi vấn",
    "immediateAction": "Không cung cấp dữ liệu qua cuộc gọi, lưu số và nội dung liên quan",
    "nextStep": "Phản ánh 156 và công an khi có dấu hiệu chiếm đoạt",
    "agencyIds": [
      "AG012",
      "AG010"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "caution": "156 tiếp nhận phản ánh viễn thông, không thay thế tố giác.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB10",
    "situation": "Đe dọa tống tiền / bắt cóc online",
    "immediateAction": "Tìm người thân/người tin cậy và giữ liên lạc an toàn",
    "nextStep": "Trình báo Công an gần nhất, lưu bằng chứng nếu an toàn",
    "agencyIds": [
      "AG010",
      "AG002"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "caution": "Ưu tiên an toàn; không tự chuyển tiền để xử lý.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB11",
    "situation": "Phòng trọ / học phí / học bổng",
    "immediateAction": "Dừng đặt cọc hoặc nộp phí theo tin lạ",
    "nextStep": "Gọi nhà trường/chủ địa điểm qua thông tin tìm độc lập",
    "agencyIds": [
      "AG010"
    ],
    "inputTypes": [
      "message",
      "email",
      "image"
    ],
    "caution": "Không coi con dấu ảnh chụp là xác thực.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB12",
    "situation": "Website lạ hoặc QR",
    "immediateAction": "Không click hoặc mở thử URL/QR không rõ nguồn gốc",
    "nextStep": "Đối chiếu registrable domain; tra cứu VNNIC nếu cần",
    "agencyIds": [
      "AG014",
      "AG001"
    ],
    "inputTypes": [
      "url",
      "image"
    ],
    "caution": "Tra cứu tên miền không chứng minh trang an toàn.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB13",
    "situation": "Ảnh AI / dữ liệu cá nhân",
    "immediateAction": "Không tải ảnh CCCD khuôn mặt riêng tư lên nền tảng không rõ nguồn",
    "nextStep": "Kiểm tra chính sách dữ liệu, gỡ quyền và yêu cầu xóa phù hợp",
    "agencyIds": [
      "AG001"
    ],
    "inputTypes": [
      "image",
      "url"
    ],
    "caution": "Không kết luận ảnh deepfake chỉ vì metadata.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "playbookId": "PB14",
    "situation": "Nghi thông tin bị bịa đặt/tin giả",
    "immediateAction": "Không chia sẻ như sự thật; đối chiếu cơ quan phát ngôn",
    "nextStep": "Đọc bản cải chính/chính thức trước khi trích dẫn",
    "agencyIds": [
      "AG010"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "caution": "Không biến tin đang lan truyền thành tội danh hoặc vụ án đã xác minh.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  }
];
