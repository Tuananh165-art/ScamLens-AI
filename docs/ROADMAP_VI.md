# Roadmap và nghiệm thu ScamLens AI

Trạng thái ghi nhận ngày 14/10/2026. `PASS` chỉ áp dụng cho bằng chứng local ghi bên dưới; cấu hình trên tài khoản bên ngoài vẫn cần nghiệm thu riêng.

## M1 — Nền tảng và kết nối AI

- [x] Next.js App Router, TypeScript, Tailwind, lockfile, scripts và `.gitignore`.
- [x] Adapter server-side cho Zen và Gemini; lỗi provider được chuyển thành lỗi an toàn, không fallback.
- [x] `npm.cmd run smoke:ai -- gemini` — `PASS`: `gemini-2.5-flash`, JSON hợp lệ, finish reason `STOP`, dùng ảnh một pixel tổng hợp.
- [ ] Zen live — `BLOCKED`: key/model hiện cấu hình nhận HTTP 403 ở endpoint trong `.env` (`/zen/v1/chat/completions`) và cả endpoint `/inference/v1/chat/completions` được tài liệu hiện hành công bố. Response body bị loại khỏi log. Cần kiểm tra quyền key, model và tài khoản OpenCode; không đổi model hay bật billing tự động.

## M2 — Văn bản, email, URL và bằng chứng

- [x] Form tiếng Việt, nội dung mẫu, consent trước khi gửi, review dữ liệu đã che.
- [x] Luật phân tích, schema có cấu trúc, đối chiếu bằng chứng với nguồn và tính lại mức rủi ro từ finding hợp lệ.
- [x] Parse URL cục bộ bằng WHATWG URL và `tldts`; không gửi request đến hostname người dùng nhập.
- [x] Xuất/print báo cáo, checklist kiểm chứng và giới hạn.
- [ ] Bộ acceptance 30 fixture mục tiêu — chưa hoàn tất; hiện có 11 unit/API tests cùng 3 browser tests. Cần mở rộng các fixture phủ đủ nhóm tình huống trước khi tuyên bố chất lượng phân tích đã được đánh giá rộng.

## M3 — Ảnh và xác nhận OCR

- [x] Upload một ảnh, giới hạn kích thước, kiểm tra MIME/signature; browser re-encode và vẽ vùng che đặc trước upload.
- [x] Gemini đọc ảnh đã xử lý; người dùng xem/sửa/xác nhận bản chữ trước khi gửi Zen.
- [x] Ảnh gốc không được lưu cùng báo cáo.
- [ ] Bộ sáu ảnh fixture và E2E sửa OCR — chưa có bằng chứng tự động trong phiên này; demo thủ công chỉ dùng ảnh giả.

## M4 — Đăng nhập, lịch sử và quota

- [x] Supabase SSR auth, Google OAuth routes, callback giới hạn same-origin và logout.
- [x] Migration bảng báo cáo, RLS owner-only, lưu chủ động, xem và xóa báo cáo.
- [x] Upstash rate limit dùng HMAC cho user/IP; production từ chối đóng khi thiếu Redis hoặc secret.
- [ ] Supabase/Google OAuth/RLS live acceptance — `BLOCKED` bởi chưa có project và OAuth client bên ngoài. Cần chạy thử A/B, truy cập chéo ID và xóa bằng JWT của từng tài khoản sau khi cấu hình.
- [ ] Upstash production quota — `BLOCKED` bởi chưa có Redis REST credentials; hiện chỉ kiểm tra source/build, chưa chứng minh quota phân tán live.

## M5 — Hoàn thiện, CI và deploy

- [x] Giao diện responsive và tài liệu setup, dịch vụ, riêng tư, test/demo, deploy bằng tiếng Việt.
- [x] GitHub Actions chạy lint, typecheck, unit test và build với Node.js 24; không gọi AI trong CI.
- [x] Lint, typecheck, 11 test, 3 Playwright E2E và production build — `PASS` trong workspace local.
- [ ] GitHub push và Vercel deployment — `BLOCKED` bởi chưa kết nối repo/tài khoản; chưa có URL deployment để smoke test.

## Lệnh tái hiện kiểm tra local

Từ thư mục repo trong PowerShell:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.playwright"
npm.cmd run test:e2e
npm.cmd run build
```

Smoke test AI là bước live riêng, có thể tiêu quota provider:

```powershell
npm.cmd run smoke:ai -- gemini
npm.cmd run smoke:ai -- zen
```

## Kết luận nghiệm thu hiện tại

Ứng dụng đã có source, workflow chính, migration, CI và hướng dẫn có thể review; toàn bộ kiểm tra local phía trên đạt. Chưa thể đánh dấu project hoàn thành theo gate ban đầu vì Zen trả 403, dịch vụ Supabase/Upstash chưa được kết nối hoặc kiểm tra quyền cách ly live, và chưa có GitHub/Vercel deployment. Không dùng demo-rules hoặc Gemini smoke thành công để suy ra Zen đang hoạt động.
