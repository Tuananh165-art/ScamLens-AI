# Đặc tả PoC TypeSafe Jev

Trạng thái: benchmark PoC chạy riêng; bổ sung adapter web opt-in theo yêu cầu ngày 27-10-2026. Lượt gọi TypeSafe thật trên web vẫn bị khóa cho tới khi key bị lộ được thu hồi/thay thế và cờ cấu hình được bật. Đây không phải bằng chứng model đạt tiêu chí production.

## Mục tiêu và giới hạn

PoC trả lời hai câu hỏi: (1) Jev phân biệt được yêu cầu hành động với nội dung phủ định, nhắc lại hoặc phòng tránh không? (2) Trích dẫn nguyên văn có hỗ trợ nhận định về nguồn không? So sánh Jev với quy tắc hiện tại; tùy chọn so sánh với pipeline DeepSeek hiện tại.

Riêng benchmark PoC chỉ chạy trên dữ liệu tổng hợp và không đổi API công khai, `analysisReportSchema`, UI, OCR, migration, database, report history hoặc logic `calculateRisk`. Phần web adapter opt-in được đặc tả riêng bên dưới; không gửi ảnh đến JEV, chỉ gửi OCR text đã che. URL chỉ được gửi dưới dạng văn bản để phân tích, không được truy cập mạng.

## Hợp đồng tích hợp web (ngoài benchmark PoC)

**WEB-01 — Quyền gọi.** `AnalyzeRequest.includeJev` mặc định `false`; chỉ người dùng bật checkbox mới yêu cầu gọi JEV. Server chỉ coi JEV sẵn sàng khi có `TYPESAFE_WEB_ENABLED=true`, `TYPESAFE_KEY_ROTATED=true`, API key hiện diện, model ghim `jev-1.14.0`, base URL HTTPS và không ở chế độ demo. `GET /api/health` chỉ trả boolean readiness, không trả cấu hình nhạy cảm.

**WEB-02 — Dữ liệu.** Key chỉ nằm phía server. Request JEV dùng nội dung đã được che lần nữa ở server; không gửi nhãn benchmark hoặc ảnh và không truy cập URL. Với ảnh, UI và API yêu cầu người dùng xem/chỉnh sửa/xác nhận OCR trước khi gửi chữ sang JEV; kết quả vẫn phải ghi rõ giới hạn OCR. UI cho xem bản gửi và nhắc rằng tự động che không bảo đảm ẩn mọi dữ liệu cá nhân.

**WEB-03 — Kết quả.** JEV hiển thị riêng xác suất Noul cho chín hành vi và mức sufficiency. Giao diện phân nhóm yêu cầu/hành vi thuyết phục, thể hiện độ đủ dữ kiện, độ trễ và token nếu provider trả metadata. Quy tắc và DeepSeek tiếp tục tạo báo cáo chính; JEV không tạo finding, summary hay riskLevel và không thể hạ cảnh báo. Nếu provider lỗi hoặc chạm quota thì báo cáo chính vẫn trả về, kèm `jev.status=unavailable`.

**WEB-04 — Chi phí và giới hạn.** Mỗi lựa chọn JEV thêm một request TypeSafe bên cạnh request DeepSeek hiện có. Chia sẻ quota actor/phút ScamLens, cộng trần provider `RATE_LIMIT_TYPESAFE_DAILY` (mặc định 30/ngày); không tự retry. Flag web tắt mặc định. Không bật live trong repo hiện tại trước khi thay key đã lộ.

## Hợp đồng đầu vào/đầu ra

**EV-01 — Phân loại.** `BenchmarkSample` chứa `id`, `familyId`, loại nguồn, biến thể, đầu vào tương tự `AnalyzeRequest` và nhãn ngoài payload. Payload provider chỉ gồm các trường nguồn cần thiết. Nhãn, nhóm, split, ID mẫu và đáp án không được gửi.

Một request `System One` ghim `jev-1.14.0` gồm chín `Noul`:

