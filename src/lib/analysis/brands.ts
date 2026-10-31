export const BRAND_REGISTRY_VERSION = "2026-10-31";
// Reference data, not proof of site ownership or safety.
export const BRAND_REGISTRY = [
  { brand: "VNeID / cổng dịch vụ công", tokens: ["vneid", "dichvucong"], webDomains: ["vneid.gov.vn", "dichvucong.gov.vn"], source: "https://vneid.gov.vn/" },
  { brand: "Vietcombank", tokens: ["vietcombank"], webDomains: ["vietcombank.com.vn"], source: "https://www.vietcombank.com.vn/" },
  { brand: "Techcombank", tokens: ["techcombank"], webDomains: ["techcombank.com", "techcombank.com.vn"], source: "https://techcombank.com/thong-tin/thong-bao/canh-bao-thu-doan-lua-dao-email-tin-nhan-gia-mao-ngan-hang" },
  { brand: "Zalo", tokens: ["zalo"], webDomains: ["zalo.me", "zalo.vn"], source: "https://zalo.me/" },
  { brand: "ZaloPay", tokens: ["zalopay"], webDomains: ["zalopay.vn"], source: "https://zalopay.vn/" },
  { brand: "Western Union", tokens: ["westernunion", "western-union"], webDomains: ["westernunion.com"], source: "https://www.westernunion.com/" },
] as const;

export function isExampleHostname(hostname: string) {
  return /(?:^|\.)(?:example|test|invalid|localhost)$/iu.test(hostname)
    || /(?:^|\.)example\.(?:com|org|net)$/iu.test(hostname);
}
