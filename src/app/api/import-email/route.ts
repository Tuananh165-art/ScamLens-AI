import { mutationOriginAllowed, privateJson } from "@/lib/http";
import { MAX_EML_BYTES, parseEml } from "@/lib/email/parse-eml";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return privateJson({ error: "Yêu cầu không hợp lệ." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_EML_BYTES) return privateJson({ error: "Tệp .eml tối đa 2 MiB." }, 413);
  const reader = request.body?.getReader();
  if (!reader) return privateJson({ error: "Chưa có nội dung tệp." }, 400);
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_EML_BYTES) { await reader.cancel(); return privateJson({ error: "Tệp .eml tối đa 2 MiB." }, 413); }
      chunks.push(value);
    }
    return privateJson(await parseEml(Buffer.concat(chunks)));
  } catch {
    return privateJson({ error: "Không đọc được tệp .eml hoặc nội dung vượt giới hạn 20.000 ký tự. Hãy dán phần thư cần kiểm tra." }, 400);
  }
}
