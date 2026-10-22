import { describe, expect, it } from "vitest";
import { attachVerifiedEvidence } from "./evidence";
import type { Finding } from "./schema";

const finding: Finding = { category: "urgency", severity: "medium", title: "Gây áp lực", explanation: "Cần xác minh độc lập.", evidence: "KHÓA TÀI KHOẢN NGAY" };

describe("attachVerifiedEvidence", () => {
  it("attaches an exact source slice and its location", () => {
    const result = attachVerifiedEvidence([finding], "source-1", "Ngân hàng báo: KHÓA TÀI KHOẢN NGAY nếu chưa xác minh.", false);
    expect(result).toHaveLength(1);
    expect(result[0]?.evidenceRefs[0]).toMatchObject({ sourceId: "source-1", quote: "KHÓA TÀI KHOẢN NGAY", start: 15, end: 34 });
  });

  it("drops invented evidence that is absent from the input", () => {
    expect(attachVerifiedEvidence([finding], "source-1", "Xin chào, bạn khỏe không?", false)).toEqual([]);
  });

  it("matches case, spacing, and punctuation variants while preserving the exact source slice", () => {
    const variant = { ...finding, evidence: "khóa, tài khoản ngay!" };
    const source = "Cảnh báo: KHÓA TÀI KHOẢN NGAY. Hãy tự kiểm tra.";
    const result = attachVerifiedEvidence([variant], "source-2", source, false);
    expect(result).toHaveLength(1);
    const ref = result[0].evidenceRefs[0];
    expect(ref.quote).toBe("KHÓA TÀI KHOẢN NGAY");
    expect(source.slice(ref.start, ref.end)).toBe(ref.quote);
  });
});
