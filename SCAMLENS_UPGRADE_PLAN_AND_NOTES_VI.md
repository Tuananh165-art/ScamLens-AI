# ScamLens AI — kế hoạch, kết quả và việc còn cần xử lý

Cập nhật: 22/10/2026

## Mục tiêu và thứ tự triển khai

1. Đọc tài liệu nâng cấp, so khớp từng đề xuất với mã nguồn hiện tại và giữ các nguyên tắc về quyền riêng tư, bằng chứng nguyên văn, không tự mở URL và không xác nhận giao dịch từ ảnh.
2. Sửa schema AI, giới hạn đầu ra, cấu hình model Vision, đối chiếu bằng chứng và phân tích URL ngoại tuyến.
3. Bổ sung thư viện tám tình huống, cảm biến heuristic, OCR có trường dữ liệu biên lai và gợi ý kiểm tra chéo.
4. Tái cấu trúc luồng nhập/đồng thuận, báo cáo bằng chứng, checklist, công cụ che ảnh và hệ thống giao diện desktop/mobile.
5. Chạy lint, typecheck, unit, E2E, build và smoke provider; ghi lại lỗi môi trường và lần sửa.

## Kết quả theo yêu cầu

| Yêu cầu | Kết quả |
|---|---|
| Schema và payload AI | Mở giới hạn summary/checklist/limitations; chuẩn hóa an toàn trước `safeParse`; smoke script cùng hợp đồng với ứng dụng. |
| Model OCR/Vision | Thêm `DEEPSEEK_VISION_MODEL`, mặc định dùng `DEEPSEEK_MODEL`; bỏ whitelist cố định để provider trả lỗi capability chính xác. |
| Bằng chứng | Đối chiếu chính xác trước, sau đó chuẩn hóa hoa/thường, khoảng trắng và dấu câu; kết quả luôn giữ `quote/start/end` theo lát cắt nguyên văn nguồn. |
| Tám case study | Có đủ tám lựa chọn ở giao diện và nội dung giả lập theo các kịch bản trong tài liệu. Chúng được gắn nhãn tình huống tổng hợp, không tuyên bố là hồ sơ vụ án có nguồn. |
| Prompt hành vi | Bổ sung các cơ chế áp lực, mạo danh, chân trong cửa, chi phí chìm, tài khoản thứ ba và lời hứa lợi nhuận; bắt buộc có bằng chứng và ngôn ngữ thận trọng. |
| Design system và điều hướng | Bổ sung tokens, màu semantic, nền dark slate, trạng thái focus, nav desktop và thanh đáy mobile; radar minh họa ghi rõ là cục bộ, không phải dữ liệu sự cố trực tiếp. |
| Nhập liệu/riêng tư | Một nút phân tích cùng một checkbox đồng thuận; toggle che mẫu nhạy cảm; có thể mở xem chính xác payload sẽ gửi. Mọi sửa nội dung hoặc toggle che sẽ hủy đồng thuận cũ. |
| Canvas ảnh | Undo/redo, xử lý pointer để tránh cuộn trang, dán ảnh khi canvas đang được focus và thu hồi object URL. |
| Cảm biến rủi ro | Heuristic cục bộ debounce 150 ms cho áp lực thời gian, thông tin xác thực và tự xưng tổ chức; giao diện nêu rõ có thể nhận nhầm/bỏ sót. |
| Báo cáo | Tô sáng lát cắt đã xác minh trong nguồn, giải thích qua tooltip, bốn thanh nhóm dấu hiệu không phải điểm tâm lý, checklist lưu trong localStorage theo báo cáo. |
| URL ngoại tuyến | Phát hiện IDN/punycode, ký tự đồng hình phổ biến, cổng không chuẩn, URL lồng trong tham số redirect và từ khóa thương hiệu sai domain; không gửi request đến URL. |
| Biên lai | OCR có thể trả dữ liệu có cấu trúc; UI yêu cầu người dùng đối chiếu; kiểm tra số tiền bằng số/chữ khi parse được, mã tham chiếu quá tuần tự và mâu thuẫn loại chuyển khoản. |
| Gợi ý ảnh | Quét chuỗi metadata phổ biến ở phía trình duyệt và chỉ báo là gợi ý; không tự kết luận ảnh giả. |

## Kiểm tra đã chạy

- `npm.cmd run lint` — đạt.
- `npm.cmd run typecheck` — đạt.
- `npm.cmd run test` — 15 file, 57 test đạt.
- `npm.cmd run test:e2e` — 10 test Chromium đạt, gồm consent, preview che dữ liệu, highlight report, checklist localStorage, luồng retry ảnh, theme/mobile overflow.
- E2E xác nhận trên viewport 390 px: không tràn ngang và không có text DOM dưới 12 px.
- `npm.cmd run build` — đạt; Next tạo đủ static pages và route.
- `npm.cmd run smoke:ai` — DeepSeek text và image OCR đều trả JSON hợp lệ và qua schema sau sanitizer. Smoke gọi provider bằng nội dung mẫu và ảnh 1×1, dùng quota API.
- `git diff --check` — đạt.

