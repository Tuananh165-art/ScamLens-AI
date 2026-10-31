import Link from "next/link";
import { ArrowRight, FileImage, Link2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { LegacyAnalyzeRedirect } from "@/components/legacy-analyze-redirect";

const inputTypes = [
  { icon: MessageCircle, title: "Tin nhắn", text: "SMS, ứng dụng nhắn tin hoặc nội dung được chuyển tiếp." },
  { icon: Mail, title: "Email", text: "Nội dung, người gửi và địa chỉ Reply-To bạn tự cung cấp." },
  { icon: Link2, title: "Đường dẫn", text: "Đặc điểm URL được phân tích mà không mở trang web." },
  { icon: FileImage, title: "Ảnh chụp", text: "Che vùng riêng tư, đọc lại chữ rồi chọn cách phân tích." },
];

export default function LandingPage() {
  return <main className="landing-shell"><LegacyAnalyzeRedirect />
    <header className="landing-nav"><Link className="brand" href="/" aria-label="ScamLens AI"><span className="brand-mark"><ShieldCheck size={20} /></span><span className="brand-word">scamlens<span>.</span><small>AI</small></span></Link><nav aria-label="Điều hướng chính"><a href="#how-it-works">Cách dùng</a><a href="#privacy">Quyền riêng tư</a><Link className="landing-nav-cta" href="/analyze">Mở công cụ <ArrowRight size={15} /></Link></nav></header>
    <section className="landing-hero">
      <div className="landing-copy"><span className="landing-eyebrow"><i /> TRỢ LÝ AN TOÀN SỐ CHO BẠN</span><h1>Chậm một nhịp.<br /><em>Kiểm tra trước khi tin.</em></h1><p>Dán tin nhắn, email, đường dẫn hoặc chọn ảnh. ScamLens chỉ ra câu chữ cần chú ý và gợi ý cách tự xác minh an toàn.</p><div className="landing-actions"><Link className="primary-button" href="/analyze">Bắt đầu kiểm tra <ArrowRight size={16} /></Link><a className="landing-secondary" href="#how-it-works">Xem cách hoạt động</a></div><small className="landing-disclaimer">Công cụ hỗ trợ sàng lọc. Kết quả không xác nhận danh tính hay giao dịch.</small></div>
      <div className="landing-visual" aria-label="Minh họa báo cáo phân tích"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-shield"><ShieldCheck size={56} strokeWidth={1.4} /></div><div className="visual-card visual-card-top"><span className="visual-dot blue" /> Đối chiếu nội dung <b>Đang bật</b></div><div className="visual-card visual-card-bottom"><span className="visual-dot amber" /> Bằng chứng rõ ràng <b>03 trích dẫn</b></div><span className="visual-grid" /></div>
    </section>
    <section className="landing-section" id="how-it-works"><div className="landing-section-heading"><span className="section-kicker">BẠN CÓ THỂ KIỂM TRA</span><h2>Bốn loại nội dung, một cách dùng dễ hiểu</h2><p>Không cần biết thuật ngữ bảo mật. Chỉ cần cung cấp phần bạn muốn kiểm tra.</p></div><div className="landing-input-grid">{inputTypes.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={19} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="landing-section landing-steps"><div className="landing-section-heading"><span className="section-kicker">BA BƯỚC</span><h2>Rà soát trước, quyết định sau</h2></div><ol><li><b>01</b><div><h3>Nhập nội dung</h3><p>Dán, tải ảnh hoặc nhập URL bạn đã nhận được.</p></div></li><li><b>02</b><div><h3>Xem bản sẽ gửi</h3><p>Chỉnh nội dung và chọn thông tin nào cần che trước khi gửi.</p></div></li><li><b>03</b><div><h3>Đọc kết quả</h3><p>Đối chiếu trích dẫn, xem các lớp kiểm tra và tự xác minh qua kênh chính thức.</p></div></li></ol></section>
    <section className="landing-privacy" id="privacy"><ShieldCheck size={23} /><div><h2>Quyền kiểm soát nằm ở bạn</h2><p>Nội dung chỉ được gửi khi bạn bấm phân tích. Có thể rà soát bản gửi trước đó; tra cứu URL bên ngoài là tùy chọn riêng và đang tắt nếu chưa được cấu hình. Kết quả không chứng minh một trang an toàn.</p></div><Link href="/guide#privacy">Đọc về quyền riêng tư <ArrowRight size={14} /></Link></section>
    <footer className="landing-footer"><span>ScamLens AI · Công cụ hỗ trợ tự bảo vệ</span><Link href="/guide">Hướng dẫn</Link><Link href="/analyze">Mở công cụ</Link></footer>
  </main>;
}
