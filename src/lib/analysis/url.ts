import { getDomain, getHostname, parse } from "tldts";

export type UrlSignals = {
  hostname: string;
  registrableDomain: string | null;
  protocol: string;
  hasUserInfo: boolean;
  isIpAddress: boolean;
  isPunycode: boolean;
  signals: string[];
};

export function inspectUrl(raw: string): UrlSignals {
  let candidate = raw.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) throw new Error("unsupported_protocol");
  if (!candidate.includes("://")) candidate = `https://${candidate}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported_protocol");
  if (!url.hostname || url.hostname.length > 253) throw new Error("invalid_host");

  const parsed = parse(url.hostname);
  const hostname = getHostname(url.href) ?? url.hostname;
  const registrableDomain = getDomain(hostname) ?? null;
  const isIpAddress = parsed.isIp ?? false;
  const isPunycode = hostname.toLowerCase().split(".").some((part) => part.startsWith("xn--"));
  const signals: string[] = [];
  if (url.username || url.password) signals.push("URL chứa thông tin đăng nhập trước hostname.");
  if (isIpAddress) signals.push("URL dùng địa chỉ IP thay cho tên miền dễ nhận biết.");
  if (isPunycode) signals.push("Tên miền có nhãn punycode; cần kiểm tra ký tự hiển thị.");
  if (url.protocol === "http:") signals.push("Đường dẫn dùng HTTP thay vì HTTPS.");

  return { hostname, registrableDomain, protocol: url.protocol.slice(0, -1), hasUserInfo: Boolean(url.username || url.password), isIpAddress, isPunycode, signals };
}
