import { ArrowLeft, ExternalLink, Globe, PhoneCall, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { officialContacts } from "@/lib/data/official-contacts";
import { verificationChannels } from "@/lib/data/verification-channels";
import { emergencyPlaybooks } from "@/lib/data/playbooks";

export default function GuidePage() {
  // Select top priority contacts: Dong Nai PA05, Tin bao ANTT, Hotline 156
  const primaryContacts = officialContacts.filter(
    (c) => c.priority === "P1" || c.agencyId === "AG001" || c.agencyId === "AG002" || c.phone.includes("156")
  ).slice(0, 6);

  // Key verification channels
  const primaryChannels = verificationChannels.slice(0, 4);

  return (
    <main className="guide-shell">
      <div className="guide-topline">
        <Link className="back-link" href="/">
          <ArrowLeft size={14} /> Quay lại trang phân tích
        </Link>
        <div className="display-controls">
          <ThemeToggle />
        </div>
      </div>

      <header className="guide-hero">
        <div className="section-kicker">SCAMLENS AI · HƯỚNG DẪN & TỰ VỆ</div>
        <h1>Bình tĩnh trước khi làm theo.</h1>
        <p>
          ScamLens giúp bạn đọc lại nội dung đáng ngờ, nhận ra dấu hiệu thao túng và quyết định bước kiểm tra tiếp theo. 
          Một cảnh báo là lý do để bạn tạm dừng và tự xác minh độc lập; nó không thay thế cơ quan chức năng hay ngân hàng.
        </p>
      </header>

      {/* SECTION 1: CÁC ĐẦU MỐI LIÊN HỆ CHÍNH THỨC */}
      <section className="guide-section" id="contacts">
        <h2>1. Đầu mối liên hệ & Tố giác chính thức (Đồng Nai & Toàn quốc)</h2>
        <p>
          Khi phát hiện dấu hiệu lừa đảo chiếm đoạt tài sản hoặc nghi ngờ bị lộ thông tin, hãy liên hệ ngay với các đơn vị phụ trách trực tiếp:
        </p>
        <div className="guide-contacts-grid">
          {primaryContacts.map((c) => (
            <div key={c.agencyId} className={`guide-contact-card ${c.region === "Đồng Nai" ? "highlight" : ""}`}>
              <div className="guide-contact-header">
                <span className="guide-contact-badge">{c.region}</span>
                <span className="guide-contact-dept">{c.department}</span>
              </div>
              <div className="guide-contact-title">{c.agencyName}</div>
              <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="guide-contact-phone">
                <PhoneCall size={15} /> {c.phone}
              </a>
              {c.address && <div className="guide-contact-address">📍 {c.address}</div>}
              {c.website && (
                <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-muted inline-flex items-center gap-1 mt-1">
                  <Globe size={13} /> {c.website.replace("https://", "")}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: CÁC KÊNH TRA CỨU ĐỘC LẬP CHÍNH THỐNG */}
      <section className="guide-section" id="verification-channels">
        <h2>2. Kênh tự tra cứu độc lập chính thống</h2>
        <p>
          Tuyệt đối không nhấn vào đường dẫn hay gọi lại số lạ gửi kèm trong tin nhắn. Bạn hãy dùng các kênh chính thức sau để tự đối soát:
        </p>
        <div className="guide-channel-list">
          {primaryChannels.map((ch) => (
            <div key={ch.channelId} className="guide-channel-item">
              <div className="p-2 rounded bg-surface-subtle text-blue">
                <Globe size={18} />
              </div>
              <div>
                <strong>{ch.name} ({ch.topic})</strong>
                <span>Cú pháp / Địa chỉ: <code>{ch.channelAddress}</code></span>
                <p className="micro-note mt-1">Công dụng: {ch.canVerify}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: 3 BƯỚC ỨNG PHÓ KHẨN CẤP */}
      <section className="guide-section" id="emergency">
        <h2>3. Các bước xử lý khẩn cấp khi nghi ngờ bị lừa</h2>
        <ol>
          <li>
            <strong>Trường hợp chưa chuyển tiền & chưa bấm link:</strong> Dừng ngay mọi tương tác, không cài app lạ và không làm theo lời hối thúc. Gọi lại cho người thân hoặc cơ quan qua số điện thoại chính thức bạn tự tìm.
          </li>
          <li>
            <strong>Trường hợp lỡ chuyển tiền:</strong> Gọi ngay số tổng đài khẩn cấp của ngân hàng (in ở mặt sau thẻ ATM) để yêu cầu tạm khóa tài khoản hoặc phong tỏa giao dịch, sau đó liên hệ ngay PA05 Công an tỉnh Đồng Nai (<code>0251 3685134</code>) để trình báo.
          </li>
          <li>
            <strong>Trường hợp lỡ lộ OTP hoặc mật khẩu:</strong> Lập tức dùng thiết bị an toàn khác đổi mật khẩu, đăng xuất khỏi tất cả phiên đăng nhập và kích hoạt khóa thẻ tạm thời trên ứng dụng ngân hàng.
          </li>
        </ol>
      </section>

      {/* SECTION 4: QUYỀN RIÊNG TƯ & BẢO VỆ DỮ LIỆU */}
      <section className="guide-section" id="privacy">
        <h2>4. Quyền riêng tư và An toàn dữ liệu</h2>
        <div className="guide-callout">
          Khi bạn nhấn “Quét dấu hiệu lừa đảo ngay”, nội dung đã che trong mục “Xem nội dung sẽ gửi” được chuyển tới AI để phân tích. 
          Hệ thống tuân thủ nguyên tắc tối thiểu hóa dữ liệu: tự động che mờ số điện thoại, số tài khoản, mã OTP trước khi gửi và không lưu trữ hình ảnh gốc.
        </div>
        <ul>
          <li>Mẫu email, số điện thoại, chuỗi số dài và OTP/mật khẩu có ngữ cảnh được che tự động khi có thể. Hãy tự rà soát bản gửi trước khi phân tích.</li>
          <li>Ảnh chụp được xử lý trực tiếp trên trình duyệt thiết bị của bạn, vẽ kín các vùng che và không lưu ảnh gốc lên máy chủ.</li>
          <li>ScamLens AI không thu thập dữ liệu cá nhân ngoài mục đích rà soát an toàn. Báo cáo đã lưu thuộc quyền kiểm soát của bạn và bạn có thể xóa bất cứ lúc nào.</li>
        </ul>
        <p>
          <ShieldCheck size={14} style={{ display: "inline", verticalAlign: "-2px", color: "#388b74" }} /> Tuân thủ quy định tại Luật An ninh mạng và các quy định về bảo vệ dữ liệu cá nhân hiện hành.
        </p>
      </section>

      {/* SECTION 5: LƯU Ý KHI SỬ DỤNG BẢN DEMO */}
      <section className="guide-section">
        <h2>5. Lưu ý quan trọng</h2>
        <p>
          Dữ liệu có gắn nhãn “[TÌNH HUỐNG GIẢ LẬP]” được xây dựng dựa trên các kịch bản cảnh báo thực tế nhằm mục đích trình diễn và huấn luyện nhận thức an toàn số.
        </p>
        <p>
          Kết quả từ ScamLens AI mang tính chất hỗ trợ cảnh báo sớm và phân tích tâm lý thao túng, không thay thế cho kết luận điều tra chính thức từ cơ quan bảo vệ pháp luật.
        </p>
      </section>

      <div style={{ marginTop: 25 }}>
        <Link className="primary-button" href="/">
          Mở công cụ phân tích
        </Link>
      </div>
    </main>
  );
}
