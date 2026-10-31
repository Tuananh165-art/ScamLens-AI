import { CircleHelp, ShieldCheck } from "lucide-react";
import { JEV_SIGNAL_DEFINITIONS, JEV_SIGNAL_GROUPS } from "@/lib/ai/jev-signals";
import type { JevAssessment, SourceType } from "@/lib/analysis/schema";

const resultLabels = {
  present: "Tín hiệu cần rà soát",
  not_detected: "Chưa thấy rõ trong nội dung",
  uncertain: "Chưa phân biệt rõ",
} as const;
const sufficiencyLabels = { usable: "Đủ nội dung để đối chiếu", limited: "Thiếu một phần ngữ cảnh", unusable: "Chưa đủ nội dung" } as const;

export function JevAssessmentCard({ assessment, confirmedOcr = true, sourceType }: { assessment: JevAssessment; confirmedOcr?: boolean; sourceType?: SourceType }) {
  if (assessment.status === "unavailable") {
    return <aside className="jev-assessment jev-assessment-unavailable" aria-label="Kết quả JEV">
      <div className="result-card-heading"><span className="result-icon amber"><CircleHelp size={17} /></span><div><h3>JEV chưa hoàn tất lượt này</h3><p>{assessment.reason === "quota" ? "Đã chạm hạn mức gọi JEV trong ngày." : "Nhà cung cấp JEV tạm thời không sẵn sàng. Báo cáo phân tích chính và quy tắc vẫn được giữ nguyên."}</p></div></div>
    </aside>;
  }

  const enoughContext = assessment.sufficiency === "usable";
  const visibleCount = assessment.signals.length;

  return <aside className="jev-assessment" aria-label="Tín hiệu bổ sung từ JEV">
    <div className="jev-heading-row">
      <div className="result-card-heading"><span className="result-icon blue"><ShieldCheck size={17} /></span><div><h3>Đối chiếu hành vi bằng JEV</h3><p>{sufficiencyLabels[assessment.sufficiency]} · Mô hình {assessment.model}</p></div></div>
      <span className={`jev-context-badge jev-context-${assessment.sufficiency}`}>{visibleCount} tín hiệu</span>
    </div>

    <div className={`jev-sufficiency jev-sufficiency-${assessment.sufficiency}`}>
      <div><strong>Mức độ đủ dữ kiện</strong><span>{sufficiencyLabels[assessment.sufficiency]}</span></div>

    </div>

    {!enoughContext && <p className="jev-context-note">Các mức thấp chỉ có nghĩa là JEV chưa nhận diện rõ tín hiệu trong phần dữ liệu hiện có; thiếu ngữ cảnh không phải bằng chứng rằng nội dung an toàn.</p>}

    {assessment.signals.some(signal => signal.result === "present") && <ul className="jev-summary">{assessment.signals.filter(signal => signal.result === "present").map(signal => <li key={signal.id}>{JEV_SIGNAL_DEFINITIONS[signal.id].label}<span>Có tín hiệu cần rà soát</span></li>)}</ul>}
    {sourceType === "url" && <p className="jev-url-note">JEV đánh giá hành vi trong dữ liệu được gửi, không tra cứu danh tiếng tên miền. Hãy dùng phần kiểm tra URL local hoặc Google Web Risk tùy chọn để tra cứu URL riêng.</p>}
    <details className="jev-details"><summary>Xem {visibleCount} tín hiệu và thông số JEV</summary>
    <div className="jev-groups">{JEV_SIGNAL_GROUPS.map((group) => {
      const signals = assessment.signals.filter((signal) => JEV_SIGNAL_DEFINITIONS[signal.id].group === group.id);
      if (!signals.length) return null;
      return <section className="jev-group" key={group.id} aria-label={group.label}>
        <div className="jev-group-heading"><h4>{group.label}</h4><p>{group.description}</p></div>
        <ul className="jev-signal-list">{signals.map((signal) => {
          const displayResult = signal.result === "not_detected" && !enoughContext ? "Chưa đủ ngữ cảnh" : resultLabels[signal.result];
          return <li key={signal.id} className={`jev-signal jev-signal-${signal.result}`}>
            <div className="jev-signal-copy"><strong>{JEV_SIGNAL_DEFINITIONS[signal.id].label}</strong><small>{displayResult}</small></div>
            <div className="jev-score" aria-label={`${JEV_SIGNAL_DEFINITIONS[signal.id].label}: ${Math.round(signal.probability * 100)} phần trăm`}>
              <div className="jev-score-track" role="progressbar" aria-label={`Điểm cho ${JEV_SIGNAL_DEFINITIONS[signal.id].label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(signal.probability * 100)}><span style={{ width: `${Math.round(signal.probability * 100)}%` }} /></div>
              <span className="jev-probability">{Math.round(signal.probability * 100)}%</span>
            </div>
          </li>;
        })}</ul>
      </section>;
    })}</div>


    <div className="jev-footer-meta"><span>{assessment.diagnostics ? `Thời gian JEV: ${assessment.diagnostics.latencyMs} ms` : "Kết quả bổ sung từ JEV"}</span>{assessment.diagnostics && <span>{assessment.diagnostics.inputTokens + assessment.diagnostics.outputTokens} token xử lý</span>}</div>
    {assessment.sufficiencyConfidence !== undefined && <p className="micro-note">Độ tập trung của lựa chọn về ngữ cảnh: {Math.round(assessment.sufficiencyConfidence * 100)}%. Đây không phải phần trăm dữ liệu đã đầy đủ.</p>}
    {assessment.questionVersion && <p className="micro-note">Bộ câu hỏi: {assessment.questionVersion}</p>}
    </details>
    <p className="jev-note">Phần trăm là đầu ra riêng cho từng câu hỏi, không phải xác suất nội dung lừa đảo hay độ chính xác ngoài đời. JEV không thay đổi mức cảnh báo chính; hãy xem bằng chứng trích dẫn và tự xác minh qua kênh độc lập.{sourceType === "image" && !confirmedOcr ? " Bản OCR chưa được bạn xác nhận và có thể sai chữ." : ""}</p>
  </aside>;
}
