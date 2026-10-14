# Hướng dẫn test và demo ScamLens AI

Tài liệu này hướng dẫn kiểm thử các luồng tin nhắn, email, ảnh chụp, đường dẫn, báo cáo và xác nhận AI gọi nhà cung cấp thật. Dùng nội dung giả lập bên dưới; không dán OTP, mật khẩu, số tài khoản, dữ liệu khách hàng hoặc thông tin giao dịch thật.

## 1. Phân biệt demo mẫu và AI thật

| Chế độ | Cách hoạt động | Có gọi AI? |
|---|---|---:|
| Demo (`SCAMLENS_DEMO_MODE=true`) | Dùng luật/kết quả demo cố định để trình diễn UI | Không |
| Live (`SCAMLENS_DEMO_MODE=false`) | Tin nhắn/email/URL gọi DeepSeek; ảnh gọi DeepSeek OCR rồi bản chữ đã xác nhận cũng gọi DeepSeek | Có |

Nút **Thử dữ liệu mẫu** chỉ nạp nội dung mẫu vào form. Nó không tự chứng minh có gọi AI. Mẫu OCR trong luồng ảnh có thể minh họa bước sửa/xác nhận chữ; muốn chứng minh DeepSeek hoạt động, hãy chọn một ảnh giả lập và chạy OCR.

### Chuẩn bị local

1. Mở PowerShell tại thư mục repo:
   ```powershell
   Set-Location 'F:\ScamLens AI'
   ```
2. Cài dependencies:
   ```powershell
   npm.cmd ci
   ```
3. Mở `.env` bằng editor và kiểm tra các biến cấu hình (không in/chia sẻ giá trị bí mật):
   - `SCAMLENS_DEMO_MODE`
   - `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` (phân tích chữ/email/URL và OCR ảnh qua DeepSeek)
4. Đặt `SCAMLENS_DEMO_MODE=false` để thử live. Không đưa `.env` lên GitHub hoặc chụp màn hình chứa key.
5. Chạy ứng dụng:
   ```powershell
   npm.cmd run dev
   ```
6. Mở `http://localhost:3000`. Nếu vừa sửa env, dừng server bằng `Ctrl+C`, khởi động lại rồi tải lại trang.

## 2. Xác nhận AI hoạt động

### Smoke test trực tiếp

Các lệnh gửi nội dung tổng hợp, không dùng dữ liệu của bạn. Mỗi lần gọi có thể tiêu quota.

Kiểm tra DeepSeek với báo cáo văn bản theo schema ScamLens và ảnh PNG trống một pixel:
```powershell
npm.cmd run smoke:ai
```
Thành công cần có hai dòng `provider: deepseek`, `ok: true`, `validJson: true`, `validSchema: true` và model khớp cấu hình. Script không in key, prompt hay nội dung trả lời. Để đánh giá OCR thật, dùng ảnh giả có chữ rõ trong mục 6.

Smoke test chứng minh provider trả lời yêu cầu tối thiểu tại thời điểm chạy. Nó không chứng minh độ chính xác phát hiện lừa đảo, toàn bộ UI, Supabase OAuth hay quota dài hạn.

### Xác nhận request trong trình duyệt

1. Mở DevTools (`F12`) → **Network**, bật **Preserve log**, chọn **Fetch/XHR**.
2. Lọc `api/ocr` hoặc `api/analyze`, sau đó chạy một luồng với nội dung giả lập.
3. Một lần live thành công có request tương ứng HTTP `200` và response hợp lệ. Nếu response có trường `demo`, cần là `false`.
4. Với ảnh, cần thấy `POST /api/ocr` trước. Sau khi người dùng xem/sửa/xác nhận bản đọc, mới có `POST /api/analyze`.
5. Đối chiếu provider/model trong báo cáo với cấu hình server. Metadata model một mình chưa chứng minh lần gọi thật; bằng chứng tốt hơn là smoke thành công, request live `200` và `demo:false`.
6. `GET /api/health` chỉ báo biến cấu hình có hiện diện; không xác minh key hợp lệ, kết nối AI hay đăng nhập thật.

Trong demo mode, báo cáo có thể trông hoàn chỉnh nhưng không phải bằng chứng LLM đã chạy. Không mở/chia sẻ tab Payload/Request/Response sau khi nhập nội dung thật.

