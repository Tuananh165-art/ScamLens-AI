import { expect, it } from "vitest";
import { displayFindings } from "./report-presentation";
import { comparisonRows } from "./comparison";
import type { AnalysisReport } from "./schema";

it("merges repeated explanations of the same source location and keeps separate occurrences", () => {
  const finding = { category: "secret_request" as const, severity: "high" as const, title: "Yêu cầu OTP", explanation: "Yêu cầu gửi OTP.", evidence: "Gửi OTP", evidenceRefs: [{ sourceId: "s1", start: 0, end: 7, quote: "Gửi OTP", confirmedByUser: false }] };
  const report = { riskLevel: "high", findings: [finding, { ...finding, explanation: "Người gửi yêu cầu cung cấp mã OTP qua tin nhắn." }, { ...finding, evidenceRefs: [{ ...finding.evidenceRefs[0], start: 20, end: 27 }] }], localFindings: [finding], aiFindings: [], jev: { status: "complete", model: "fixture", sufficiency: "limited", signals: [{ id: "requests_credentials", result: "not_detected", probability: 0.1 }] } } as unknown as AnalysisReport;
  expect(displayFindings(report)).toHaveLength(2);
  expect(displayFindings(report)[0].explanation).toContain("qua tin nhắn");
  expect(comparisonRows(report)[0]).toMatchObject({ local: "Có dấu hiệu", ai: "Chưa nhận diện", jev: "Thiếu ngữ cảnh", evidence: ["Gửi OTP"] });
  expect(report.riskLevel).toBe("high");
});
