import { findSensitiveMatches } from "./redact";

export function getSensitiveUrlReason(url: string): string | null {
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* Retain the original URL when it has malformed escapes. */ }
  if (/\[[^\]]*(?:đã che|redacted|masked)[^\]]*\]/iu.test(decoded)) return "dữ liệu đã che";
  const match = findSensitiveMatches(decoded)[0];
  if (!match) return null;
  if (match.kind === "credential") return "mã hoặc khóa bí mật";
  if (match.kind === "email") return "địa chỉ email";
  if (match.kind === "phone") return "số điện thoại";
  if (match.kind === "identity") return "số giấy tờ tùy thân";
  return "chuỗi số có thể là tài khoản";
}
