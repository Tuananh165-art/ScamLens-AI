import { redactSensitiveText, type RedactionPreferences } from "./redact";

export type SourceFields = { content: string; context: string; sender: string; replyTo: string; subject: string };
export const EMPTY_FIELDS: SourceFields = { content: "", context: "", sender: "", replyTo: "", subject: "" };

export function prepareSource(fields: SourceFields, preferences: RedactionPreferences = {}): SourceFields {
  return Object.fromEntries((Object.keys(EMPTY_FIELDS) as Array<keyof SourceFields>).map(key => [key, redactSensitiveText(fields[key], preferences)])) as SourceFields;
}

export function formatSource(fields: SourceFields): string {
  return [
    fields.sender && "Người gửi: " + fields.sender,
    fields.replyTo && "Reply-To: " + fields.replyTo,
    fields.subject && "Tiêu đề: " + fields.subject,
    "Nội dung: " + fields.content,
    fields.context && "Ngữ cảnh: " + fields.context,
  ].filter(Boolean).join("\n");
}
