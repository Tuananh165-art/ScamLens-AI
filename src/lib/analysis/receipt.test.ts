import { describe, expect, it } from "vitest";
import { reviewReceiptData } from "./receipt";
import { receiptStructuredSchema } from "./schema";

describe("receipt review hints", () => {
  it("accepts partial extraction and flags only concrete mismatches conservatively", () => {
    const data = receiptStructuredSchema.parse({ amount: 14_800_000, amountInWords: "Mười bốn triệu đồng", referenceNumber: "123456789" });
    const notes = reviewReceiptData(data, "Loại chuyển: chuyển thường");
    expect(notes.join(" ")).toContain("có vẻ không khớp");
    expect(notes.join(" ")).toContain("không chứng minh biên lai giả");
  });

  it("reports conflicts between transfer labels only as a review hint", () => {
    const data = receiptStructuredSchema.parse({ transferType: "napas247" });
    expect(reviewReceiptData(data, "Người gửi nói đây là chuyển thường.").join(" ")).toContain("có vẻ mâu thuẫn");
  });
});
