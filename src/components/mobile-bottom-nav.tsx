"use client";

import Link from "next/link";
import { BookOpenText, Clock3, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { TextSizeControl } from "@/components/text-size-control";

const destinations = [
  { href: "/#analyze", path: "/", label: "Soi rọi", icon: Shield },
  { href: "/guide", path: "/guide", label: "Tự vệ", icon: BookOpenText },
  { href: "/history", path: "/history", label: "Lịch sử", icon: Clock3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return <nav className="mobile-bottom-bar" aria-label="Điều hướng nhanh">
    {destinations.map(({ href, path, label, icon: Icon }) => <Link className={`bottom-bar-item${pathname === path ? " active" : ""}`} href={href} key={path} aria-current={pathname === path ? "page" : undefined}>
      <Icon size={18} /><span>{label}</span>
    </Link>)}
    <TextSizeControl compact />
    <ThemeToggle compact />
  </nav>;
}
