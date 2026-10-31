import { analysisReportSchema } from "@/lib/analysis/schema";
import { mutationOriginAllowed, privateJson } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth.configured) return privateJson({ error: "Chưa cấu hình Supabase." }, 503);
  if (!auth.user || !auth.client) return privateJson({ error: "Hãy đăng nhập để xem lịch sử." }, 401);
  const pageValue = Number(new URL(request.url).searchParams.get("page") || "1");
  const page = Number.isInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 1000) : 1;
  const { data, error } = await auth.client.from("analysis_reports")
    .select("id,input_type,risk_level,title,created_at")
    .order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  if (error) return privateJson({ error: "Không tải được lịch sử. Kiểm tra migration và RLS." }, 503);
  return privateJson({ reports: data ?? [], page, pageSize: 20 });
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return privateJson({ error: "Origin không hợp lệ." }, 403);
  if (Number(request.headers.get("content-length") || 0) > 64_000) return privateJson({ error: "Yêu cầu vượt quá giới hạn." }, 413);
  const auth = await getAuthenticatedUser();
  if (!auth.configured) return privateJson({ error: "Chưa cấu hình Supabase." }, 503);
  if (!auth.user || !auth.client) return privateJson({ error: "Hãy đăng nhập để lưu báo cáo." }, 401);
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 64_000) return privateJson({ error: "Yêu cầu vượt quá giới hạn." }, 413);
    const body = JSON.parse(raw);
    const parsed = analysisReportSchema.safeParse(body?.report);
    if (!parsed.success) return privateJson({ error: "Báo cáo không đúng định dạng." }, 400);
    const report = parsed.data;
    if (Buffer.byteLength(JSON.stringify(report), "utf8") > 48_000) return privateJson({ error: "Báo cáo vượt giới hạn lưu." }, 413);
    const existing = await auth.client.from("analysis_reports").select("id").eq("id", report.id).maybeSingle();
    if (existing.error) return privateJson({ error: "Không thể kiểm tra trạng thái lưu báo cáo." }, 503);
    if (existing.data?.id) return privateJson({ id: report.id, saved: true, alreadySaved: true });
    const title = `${label(report.type)} · ${report.riskLevel}`.slice(0, 160);
    const { error } = await auth.client.from("analysis_reports").insert({
      id: report.id, user_id: auth.user.id, schema_version: report.schemaVersion,
      input_type: report.type, risk_level: report.riskLevel, title, report,
    });
    if (error) return privateJson({ error: "Không lưu được báo cáo. Kiểm tra migration và chính sách RLS." }, 503);
    return privateJson({ id: report.id, saved: true }, 200);
  } catch { return privateJson({ error: "Yêu cầu không đúng định dạng." }, 400); }
}

function label(type: string) { return ({ message: "Tin nhắn", email: "Email", url: "Đường dẫn", image: "Ảnh" })[type] ?? "Phân tích"; }
