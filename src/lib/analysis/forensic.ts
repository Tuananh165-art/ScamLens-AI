export type ForensicResult = { detectedSoftware?: string; warnings: string[] };

const signatures = [
  { name: "Adobe Photoshop", pattern: /Adobe Photoshop|Photoshop 3\.0/i },
  { name: "Canva", pattern: /Canva/i },
  { name: "Image editor", pattern: /GIMP|Affinity Photo|Pixelmator/i },
  { name: "Known bill generator keyword", pattern: /taobill|billchuyenkhoan|fakereceipt/i },
];

/** Offline hint only. A matching signature is not proof of tampering; no match is not proof of authenticity. */
export async function inspectReceiptImage(file: File): Promise<ForensicResult> {
  const header = new TextDecoder("latin1").decode(await file.slice(0, 256 * 1024).arrayBuffer());
  const match = signatures.find((signature) => signature.pattern.test(header));
  return {
    detectedSoftware: match?.name,
    warnings: match ? [`Tệp có chuỗi nhận diện ${match.name}; đây có thể là metadata hoặc nội dung nhúng, không chứng minh ảnh bị chỉnh sửa.`] : [],
  };
}
