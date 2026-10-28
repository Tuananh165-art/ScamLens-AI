"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Check,
  ChevronDown, CircleHelp, Clock3, Copy, ExternalLink, FileImage, FileText, Fingerprint,
  Link2, LoaderCircle, LockKeyhole, Mail, MessageCircle, PhoneCall,
  Shield, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert, Zap,
} from "lucide-react";
import { ImageRedactor } from "@/components/image-redactor";
import { JevAssessmentCard } from "@/components/jev-assessment-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { redactSensitiveText } from "@/lib/analysis/redact";
import { demoCaseStudies } from "@/lib/analysis/case-studies";
import { detectLiveHeuristics } from "@/lib/analysis/heuristics";
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
export function HomeApp({ signedIn, email, avatarUrl, authConfigured, authError = false }: Props) {
  const [type, setType] = useState<InputType>("message");
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [sender, setSender] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [jevAvailable, setJevAvailable] = useState(false);
  const [useJev, setUseJev] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [copied, setCopied] = useState(false);
  const [redactedImage, setRedactedImage] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [imageStep, setImageStep] = useState<"select" | "reading" | "confirmed">("select");
  const [imageMode, setImageMode] = useState<"quick" | "step">("quick");
  const reportRef = useRef<HTMLElement>(null);
  const demoPickerRef = useRef<HTMLDivElement>(null);
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => {
        if (!active) return;
        const available = body?.services?.jev === true;
        setJevAvailable(available);
        if (!available) setUseJev(false);
      })
      .catch(() => { if (active) { setJevAvailable(false); setUseJev(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoPickerRef.current && !demoPickerRef.current.contains(event.target as Node)) {
        setIsDemoDropdownOpen(false);
      }
    }
    if (isDemoDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDemoDropdownOpen]);

  useEffect(() => {
    if (report && reportRef.current) {
      const timer = window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, [report]);
  const redactedPayload = useMemo(() => ({
    content: redactSensitiveText(content),
    context: redactSensitiveText(context),
    sender: redactSensitiveText(sender),
    replyTo: redactSensitiveText(replyTo),
    subject: redactSensitiveText(subject),
  }), [content, context, sender, replyTo, subject]);
  const liveSourceText = [content, context, sender, replyTo, subject].filter(Boolean).join("\n");
  const liveSignals = useMemo(() => detectLiveHeuristics(liveSourceText), [liveSourceText]);
  const [settledSignals, setSettledSignals] = useState(liveSignals);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledSignals(liveSignals), 150);
    return () => window.clearTimeout(timeout);
  }, [liveSignals]);
  const canAnalyze = type === "image"
    ? (imageMode === "quick" ? Boolean(redactedImage) : (Boolean(ocrText.trim()) && ocrConfirmed))
    : Boolean(content.trim());

  function switchType(next: InputType) {
    setType(next); setContent(""); setSender(""); setReplyTo(""); setSubject(""); setContext("");
    setReport(null); setFeedback(null); setRedactedImage(null); setUseJev(false);
    setOcrText(""); setOcrConfirmed(false); setImageStep("select"); setImageMode("quick");
  }

  function loadDemo(caseItem?: (typeof demoCaseStudies)[0]) {
    const item = caseItem ?? demoCaseStudies[0];
    setUseJev(false);
    setType(item.type);
    setRedactedImage(null);
    setContent(item.content); setSender(item.sender ?? ""); setReplyTo(item.replyTo ?? ""); setSubject(item.subject ?? "");
    setContext("Tình huống tổng hợp giả lập để trình diễn; không phải vụ việc đã xác minh.");
    setReport(null);
    if (item.type === "image") {
      setOcrText(item.content);
      setOcrConfirmed(true);
      setImageStep("confirmed");
      setImageMode("step");
      setFeedback({ kind: "info", text: `Đã nạp tình huống mẫu: "${item.label}". Bấm Quét để chạy AI hoặc bật Chế độ demo trong .env.` });
    } else setFeedback({ kind: "info", text: `Đã nạp tình huống mẫu: "${item.label}". Hãy rà soát nội dung trước khi bấm Quét.` });
    if (item.type !== "image") { setOcrText(""); setOcrConfirmed(false); setImageStep("select"); }
    setIsDemoDropdownOpen(false);
  }

  async function readImageOcr() {
    if (!redactedImage) return;
    setImageStep("reading");
    setFeedback(null);
    try {
      const form = new FormData();
      form.set("image", redactedImage);
      const ocrResponse = await fetch("/api/ocr", { method: "POST", body: form, cache: "no-store" });
      const ocrResult = await ocrResponse.json();
      if (!ocrResponse.ok) throw new Error(ocrResult.error || "Không đọc được ảnh.");
      const text = String(ocrResult.text ?? "").trim();
      if (!text) throw new Error("Chưa đọc được chữ trong ảnh. Hãy chọn ảnh rõ hơn rồi thử lại.");
      setOcrText(text);
      setImageStep("confirmed");
      setOcrConfirmed(true);
      setFeedback({ kind: "info", text: "Đã đọc xong chữ trong ảnh. Bạn có thể xem lại hoặc sửa nếu cần." });
    } catch (err) {
      setImageStep("select");
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Không đọc được ảnh." });
    }
  }

  async function analyze() {
    if (!canAnalyze) return;
    setBusy(true); setFeedback(null); setReport(null);
    try {
      let analysisContent = ocrText;
      let confirmedOcr = ocrConfirmed;
      if (type === "image" && imageMode === "quick" && redactedImage) {
        setImageStep("reading");
        const form = new FormData(); form.set("image", redactedImage);
        const ocrResponse = await fetch("/api/ocr", { method: "POST", body: form, cache: "no-store" });
        const ocrResult = await ocrResponse.json();
        if (!ocrResponse.ok) throw new Error(ocrResult.error || "Không đọc được ảnh.");
        if (!String(ocrResult.text ?? "").trim()) throw new Error("AI chưa đọc được nội dung trong ảnh. Hãy chọn ảnh rõ hơn rồi thử lại.");
        analysisContent = String(ocrResult.text);
        confirmedOcr = false;
        setOcrText(analysisContent); setOcrConfirmed(false); setImageStep("select");
      }
      const body: AnalyzeRequest = {
        type, content: type === "image" ? redactSensitiveText(analysisContent) : redactedPayload.content,
        context: redactedPayload.context, sender: redactedPayload.sender, replyTo: redactedPayload.replyTo, subject: redactedPayload.subject,
        confirmedOcr: type === "image" && confirmedOcr,
        includeJev: useJev,
      };
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không phân tích được nội dung.");
      setReport(result.report); setFeedback(result.demo ? { kind: "info", text: "Báo cáo đang ở chế độ demo; AI chưa được gọi." } : { kind: "success", text: "Đã phân tích xong. Hãy xem từng trích dẫn trước khi quyết định." });
    } catch (error) { setImageStep("select"); setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Không phân tích được nội dung." }); }
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
      ...(report.jev?.status === "complete" ? ["", "TÍN HIỆU BỔ SUNG TỪ JEV", ...report.jev.signals.map((signal) => `${signal.id}: ${Math.round(signal.probability * 100)}% (${signal.result})`)] : []),
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
      <div className="account-area"><ThemeToggle />{signedIn ? <><Link className="account-link" href="/history"><Clock3 size={15} /> Lịch sử</Link><span className="account-email" title={email ?? undefined}>{email ?? "Đã đăng nhập"}</span><span className="user-avatar" title={`Đang đăng nhập: ${email ?? "tài khoản Google"}`} aria-label={`Tài khoản ${email ?? "Google"}`}>{avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer" /> : email?.[0]?.toUpperCase() ?? "U"}</span><LogoutButton /></> : authConfigured ? <a href="/auth/login" className="sign-in"><span className="google-g">G</span> Đăng nhập <ArrowUpRight size={14} /></a> : <span className="setup-state"><span /> Cấu hình đăng nhập sau</span>}</div>
    </header>
    {authError && <p className="feedback feedback-error" role="alert">Chưa hoàn tất đăng nhập Google. Hãy bắt đầu đăng nhập lại trên cùng domain. Nếu vẫn lỗi, kiểm tra URL callback trong cấu hình Supabase.</p>}

    <section className="hero" id="analyze">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot live-radar-dot" /> TRỢ LÝ AN TOÀN SỐ</div><h1>Thông tin này có<br /><span>đáng tin không?</span></h1><p className="hero-lede">Xem dấu hiệu đáng ngờ và cách tự kiểm tra trước khi làm theo.</p></div>
      <div className="hero-threat-terminal quick-start" aria-label="Ba bước kiểm tra"><h2>Bắt đầu trong 3 bước</h2><ol><li><span>1</span><p><strong>Chọn loại nội dung</strong><small>Tin nhắn, email, ảnh hoặc đường dẫn</small></p></li><li><span>2</span><p><strong>Rà soát thông tin</strong><small>Che dữ liệu riêng tư trước khi gửi</small></p></li><li><span>3</span><p><strong>Đọc bằng chứng</strong><small>Tự xác minh qua kênh chính thức</small></p></li></ol></div>
    </section>

    <section className="workspace" aria-label="Công cụ phân tích">
      <div className="workspace-heading">
        <div>
          <div className="section-kicker">BẮT ĐẦU KIỂM TRA</div>
          <h2>Bạn nhận được thông tin gì đáng ngờ?</h2>
        </div>
        <div className="demo-picker" ref={demoPickerRef}>
          <button
            className={`demo-button ${isDemoDropdownOpen ? "is-open" : ""}`}
            type="button"
            aria-expanded={isDemoDropdownOpen}
            aria-haspopup="listbox"
            onClick={() => setIsDemoDropdownOpen((prev) => !prev)}
          >
            <Sparkles size={15} /> Thử tình huống mẫu <ChevronDown size={14} className={`dropdown-chevron ${isDemoDropdownOpen ? "rotate" : ""}`} />
          </button>
          {isDemoDropdownOpen && (
            <div className="demo-dropdown-menu" role="listbox" aria-label="Danh sách tình huống giả lập">
              <div className="demo-dropdown-header">
                <strong>Tình huống điều tra mẫu</strong>
                <small>Dữ liệu tổng hợp giả lập phổ biến trong thực tế</small>
              </div>
              <div className="demo-dropdown-list">
                {demoCaseStudies.map((c) => {
                  const CaseIcon = c.type === "message" ? MessageCircle : c.type === "email" ? Mail : c.type === "url" ? Link2 : FileImage;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="demo-dropdown-item"
                      onClick={() => loadDemo(c)}
                    >
                      <span className={`case-type-icon type-${c.type}`}>
                        <CaseIcon size={14} />
                      </span>
                      <div className="case-info">
                        <span className="case-label">{c.label}</span>
                        <span className="case-snippet">{c.content.replace(/\[TÌNH HUỐNG GIẢ LẬP[^\]]*\]\s*/g, "").slice(0, 70)}…</span>
                      </div>
                      <span className={`case-badge badge-${c.type}`}>
                        {c.type === "message" ? "Tin nhắn" : c.type === "email" ? "Email" : c.type === "url" ? "Liên kết" : "Biên lai"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="analysis-grid">
        <section className="input-panel">
          <div className="panel-label-row"><span className="panel-label"><span className="step-number">01</span> Chọn nội dung cần kiểm tra</span></div>
          <div className="type-tabs" role="tablist" aria-label="Loại dữ liệu cần phân tích">{types.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={type === id} className={`type-tab ${type === id ? "selected" : ""}`} type="button" onClick={() => switchType(id)}><Icon size={16} strokeWidth={1.8} /><span>{label}</span></button>)}</div>

          {type === "image" ? <div className="input-fields image-fields">
            <div className="flow-mode-switch" role="radiogroup" aria-label="Cách thức kiểm tra">
              <button
                type="button"
                role="radio"
                aria-checked={imageMode === "quick"}
                className={`flow-mode-btn ${imageMode === "quick" ? "active" : ""}`}
                onClick={() => { setImageMode("quick"); setUseJev(false); }}
              >
                <Zap size={14} /> Quét nhanh
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={imageMode === "step"}
                className={`flow-mode-btn ${imageMode === "step" ? "active" : ""}`}
                onClick={() => setImageMode("step")}
              >
                <FileText size={14} /> Kiểm tra từng bước
              </button>
            </div>

            <ImageRedactor
              onPrepared={(file) => { setRedactedImage(file); setUseJev(false); }}
              onClear={() => { setRedactedImage(null); setOcrText(""); setOcrConfirmed(false); setImageStep("select"); }}
            />

            {imageMode === "quick" ? (
              <p className="flow-mode-hint">
                Hệ thống sẽ tự động đọc chữ và phân tích ngay khi bạn bấm nút Quét bên dưới.
              </p>
            ) : (
              <div className="step-mode-box">
                {imageStep !== "confirmed" ? (
                  <div className="step-mode-action-row">
                    <div>
                      <strong>Đọc chữ trong ảnh</strong>
                      <p>Hệ thống sẽ trích xuất chữ để bạn đọc lại trước khi phân tích.</p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!redactedImage || busy || imageStep === "reading"}
                      onClick={readImageOcr}
                    >
                      {imageStep === "reading" ? <><LoaderCircle size={15} className="spin" /> Đang đọc chữ...</> : <><FileText size={15} /> Đọc chữ trong ảnh</>}
                    </button>
                  </div>
                ) : (
                  <div className="step-mode-review">
                    <div className="step-mode-review-header">
                      <strong>Chữ đọc được từ ảnh</strong>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => { setImageStep("select"); setOcrConfirmed(false); setUseJev(false); }}
                      >
                        Đọc lại từ ảnh
                      </button>
                    </div>
                    <textarea
                      id="ocr-text-input"
                      className="main-textarea font-mono"
                      rows={5}
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      placeholder="Chữ đọc được từ ảnh..."
                    />
                    <label className="check-label" style={{ marginTop: "10px" }}>
                      <input
                        type="checkbox"
                        checked={ocrConfirmed}
                        onChange={(e) => { setOcrConfirmed(e.target.checked); if (!e.target.checked) setUseJev(false); }}
                      />
                      <span>Tôi đã kiểm tra chữ trong ảnh này là chính xác</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {imageStep === "reading" && imageMode === "quick" && (
              <div className="working-note loading-shimmer">
                <LoaderCircle className="spin" size={16} /> AI đang đọc và phân tích ảnh đã che…
              </div>
            )}
          </div> : <div className={`input-fields ${type === "email" ? "email-input-fields" : ""}`}>
            {type === "email" && (
              <div className="email-envelope-box">
                <div className="email-envelope-header">
                  <span className="email-envelope-icon"><Mail size={16} /></span>
                  <div className="email-envelope-title">
                    <strong>Thông tin Email</strong>
                    <small>Cung cấp thêm người gửi và tiêu đề để AI đối soát dấu hiệu mạo danh tên miền hoặc sai lệch Reply-To.</small>
                  </div>
                </div>
                <div className="email-fields-grid">
                  <div className="email-field-group">
                    <label className="field-label" htmlFor="email-sender">
                      <span className="email-field-title">Người gửi (From)</span>
                      <span className="email-field-hint">Tùy chọn</span>
                    </label>
                    <input
                      id="email-sender"
                      className="email-input font-mono"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="Ví dụ: Vietcombank <cskh@vietcombank-online.info>"
                    />
                  </div>

                  <div className="email-field-group">
                    <label className="field-label" htmlFor="email-replyto">
                      <span className="email-field-title">Phản hồi đến (Reply-To)</span>
                      <span className="email-field-hint">Đặc biệt lưu ý nếu khác người gửi</span>
                    </label>
                    <input
                      id="email-replyto"
                      className="email-input font-mono"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="Ví dụ: security-support247@gmail.com"
                    />
                  </div>

                  <div className="email-field-group span-full">
                    <label className="field-label" htmlFor="email-subject">
                      <span className="email-field-title">Tiêu đề email (Subject)</span>
                      <span className="email-field-hint">Tùy chọn</span>
                    </label>
                    <input
                      id="email-subject"
                      className="email-input"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ví dụ: [Cảnh báo bảo mật] Xác thực định danh tài khoản để tránh khóa thẻ trong 24h"
                    />
                  </div>
                </div>
              </div>
            )}
            <label className="field-label" htmlFor="content-input">{type === "message" ? "Nội dung tin nhắn" : type === "email" ? "Nội dung email" : "Đường dẫn cần kiểm tra"}<span>{content.length.toLocaleString("vi-VN")} / 20.000</span></label>
            <textarea id="content-input" className="main-textarea" value={content} onChange={(e) => { setContent(e.target.value.slice(0, 20_000)); }} placeholder={type === "message" ? "Dán tin nhắn đáng ngờ vào đây…\n\nVí dụ: thông báo tài khoản, yêu cầu thanh toán, tin tuyển dụng" : type === "email" ? "Dán phần nội dung email cần kiểm tra…" : "Ví dụ: example.com/secure-account"} maxLength={20_000} />
            <label className="field-label context-field">Ngữ cảnh bổ sung <span>Tùy chọn · cũng sẽ được gửi</span><textarea value={context} onChange={(e) => { setContext(e.target.value); }} rows={2} maxLength={1000} placeholder="Bạn được gửi nội dung này trong hoàn cảnh nào?" /></label>
            <details className="payload-preview"><summary>Xem nội dung sẽ gửi</summary><pre>{[redactedPayload.sender && `Người gửi: ${redactedPayload.sender}`, redactedPayload.replyTo && `Reply-To: ${redactedPayload.replyTo}`, redactedPayload.subject && `Tiêu đề: ${redactedPayload.subject}`, redactedPayload.content, redactedPayload.context && `Ngữ cảnh: ${redactedPayload.context}`].filter(Boolean).join("\n")}</pre><p className="micro-note">Tự động che chỉ nhận diện một số mẫu như email, số điện thoại, OTP dạng số và chuỗi số dài. Hãy tự rà soát tên riêng, địa chỉ và dữ liệu nhạy cảm còn lại.</p></details>
          </div>}

          {/* DYNAMIC LOCAL SENSOR ALERT: Only pops out when suspicious signals are detected in content */}
          {settledSignals.length > 0 && (
            <div className="live-sensor-alert" role="status" aria-live="polite">
              <div className="sensor-alert-header">
                <span className="sensor-alert-icon"><ShieldAlert size={18} /></span>
                <div className="sensor-alert-title">
                  <strong>Cảm biến phát hiện {settledSignals.length} dấu hiệu khả nghi ngay trong nội dung</strong>
                  <small>Phân tích cục bộ trên thiết bị của bạn trước khi bấm quét.</small>
                </div>
              </div>
              <ul className="sensor-pill-list">
                {settledSignals.map((signal) => (
                  <li key={signal.id} className={`sensor-pill sensor-pill-${signal.id}`}>
                    <span className="pill-dot" />
                    <strong>{signal.label}:</strong>
                    <span>“{signal.evidence}”</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {jevAvailable ? <div className="jev-opt-in">
            <label className="check-label"><input type="checkbox" checked={useJev} onChange={(event) => setUseJev(event.target.checked)} disabled={busy || (type === "image" && (imageMode !== "step" || !ocrConfirmed))} /><span><strong>Đối chiếu thêm bằng JEV</strong><small>Gửi nội dung đã che tới TypeSafe để chấm sáu tín hiệu riêng. Tùy chọn này không làm giảm cảnh báo chính.</small></span></label>
            <p>{type === "image" ? "Với ảnh, chuyển sang Kiểm tra từng bước và xác nhận phần OCR trước; JEV chỉ nhận bản chữ, không nhận ảnh." : "Nội dung vẫn có thể còn dữ liệu nhận dạng chưa được che. Hãy rà soát phần “Xem nội dung sẽ gửi” trước khi bật."}</p>
          </div> : <div className="jev-opt-in jev-opt-in-disabled" role="status">
            <strong>Đối chiếu JEV chưa được bật</strong><p>Luồng web chỉ dùng các dịch vụ AI đang cấu hình. Quản trị viên cần bật JEV trong cấu hình server trước khi sử dụng.</p>
          </div>}

          {feedback && <div className={`feedback feedback-${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.kind === "error" ? <TriangleAlert size={16} /> : feedback.kind === "success" ? <Check size={16} /> : <CircleHelp size={16} />}{feedback.text}</div>}
          <button className="primary-button full-button analyze-button" type="button" disabled={!canAnalyze || busy} onClick={analyze}>{busy ? <span className="loading-shimmer"><LoaderCircle size={16} className="spin" /> {type === "image" ? "AI đang đọc ảnh và phân tích..." : "Đang phân tích..."}</span> : <><Sparkles size={16} /> Quét dấu hiệu lừa đảo ngay <ArrowRight size={15} /></>}</button>
        </section>
      </div>
    </section>

    {report && <ReportView ref={reportRef} report={report} signedIn={signedIn} busy={busy} onSave={saveReport} onCopy={copyReport} copied={copied} />}

    <footer className="footer"><Link href="/" className="brand footer-brand"><span className="brand-mark"><Shield size={16} /></span><span className="brand-word">scamlens<span>.</span><small>AI</small></span></Link><nav><Link href="/guide">Hướng dẫn</Link><Link href="/guide#privacy">Quyền riêng tư</Link><span>© 2026 ScamLens AI</span></nav></footer>
  </main>;
}

function ReportView({ ref, report, signedIn, busy, onSave, onCopy, copied }: { ref?: React.Ref<HTMLElement>; report: AnalysisReport; signedIn: boolean; busy: boolean; onSave(): void; onCopy(): void; copied: boolean }) {
  const [expandedLimitations, setExpandedLimitations] = useState(false);
  const dossierId = `SL-2026-${report.id.slice(0, 8).toUpperCase()}`;
  const riskClass = `risk-${report.riskLevel}`;
  const dimensions: Array<{ label: string; categories: string[] }> = [
    { label: "Áp lực thời gian", categories: ["urgency"] },
    { label: "Mạo danh", categories: ["impersonation"] },
    { label: "Dụ chuyển tiền", categories: ["money_request"] },
    { label: "Dữ liệu xác thực", categories: ["secret_request"] },
  ];

  return <section ref={ref} id="report-section" className="report-section" aria-live="polite">
    {/* PRINT ONLY OFFICIAL DOSSIER HEADER */}
    <div className="print-dossier-header">
      <div className="print-header-top">
        <div className="print-logo-row">
          <span className="print-brand-word">ScamLens AI</span>
          <span className="print-badge-verified">BIÊN BẢN GIÁM ĐỊNH AN NINH SỐ</span>
        </div>
        <div className="print-meta-grid">
          <div><strong>Mã hồ sơ:</strong> #{dossierId}</div>
          <div><strong>Mốc thời gian:</strong> {new Date(report.createdAt).toLocaleString("vi-VN")}</div>
          <div><strong>Nguồn dữ liệu:</strong> {typeLabels[report.type]}</div>
          <div><strong>Phương thức:</strong> Phân tích AI & Đối chiếu Bằng chứng Nguyên văn</div>
        </div>
      </div>
      <div className="print-divider" />
    </div>

    <div className="report-header">
      <div>
        <div className="dossier-id-row">
          <span className="section-kicker">HỒ SƠ GIÁM ĐỊNH KỸ THUẬT SỐ</span>
          <span className="dossier-id-tag">#{dossierId}</span>
          <span className="dossier-status-pill"><BadgeCheck size={13} /> ĐÃ HOÀN TẤT</span>
        </div>
        <h2>Kết Quả Giám Định & Bằng Chứng</h2>
      </div>
      <div className="report-actions">
        <button className="secondary-button" onClick={onCopy}><Copy size={15} /> {copied ? "Đã sao chép" : "Sao chép"}</button>
        <button className="secondary-button" onClick={() => window.print()}><FileText size={15} /> In / lưu PDF A4</button>
      </div>
    </div>

    <div className={`risk-banner ${riskClass}`}>
      <span className="risk-symbol">{report.riskLevel === "high" ? <ShieldAlert size={23} /> : report.riskLevel === "low" ? <ShieldCheck size={23} /> : <TriangleAlert size={23} />}</span>
      <div className="risk-copy">
        <div className="risk-label">KẾT LUẬN SƠ BỘ VỀ RỦI RO</div>
        <h3>{riskLabels[report.riskLevel]}</h3>
        <p>{report.summary}</p>
      </div>
      <div className="report-meta">
        <span>{new Date(report.createdAt).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}</span>
        <span>{report.model.text === "demo-rules" ? "Mô hình quy tắc" : report.jev?.status === "complete" ? "AI chính · đối chiếu JEV" : "Phân tích bằng AI"}</span>
        <span>{report.source.confirmedOcr ? "Bản đọc ảnh OCR xác nhận" : "Nguồn trực tiếp"}</span>
      </div>
    </div>

    {report.jev && <JevAssessmentCard assessment={report.jev} confirmedOcr={report.source.confirmedOcr} />}

    {report.findings.length > 0 && (
      <div className="contextual-source">
        <div className="result-card-heading">
          <span className="result-icon blue"><MessageCircle size={17} /></span>
          <div>
            <h3>Nội dung trích xuất trong ngữ cảnh</h3>
            <p>Các đoạn văn bản được tô màu tương ứng với từng căn cứ phát hiện thủ đoạn.</p>
          </div>
        </div>
        <p className="source-highlight-text">
          {segmentSource(report.source.content, report.findings).map((segment, index) =>
            segment.finding ? (
              <mark className={`evidence-mark severity-${segment.finding.severity}`} key={index} title={`${segment.finding.title}: ${segment.finding.explanation}`}>
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          )}
        </p>
      </div>
    )}

    <div className="manipulation-gauge">
      <div className="result-card-heading">
        <span className="result-icon amber"><TriangleAlert size={17} /></span>
        <div>
          <h3>Bộ Giải Mã Thủ Đoạn Thao Túng Tâm Lý</h3>
          <p>Đối soát tự động qua 4 nhóm chiến thuật lừa đảo phổ biến nhất.</p>
        </div>
      </div>
      <div className="gauge-grid">
        {dimensions.map((dimension) => {
          const found = report.findings.some((finding) => dimension.categories.includes(finding.category));
          return (
            <div className="gauge-row" key={dimension.label}>
              <span>{dimension.label}</span>
              <span className="gauge-track"><i className={found ? "gauge-found" : ""} /></span>
              <small>{found ? "Phát hiện dấu hiệu" : "Không thấy mẫu rõ ràng"}</small>
            </div>
          );
        })}
      </div>
    </div>

    <div className="report-lower-grid">
      {/* EMERGENCY PROTOCOL & VERIFICATION STEPS */}
      <article className="protocol-card">
        <div className="result-card-heading">
          <span className="result-icon green"><BadgeCheck size={17} /></span>
          <div>
            <h3>Giao Thức Cứu Hộ & Xác Minh Độc Lập</h3>
            <p>Hành động lập tức theo các bước dưới đây để bảo toàn tài sản số.</p>
          </div>
        </div>

        {report.riskLevel === "high" && (
          <div className="emergency-alert-banner">
            <div className="emergency-badge">🚨 HÀNH ĐỘNG KHẨN CẤP</div>
            <p>Nếu bạn đã lỡ chuyển tiền, nhấn vào liên kết lạ hoặc gửi mã OTP:</p>
            <div className="emergency-action-chips">
              <span className="action-chip"><LockKeyhole size={14} /> Khóa tài khoản trên App ngân hàng</span>
              <a href="tel:02513685134" className="action-chip highlight-chip" title="Phòng An ninh mạng & PCTP sử dụng công nghệ cao - Công an tỉnh Đồng Nai"><PhoneCall size={14} /> PA05 Đồng Nai: 0251 3685134</a>
              <a href="tel:156" className="action-chip" title="Tổng đài quốc gia tiếp nhận phản ánh cuộc gọi & tin nhắn lừa đảo"><PhoneCall size={14} /> Tổng đài 156</a>
              <Link href="/guide#contacts" className="action-chip" title="Xem danh bạ chính thức và các kênh xác minh"><ExternalLink size={14} /> Xem danh bạ hỗ trợ</Link>
            </div>
          </div>
        )}

        <div className="verification-steps-list">
          {report.checklist.map((item, i) => (
            <div className="verification-step-item" key={`${item}-${i}`}>
              <span className="step-badge">Bước {i + 1}</span>
              <span className="step-instruction">{item}</span>
            </div>
          ))}
        </div>

        <div className="never-do">
          <LockKeyhole size={15} />
          <strong>Nguyên tắc cốt tử: Cơ quan nhà nước và ngân hàng KHÔNG BAO GIỜ yêu cầu bạn cung cấp mã OTP, chuyển tiền vào tài khoản cá nhân, hoặc cài ứng dụng qua link lạ.</strong>
        </div>
      </article>

      {/* LIMITATIONS CARD */}
      <article className="limits-card">
        <div className="result-card-heading">
          <span className="result-icon amber"><CircleHelp size={17} /></span>
          <div>
            <h3>Những điều cần lưu ý thêm</h3>
            <p>Kết quả từ AI là công cụ hỗ trợ phòng vệ, không thay thế cơ quan chức năng.</p>
          </div>
        </div>
        <ul className="limits-list">
          {(expandedLimitations ? report.limitations : report.limitations.slice(0, 3)).map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
        </ul>
        {report.limitations.length > 3 && (
          <button className="text-button" type="button" onClick={() => setExpandedLimitations(!expandedLimitations)}>
            {expandedLimitations ? "Thu gọn" : `Xem thêm ${report.limitations.length - 3} lưu ý`} <ChevronDown size={14} />
          </button>
        )}
      </article>
    </div>

    {/* PRINT ONLY OFFICIAL LEGAL FOOTER */}
    <div className="print-dossier-footer">
      <div className="print-legal-notice">
        <strong>LƯU Ý PHÁP LÝ & AN TOÀN THÔNG TIN:</strong>
        <p>Báo cáo này được kết xuất tự động từ hệ thống ScamLens AI phục vụ người dùng tự rà soát, nâng cao cảnh giác. Hệ thống cam kết không lưu lại nội dung nhạy cảm của người dùng khi chưa có sự xác nhận. Trong trường hợp nghi vấn có dấu hiệu phạm tội lừa đảo chiếm đoạt tài sản, đề nghị người dân bảo lưu bằng chứng và trình báo trực tiếp cho cơ quan Công an nơi gần nhất hoặc qua đường dây nóng 156 / 5656.</p>
      </div>
      <div className="print-hash-block">
        <div>MÃ BĂM GIÁM ĐỊNH (SHA-256 HASH): <code>{report.id}</code></div>
        <div>HỆ THỐNG PHÒNG VỆ & GIÁM ĐỊNH SCAMLENS AI — VIỆT NAM 2026</div>
      </div>
    </div>

    <div className="source-disclosure">
      <div>
        <strong><Fingerprint size={15} /> Cam kết bảo mật: Nội dung không được lưu trữ tự động</strong>
        <span>Toàn bộ phân tích được xử lý tức thời. Chỉ khi bạn bấm nút dưới đây, báo cáo mới được lưu vào danh mục của bạn.</span>
      </div>
      {signedIn ? (
        <button className="primary-button save-button" disabled={busy} onClick={onSave}>
          {busy ? <LoaderCircle size={15} className="spin" /> : <Clock3 size={15} />} {busy ? "Đang lưu..." : "Lưu vào lịch sử"}
        </button>
      ) : (
        <a className="save-button secondary-button" href="/auth/login">
          Đăng nhập để lưu <ArrowRight size={14} />
        </a>
      )}
    </div>
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
