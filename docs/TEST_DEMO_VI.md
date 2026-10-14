# Kiểm thử và demo ScamLens AI

## 1. Kiểm tra tự động

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

Nếu Playwright chưa cài Chromium:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Unit test kiểm tra che dữ liệu, trích dẫn source và parse URL. E2E kiểm tra trang, privacy gate và hướng dẫn. CI không gọi AI thật.

Kết quả chạy cuối trong workspace ngày 14/10/2026: lint, typecheck, 11 unit/API tests, 3 Playwright Chromium tests và production build đều pass. Gemini smoke với ảnh một pixel tổng hợp trả JSON hợp lệ. Zen smoke nhận 403 ở cả endpoint cấu hình và endpoint tài liệu hiện hành; đây là blocker quyền truy cập provider, không phải bằng chứng pipeline live đã hoạt động. Supabase/RLS, Upstash và Vercel cần project/account bên ngoài nên vẫn chưa được nghiệm thu live. Theo dõi chi tiết ở [roadmap](ROADMAP_VI.md).

## 2. Demo ngắn trong 8–10 phút

1. Mở trang và nói rõ: báo cáo là dấu hiệu để kiểm tra, không phải chứng nhận an toàn.
2. Chọn **Thử dữ liệu mẫu**, xem nội dung gắn `[MẪU GIẢ LẬP]`.
3. Bấm chuẩn bị, đọc phần che dữ liệu, xác nhận consent và chạy phân tích.
4. Giải thích trích dẫn nào hỗ trợ mỗi cảnh báo. Hỏi “điều gì chúng ta vẫn chưa biết?”.
5. Chuyển sang tab **Email**, chỉ ra From và Reply-To do người dùng nhập chưa phải kỹ thuật header đã kiểm chứng.
6. Chọn **Đường dẫn**, dùng URL giả `example.test`; chỉ ra hostname/tên miền và app không mở website.
7. Chọn **Ảnh chụp**. Dùng ảnh demo tự tạo không chứa dữ liệu thật; che tên/QR/số dư, đọc OCR, sửa một từ rồi xác nhận.
8. Mở báo cáo, chọn sao chép hoặc in PDF. Đăng nhập Google, lưu báo cáo và mở `/history`.
9. Xóa báo cáo để kết thúc demo; xác nhận biến mất khỏi danh sách.

Nếu chưa muốn gọi AI thật, đặt `SCAMLENS_DEMO_MODE=true`, restart server và chạy demo. Kết quả sẽ ghi chế độ demo và model `demo-rules`; không nói rằng AI đã phân tích.

## 3. Ma trận kiểm tra thủ công

| Bài kiểm tra | Điều kiện pass |
|---|---|
| Tin nhắn yêu cầu OTP, thúc ép chuyển tiền | Trích câu xuất hiện trong source; checklist đề nghị kênh xác minh độc lập |
| Nội dung trung tính có từ “ngân hàng” nhưng không đòi gì | Không biến riêng từ khóa thành cảnh báo lừa đảo |
| Email sender và Reply-To khác | Chỉ gắn là dữ kiện cần kiểm tra; không khẳng định giả mạo |
| URL có `user:pass@`, IP hoặc HTTP | Parse và gắn dấu hiệu; network inspector cho thấy app không fetch URL |
| Ảnh mờ, chữ không đủ rõ | Đưa phần không rõ cho người dùng xem; không tự điền |
| OCR được sửa trước xác nhận | Báo cáo trích từ chữ được sửa, không trích bản OCR cũ |
| Trích dẫn do AI tự chế | Server bỏ finding không khớp source |
| Provider 401, 429, timeout, JSON sai | UI hiện lỗi hữu ích; không hiện kết quả an toàn hoặc báo cáo giả |
| Người dùng A xin ID của B | API trả 404, không rò nội dung/owner |
| Redis production ngừng hoạt động | API từ chối lượt mới, không chạy AI thiếu quota |

Chỉ nhập fixture giả. Không dùng tin nhắn của người khác, thông tin tài khoản, OTP, ảnh hóa đơn thật hoặc secret thật trong screenshot/video.

## 4. Thu thập bằng chứng nghiệm thu

- Lưu ảnh chụp giao diện và phiên bản app; che email tài khoản.
- Lưu output `lint`, `typecheck`, unit test, E2E và production build.
- Ghi `live AI`, `Supabase/RLS`, `Vercel` riêng trạng thái `pass`, `blocked` hoặc `unverified`.
- Không đưa env, provider error body, prompt hoặc nội dung nhạy cảm vào log/video.
