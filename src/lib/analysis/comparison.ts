import type { JevSignalId } from "@/lib/ai/jev-signals";
import type { AnalysisReport, Finding } from "./schema";

export const COMPARISON_DIMENSIONS: Array<{ category: Finding["category"]; label: string; jev?: JevSignalId }> = [
  { category: "secret_request", label: "Yêu cầu mã bí mật", jev: "requests_credentials" },
  { category: "money_request", label: "Yêu cầu tiền", jev: "requests_payment" },
  { category: "urgency", label: "Thúc ép", jev: "uses_pressure" },
  { category: "impersonation", label: "Tự xưng tổ chức", jev: "claims_authority" },
  { category: "suspicious_url", label: "Đặc điểm URL" },
  { category: "inconsistency", label: "Thông tin không khớp" },
];

export function comparisonRows(report: AnalysisReport) {
  return COMPARISON_DIMENSIONS.map(dimension => {
    const local = report.localFindings?.filter(finding => finding.category === dimension.category);
    const ai = report.aiFindings?.filter(finding => finding.category === dimension.category);
    const signal = report.jev?.status === "complete" && dimension.jev ? report.jev.signals.find(item => item.id === dimension.jev) : undefined;
    const jev = !signal ? "Chưa đánh giá" : signal.result === "present" ? "Có tín hiệu" : report.jev?.status === "complete" && report.jev.sufficiency !== "usable" ? "Thiếu ngữ cảnh" : signal.result === "uncertain" ? "Chưa phân biệt rõ" : "Chưa nhận diện";
    const sources = Number(Boolean(local?.length)) + Number(Boolean(ai?.length)) + Number(signal?.result === "present");
    return {
      ...dimension, local: local === undefined ? "Bản lưu cũ" : local.length ? "Có dấu hiệu" : "Chưa nhận diện",
      ai: ai === undefined ? "Bản lưu cũ" : ai.length ? "Có dấu hiệu" : "Chưa nhận diện", jev,
      status: sources > 1 ? "Cùng có tín hiệu" : sources === 1 ? "Cần đối chiếu" : "Chưa có tín hiệu tương ứng",
      evidence: [...new Set([...(local ?? []), ...(ai ?? [])].flatMap(finding => finding.evidenceRefs.map(ref => ref.quote)))],
    };
  });
}
