# ScamLens AI — kế hoạch, kết quả và việc còn cần xử lý

Cập nhật: 22/10/2026

## Mục tiêu và thứ tự triển khai

1. Đọc tài liệu nâng cấp, so khớp từng đề xuất với mã nguồn hiện tại và giữ các nguyên tắc về quyền riêng tư, bằng chứng nguyên văn, không tự mở URL và không xác nhận giao dịch từ ảnh.
2. Sửa schema AI, giới hạn đầu ra, cấu hình model Vision, đối chiếu bằng chứng và phân tích URL ngoại tuyến.
3. Bổ sung thư viện tám tình huống, cảm biến heuristic, OCR có trường dữ liệu biên lai và gợi ý kiểm tra chéo.
4. Tái cấu trúc luồng nhập/đồng thuận, báo cáo bằng chứng, checklist, công cụ che ảnh và hệ thống giao diện desktop/mobile.
5. Chạy lint, typecheck, unit, E2E, build và smoke provider; ghi lại lỗi môi trường và lần sửa.

## Checklist triển khai theo tài liệu gốc

### Bước 1 — Adapter AI và bằng chứng

- [x] 2.1: Nới giới hạn report và chuẩn hóa payload trước Zod tại `src/lib/analysis/schema.ts`, `src/lib/ai/deepseek.ts`.
- [x] 2.2: Dùng `DEEPSEEK_VISION_MODEL` riêng, không whitelist tên model tại `src/lib/ai/deepseek.ts`.
- [x] 2.3, 5.1: Khớp bằng chứng qua biến thể hoa/thường, khoảng trắng, dấu câu; vẫn lưu tọa độ lát cắt nguyên văn tại `src/lib/analysis/evidence.ts` và render trong `src/components/home-app.tsx`.
- [x] 2.5: Bổ sung phân tích social engineering, ràng buộc bằng chứng và ngôn ngữ thận trọng tại `src/lib/analysis/prompts.ts`.
- [x] Bổ sung bóc tách redirect nhiều tầng ngoại tuyến và regression test tại `src/lib/analysis/url.ts`.

### Bước 2 — Demo và cảm biến cục bộ

- [x] 2.4, mục 3: Thay demo bằng 8 tình huống có thể chọn, đánh nhãn tình huống tổng hợp giả lập tại `src/lib/analysis/case-studies.ts` và `src/components/home-app.tsx`.
- [x] 4.6: Thêm cảm biến regex debounce 150 ms; hiển thị câu khớp và cảnh báo nhận nhầm/bỏ sót tại `src/lib/analysis/heuristics.ts` và `src/components/home-app.tsx`.
- [x] 4.3: Thay tranh CSS giả lập bằng radar scan CSS responsive, có nhãn cục bộ và không đưa số liệu/tin tức giả.

### Bước 3 — UI/UX và quyền riêng tư

- [x] 4.1, 4.9: Thêm design tokens/semantic colors, nền dark slate và trạng thái focus trong `src/app/theme.css`; xác nhận không có chữ DOM dưới 12 px ở viewport Chromium 390 px.
- [x] 4.2: Header 72 px, trạng thái điều hướng, avatar hình tròn 32 px khi OAuth metadata có ảnh; thanh đáy chung cho trang phân tích, hướng dẫn và lịch sử.
- [x] 4.4: Một vùng nhập, xem payload đã che, bật/tắt che tự động, đếm mẫu nhạy cảm theo cùng bộ regex che và một checkbox đồng thuận mặc định bỏ chọn; sửa nội dung sẽ hủy đồng thuận.
- [x] 4.5: Canvas ảnh có Undo/Redo, pointer handling, paste có focus, tái mã hóa ảnh và thu hồi Object URL.
- [x] 4.7: Tô sáng bằng chứng trong nguồn, giải thích theo hover/title, bốn nhóm tín hiệu không hiển thị giả xác suất; checklist lưu theo report trong localStorage.
- [x] 4.8: Nâng touch target và typography mobile; có kiểm tra không tràn ngang và giảm chuyển động.
- [x] 4.10: Thêm trạng thái shimmer, phản hồi nhấn và radar animation; tôn trọng `prefers-reduced-motion`.

### Bước 4 — URL và dữ liệu biên lai

- [x] 5.3: Soi URL offline: IDN/punycode, Unicode đồng hình phổ biến, port lạ, userinfo, IP, thương hiệu mạo danh và đích redirect lồng; không fetch URL.
- [x] 5.4: OCR trả trường biên lai tùy chọn; giao diện yêu cầu người dùng đối chiếu; phát hiện chênh lệch số/chữ, chuỗi mã tuần tự đơn giản và loại chuyển khoản mâu thuẫn.
- [x] Sửa lỗi schema OCR: dữ liệu giao dịch sai kiểu không còn làm mất OCR text; regression nằm trong `src/lib/ai/deepseek.test.ts`.
- [~] 5.2: Đã có metadata signature hint offline. Không triển khai ELA/compression score `0–100`: chưa có tập ảnh gắn nhãn và thuật toán hiệu chuẩn; kết quả score cố định theo metadata dễ khiến người dùng coi là kết luận. Giới hạn và đề xuất nghiên cứu được ghi tại mục dưới.

### Bước 5 — Nghiệm thu

- [x] Chạy đủ 5 lệnh kiểm chuẩn mục 6 và 10 E2E Chromium trên server riêng.
- [x] Chụp/kiểm tra trực quan production local ở desktop và mobile; không thay thế thử trên iOS/Android thật.
- [ ] Chủ dự án thao tác thủ công: kiểm thử OAuth/RLS bằng hai tài khoản, xác nhận nội dung OCR trên ảnh đầu vào thực tế của người dùng, và nghiệm thu mobile/accessibility trên thiết bị.

