"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpenText, Check,
  ChevronDown, CircleHelp, Clock3, Copy, FileImage, FileText, Fingerprint,
  Globe2, Link2, LoaderCircle, LockKeyhole, Mail, MessageCircle,
  Shield, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert, Upload,
} from "lucide-react";
import { ImageRedactor } from "@/components/image-redactor";
import { ThemeToggle } from "@/components/theme-toggle";
import { redactSensitiveText, hasSensitiveText } from "@/lib/analysis/redact";
import type { AnalysisReport, AnalyzeRequest } from "@/lib/analysis/schema";

type InputType = "message" | "email" | "image" | "url";
type Feedback = { kind: "error" | "success" | "info"; text: string } | null;
type Props = { signedIn: boolean; email: string | null; authConfigured: boolean };

const types: Array<{ id: InputType; label: string; icon: typeof MessageCircle }> = [
  { id: "message", label: "Tin nhắn", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "image", label: "Ảnh chụp", icon: FileImage },
  { id: "url", label: "Đường dẫn", icon: Link2 },
];

const riskLabels = { low: "Chưa thấy dấu hiệu rõ", medium: "Có điểm cần kiểm tra", high: "Rủi ro cao", insufficient: "Chưa đủ thông tin" };
const typeLabels: Record<InputType, string> = { message: "Tin nhắn", email: "Email", image: "Ảnh chụp", url: "Đường dẫn" };
const categoryLabels: Record<string, string> = {
  impersonation: "Danh tính", money_request: "Tiền bạc", urgency: "Gây áp lực",
  secret_request: "Thông tin bí mật", suspicious_url: "Đường dẫn", inconsistency: "Mâu thuẫn",
};

const demoExamples: Record<InputType, { label: string; content: string; subject?: string; sender?: string; replyTo?: string }> = {
  message: { label: "Giả danh ngân hàng · mẫu", content: "[MẪU GIẢ LẬP] Tài khoản của bạn sắp bị khóa trong 10 phút. Hãy gửi mã OTP để xác minh ngay, không được nói với ai." },
  email: { label: "Email yêu cầu thanh toán · mẫu", sender: "ke-toan@example.test", replyTo: "xacnhan@example.test", subject: "Thanh toán phí xử lý hôm nay", content: "[MẪU GIẢ LẬP] Vui lòng chuyển khoản phí xử lý ngay hôm nay để tránh khóa tài khoản." },
  image: { label: "Biên lai giao dịch · mẫu", content: "[MẪU GIẢ LẬP] Đã chuyển khoản thành công — vui lòng giao hàng. Đây chỉ là ví dụ, không phải ảnh giao dịch thật." },
  url: { label: "Đường dẫn cần kiểm tra · mẫu", content: "https://example.test/secure-login" },
};

