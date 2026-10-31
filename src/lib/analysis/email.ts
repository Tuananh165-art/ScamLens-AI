import { getDomain } from "tldts";

// Accept addresses and mailbox-redacted representations without recovering PII.
export function emailDomain(field: string) {
  const hostname = field.match(/@([A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,})(?=[>\s,;]|$)/iu)?.[1]?.toLowerCase();
  return hostname ? getDomain(hostname, { allowPrivateDomains: true }) : null;
}
