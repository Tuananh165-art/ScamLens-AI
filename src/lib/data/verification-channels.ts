// Kênh xác minh và tra cứu độc lập chính thống (VNNIC, Tổng đài 156, ...)
// Trích xuất từ ScamLens_AI_Official_Dataset_2026-10-27.xlsx (Sheet 08_KENH_XAC_MINH)

export interface VerificationChannel {
  channelId: string;
  name: string;
  topic: string;
  channelAddress: string;
  canVerify: string;
  cannotConclude: string;
  sourceId: string;
  inputTypes: string[];
  sourceUrl: string;
}

export const verificationChannels: VerificationChannel[] = [
  {
    "channelId": "CH01",
    "name": "Tra cứu tên miền VNNIC",
    "topic": "Tên miền",
    "channelAddress": "https://tracuutenmien.gov.vn",
    "canVerify": "Tên miền/tổ chức đăng ký (nếu hiển thị)",
    "cannotConclude": "Không chứng minh website an toàn hoặc tổ chức hiện đang kiểm soát",
    "sourceId": "SRC019",
    "inputTypes": [
      "url",
      "email"
    ],
    "sourceUrl": "https://archive.vnnic.vn/tintuc/bo-thong-tin-va-truyen-thong-cong-bo-cong-tra-cuu-thong-tin-ten-mien?lang=en"
  },
  {
    "channelId": "CH02",
    "name": "SMS tra cứu tên miền",
    "topic": "Tên miền",
    "channelAddress": "TCTM <ten_mien> gửi 156",
    "canVerify": "Thông tin tên miền theo quy trình đã công bố",
    "cannotConclude": "Kiểm tra lại cú pháp và tính khả dụng 2026",
    "sourceId": "SRC019",
    "inputTypes": [
      "url"
    ],
    "sourceUrl": "https://archive.vnnic.vn/tintuc/bo-thong-tin-va-truyen-thong-cong-bo-cong-tra-cuu-thong-tin-ten-mien?lang=en"
  },
  {
    "channelId": "CH03",
    "name": "Phản ánh cuộc gọi lừa đảo",
    "topic": "Cuộc gọi",
    "channelAddress": "LD <so_dien_thoai> <noi_dung> gửi 156",
    "canVerify": "Chuyển phản ánh cuộc gọi có dấu hiệu lừa đảo",
    "cannotConclude": "Kênh viễn thông, không phải tố giác hình sự; kiểm tra hoạt động",
    "sourceId": "SRC018",
    "inputTypes": [
      "message"
    ],
    "sourceUrl": "https://mic.gov.vn/bo-tttt-trien-khai-tong-dai-156-tiep-nhan-phan-anh-tin-nhan-rac-cuoc-goi-rac-cuoc-goi-co-dau-hieu-lua-dao-197155742.htm"
  },
  {
    "channelId": "CH04",
    "name": "Phản ánh tin nhắn rác",
    "topic": "SMS",
    "channelAddress": "S <so_dien_thoai> <noi_dung> gửi 156",
    "canVerify": "Phản ánh SMS rác",
    "cannotConclude": "Không giải quyết giao dịch ngân hàng",
    "sourceId": "SRC018",
    "inputTypes": [
      "message"
    ],
    "sourceUrl": "https://mic.gov.vn/bo-tttt-trien-khai-tong-dai-156-tiep-nhan-phan-anh-tin-nhan-rac-cuoc-goi-rac-cuoc-goi-co-dau-hieu-lua-dao-197155742.htm"
  },
  {
    "channelId": "CH05",
    "name": "Phản ánh cuộc gọi rác",
    "topic": "Cuộc gọi",
    "channelAddress": "V <so_dien_thoai> <noi_dung> gửi 156",
    "canVerify": "Phản ánh cuộc gọi rác",
    "cannotConclude": "Không giải quyết giao dịch ngân hàng",
    "sourceId": "SRC018",
    "inputTypes": [
      "message"
    ],
    "sourceUrl": "https://mic.gov.vn/bo-tttt-trien-khai-tong-dai-156-tiep-nhan-phan-anh-tin-nhan-rac-cuoc-goi-rac-cuoc-goi-co-dau-hieu-lua-dao-197155742.htm"
  },
  {
    "channelId": "CH06",
    "name": "Cổng Bộ Công an",
    "topic": "Tố giác",
    "channelAddress": "https://bocongan.gov.vn",
    "canVerify": "Xem hướng dẫn và liên kết chính thức",
    "cannotConclude": "Không tải app từ liên kết do kẻ gian gửi",
    "sourceId": "SRC017",
    "inputTypes": [
      "all"
    ],
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "channelId": "CH07",
    "name": "Ứng dụng VNeID chính thức",
    "topic": "Tố giác",
    "channelAddress": "Ứng dụng VNeID chính chủ trên kho chính thức",
    "canVerify": "Có thể tiếp nhận tố giác theo hướng dẫn Bộ Công an",
    "cannotConclude": "Không xác minh danh tính chỉ vì nội dung nói VNeID",
    "sourceId": "SRC017",
    "inputTypes": [
      "all"
    ],
    "sourceUrl": "https://bocongan.gov.vn/bai-viet/huong-dan-to-giac-bao-tin-ve-toi-pham-kien-nghi-khoi-to-d139-t35195"
  },
  {
    "channelId": "CH08",
    "name": "Cổng CSGT chính thức",
    "topic": "Phạt nguội",
    "channelAddress": "https://www.csgt.vn",
    "canVerify": "Người dùng tự truy cập từ nguồn chính thức",
    "cannotConclude": "Không đi theo link gửi trong tin nhắn",
    "sourceId": "SRC003",
    "inputTypes": [
      "url",
      "message"
    ],
    "sourceUrl": "https://www.bocongan.gov.vn/bai-viet/canh-bao-thu-doan-gia-danh-co-quan-cong-an-gui-tin-nhan-phat-nguoi-kem-duong-link-gia-mao-de-lua-dao-chiem-doat-tai-san-1788945012"
  },
  {
    "channelId": "CH09",
    "name": "Cổng Dịch vụ công Quốc gia",
    "topic": "Dịch vụ công",
    "channelAddress": "https://dichvucong.gov.vn",
    "canVerify": "Đối chiếu thủ tục và cổng thông tin",
    "cannotConclude": "Không thể tự xác định từ URL giống tên cơ quan",
    "sourceId": "SRC003",
    "inputTypes": [
      "url",
      "message"
    ],
    "sourceUrl": "https://www.bocongan.gov.vn/bai-viet/canh-bao-thu-doan-gia-danh-co-quan-cong-an-gui-tin-nhan-phat-nguoi-kem-duong-link-gia-mao-de-lua-dao-chiem-doat-tai-san-1788945012"
  },
  {
    "channelId": "CH10",
    "name": "Cổng Công an Đồng Nai",
    "topic": "Địa phương",
    "channelAddress": "https://congan.dongnai.gov.vn",
    "canVerify": "Cảnh báo và danh bạ địa phương",
    "cannotConclude": "Không tự coi kênh mạng xã hội là chính thức",
    "sourceId": "SRC009",
    "inputTypes": [
      "all"
    ],
    "sourceUrl": "https://congan.dongnai.gov.vn/Pages/gioithieu.aspx?CatID=70"
  },
  {
    "channelId": "CH11",
    "name": "Ứng dụng ngân hàng chính chủ",
    "topic": "Giao dịch",
    "channelAddress": "Ứng dụng ngân hàng của chính khách hàng",
    "canVerify": "Xác minh tiền thực nhận, số dư, giao dịch",
    "cannotConclude": "ScamLens không kết nối ngân hàng / xác thực biên lai",
    "sourceId": "SRC006",
    "inputTypes": [
      "image",
      "message"
    ],
    "sourceUrl": "https://congan.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=109&NewsId=32280"
  },
  {
    "channelId": "CH12",
    "name": "Cổng Công an TP.HCM",
    "topic": "Địa phương",
    "channelAddress": "https://congan.hochiminhcity.gov.vn",
    "canVerify": "Tin cảnh báo và đầu mối cơ quan",
    "cannotConclude": "Không suy diễn thông tin vụ án sang tất cả giao dịch",
    "sourceId": "SRC014",
    "inputTypes": [
      "all"
    ],
    "sourceUrl": "https://congan.hochiminhcity.gov.vn/wps/portal/Home/trang-chu/noi-dung-chi-tiet/anninhtrattu/tin%2Btuc%2Ban%2Bninh%2Btrat%2Btu/tphcm%2Btriet%2Bxoa%2Bcac%2Bduong%2Bday%2Bmupo%2Bbong%2Bdoanh%2Bnghiep%2Blua%2Bdao%2Bchiem%2Bdoat%2Btai%2Bsan%2Bbang%2Bthu%2Bdoan%2Bmua%2Bban%2Bcac%2Bhop%2Bdong%2Bky%2Bnghi%2Btren%2Bdia%2Bban?WCM_Page.CATP_Menu_TinTucChiTiet_Related=83"
  },
  {
    "channelId": "CH13",
    "name": "Cổng BHXH Việt Nam",
    "topic": "BHXH/VssID",
    "channelAddress": "https://baohiemxahoi.gov.vn",
    "canVerify": "Xác minh thông tin ứng dụng BHXH",
    "cannotConclude": "Không tải file VSSID.apk gửi qua chat",
    "sourceId": "SRC016",
    "inputTypes": [
      "url",
      "message"
    ],
    "sourceUrl": "https://baohiemxahoi.gov.vn/chidaodieuhanh/Pages/thong-tin-bao-chi.aspx?CateID=0&ItemID=26544"
  }
];
