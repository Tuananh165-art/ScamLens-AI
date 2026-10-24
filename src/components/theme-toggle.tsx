"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("storage", onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onChange);
  };
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("scamlens-theme", nextTheme);
  }

  if (compact) {
    return (
      <button
        className="bottom-bar-item theme-bottom-item"
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
        title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        <span>{theme === "dark" ? "Sáng" : "Tối"}</span>
      </button>
    );
  }

  return (
    <button
      className={`theme-switch-pill ${theme === "dark" ? "is-dark" : "is-light"}`}
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={theme === "dark" ? "Bật giao diện sáng" : "Bật giao diện tối"}
    >
      <span className="switch-thumb">
        {theme === "dark" ? <Moon size={12} strokeWidth={2.4} /> : <Sun size={12} strokeWidth={2.4} />}
      </span>
      <span className="switch-icon-bg switch-sun"><Sun size={11} strokeWidth={2.2} /></span>
      <span className="switch-icon-bg switch-moon"><Moon size={11} strokeWidth={2.2} /></span>
    </button>
  );
}
