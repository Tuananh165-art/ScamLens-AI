import { NextResponse } from "next/server";
import { mutationOriginAllowed } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303, headers: { "Cache-Control": "no-store" } });
}