## 3. Tin nhắn

1. Ở trang Phân tích, chọn tab **Tin nhắn**.
2. Dán mẫu:
   ```text
   [MẪU GIẢ LẬP] Ngân hàng Sao Mai: tài khoản của bạn sẽ bị khóa sau 10 phút.
   Để hủy giao dịch 18.500.000đ, hãy gửi mã OTP cho nhân viên hỗ trợ qua chat này.
   Vui lòng giữ bí mật, không gọi tổng đài vì đường dây đang bảo trì.
   ```
3. Ngữ cảnh tùy chọn: `Tôi không thực hiện giao dịch này; tin nhắn đến từ số lạ.`
4. Chọn xem trước dữ liệu đã che. Nếu còn thông tin muốn ẩn, tự sửa/che trước khi gửi.
5. Đọc thông báo chia sẻ dữ liệu với nhà cung cấp AI, đồng ý rồi bấm **Chuẩn bị kiểm tra/Phân tích** (tên nút tùy phiên bản UI).
6. Đọc cảnh báo và đối chiếu trích dẫn với nguồn. Mong đợi dấu hiệu như đòi OTP, hạn gấp, yêu cầu giữ bí mật; hướng kiểm chứng nên dùng app ngân hàng hoặc số liên hệ độc lập.
7. Thử nội dung trung tính: `Cuộc hẹn của bạn là thứ Ba lúc 15:00. Vui lòng phản hồi nếu cần đổi lịch.` Không nên gắn nhãn lừa đảo chỉ do có từ khóa đơn lẻ.

AI có thể trả lời khác nhau giữa các lần. Đánh giá dựa trên bằng chứng đúng, giới hạn rõ và hướng dẫn kiểm chứng; không khóa vào câu chữ hay mức cảnh báo cụ thể.

## 4. Email

1. Chọn tab **Email** và nhập:
   - From: `thongbao@saomai-bank.example.test`
   - Reply-To: `hotro-case@example.test`
   - Tiêu đề: `Khẩn: xác nhận giao dịch trước 17:00`
   - Nội dung:
     ```text
     [MẪU GIẢ LẬP] Kính gửi khách hàng,
     Tài khoản của bạn sẽ bị tạm khóa. Bấm https://saomai.example.test/xac-minh
     và nhập mã OTP để hoàn tiền. Phí xác minh là 2.000đ; vui lòng xử lý ngay.
     ```
2. Xem trước dữ liệu gửi, kiểm tra che dữ liệu, đồng ý consent và phân tích.
3. Xem báo cáo có phân biệt From/Reply-To khác nhau là dấu hiệu cần xác minh, thay vì khẳng định danh tính người gửi đã được kiểm chứng. Email dán vào không phải header xác thực.
4. Đối chiếu trích dẫn với body/header thực sự nhập. `.example.test` là dữ liệu minh họa, không phải website thật.

## 5. Đường dẫn (URL)

ScamLens phân tích chuỗi URL và ngữ cảnh do người dùng nhập. Server không truy cập DNS, không tải trang, theo redirect hay tra blacklist. Không nhấn vào URL đáng ngờ trong báo cáo/email/DevTools.

1. Chọn tab **Đường dẫn**.
2. Dán URL giả lập:
   ```text
   https://dang-nhap.saomai.example.test/verify?continue=%2Faccount
   ```
3. Ngữ cảnh tùy chọn: `Tin nhắn tự xưng là ngân hàng yêu cầu xác minh trong 5 phút.`
4. Xem trước, consent rồi phân tích.
5. Đọc báo cáo về hostname/đặc điểm URL như dữ kiện, không coi HTTPS hoặc hostname dài là bằng chứng kết luận. Hướng dẫn cần khuyên tự mở ứng dụng hoặc nhập địa chỉ chính thức đã biết.
6. Có thể thử chuỗi giả lập `https://saomai.com.example.test/login`. Trong Network xác nhận không có request tới hostname đó.
7. Thử `not a URL` để xác nhận validation báo lỗi thay vì truy cập web.

## 6. Ảnh chụp và DeepSeek OCR

### Tạo sample an toàn

