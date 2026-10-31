import { comparisonRows } from "@/lib/analysis/comparison";
import type { AnalysisReport } from "@/lib/analysis/schema";
import { displayFindings } from "@/lib/analysis/report-presentation";

export function EvidenceComparison({ report }: { report: AnalysisReport }) {
  return <section className="layer-comparison" aria-labelledby="layer-comparison-title">
    <div className="result-card-heading"><div><h3 id="layer-comparison-title">Đối chiếu các lớp kiểm tra</h3><p>Các lớp phân tích cùng nội dung; sự trùng khớp chưa xác minh người gửi hoặc sự việc ngoài đời.</p></div></div>
    <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Bảng đối chiếu local, AI và JEV"><table className="comparison-table"><thead><tr><th scope="col">Hành vi / đặc điểm</th><th scope="col">Local</th><th scope="col">AI</th><th scope="col">JEV</th></tr></thead><tbody>{comparisonRows(report).map(row =>
      <tr key={row.category}><th scope="row">{row.label}<small>{row.status}</small>{row.evidence.length > 0 && <details><summary>Xem câu căn cứ</summary>{row.evidence.map(quote => <blockquote key={quote}>{quote}</blockquote>)}</details>}</th><td>{row.local}</td><td>{row.ai}</td><td>{row.jev}</td></tr>
    )}</tbody></table></div>
    <small>“Chưa nhận diện” không có nghĩa là an toàn. JEV chỉ đối chiếu hành vi tương ứng và không thay đổi mức cảnh báo chính.</small>
  </section>;
}

export function EvidenceFindings({ report }: { report: AnalysisReport }) {
  const findings = displayFindings(report);
  return <section className="evidence-findings" aria-labelledby="evidence-findings-title">
    <h3 id="evidence-findings-title">Vì sao cần chú ý?</h3>
    {!report.findings.length && <p>Chưa có dấu hiệu đủ căn cứ trong phần dữ liệu này. Hãy xác minh nguồn qua kênh độc lập.</p>}
    <ol>{findings.map((finding, index) => {
      const quote = finding.evidenceRefs[0].quote;
      const review = report.evidenceReviews?.find(item => item.category === finding.category && item.quote === quote);
      return <li key={finding.category + ":" + index} className={"finding-card severity-" + finding.severity}>
        <h4>{finding.title}</h4><blockquote>{quote}</blockquote><p>{finding.explanation}</p>
        <small>Trích dẫn khớp nguồn · {review?.method === "jev" ? review.status === "supported" ? "JEV thấy câu trích hỗ trợ diễn giải" : review.status === "unsupported" ? "JEV chưa thấy câu trích hỗ trợ diễn giải — cần rà lại" : "JEV chưa đủ ngữ cảnh để thẩm tra diễn giải" : "Diễn giải cần được xem trong toàn bộ ngữ cảnh"}</small>
      </li>;
    })}</ol>
    {report.evidenceReviewStatus === "unavailable" && <p className="micro-note">Đối chiếu diễn giải bằng JEV chưa hoàn tất; báo cáo chính vẫn được giữ.</p>}
    {report.evidenceReviews?.some(item => item.method === "jev") && <p className="micro-note">Đối chiếu của JEV là đánh giá bổ sung trên câu chữ; không xác minh danh tính, giao dịch hay sự việc ngoài đời.</p>}
  </section>;
}
