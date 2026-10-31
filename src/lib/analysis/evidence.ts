import type { Finding } from "./schema";
import { isRequestDenial } from "./rules";

export type VerifiedFinding = Finding & {
  evidenceRefs: Array<{ sourceId: string; quote: string; start: number; end: number; confirmedByUser: boolean }>;
};

export function attachVerifiedEvidence(findings: Finding[], sourceId: string, source: string, confirmedOcr: boolean): VerifiedFinding[] {
  return findings.flatMap((finding) => {
    const quote = finding.evidence.trim();
    let start = source.indexOf(quote);
    let end = start >= 0 ? start + quote.length : -1;

    if (start < 0) {
      const normalizedSource = normalizeForEvidence(source);
      const normalizedQuote = normalizeForEvidence(quote);
      if (normalizedQuote.text.length < 2) return [];
      const match = normalizedSource.text.indexOf(normalizedQuote.text);
      if (match < 0) return [];
      start = normalizedSource.positions[match];
      const last = match + normalizedQuote.text.length - 1;
      end = normalizedSource.positions[last] + normalizedSource.lengths[last];
    }

    if (start < 0 || end <= start || end > source.length) return [];
    const exactSourceQuote = source.slice(start, end);
    if (finding.category === "secret_request" || finding.category === "money_request") {
      const before = source.slice(0, start);
      const boundary = Math.max(...[".", "!", "?", ";", ",", "\n"].map(char => before.lastIndexOf(char)));
      const followingBoundary = source.slice(end).search(/[.!?;,\n]/u);
      const clause = source.slice(boundary + 1, followingBoundary < 0 ? source.length : end + followingBoundary);
      // Do not allow a clipped quotation to invert an explicit safety warning.
      // Mixed contrast clauses remain for contextual review instead of blanket rejection.
      if (!/\b(?:nhưng|tuy nhiên|mặt khác)\b/iu.test(clause) && isRequestDenial(clause)) return [];
    }
    return [{ ...finding, evidenceRefs: [{ sourceId, quote: exactSourceQuote, start, end, confirmedByUser: confirmedOcr }] }];
  });
}

function normalizeForEvidence(value: string) {
  let text = "";
  const positions: number[] = [];
  const lengths: number[] = [];
  let pendingSpace: { position: number; length: number } | undefined;

  for (let index = 0; index < value.length;) {
    const point = value.codePointAt(index)!;
    const char = String.fromCodePoint(point);
    const width = char.length;
    const lower = char.toLocaleLowerCase("vi-VN");
    if (/^[\p{L}\p{N}]$/u.test(char)) {
      if (pendingSpace && text) {
        text += " "; positions.push(pendingSpace.position); lengths.push(pendingSpace.length);
      }
      pendingSpace = undefined;
      for (const normalizedChar of lower) { text += normalizedChar; positions.push(index); lengths.push(width); }
    } else if (/\s/u.test(char)) {
      pendingSpace = { position: index, length: width };
    } else if (/^[^\p{P}\p{S}]+$/u.test(char)) {
      // Keep combining marks and other letters attached to the normalized quote.
      for (const normalizedChar of lower) { text += normalizedChar; positions.push(index); lengths.push(width); }
    }
    index += width;
  }

  return { text, positions, lengths };
}
