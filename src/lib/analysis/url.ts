import { domainToUnicode } from "node:url";
import { getDomain, getHostname, parse } from "tldts";

export type UrlSignals = {
  hostname: string;
  registrableDomain: string | null;
  protocol: string;
  hasUserInfo: boolean;
  isIpAddress: boolean;
  isPunycode: boolean;
  hasAbnormalPort: boolean;
  nestedRedirectTarget?: string;
  isHomograph: boolean;
  spoofedBrand?: string;
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
  const unicodeHostname = domainToUnicode(hostname) || hostname;
  const registrableDomain = getDomain(hostname) ?? null;
  const isIpAddress = parsed.isIp ?? false;
  const isPunycode = hostname.toLowerCase().split(".").some((part) => part.startsWith("xn--"));
  const signals: string[] = [];
  const isHomograph = isPunycode || /[^\u0000-\u024f\u1e00-\u1eff.\-\d]/u.test(unicodeHostname);
  const hasAbnormalPort = Boolean(url.port && !["80", "443"].includes(url.port));
  const redirectKeys = ["redirect", "redirect_uri", "url", "target", "next", "destination", "u", "link", "q"];
  let nestedRedirectTarget: string | undefined;
  for (const [key, value] of url.searchParams) {
    if (!redirectKeys.includes(key.toLowerCase())) continue;
    const candidateTarget = value.trim();
    if (/^https?:\/\//i.test(candidateTarget)) { nestedRedirectTarget = candidateTarget; break; }
  }
  const brandChecks = [
    { brand: "VNeID / cổng dịch vụ công", tokens: ["vneid", "dichvucong"], domains: ["vneid.gov.vn", "dichvucong.gov.vn"] },
    { brand: "Vietcombank", tokens: ["vietcombank"], domains: ["vietcombank.com.vn"] },
    { brand: "Techcombank", tokens: ["techcombank"], domains: ["techcombank.com.vn"] },
    { brand: "Zalo", tokens: ["zalo", "zalopay"], domains: ["zalo.me", "zalopay.vn"] },
    { brand: "Western Union", tokens: ["westernunion", "western-union"], domains: ["westernunion.com"] },
  ];
  const brandHostname = unicodeHostname.toLowerCase().replace(/[\u0430\u04d1]/g, "a").replace(/[\u0435\u0451]/g, "e").replace(/[\u0456]/g, "i").replace(/[\u043e]/g, "o").replace(/[\u0440]/g, "p").replace(/[\u0441]/g, "c").replace(/[\u0445]/g, "x").replace(/[\u0443]/g, "y").replace(/[\u043a]/g, "k").replace(/[\u043c]/g, "m").replace(/[\u0442]/g, "t").replace(/[\u0432]/g, "b").replace(/[\u043d]/g, "h");
  const spoofedBrand = brandChecks.find((brand) => brand.tokens.some((token) => brandHostname.includes(token)) && !brand.domains.some((domain) => brandHostname === domain || brandHostname.endsWith(`.${domain}`)))?.brand;
  if (url.username || url.password) signals.push("URL chứa thông tin đăng nhập trước hostname.");
  if (isIpAddress) signals.push("URL dùng địa chỉ IP thay cho tên miền dễ nhận biết.");
  if (isPunycode) signals.push("Tên miền có nhãn punycode; cần kiểm tra ký tự hiển thị.");
  if (isHomograph && !isPunycode) signals.push("Tên miền chứa ký tự Unicode ngoài bảng Latin thông dụng; cần kiểm tra ký tự đồng hình.");
  if (hasAbnormalPort) signals.push(`URL dùng cổng mạng không phổ biến (:${url.port}); đây là dấu hiệu cần kiểm tra, không tự chứng minh lừa đảo.`);
  if (nestedRedirectTarget) signals.push(`Tham số URL chứa đích chuyển hướng lồng ghép: ${nestedRedirectTarget}`);
  if (spoofedBrand) signals.push(`Tên miền có chứa tên ${spoofedBrand} nhưng không thuộc một tên miền chính thức đã cấu hình; hãy tự xác minh qua kênh độc lập.`);
  if (url.protocol === "http:") signals.push("Đường dẫn dùng HTTP thay vì HTTPS.");

  return { hostname, registrableDomain, protocol: url.protocol.slice(0, -1), hasUserInfo: Boolean(url.username || url.password), isIpAddress, isPunycode, hasAbnormalPort, nestedRedirectTarget, isHomograph, spoofedBrand, signals };
}
