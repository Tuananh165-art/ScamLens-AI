# ScamLens AI

Trợ lý tiếng Việt giúp phân tích tin nhắn, email do người dùng dán, ảnh chụp và đường dẫn đáng ngờ. Báo cáo giải thích từng dấu hiệu, trích bằng chứng từ nội dung đã gửi và hướng dẫn cách tự xác minh.

## Bắt đầu nhanh trên Windows

Yêu cầu: Node.js 24 LTS và npm. Mở PowerShell tại thư mục project:

```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:3000` để xem landing page; công cụ phân tích ở `/analyze`. Next.js tự đọc file `.env` có sẵn trong thư mục. Với bản clone mới, sao chép `.env.example` thành `.env.local`, rồi điền key qua editor trên máy của bạn; không commit file env.

Chạy phiên bản production local:

```powershell
npm.cmd run build
npm.cmd run start
```

Không có dependency service nào thì giao diện và trang hướng dẫn vẫn chạy. API AI cần cấu hình tương ứng. `SCAMLENS_DEMO_MODE=true` cho phép trình bày báo cáo quy tắc mẫu mà không gọi AI; kết quả được ghi rõ là demo.

## Các tính năng

- Tin nhắn, email, URL và ảnh dùng DeepSeek; người dùng có thể chủ động bật JEV để đối chiếu chín hành vi: yêu cầu mã bí mật, giấy tờ định danh, tiền, cài ứng dụng/quyền điều khiển, gây áp lực, giữ bí mật, tự xưng tổ chức, né kênh chính thức và hứa lợi nhuận/hoàn tiền chắc chắn. Với ảnh, JEV chỉ nhận chữ OCR đã che, không nhận ảnh.
- Preview bản gửi có thể chỉnh sửa; bí mật OTP/mật khẩu/PIN/CVV/token luôn được che, còn email, điện thoại, giấy tờ và tài khoản có lựa chọn che.
- Báo cáo đối chiếu riêng kết quả cục bộ, DeepSeek và JEV; không cộng điểm hay suy ra tỷ lệ lừa đảo.
- Báo cáo tiếng Việt có dấu hiệu, trích dẫn nguyên văn, checklist và giới hạn kiểm chứng; không in phần trăm rủi ro.
- Lưu thủ công vào lịch sử Supabase riêng theo RLS; không tự lưu hoặc upload ảnh gốc.
- Quota theo người dùng/khách, provider và phút. Dùng bộ đếm cục bộ ở local; production yêu cầu Upstash.
- JEV tắt mặc định, yêu cầu bật bằng cấu hình server và đồng ý qua checkbox; tín hiệu JEV không thay đổi hoặc làm giảm cảnh báo chính.
- Không mở URL đáng ngờ. Mặc định chỉ phân tích cú pháp cục bộ; Google Web Risk là tra cứu riêng, phải bật cấu hình server, người dùng đồng ý và chọn chính URL cần gửi.
- Xuất bản báo cáo qua copy/print trong trình duyệt.

## Lệnh chất lượng

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

DeepSeek live smoke dùng nội dung tổng hợp, kiểm tra JSON báo cáo và nhận ảnh; chỉ chạy có chủ đích vì tiêu quota:

```powershell
npm.cmd run smoke:ai
```

Hướng dẫn đầy đủ:

- [Cài local và chạy tính năng](docs/SETUP_VI.md)
- [Tạo Supabase, Google OAuth và Upstash](docs/SERVICES_VI.md)
- [Khắc phục Google OAuth `redirect_uri_mismatch`](docs/OAUTH_TROUBLESHOOTING_VI.md)
- [Sửa session, email, logout và kiểm thử chuyển Gmail A → B](docs/AUTH_SESSION_FIX_VI.md)
- [Kiểm thử và demo](docs/TEST_DEMO_VI.md)
- [Đưa repo GitHub lên Vercel](docs/DEPLOY_VI.md)
- [Nguyên tắc riêng tư và giới hạn](docs/PRIVACY_VI.md)
- [Đánh giá khả thi thử nghiệm TypeSafe JEV](docs/JEV_FEASIBILITY_VI.md)
- [Đặc tả PoC JEV](docs/JEV_POC_SPEC_VI.md)
- [Cài đặt và chạy benchmark JEV](docs/JEV_SETUP_AND_EVALUATION_VI.md)
- [Roadmap, trạng thái nghiệm thu và blocker hiện tại](docs/ROADMAP_VI.md)

## Quyền riêng tư và phạm vi

Rà soát và sửa bản gửi trước khi phân tích: regex không thể bảo đảm tìm thấy mọi dữ liệu riêng tư. Máy chủ áp dụng lại che bắt buộc trước khi chuyển nội dung cho AI hoặc lưu vào báo cáo. DeepSeek xử lý nội dung được gửi theo điều khoản dịch vụ API. JEV chỉ nhận thêm dữ liệu khi người dùng bật lựa chọn riêng; TypeSafe xử lý input theo chính sách riêng và thời hạn lưu có thể phụ thuộc loại dữ liệu/thỏa thuận. Ảnh được resize, tái mã hóa trong trình duyệt và che vùng được chọn trước khi truyền; JEV chỉ nhận OCR text đã che. Báo cáo chỉ lưu khi người dùng bấm lưu. Tra cứu Web Risk gửi URL đã chọn cho Google và kết quả không được lưu hoặc đưa vào báo cáo xuất.

ScamLens không xác nhận danh tính tổ chức, chất lượng website, giao dịch thành công, chứng cứ pháp lý hoặc một nội dung là “an toàn”. Mỗi kết quả áp dụng cho phần văn bản được đưa vào. Ảnh biên lai không chứng minh tiền đã vào tài khoản.

## Cấu hình project

- Next.js App Router và TypeScript; chạy trên Node.js 24.
- Báo cáo: `src/lib/analysis/schema.ts`.
- Migration và Row Level Security: `supabase/migrations/`.
- Tình trạng không chứa secret: `GET /api/health`.
- Workflow CI dùng fixture; live provider smoke test tách riêng và cần key/opt-in của người quản lý.

## Các chức năng vừa bổ sung

- QR: tải ảnh rồi chọn **Đọc QR trên thiết bị**; dữ liệu giải mã được đưa vào bản xem trước khi bạn chọn, không tự mở URL hoặc gọi AI.
- Email: nhập tệp **.eml** (tối đa 2 MiB) để điền From/Reply-To/Subject/body. Tệp được đọc trong bộ nhớ máy chủ ScamLens; không lưu tệp hoặc thực thi đính kèm.
- Báo cáo có câu căn cứ, giải thích và bảng local–AI–JEV. Chọn **Bạn đã thao tác gì?** để nhận hướng dẫn phù hợp.
- Có thể bật `TYPESAFE_EVIDENCE_REVIEW_ENABLED=true` sau khi đánh giá dữ liệu riêng: tối đa 3 kết luận, thêm một request/quota JEV. Mặc định tắt; lỗi không làm mất báo cáo chính.
- [Chi tiết triển khai, kiểm chứng và giới hạn](docs/UPGRADE_FUNCTIONS_2026_10_31_VI.md).
