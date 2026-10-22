"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Check,
  ChevronDown, CircleHelp, Clock3, Copy, FileImage, FileText, Fingerprint,
  Link2, LoaderCircle, LockKeyhole, Mail, MessageCircle,
  Shield, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert, Upload,
} from "lucide-react";
import { ImageRedactor } from "@/components/image-redactor";
import { ThemeToggle } from "@/components/theme-toggle";
import { TextSizeControl } from "@/components/text-size-control";
import { LogoutButton } from "@/components/logout-button";
import { countSensitiveMatches, redactSensitiveText } from "@/lib/analysis/redact";
import { demoCaseStudies } from "@/lib/analysis/case-studies";
import { detectLiveHeuristics } from "@/lib/analysis/heuristics";
import { reviewReceiptData } from "@/lib/analysis/receipt";
import type { ReceiptStructuredData } from "@/lib/analysis/schema";
import type { AnalysisReport, AnalyzeRequest } from "@/lib/analysis/schema";

type InputType = "message" | "email" | "image" | "url";
type Feedback = { kind: "error" | "success" | "info"; text: string } | null;
type Props = { signedIn: boolean; email: string | null; avatarUrl: string | null; authConfigured: boolean; authError?: boolean };

const types: Array<{ id: InputType; label: string; icon: typeof MessageCircle }> = [
  { id: "message", label: "Tin nhắn", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "image", label: "Ảnh chụp", icon: FileImage },
  { id: "url", label: "Đường dẫn", icon: Link2 },
];

