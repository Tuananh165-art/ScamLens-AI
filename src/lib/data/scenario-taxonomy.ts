// 38 Kịch bản thủ đoạn và phân loại tín hiệu cảnh báo
// Trích xuất từ ScamLens_AI_Official_Dataset_2026-10-27.xlsx (Sheet 03_KICH_BAN_TIN_HIEU)

export interface ScenarioTaxonomy {
  scenarioId: string;
  group: string;
  title: string;
  sourceId: string;
  sourceAuthority: string;
  signalKeywords: string;
  findingCategories: string[];
  inputTypes: string[];
  riskPriority: string;
  explanation: string;
  sourceUrl: string;
}

export const scenarioTaxonomies: ScenarioTaxonomy[] = [
  {
    "scenarioId": "CA001",
    "group": "Mạo danh cơ quan",
    "title": "Mạo danh Công an yêu cầu chuyển tiền/xác minh",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "Công an; xác minh; chuyển tiền; OTP",
    "findingCategories": [
      "impersonation",
      "money_request",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "email",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA002",
    "group": "Mạo danh cơ quan",
    "title": "Giả danh Viện kiểm sát hoặc Tòa án liên quan vụ án",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "viện kiểm sát; toà án; phong tỏa; chuyển tiền",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA003",
    "group": "Mạo danh cơ quan",
    "title": "Giả ngân hàng yêu cầu thông tin OTP mật khẩu",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "ngân hàng; OTP; mã PIN; xác thực",
    "findingCategories": [
      "impersonation",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "email",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA004",
    "group": "Mạo danh cơ quan",
    "title": "Giả trường học thu học phí hoặc hỗ trợ học bổng",
    "sourceId": "SRC010",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "nhập học; học phí; học bổng; số tài khoản",
    "findingCategories": [
      "impersonation",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email",
      "image"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/catp-hai-phong-canh-bao-cac-thu-doan-lua-dao-bua-vay-hoc-sinh-tan-sinh-vien-mua-tuu-truong-1787629964"
  },
  {
    "scenarioId": "CA005",
    "group": "Mạo danh cơ quan",
    "title": "Giả bệnh viện/khoa cấp cứu thúc chuyển viện phí",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "bệnh viện; cấp cứu; viện phí",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA006",
    "group": "Mạo danh cơ quan",
    "title": "Giả BHXH yêu cầu cập nhật tài khoản/OTP",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "bảo hiểm xã hội; OTP; hoàn tiền",
    "findingCategories": [
      "impersonation",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA007",
    "group": "Mạo danh cơ quan",
    "title": "Giả điện lực thông báo cắt điện, đòi nộp phí",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "điện lực; cắt điện; nộp phí",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA008",
    "group": "Mạo danh cơ quan",
    "title": "Giả viễn thông thông báo nợ cước/khóa SIM",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "nợ cước; khóa thuê bao; mã xác nhận",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA009",
    "group": "Mạo danh cơ quan",
    "title": "Tin nhắn Brandname giả mạo",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "brandname; thông báo ngân hàng; link",
    "findingCategories": [
      "impersonation",
      "suspicious_url"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA010",
    "group": "Mạo danh cơ quan",
    "title": "Tin nhắn thông báo phạt nguội kèm link giả",
    "sourceId": "SRC003",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "phạt nguội; nộp phạt; mã OTP",
    "findingCategories": [
      "impersonation",
      "suspicious_url",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://www.bocongan.gov.vn/bai-viet/canh-bao-thu-doan-gia-danh-co-quan-cong-an-gui-tin-nhan-phat-nguoi-kem-duong-link-gia-mao-de-lua-dao-chiem-doat-tai-san-1788945012"
  },
  {
    "scenarioId": "CA011",
    "group": "Mạo danh địa phương",
    "title": "Giả cán bộ cập nhật sổ đỏ trên VNeID",
    "sourceId": "SRC004",
    "sourceAuthority": "Công an xã Xuân Bắc - Công an TP Đồng Nai",
    "signalKeywords": "sổ đỏ; đất đai; đồng bộ; VNeID",
    "findingCategories": [
      "impersonation",
      "suspicious_url",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.dongnai.gov.vn/pages/newsdetail.aspx?CatId=109&NewsId=32345"
  },
  {
    "scenarioId": "CA012",
    "group": "Mạo danh địa phương",
    "title": "Giả cán bộ cập nhật CCCD/VNeID cho công nhân",
    "sourceId": "SRC005",
    "sourceAuthority": "Công an TP Đồng Nai",
    "signalKeywords": "CCCD; VNeID; chuẩn hóa; công nhân",
    "findingCategories": [
      "impersonation",
      "urgency",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "url"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=109&NewsId=32279"
  },
  {
    "scenarioId": "CA013",
    "group": "Chiếm quyền thiết bị",
    "title": "Cài VNeID giả mạo chứa mã độc",
    "sourceId": "SRC002",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "vneid; cài APK; cấp quyền",
    "findingCategories": [
      "suspicious_url",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://www.bocongan.gov.vn/bai-viet/canh-bao-thu-doan-lua-dao-cai-ung-dung-vneid-gia-mao-d22-t45880"
  },
  {
    "scenarioId": "CA014",
    "group": "Chiếm quyền thiết bị",
    "title": "Cài VssID.apk giả",
    "sourceId": "SRC016",
    "sourceAuthority": "Bảo hiểm xã hội Việt Nam",
    "signalKeywords": "vssid.apk; cập nhật BHXH",
    "findingCategories": [
      "suspicious_url",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://baohiemxahoi.gov.vn/chidaodieuhanh/Pages/thong-tin-bao-chi.aspx?CateID=0&ItemID=26544"
  },
  {
    "scenarioId": "CA015",
    "group": "Chiếm quyền thiết bị",
    "title": "Link/QR dẫn tải ứng dụng điều khiển từ xa",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "quét QR; tải ứng dụng; điều khiển từ xa",
    "findingCategories": [
      "suspicious_url",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA016",
    "group": "Deepfake/DeepVoice",
    "title": "Giả người thân bằng giọng nói AI để vay tiền",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "video call; chuyển gấp; vay tiền",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA017",
    "group": "Deepfake/DeepVoice",
    "title": "Giả lãnh đạo doanh nghiệp bằng AI để chuyển khoản",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "sếp; lãnh đạo; chuyển ngay",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA018",
    "group": "Deepfake/DeepVoice",
    "title": "Cuộc gọi thu mẫu giọng nói để lạm dụng",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "ghi âm; đọc câu mẫu; xác thực giọng",
    "findingCategories": [
      "impersonation",
      "inconsistency"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA019",
    "group": "Đầu tư/tuyển dụng",
    "title": "Tuyển cộng tác viên làm nhiệm vụ nạp tiền",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "nhiệm vụ; hoa hồng; nạp tiền",
    "findingCategories": [
      "money_request",
      "urgency"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA020",
    "group": "Đầu tư/tuyển dụng",
    "title": "Tuyển việc nhẹ lương cao thiếu thông tin doanh nghiệp",
    "sourceId": "SRC012",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "không cần kinh nghiệm; thu nhập cao",
    "findingCategories": [
      "money_request",
      "inconsistency"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/canh-giac-bay-viec-nhe-luong-cao-1787361157"
  },
  {
    "scenarioId": "CA021",
    "group": "Đầu tư/tuyển dụng",
    "title": "Ứng dụng đầu tư tiền số/chứng khoán hứa lợi nhuận chắc chắn",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "lợi nhuận; đảm bảo; rút tiền",
    "findingCategories": [
      "money_request",
      "urgency"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA022",
    "group": "Đầu tư/tuyển dụng",
    "title": "Lừa đảo ngoại hối đầu tư cho rút lãi ban đầu",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "forex; lợi nhuận; nạp thêm",
    "findingCategories": [
      "money_request",
      "inconsistency"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA023",
    "group": "Thương mại điện tử",
    "title": "Biên lai ngân hàng giả thúc giao hàng",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "biên lai; xác nhận chuyển khoản; giao ngay",
    "findingCategories": [
      "inconsistency",
      "money_request"
    ],
    "inputTypes": [
      "image",
      "message"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA024",
    "group": "Thương mại điện tử",
    "title": "Giả người mua/đặt cọc rồi yêu cầu hoàn khoản lạ",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "đặt cọc; chuyển nhầm; hoàn tiền",
    "findingCategories": [
      "money_request",
      "inconsistency"
    ],
    "inputTypes": [
      "message",
      "image"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA025",
    "group": "Thương mại điện tử",
    "title": "Giả shop yêu cầu đặt cọc trước",
    "sourceId": "SRC001",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "cọc trước; giữ hàng; chỉ còn vài sản phẩm",
    "findingCategories": [
      "money_request",
      "urgency"
    ],
    "inputTypes": [
      "message",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/nang-cao-canh-giac-truoc-25-kich-ban-lua-dao-tren-khong-gian-mang-nam-2026-1788865614"
  },
  {
    "scenarioId": "CA026",
    "group": "Thương mại điện tử",
    "title": "Giả đơn vị vận chuyển thông báo thu hồi hàng",
    "sourceId": "SRC006",
    "sourceAuthority": "Công an xã Xuân Phú - Công an TP Đồng Nai",
    "signalKeywords": "thu hồi; lô lỗi; đơn hàng; trả hàng",
    "findingCategories": [
      "impersonation",
      "suspicious_url"
    ],
    "inputTypes": [
      "message",
      "url"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=109&NewsId=32280"
  },
  {
    "scenarioId": "CA027",
    "group": "Thương mại điện tử",
    "title": "Giả hoàn tiền thương mại điện tử bằng QR/link",
    "sourceId": "SRC006",
    "sourceAuthority": "Công an xã Xuân Phú - Công an TP Đồng Nai",
    "signalKeywords": "hoàn tiền; mã QR; xác minh số tài khoản",
    "findingCategories": [
      "suspicious_url",
      "secret_request"
    ],
    "inputTypes": [
      "message",
      "url",
      "image"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=109&NewsId=32280"
  },
  {
    "scenarioId": "CA028",
    "group": "Du lịch/đặt vé",
    "title": "Giả khách sạn công ty du lịch nhận đặt phòng",
    "sourceId": "SRC011",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "đặt phòng; combo; chuyển cọc",
    "findingCategories": [
      "impersonation",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/canh-bao-thu-doan-lua-dao-mua-du-lich-1775739673"
  },
  {
    "scenarioId": "CA029",
    "group": "Du lịch/đặt vé",
    "title": "Trang tích xanh mạo danh doanh nghiệp du lịch",
    "sourceId": "SRC011",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "tích xanh; ưu đãi; chuyển khoản",
    "findingCategories": [
      "impersonation",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/canh-bao-thu-doan-lua-dao-mua-du-lich-1775739673"
  },
  {
    "scenarioId": "CA030",
    "group": "Du lịch/đặt vé",
    "title": "Vé máy bay/vé xe giá rẻ, giữ chỗ bằng cọc",
    "sourceId": "SRC025",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "vé máy bay; giữ chỗ; cọc",
    "findingCategories": [
      "money_request",
      "urgency"
    ],
    "inputTypes": [
      "message",
      "email",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/hai-phong-canh-bao-bay-lua-dao-khi-dat-phong-ve-may-bay-dip-tet-1770360228"
  },
  {
    "scenarioId": "CA031",
    "group": "Du lịch/đặt vé",
    "title": "Chào mời hợp đồng kỳ nghỉ đầu tư lợi nhuận",
    "sourceId": "SRC014",
    "sourceAuthority": "Công an TP.HCM",
    "signalKeywords": "hợp đồng kỳ nghỉ; nghỉ dưỡng; lợi nhuận",
    "findingCategories": [
      "money_request",
      "urgency",
      "inconsistency"
    ],
    "inputTypes": [
      "message",
      "email",
      "image"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.hochiminhcity.gov.vn/wps/portal/Home/trang-chu/noi-dung-chi-tiet/anninhtrattu/tin%2Btuc%2Ban%2Bninh%2Btrat%2Btu/tphcm%2Btriet%2Bxoa%2Bcac%2Bduong%2Bday%2Bmupo%2Bbong%2Bdoanh%2Bnghiep%2Blua%2Bdao%2Bchiem%2Bdoat%2Btai%2Bsan%2Bbang%2Bthu%2Bdoan%2Bmua%2Bban%2Bcac%2Bhop%2Bdong%2Bky%2Bnghi%2Btren%2Bdia%2Bban?WCM_Page.CATP_Menu_TinTucChiTiet_Related=83"
  },
  {
    "scenarioId": "CA032",
    "group": "Giả hỗ trợ/chính sách",
    "title": "Tặng quà Tết/ hỗ trợ chính sách giả",
    "sourceId": "SRC013",
    "sourceAuthority": "Công an TP.HCM qua Báo điện tử Chính phủ",
    "signalKeywords": "quà Tết; hỗ trợ chính sách; nhận quà",
    "findingCategories": [
      "impersonation",
      "suspicious_url"
    ],
    "inputTypes": [
      "message",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://tphcm.baochinhphu.vn/cong-an-tphcm-canh-bao-cac-hinh-thuc-lua-dao-tren-khong-gian-mang-dip-tet-nguyen-dan-2026-10126010819133672.htm"
  },
  {
    "scenarioId": "CA033",
    "group": "Giả hỗ trợ/chính sách",
    "title": "Từ thiện giả/khuyến mãi Tết giả",
    "sourceId": "SRC013",
    "sourceAuthority": "Công an TP.HCM qua Báo điện tử Chính phủ",
    "signalKeywords": "từ thiện; khuyến mãi; nhận thưởng",
    "findingCategories": [
      "impersonation",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "url"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://tphcm.baochinhphu.vn/cong-an-tphcm-canh-bao-cac-hinh-thuc-lua-dao-tren-khong-gian-mang-dip-tet-nguyen-dan-2026-10126010819133672.htm"
  },
  {
    "scenarioId": "CA034",
    "group": "Sinh viên/học sinh",
    "title": "Đăng cọc phòng trọ giá rẻ nhắm tân sinh viên",
    "sourceId": "SRC010",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "phòng trọ; cọc giữ chỗ; nhiều người hỏi",
    "findingCategories": [
      "money_request",
      "urgency"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/catp-hai-phong-canh-bao-cac-thu-doan-lua-dao-bua-vay-hoc-sinh-tan-sinh-vien-mua-tuu-truong-1787629964"
  },
  {
    "scenarioId": "CA035",
    "group": "Sinh viên/học sinh",
    "title": "Giả học bổng, thông báo trúng tuyển",
    "sourceId": "SRC010",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "học bổng; xác nhận nhập học; phí xử lý",
    "findingCategories": [
      "impersonation",
      "suspicious_url"
    ],
    "inputTypes": [
      "message",
      "email",
      "image"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/catp-hai-phong-canh-bao-cac-thu-doan-lua-dao-bua-vay-hoc-sinh-tan-sinh-vien-mua-tuu-truong-1787629964"
  },
  {
    "scenarioId": "CA036",
    "group": "Sinh viên/học sinh",
    "title": "Bắt cóc online đe dọa học sinh sinh viên",
    "sourceId": "SRC010",
    "sourceAuthority": "Bộ Công an",
    "signalKeywords": "giữ bí mật; cắt liên lạc; video call",
    "findingCategories": [
      "impersonation",
      "urgency",
      "money_request"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "high",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/catp-hai-phong-canh-bao-cac-thu-doan-lua-dao-bua-vay-hoc-sinh-tan-sinh-vien-mua-tuu-truong-1787629964"
  },
  {
    "scenarioId": "CA037",
    "group": "Rò rỉ dữ liệu cá nhân",
    "title": "Gửi ảnh cá nhân cho app AI không rõ tin cậy",
    "sourceId": "SRC007",
    "sourceAuthority": "Công an TP Đồng Nai",
    "signalKeywords": "ảnh chân dung; AI ghép mặt; dữ liệu khuôn mặt",
    "findingCategories": [
      "secret_request",
      "inconsistency"
    ],
    "inputTypes": [
      "image",
      "url",
      "message"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.dongnai.gov.vn/pages/newsdetail.aspx?CatId=109&NewsId=32242"
  },
  {
    "scenarioId": "CA038",
    "group": "Lừa đảo tài chính",
    "title": "Sử dụng kịch bản đáo hạn ngân hàng để huy động tiền",
    "sourceId": "SRC023",
    "sourceAuthority": "Công an Đồng Nai",
    "signalKeywords": "đáo hạn; vay ngắn hạn; lợi nhuận",
    "findingCategories": [
      "money_request",
      "inconsistency"
    ],
    "inputTypes": [
      "message",
      "email"
    ],
    "riskPriority": "medium",
    "explanation": "Các cụm từ chỉ gợi ý rà soát cùng ngữ cảnh; không tự động khẳng định lừa đảo.",
    "sourceUrl": "https://congan.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=109&NewsId=26626"
  }
];
