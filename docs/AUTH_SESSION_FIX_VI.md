# Đăng nhập Google, hiển thị email và chuyển tài khoản

## Những lỗi đã tìm thấy trong source

- API mutation trước đây chỉ so Origin với `NEXT_PUBLIC_APP_URL`. Khi mở bằng domain Vercel khác, logout/lưu/xóa lịch sử bị chặn dù request cùng origin. Bản sửa so Origin với URL thực của request, vẫn từ chối request thiếu Origin hoặc từ website khác; không cho phép wildcard `*.vercel.app`.
- Login trước đây gửi callback về `NEXT_PUBLIC_APP_URL` và kèm `?next=%2Fhistory`. Host callback khác host bắt đầu login làm cookie PKCE không được gửi; callback không khớp allowlist có thể về Site URL. Các ảnh trước có `/?code=...`; trang chủ trước đây không xử lý code này.
- Bản sửa dùng callback chính xác `<origin hiện tại>/auth/callback`, giữ cookie trên cùng host. Đích trang sau login được lưu trong cookie HttpOnly tạm, mặc định về trang chủ. Proxy xử lý code về root trước khi render và refresh cookie session trước các trang có user.
- CSS trước đây ẩn email trên màn hình nhỏ. Bản sửa hiển thị email trên cả desktop/mobile, có title để xem đầy đủ nếu bị rút gọn.
- Logout kiểm tra kết quả Supabase, dùng scope local, rồi tải lại document để xóa state riêng và cache điều hướng của trình duyệt. Nếu lỗi, hiển thị tại nút để retry; không chuyển sang trang JSON.
- `prompt: select_account` đã có trong source và được giữ. Đăng xuất ScamLens không đăng xuất tài khoản Google trong trình duyệt.

## 1. Chọn một domain production

Vào Vercel → project → Domains. Chọn domain production ổn định và sử dụng cùng domain từ đầu đến cuối quá trình đăng nhập. Không đổi domain giữa login và callback. Không yêu cầu mua domain; có thể dùng domain `.vercel.app` được gán cho production.

Domain production đã xác nhận:

```text
https://scam-lens-ai.vercel.app
```

Nếu tiếp tục dùng URL đó để đăng nhập, callback cần có trong Supabase:

```text
https://scam-lens-ai.vercel.app/auth/callback
```

Hãy dùng domain này xuyên suốt khi mở app, đăng nhập và quay về callback. Không dùng URL deployment cũ có mã `2960c35f` để test production.

## 2. Cấu hình Supabase và Google

1. Supabase → Authentication → URL Configuration → Site URL: điền origin production, không kèm `/auth/callback`.
2. Redirect URLs: thêm chính xác `https://scam-lens-ai.vercel.app/auth/callback`. Giữ `http://localhost:3000/auth/callback` nếu cần local. Không thêm query `?next=...`.
3. Nhấn lưu. Nếu đăng nhập bằng một alias khác, thêm chính xác callback của alias đó trước khi test; đừng dùng wildcard rộng để che lỗi cấu hình.
4. Supabase → Sign In / Providers → Google: kiểm tra đang dùng đúng Google client dành cho ScamLens.
5. Google Auth Platform → Clients → client đó → Authorized redirect URIs: giữ callback **Supabase** hiển thị trong provider page, thường `https://<PROJECT_REF>.supabase.co/auth/v1/callback`. Không thay nó bằng callback Vercel.
6. Nếu app Google đang Testing và tài khoản bị từ chối, thêm tài khoản demo vào Audience → Test users theo thông báo Google. Lỗi này khác lỗi session của ứng dụng.

