import { z } from "zod";
import { getSensitiveUrlReason } from "@/lib/analysis/url-privacy";
import { mutationOriginAllowed, privateJson } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { quotaLimitMessage, takeQuota } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ url: z.string().trim().min(1).max(2_048), consent: z.literal(true) });

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return privateJson({ error: "Yêu cầu không hợp lệ." }, 403);
  if (Number(request.headers.get("content-length") || 0) > 4_096) return privateJson({ error: "Yêu cầu vượt quá giới hạn." }, 413);
  if (process.env.WEBRISK_ENABLED !== "true" || !process.env.WEBRISK_API_KEY?.trim()) return privateJson({ status: "unavailable", message: "Tra cứu URL bên ngoài hiện chưa được bật." }, 503);

  let raw: unknown;
  try { raw = await request.json(); } catch { return privateJson({ error: "Dữ liệu chưa đúng định dạng." }, 400); }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return privateJson({ error: "Hãy nhập một URL và xác nhận đồng ý tra cứu." }, 400);
  if (/\[[^\]]*(?:đã che|redacted|masked)[^\]]*\]/iu.test(parsed.data.url)) return privateJson({ error: "URL có phần dữ liệu đã che; hãy cung cấp lại URL đầy đủ sau khi tự rà soát." }, 400);
  let url: URL;
  try { url = new URL(parsed.data.url); } catch { return privateJson({ error: "URL chưa hợp lệ." }, 400); }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.href.length > 2_048) return privateJson({ error: "Chỉ hỗ trợ URL HTTP hoặc HTTPS không chứa thông tin đăng nhập." }, 400);
  const sensitiveReason = getSensitiveUrlReason(url.href);
  if (sensitiveReason) return privateJson({ error: `Không thể tra cứu URL vì có thể chứa ${sensitiveReason}. Hãy xóa thông tin đó và kiểm tra lại URL.` }, 400);

  const userState = await getAuthenticatedUser().catch(() => ({ configured: false as const, client: null, user: null }));
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local-guest";
  let quota;
  try { quota = await takeQuota({ ip, userId: userState.user?.id, provider: "webrisk" }); }
  catch { return privateJson({ status: "unavailable", message: "Không thể kiểm tra hạn mức tra cứu lúc này." }, 503); }
  if (!quota.allowed) return privateJson({ status: "unavailable", message: quotaLimitMessage(quota), retryAfterSeconds: quota.retryAfterSeconds }, 429, { "Retry-After": String(quota.retryAfterSeconds) });

  const checkedAt = new Date();
  const endpoint = new URL("https://webrisk.googleapis.com/v1/uris:search");
  endpoint.searchParams.set("uri", parsed.data.url);
  endpoint.searchParams.set("key", process.env.WEBRISK_API_KEY);
  endpoint.searchParams.append("threatTypes", "SOCIAL_ENGINEERING");
  endpoint.searchParams.append("threatTypes", "MALWARE");
  try {
    const response = await fetch(endpoint, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return privateJson({ status: "unavailable", message: "Nhà cung cấp tra cứu chưa trả kết quả. Báo cáo phân tích chính vẫn có thể được dùng." }, 200);
    const body: unknown = await response.json();
    const result = body as { threat?: { threatTypes?: unknown; expireTime?: unknown } };
    const threatTypes = Array.isArray(result?.threat?.threatTypes) ? result.threat.threatTypes.filter((item): item is string => typeof item === "string") : [];
    const providerExpiry = typeof result?.threat?.expireTime === "string" ? Date.parse(result.threat.expireTime) : NaN;
    if (threatTypes.length && (!Number.isFinite(providerExpiry) || providerExpiry <= checkedAt.getTime())) {
      return privateJson({ status: "unavailable", queriedUrl: parsed.data.url, message: "Nhà cung cấp chưa trả kết quả còn hạn. Hãy kiểm tra lại sau." });
    }
    const expiresAt = threatTypes.length ? new Date(providerExpiry).toISOString() : new Date(checkedAt.getTime() + 5 * 60_000).toISOString();
    return privateJson({
      status: threatTypes.length ? "matched" : "not_listed",
      queriedUrl: parsed.data.url, expirySource: threatTypes.length ? "provider" : "session",
      checkedAt: checkedAt.toISOString(), expiresAt,
      source: "Google Web Risk Lookup API",
      threatTypes,
      message: threatTypes.length ? "URL có trong danh sách mối đe dọa tại thời điểm kiểm tra. Kết quả có thể sai; đừng mở URL." : "Chưa thấy URL trong danh sách tại thời điểm kiểm tra. Điều này không chứng minh URL an toàn.",
    });
  } catch {
    return privateJson({ status: "unavailable", message: "Tra cứu bị gián đoạn hoặc quá thời gian chờ. Báo cáo phân tích chính vẫn có thể được dùng." }, 200);
  }
}
