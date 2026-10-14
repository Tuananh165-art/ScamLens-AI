# Dữ liệu, bảo mật và giới hạn ScamLens AI

## Dữ liệu đi đâu?

| Luồng | Truyền đi | Lưu trong app |
|---|---|---|
| Tin nhắn/email/URL | Bản đã che sau khi người dùng xem và consent → Gemini | Không lưu đến khi bấm Lưu |
| Ảnh | Ảnh tái mã hóa/đã che trên browser → Gemini OCR; bản chữ được sửa/xác nhận → Gemini phân tích | Ảnh gốc không lưu; report chữ chỉ lưu khi bấm Lưu |
| Tài khoản | OAuth Google qua Supabase Auth | Session cookie Supabase |
| Lịch sử | Snapshot đã che vào Supabase PostgreSQL | RLS owner-only; xóa trong màn hình lịch sử |
| Giới hạn gọi | Hash HMAC của user ID/IP, bộ đếm → Upstash | Chỉ khóa hash và số đếm tạm thời |

## Bảo vệ được thực hiện

- Không xuất `GEMINI_API_KEY`, Upstash token hoặc HMAC secret ra browser bundle.
- Schema validation tại đầu vào và phản hồi AI; output không được render như HTML.
- Bằng chứng được kiểm tra là substring của source. Nội dung không khớp không trở thành finding hiển thị.
- Không mở URL đáng ngờ; parse URL không tạo yêu cầu mạng đến hostname do người dùng nhập.
- RLS theo `auth.uid()`, khóa ngoại xóa cascade và giới hạn snapshot.
- Quota theo user/guest, mỗi phút và cap provider. Production chặn khi Redis không khả dụng.
- OAuth callback chỉ cho relative path cùng origin. Mutation yêu cầu Origin đúng app URL.
- Không cache response chứa report, không log nội dung AI hoặc source người dùng.

## Giới hạn phải hiểu

- Bộ che dữ liệu là regex và heuristic; có thể bỏ sót tên, mã ngắn, thông tin định danh dạng lạ.
- AI có thể sai hoặc thiếu. Bằng chứng trích đúng giúp bạn đối chiếu, không chứng minh cách giải thích đúng.
- `low` nghĩa là không tìm thấy tín hiệu rõ trong phần gửi lên; không phải kiểm tra uy tín và không phải bảo chứng an toàn.
- Email được dán tay nên trường From/Reply-To chưa được chứng thực bằng header/SPF/DKIM.
- Phân tích URL không tải domain, kiểm tra DNS/HTTPS, reputation hay redirect.
- OCR là dự đoán từ điểm ảnh; xem bản đọc bên cạnh ảnh đã che và sửa trước khi xác nhận.
- Không nhận diện giao dịch đã quyết toán, ảnh chỉnh sửa sâu hoặc danh tính người nhận.
- Dữ liệu gửi sang provider chịu điều khoản và quota của provider. Không gửi dữ liệu bạn không được phép chia sẻ.
- IP phía khách có thể ảnh hưởng quota; quota app không thay thế anti-bot/CDN WAF trong dịch vụ công khai.
- Supabase Free có thể tạm dừng project nhàn rỗi; Upstash và Vercel có quota giới hạn.