| Khóa | Câu hỏi |
|---|---|
| `requests_credentials` | Người gửi có yêu cầu người nhận tiết lộ hoặc truyền OTP, mật khẩu, PIN, CVV hay bí mật xác thực không? |
| `requests_identity_documents` | Người gửi có yêu cầu số/ảnh giấy tờ định danh hoặc selfie xác minh không? |
| `requests_payment` | Người gửi có yêu cầu chuyển tiền, trả phí hay thanh toán không? |
| `requests_app_or_remote_access` | Người gửi có yêu cầu cài app/tệp không tin cậy hoặc bật điều khiển/chia sẻ màn hình từ xa không? |
| `uses_pressure` | Nội dung có thúc ép hành động, đe hậu quả hoặc tạo khan hiếm không? |
| `demands_secrecy` | Người gửi có yêu cầu giấu tương tác hoặc tránh hỏi người thân/đồng nghiệp không? |
| `claims_authority` | Người gửi có tự nhận đại diện tổ chức hoặc người có thẩm quyền không? |
| `bypasses_official_channel` | Người gửi có đề nghị bỏ qua quy trình bảo mật hoặc kênh chính thức không? |
| `promises_guaranteed_return` | Nội dung có hứa chắc lợi nhuận/hoàn tiền để thuyết phục người nhận không? |

Cùng request hỏi `Choice` `sufficiency`: `usable`, `limited`, `unusable`. Đây là đánh giá độ đủ dữ kiện cho chín câu hỏi, không phải xác suất an toàn. Output nội bộ gồm xác suất chín `Noul`, nhãn/phân bố/`confidence` của `Choice`, model, usage token và độ trễ. Báo cáo cũ có sáu tín hiệu vẫn được đọc; kết quả mới phải có từ sáu đến chín ID duy nhất.

**EV-02 — Kiểm tra bằng chứng.** `EvidencePair` gồm nguồn, nhận định, quote và đáp án chuẩn. Code từ chối cặp nếu quote không phải substring của source. Jev nhận source, claim, quote và trả `Choice`: `supported`, `unsupported`, `insufficient`, kèm phân bố, confidence, model, token và độ trễ. Quote hợp lệ về mặt chuỗi không tự chứng minh nhận định đúng.

