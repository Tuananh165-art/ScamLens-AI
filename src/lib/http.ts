import { NextResponse } from "next/server";

export function privateJson(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", ...extra },
  });
}

export function mutationOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return false;
  try {
    const allowed = expected ? new URL(expected).origin : new URL(request.url).origin;
    return new URL(origin).origin === allowed;
  } catch { return false; }
}
