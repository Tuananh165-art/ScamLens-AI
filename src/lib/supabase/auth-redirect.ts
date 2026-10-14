export const AUTH_NEXT_COOKIE = "scamlens-auth-next";

export function safeAuthNext(value: string | null | undefined, origin: string) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin || /^\/(auth|api)(\/|$)/.test(destination.pathname)) return "/";
    return destination.pathname + destination.search + destination.hash;
  } catch { return "/"; }
}
