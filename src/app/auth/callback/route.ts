import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AUTH_NEXT_COOKIE, safeAuthNext } from "@/lib/supabase/auth-redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  const cookieStore = await cookies();
  const next = safeAuthNext(cookieStore.get(AUTH_NEXT_COOKIE)?.value, origin);
  function finish(path: string) {
    const response = NextResponse.redirect(new URL(path, origin), { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: url.protocol === "https:" });
    return response;
  }
  const supabase = await createSupabaseServerClient();
  if (!code || !supabase) return finish("/analyze?auth=error");
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return finish("/analyze?auth=error");
    return finish(next);
  } catch { return finish("/analyze?auth=error"); }
}
