# Roadmap và nghiệm thu ScamLens AI

Trạng thái migration ghi nhận ngày 15/10/2026. `PASS` chỉ áp dụng cho bằng chứng local ghi bên dưới; live DeepSeek smoke chưa chạy trong migration này để tránh tiêu số dư API mà không cần thiết.

## M1 — Nền tảng và kết nối AI

- [x] Next.js App Router, TypeScript, Tailwind, lockfile, scripts và `.gitignore`.
- [x] Adapter server-side DeepSeek dùng JSON mode, validation Zod, timeout và lỗi an toàn; cùng model cho text và vision.
- [ ] DeepSeek live text report và vision — chưa được gọi trong migration này. Chạy `npm.cmd run smoke:ai` có thể tiêu số dư API; kiểm tra balance/key trước khi chạy.
- [x] Gemini SDK/adapter và Zen đã được gỡ khỏi runtime source; sau deploy cần xóa biến `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_ENDPOINT`, `AI_API_KEY`, `AI_MODEL` khỏi Vercel.

## M2 — Văn bản, email, URL và bằng chứng

- [x] Form tiếng Việt, nội dung mẫu, consent trước khi gửi, review dữ liệu đã che.
- [x] Luật phân tích, schema có cấu trúc, đối chiếu bằng chứng với nguồn và tính lại mức rủi ro từ finding hợp lệ.
- [x] Parse URL cục bộ bằng WHATWG URL và `tldts`; không gửi request đến hostname người dùng nhập.
- [x] Xuất/print báo cáo, checklist kiểm chứng và giới hạn.
- [ ] Bộ acceptance 30 fixture mục tiêu — chưa hoàn tất; hiện có 17 unit/API tests cùng 5 browser tests. Cần mở rộng các fixture phủ đủ nhóm tình huống trước khi tuyên bố chất lượng phân tích đã được đánh giá rộng.

## M3 — Ảnh và xác nhận OCR

- [x] Upload một ảnh, giới hạn kích thước, kiểm tra MIME/signature; browser re-encode và vẽ vùng che đặc trước upload.
- [x] DeepSeek đọc ảnh đã xử lý; người dùng xem/sửa/xác nhận bản chữ trước khi gửi DeepSeek phân tích.
- [x] Ảnh gốc không được lưu cùng báo cáo.
- [ ] Bộ sáu ảnh fixture và OCR live — chưa hoàn tất. E2E chọn/tái mã hóa ảnh và giữ ảnh để retry khi OCR trả lỗi cấu hình đã pass bằng mock; chưa chứng minh chất lượng OCR từ DeepSeek live.

## M4 — Đăng nhập, lịch sử và quota

- [x] Supabase SSR auth, Google OAuth routes, callback giới hạn same-origin và logout.
- [x] Migration bảng báo cáo, RLS owner-only, lưu chủ động, xem và xóa báo cáo.
- [x] Upstash rate limit dùng HMAC cho user/IP; production từ chối đóng khi thiếu Redis hoặc secret.
- [ ] Supabase/Google OAuth/RLS live acceptance — `BLOCKED` bởi chưa có project và OAuth client bên ngoài. Cần chạy thử A/B, truy cập chéo ID và xóa bằng JWT của từng tài khoản sau khi cấu hình.
- [ ] Upstash production quota — `BLOCKED` bởi chưa có Redis REST credentials; hiện chỉ kiểm tra source/build, chưa chứng minh quota phân tán live.

## M5 — Hoàn thiện, CI và deploy

- [x] Giao diện responsive và tài liệu setup, dịch vụ, riêng tư, test/demo, deploy bằng tiếng Việt.
- [x] GitHub Actions chạy lint, typecheck, unit test và build với Node.js 24; không gọi AI trong CI.
- [x] Lint, typecheck, unit/API tests, Playwright E2E và production build — source DeepSeek: lint/typecheck pass; 5 file test, 17 test pass; E2E 6/6 pass; production build pass.
- [ ] Vercel — cần redeploy source mới với DeepSeek env và xác minh workflow live trên deployment.

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

Smoke test AI là bước live riêng, gọi hai lần DeepSeek và có thể tiêu quota:

```powershell
npm.cmd run smoke:ai
```

## Kết luận nghiệm thu hiện tại

Migration mã nguồn sang DeepSeek đã chuyển API routes, quota, lỗi, giao diện và tài liệu. Chưa có bằng chứng live DeepSeek; chạy smoke sẽ gọi text và vision và có thể tiêu số dư tài khoản. Supabase/RLS, Upstash production quota, workflow live đầy đủ và Vercel vẫn là nghiệm thu riêng. Vercel cần redeploy với `DEEPSEEK_API_KEY`/`DEEPSEEK_MODEL`, xóa biến Gemini/Zen cũ rồi smoke bằng dữ liệu giả. Demo mode không chứng minh DeepSeek live.