[Supabase yêu cầu redirectTo khớp URL allowlist](https://supabase.com/docs/guides/troubleshooting/why-am-i-being-redirected-to-the-wrong-url-when-using-auth-redirectto-option-_vqIeO). [SSR cần cookie session và Proxy để lưu token đã refresh](https://supabase.com/docs/guides/auth/server-side/creating-a-client?environment=client-component).

## 3. Đưa bản sửa lên Vercel

Tại `F:\ScamLens AI`, kiểm tra:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.playwright"
npm.cmd run test:e2e
npm.cmd run build
git status --short
```

Chỉ đưa source/docs/tests vào Git, không đưa `.env`. Sau khi commit/push bản sửa lên branch production, chờ deployment mới Ready. Redeploy lại commit cũ sẽ không có code sửa.

Trong Vercel → Settings → Environment Variables, kiểm tra **Production** có `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` đúng project. Đặt `NEXT_PUBLIC_APP_URL=https://scam-lens-ai.vercel.app` cho metadata. Luồng OAuth/logout mới không dùng biến này để ép sang host khác. Thay env cần deployment mới.

## 4. Test A → logout → B từng bước

1. Đóng mọi cửa sổ ẩn danh cũ, mở cửa sổ ẩn danh mới. Các cửa sổ ẩn danh cùng phiên có thể dùng chung cookie; mở thêm một cửa sổ chưa chắc là phiên mới.
2. Mở domain đã chọn, không dán URL có `?code=` cũ. Trang chưa login phải có nút Đăng nhập.
3. Bấm Đăng nhập; ở bộ chọn tài khoản Google chọn **Gmail A**.
4. Sau callback phải về trang chủ và hiển thị Gmail A. URL cuối không còn `code`. Refresh vẫn hiện A. Nếu thấy cảnh báo chưa hoàn tất đăng nhập, chưa được tính là pass dù còn thấy session cũ.
5. Mở lịch sử, ghi nhận email A trong tiêu đề. Có thể lưu một báo cáo giả có tên dễ nhận biết nếu AI và database đã sẵn sàng.
6. Trở về trang chủ, mở DevTools → Network, bấm Đăng xuất. Request `POST /auth/logout` phải trả **303**, tiếp theo GET `/` trả 200. Request cùng domain không được trả `403 Origin không hợp lệ`.
7. Trang chủ sau logout phải hiện nút Đăng nhập, không còn email A. Refresh vẫn là khách. API `GET /api/reports` khi không đăng nhập phải trả 401; trang `/history` yêu cầu đăng nhập.
8. Bấm Đăng nhập lại. Google phải cho chọn tài khoản; chọn **Gmail B** hoặc “Sử dụng tài khoản khác”. Trang chủ phải hiện B, không hiện A. Refresh kiểm tra lại.
9. Lịch sử B không được hiện báo cáo của A. Nếu có hai tài khoản và ID báo cáo A, dùng phiên B gọi `GET /api/reports/<ID_A>`; không được nhận snapshot A. Không thử DELETE báo cáo thật; chỉ dùng fixture được tạo cho kiểm thử.
10. Lặp lại B → logout → A. Test thêm trên điện thoại; email không bị ẩn và trang không tràn ngang.

Không gửi ảnh/trace chứa cookie, token, auth code hoặc secret. Chỉ ghi status, domain, tài khoản test đã ẩn danh và kết quả mong đợi/thực tế.

## 5. Phạm vi kiểm chứng

Kết quả kiểm tra local ngày 15/10/2026 sau bản sửa:

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run test` | Pass: 50 test trong 12 file |
| `npm.cmd run test:e2e` | Pass: 9 test Chromium |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd run lint` | Pass |
| `npm.cmd run build` | Pass, Next.js 16.2.9, Proxy được đăng ký |
| Google OAuth với hai Gmail thật trên Vercel | Chưa kiểm chứng trong lượt sửa này |
| RLS live A không đọc được báo cáo B | Chưa kiểm chứng trong lượt sửa này |

Không thay đổi `.env`, secret hoặc dashboard dịch vụ; chưa push/deploy code. Bản sửa cần được đưa lên deployment mới trước khi nghiệm thu production.

Test tự động dùng response fixture với SDK Supabase thật để kiểm tra PKCE/session cookie, logout và chuyển A → B; test route kiểm tra origin, callback cùng host, không open redirect và lỗi exchange/signOut. Test UI kiểm tra email/đổi user/reset state và lỗi logout. E2E local kiểm tra redirect code ở root, logout cùng origin, chặn origin ngoài và cảnh báo OAuth.

Các test này không chứng minh Google/Supabase dashboard production đã đúng hoặc RLS live cách ly A/B. Sau deploy phải chạy mục 4 với hai Gmail thật; lưu kết quả riêng cho Vercel, Google OAuth và RLS.

Nếu vẫn gặp `Origin không hợp lệ`, kiểm tra deployment có commit mới; không bật lại Vercel Require Log In để chữa lỗi ứng dụng. Nếu callback chuyển sang domain khác, so sánh `redirect_to` trong request login với allowlist Supabase và Site URL. Nếu cookie bị trình duyệt chặn, xem lý do trong DevTools → Application/Cookies; không tắt các bảo vệ cookie/CSRF của ứng dụng.
