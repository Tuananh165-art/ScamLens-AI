import { CircleHelp, ShieldCheck } from "lucide-react";
import type { JevAssessment } from "@/lib/analysis/schema";

const signalLabels = {
  requests_credentials: "Yêu cầu thông tin xác thực",
  requests_payment: "Yêu cầu thanh toán",
  uses_pressure: "Gây áp lực hoặc tạo khẩn cấp",
  claims_authority: "Tự xưng đại diện tổ chức",
  bypasses_official_channel: "Né kênh xác minh chính thức",
  promises_guaranteed_return: "Hứa lợi nhuận/hoàn tiền chắc chắn",
} as const;

const resultLabels = { present: "JEV đánh dấu tín hiệu", not_detected: "JEV không thấy rõ", uncertain: "Chưa rõ" } as const;
const sufficiencyLabels = { usable: "Đủ nội dung để đánh giá", limited: "Thiếu một phần ngữ cảnh", unusable: "Chưa đủ nội dung" } as const;

export function JevAssessmentCard({ assessment, confirmedOcr = true }: { assessment: JevAssessment; confirmedOcr?: boolean }) {
  if (assessment.status === "unavailable") {
    return <aside className="jev-assessment jev-assessment-unavailable" aria-label="Kết quả JEV">
      <div className="result-card-heading"><span className="result-icon amber"><CircleHelp size={17} /></span><div><h3>JEV chưa hoàn tất lượt này</h3><p>{assessment.reason === "quota" ? "Đã chạm hạn mức gọi JEV trong ngày." : "Nhà cung cấp JEV tạm thời không sẵn sàng. Báo cáo từ DeepSeek và quy tắc vẫn được giữ nguyên."}</p></div></div>
    </aside>;
  }

  return <aside className="jev-assessment" aria-label="Tín hiệu bổ sung từ JEV">
    <div className="result-card-heading"><span className="result-icon blue"><ShieldCheck size={17} /></span><div><h3>Đối chiếu bổ sung từ JEV</h3><p>Mô hình {assessment.model} · {sufficiencyLabels[assessment.sufficiency]}. Đây là tín hiệu phụ, không phải kết luận lừa đảo.</p></div></div>
    <ul className="jev-signal-list">{assessment.signals.map((signal) => <li key={signal.id} className={`jev-signal jev-signal-${signal.result}`}>
      <span><strong>{signalLabels[signal.id]}</strong><small>{resultLabels[signal.result]}</small></span>
      <span className="jev-probability">{Math.round(signal.probability * 100)}%</span>
    </li>)}</ul>
    <p className="jev-note">Phần trăm là xác suất đầu ra cho từng câu hỏi, không phải độ chắc chắn ngoài thực tế. JEV không thay đổi mức cảnh báo chính; hãy đối chiếu bằng chứng trích dẫn.{confirmedOcr ? "" : " Bản OCR chưa được bạn xác nhận và có thể sai chữ."}</p>
  </aside>;
}
