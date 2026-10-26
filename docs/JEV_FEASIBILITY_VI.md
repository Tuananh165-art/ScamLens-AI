# Đánh giá khả thi: TypeSafe Jev trong ScamLens-AI

Ngày đối chiếu: 27-10-2026. Phạm vi ban đầu là nghiên cứu và PoC trên dữ liệu tổng hợp. Theo yêu cầu tiếp theo, dự án đã thêm adapter web JEV tùy chọn để kiểm tra có kiểm soát; chưa có kết quả live trong project.

## Kết luận

**Nên thử ở dạng benchmark riêng; chưa nên dùng Jev để quyết định kết quả thật.** ScamLens đã có một chỗ phù hợp cho Jev: các phán đoán ngữ nghĩa nhỏ nằm cạnh quy tắc xác định được và trước phần giải thích bằng tiếng Việt. Kết quả chỉ có giá trị nếu dữ liệu tiếng Việt của ScamLens chứng minh được cải thiện so với cả quy tắc lẫn DeepSeek.

Jev là model của TypeSafe dành cho câu hỏi có kiểu. Một request `System One` nhận trạng thái `state` và một hay nhiều câu hỏi `Noul`, `Choice` hoặc `Score`; mỗi câu hỏi có kết quả có cấu trúc. Câu hỏi có thể chạy chung một request. Jev không thay thế model sinh văn bản, vì thế DeepSeek vẫn cần thiết cho bản giải thích và checklist tiếng Việt. [Giới thiệu System One](https://docs.typesafe.ai/introduction)

## Bài toán trong ScamLens

Luồng hiện tại tại `src/app/api/analyze/route.ts` thu thập nội dung, tạo quy tắc, gọi `analyzeWithDeepSeek`, gộp findings, loại trích dẫn không có trong source rồi tính mức cảnh báo. Hai giới hạn phù hợp cho PoC:

1. `src/lib/analysis/rules.ts` dùng từ khóa để phát hiện đề cập OTP, chuyển tiền, gây gấp hoặc tổ chức. Vì vậy câu phòng tránh như “Không gửi OTP cho bất kỳ ai” vẫn khớp quy tắc từ khóa. Hệ thống cần phân biệt **đề cập** với **đề nghị người nhận làm việc đó**.
2. `src/lib/analysis/evidence.ts` kiểm tra trích dẫn có xuất hiện trong source. Nó chưa kiểm tra nội dung trích dẫn có hỗ trợ nhận định đi kèm hay không. Một chuỗi có thật vẫn có thể bị giải thích sai ngữ cảnh.

Đây là cơ hội để đo, chưa phải khẳng định Jev sẽ xử lý tốt hơn. Sáu tín hiệu PoC gồm yêu cầu thông tin xác thực, yêu cầu thanh toán, gây áp lực, tự xưng thẩm quyền, né kênh chính thức và hứa lợi nhuận/hoàn tiền chắc chắn. Mỗi tín hiệu là một đặc điểm nội dung, không phải kết luận lừa đảo.

## So sánh các hướng

| Hướng | Phù hợp với | Chi phí/rủi ro |
|---|---|---|
| Sửa regex và quy tắc | Dấu hiệu hình thức, URL, so sánh số, phép tính | Rẻ, kiểm thử rõ; khó hiểu phủ định và ngữ cảnh rộng |
| Dùng DeepSeek cho toàn bộ | Giải thích linh hoạt, nội dung tiếng Việt | Sinh văn bản cần parse; chi phí cao hơn một câu hỏi phân loại |
| Thêm Jev cho phán đoán hẹp | Câu hỏi nhị phân và tập nhãn đã định nghĩa | Thêm nhà cung cấp, dữ liệu rời máy, độ chính xác tiếng Việt cần đo |

Khuyến nghị: kiểm thử riêng phân loại tín hiệu và kiểm tra bằng chứng. Code tiếp tục sở hữu parse URL, xác thực quote, chuẩn hóa dữ liệu, tính toán và giới hạn chi phí. Jev không được tự tổng hợp điểm rủi ro hoặc tự hạ cảnh báo production trong PoC.

## Chi phí, ngôn ngữ và dữ liệu

TypeSafe công bố `jev-1.14.0` ở mức 0,042 USD mỗi triệu input token, output token hiện miễn phí. Hạn mức context hiện nêu 64k token cho request và 32k cho state cộng một câu hỏi; PoC giới hạn byte request ở 12.000 để giữ request nhỏ. `jev-latest` là alias có thể đổi phiên bản; benchmark ghim `jev-1.14.0`. [Models và giới hạn](https://docs.typesafe.ai/models)

TypeSafe ghi tiếng Anh là ngôn ngữ có độ chính xác tốt nhất và yêu cầu tự thử với ngôn ngữ khác. Bản công bố Jev 1.14 nói họ kỳ vọng cải thiện hỗ trợ đa ngôn ngữ; đó không phải benchmark độc lập tiếng Việt. [Thông tin ngôn ngữ](https://docs.typesafe.ai/models), [bài công bố Jev 1.14](https://typesafe.ai/blog/jev-1-14)

Nhà cung cấp nói dữ liệu khách hàng không dùng để huấn luyện, nhưng việc xử lý, telemetry và lưu giữ vẫn chịu thỏa thuận áp dụng. Không đưa nội dung người dùng thật vào PoC; chỉ gửi corpus giả lập và kiểm tra lại chính sách TypeSafe trước khi cân nhắc pilot. [Data handling](https://docs.typesafe.ai/legal), [lưu giữ dữ liệu](https://help.typesafe.ai/articles/5974925716-how-is-submitted-data-used-or-retained)

## Quyết định sau PoC

Giữ riêng hai kết quả: phân loại dấu hiệu và kiểm tra quan hệ bằng chứng. Mỗi kết quả cần vượt tiêu chí trong [đặc tả PoC](JEV_POC_SPEC_VI.md) trên tập đánh giá đã khóa. Nếu không vượt, ưu tiên sửa quy tắc hoặc prompt DeepSeek thay vì giữ thêm hạ tầng provider. Kể cả khi vượt, bước pilot cần được duyệt riêng; benchmark nhỏ chỉ tạo bằng chứng ban đầu, không chứng minh hiệu quả ngoài đời thực.

## Trạng thái adapter web

Adapter web là tùy chọn do người dùng chủ động bật; nó thêm một thẻ tín hiệu riêng vào báo cáo và lịch sử. DeepSeek/quy tắc vẫn sở hữu báo cáo chính và việc tính rủi ro. JEV bật tắt qua biến server `TYPESAFE_WEB_ENABLED`; hiện trạng trong local `.env` vẫn để tắt và `TYPESAFE_KEY_ROTATED=false`, vì key từng xuất hiện trong chat cần thu hồi/thay mới. Chỉ sau khi xác nhận thay key và kiểm tra quota mới có thể bật để chạy smoke web bằng tình huống tổng hợp.
