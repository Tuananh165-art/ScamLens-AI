import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Handle older allowlists that return the code to Site URL instead of callback.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", request.nextUrl.searchParams.get("code")!);
    return NextResponse.redirect(callback, { headers: { "Cache-Control": "private, no-store" } });
  }

  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        // Recreate after updating request headers so rendering reads the new tokens.
        const previous = response.cookies.getAll();
        response = NextResponse.next({ request });
        previous.forEach((cookie) => response.cookies.set(cookie));
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  // Server Components cannot persist refreshed cookies. Refresh before rendering.
  await client.auth.getUser().catch(() => null);
  return response;
}

export const config = { matcher: ["/", "/analyze", "/history", "/api/reports/:path*"] };