## Cập nhật UI/UX cỡ chữ và luồng cho người mới — 22/10/2026

- Thêm bộ điều chỉnh cỡ chữ **Nhỏ / Mặc định / Lớn** trên trang phân tích, hướng dẫn và lịch sử ở desktop; thanh điều hướng mobile có cùng điều khiển. Mặc định lớn hơn bản cũ; lựa chọn được lưu trong `localStorage` và khôi phục trước khi trang hiển thị.
- Các cỡ chữ trong stylesheet dùng chung thang đo, vẫn giữ thứ bậc tiêu đề/nội dung và tự xuống dòng theo bố cục. Mức nhỏ không đưa chữ mobile xuống dưới 12 px.
- Rút gọn phần mở đầu; thay radar trang trí bằng ba bước hướng dẫn rõ ràng trên desktop; bỏ đoạn hướng dẫn lặp phía dưới; ẩn thẻ hướng dẫn trên mobile để vùng nhập xuất hiện sớm hơn.
- Header mobile giữ logo và đăng nhập trên một hàng. Thanh điều hướng có nút mở bảng tăng/giảm cỡ chữ.
- E2E mới xác nhận tăng/giảm và khôi phục cỡ chữ, dùng được trên các trang desktop, lưu lựa chọn sau reload, chữ không dưới 12 px ở mobile, vùng tab không bị thanh đáy che và không tràn ngang ở 320 / 360 / 390 / 768 / 900 / 1024 / 1280 / 1440 px khi chọn cỡ chữ lớn.
- Rà production bằng ảnh ở mobile 390 px, tablet 768 px và desktop 1440 px. Lượt rà đầu phát hiện tràn ngang 768 px và 1024 px ở chân bảng cảm biến; đã cho phần này xuống dòng, đồng thời chuyển bố cục cỡ chữ lớn tại tablet sang một cột. Lượt đo lại cả tám viewport đều không tràn.
- Nghiệm thu trên điện thoại thật, VoiceOver/TalkBack và audit tương phản vẫn cần người dự án thao tác thủ công; Chromium giả lập không thay thế các kiểm tra đó.

## Kết quả theo yêu cầu

| Yêu cầu | Kết quả |
|---|---|
| Schema và payload AI | Mở giới hạn summary/checklist/limitations; chuẩn hóa an toàn trước `safeParse`; smoke script cùng hợp đồng với ứng dụng. |
| Model OCR/Vision | Thêm `DEEPSEEK_VISION_MODEL`, mặc định dùng `DEEPSEEK_MODEL`; bỏ whitelist cố định để provider trả lỗi capability chính xác. |
| Bằng chứng | Đối chiếu chính xác trước, sau đó chuẩn hóa hoa/thường, khoảng trắng và dấu câu; kết quả luôn giữ `quote/start/end` theo lát cắt nguyên văn nguồn. |
| Tám case study | Có đủ tám lựa chọn ở giao diện và nội dung giả lập theo các kịch bản trong tài liệu. Chúng được gắn nhãn tình huống tổng hợp, không tuyên bố là hồ sơ vụ án có nguồn. |
| Prompt hành vi | Bổ sung các cơ chế áp lực, mạo danh, chân trong cửa, chi phí chìm, tài khoản thứ ba và lời hứa lợi nhuận; bắt buộc có bằng chứng và ngôn ngữ thận trọng. |
| Design system và điều hướng | Bổ sung tokens, màu semantic, nền dark slate, trạng thái focus, nav desktop, thanh đáy mobile dùng chung mọi trang, avatar tròn nếu nhà cung cấp xác thực có ảnh; radar minh họa ghi rõ là cục bộ, không phải dữ liệu sự cố trực tiếp. |
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
- `npm.cmd run test` — 15 file, 60 test đạt; gồm regression OCR khi trường biên lai sai kiểu, bóc tách redirect nhiều lớp và đếm mẫu nhạy cảm.
- `npm.cmd run test:e2e` — 11 test Chromium đạt, gồm consent, preview che dữ liệu, highlight report, checklist localStorage, luồng retry ảnh, theme, mobile overflow, menu đáy và điều chỉnh cỡ chữ desktop/mobile.
- E2E xác nhận trên viewport 390 px: không tràn ngang và không có text DOM dưới 12 px.
- `npm.cmd run build` — đạt; Next tạo đủ static pages và route.
- `npm.cmd run smoke:ai` — DeepSeek text và image OCR đều trả JSON hợp lệ và qua schema sau sanitizer. Smoke gọi provider bằng nội dung mẫu và ảnh 1×1, dùng quota API.
- `git diff --check` — đạt.

## Lỗi gặp và cách xử lý

- Vitest trong sandbox dừng trước khi tải test với `spawn EPERM`; chạy lại trong execution context được phép thì hoàn tất.
- Lần build sandbox đầu biên dịch được nhưng Next không spawn được worker TypeScript (`spawn EPERM`); build trong execution context được phép đã đạt.
- Smoke đầu tiên nhận JSON hợp lệ nhưng script cũ kiểm tra giới hạn schema cũ và không dùng sanitizer của ứng dụng. Đã đồng bộ validator, chạy lại một lần; cả text và OCR đạt.
- Lần E2E đầu có locator mơ hồ giữa `<summary>` và nội dung đồng thuận; sửa locator. Bộ E2E cuối cùng đạt.
- E2E ban đầu dùng lại `localhost:3000`, vốn đang phục vụ ứng dụng NaiVerse; chuyển sang server riêng `localhost:3187`, không dùng lại server sẵn có và tắt Supabase trong webServer kiểm thử. Khớp hostname `localhost` để kiểm tra Origin đúng với URL Next nhận.
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
