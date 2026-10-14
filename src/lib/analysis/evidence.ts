import type { Finding } from "./schema";

export type VerifiedFinding = Finding & {
  evidenceRefs: Array<{ sourceId: string; quote: string; start: number; end: number; confirmedByUser: boolean }>;
};

export function attachVerifiedEvidence(findings: Finding[], sourceId: string, source: string, confirmedOcr: boolean): VerifiedFinding[] {
  return findings.flatMap((finding) => {
    const quote = finding.evidence.trim();
    const start = source.indexOf(quote);
    if (start < 0) return [];
    const end = start + quote.length;
    if (end > source.length || !quote.length) return [];
    return [{ ...finding, evidenceRefs: [{ sourceId, quote: source.slice(start, end), start, end, confirmedByUser: confirmedOcr }] }];
  });
}
