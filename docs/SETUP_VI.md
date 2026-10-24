# Cài đặt và chạy ScamLens AI trên Windows

## 1. Chuẩn bị

1. Cài Node.js 24 LTS. Đóng và mở lại PowerShell để cập nhật PATH.
2. Kiểm tra phiên bản:

```powershell
node --version
npm.cmd --version
```

`node --version` nên hiện phiên bản `v24.x`. Trên PowerShell dùng `npm.cmd` để tránh chính sách chạy script của `npm.ps1`.

## 2. Cài dependency

Chạy ở thư mục gốc repo:

```powershell
npm.cmd install
```

Lần đầu tạo `package-lock.json`. Sau đó CI dùng `npm.cmd ci` để cài đúng phiên bản khóa trong lockfile. Không xóa lockfile để “sửa” lỗi package.

## 3. Cấu hình AI local

Next.js đọc `.env` tại root. ScamLens dùng DeepSeek cho cả phân tích văn bản/email/URL và OCR ảnh. Không in khóa ra terminal, gửi khóa trong chat, commit `.env` hoặc đưa khóa vào biến `NEXT_PUBLIC_*`.

Với một clone mới:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Nhập key từ provider account an toàn. Tên biến cần có:

| Biến | Dùng ở đâu |
|---|---|
| `DEEPSEEK_API_KEY` | Gọi DeepSeek từ server cho phân tích và OCR |
| `DEEPSEEK_MODEL` | Model DeepSeek dùng cho văn bản và ảnh; nên dùng `deepseek-flash` |
| `SCAMLENS_DEMO_MODE` | Đặt `true` để chạy rule demo, không gửi yêu cầu AI |

Ứng dụng chỉ dùng DeepSeek, không fallback sang provider khác. Endpoint là `https://api.deepseek.com/chat/completions`; báo cáo dùng JSON mode và OCR ảnh gửi ảnh đã che dưới dạng data URL base64. Model `deepseek-flash` hỗ trợ ảnh. `deepseek-v4-flash` hiện vẫn được chấp nhận như alias tương thích, nhưng tài liệu khuyên dùng `deepseek-flash`. Xem [Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/), [Vision](https://api-docs.deepseek.com/guides/vision/) và [JSON Output](https://api-docs.deepseek.com/guides/json_mode/). Dữ liệu được gửi tới DeepSeek API; xem [điều khoản Open Platform](https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html) và chỉ gửi dữ liệu bạn có quyền chia sẻ. Không đưa key vào client.

## 4. Chạy local

```powershell
npm.cmd run dev
```

Mở `http://localhost:3000`. Xem health mà không tiết lộ secret:

```powershell
(Invoke-RestMethod http://localhost:3000/api/health).services | Format-List
```

`textAi`/`imageAi` chỉ thể hiện đủ biến cấu hình, không chứng minh key hoạt động. Để kiểm tra live, dùng dữ liệu giả và chạy một lượt có chủ đích trong UI; lượt gọi sẽ tiêu quota provider.

Có thể kiểm tra từng adapter bằng đúng một nội dung tổng hợp, không in kết quả hay key:

```powershell
npm.cmd run smoke:ai
```

Lệnh gửi hai yêu cầu tổng hợp ngắn tới DeepSeek: văn bản với schema báo cáo ScamLens và ảnh PNG trống một pixel với schema OCR. Chỉ metadata, trạng thái JSON/schema và số ký tự output được in; key, prompt và nội dung model không được in. Lệnh có thể tiêu số dư API DeepSeek. Đây là kiểm tra kết nối/hợp đồng tối thiểu, không thay cho workflow live trong UI hoặc đánh giá chất lượng trên bộ fixture.

## 5. Quy trình phân tích

### Tin nhắn, email, URL

1. Chọn tab tương ứng, dán nội dung vào ô nhập.
2. Với email, nhập From/Reply-To nếu muốn. Các trường này là dữ kiện người dùng khai báo, không phải header đã xác minh từ hộp thư.
3. Bấm **Xem trước nội dung đã che**.
4. Sửa bản gửi. Bộ lọc tìm mẫu email, số điện thoại, chuỗi số dài và token có từ khóa; tên, mã tài khoản ngắn hoặc dữ kiện tùy ý có thể bị bỏ sót.
5. Rà soát bản gửi trong mục **Xem nội dung sẽ gửi**. Khi bấm **Phân tích**, phần nội dung đã che sẽ được gửi đến nhà cung cấp AI.
6. Đối chiếu từng trích dẫn với bản gốc và đọc giới hạn.

URL chỉ được parse cục bộ. App không tải trang, DNS, redirect hoặc ảnh preview.

### Ảnh

1. Chọn JPEG/PNG/WebP (tệp gốc tối đa 10 MiB).
2. Kéo hình chữ nhật lên ảnh để che vùng. Dùng che kín số tài khoản, QR, OTP và tên không cần thiết.
3. Bấm **Tiếp tục với ảnh đã che**, xem preview rồi bấm **Đọc ảnh đã che bằng DeepSeek**.
4. Đối chiếu bản đọc với preview, sửa chữ/số chưa chính xác hoặc xóa dữ liệu còn sót.
5. Xác nhận bản đọc. Khi bấm **Phân tích**, DeepSeek nhận phần chữ đã xác nhận để phân tích.
6. Ảnh giao dịch không chứng minh tiền đã vào tài khoản. Mở ứng dụng ngân hàng của chính bạn để kiểm tra.

Trình duyệt re-encode ảnh thành JPEG trước khi upload; metadata gốc bị bỏ. Vùng đã tô kín nằm trong ảnh gửi đi. Nếu che nhầm, chọn lại ảnh nguồn và che lại.

### Báo cáo và lưu

- **low** = chưa thấy dấu hiệu rõ trong phần đã cung cấp, không đồng nghĩa an toàn.
- **medium/high** = có dấu hiệu trích từ nguồn; đọc nội dung và checklist, không suy luận tội phạm.
- **insufficient** = nguồn quá thiếu để đánh giá.
- Sao chép hoặc chọn **In / lưu PDF** để giữ báo cáo trên thiết bị.
- Google OAuth cho phép **Lưu vào lịch sử**. Báo cáo đã lưu không chạy AI lại; có thể mở và xóa.

## 6. Chạy production local

```powershell
npm.cmd run build
npm.cmd run start
```

Mở `http://localhost:3000`. Production-mode quota yêu cầu Upstash. Thiếu shared quota thì API AI từ chối yêu cầu, dù UI và health route vẫn chạy.
