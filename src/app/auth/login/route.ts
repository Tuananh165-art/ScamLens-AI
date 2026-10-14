import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http";
import { AUTH_NEXT_COOKIE, safeAuthNext } from "@/lib/supabase/auth-redirect";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return privateJson({ error: "Chưa cấu hình Supabase Auth." }, 503);
  const url = new URL(request.url);
  const origin = url.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // PKCE cookies and callback stay on one host. No query in the allowlisted callback.
    options: { redirectTo: `${origin}/auth/callback`, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) return privateJson({ error: "Không khởi tạo được đăng nhập Google." }, 502);
  const response = NextResponse.redirect(data.url, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(AUTH_NEXT_COOKIE, safeAuthNext(url.searchParams.get("next"), origin), {
    httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 600,
  });
  return response;
}