export function HomeApp({ signedIn, email, authConfigured }: Props) {
  const [type, setType] = useState<InputType>("message");
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [sender, setSender] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [prepared, setPrepared] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copied, setCopied] = useState(false);
  const [redactedImage, setRedactedImage] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrNotes, setOcrNotes] = useState<string[]>([]);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [imageStep, setImageStep] = useState<"select" | "reading" | "review" | "confirmed">("select");
  const [imagePreview, setImagePreview] = useState("");
  const [hadAutoMask, setHadAutoMask] = useState(false);

  const imageStageReady = imageStep === "confirmed" && ocrConfirmed && Boolean(ocrText.trim());
  const requiresPreparation = type !== "image" && prepared;
  const canAnalyze = type === "image" ? imageStageReady && privacyAcknowledged : requiresPreparation && acknowledged && privacyAcknowledged;
  const foundSensitiveData = useMemo(() => hasSensitiveText([content, sender, replyTo, subject].join("\n")), [content, sender, replyTo, subject]);

  function switchType(next: InputType) {
    setType(next); setContent(""); setSender(""); setReplyTo(""); setSubject(""); setContext("");
    setPrepared(false); setAcknowledged(false); setReport(null); setFeedback(null); setRedactedImage(null); setImagePreview(""); setHadAutoMask(false);
    setOcrText(""); setOcrNotes([]); setOcrConfirmed(false); setImageStep("select"); setPrivacyAcknowledged(false);
  }

  function loadDemo() {
    const item = demoExamples[type];
    setContent(item.content); setSender(item.sender ?? ""); setReplyTo(item.replyTo ?? ""); setSubject(item.subject ?? "");
    setContext("Đây là nội dung mẫu đã được tạo để demo, không phải tin nhắn/email thật.");
    setPrepared(false); setAcknowledged(false); setReport(null); setPrivacyAcknowledged(false);
    if (type === "image") {
      setOcrText(item.content); setOcrNotes(["Bản đọc minh họa, không được trích từ ảnh thật."]);
      setOcrConfirmed(true); setImageStep("confirmed"); setFeedback({ kind: "info", text: "Đã nạp nội dung ảnh minh họa. Bấm phân tích để chạy AI hoặc bật Chế độ demo trong .env để xem báo cáo giả lập." });
    } else setFeedback({ kind: "info", text: "Đã nạp dữ liệu giả lập. Thay dữ liệu mẫu bằng nội dung thật đã che trước khi phân tích." });
  }

  function prepareText() {
    if (!content.trim()) { setFeedback({ kind: "error", text: "Hãy nhập nội dung cần kiểm tra trước." }); return; }
    const masked = redactSensitiveText(content);
    setHadAutoMask(masked !== content || hasSensitiveText([sender, replyTo, subject].join("\n")));
    setContent(masked); setSender(redactSensitiveText(sender)); setReplyTo(redactSensitiveText(replyTo)); setSubject(redactSensitiveText(subject));
    setPrepared(true); setAcknowledged(false); setFeedback({ kind: "info", text: masked === content && !foundSensitiveData ? "Đã tạo bản xem trước gửi AI." : "ScamLens đã che một số mẫu dữ liệu. Hãy sửa bản gửi nếu cần; tự kiểm tra thêm dữ liệu nhạy cảm." });
  }

  async function readUploadedImage() {
    if (!redactedImage) { setFeedback({ kind: "error", text: "Hãy chọn và che ảnh trước." }); return; }
    setBusy(true); setImageStep("reading"); setFeedback(null);
    try {
      const form = new FormData(); form.set("image", redactedImage);
      const response = await fetch("/api/ocr", { method: "POST", body: form, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không đọc được ảnh.");
      setOcrText(result.text); setOcrNotes([...(result.uncertainParts ?? []).map((part: string) => `Chưa chắc: ${part}`), ...(result.notes ?? [])]);
      setImageStep("review"); setOcrConfirmed(false);
    } catch (error) {
      setImageStep("select"); setRedactedImage(null); setImagePreview(""); setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Không đọc được ảnh." });
    } finally { setBusy(false); }
  }

  function confirmOcr() {
    if (!ocrText.trim()) { setFeedback({ kind: "error", text: "Bản đọc ảnh đang trống. Hãy thêm nội dung hoặc chọn ảnh khác." }); return; }
    setOcrText(redactSensitiveText(ocrText)); setOcrConfirmed(true); setImageStep("confirmed");
    setFeedback({ kind: "info", text: "Đã xác nhận bản đọc và che thêm các mẫu dữ liệu nhận diện được. Hãy kiểm tra lại trước khi gửi." });
  }

  async function analyze() {
    if (!canAnalyze) return;
    if (!privacyAcknowledged) { setFeedback({ kind: "error", text: "Vui lòng xác nhận trước khi gửi nội dung đến nhà cung cấp AI." }); return; }
    setBusy(true); setFeedback(null); setReport(null);
    try {
      const body: AnalyzeRequest = {
        type, content: type === "image" ? ocrText : content, context, sender, replyTo, subject,
        confirmedOcr: type === "image" && ocrConfirmed,
      };
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không phân tích được nội dung.");
      setReport(result.report); setFeedback(result.demo ? { kind: "info", text: "Báo cáo đang ở chế độ demo; AI chưa được gọi." } : { kind: "success", text: "Đã phân tích xong. Hãy xem từng trích dẫn trước khi quyết định." });
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Không phân tích được nội dung." }); }
    finally { setBusy(false); }
  }

  async function saveReport() {
    if (!report) return;
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ report }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không lưu được báo cáo.");
      setFeedback({ kind: "success", text: "Đã lưu báo cáo vào lịch sử riêng của bạn." });
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Không lưu được báo cáo." }); }
    finally { setBusy(false); }
  }

  async function copyReport() {
    if (!report) return;
    const text = `${riskLabels[report.riskLevel]}\n\n${report.summary}\n\n${report.findings.map((finding) => `• ${finding.title}: “${finding.evidence}” — ${finding.explanation}`).join("\n\n")}\n\nKiểm chứng:\n${report.checklist.map((item) => `• ${item}`).join("\n")}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setFeedback({ kind: "error", text: "Trình duyệt chưa cho phép sao chép. Hãy dùng nút In / lưu PDF." }); }
  }

  return <main className="site-shell">
    <header className="topbar">
      <Link href="/" className="brand" aria-label="ScamLens AI trang chủ"><span className="brand-mark"><Shield size={20} strokeWidth={2.1} /><span className="brand-spark"><Sparkles size={10} /></span></span><span className="brand-word">scamlens<span>.</span><small>AI</small></span></Link>
      <nav className="top-nav" aria-label="Điều hướng chính"><Link className="nav-active" href="/#analyze">Phân tích</Link><Link href="/guide">Cách tự bảo vệ</Link><Link href="/guide#privacy">Quyền riêng tư</Link></nav>
      <div className="account-area"><ThemeToggle />{signedIn ? <><Link className="account-link" href="/history"><Clock3 size={15} /> Lịch sử</Link><span className="account-email">{email}</span><form action="/auth/logout" method="post"><button className="account-button">Đăng xuất</button></form></> : authConfigured ? <a href="/auth/login" className="sign-in"><span className="google-g">G</span> Đăng nhập <ArrowUpRight size={14} /></a> : <span className="setup-state"><span /> Cấu hình đăng nhập sau</span>}</div>
    </header>

    <section className="hero" id="analyze">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> TRỢ LÝ AN TOÀN SỐ · TIẾNG VIỆT</div><h1>Tin nhắn này có<br /><span>đáng tin không?</span></h1><p className="hero-lede">Phát hiện dấu hiệu đáng ngờ, giải thích bằng chứng và giúp bạn tự kiểm chứng — trước khi làm theo.</p><div className="trust-points"><span><ShieldCheck size={16} /> Trích dẫn có thể đối chiếu</span><span><LockKeyhole size={15} /> Bạn xem trước dữ liệu gửi</span><span><Fingerprint size={15} /> Không lưu nếu bạn không chọn</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-window"><div className="art-window-bar"><span /><span /><span /><i>tinnhan-da-xacminh.com</i><LockKeyhole size={12} /></div><div className="art-message"><div className="art-avatar">N</div><div><div className="art-message-title">Thông báo giao dịch <em>Hôm nay</em></div><div className="art-message-copy">Tài khoản của bạn sẽ bị khóa.<br />Gửi mã OTP để xác minh ngay.</div></div></div><div className="art-warning"><span><TriangleAlert size={15} /></span><div><strong>Yêu cầu mã xác thực</strong><small>Bằng chứng được trích từ tin nhắn</small></div><ArrowUpRight size={15} /></div></div><div className="art-shield"><ShieldCheck size={23} /></div><div className="art-tag"><span /> Đang bảo vệ bạn</div><div className="art-dots" /></div>
    </section>

    <section className="workspace" aria-label="Công cụ phân tích">
      <div className="workspace-heading"><div><div className="section-kicker">BẮT ĐẦU KIỂM TRA</div><h2>Bạn nhận được điều gì đáng ngờ?</h2></div><button className="demo-button" type="button" onClick={loadDemo}><Sparkles size={15} /> Thử dữ liệu mẫu <ArrowRight size={14} /></button></div>
      <div className="analysis-grid">
        <section className="input-panel">
          <div className="panel-label-row"><span className="panel-label"><span className="step-number">01</span> Chọn loại nội dung</span><span className="step-muted">Bạn có thể thử mà không cần tài khoản</span></div>
          <div className="type-tabs" role="tablist" aria-label="Loại dữ liệu cần phân tích">{types.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={type === id} className={`type-tab ${type === id ? "selected" : ""}`} type="button" onClick={() => switchType(id)}><Icon size={16} strokeWidth={1.8} /><span>{label}</span></button>)}</div>

          {type === "image" ? <div className="input-fields image-fields">
            <label className="field-heading"><span className="step-number">02</span> Che dữ liệu rồi đọc ảnh <span className="optional">Dùng DeepSeek</span></label>
            {!redactedImage ? <ImageRedactor onPrepared={(file) => { setRedactedImage(file); setImagePreview(URL.createObjectURL(file)); setImageStep("select"); setFeedback({ kind: "info", text: "Ảnh đã được che và tái mã hóa trong trình duyệt. Sẵn sàng gửi DeepSeek đọc." }); }} onClear={() => { setRedactedImage(null); setImagePreview(""); }} /> : <>
              <div className="redacted-preview"><div className="redacted-preview-image" role="img" aria-label="Ảnh đã che được chuẩn bị trong trình duyệt" style={{ backgroundImage: `url("${imagePreview}")` }} /><button className="text-button" type="button" onClick={() => { setRedactedImage(null); setImagePreview(""); setImageStep("select"); setOcrText(""); setOcrConfirmed(false); }}>Chọn ảnh khác</button></div>
              {imageStep === "select" && <button className="secondary-button full-button" onClick={readUploadedImage} type="button" disabled={busy}><Upload size={16} /> Đọc ảnh đã che bằng DeepSeek</button>}
              {imageStep === "reading" && <div className="working-note"><LoaderCircle className="spin" size={16} /> DeepSeek đang đọc ảnh đã che…</div>}
              {imageStep === "review" && <div className="ocr-review"><div className="review-heading"><span className="step-number">03</span><strong>Đối chiếu chữ DeepSeek đọc được</strong><span className="review-warning"><CircleHelp size={14} /> Chưa được xác nhận</span></div><textarea className="ocr-textarea" value={ocrText} onChange={(event) => { setOcrText(event.target.value); setOcrConfirmed(false); }} aria-label="Bản đọc chữ từ ảnh, có thể chỉnh sửa" />{ocrNotes.length > 0 && <ul className="ocr-notes">{ocrNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>}<p className="micro-note">Đối chiếu với ảnh bên trên. Nếu có số tài khoản, OTP hoặc số điện thoại, hãy thay bằng ký hiệu trước khi xác nhận.</p><button className="secondary-button full-button" type="button" onClick={confirmOcr}><Check size={16} /> Tôi đã kiểm tra và xác nhận bản đọc</button></div>}
              {imageStep === "confirmed" && <div className="confirmed-box"><span className="confirmed-icon"><BadgeCheck size={18} /></span><div><strong>Bản đọc đã được xác nhận</strong><small>“{ocrText.slice(0, 150)}{ocrText.length > 150 ? "…" : ""}”</small></div><button className="text-button" onClick={() => { setImageStep("review"); setOcrConfirmed(false); }} type="button">Sửa bản đọc</button></div>}
              {imageStep === "confirmed" && <label className="field-label context-field">Ngữ cảnh bổ sung <span>Tùy chọn</span><textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} maxLength={1000} placeholder="Bạn được gửi ảnh trong hoàn cảnh nào?" /></label>}
            </>}
          </div> : <div className="input-fields">
            {type === "email" && <div className="email-fields"><label className="field-label">Người gửi <span>Tùy chọn</span><input value={sender} onChange={(e) => { setSender(e.target.value); setPrepared(false); }} placeholder="nguoigui@example.com" /></label><label className="field-label">Reply-To <span>Tùy chọn</span><input value={replyTo} onChange={(e) => { setReplyTo(e.target.value); setPrepared(false); }} placeholder="email phản hồi nếu có" /></label><label className="field-label span-two">Tiêu đề <span>Tùy chọn</span><input value={subject} onChange={(e) => { setSubject(e.target.value); setPrepared(false); }} placeholder="Tiêu đề email" /></label></div>}
            <label className="field-label" htmlFor="content-input">{type === "message" ? "Nội dung tin nhắn" : type === "email" ? "Nội dung email" : "Đường dẫn cần kiểm tra"}<span>{content.length.toLocaleString("vi-VN")} / 20.000</span></label>
            {!prepared && <textarea id="content-input" className="main-textarea" value={content} onChange={(e) => { setContent(e.target.value.slice(0, 20_000)); setPrepared(false); setAcknowledged(false); }} placeholder={type === "message" ? "Dán tin nhắn đáng ngờ vào đây…\n\nVí dụ: thông báo tài khoản, yêu cầu thanh toán, tin tuyển dụng" : type === "email" ? "Dán phần nội dung email cần kiểm tra…" : "Ví dụ: example.com/secure-account"} maxLength={20_000} />}
            {prepared && <div className="prepared-review"><div className="review-heading"><span className="step-number">02</span><strong>Xem lại bản sẽ gửi đến AI</strong><span className="review-warning"><ShieldCheck size={14} /> Đã chạy che tự động</span></div><textarea className="prepared-text" value={content} onChange={(event) => { setContent(event.target.value); setAcknowledged(false); }} aria-label="Nội dung đã che, có thể chỉnh sửa" rows={Math.min(8, Math.max(3, content.split("\n").length))} /><p className="micro-note">{foundSensitiveData ? "Hãy tự kiểm tra số tài khoản, tên riêng, thông tin thẻ, OTP và chi tiết khác mà công cụ có thể bỏ sót." : "Hãy tự kiểm tra lại toàn bộ nội dung trước khi gửi."}</p><label className="check-label"><input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} /><span>Tôi đã đối chiếu nội dung, xóa thông tin không muốn chia sẻ và muốn tiếp tục.</span></label></div>}
            <label className="field-label context-field">Ngữ cảnh bổ sung <span>Tùy chọn</span><textarea value={context} onChange={(e) => { setContext(e.target.value); setAcknowledged(false); }} rows={2} maxLength={1000} placeholder="Bạn được gửi nội dung này trong hoàn cảnh nào?" /></label>
            {prepared && <p className="micro-note">{hadAutoMask ? "Một số mẫu đã được che. Hãy tự kiểm tra thêm dữ liệu nhạy cảm có thể bị bỏ sót." : "Hãy tự kiểm tra lại toàn bộ nội dung trước khi gửi."}</p>}
            {!prepared && <button className="prepare-button full-button" type="button" onClick={prepareText}><ShieldCheck size={16} /> Xem trước nội dung đã che <ArrowRight size={15} /></button>}
          </div>}

          <div className="privacy-consent"><label className="check-label"><input type="checkbox" checked={privacyAcknowledged} onChange={(e) => setPrivacyAcknowledged(e.target.checked)} /><span>Tôi hiểu nội dung đã che sẽ được gửi đến DeepSeek API để phân tích và được xử lý theo điều khoản của nhà cung cấp. Tôi đã rà soát nội dung và có quyền chia sẻ dữ liệu này.</span></label><a href="/guide#privacy">Chính sách dữ liệu</a></div>
          {feedback && <div className={`feedback feedback-${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.kind === "error" ? <TriangleAlert size={16} /> : feedback.kind === "success" ? <Check size={16} /> : <CircleHelp size={16} />}{feedback.text}</div>}
          {type !== "image" && !prepared && <button className="primary-button full-button analyze-button" type="button" onClick={prepareText}><ShieldAlert size={17} /> Chuẩn bị kiểm tra <ArrowRight size={15} /></button>}
          {canAnalyze && <button className="primary-button full-button analyze-button" type="button" disabled={busy} onClick={analyze}>{busy ? <><LoaderCircle size={16} className="spin" /> Đang phân tích...</> : <><Sparkles size={16} /> Phân tích {typeLabels[type].toLocaleLowerCase("vi-VN")} <ArrowRight size={15} /></>}</button>}
          {!privacyAcknowledged && <p className="below-button-note"><LockKeyhole size={13} /> Nội dung chỉ được gửi sau khi bạn xem trước và đồng ý.</p>}
        </section>

        <aside className="side-panel">
          <div className="side-title"><div className="side-icon"><ShieldCheck size={19} /></div><div><strong>Mỗi cảnh báo đều có căn cứ</strong><small>ScamLens giúp bạn tự kiểm chứng.</small></div></div>
          <div className="side-divider" />
          <div className="assurance-list"><Assurance icon={<MessageCircle size={15} />} title="Chỉ ra dấu hiệu cụ thể" detail="Yêu cầu tiền, tạo áp lực, xin OTP…" /><Assurance icon={<FileText size={15} />} title="Trích dẫn từ nguồn" detail="Đọc lại câu chữ và đối chiếu bản gốc." /><Assurance icon={<Globe2 size={15} />} title="Nói rõ điều chưa biết" detail="Không tự mở đường dẫn hoặc xác minh người gửi." /><Assurance icon={<BookOpenText size={15} />} title="Hướng dẫn kiểm tra" detail="Thực hiện qua ứng dụng hoặc kênh bạn tin cậy." /></div>
          <div className="side-bottom"><span className="side-bottom-dot" /><span>Phân tích bảo mật, không phải kết luận pháp lý.</span><a href="/guide">Cách sử dụng <ArrowRight size={13} /></a></div>
        </aside>
      </div>
    </section>

    {report && <ReportView report={report} signedIn={signedIn} busy={busy} onSave={saveReport} onCopy={copyReport} copied={copied} />}

    <section className="how-section"><div className="section-kicker">ĐƯỢC THIẾT KẾ ĐỂ GIÚP BẠN BÌNH TĨNH</div><h2>Hiểu dấu hiệu. <span>Tự kiểm chứng.</span></h2><div className="steps-row"><Step number="01" title="Chia sẻ nội dung" detail="Dán tin nhắn hoặc email, nhập đường dẫn hay tải ảnh đã che." icon={<Upload size={18} />} /><div className="step-connector"><ArrowRight size={15} /></div><Step number="02" title="Xem bằng chứng" detail="Đọc từng dấu hiệu, trích dẫn gốc và phần chưa thể xác minh." icon={<CircleHelp size={18} />} /><div className="step-connector"><ArrowRight size={15} /></div><Step number="03" title="Kiểm tra độc lập" detail="Tạm dừng và tự liên hệ tổ chức qua ứng dụng chính thức." icon={<ShieldCheck size={18} />} /></div></section>
    <footer className="footer"><Link href="/" className="brand footer-brand"><span className="brand-mark"><Shield size={16} /></span><span className="brand-word">scamlens<span>.</span><small>AI</small></span></Link><span>Thận trọng với liên kết và yêu cầu chuyển tiền.</span><nav><Link href="/guide">Hướng dẫn</Link><Link href="/guide#privacy">Quyền riêng tư</Link><span>© 2026 ScamLens AI</span></nav></footer>
  </main>;
}

function Assurance({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div className="assurance-item"><span className="assurance-icon">{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><Check size={14} className="assurance-check" /></div>; }
function Step({ number, title, detail, icon }: { number: string; title: string; detail: string; icon: React.ReactNode }) { return <article className="step-card"><span className="step-card-icon">{icon}</span><span className="step-card-number">{number}</span><h3>{title}</h3><p>{detail}</p></article>; }

function ReportView({ report, signedIn, busy, onSave, onCopy, copied }: { report: AnalysisReport; signedIn: boolean; busy: boolean; onSave(): void; onCopy(): void; copied: boolean }) {
  const [expandedLimitations, setExpandedLimitations] = useState(false);
  const riskClass = `risk-${report.riskLevel}`;
  return <section className="report-section" aria-live="polite">
    <div className="report-header"><div><div className="section-kicker">KẾT QUẢ PHÂN TÍCH · {typeLabels[report.type]}</div><h2>Điều chúng tôi tìm thấy</h2></div><div className="report-actions"><button className="secondary-button" onClick={onCopy}><Copy size={15} /> {copied ? "Đã sao chép" : "Sao chép"}</button><button className="secondary-button" onClick={() => window.print()}><FileText size={15} /> In / lưu PDF</button></div></div>
    <div className={`risk-banner ${riskClass}`}><span className="risk-symbol">{report.riskLevel === "high" ? <ShieldAlert size={23} /> : report.riskLevel === "low" ? <ShieldCheck size={23} /> : <TriangleAlert size={23} />}</span><div className="risk-copy"><div className="risk-label">MỨC CẢNH BÁO</div><h3>{riskLabels[report.riskLevel]}</h3><p>{report.summary}</p></div><div className="report-meta"><span>{new Date(report.createdAt).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}</span><span>Model: {report.model.text}{report.model.image ? ` + ${report.model.image}` : ""}</span><span>{report.source.confirmedOcr ? "Bản đọc ảnh đã xác nhận" : "Nguồn người dùng cung cấp"}</span></div></div>
    {report.findings.length ? <div className="findings-list">{report.findings.map((finding, index) => <article className="finding-card" key={`${finding.category}-${finding.evidence}-${index}`}><div className="finding-top"><span className={`finding-index finding-${finding.severity}`}>{String(index + 1).padStart(2, "0")}</span><div className="finding-heading"><div><span className="category-label">{categoryLabels[finding.category]}</span><span className="severity-label">{finding.severity === "high" ? "Cao" : finding.severity === "medium" ? "Cần chú ý" : "Thấp"}</span></div><h3>{finding.title}</h3></div></div><blockquote className="evidence-quote"><span>“</span>{finding.evidence}<small>Trích từ nội dung bạn đã gửi</small></blockquote><p className="finding-explanation">{finding.explanation}</p></article>)}</div> : <div className="empty-findings"><ShieldCheck size={19} /><div><strong>Chưa tìm thấy dấu hiệu có bằng chứng trực tiếp.</strong><p>Điều này không xác nhận người gửi, website hay giao dịch là an toàn.</p></div></div>}
    <div className="report-lower-grid"><article className="checklist-card"><div className="result-card-heading"><span className="result-icon green"><BadgeCheck size={17} /></span><div><h3>Cách kiểm chứng an toàn</h3><p>Luôn tự mở kênh liên hệ chính thức.</p></div></div><ol>{report.checklist.map((item, i) => <li key={`${item}-${i}`}><span>{String(i + 1).padStart(2, "0")}</span>{item}</li>)}</ol><div className="never-do"><LockKeyhole size={15} /><strong>Không chia sẻ OTP, mật khẩu hoặc mã PIN</strong></div></article><article className="limits-card"><div className="result-card-heading"><span className="result-icon amber"><CircleHelp size={17} /></span><div><h3>Những điều chưa xác minh</h3><p>Thông tin từ AI không thay thế xác nhận độc lập.</p></div></div><ul>{(expandedLimitations ? report.limitations : report.limitations.slice(0, 3)).map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul>{report.limitations.length > 3 && <button className="text-button" onClick={() => setExpandedLimitations(!expandedLimitations)}>{expandedLimitations ? "Thu gọn" : `Xem thêm ${report.limitations.length - 3} giới hạn`} <ChevronDown size={14} /></button>}</article></div>
    <div className="source-disclosure"><div><strong><Fingerprint size={15} /> Nội dung không được lưu tự động</strong><span>Báo cáo chỉ lưu sau khi bạn chọn “Lưu vào lịch sử”. Ảnh gốc không được lưu.</span></div>{signedIn ? <button className="primary-button save-button" disabled={busy} onClick={onSave}>{busy ? <LoaderCircle size={15} className="spin" /> : <Clock3 size={15} />} {busy ? "Đang lưu..." : "Lưu vào lịch sử"}</button> : <a className="save-button secondary-button" href="/auth/login">Đăng nhập để lưu <ArrowRight size={14} /></a>}</div>
  </section>;
}
