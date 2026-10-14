import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return privateJson({ error: "Chưa cấu hình Supabase Auth." }, 503);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=%2Fhistory`, queryParams: { access_type: "offline", prompt: "select_account" } },
  });
  if (error || !data.url) return privateJson({ error: "Không khởi tạo được đăng nhập Google." }, 502);
  return NextResponse.redirect(data.url, { headers: { "Cache-Control": "no-store" } });
}
