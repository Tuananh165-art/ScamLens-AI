import { describe, expect, it } from "vitest";
import { inspectReceiptImage } from "./forensic";

describe("offline image metadata hints", () => {
  it("reports an embedded editor signature without calling it proof of tampering", async () => {
    const file = { slice: () => ({ arrayBuffer: async () => new TextEncoder().encode("Adobe Photoshop metadata").buffer }) } as File;
    const result = await inspectReceiptImage(file);
    expect(result.detectedSoftware).toBe("Adobe Photoshop");
    expect(result.warnings[0]).toContain("không chứng minh ảnh bị chỉnh sửa");
  });
});