const riskLabels = { low: "Chưa thấy dấu hiệu rõ", medium: "Có điểm cần kiểm tra", high: "Rủi ro cao", insufficient: "Chưa đủ thông tin" };
const typeLabels: Record<InputType, string> = { message: "Tin nhắn", email: "Email", image: "Ảnh chụp", url: "Đường dẫn" };
const receiptFieldLabels: Record<string, string> = {
  bankName: "Ngân hàng phát hành", amount: "Số tiền", amountInWords: "Số tiền bằng chữ",
  senderName: "Người chuyển", senderAccount: "Tài khoản người chuyển", recipientName: "Người nhận",
  recipientAccount: "Tài khoản người nhận", recipientBank: "Ngân hàng nhận", transactionTime: "Thời điểm ghi trên ảnh",
  referenceNumber: "Mã tham chiếu", transferType: "Loại chuyển khoản",
};
export function HomeApp({ signedIn, email, avatarUrl, authConfigured, authError = false }: Props) {
  const [type, setType] = useState<InputType>("message");
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [sender, setSender] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [autoRedact, setAutoRedact] = useState(true);
  const [demoCaseId, setDemoCaseId] = useState(demoCaseStudies[0].id);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copied, setCopied] = useState(false);
  const [redactedImage, setRedactedImage] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrNotes, setOcrNotes] = useState<string[]>([]);
  const [ocrStructured, setOcrStructured] = useState<ReceiptStructuredData | null>(null);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [imageStep, setImageStep] = useState<"select" | "reading" | "review" | "confirmed">("select");
  const [imagePreview, setImagePreview] = useState("");
  const redactedPayload = useMemo(() => ({
    content: autoRedact ? redactSensitiveText(content) : content,
    context: autoRedact ? redactSensitiveText(context) : context,
    sender: autoRedact ? redactSensitiveText(sender) : sender,
    replyTo: autoRedact ? redactSensitiveText(replyTo) : replyTo,
    subject: autoRedact ? redactSensitiveText(subject) : subject,
  }), [autoRedact, content, context, sender, replyTo, subject]);
  const detectedSensitiveCount = useMemo(() => countSensitiveMatches([content, context, sender, replyTo, subject].filter(Boolean).join("\n")), [content, context, sender, replyTo, subject]);
  const liveSourceText = [content, context, sender, replyTo, subject].filter(Boolean).join("\n");
  const liveSignals = useMemo(() => detectLiveHeuristics(liveSourceText), [liveSourceText]);
  const [settledSignals, setSettledSignals] = useState(liveSignals);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledSignals(liveSignals), 150);
    return () => window.clearTimeout(timeout);
  }, [liveSignals]);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const imageStageReady = imageStep === "confirmed" && ocrConfirmed && Boolean(ocrText.trim());
  const canAnalyze = type === "image" ? imageStageReady && privacyAcknowledged : Boolean(content.trim()) && privacyAcknowledged;

  function switchType(next: InputType) {
    setType(next); setContent(""); setSender(""); setReplyTo(""); setSubject(""); setContext("");
    setReport(null); setFeedback(null); setRedactedImage(null); setImagePreview("");
    setOcrText(""); setOcrNotes([]); setOcrStructured(null); setOcrConfirmed(false); setImageStep("select"); setPrivacyAcknowledged(false);
  }

  function loadDemo() {
    const item = demoCaseStudies.find((demo) => demo.id === demoCaseId) ?? demoCaseStudies[0];
    setType(item.type);
    setRedactedImage(null); setImagePreview("");
    setContent(item.content); setSender(item.sender ?? ""); setReplyTo(item.replyTo ?? ""); setSubject(item.subject ?? "");
    setContext("Tình huống tổng hợp giả lập để trình diễn; không phải vụ việc đã xác minh.");
    setReport(null); setPrivacyAcknowledged(false);
    if (item.type === "image") {
      setOcrText(item.content); setOcrNotes(["Bản đọc minh họa, không được trích từ ảnh thật."]);
      setOcrStructured(null);
      setOcrConfirmed(true); setImageStep("confirmed"); setFeedback({ kind: "info", text: "Đã nạp nội dung ảnh minh họa. Bấm phân tích để chạy AI hoặc bật Chế độ demo trong .env để xem báo cáo giả lập." });
    } else setFeedback({ kind: "info", text: "Đã nạp tình huống tổng hợp giả lập. Hãy rà soát dữ liệu sẽ gửi và đồng ý trước khi phân tích." });
    if (item.type !== "image") { setOcrText(""); setOcrNotes([]); setOcrStructured(null); setOcrConfirmed(false); setImageStep("select"); }
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
      setOcrStructured(result.structuredData ?? null);
      setImageStep("review"); setOcrConfirmed(false);
    } catch (error) {
      // OCR/provider failures should not discard the locally redacted image; the user can retry after fixing configuration.
      setImageStep("select"); setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Không đọc được ảnh." });
    } finally { setBusy(false); }
  }

  function confirmOcr() {
    if (!ocrText.trim()) { setFeedback({ kind: "error", text: "Bản đọc ảnh đang trống. Hãy thêm nội dung hoặc chọn ảnh khác." }); return; }
    setOcrText(redactSensitiveText(ocrText)); setOcrConfirmed(true); setImageStep("confirmed"); setPrivacyAcknowledged(false);
    setFeedback({ kind: "info", text: "Đã xác nhận bản đọc và che thêm các mẫu dữ liệu nhận diện được. Hãy kiểm tra lại trước khi gửi." });
  }

  async function analyze() {
    if (!canAnalyze) return;
    if (!privacyAcknowledged) { setFeedback({ kind: "error", text: "Vui lòng xác nhận trước khi gửi nội dung đến nhà cung cấp AI." }); return; }
    setBusy(true); setFeedback(null); setReport(null);
    try {
      const body: AnalyzeRequest = {
        type, content: type === "image" ? redactSensitiveText(ocrText) : redactedPayload.content,
        context: redactedPayload.context, sender: redactedPayload.sender, replyTo: redactedPayload.replyTo, subject: redactedPayload.subject,
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
    const findings = report.findings.length
      ? report.findings.map((finding, index) => `${index + 1}. ${finding.title}\n   Bằng chứng: “${finding.evidence}”\n   Vì sao cần lưu ý: ${finding.explanation}`)
      : ["Chưa thấy dấu hiệu có bằng chứng trực tiếp trong nội dung đã cung cấp."];
    const checklist = report.checklist.length
      ? report.checklist.map((item, index) => `${index + 1}. ${item}`)
      : ["Chưa có bước kiểm chứng cụ thể cho dữ liệu hiện tại."];
    const limitations = report.limitations.length
      ? report.limitations.map((item) => `• ${item}`)
      : ["Kết quả chỉ dựa trên nội dung bạn cung cấp; cần kiểm chứng qua kênh độc lập."];
    const text = [
      "SCAMLENS AI · BÁO CÁO PHÂN TÍCH",
      `Nguồn: ${typeLabels[report.type]}`,
      `Mức cảnh báo: ${riskLabels[report.riskLevel]}`,
      "",
      report.summary,
      "",
      "DẤU HIỆU CẦN LƯU Ý",
      ...findings,
      "",
      "CÁCH KIỂM CHỨNG AN TOÀN",
      ...checklist,
      "",
      "NHỮNG ĐIỀU CHƯA XÁC MINH",
      ...limitations,
      "",
      "Đây là phân tích hỗ trợ sàng lọc, không xác nhận danh tính, website hoặc giao dịch. Hãy tự kiểm chứng qua kênh chính thức.",
    ].join("\n");
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setFeedback({ kind: "error", text: "Trình duyệt chưa cho phép sao chép. Hãy dùng nút In / lưu PDF." }); }
  }

  return <main className="site-shell">
    <header className="topbar">
      <Link href="/" className="brand" aria-label="ScamLens AI trang chủ"><span className="brand-mark"><Shield size={20} strokeWidth={2.1} /><span className="brand-spark"><Sparkles size={10} /></span></span><span className="brand-word">scamlens<span>.</span><small>AI</small></span></Link>
      <nav className="top-nav" aria-label="Điều hướng chính"><Link className="nav-active" href="/#analyze">Phân tích</Link><Link href="/guide">Cách tự bảo vệ</Link><Link href="/guide#privacy">Quyền riêng tư</Link></nav>
      <div className="account-area"><TextSizeControl /><ThemeToggle />{signedIn ? <><Link className="account-link" href="/history"><Clock3 size={15} /> Lịch sử</Link><span className="account-email" title={email ?? undefined}>{email ?? "Đã đăng nhập"}</span><span className="user-avatar" title={`Đang đăng nhập: ${email ?? "tài khoản Google"}`} aria-label={`Tài khoản ${email ?? "Google"}`}>{avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer" /> : email?.[0]?.toUpperCase() ?? "U"}</span><LogoutButton /></> : authConfigured ? <a href="/auth/login" className="sign-in"><span className="google-g">G</span> Đăng nhập <ArrowUpRight size={14} /></a> : <span className="setup-state"><span /> Cấu hình đăng nhập sau</span>}</div>
    </header>
    {authError && <p className="feedback feedback-error" role="alert">Chưa hoàn tất đăng nhập Google. Hãy bắt đầu đăng nhập lại trên cùng domain. Nếu vẫn lỗi, kiểm tra URL callback trong cấu hình Supabase.</p>}

    <section className="hero" id="analyze">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot live-radar-dot" /> TRỢ LÝ AN TOÀN SỐ</div><h1>Tin nhắn này có<br /><span>đáng tin không?</span></h1><p className="hero-lede">Xem dấu hiệu đáng ngờ và cách tự kiểm tra trước khi làm theo.</p></div>
      <div className="hero-threat-terminal quick-start" aria-label="Ba bước kiểm tra"><h2>Bắt đầu trong 3 bước</h2><ol><li><span>1</span><p><strong>Chọn loại nội dung</strong><small>Tin nhắn, email, ảnh hoặc đường dẫn</small></p></li><li><span>2</span><p><strong>Rà soát thông tin</strong><small>Che dữ liệu riêng tư trước khi gửi</small></p></li><li><span>3</span><p><strong>Đọc bằng chứng</strong><small>Tự xác minh qua kênh chính thức</small></p></li></ol></div>
    </section>

    <section className="workspace" aria-label="Công cụ phân tích">
      <div className="workspace-heading"><div><div className="section-kicker">BẮT ĐẦU KIỂM TRA</div><h2>Bạn nhận được điều gì đáng ngờ?</h2></div><div className="demo-picker"><label className="sr-only" htmlFor="demo-case-select">Chọn tình huống minh họa</label><select id="demo-case-select" value={demoCaseId} onChange={(event) => setDemoCaseId(event.target.value)}>{demoCaseStudies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button className="demo-button" type="button" onClick={loadDemo}><Sparkles size={15} /> Nạp tình huống <ArrowRight size={14} /></button></div></div>
      <div className="analysis-grid">
        <section className="input-panel">
          <div className="panel-label-row"><span className="panel-label"><span className="step-number">01</span> Chọn nội dung cần kiểm tra</span></div>
          <div className="type-tabs" role="tablist" aria-label="Loại dữ liệu cần phân tích">{types.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={type === id} className={`type-tab ${type === id ? "selected" : ""}`} type="button" onClick={() => switchType(id)}><Icon size={16} strokeWidth={1.8} /><span>{label}</span></button>)}</div>

          {type === "image" ? <div className="input-fields image-fields">
            <label className="field-heading"><span className="step-number">02</span> Che dữ liệu rồi đọc ảnh <span className="optional">Dùng AI</span></label>
            {!redactedImage ? <ImageRedactor onPrepared={(file) => { setRedactedImage(file); setImagePreview(URL.createObjectURL(file)); setImageStep("select"); setFeedback({ kind: "info", text: "Ảnh đã được che và tái mã hóa trong trình duyệt. Sẵn sàng gửi AI đọc." }); }} onClear={() => { setRedactedImage(null); setImagePreview(""); }} /> : <>
              <div className="redacted-preview"><div className="redacted-preview-image" role="img" aria-label="Ảnh đã che được chuẩn bị trong trình duyệt" style={{ backgroundImage: `url("${imagePreview}")` }} /><button className="text-button" type="button" onClick={() => { setRedactedImage(null); setImagePreview(""); setImageStep("select"); setOcrText(""); setOcrConfirmed(false); }}>Chọn ảnh khác</button></div>
              {imageStep === "select" && <button className="secondary-button full-button" onClick={readUploadedImage} type="button" disabled={busy}><Upload size={16} /> Đọc ảnh đã che bằng AI</button>}
              {imageStep === "reading" && <div className="working-note loading-shimmer"><LoaderCircle className="spin" size={16} /> AI đang đọc ảnh đã che…</div>}
              {imageStep === "review" && <div className="ocr-review"><div className="review-heading"><span className="step-number">03</span><strong>Đối chiếu nội dung AI nhận diện</strong><span className="review-warning"><CircleHelp size={14} /> Chưa được xác nhận</span></div><textarea className="ocr-textarea" value={ocrText} onChange={(event) => { setOcrText(event.target.value); setOcrConfirmed(false); setPrivacyAcknowledged(false); }} aria-label="Bản đọc chữ từ ảnh, có thể chỉnh sửa" />{ocrStructured && <div className="ocr-structured"><strong>Trường biên lai được nhận diện — hãy đối chiếu thủ công</strong><dl>{Object.entries(ocrStructured).filter(([key, value]) => key !== "inconsistencies" && key !== "transferType" && value !== undefined && value !== "").map(([key, value]) => <div key={key}><dt>{receiptFieldLabels[key] ?? key}</dt><dd>{key === "amount" && typeof value === "number" ? `${value.toLocaleString("vi-VN")} ₫` : String(value)}</dd></div>)}</dl>{reviewReceiptData(ocrStructured, ocrText).length > 0 && <ul className="ocr-notes">{reviewReceiptData(ocrStructured, ocrText).map((note, i) => <li key={i}>{note}</li>)}</ul>}</div>}{ocrNotes.length > 0 && <ul className="ocr-notes">{ocrNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>}<p className="micro-note">Đối chiếu với ảnh bên trên. Nếu có số tài khoản, OTP hoặc số điện thoại, hãy thay bằng ký hiệu trước khi xác nhận.</p><button className="secondary-button full-button" type="button" onClick={confirmOcr}><Check size={16} /> Tôi đã kiểm tra và xác nhận bản đọc</button></div>}
              {imageStep === "confirmed" && <div className="confirmed-box"><span className="confirmed-icon"><BadgeCheck size={18} /></span><div><strong>Bản đọc đã được xác nhận</strong><small>“{ocrText.slice(0, 150)}{ocrText.length > 150 ? "…" : ""}”</small></div><button className="text-button" onClick={() => { setImageStep("review"); setOcrConfirmed(false); setPrivacyAcknowledged(false); }} type="button">Sửa bản đọc</button></div>}
              {imageStep === "confirmed" && <label className="field-label context-field">Ngữ cảnh bổ sung <span>Tùy chọn</span><textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} maxLength={1000} placeholder="Bạn được gửi ảnh trong hoàn cảnh nào?" /></label>}
            </>}
          </div> : <div className="input-fields">
            {type === "email" && <div className="email-fields"><label className="field-label">Người gửi <span>Tùy chọn</span><input value={sender} onChange={(e) => { setSender(e.target.value); setPrivacyAcknowledged(false); }} placeholder="nguoigui@example.com" /></label><label className="field-label">Reply-To <span>Tùy chọn</span><input value={replyTo} onChange={(e) => { setReplyTo(e.target.value); setPrivacyAcknowledged(false); }} placeholder="email phản hồi nếu có" /></label><label className="field-label span-two">Tiêu đề <span>Tùy chọn</span><input value={subject} onChange={(e) => { setSubject(e.target.value); setPrivacyAcknowledged(false); }} placeholder="Tiêu đề email" /></label></div>}
            <label className="field-label" htmlFor="content-input">{type === "message" ? "Nội dung tin nhắn" : type === "email" ? "Nội dung email" : "Đường dẫn cần kiểm tra"}<span>{content.length.toLocaleString("vi-VN")} / 20.000</span></label>
            <textarea id="content-input" className="main-textarea" value={content} onChange={(e) => { setContent(e.target.value.slice(0, 20_000)); setPrivacyAcknowledged(false); }} placeholder={type === "message" ? "Dán tin nhắn đáng ngờ vào đây…\n\nVí dụ: thông báo tài khoản, yêu cầu thanh toán, tin tuyển dụng" : type === "email" ? "Dán phần nội dung email cần kiểm tra…" : "Ví dụ: example.com/secure-account"} maxLength={20_000} />
            <label className="field-label context-field">Ngữ cảnh bổ sung <span>Tùy chọn · cũng sẽ được gửi</span><textarea value={context} onChange={(e) => { setContext(e.target.value); setPrivacyAcknowledged(false); }} rows={2} maxLength={1000} placeholder="Bạn được gửi nội dung này trong hoàn cảnh nào?" /></label>
            <div className="inline-privacy-toolbar"><label className="switch-label"><input type="checkbox" role="switch" checked={autoRedact} onChange={(event) => { setAutoRedact(event.target.checked); setPrivacyAcknowledged(false); }} /><span>Tự động che mẫu nhạy cảm</span></label><span>{!autoRedact ? "Đang tắt" : detectedSensitiveCount ? `Phát hiện: ${detectedSensitiveCount} mục` : "Chưa phát hiện mẫu phổ biến"}</span></div>
            <details className="payload-preview"><summary>Xem nội dung sẽ gửi</summary><pre>{[redactedPayload.sender && `Người gửi: ${redactedPayload.sender}`, redactedPayload.replyTo && `Reply-To: ${redactedPayload.replyTo}`, redactedPayload.subject && `Tiêu đề: ${redactedPayload.subject}`, redactedPayload.content, redactedPayload.context && `Ngữ cảnh: ${redactedPayload.context}`].filter(Boolean).join("\n")}</pre><p className="micro-note">Tự động che chỉ nhận diện một số mẫu như email, số điện thoại, OTP dạng số và chuỗi số dài. Hãy tự rà soát tên riêng, địa chỉ và dữ liệu nhạy cảm còn lại.</p></details>
          </div>}

          <div className="privacy-consent"><label className="check-label"><input type="checkbox" checked={privacyAcknowledged} onChange={(e) => setPrivacyAcknowledged(e.target.checked)} /><span>Tôi đã rà soát nội dung và đồng ý gửi phần hiển thị ở “Xem nội dung sẽ gửi” đến nhà cung cấp AI để phân tích.</span></label><a href="/guide#privacy">Chính sách dữ liệu</a></div>
          {feedback && <div className={`feedback feedback-${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.kind === "error" ? <TriangleAlert size={16} /> : feedback.kind === "success" ? <Check size={16} /> : <CircleHelp size={16} />}{feedback.text}</div>}
          <button className="primary-button full-button analyze-button" type="button" disabled={!canAnalyze || busy} onClick={analyze}>{busy ? <span className="loading-shimmer"><LoaderCircle size={16} className="spin" /> Đang phân tích...</span> : <><Sparkles size={16} /> Quét dấu hiệu lừa đảo ngay <ArrowRight size={15} /></>}</button>
          {!privacyAcknowledged && <p className="below-button-note"><LockKeyhole size={13} /> Nội dung chỉ được gửi sau khi bạn đồng ý.</p>}
        </section>

        <aside className="side-panel live-sensor-panel" aria-live="polite">
          <div className="side-title"><div className="side-icon"><ShieldCheck size={19} /></div><div><strong>Cảm biến nội dung cục bộ</strong><small>Chỉ phân tích khi bạn bấm nút gửi.</small></div><span className="radar-status"><i /> SẴN SÀNG</span></div>
          <div className="side-divider" />
          {settledSignals.length ? <ul className="sensor-list">{settledSignals.map((signal) => <li key={signal.id}><span className={`sensor-dot sensor-${signal.id}`} /><span><strong>{signal.label}</strong><small>“{signal.evidence}” · dấu hiệu cần xem xét</small></span></li>)}</ul> : <div className="sensor-empty"><ShieldCheck size={19} /><span>Chưa thấy mẫu phổ biến trong nội dung hiện tại.</span></div>}
          <p className="sensor-limit">Quy tắc này có thể bỏ sót hoặc nhận nhầm; nó không xác định nội dung an toàn hay lừa đảo.</p>
          <div className="side-bottom"><span>Không gửi dữ liệu trong lúc cảm biến hoạt động.</span><a href="/guide">Cách sử dụng <ArrowRight size={13} /></a></div>
        </aside>
      </div>
    </section>

    {report && <ReportView report={report} signedIn={signedIn} busy={busy} onSave={saveReport} onCopy={copyReport} copied={copied} />}


    <footer className="footer"><Link href="/" className="brand footer-brand"><span className="brand-mark"><Shield size={16} /></span><span className="brand-word">scamlens<span>.</span><small>AI</small></span></Link><span>Thận trọng với liên kết và yêu cầu chuyển tiền.</span><nav><Link href="/guide">Hướng dẫn</Link><Link href="/guide#privacy">Quyền riêng tư</Link><span>© 2026 ScamLens AI</span></nav></footer>
  </main>;
}

function ReportView({ report, signedIn, busy, onSave, onCopy, copied }: { report: AnalysisReport; signedIn: boolean; busy: boolean; onSave(): void; onCopy(): void; copied: boolean }) {
  const [expandedLimitations, setExpandedLimitations] = useState(false);
  const checklistKey = `scamlens-checklist-${report.id}`;
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved: unknown = JSON.parse(window.localStorage.getItem(checklistKey) || "[]");
        setCheckedItems(Array.isArray(saved) && saved.every((item) => typeof item === "string") ? saved : []);
      } catch { setCheckedItems([]); }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [checklistKey]);
  const riskClass = `risk-${report.riskLevel}`;
  const dimensions: Array<{ label: string; categories: string[] }> = [
    { label: "Áp lực thời gian", categories: ["urgency"] },
    { label: "Mạo danh", categories: ["impersonation"] },
    { label: "Dụ chuyển tiền", categories: ["money_request"] },
    { label: "Dữ liệu xác thực", categories: ["secret_request"] },
  ];
  function toggleChecklist(item: string) {
    const next = checkedItems.includes(item) ? checkedItems.filter((value) => value !== item) : [...checkedItems, item];
    setCheckedItems(next);
    try { window.localStorage.setItem(checklistKey, JSON.stringify(next)); } catch { /* Checklist remains usable for this page view. */ }
  }
  return <section className="report-section" aria-live="polite">
    <div className="report-header"><div><div className="section-kicker">KẾT QUẢ PHÂN TÍCH · {typeLabels[report.type]}</div><h2>Điều chúng tôi tìm thấy</h2></div><div className="report-actions"><button className="secondary-button" onClick={onCopy}><Copy size={15} /> {copied ? "Đã sao chép" : "Sao chép"}</button><button className="secondary-button" onClick={() => window.print()}><FileText size={15} /> In / lưu PDF</button></div></div>
    <div className={`risk-banner ${riskClass}`}><span className="risk-symbol">{report.riskLevel === "high" ? <ShieldAlert size={23} /> : report.riskLevel === "low" ? <ShieldCheck size={23} /> : <TriangleAlert size={23} />}</span><div className="risk-copy"><div className="risk-label">MỨC CẢNH BÁO</div><h3>{riskLabels[report.riskLevel]}</h3><p>{report.summary}</p></div><div className="report-meta"><span>{new Date(report.createdAt).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}</span><span>{report.model.text === "demo-rules" ? "Kết quả minh họa" : "Được phân tích bằng AI"}</span><span>{report.source.confirmedOcr ? "Bản đọc ảnh đã xác nhận" : "Nguồn người dùng cung cấp"}</span></div></div>
    {report.findings.length > 0 && <div className="contextual-source"><div className="result-card-heading"><span className="result-icon blue"><MessageCircle size={17} /></span><div><h3>Nội dung trong ngữ cảnh</h3><p>Phần được tô sáng khớp với trích dẫn trong từng phát hiện.</p></div></div><p className="source-highlight-text">{segmentSource(report.source.content, report.findings).map((segment, index) => segment.finding ? <mark className={`evidence-mark severity-${segment.finding.severity}`} key={index} title={`${segment.finding.title}: ${segment.finding.explanation}`}>{segment.text}</mark> : <span key={index}>{segment.text}</span>)}</p></div>}
    <div className="manipulation-gauge"><div className="result-card-heading"><span className="result-icon amber"><TriangleAlert size={17} /></span><div><h3>Nhóm dấu hiệu được trích dẫn</h3><p>Đây là bộ lọc nội dung đơn giản, không phải phép đo tâm lý hay xác suất.</p></div></div><div className="gauge-grid">{dimensions.map((dimension) => { const found = report.findings.some((finding) => dimension.categories.includes(finding.category)); return <div className="gauge-row" key={dimension.label}><span>{dimension.label}</span><span className="gauge-track"><i className={found ? "gauge-found" : ""} /></span><small>{found ? "Có trích dẫn" : "Chưa phát hiện"}</small></div>; })}</div></div>
    <div className="report-lower-grid"><article className="checklist-card"><div className="result-card-heading"><span className="result-icon green"><BadgeCheck size={17} /></span><div><h3>Cách kiểm chứng an toàn</h3><p>Đánh dấu các bước đã hoàn tất trên thiết bị này.</p></div></div><ul className="interactive-checklist">{report.checklist.map((item, i) => <li key={`${item}-${i}`}><label><input type="checkbox" checked={checkedItems.includes(item)} onChange={() => toggleChecklist(item)} /><span>{item}</span></label></li>)}</ul><div className="never-do"><LockKeyhole size={15} /><strong>Không chia sẻ OTP, mật khẩu hoặc mã PIN</strong></div></article><article className="limits-card"><div className="result-card-heading"><span className="result-icon amber"><CircleHelp size={17} /></span><div><h3>Những điều chưa xác minh</h3><p>Thông tin từ AI không thay thế xác nhận độc lập.</p></div></div><ul>{(expandedLimitations ? report.limitations : report.limitations.slice(0, 3)).map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul>{report.limitations.length > 3 && <button className="text-button" onClick={() => setExpandedLimitations(!expandedLimitations)}>{expandedLimitations ? "Thu gọn" : `Xem thêm ${report.limitations.length - 3} giới hạn`} <ChevronDown size={14} /></button>}</article></div>
    <div className="source-disclosure"><div><strong><Fingerprint size={15} /> Nội dung không được lưu tự động</strong><span>Báo cáo chỉ lưu sau khi bạn chọn “Lưu vào lịch sử”. Ảnh gốc không được lưu.</span></div>{signedIn ? <button className="primary-button save-button" disabled={busy} onClick={onSave}>{busy ? <LoaderCircle size={15} className="spin" /> : <Clock3 size={15} />} {busy ? "Đang lưu..." : "Lưu vào lịch sử"}</button> : <a className="save-button secondary-button" href="/auth/login">Đăng nhập để lưu <ArrowRight size={14} /></a>}</div>
  </section>;
}

function segmentSource(source: string, findings: AnalysisReport["findings"]) {
  const ranges = findings.flatMap((finding) => finding.evidenceRefs.map((ref) => ({ start: ref.start, end: ref.end, finding })))
    .filter((range) => range.start >= 0 && range.end <= source.length && range.end > range.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const segments: Array<{ text: string; finding?: AnalysisReport["findings"][number] }> = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor) segments.push({ text: source.slice(cursor, range.start) });
    segments.push({ text: source.slice(range.start, range.end), finding: range.finding });
    cursor = range.end;
  }
  if (cursor < source.length) segments.push({ text: source.slice(cursor) });
  return segments;
}
