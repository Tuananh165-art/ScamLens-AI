# Roadmap và nghiệm thu ScamLens AI

Trạng thái migration ghi nhận ngày 15/10/2026. `PASS` chỉ áp dụng cho bằng chứng local ghi bên dưới; cấu hình trên tài khoản bên ngoài vẫn cần nghiệm thu riêng.

## M1 — Nền tảng và kết nối AI

- [x] Next.js App Router, TypeScript, Tailwind, lockfile, scripts và `.gitignore`.
- [x] Adapter server-side Gemini dùng structured output và cùng model cho văn bản/ảnh; validation Zod, timeout và lỗi an toàn.
- [ ] Gemini live text report — smoke trước đó đã qua schema; lần kiểm tra mới nhất sau khi đồng bộ giới hạn schema nhận HTTP 429. Cần kiểm tra quota trong Google AI Studio và chạy lại sau khi hạn mức reset.
- [x] Gemini live image input — smoke nhận ảnh PNG giả lập và trả JSON OCR qua schema ở lần kiểm tra gần nhất. Đây chỉ xác nhận kết nối/contract; chưa đánh giá chất lượng OCR trên ảnh giao dịch thực tế.
- [x] Zen được loại khỏi runtime source; sau deploy cần xóa ba biến `AI_ENDPOINT`, `AI_API_KEY`, `AI_MODEL` khỏi môi trường Vercel.

## M2 — Văn bản, email, URL và bằng chứng

- [x] Form tiếng Việt, nội dung mẫu, consent trước khi gửi, review dữ liệu đã che.
- [x] Luật phân tích, schema có cấu trúc, đối chiếu bằng chứng với nguồn và tính lại mức rủi ro từ finding hợp lệ.
- [x] Parse URL cục bộ bằng WHATWG URL và `tldts`; không gửi request đến hostname người dùng nhập.
- [x] Xuất/print báo cáo, checklist kiểm chứng và giới hạn.
- [ ] Bộ acceptance 30 fixture mục tiêu — chưa hoàn tất; hiện có 13 unit/API tests cùng 5 browser tests. Cần mở rộng các fixture phủ đủ nhóm tình huống trước khi tuyên bố chất lượng phân tích đã được đánh giá rộng.

## M3 — Ảnh và xác nhận OCR

- [x] Upload một ảnh, giới hạn kích thước, kiểm tra MIME/signature; browser re-encode và vẽ vùng che đặc trước upload.
- [x] Gemini đọc ảnh đã xử lý; người dùng xem/sửa/xác nhận bản chữ trước khi gửi Gemini phân tích.
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
- [x] Lint, typecheck, 13 unit/API tests, 5 Playwright E2E và production build — `PASS` trong workspace local ngày 15/10/2026.
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

Smoke test AI là bước live riêng, gọi hai lần Gemini và có thể tiêu quota:

```powershell
npm.cmd run smoke:ai
```

## Kết luận nghiệm thu hiện tại

Migration mã nguồn sang Gemini đã qua lint, typecheck, 13 unit/API tests, 5 Playwright E2E và production build tại local. Gemini image-input smoke pass; text smoke trước đó pass nhưng lần gần nhất trả HTTP 429 sau khi schema được siết khớp với Zod, nên xác nhận text live đang chờ quota và smoke lại. Chưa có bằng chứng kiểm thử chất lượng OCR trên ảnh thật, gọi toàn bộ workflow `/api/analyze` qua UI với provider live, Supabase/RLS, Upstash production quota hoặc Vercel deployment. Vercel cần redeploy với Gemini env; sau đó xóa các biến Zen cũ khỏi Vercel. Demo mode không chứng minh Gemini live.
