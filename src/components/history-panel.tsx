"use client";

import { useState } from "react";
import { ArrowRight, Clock3, LoaderCircle, Trash2 } from "lucide-react";
import { JevAssessmentCard } from "@/components/jev-assessment-card";
import type { AnalysisReport } from "@/lib/analysis/schema";

type Row = { id: string; input_type: string; risk_level: string; title: string; created_at: string };
const levels: Record<string, string> = { low: "Chưa thấy dấu hiệu rõ", medium: "Cần kiểm tra", high: "Rủi ro cao", insufficient: "Thiếu thông tin" };
const types: Record<string, string> = { message: "Tin nhắn", email: "Email", url: "Đường dẫn", image: "Ảnh chụp" };

export function HistoryPanel({ reports: initial }: { reports: Row[] }) {
  const [reports, setReports] = useState(initial);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function openReport(id: string) {
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/reports/${id}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Không mở được báo cáo.");
      setReport(body.report);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không mở được báo cáo."); }
    finally { setBusyId(""); }
  }

  async function deleteReport(id: string) {
    if (!window.confirm("Xóa báo cáo này khỏi lịch sử?")) return;
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/reports/${id}`, { method: "DELETE", cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Không xóa được báo cáo.");
      setReports((current) => current.filter((item) => item.id !== id));
      if (report?.id === id) setReport(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không xóa được báo cáo."); }
    finally { setBusyId(""); }
  }

  return <>
    {error && <p className="history-message" role="alert">{error}</p>}
    {report && <section className="report-section" style={{ marginBottom: 15 }}><div className="report-header"><div><div className="section-kicker">BÁO CÁO ĐÃ LƯU · {types[report.type]}</div><h2>{levels[report.riskLevel]}</h2></div><button className="secondary-button" onClick={() => setReport(null)}>Đóng</button></div><div className={`risk-banner risk-${report.riskLevel}`}><div className="risk-copy"><p>{report.summary}</p></div><span className="report-meta">{new Date(report.createdAt).toLocaleString("vi-VN")}</span></div>{report.jev && <JevAssessmentCard assessment={report.jev} confirmedOcr={report.source.confirmedOcr} />}<div className="findings-list">{report.findings.map((finding, index) => <article className="finding-card" key={`${index}-${finding.evidence}`}><div className="finding-heading"><h3>{finding.title}</h3></div><blockquote className="evidence-quote">“{finding.evidence}”</blockquote><p className="finding-explanation">{finding.explanation}</p></article>)}</div><h3 style={{ fontSize: 12, marginTop: 16 }}>Cách kiểm chứng</h3><ul className="limits-card">{report.checklist.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
    {!reports.length ? <div className="history-empty"><Clock3 size={21} style={{ display: "block", margin: "0 auto 9px" }} />Chưa có báo cáo đã lưu.<br />Phân tích xong, chọn “Lưu vào lịch sử” để giữ báo cáo.</div> : <div className="history-list">{reports.map((item) => <article className="history-row" key={item.id}><div className="history-title"><strong>{types[item.input_type] ?? "Phân tích"} · {item.title}</strong><small>{new Date(item.created_at).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}</small></div><span className={`history-badge ${item.risk_level}`}>{levels[item.risk_level]}</span><span className="history-cell">Chỉ bạn xem được</span><div className="history-actions"><button onClick={() => openReport(item.id)} disabled={Boolean(busyId)}>{busyId === item.id ? <LoaderCircle size={14} className="spin" /> : <>Mở <ArrowRight size={12} /></>}</button><button className="delete" onClick={() => deleteReport(item.id)} disabled={Boolean(busyId)} aria-label={`Xóa ${item.title}`}><Trash2 size={14} /></button></div></article>)}</div>}
  </>;
}
