import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import "./globals.css";
import "./theme.css";

export const metadata: Metadata = {
  title: "ScamLens AI — Biết vì sao đáng ngờ",
  description: "Trợ lý phân tích tin nhắn, email, ảnh giao dịch và đường dẫn đáng ngờ bằng bằng chứng rõ ràng.",
  applicationName: "ScamLens AI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#f7f8fc", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" suppressHydrationWarning><body><Script id="theme-bootstrap" strategy="beforeInteractive">{`try{var s=localStorage.getItem("scamlens-theme");var t=s==="dark"||s==="light"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;var z=localStorage.getItem("scamlens-text-size");document.documentElement.dataset.textSize=z==="small"||z==="large"?z:"default"}catch(e){}`}</Script>{children}<MobileBottomNav /></body></html>;
}
