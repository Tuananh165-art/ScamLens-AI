"use client";

import { useEffect } from "react";

export function ThemeBootstrap() {
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("scamlens-theme");
      const theme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  return null;
}
