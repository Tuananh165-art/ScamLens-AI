"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Chưa đăng xuất được. Vui lòng thử lại.");
      }
      // Full navigation discards private client state and the cached RSC tree.
      window.location.replace("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Chưa đăng xuất được. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  return <div className="logout-control">
    <button type="button" className="account-button" onClick={logout} disabled={busy}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button>
    {error && <span className="logout-error" role="alert">{error}</span>}
  </div>;
}
