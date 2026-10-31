"use client";

import { findSensitiveMatches, type RedactionPreferences } from "@/lib/analysis/redact";
import { formatSource, type SourceFields } from "@/lib/analysis/payload";
import type { SourceType } from "@/lib/analysis/schema";

export function SourceReview({ type, original, draft, prepared, preferences, onPreferencesChange, onChange }: {
  type: SourceType; original: SourceFields; draft: SourceFields; prepared: SourceFields;
  preferences: RedactionPreferences; onPreferencesChange(value: RedactionPreferences): void;
  onChange(key: keyof SourceFields, value: string): void;
}) {
  const matches = [...new Map(findSensitiveMatches(Object.values(original).concat(Object.values(draft)).join("\n")).map(match => [match.kind + ":" + match.value, match])).values()];
  const fields: Array<{ key: keyof SourceFields; label: string; limit: number }> = [
    ...(type === "email" ? [
      { key: "sender" as const, label: "Bản gửi · Người gửi", limit: 300 },
      { key: "replyTo" as const, label: "Bản gửi · Reply-To", limit: 300 },
      { key: "subject" as const, label: "Bản gửi · Tiêu đề", limit: 500 },
    ] : []),
    { key: "content", label: type === "image" ? "Chữ đọc được từ ảnh" : "Nội dung đã chuẩn bị để gửi", limit: 20_000 },
    { key: "context", label: "Bản gửi · Ngữ cảnh", limit: 1_000 },
  ];
  return <details className="payload-preview" open>
    <summary><span className="workflow-step-label"><span className="step-number">02</span><span>Xem và sửa nội dung sẽ gửi</span></span></summary>
    <div className="redaction-options">{([["phone", "Che số điện thoại"], ["identity", "Che CCCD/CMND"], ["account", "Che số tài khoản"], ["email", "Che phần trước @ của email"]] as const).map(([key, label]) =>
      <label key={key}><input type="checkbox" checked={preferences[key] !== false} onChange={event => onPreferencesChange({ ...preferences, [key]: event.target.checked })} />{label}</label>
    )}</div>
    {matches.length > 0 && <div className="sensitive-items"><strong>Dữ liệu riêng tư nhận diện được</strong>{matches.map(item => {
      const kept = preferences.keepValues?.includes(item.value) ?? false;
      return <label key={item.kind + ":" + item.value}><span><mark>{item.mandatory ? "Mã bí mật · luôn che" : item.value}</mark></span><span><input type="checkbox" disabled={item.mandatory} checked={kept} onChange={event => onPreferencesChange({ ...preferences, keepValues: event.target.checked ? [...new Set([...(preferences.keepValues ?? []), item.value])] : (preferences.keepValues ?? []).filter(value => value !== item.value) })} />Giữ trong bản gửi</span></label>;
    })}</div>}
    <div className="prepared-fields">{fields.map(field => {
      const id = field.key === "content" && type === "image" ? "ocr-text-input" : "prepared-" + field.key;
      return <div key={field.key}><label className="field-label" htmlFor={id}>{field.label}</label><textarea id={id} value={draft[field.key]} rows={field.key === "content" ? 5 : 2} maxLength={field.limit} onChange={event => onChange(field.key, event.target.value)} /></div>;
    })}</div>
    <p className="micro-note">Hệ thống che dữ liệu nhận diện được, kể cả bí mật vừa nhập thêm. Hãy rà soát toàn bộ bản gửi bên dưới; các trường này được dùng cho kiểm tra local, AI và JEV nếu bạn bật.</p>
    <pre className="prepared-final" tabIndex={0} aria-label="Toàn bộ bản gửi sau khi che">{formatSource(prepared)}</pre>
  </details>;
}
