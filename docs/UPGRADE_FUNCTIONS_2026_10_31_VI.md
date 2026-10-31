# Nâng cấp bốn luồng phân tích — 31/10/2026

## Phạm vi đã tích hợp

| Yêu cầu | Thực hiện | Bằng chứng |
|---|---|---|
| Che OTP, số +84, dữ liệu mới nhập trong preview | Recognizer theo ngữ cảnh, có vị trí; che lại ở server; chuẩn bị chung qua payload.ts | upgrade-regressions.test.ts, upgrade-flows.test.tsx |
| Miền chính thức và email sau che | Registry có phiên bản/nguồn; Techcombank .com và alias; parser domain hỗ trợ mailbox đã che; private suffix | upgrade-regressions.test.ts |
| Cảnh báo OCR | Chỉ hiện cho ảnh chưa xác nhận; step 02 cho OCR; sửa ảnh/chữ/bản gửi hủy xác nhận | jev-web-ui.test.tsx, home.spec.ts |
| Nhãn benchmark | Sửa nhận hoàn phí không phải gửi tiền, bỏ hành vi suy diễn, phiên bản corpus/câu hỏi 2026-10-31.3 | jev-benchmark.test.ts |
| Bản gửi đầy đủ | Sửa From, Reply-To, Subject, body, context; bản cuối sau che dùng chung cho local, AI và JEV | upgrade-flows.test.tsx |
| Response cũ | Version + AbortController cho phân tích/OCR/import; save và copy kiểm tra phiên bản | upgrade-flows.test.tsx |
| Web Risk | Consent mới khi URL đổi, bỏ response cũ, gắn queriedUrl, hết hạn; provider match hết hạn không được cấp TTL mới | external-url-check.test.tsx, check-url/route.test.ts |
| Báo cáo | Bảng local–AI–JEV theo hành vi tương đương, câu căn cứ, giải thích đọc được, gộp finding trùng vùng; bỏ gauge nhị phân | evidence-report.tsx, report-presentation.ts, upgrade.spec.ts |
| Đánh giá kết luận–trích dẫn | Chặn cắt mất phủ định rõ ràng; nhánh JEV tối đa 3 claim, một request riêng và quota riêng | upgrade-regressions.test.ts, jev.test.ts, analyze/route.test.ts |
| QR local | ZXing đọc pixel trên canvas; hỗ trợ detector và pure-barcode; không mở đích; người dùng chuyển nội dung sang preview | upgrade.spec.ts với ảnh QR thật |
| Nhập .eml | POST /api/import-email, MailParser, tối đa 2 MiB và 20.000 ký tự nội dung; không trả/render HTML hoặc bytes đính kèm | parse-eml.test.ts, upgrade.spec.ts |
| Hướng dẫn theo hành động | Mới đọc / bấm link / tải-cài / cung cấp mã / chuyển tiền; chỉ lưu trạng thái trong phiên | upgrade-flows.test.tsx |

## Cách sử dụng

- Ảnh: tải ảnh, chọn **Đọc QR trên thiết bị**. Kết quả nằm trong phiên; bấm **Đưa nội dung QR vào bản xem trước** rồi tự quyết định phân tích.
- Email: chọn **Nhập từ tệp .eml**. Thao tác chọn tệp gửi thư đến máy chủ ScamLens để parse, chưa gửi AI; rà toàn bộ bước 02 rồi phân tích.
- Ảnh kiểm tra từng bước: đọc OCR, sửa bản gửi, xác nhận lại. Quét nhanh vẫn cho phép OCR chưa xác nhận và ghi rõ giới hạn.
- Báo cáo: đọc phần “Vì sao cần chú ý?”, đối chiếu từng lớp, chọn “Bạn đã thao tác gì?” để xem hướng dẫn phù hợp.
- Tra cứu Google là thao tác đồng ý riêng. URL thay đổi sẽ hủy đồng ý/kết quả cũ. Kết quả không đưa vào copy, PDF hoặc history.

## Cấu hình và giới hạn JEV

TYPESAFE_EVIDENCE_REVIEW_ENABLED=false là mặc định. Bật true chỉ khi đã đánh giá corpus/threshold của tổ chức.
Nhánh này còn cần includeJev do người dùng chọn, JEV đang khả dụng và phân tích hành vi JEV đã hoàn tất.
Một lượt chỉ gửi tối đa 3 kết luận có trích dẫn khớp nguồn, ưu tiên mức cao; tốn thêm một lượt quota TypeSafe.
Lỗi/quota không làm mất báo cáo chính. supported/unsupported/insufficient là đánh giá trên câu chữ, không xác minh ngoài đời và không tự thay đổi mức cảnh báo chính.

Kiểm tra phủ định local chỉ là hàng rào cho câu cảnh báo rõ ràng, không phải bộ chứng minh ngữ nghĩa tổng quát.
Không suy độ chính xác sản phẩm từ các mẫu tổng hợp. Corpus sửa nhãn phải được chạy đánh giá live riêng; không tái sử dụng báo cáo benchmark cũ cho phiên bản mới.

## Riêng tư và tương thích

- QR đọc local từ canvas đã che; không tự truy cập nội dung mã.
- .eml được parse trong bộ nhớ máy chủ, không có lưu tệp hoặc tải tài nguyên nhúng. Header SPF/DKIM/DMARC tự khai không được coi là đã xác minh.
- Nhãn/miền từ AI OCR có thể sai; dữ liệu thương hiệu local có nguồn và cần cập nhật định kỳ.
- Các trường báo cáo mới là tùy chọn; vẫn đọc báo cáo sáu tín hiệu/các bản lưu cũ, không migration Supabase.
- Lựa chọn hành động sau sự cố là trạng thái phiên, không gửi provider hoặc tự ghi vào lịch sử.

## Kiểm chứng và phần còn lại

Kết quả cuối của lint/typecheck/test/build/E2E được ghi tại SCAMLENS_UPGRADE_PLAN_AND_NOTES_VI.md.
Kiểm chứng provider live, Supabase/RLS/OAuth live và chất lượng trên thiết bị thật vẫn tách riêng.
E2E dùng cổng 3187, thư mục .next-e2e; production build dùng .next-build để không đụng dev server hiện có.
Audit dependency phát hiện cảnh báo nền sẵn có ở Next.js 16.2.9 và các dependency liên quan; không tự nâng framework trong đợt thay đổi chức năng này.

Kết quả benchmark dùng tên results-CORPUS_VERSION-QUESTION_VERSION.json để không trộn output cũ với nhãn/câu hỏi mới. Ledger chi phí vẫn dùng chung, không reset ngân sách.
