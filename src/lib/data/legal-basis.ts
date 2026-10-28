// Căn cứ pháp lý an ninh mạng và bảo vệ dữ liệu cá nhân 2025 - 2026
// Trích xuất từ ScamLens_AI_Official_Dataset_2026-10-27.xlsx (Sheet 05_VAN_BAN_PHAP_LUAT)

export interface LegalBasis {
  lawId: string;
  code: string;
  title: string;
  authority: string;
  promulgationDate: string;
  effectiveDate: string;
  status2026: string;
  notes: string;
  featureGroup: string;
  sourceUrl: string;
}

export const legalBases: LegalBasis[] = [
  {
    "lawId": "LAW001",
    "code": "116/2025/QH15",
    "title": "Luật An ninh mạng",
    "authority": "Quốc hội",
    "promulgationDate": "2025-12-10",
    "effectiveDate": "2026-07-01",
    "status2026": "Hiện hành",
    "notes": "Thay Luật 24/2018/QH14 và 86/2015/QH13 (Điều 44).",
    "featureGroup": "an_ninh_mang;thiet_bi;url",
    "sourceUrl": "https://chinhphu.vn/?classid=1&docid=216499&orggroupid=1&pageid=27160"
  },
  {
    "lawId": "LAW002",
    "code": "91/2025/QH15",
    "title": "Luật Bảo vệ dữ liệu cá nhân",
    "authority": "Quốc hội",
    "promulgationDate": "2025-06-26",
    "effectiveDate": "2026-01-01",
    "status2026": "Hiện hành",
    "notes": "Consent, quyền chủ thể dữ liệu, giới hạn sử dụng dữ liệu cá nhân.",
    "featureGroup": "ocr;email;privacy",
    "sourceUrl": "https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup="
  },
  {
    "lawId": "LAW003",
    "code": "333/2026/NĐ-CP",
    "title": "Quy định chi tiết thi hành Luật An ninh mạng",
    "authority": "Chính phủ",
    "promulgationDate": "2026-08-19",
    "effectiveDate": "2026-08-19",
    "status2026": "Hiện hành",
    "notes": "Văn bản dưới luật về an ninh mạng; xem điều khoản khi áp dụng.",
    "featureGroup": "security;legal",
    "sourceUrl": "https://vanban.chinhphu.vn/?classid=1&docid=219244&pageid=27160"
  },
  {
    "lawId": "LAW004",
    "code": "330/2026/NĐ-CP",
    "title": "Xử phạt vi phạm hành chính an ninh mạng và bảo vệ dữ liệu cá nhân",
    "authority": "Chính phủ",
    "promulgationDate": "2026-08-19",
    "effectiveDate": "2026-08-19",
    "status2026": "Hiện hành",
    "notes": "Không tự động suy ra mức phạt từ một nội dung nghi vấn.",
    "featureGroup": "security;privacy;legal",
    "sourceUrl": "https://chinhphu.vn/?docid=219266&pageid=27160"
  },
  {
    "lawId": "LAW005",
    "code": "356/2025/NĐ-CP",
    "title": "Chi tiết Luật Bảo vệ dữ liệu cá nhân",
    "authority": "Chính phủ",
    "promulgationDate": "2025-12-31",
    "effectiveDate": "2026-01-01",
    "status2026": "Hiện hành",
    "notes": "Thay NĐ 13/2023/NĐ-CP; cần kiểm tra nguyên văn điều khoản nghĩa vụ.",
    "featureGroup": "privacy;data_processing",
    "sourceUrl": "https://chinhphu.vn/?classid=1&docid=216387&pageid=27160"
  },
  {
    "lawId": "LAW006",
    "code": "343/2026/NĐ-CP",
    "title": "Quy định một số điều Luật An ninh mạng thuộc phạm vi Bộ Quốc phòng",
    "authority": "Chính phủ",
    "promulgationDate": "2026-09-03",
    "effectiveDate": "2026-09-03",
    "status2026": "Hiện hành",
    "notes": "Phạm vi chuyên biệt; không tự mở rộng áp dụng cho người dùng ScamLens.",
    "featureGroup": "security;legal",
    "sourceUrl": "https://vanban.chinhphu.vn/?docid=219391&pageid=27160&typegroupid=4"
  },
  {
    "lawId": "LAW007",
    "code": "437/QĐ-TTg",
    "title": "Kế hoạch triển khai thi hành Luật An ninh mạng",
    "authority": "Thủ tướng Chính phủ",
    "promulgationDate": "2026-03-16",
    "effectiveDate": "2026-03-16",
    "status2026": "Quyết định triển khai",
    "notes": "Kế hoạch triển khai, không phải chế tài xử phạt người dân.",
    "featureGroup": "policy;legal",
    "sourceUrl": "https://chinhphu.vn/?docid=217212&pageid=27160"
  },
  {
    "lawId": "LAW008",
    "code": "147/2024/NĐ-CP",
    "title": "Quản lý cung cấp sử dụng dịch vụ Internet và thông tin trên mạng",
    "authority": "Chính phủ",
    "promulgationDate": "2024-11-09",
    "effectiveDate": "2024-12-25",
    "status2026": "Cần kiểm tra các sửa đổi/hiệu lực từng điều",
    "notes": "Áp dụng cho dịch vụ Internet/mạng xã hội; không phán xử sự kiện đơn lẻ.",
    "featureGroup": "url;social",
    "sourceUrl": "https://vbpl.vn/botuphap/Pages/vbpq-thuoctinh.aspx?ItemID=171689"
  },
  {
    "lawId": "LAW009",
    "code": "91/2020/NĐ-CP",
    "title": "Chống tin nhắn rác thư điện tử rác cuộc gọi rác",
    "authority": "Chính phủ",
    "promulgationDate": "2020-08-14",
    "effectiveDate": "2020-10-01",
    "status2026": "Cần rà soát thay đổi 2026",
    "notes": "Cơ sở lịch sử của phản ánh SMS/cuộc gọi, cần đối chiếu văn bản sửa đổi.",
    "featureGroup": "sms;call",
    "sourceUrl": "https://vanban.chinhphu.vn/?docid=200773&pageid=27160"
  },
  {
    "lawId": "LAW010",
    "code": "22/2021/TT-BTTTT",
    "title": "Chi tiết một số điều NĐ 91/2020 về chống spam",
    "authority": "Bộ Thông tin và Truyền thông",
    "promulgationDate": "2021-12-13",
    "effectiveDate": "2022-03-01",
    "status2026": "Cần rà soát thay đổi 2026",
    "notes": "Hướng dẫn báo cáo tin nhắn/cuộc gọi rác.",
    "featureGroup": "sms;call",
    "sourceUrl": "https://vanban.chinhphu.vn/?classid=1&docid=204693&pageid=27160&typegroupid=6"
  },
  {
    "lawId": "LAW011",
    "code": "100/2015/QH13",
    "title": "Bộ luật Hình sự - Điều 174/290 (đã sửa đổi bổ sung)",
    "authority": "Quốc hội",
    "promulgationDate": "2015-11-27",
    "effectiveDate": "2018-01-01",
    "status2026": "Đọc bản hợp nhất mới nhất trước viện dẫn",
    "notes": "Điều 174 và 290 có thể liên quan; KHÔNG tự xác định tội danh bằng mô hình AI.",
    "featureGroup": "fraud;crime",
    "sourceUrl": "https://vbpl.moj.gov.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=96122&Keyword="
  },
  {
    "lawId": "LAW012",
    "code": "15/2020/NĐ-CP",
    "title": "Xử phạt hành chính bưu chính viễn thông CNTT giao dịch điện tử",
    "authority": "Chính phủ",
    "promulgationDate": "2020-02-03",
    "effectiveDate": "2020-04-15",
    "status2026": "Cần rà soát sửa đổi và phạm vi còn áp dụng",
    "notes": "Không trích tiền phạt/tội danh khi chưa đối chiếu NĐ mới.",
    "featureGroup": "security;spam",
    "sourceUrl": "https://vanban.chinhphu.vn/?docid=199053&pageid=27160"
  },
  {
    "lawId": "LAW013",
    "code": "24/2018/QH14",
    "title": "Luật An ninh mạng 2018",
    "authority": "Quốc hội",
    "promulgationDate": "2018-06-12",
    "effectiveDate": "2019-01-01",
    "status2026": "HẾT HIỆU LỰC từ 2026-07-01",
    "notes": "Đã được thay bởi 116/2025/QH15; chỉ tra cứu lịch sử.",
    "featureGroup": "historical",
    "sourceUrl": "https://vbpl.vn/binhduong/Pages/vbpq-toanvan.aspx?ItemID=132957"
  },
  {
    "lawId": "LAW014",
    "code": "86/2015/QH13",
    "title": "Luật An toàn thông tin mạng 2015",
    "authority": "Quốc hội",
    "promulgationDate": "2015-11-19",
    "effectiveDate": "2016-07-01",
    "status2026": "HẾT HIỆU LỰC từ 2026-07-01",
    "notes": "Đã được thay bởi 116/2025/QH15; chỉ tra cứu lịch sử.",
    "featureGroup": "historical",
    "sourceUrl": "https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/95908/VanBanGoc_86.2015.QH13.pdf"
  },
  {
    "lawId": "LAW015",
    "code": "13/2023/NĐ-CP",
    "title": "Nghị định Bảo vệ dữ liệu cá nhân 2023",
    "authority": "Chính phủ",
    "promulgationDate": "2023-04-17",
    "effectiveDate": "2023-07-01",
    "status2026": "HẾT HIỆU LỰC từ 2026-01-01",
    "notes": "Thay bằng 356/2025/NĐ-CP; chỉ tra cứu lịch sử.",
    "featureGroup": "historical",
    "sourceUrl": "https://vanban.chinhphu.vn/?classid=0&docid=207759&pageid=27160"
  },
  {
    "lawId": "LAW016",
    "code": "1621/QĐ-UBND",
    "title": "Phê duyệt Đề án phổ cập kỹ năng số Đồng Nai 2026-2030",
    "authority": "UBND TP Đồng Nai",
    "promulgationDate": "2026-07-17",
    "effectiveDate": "",
    "status2026": "Quyết định/đề án",
    "notes": "Căn cứ chương trình tuyên truyền kỹ năng số, không phải điều khoản hình sự.",
    "featureGroup": "education;local",
    "sourceUrl": "https://skhcn.dongnai.gov.vn/vi/news/trien-khai-nghi-quyet-57/ubnd-thanh-pho-dong-nai-phe-duyet-de-an-pho-cap-ky-nang-so-cho-nguoi-dan-ho-tro-huong-dan-nguoi-dan-trong-viec-su-dung-cac-dich-vu-vien-thong-thiet-bi-thong-minh-chu-ky-so-tai-khoan-thanh-toan-an-toan-thong-tin-tren-dia-ban-thanh-pho-dong-nai-1423.html"
  },
  {
    "lawId": "LAW017",
    "code": "48/2018/QĐ-UBND",
    "title": "Quy chế bảo đảm ATTT mạng trong cơ quan nhà nước Đồng Nai",
    "authority": "UBND Đồng Nai (thời điểm 2018)",
    "promulgationDate": "2018-11-07",
    "effectiveDate": "2019-01-01",
    "status2026": "CHƯA XÁC MINH hiệu lực 2026",
    "notes": "Không dùng để khẳng định nghĩa vụ pháp lý hiện hành khi chưa kiểm tra.",
    "featureGroup": "historical;local",
    "sourceUrl": "https://congbao.dongnai.gov.vn/vi/vanban/detail/Quyet-dinh-so-48-2018-QD-UBND-cua-Uy-ban-nhan-dan-tinh-7201/"
  },
  {
    "lawId": "LAW018",
    "code": "1882/QĐ-UBND",
    "title": "Quy chế bảo đảm ATTT cơ quan nhà nước phường Minh Hưng",
    "authority": "UBND phường Minh Hưng",
    "promulgationDate": "2025-09-30",
    "effectiveDate": "",
    "status2026": "Chưa đọc phụ lục/hiệu lực",
    "notes": "Chủ yếu nội bộ cơ quan; cần kiểm tra văn bản đầy đủ trước viện dẫn.",
    "featureGroup": "local;governance",
    "sourceUrl": "https://minhhung.dongnai.gov.vn/vi/van-ban/detail/Ban-hanh-Quy-che-bao-dam-an-toan-thong-tin-mang-trong-hoat-dong-ung-dung-cong-nghe-thong-tin-cua-cac-co-quan-nha-nuoc-tren-dia-ban-phuong-Minh-Hung-23/"
  }
];
