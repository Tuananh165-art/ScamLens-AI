# Import repo GitHub và deploy ScamLens AI trên Vercel

Vercel Hobby chỉ dành cho mục đích cá nhân, phi thương mại. Dùng checklist này cho portfolio/demo cá nhân; kiểm tra điều khoản hiện hành trước khi triển khai cho dịch vụ kinh doanh.

## 1. Tạo GitHub repository an toàn

Tại root local:

```powershell
git status --short --branch
git init
git add .
git status --short
```

Trước khi commit, xác minh `.env` và `.env.local` **không** hiện trong `git status`. Nếu vô tình staged, bỏ stage file env ngay; rotate key nếu từng push. Sau khi xác nhận chỉ có source, cấu hình GitHub repo mới, commit rồi push branch:

```powershell
git add .
git commit -m "Build ScamLens AI fraud-analysis demo"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

Không lưu secret trong GitHub Actions CI. `.env.example` chỉ chứa placeholder.

## 2. Tạo project Vercel qua GitHub Import

1. Mở Vercel và chọn **Add New → Project**.
2. Import repo GitHub ScamLens AI và chọn branch `main`.
3. Để framework preset là Next.js. Root Directory là repo root; giữ build command `npm run build` và install command `npm install` hoặc `npm ci`.
4. Chưa deploy cho đến khi environment variables đã nhập.
5. Trong Project Settings → Environment Variables thêm các nhóm:
   - AI: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`.
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - URL app: `NEXT_PUBLIC_APP_URL=https://<DOMAIN>`.
   - Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_HMAC_SECRET`.
   - Quota: năm biến `RATE_LIMIT_*` từ `.env.example`.
   - `SCAMLENS_DEMO_MODE=false` cho ứng dụng AI thật.
6. Chọn Production và Preview cho các biến phù hợp; tránh copy secret sang branch không tin cậy. Nhấn Save.
7. Deploy; kiểm tra build log không in env.

Nếu app báo thiếu `DEEPSEEK_API_KEY`/`DEEPSEEK_MODEL`, kiểm tra cột **Environments** của từng biến. Biến chỉ có scope **Preview** không được cấp cho Production. Mở Deployments để xem deployment URL đang lỗi chạy ở môi trường nào; thêm hai biến vào đúng môi trường đó (thường nên chọn cả Production và Preview cho demo cá nhân), lưu rồi tạo deployment mới. Environment Variables mới không được gắn ngược vào deployment cũ. Sau deployment, mở `https://<DOMAIN>/api/health`: `services.textAi` và `services.imageAi` phải là `true`. Giá trị `true` chỉ chứng minh biến có mặt, chưa xác minh key/model gọi được.

Sau migration provider, chỉ giữ `DEEPSEEK_API_KEY` và `DEEPSEEK_MODEL` trong nhóm AI. Xóa `GEMINI_API_KEY`, `GEMINI_MODEL` và các biến Zen cũ (`AI_ENDPOINT`, `AI_API_KEY`, `AI_MODEL`) khỏi Production/Preview rồi redeploy để áp dụng cấu hình mới.

AI keys và Upstash REST token luôn server-only. Supabase URL và anon/publishable key là key public có RLS bảo vệ; tuyệt đối không cấu hình service-role key.

## 3. OAuth trên domain triển khai

1. Ghi lại domain deployment Production đang hoạt động.
2. Thêm `https://<DOMAIN>/auth/callback` vào Supabase Authentication → URL Configuration → Redirect URLs.
3. Đặt Site URL thành `https://<DOMAIN>`.
4. Bổ sung origin `https://<DOMAIN>` vào **Authorized JavaScript origins** của Google OAuth client. Google **Authorized redirect URIs** phải giữ callback Supabase `https://<PROJECT_REF>.supabase.co/auth/v1/callback` lấy trực tiếp từ provider page, không phải `https://<DOMAIN>/auth/callback`.
5. Cập nhật `NEXT_PUBLIC_APP_URL` của Vercel thành origin canonical, không có path.
6. Redeploy. Thử đăng nhập Google, lưu lịch sử, mở và xóa report.

Vercel Preview có origin khác nhau. Chỉ cho Preview đăng nhập nếu đã khai báo chính xác từng origin/callback; không dùng redirect wildcard ngoài chính sách nhà cung cấp.

## 4. Smoke test sau deploy

Mở `https://<DOMAIN>/api/health`; chỉ xác nhận biến cấu hình tồn tại, không xác minh provider thật. Sau đó:

1. Mở app trong tab riêng tư và chạy một nội dung giả, đã đồng ý gửi.
2. Chạy một lượt ảnh giả, che dữ liệu trước khi đọc.
3. Đăng nhập Google, lưu/mở/xóa lịch sử.
4. Xác minh tab Network không thấy URL trang đáng ngờ được fetch.
5. Xem log Vercel; bảo đảm không có nội dung người dùng hoặc key.
6. Ghi kết quả `pass`, `blocked`, `unverified` vào báo cáo nghiệm thu; xóa báo cáo fixture.

Nếu phần ảnh báo lỗi, chọn ảnh và bấm **Tiếp tục với ảnh đã che** chỉ chuẩn bị ảnh trong trình duyệt; request mạng tới `/api/ocr` chỉ chạy khi bấm **Đọc ảnh đã che bằng DeepSeek**. Trong DevTools → Network, xem status và JSON response của `/api/ocr`: 503 với lỗi cấu hình thường cùng nguyên nhân scope/deployment ở trên; 413 là vượt giới hạn request; 415 là định dạng/signature không được hỗ trợ; 401/403/402/429 đến từ quyền, số dư hoặc quota nhà cung cấp. Sau khi sửa cấu hình, redeploy rồi thử lại. Giao diện giữ ảnh đã che để retry nếu OCR API tạm lỗi.

## 5. Cập nhật an toàn

Push branch cập nhật để Vercel tạo preview. Chạy các lệnh CI/local trước khi merge `main`. Khi model, redirect URI hoặc secret đổi, cập nhật theo đúng provider dashboard, redeploy và thử một fixture giả. Không bật billing/autoreload trong quá trình này.
