# Thiết lập Supabase, Google OAuth và Upstash

Các dashboard thay đổi theo thời gian; tên menu có thể khác đôi chút. Dùng đúng project URL và OAuth callback được hiển thị trong dashboard của chính bạn.

## 1. Tạo project Supabase

1. Tạo project cá nhân ở Supabase Free.
2. Chờ trạng thái project sẵn sàng; lưu database password trong password manager.
3. Mở **Project Settings → API** (hoặc API Keys) và sao chép Project URL cùng anon/publishable key. Không sử dụng `service_role`.
4. Trong `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`, mở SQL editor.
5. Dán nội dung `supabase/migrations/202610140001_create_analysis_reports.sql`, chạy và xác nhận không có lỗi.
6. Vào Table Editor, chọn `analysis_reports`, mở RLS Policies. Kiểm tra RLS bật và có SELECT/INSERT/DELETE cho người dùng đăng nhập, mỗi policy ràng buộc `auth.uid() = user_id`.
7. Thêm vào env local:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PUBLISHABLE_OR_LEGACY_ANON_KEY>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart `npm.cmd run dev` sau khi đổi env.

## 2. Cấu hình Google OAuth

1. Trong Google Cloud Console tạo hoặc chọn project dùng cho demo.
2. Mở **Google Auth Platform → Branding**, đặt tên hiển thị và email hỗ trợ. Hoàn tất trạng thái testing/consent theo yêu cầu Google.
3. Mở **Clients**, tạo OAuth client loại **Web application** riêng cho ScamLens. Không dùng chung client thuộc ứng dụng/domain khác nếu client đó đang hoạt động.
4. Ở **Authorized JavaScript origins**, thêm origin local `http://localhost:3000` (chỉ scheme + host + port, không có path).
5. Trong Supabase **Authentication → Sign In / Providers → Google**, bật Google provider rồi sao chép chính xác callback URI mà dashboard hiển thị. Với Supabase hosted, URI thường dạng `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
6. Thêm URI Supabase vừa sao chép vào **Authorized redirect URIs** của Google OAuth client. Đây là callback Google → Supabase. Không đặt `http://localhost:3000/auth/callback` tại mục Google này. Lưu Client ID và Client Secret.
7. Dán Client ID/Secret của đúng Google client vào Supabase provider Google rồi lưu.
8. Trong Supabase **Authentication → URL Configuration**, đặt Site URL là `http://localhost:3000` và thêm `http://localhost:3000/auth/callback` vào danh sách **Redirect URLs**.
9. Mở `http://localhost:3000`, bấm Đăng nhập. Luồng đúng là Google → callback Supabase → `http://localhost:3000/auth/callback` → `/history`.

Khi có domain Vercel, thêm `https://<DOMAIN>/auth/callback` vào Supabase **Redirect URLs** và cập nhật Site URL thành `https://<DOMAIN>`. Trong Google Cloud, thêm origin `https://<DOMAIN>` vào **Authorized JavaScript origins**. Google **Authorized redirect URI** vẫn là callback Supabase được hiển thị ở provider, không phải callback Vercel. Không dùng wildcard redirect rộng.

## 3. Tạo Upstash Redis để quota hoạt động giữa các instance

1. Tạo database Redis ở Upstash, chọn region gần nơi triển khai.
2. Trong database, mở **REST API** và sao chép REST URL cùng REST token.
3. Tạo secret HMAC ngẫu nhiên local:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

4. Thêm ba biến env:

```dotenv
UPSTASH_REDIS_REST_URL=https://<DATABASE>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<REST_TOKEN>
RATE_LIMIT_HMAC_SECRET=<RANDOM_SECRET>
```

URL, REST token và HMAC secret chỉ dùng server side; không đưa prefix `NEXT_PUBLIC_` vào tên.

## 4. Quota mặc định và sự cố dịch vụ

```dotenv
RATE_LIMIT_GUEST_DAILY=20
RATE_LIMIT_USER_DAILY=60
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_DEEPSEEK_DAILY=100
```

Đây là hạn mức cứng của ứng dụng cho tổng số lượt DeepSeek (phân tích và OCR), không bao gồm hoặc bảo đảm số dư API miễn phí. Giới hạn cá nhân theo ngày làm mới lúc 00:00 UTC; giới hạn phút trả thời gian chờ qua `Retry-After`. API phân biệt lượt/phút, lượt/ngày và trần provider/ngày trong thông báo 429. Kiểm tra số dư và giới hạn tài khoản tại DeepSeek Platform trước khi chạy live smoke. Upstash hết quota hoặc không kết nối được sẽ làm API từ chối an toàn, thay vì bỏ qua rate limit trong production.

Kiểm tra cấu hình:

```powershell
(Invoke-RestMethod http://localhost:3000/api/health).services | Format-List
```

Health chỉ cho biết env đã có. Xác nhận Google sign-in, đọc một báo cáo người dùng đã lưu và thử truy cập ID không thuộc tài khoản hiện tại để chứng minh RLS.