Dùng PowerPoint, Canva hoặc công cụ vẽ cục bộ tạo ảnh giả có chữ lớn/tương phản tốt:
```text
SAO MAI BANK — THÔNG BÁO GIẢ LẬP
Giao dịch: 18.500.000 VND
Trạng thái: ĐANG CHỜ XÁC MINH (nội dung giả)
Yêu cầu: gửi OTP trong 5 phút để hoàn tiền
```
Xuất JPEG/PNG/WebP. Dùng tên/số giả, không thêm QR, tài khoản, giao dịch hoặc ảnh app ngân hàng thật. Để thử che vùng, thêm chuỗi giả như `TK 1234 5678 9012` rồi che kín trước khi tải.

### Chạy OCR, xác nhận và phân tích

1. Chọn tab **Ảnh chụp**, tải ảnh tổng hợp.
2. Dùng công cụ che vùng, kiểm tra preview đã che. Thử di chuyển/thay đổi vùng che và xác nhận ảnh preview cập nhật.
3. Đồng ý chia sẻ ảnh đã xử lý với DeepSeek, bấm nút đọc ảnh/OCR.
4. Trong Network xác nhận `POST /api/ocr` trả `200`.
5. Đối chiếu OCR với ảnh; sửa sai, xóa phần không rõ, không cho model đoán nội dung bị che.
6. Xác nhận bản đọc. Nếu sửa nội dung sau đó, xác nhận lại bản mới.
7. Đồng ý gửi bản chữ đã xác nhận cho DeepSeek, tiếp tục phân tích. Network cần có `POST /api/analyze` sau OCR.
8. Đối chiếu trích dẫn với bản chữ cuối cùng. Báo cáo phải nêu nguồn là bản đọc ảnh đã được người dùng xác nhận hoặc tương đương.
9. Thử ảnh mờ/chữ nhỏ: kết quả hợp lệ có thể ghi phần không đọc rõ/thiếu dữ kiện, không bịa tên, số tiền hay trạng thái.

OCR chỉ đọc chữ; không xác thực ảnh, người gửi, ngân hàng hay giao dịch, và không chứng minh tiền đã vào tài khoản. Kiểm tra khoản tiền bằng cách tự mở app ngân hàng. Ảnh gốc không được lưu vào lịch sử theo thiết kế v1.

## 7. Báo cáo và lịch sử

1. Đọc tóm tắt, mức cảnh báo và giới hạn. `low` là chưa thấy dấu hiệu rõ trong nội dung cung cấp, không có nghĩa an toàn; `insufficient` là thiếu dữ kiện.
2. Với mỗi cảnh báo, xác nhận trích dẫn có thật trong nguồn đã che/đã duyệt; đọc bước kiểm chứng.
3. Dùng nút sao chép/xuất nếu có; có thể chọn **In** trong trình duyệt → **Save as PDF**.
4. Để lưu, đăng nhập Google rồi bấm **Lưu báo cáo**. Chỉ thao tác chủ động này lưu snapshot; không lưu ảnh gốc. Cần Supabase/Auth đã cấu hình.
5. Mở Lịch sử và báo cáo đã lưu. Snapshot xem lại không gọi AI lần nữa. Thử xóa báo cáo test.
6. Với hai tài khoản, đăng xuất A rồi đăng nhập B; B không được xem A. Đây là test cần OAuth/Supabase thực và negative test RLS; UI local không thay thế kiểm tra RLS.

## 8. Test nhanh và xử lý lỗi

| Test | Đạt khi |
|---|---|
| Bỏ consent rồi gửi | Không gọi provider |
| Xem bản che | Placeholder che dữ liệu; người dùng sửa được |
| Tin nhắn gây áp lực | Cảnh báo có trích dẫn đúng và cách kiểm chứng |
| Nội dung trung tính | Không suy kết luận chỉ từ từ khóa |
| Email From/Reply-To | Nêu dấu hiệu, không tuyên bố đã xác minh người gửi |
| URL giả lập | Không phát sinh request đến hostname trong URL |
| Ảnh giả lập đã che | DeepSeek OCR đọc ảnh xử lý; DeepSeek phân tích đúng bản xác nhận |
| SVG/file giả ảnh | Bị từ chối rõ, không gọi DeepSeek |
| Demo/live | Demo được đánh dấu; live có request provider thật |

