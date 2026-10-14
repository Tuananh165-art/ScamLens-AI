# Khắc phục Google OAuth `redirect_uri_mismatch`

## Chẩn đoán từ lỗi hiện tại

Google báo `400: redirect_uri_mismatch` nghĩa là URL trong tham số `redirect_uri` của yêu cầu OAuth không khớp chính xác với một **Authorized redirect URI** của Google OAuth Client ID đang được Supabase dùng. Google yêu cầu khớp chính xác scheme, hostname, port và path.

Trong ảnh cấu hình bạn gửi, Google client có `http://localhost:3000/auth/callback` và `http://localhost:3000` ở danh sách Authorized redirect URIs. Với kiến trúc ứng dụng này, đó là nhầm giữa hai callback:

| Nơi cấu hình | URL cần có | Vai trò |
|---|---|---|
| Google Cloud → Authorized redirect URIs | Callback Supabase, thường là `https://<PROJECT_REF>.supabase.co/auth/v1/callback` | Google trả kết quả đăng nhập cho Supabase Auth |
| Supabase → Authentication → URL Configuration → Redirect URLs | `http://localhost:3000/auth/callback` | Supabase trả session/code về ứng dụng local |
| Google Cloud → Authorized JavaScript origins | `http://localhost:3000` | Origin nơi người dùng bắt đầu đăng nhập khi chạy local |

Vì vậy **chưa cần deploy Vercel để sửa lỗi local**. Cấu hình localhost có thể hoạt động. Route `/auth/login` trả redirect ra khỏi Next.js; dùng document navigation trực tiếp để tránh Next cố tải RSC payload qua redirect liên miền.

## Sửa cấu hình local từng bước

1. Trong Supabase mở đúng project ScamLens AI.
2. Mở **Authentication → Sign In / Providers → Google**. Xác nhận provider đang bật. Sao chép trường **Callback URL** được dashboard hiển thị; không tự đoán project ref.
3. Mở Google Cloud Console, chọn đúng Google Cloud project rồi vào **Google Auth Platform → Clients**. Xác định Client ID trùng với Client ID đang được nhập ở Supabase Google provider.
4. Nếu client đang dùng thuộc app khác (ảnh hiện tên client `GoshopX`), tạo một OAuth Client ID loại **Web application** mới dành riêng cho ScamLens để tránh làm đổi cấu hình đăng nhập của app kia.
5. Trong client ScamLens, mục **Authorized JavaScript origins**, thêm đúng `http://localhost:3000`. Không thêm path `/auth/callback` vào origin.
6. Trong **Authorized redirect URIs**, thêm chính xác callback Supabase vừa sao chép. Với Supabase hosted thường có dạng `https://<PROJECT_REF>.supabase.co/auth/v1/callback`. Không dùng callback local của app tại ô này.
7. Lưu Google client. Sao chép Client ID và tạo/lấy Client Secret; nhập cả hai vào Supabase **Authentication → Sign In / Providers → Google**, rồi Save.
8. Trong Supabase mở **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` khi đang phát triển local.
   - **Redirect URLs**: có `http://localhost:3000/auth/callback`.
9. Trong `.env` local, giữ `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Các biến Supabase phải trỏ tới đúng project ScamLens và key public/anon tương ứng. Không đưa Client Secret, service-role key hay AI key vào `NEXT_PUBLIC_*`.
10. Dừng và chạy lại `npm.cmd run dev` sau khi đổi env. Mở trực tiếp `http://localhost:3000`, bấm Đăng nhập Google.

Luồng thành công phải là Google → URL callback `...supabase.co/auth/v1/callback` → `http://localhost:3000/auth/callback` → `/`. Nếu bắt đầu từ trang lịch sử, ứng dụng lưu đích `/history` trong cookie tạm và trả về lịch sử. Không thêm `?next=...` vào callback đã đăng ký. Nếu vẫn gặp lỗi, trên trang lỗi Google xem `redirect_uri` của request; so sánh nguyên văn với Google **Authorized redirect URIs** và kiểm tra Supabase đang dùng đúng Client ID vừa sửa.

## Khi deploy Vercel

Chỉ cần thêm origin và callback ứng dụng production sau khi đã có domain thật:

1. Vercel → Project → Settings → Environment Variables, đặt `NEXT_PUBLIC_APP_URL=https://scam-lens-ai.vercel.app` cho Production và redeploy.
2. Google Cloud client ScamLens → **Authorized JavaScript origins**: thêm `https://scam-lens-ai.vercel.app`; giữ `http://localhost:3000` nếu vẫn cần local.
3. Google Cloud → **Authorized redirect URIs**: giữ callback Supabase như cũ. Chỉ cần thêm URI khác nếu dùng một Supabase project/callback khác.
4. Supabase → **Authentication → URL Configuration**: đặt **Site URL** là `https://scam-lens-ai.vercel.app`; thêm `https://scam-lens-ai.vercel.app/auth/callback` vào **Redirect URLs**. Giữ local callback trong allowlist nếu vẫn cần dev local.
5. Kiểm tra Google provider trong Supabase vẫn dùng Client ID/Secret của client ScamLens.
6. Thử đăng nhập production. Không dùng URL preview wildcard rộng; chỉ thêm origin/callback preview cụ thể nếu thực sự cần đăng nhập ở preview.

Đăng nhập có thể trả lỗi consent/testing thay vì `redirect_uri_mismatch` nếu tài khoản Google chưa nằm trong danh sách test users của app External ở chế độ Testing. Khi đó kiểm tra **Google Auth Platform → Audience**. Đây là lỗi khác; xử lý sau khi callback URI đã khớp.

## Về `Failed to fetch RSC payload`

`GET /auth/login 307` là redirect khởi tạo OAuth. Trước đây nút dùng Next `<Link>`, nên Next thử điều hướng bằng fetch RSC; khi endpoint trả redirect liên miền tới Google/Supabase, fetch này có thể báo `Failed to fetch` rồi Next fallback sang full browser navigation. Nút đăng nhập hiện dùng thẻ `<a>` để trình duyệt đi theo redirect trực tiếp. Lỗi RSC này không phải nguyên nhân của Google `redirect_uri_mismatch`.

## Tài liệu chính thức

Với lỗi không hiện email, logout `403 Origin không hợp lệ` hoặc đổi Gmail vẫn thấy tài khoản cũ, làm theo [Kiểm tra session và chuyển tài khoản](AUTH_SESSION_FIX_VI.md).

- [Supabase: Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Google: OAuth 2.0 Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
