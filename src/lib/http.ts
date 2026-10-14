import { NextResponse } from "next/server";

export function privateJson(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", ...extra },
  });
}

export function mutationOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    // The canonical metadata URL must not reject same-origin deployment aliases.
    const source = new URL(origin);
    return (source.protocol === "https:" || source.protocol === "http:")
      && source.origin === origin && source.origin === new URL(request.url).origin;
  } catch { return false; }
}
