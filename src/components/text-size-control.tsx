"use client";

import { Minus, Plus, Type } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

type TextSize = "small" | "default" | "large";

const sizeOrder: TextSize[] = ["small", "default", "large"];
const sizeLabels: Record<TextSize, string> = {
  small: "Nhỏ",
  default: "Mặc định",
  large: "Lớn",
};

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-text-size"] });
  window.addEventListener("storage", onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): TextSize {
  const value = document.documentElement.dataset.textSize;
  return value === "small" || value === "large" ? value : "default";
}

function getServerSnapshot(): TextSize {
  return "default";
}

export function TextSizeControl({ compact = false }: { compact?: boolean }) {
  const size = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const currentIndex = sizeOrder.indexOf(size);
  const optionsId = compact ? "text-size-options-mobile" : "text-size-options-desktop";

  function setTextSize(next: TextSize) {
    document.documentElement.dataset.textSize = next;
    try { window.localStorage.setItem("scamlens-text-size", next); } catch { /* The selected size remains active for this page view. */ }
  }

  function adjust(direction: -1 | 1) {
    const next = sizeOrder[Math.max(0, Math.min(sizeOrder.length - 1, currentIndex + direction))];
    if (next) setTextSize(next);
  }

  return <div className={`text-size-control${compact ? " compact" : ""}`}>
    <button
      className={compact ? "bottom-bar-item text-size-trigger" : "theme-toggle text-size-trigger"}
      type="button"
      aria-label="Điều chỉnh cỡ chữ"
      aria-expanded={open}
      aria-controls={optionsId}
      onClick={() => setOpen(!open)}
      title="Điều chỉnh cỡ chữ"
    >
      <Type size={18} /><span>{compact ? "Cỡ chữ" : `Cỡ chữ · ${sizeLabels[size].toLowerCase()}`}</span>
    </button>
    {open && <div className="text-size-options" id={optionsId} role="group" aria-label="Chọn cỡ chữ">
      <button type="button" onClick={() => adjust(-1)} disabled={currentIndex === 0} aria-label="Giảm cỡ chữ" title="Giảm cỡ chữ"><Minus size={16} /><span>Nhỏ</span></button>
      <button type="button" onClick={() => setTextSize("default")} aria-label="Cỡ chữ mặc định" aria-pressed={size === "default"}>Mặc định</button>
      <button type="button" onClick={() => adjust(1)} disabled={currentIndex === sizeOrder.length - 1} aria-label="Tăng cỡ chữ" title="Tăng cỡ chữ"><Plus size={16} /><span>Lớn</span></button>
    </div>}
  </div>;
}
