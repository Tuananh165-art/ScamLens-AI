"use client";
import { useState } from "react";
import { EXPOSURE_OPTIONS, RESPONSE_ACTIONS, type Exposure } from "@/lib/analysis/response-actions";

export function ResponseActions() {
  const [exposure, setExposure] = useState<Exposure>("viewed");
  return <div className="response-actions">
    <label className="field-label" htmlFor="exposure-action">Bạn đã thao tác gì?</label>
    <select id="exposure-action" value={exposure} onChange={event => setExposure(event.target.value as Exposure)}>{EXPOSURE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
    <ol aria-live="polite">{RESPONSE_ACTIONS[exposure].map(action => <li key={action}>{action}</li>)}</ol>
    <small>Lựa chọn này chỉ dùng trong phiên để hiển thị hướng dẫn; không gửi cho AI.</small>
  </div>;
}
