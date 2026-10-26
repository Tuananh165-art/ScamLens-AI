# ScamLens AI

Trợ lý tiếng Việt giúp phân tích tin nhắn, email do người dùng dán, ảnh chụp và đường dẫn đáng ngờ. Báo cáo giải thích từng dấu hiệu, trích bằng chứng từ nội dung đã gửi và hướng dẫn cách tự xác minh.

## Bắt đầu nhanh trên Windows

Yêu cầu: Node.js 24 LTS và npm. Mở PowerShell tại thư mục project:

```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:3000`. Next.js tự đọc file `.env` có sẵn trong thư mục. Với bản clone mới, sao chép `.env.example` thành `.env.local`, rồi điền key qua editor trên máy của bạn; không commit file env.

Chạy phiên bản production local:

```powershell
npm.cmd run build
npm.cmd run start
```

Không có dependency service nào thì giao diện và trang hướng dẫn vẫn chạy. API AI cần cấu hình tương ứng. `SCAMLENS_DEMO_MODE=true` cho phép trình bày báo cáo quy tắc mẫu mà không gọi AI; kết quả được ghi rõ là demo.

## Các tính năng

- Tin nhắn, email, URL và ảnh đều dùng DeepSeek; với ảnh, người dùng xem/sửa/xác nhận OCR trước khi phân tích.
- Preview bản gửi, che một số mẫu nhạy cảm và cho sửa trước khi gửi.
- Báo cáo tiếng Việt có dấu hiệu, trích dẫn nguyên văn, checklist và giới hạn kiểm chứng; không in phần trăm rủi ro.
- Lưu thủ công vào lịch sử Supabase riêng theo RLS; không tự lưu hoặc upload ảnh gốc.
- Quota theo người dùng/khách, provider và phút. Dùng bộ đếm cục bộ ở local; production yêu cầu Upstash.
- Không mở URL đáng ngờ. Chỉ parse cấu trúc URL và public suffix list trong server.
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

Trước khi gửi, giao diện yêu cầu xác nhận nhà cung cấp AI sẽ nhận nội dung. Tự rà soát bản đã che: regex không thể bảo đảm tìm thấy mọi dữ liệu riêng tư. DeepSeek xử lý nội dung được gửi theo điều khoản của dịch vụ API; không gửi dữ liệu bạn không được phép chia sẻ. Ảnh được resize, tái mã hóa trong trình duyệt và che vùng được chọn trước khi truyền. Báo cáo chỉ lưu khi người dùng bấm lưu.

ScamLens không xác nhận danh tính tổ chức, chất lượng website, giao dịch thành công, chứng cứ pháp lý hoặc một nội dung là “an toàn”. Mỗi kết quả áp dụng cho phần văn bản được đưa vào. Ảnh biên lai không chứng minh tiền đã vào tài khoản.

## Cấu hình project

- Next.js App Router và TypeScript; chạy trên Node.js 24.
- Báo cáo: `src/lib/analysis/schema.ts`.
- Migration và Row Level Security: `supabase/migrations/`.
- Tình trạng không chứa secret: `GET /api/health`.
- Workflow CI dùng fixture; live provider smoke test tách riêng và cần key/opt-in của người quản lý.
