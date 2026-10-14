import { NextResponse } from "next/server";
import { mutationOriginAllowed, privateJson } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_NEXT_COOKIE } from "@/lib/supabase/auth-redirect";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return privateJson({ error: "Origin không hợp lệ." }, 403);
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) return privateJson({ error: "Chưa đăng xuất được. Vui lòng thử lại." }, 502);
    } catch { return privateJson({ error: "Chưa đăng xuất được. Vui lòng thử lại." }, 502); }
  }
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303, headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