**EV-03 — Độ bất định.** Với mỗi `Noul`, mặc định `p ≥ 0.8` là có tín hiệu, `p ≤ 0.2` là không có tín hiệu, còn ở giữa là `uncertain`. `Noul` không trả trường confidence riêng. `Choice.confidence` đo độ tập trung của phân bố, không phải khả năng đúng trong thế giới thực. Không gọi các giá trị này là phần trăm lừa đảo. [Confidence](https://docs.typesafe.ai/confidence)

**EV-04 — Lỗi provider.** Thiếu key, model sai, response sai schema, timeout, 401/403, 429/529 hoặc mạng lỗi là record lỗi. Không chuyển lỗi thành nhãn “không có tín hiệu”. SDK cấu hình không retry; lỗi sau khi gửi giữ nguyên dự trù chi phí vì request có thể đã được tính tiền.

## Bộ dữ liệu và benchmark

**EV-05 — Corpus phân loại.** Sinh chính xác 240 mẫu: 20 tình huống nền thuộc mỗi nhóm `suspicious`, `benign`, `insufficient`; mỗi tình huống có bốn biến thể `plain`, `no_diacritics`, `quoted`, `injection`, tổng cộng 80 mẫu/nhóm. Mỗi nhóm có 20 mẫu cho từng loại `message`, `email`, `url`, `image`. Các nhãn chín tín hiệu là multi-label và được lưu ngoài nội dung. Ba chiều mới có đối chứng nội dung an toàn và kiểm tra số mẫu dương trong benchmark.

**EV-06 — Corpus bằng chứng.** Sinh chính xác 120 cặp: 40 `supported`, 40 `unsupported`, 40 `insufficient`. Mỗi cặp có quote nằm trong source, kể cả nhãn `unsupported` và `insufficient`.

**EV-07 — Chia tập.** Dùng deterministic shuffle seed cố định theo nhóm, giữ nguyên toàn bộ biến thể cùng family. Phân loại: 60 dev và 180 test, giữ tỷ lệ nhãn; bằng chứng: 30 dev và 90 test, cân bằng cả ba nhãn. Chọn ngưỡng trên dev, đóng băng rubric/model/ngưỡng rồi chạy test. Report phân tách dev và test.

**EV-08 — Đối chứng.** Chạy rule baseline hiện tại offline. DeepSeek baseline tùy chọn, dùng đúng `buildAnalysisPrompt` và `analyzeWithDeepSeekDetailed` của ứng dụng; yêu cầu `--deepseek-live`. DeepSeek hiện có ánh xạ tương đương cho bốn tín hiệu (`secret_request`, `money_request`, `urgency`, `impersonation`); hai tín hiệu còn lại phải ghi là unavailable, không tính giả thành âm tính. Nhãn corpus là nguồn chuẩn, không lấy kết quả của một model làm nhãn model khác.

## Chỉ số và cổng nghiệm thu

**EV-09 — Chỉ số.** Tính precision, recall, F1 và ma trận nhầm riêng từng tín hiệu; tỷ lệ `uncertain` và coverage; Brier score trên toàn bộ xác suất có nhãn; ma trận nhầm, macro-F1 và precision lớp `supported` cho kiểm tra bằng chứng; p50/p95 latency, token, chi phí, lỗi provider. Uncertain được tính là bỏ sót khi gold là dương và là âm tính khi gold âm; báo cáo coverage riêng để ngăn tăng coverage thấp một cách giả tạo.

**EV-10 — Ngưỡng đề xuất pilot.** Trên test: giảm ít nhất 20% cảnh báo nhầm tương đối ở nhóm phủ định/phòng tránh so với DeepSeek baseline; recall yêu cầu tiết lộ bí mật ≥95%; coverage ≥60%; precision `supported` ≥95%; evidence macro-F1 ≥0.85. Khi baseline không có lỗi, yêu cầu không phát sinh lỗi mới. Báo cáo số mẫu và cảnh báo rằng các tỷ lệ này trên corpus tổng hợp nhỏ, chưa chứng minh production. Chỉ đề xuất pilot nếu từng chức năng đạt cổng tương ứng.

**EV-11 — Ngân sách.** Tổng dự trù tối đa 5 USD; Jev tối đa 1 USD, DeepSeek tối đa 4 USD. Trước mỗi request dùng byte length payload cộng overhead bảo thủ làm cận trên token input; DeepSeek dự trù theo giá peak hiện hành (input cache-miss và output) cùng `max_tokens=3200`. Từ chối request trên 12.000 byte, vượt cận provider, tổng cận hoặc khi tồn tại dự trù chưa giải quyết vượt ngân sách. Ghi ledger trước khi gửi; lỗi sau gửi giữ nguyên khoản uncertain. Chỉ chạy một tiến trình live cùng lúc.

## Ca kiểm thử bắt buộc

- “Không gửi OTP cho bất kỳ ai” không được gán `requests_credentials=true` chỉ vì có từ OTP.
- Email tự xưng tổ chức nhưng không yêu cầu tiền phải được đánh giá theo từng tín hiệu.
- Thanh toán hợp lệ có thể là `requests_payment=true`, không tự hàm ý gian lận.
- URL vẫn chỉ được parse trong code; không fetch hostname.
- OCR giả lập được đánh giá như văn bản; không suy ra giao dịch đã thanh toán.
- Quote có thật nhưng không hỗ trợ claim được trả `unsupported` hoặc `insufficient` tùy ngữ cảnh.
- Nội dung quá ngắn/unintelligible được đánh giá thiếu dữ kiện.
- Injection trong mẫu không làm đổi nhiệm vụ; trường nhãn không lọt vào payload.
- Response với xác suất ngoài [0,1], label lạ, usage thiếu hoặc quote không thuộc source bị từ chối.
- Timeout giữ ngân sách uncertain; chạy đồng thời bị lock; resume không gửi lại kết quả thành công.