- **401/403 smoke:** key sai/thiếu quyền, endpoint không hợp lệ cho tài khoản, API/model chưa được cấp. Kiểm tra dashboard và tài liệu chính thức; không đoán đổi endpoint/model.
- **404/model không có:** kiểm tra tên model và endpoint từ dashboard/tài liệu hiện hành, restart Next sau khi đổi env.
- **Vẫn ra demo:** xác nhận `SCAMLENS_DEMO_MODE=false`, restart server và kiểm tra response `demo`.
- **429:** đã chạm rate limit/quota; đợi cửa sổ quota, tránh gọi lặp.
- **OCR được nhưng analyze lỗi:** OCR và phân tích là hai request riêng cùng dùng DeepSeek; kiểm tra response của `/api/analyze`, quota, log Vercel hoặc chạy smoke DeepSeek.
- **Google sign-in/lịch sử lỗi:** xác nhận Supabase URL/key, bật Google provider, callback `/auth/callback`, Redirect URLs local. Xem [hướng dẫn OAuth](./OAUTH_TROUBLESHOOTING_VI.md).
- **Không có lệnh smoke:** chạy `npm.cmd run`, kiểm tra script `smoke:ai`, rồi `npm.cmd ci`.

## 9. Test tự động

Chạy từng lệnh trong PowerShell:
```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```
Test tự động dùng mock/fixture để tái lập, không chứng minh DeepSeek live. Kiểm chứng provider riêng bằng smoke script và request Network ở mục 2.

## 10. Tìm sample ở đâu và dùng an toàn

- [FTC: How To Recognize and Avoid Phishing Scams](https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams) có ví dụ email giả mạo và dấu hiệu như lời chào chung, tạo vấn đề tài khoản, thúc bấm link. Chỉ dùng chữ làm ý tưởng fixture, thay danh tính/địa chỉ/URL thành giả; không tải attachment hoặc bấm link.
- [FTC: How To Avoid a Scam](https://consumer.ftc.gov/articles/how-avoid-scam) có dấu hiệu giả danh, vấn đề/giải thưởng giả, thúc ép và phương thức thanh toán bất thường. Dùng để thiết kế ca test, không dùng như nguồn xác minh kết quả AI.
- [Google Jigsaw Phishing Quiz](https://phishingquiz.withgoogle.com/) dùng để học nhận diện phishing; không cần đưa dữ liệu cá nhân vào ScamLens.
- Tự tạo email/SMS/biên nhận giả trong PowerPoint, Canva hoặc editor cục bộ; chụp ảnh màn hình, ghi rõ `MẪU GIẢ LẬP`, dùng domain `.test`/ `example.test`.
- Nếu dùng nội dung từ nguồn nghiên cứu, chỉ lấy văn bản công khai đã loại dữ kiện nhận diện. Không mở URL, tải attachment, chạy file/script, đăng nhập trang, hoặc dùng URL phishing đang hoạt động làm demo.

## 11. Kịch bản demo 8–10 phút

1. **Giới thiệu (1 phút):** công cụ giải thích dấu hiệu, trích dẫn bằng chứng và nêu điều chưa xác minh.
2. **Tin nhắn (2 phút):** dán mẫu OTP/đe dọa; xem bản che, consent, phân tích, đối chiếu bằng chứng.
3. **Email (1 phút):** From/Reply-To khác nhau; giải thích đây là dấu hiệu chứ không phải xác minh danh tính.
4. **URL (1 phút):** nhập domain `.test`; nhấn mạnh app không mở trang.
5. **Ảnh (2–3 phút):** che vùng, gọi DeepSeek OCR, sửa/xác nhận, gọi DeepSeek phân tích.
6. **AI live (1 phút):** cho xem smoke gần nhất + Network status `200`, `demo:false`, không để lộ payload.
7. **Báo cáo/lịch sử (1 phút):** xem checklist, xuất PDF/JSON, nếu đã cấu hình Auth thì lưu/mở/xóa snapshot.

Demo giao diện ổn định có thể dùng demo mode, nhưng phải nói rõ kết quả mô phỏng. Để khẳng định AI live, trình bày smoke thành công và request provider thực; ảnh chụp của báo cáo demo không đủ bằng chứng.
