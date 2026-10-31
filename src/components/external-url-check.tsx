"use client";
import { useEffect, useRef, useState } from "react";
import { isExampleHostname } from "@/lib/analysis/brands";

type Lookup = { status: string; queriedUrl: string; message?: string; checkedAt?: string; expiresAt?: string; expirySource?: string; threatTypes?: string[] };

export function ExternalUrlCheck({ source, configured }: { source: string; configured: boolean }) {
  const firstUrl = source.match(/https?:\/\/[^\s<>"']+/iu)?.[0]?.replace(/[),.;!?]+$/u, "") ?? "";
  const [url, setUrl] = useState(firstUrl);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<Lookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { sequence.current++; controller.current?.abort(); }, []);
  useEffect(() => {
    if (!result?.expiresAt) return;
    const deadline = Date.parse(result.expiresAt);
    const delay = deadline - Date.now();
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, Math.min(delay, 2_147_483_647)));
    return () => window.clearTimeout(timer);
  }, [result]);
  let example = false;
  try { example = isExampleHostname(new URL(url).hostname); } catch { /* The API validates before lookup. */ }
  function edit(value: string) {
    sequence.current++; controller.current?.abort();
    setUrl(value); setConsent(false); setResult(null); setBusy(false); setExpired(false);
  }
  async function lookup() {
    if (!configured || !consent || !url.trim()) return;
    const requestId = ++sequence.current;
    const queriedUrl = url.trim();
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setResult(null); setExpired(false);
    try {
      const response = await fetch("/api/check-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: queriedUrl, consent: true }), cache: "no-store", signal: abort.signal });
      const body = await response.json();
      if (requestId !== sequence.current) return;
      if (body.queriedUrl && body.queriedUrl !== queriedUrl) throw new Error("lookup_url_mismatch");
      setResult({ ...body, queriedUrl, status: body.status ?? "unavailable", message: body.message ?? body.error });
    } catch {
      if (requestId === sequence.current) setResult({ queriedUrl, status: "unavailable", message: "Không kết nối được dịch vụ tra cứu. Báo cáo chính không bị ảnh hưởng." });
    } finally { if (requestId === sequence.current) setBusy(false); }
  }
  return <details className="external-url-check">
    <summary>Tra cứu URL với Google Web Risk (tùy chọn)</summary>
    <p>Chỉ URL bên dưới được gửi cho Google. Ứng dụng không mở trang. Kết quả chỉ áp dụng tại thời điểm kiểm tra và không chứng minh URL an toàn.</p>
    {!configured && <p className="url-check-disabled">Tra cứu hiện chưa được bật trên máy chủ.</p>}
    <label htmlFor="webrisk-url">URL sẽ gửi</label>
    <input id="webrisk-url" type="url" value={url} maxLength={2048} onChange={event => edit(event.target.value)} placeholder="https://…" />
    {example && <p className="micro-note">Đây là tên miền dành cho ví dụ/thử nghiệm. Tra cứu mẫu này không đo khả năng nhận diện website lừa đảo thực tế.</p>}
    <label className="check-label"><input type="checkbox" checked={consent} disabled={!configured} onChange={event => setConsent(event.target.checked)} /><span>Tôi đồng ý gửi chính URL đang hiển thị cho Google để tra cứu danh sách mối đe dọa.</span></label>
    <button type="button" className="secondary-button" disabled={!configured || !consent || !url.trim() || busy} onClick={lookup}>{busy ? "Đang tra cứu…" : expired ? "Kiểm tra lại URL" : "Tra cứu URL"}</button>
    {result && <div className={"url-check-result status-" + (expired ? "expired" : result.status)} role="status">
      <strong>{expired ? "Kết quả đã hết hạn — cần kiểm tra lại" : result.status === "matched" ? "Có trong danh sách tại thời điểm kiểm tra" : result.status === "not_listed" ? "Chưa thấy trong danh sách tại thời điểm kiểm tra" : "Chưa có kết quả tra cứu"}</strong>
      <p className="lookup-url">Kết quả cho: {result.queriedUrl}</p>
      {!expired && <p>{result.message}</p>}
      {result.threatTypes?.length ? <p>Google Web Risk · {result.threatTypes.join(", ")}</p> : null}
      {result.checkedAt && <small>Kiểm tra: {new Date(result.checkedAt).toLocaleString("vi-VN")}{result.expiresAt && " · " + (result.expirySource === "session" ? "Nên kiểm tra lại: " : "Hạn dùng kết quả: ") + new Date(result.expiresAt).toLocaleString("vi-VN")}</small>}
    </div>}
  </details>;
}
