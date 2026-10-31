import type { AnalysisReport } from "./schema";
type VerifiedFinding = AnalysisReport["findings"][number];
const severity = { high: 3, medium: 2, low: 1 };

// Merge presentation duplicates only when they describe the same category and
// overlap in the same source. Keep independent occurrences and original data.
export function displayFindings(report: AnalysisReport): VerifiedFinding[] {
  const result: VerifiedFinding[] = [];
  for (const finding of report.findings) {
    const index = result.findIndex(existing => existing.category === finding.category && existing.evidenceRefs.some(a => finding.evidenceRefs.some(b => a.sourceId === b.sourceId && a.start < b.end && b.start < a.end)));
    if (index < 0) result.push(finding);
    else if (severity[finding.severity] > severity[result[index].severity]
      || severity[finding.severity] === severity[result[index].severity] && finding.explanation.length > result[index].explanation.length) result[index] = finding;
  }
  return result.sort((a, b) => severity[b.severity] - severity[a.severity]);
}
