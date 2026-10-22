# Ghi chú sửa lỗi OCR trả về HTTP 502

## Triệu chứng

Giao diện hiển thị: “AI chưa tạo được kết quả theo định dạng cần thiết. Vui lòng thử lại sau ít phút.” Console cho thấy yêu cầu `POST /api/ocr` trả về `502`.

## Nguyên nhân theo bằng chứng hiện có

- `src/lib/ai/errors.ts` ánh xạ `deepseek_invalid_schema` thành đúng thông báo trên.
- `src/lib/ai/deepseek.ts` trước đây xác thực `text`, `uncertainParts`, `notes` và toàn bộ `structuredData` cùng lúc. Một trường giao dịch sai kiểu/ngoài giới hạn làm mất cả nội dung OCR.
- Screenshot không chứa body phản hồi gốc từ DeepSeek; vì vậy chưa thể xác định chính xác trường nào của ảnh này đã làm schema thất bại.

## Đã sửa

- Tách xác thực nội dung OCR khỏi xác thực `structuredData`; lỗi dữ liệu biên lai không còn làm hỏng phần chữ OCR hợp lệ.
- Mặc định `uncertainParts` và `notes` thành mảng rỗng khi model bỏ sót; lọc phần tử sai kiểu và giới hạn độ dài/số lượng trước khi xác thực.
- Chuẩn hóa số tiền dạng chuỗi chỉ khi định dạng phân tách hàng nghìn rõ ràng, ví dụ `3.600.000 VND`; không suy đoán giá trị thập phân mơ hồ.
- Loại trường giao dịch sai kiểu và thêm ghi chú nhắc người dùng kiểm tra ảnh. Các giới hạn endpoint, xác thực định dạng ảnh và quota được giữ nguyên.

## Kiểm tra

- `npm.cmd run typecheck`: thành công (`tsc --noEmit`, exit code 0).
- Chưa chạy test suite hoặc gọi DeepSeek với ảnh gốc trong screenshot. Không có file ảnh đầu vào hoặc payload model gốc trong workspace để tái hiện chính xác dữ liệu đã gây lỗi; cần thử lại thao tác OCR trên ảnh đã che sau khi Next dev server nạp source mới.

## Nếu vẫn gặp lỗi

Nếu sau khi tải lại ứng dụng vẫn nhận lỗi schema, cần kiểm tra response JSON của `/api/ocr` và log máy chủ cho request đó. Không ghi log API key, ảnh, hoặc nguyên văn nội dung riêng tư; chỉ log mã request và đường dẫn/code lỗi schema đã rút gọn.
