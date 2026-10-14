import { NextResponse } from "next/server";
import { mutationOriginAllowed, privateJson } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthenticatedUser();
  if (!auth.configured) return privateJson({ error: "Chưa cấu hình Supabase." }, 503);
  if (!auth.user || !auth.client) return privateJson({ error: "Hãy đăng nhập để xem lịch sử." }, 401);
  const { id } = await context.params;
  const { data, error } = await auth.client.from("analysis_reports").select("report").eq("id", id).maybeSingle();
  if (error) return privateJson({ error: "Không tải được báo cáo." }, 503);
  if (!data) return privateJson({ error: "Không tìm thấy báo cáo." }, 404);
  return privateJson({ report: data.report });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!mutationOriginAllowed(request)) return privateJson({ error: "Origin không hợp lệ." }, 403);
  const auth = await getAuthenticatedUser();
  if (!auth.configured) return privateJson({ error: "Chưa cấu hình Supabase." }, 503);
  if (!auth.user || !auth.client) return privateJson({ error: "Hãy đăng nhập để xóa báo cáo." }, 401);
  const { id } = await context.params;
  const { data, error } = await auth.client.from("analysis_reports").delete().eq("id", id).select("id").maybeSingle();
  if (error) return privateJson({ error: "Không xóa được báo cáo." }, 503);
  if (!data) return privateJson({ error: "Không tìm thấy báo cáo." }, 404);
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
