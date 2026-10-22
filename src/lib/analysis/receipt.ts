import type { ReceiptStructuredData } from "./schema";

export function reviewReceiptData(data: ReceiptStructuredData, relatedText = ""): string[] {
  const notes = [...data.inconsistencies];
  if (data.amount !== undefined && data.amountInWords) {
    const numericWords = data.amountInWords.replace(/[,.\s]/g, "").match(/\d+/g)?.join("");
    const spokenAmount = parseVietnameseAmount(data.amountInWords);
    const wordsAmount = numericWords ? Number(numericWords) : spokenAmount;
    if (wordsAmount !== undefined && wordsAmount !== data.amount) {
      notes.push("Số tiền bằng số và phần chữ có vẻ không khớp; hãy kiểm tra trực tiếp trên ứng dụng ngân hàng.");
    }
  }
  const reference = data.referenceNumber?.replace(/\s/g, "") ?? "";
  const sequential = ["0123456789", "1234567890", "9876543210"];
  if (reference && (/^(\d)\1{5,}$/u.test(reference) || sequential.some((series) => reference.length >= 6 && series.includes(reference)))) {
    notes.push("Mã tham chiếu có chuỗi lặp hoặc tuần tự dễ đoán; đây chỉ là dấu hiệu cần kiểm tra, không chứng minh biên lai giả.");
  }
  if (data.transferType === "napas247" && /chuyển thường/iu.test(relatedText) || data.transferType === "normal" && /napas\s*24\s*\/\s*7|chuyển nhanh\s*24/iu.test(relatedText)) {
    notes.push("Loại chuyển trên phần đọc ảnh có vẻ mâu thuẫn với nội dung đi kèm; hãy đối chiếu giao dịch thật.");
  }
  return [...new Set(notes)];
}

function parseVietnameseAmount(value: string): number | undefined {
  const normalized = value.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const numberWords: Record<string, number> = { khong: 0, mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, lam: 5, sau: 6, bay: 7, tam: 8, chin: 9 };
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  if (!tokens.some((token) => Object.hasOwn(numberWords, token))) return undefined;
  let total = 0;
  let group = 0;
  let current = 0;
  for (const token of tokens) {
    if (Object.hasOwn(numberWords, token)) { current += numberWords[token]; continue; }
    if (token === "muoi") { current = current === 0 ? 10 : current < 10 ? current * 10 : current + 10; continue; }
    if (token === "tram") { group += (current || 1) * 100; current = 0; continue; }
    if (["nghin", "ngan"].includes(token)) { total += (group + current) * 1_000; group = 0; current = 0; continue; }
    if (token === "trieu") { total += (group + current) * 1_000_000; group = 0; current = 0; continue; }
    if (token === "ty") { total += (group + current) * 1_000_000_000; group = 0; current = 0; continue; }
  }
  const result = total + group + current;
  return result > 0 ? result : undefined;
}
