"use client";
import { useEffect } from "react";

export function LegacyAnalyzeRedirect() {
  useEffect(() => {
    if (window.location.hash === "#analyze") window.location.replace("/analyze");
  }, []);
  return null;
}
