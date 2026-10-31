import { simpleParser } from "mailparser";

export const MAX_EML_BYTES = 2 * 1024 * 1024;

export async function parseEml(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_EML_BYTES) throw new Error("invalid_eml_size");
  if (!/^(?:from|to|subject|mime-version|received|return-path|date|message-id|content-type):/imu.test(bytes.toString("utf8", 0, 16_000))) throw new Error("invalid_eml");
  const mail = await simpleParser(bytes, {
    skipImageLinks: true, skipTextToHtml: true, skipTextLinks: true,
    keepCidLinks: true, maxHtmlLengthToParse: 128 * 1024,
  });
  const headers = String(mail.headers.get("authentication-results") ?? "");
  const authentication = ["spf", "dkim", "dmarc"].map(key => {
    const value = headers.match(new RegExp("\\b" + key + "=(pass|fail|none|neutral|softfail|temperror|permerror)", "i"))?.[1];
    return value ? key.toUpperCase() + "=" + value : "";
  }).filter(Boolean);
  let content = (mail.text ?? "").trim();
  // A mixed MIME message can contain HTML without a plain-text sibling.
  // Convert that already-decoded HTML as a bounded root part; never render it.
  if (!content && typeof mail.html === "string" && mail.html.length <= 128 * 1024) {
    const fallback = await simpleParser(Buffer.from("Content-Type: text/html; charset=utf-8\r\n\r\n" + mail.html), { skipTextToHtml: true, skipImageLinks: true, keepCidLinks: true, maxHtmlLengthToParse: 128 * 1024 });
    content = (fallback.text ?? "").trim();
  }
  if (content.length > 20_000) throw new Error("eml_text_too_long");
  return {
    sender: (mail.from?.text ?? "").slice(0, 300),
    replyTo: (mail.replyTo?.text ?? "").slice(0, 300),
    subject: (mail.subject ?? "").slice(0, 500), content,
    attachments: mail.attachments.slice(0, 20).map(file => ({ name: (file.filename ?? "Tệp không có tên").slice(0, 160), size: file.size })),
    notes: [
      "Tệp chỉ được đọc để điền biểu mẫu; tệp đính kèm chưa được phân tích hoặc thực thi.",
      "Header trong tệp do người cung cấp đưa vào; chưa xác minh người gửi từ hộp thư nguồn.",
      ...(!content ? ["Chưa trích được nội dung chữ. Hãy dán phần thư cần phân tích vào biểu mẫu."] : []),
      ...(authentication.length ? ["Kết quả do header tự khai, chưa được xác minh: " + authentication.join(", ")] : []),
    ],
  };
}