## Lỗi gặp và cách xử lý

- Vitest trong sandbox dừng trước khi tải test với `spawn EPERM`; chạy lại trong execution context được phép thì hoàn tất.
- Lần build sandbox đầu biên dịch được nhưng Next không spawn được worker TypeScript (`spawn EPERM`); build trong execution context được phép đã đạt.
- Smoke đầu tiên nhận JSON hợp lệ nhưng script cũ kiểm tra giới hạn schema cũ và không dùng sanitizer của ứng dụng. Đã đồng bộ validator, chạy lại một lần; cả text và OCR đạt.
- Lần E2E đầu có locator mơ hồ giữa `<summary>` và nội dung đồng thuận; sửa locator. Bộ E2E cuối cùng đạt.
- Unit fixture `File.arrayBuffer()` không được jsdom hỗ trợ ở phiên bản đang cài; thay fixture bằng Blob-like test double. API runtime vẫn dùng `File.slice().arrayBuffer()` chuẩn trình duyệt.

## Giới hạn, đề xuất và việc cần thao tác thủ công

1. **Chưa có bằng chứng nguồn cho tuyên bố “tám vụ việc thực tế ở Đồng Nai”.** Tài liệu yêu cầu gọi case study là trích từ vụ án thật nhưng không kèm nguồn dẫn/biên bản kiểm chứng. UI vì vậy ghi đây là tình huống tổng hợp giả lập. Nếu cần trình bày là sự kiện có thật, hãy cung cấp nguồn công khai đáng tin, ngày/địa bàn và quyền sử dụng; sau đó có thể cập nhật nhãn và nguồn cho từng case.
2. **Chưa triển khai ELA/compression anomaly hoặc điểm số 0–100.** Đề xuất chấm ảnh `85/15` từ metadata/tỷ lệ khung hình không có bộ dữ liệu chuẩn và dễ báo nhầm; metadata công cụ chỉnh sửa cũng không chứng minh sửa nội dung. Solution khác: thu bộ ảnh hợp pháp đã gắn nhãn, xác định mô hình/thuật toán với ngưỡng đo được, đánh giá false-positive/false-negative độc lập rồi mới cân nhắc hiển thị tín hiệu. Hiện tính năng chỉ quét dấu chuỗi và nêu giới hạn.
3. **Đối soát biên lai không xác minh giao dịch ngân hàng.** OCR có thể sai; parser số tiền bằng chữ chỉ nhận diện một tập cách viết tiếng Việt. Mã tham chiếu thường lệ thuộc ngân hàng và thời điểm, nên không áp dụng mẫu `FT`/độ dài mã như chuẩn chắc chắn. Người dùng vẫn cần tự mở app ngân hàng để xác nhận tiền đã vào.
4. **Kiểm tra accessibility chưa bao gồm audit tương phản WCAG bằng công cụ chuyên dụng, screen reader hoặc thiết bị iOS/Android thật.** E2E chỉ kiểm tra desktop Chromium giả lập viewport 390 px, không thay thế kiểm tra trên điện thoại thật. Nên kiểm tra màu theo từng trạng thái light/dark bằng contrast checker và thao tác VoiceOver/TalkBack trước khi tuyên bố đạt WCAG AA.
5. **Chưa kiểm tra OAuth/RLS, dữ liệu Supabase production, deploy Vercel hoặc mobile LAN.** Các bài kiểm tra đã chạy là source/local/provider smoke; cần chủ dự án kiểm tra hai tài khoản Google, cách ly lịch sử A/B và môi trường production sau deploy.
6. **`next-env.d.ts` báo modified lúc bắt đầu; Next dev/build đổi qua lại tham chiếu route types.** File hiện tham chiếu `.next/dev/types/routes.d.ts` và khớp HEAD. Diff ban đầu chưa được lưu nên không thể xác định thay đổi trước phiên làm việc là generated hay do bạn sửa. Hãy kiểm tra nếu bạn có chỉnh thủ công file này.
7. `.gitignore` đã là file modified trước khi triển khai và không được sửa bởi thay đổi tính năng. Giữ nguyên để bảo toàn thay đổi có sẵn.

Không có blocker kỹ thuật đang chặn lint, typecheck, unit, E2E, build hay smoke test. Các mục thủ công ở trên là xác minh nguồn dữ liệu, accessibility trên thiết bị và nghiệm thu dịch vụ thật.
