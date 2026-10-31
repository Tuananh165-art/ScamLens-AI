export const JEV_SIGNAL_IDS = [
  "requests_credentials",
  "requests_identity_documents",
  "requests_payment",
  "requests_app_or_remote_access",
  "uses_pressure",
  "demands_secrecy",
  "claims_authority",
  "bypasses_official_channel",
  "promises_guaranteed_return",
] as const;

export type JevSignalId = (typeof JEV_SIGNAL_IDS)[number];
export type JevSignalGroup = "requests" | "tactics";
export const JEV_QUESTION_VERSION = "2026-10-31.3";

export const JEV_SIGNAL_DEFINITIONS: Record<JevSignalId, {
  label: string;
  group: JevSignalGroup;
  question: string;
}> = {
  requests_credentials: {
    label: "Yêu cầu mã bí mật",
    group: "requests",
    question: "Does the sender ask the recipient to reveal or transmit a password, one-time code, PIN, CVV, or another authentication secret? Count only a request directed at the recipient. A warning not to share a secret, an example quoted only in safety advice, or a negated request is false. When an original received message is submitted inside quotation marks for analysis, evaluate the original sender rather than the person forwarding it.",
  },
  requests_identity_documents: {
    label: "Yêu cầu giấy tờ hoặc ảnh định danh",
    group: "requests",
    question: "Does the sender ask the recipient to send an identity document number, photo of an identity card, selfie for identity verification, or similarly sensitive identity document? Merely mentioning documents, asking the recipient to review their own records, or warning not to share them is false.",
  },
  requests_payment: {
    label: "Yêu cầu chuyển tiền hoặc thanh toán",
    group: "requests",
    question: "Does the sender ask the recipient to send money, pay a fee, transfer funds, or make a payment? A statement that payment already happened or a neutral bill notice is not a request to the sender.",
  },
  requests_app_or_remote_access: {
    label: "Yêu cầu cài ứng dụng hoặc cấp quyền điều khiển",
    group: "requests",
    question: "Does the sender explicitly ask the recipient to install an app, run an executable, enable remote-control or screen-sharing access, or grant device access? Merely opening or downloading a ZIP, reading a document, or clicking a login link does not establish installation or remote access. A warning not to install an app or ordinary use of an official app store is false.",
  },
  uses_pressure: {
    label: "Thúc ép hành động",
    group: "tactics",
    question: "Does the sender pressure the recipient to act quickly, threaten a consequence, or create urgency or scarcity? Neutral dates and ordinary deadlines without pressure are false. Requests for secrecy alone belong to a separate indicator.",
  },
  demands_secrecy: {
    label: "Yêu cầu giữ bí mật hoặc tránh hỏi người khác",
    group: "tactics",
    question: "Does the sender instruct the recipient to hide the interaction, not tell family or colleagues, or avoid seeking independent advice? Ordinary privacy language unrelated to isolating the recipient is false.",
  },
  claims_authority: {
    label: "Tự xưng đại diện tổ chức",
    group: "tactics",
    question: "Does the sender claim to represent a bank, government body, police, courier, employer, platform, or other organization or authority? Mentioning an organization without claiming to represent it is false.",
  },
  bypasses_official_channel: {
    label: "Yêu cầu bỏ qua kênh chính thức",
    group: "tactics",
    question: "Does the sender explicitly instruct the recipient to ignore a security warning, skip security checks, avoid official support, or replace a known official process with a private one? Do not infer this solely from an OTP request, payment request, claim of authority, unfamiliar URL, or absence of an official contact. Ordinary use of an official channel is false.",
  },
  promises_guaranteed_return: {
    label: "Hứa lợi nhuận hoặc hoàn tiền chắc chắn",
    group: "tactics",
    question: "Does the sender promise guaranteed profit, unusually certain returns, or a guaranteed refund as an inducement? A routine refund policy or a warning that returns are not guaranteed is false.",
  },
};

export const JEV_SIGNAL_GROUPS = [
  { id: "requests", label: "Yêu cầu hành động hoặc thông tin", description: "Những gì người gửi đề nghị bạn cung cấp, cài đặt hoặc thanh toán." },
  { id: "tactics", label: "Cách tạo áp lực và thuyết phục", description: "Cách nội dung gây gấp, mạo danh hoặc né bước xác minh độc lập." },
] as const satisfies readonly { id: JevSignalGroup; label: string; description: string }[];
