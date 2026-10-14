import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const next = url.searchParams.get("next") || "/history";
  let redirectTo = new URL("/history", origin);
  try {
    const candidate = new URL(next, origin);
    if (candidate.origin === new URL(origin).origin) redirectTo = candidate;
  } catch { /* Keep the local history fallback for malformed paths. */ }
  const supabase = await createSupabaseServerClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/?auth=error", origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/?auth=error", origin));
  return NextResponse.redirect(redirectTo, { headers: { "Cache-Control": "no-store" } });
}
