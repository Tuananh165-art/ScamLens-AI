# Cài đặt và chạy benchmark JEV

PoC gửi dữ liệu tổng hợp đến TypeSafe khi dùng `--live`. Không dùng nội dung tin nhắn, email, URL hoặc ảnh thật của người dùng. Kết quả benchmark là kết quả thử nghiệm, không phải bằng chứng model phát hiện chính xác lừa đảo ngoài đời thực.

## 1. Bảo vệ key và cấu hình

Key TypeSafe đã từng được dán vào hội thoại. Thu hồi key cũ trong TypeSafe Console rồi tạo key mới. Thay key mới trực tiếp trong `F:\ScamLens-AI\.env`; không gửi qua chat, không in bằng lệnh PowerShell và không thêm vào Git.

Trong `.env`, cấu hình:

```dotenv
TYPESAFE_API_KEY=<điền trực tiếp trong file local>
TYPESAFE_BASE_URL=https://api.typesafe.ai
TYPESAFE_MODEL=jev-1.14.0
TYPESAFE_KEY_ROTATED=true
```

Chỉ đặt `TYPESAFE_KEY_ROTATED=true` sau khi key đã được thay. Đây là khóa an toàn nội bộ của PoC; script từ chối mọi lời gọi live nếu nó chưa bật. `.env.example` không chứa key. Giá trị API key không được ghi vào report hay log.

DeepSeek hiện cấu hình `deepseek-v4-flash`. Tài liệu DeepSeek mới cho biết alias cũ được phục vụ bởi V4.1 Flash và tính giá Flash. Budget tính theo giá peak: input cache-miss tối đa 0,30 USD/Mtoken và output 1,20 USD/Mtoken; giờ thấp điểm rẻ hơn. Dừng nếu giá/provider alias thay đổi trước lần benchmark. [Bảng giá DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/), [thông báo alias V4.1 Flash](https://api-docs.deepseek.com/updates/).

## 2. Cài dependency và chạy offline

Node.js 24 được khuyến nghị; SDK JEV đã ghim `@typesafe-ai/sdk@0.7.0`. Tại PowerShell trong repo:

```powershell
npm.cmd install
npm.cmd run jev:dry-run
npm.cmd run jev:dry-run -- --split test --task all
npm.cmd run jev:smoke
```

`dry-run` không gọi mạng, báo số mẫu và cận chi phí. `jev:smoke` không có `--live` cũng chỉ in thông tin tác vụ. Corpus và kết quả live nằm trong `.jev-local/`, đã thêm vào `.gitignore`.

## 3. Smoke và benchmark live

Sau khi thay key, chạy smoke nhỏ trước:

```powershell
npm.cmd run jev:smoke -- --live
```

Smoke thử ba mẫu phân loại và ba cặp bằng chứng giả lập. Sau khi kiểm tra báo cáo/log chỉ gồm ID, model, usage và lỗi mã hóa, chạy tập phát triển:

```powershell
npm.cmd run jev:eval -- --split dev --task all --live
```

Đóng băng rubric và ngưỡng sau khi xem dev. Sau đó chạy holdout test một lần:

```powershell
npm.cmd run jev:eval -- --split test --task all --live
```

Để chạy DeepSeek baseline song song với rules baseline, thêm `--deepseek-live`. Cận chi phí mỗi request dựa trên prompt byte, cộng overhead, và output tối đa 3.200 token. Nếu cận provider hoặc tổng vượt hạn mức, script từ chối request. Lỗi timeout giữ phần dự trù trong ledger để không vượt trần do không rõ request đã được tính tiền hay chưa.

```powershell
npm.cmd run jev:eval -- --split dev --task signals --deepseek-live --live
npm.cmd run jev:eval -- --split test --task signals --deepseek-live --live
```

Lệnh report không gọi model:

```powershell
npm.cmd run jev:report
```

Nó ghi `.jev-local/report.json` và in kết quả theo dev/test, model, ma trận nhầm, metric, token, latency, chi phí và lỗi. Giữ file này local vì dù corpus tổng hợp, nó chứa kết quả đánh giá nội bộ.

## 4. Kiểm tra code và xử lý lỗi

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Mã lỗi `live_blocked_rotate_key_and_set_TYPESAFE_KEY_ROTATED_true`: thu hồi key đã lộ, thay key trong `.env`, đặt cờ xác nhận như hướng dẫn. `typesafe_not_configured`: kiểm tra có biến key mà không in giá trị. `typesafe_model_must_be_pinned`: chỉ dùng `jev-1.14.0` cho bộ này. `jev_provider_budget_exceeded`, `deepseek_provider_budget_exceeded`, `jev_total_budget_exceeded`: không xóa ledger để thử lại; xem tổng chi phí trong report và giữ nguyên trần. `request_in_flight` hoặc error code khác sau timeout: phần chi phí được giữ ở mục uncertain; kiểm tra console provider trước khi quyết định dừng hoặc reset ledger. Reset chỉ khi đã đối chiếu chi phí thực tế; lưu bản backup ledger trước đó.

`401/403` thường là key hoặc quyền tài khoản; `429/529` là giới hạn hoặc provider quá tải. PoC không tự retry. Các lỗi không làm thay đổi kết quả thật của ScamLens vì runner là script độc lập. Key đã lộ nên được thu hồi ngay trong TypeSafe Console; việc xác minh tài khoản thực hiện tại TypeSafe Console.

## 5. Diễn giải kết quả

Đọc precision/recall theo từng nhãn; precision cao cho biết ít cảnh báo nhầm trong corpus, recall cao cho biết ít bỏ sót nhãn tổng hợp. `uncertain` được tính riêng, và coverage cho thấy model đã kết luận bao nhiêu mẫu. Brier score đo sai lệch xác suất trên bộ nhãn này, không xác minh độ hiệu chuẩn của model trên người dùng thật.

Rules và DeepSeek chỉ được so sánh trên bốn nhãn tương ứng với schema findings hiện tại. Hai tín hiệu né kênh chính thức và hứa lợi nhuận không được schema hiện tại trả ra trực tiếp; report ghi rõ unavailable. Jev cho ra quyết định cấu trúc, nhưng cấu trúc đúng không đảm bảo phán đoán đúng. Nếu một cổng không đạt, không đưa tính năng đó vào pilot.
