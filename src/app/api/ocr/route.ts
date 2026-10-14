import { readImage } from "@/lib/ai/deepseek";
import { publicError } from "@/lib/ai/errors";
import { takeQuota } from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 4_000_000) return privateJson({ error: "Ảnh vượt giới hạn 3 MiB. Hãy giảm kích thước rồi thử lại." }, 413);
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size < 16 || file.size > MAX_BYTES) return privateJson({ error: "Chọn một ảnh đã che, kích thước tối đa 3 MiB." }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > MAX_BYTES) return privateJson({ error: "Ảnh vượt giới hạn cho phép." }, 413);
    const mime = detectImageType(bytes);
    if (!mime) return privateJson({ error: "Chỉ chấp nhận JPEG, PNG hoặc WebP hợp lệ." }, 415);

    const userState = await getAuthenticatedUser().catch(() => ({ configured: false as const, client: null, user: null }));
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local-guest";
    const quota = await takeQuota({ ip, userId: userState.user?.id, provider: "deepseek" });
    if (!quota.allowed) return privateJson({ error: "Bạn đã hết lượt đọc ảnh hiện tại. Hãy thử lại sau." }, 429, { "Retry-After": String(quota.retryAfterSeconds) });
    const result = await readImage(bytes, mime);
    return privateJson({ ...result, source: "deepseek-image-read", confirmedByUser: false });
  } catch (error) {
    if (error instanceof TypeError && /formData/i.test(error.message)) return privateJson({ error: "Gửi ảnh dưới dạng multipart/form-data." }, 400);
    const safe = publicError(error);
    return privateJson({ error: safe.message }, safe.status);
  }
}

function detectImageType(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
