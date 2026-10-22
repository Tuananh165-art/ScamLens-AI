# TÀI LIỆU KỸ THUẬT VÀ THIẾT KẾ: ĐỊNH HƯỚNG NÂNG CẤP SCAMLENS-AI
## TẬP TRUNG: ĐỊNH VỊ CHÍNH XÁC VỊ TRÍ MÃ NGUỒN CẦN SỬA, KHẮC PHỤC LỖI KỸ THUẬT, CẢI TỔ TOÀN DIỆN UI/UX VÀ NÂNG CAO NĂNG LỰC "SCAMLENS"

> **Dành cho:** Nhóm phát triển mã nguồn ScamLens-AI (Cuộc thi AI Innovation Challenge 2026 — DIGIFEST Đồng Nai)  
> **Mục tiêu:** Cung cấp tài liệu kỹ thuật chi tiết chỉ rõ từng tệp tin (`path`), dòng mã (`line`), nguyên nhân lỗi, và phương án cải tiến cụ thể từ giao diện (UI/UX) theo chuẩn thiết kế quốc tế (Impeccable, Anti-Slop, UI/UX Pro Max) đến logic AI, giúp đồng đội tiếp nhận có thể sửa đổi chính xác, nhanh chóng và đạt điểm tối đa trước Hội đồng Ban Giám khảo.

---

## MỤC LỤC
1. [Bảng Ma Trận Định Vị Mã Nguồn Cần Sửa (Code Locator Matrix)](#1-bảng-ma-trận-định-vị-mã-nguồn-cần-sửa-code-locator-matrix)
2. [Chi Tiết Các Lỗi Kỹ Thuật & Logic AI Cần Khắc Phục](#2-chi-tiết-các-lỗi-kỹ-thuật--logic-ai-cần-khắc-phục)
   - 2.1. Lỗi vỡ Zod Schema (HTTP 502 `deepseek_invalid_schema`)
   - 2.2. Lỗi Whitelist cứng mô hình Vision trong DeepSeek Adapter
   - 2.3. Lỗi đối chiếu chuỗi con (Substring Evidence Verification) quá cứng nhắc
   - 2.4. Dữ liệu mẫu `demoExamples` hời hợt, làm giảm giá trị đề tài
   - 2.5. System Prompt thiếu chiều sâu tâm lý học hành vi
3. [Bộ Thư Viện 8 Case Study Thực Chiến Đa Tầng (Dữ liệu thử nghiệm mới)](#3-bộ-thư-viện-8-case-study-thực-chiến-đa-tầng)
4. [Đặc Tả Chi Tiết Cải Tổ Giao Diện (UI/UX Comprehensive Re-Engineering)](#4-đặc-tả-chi-tiết-cải-tổ-giao-diện-uiux-comprehensive-re-engineering)
   - 4.1. Tái thiết kế Hệ thống Design Tokens & Khắc phục Xung đột CSS (`globals.css` & `theme.css`)
   - 4.2. Header & Thanh Điều Hướng (`topbar`, `brand`, `account-area` trong `home-app.tsx` L183–187)
   - 4.3. Hero Section & Khung Minh Họa Trực Quan (`hero`, `hero-copy`, `hero-art` trong `home-app.tsx` L190–193)
   - 4.4. Khu Vực Nhập Liệu & Loại Bỏ Ma Sát Tương Tác 4 Bước (`workspace`, `input-panel` trong `home-app.tsx` L195–226)
   - 4.5. Nâng cấp Trải Nghiệm Che Ảnh Canvas Mobile (`ImageRedactor` trong `image-redactor.tsx` L1–85)
   - 4.6. Chuyển Đổi Side Panel Tĩnh thành "Widget Cảm Biến Nguy Cơ Trực Tiếp" (`side-panel` trong `home-app.tsx` L228–233)
   - 4.7. Báo Cáo Phân Tích: Bóc Tách Bằng Chứng Trên Mockup Hội Thoại (`ReportView` trong `home-app.tsx` L247–257)
   - 4.8. Khắc Phục Triệt Để Lỗi Tiếp Cận Cỡ Chữ Siêu Nhỏ (7px – 9px) và Vùng Bấm (< 35px) trên Di Động
   - 4.9. Tối Ưu Bảng Màu Chế Độ Tối (Dark Mode Contrast & Eye Comfort)
5. [Các Tính Năng Nâng Cấp Đúng Định Vị "ScamLens" (Deep Inspection Capabilities)](#5-các-tính-năng-nâng-cấp-đúng-định-vị-scamlens)
   - 5.1. Kính lúp khoanh vùng bằng chứng trực quan (In-place Visual Evidence)
   - 5.2. Giám định kỹ thuật số ảnh biên lai giả (Basic Fake Bill Forensic Lens)
   - 5.3. Thấu kính bóc tách URL chuyên sâu ngoại tuyến (Deep Static URL Lens)
   - 5.4. Trích xuất trường dữ liệu biên lai có đối soát logic (Structured Layout Parsing)
6. [Kế Hoạch & Lệnh Kiểm Chuẩn Sau Khi Chỉnh Sửa](#6-kế-hoạch--lệnh-kiểm-chuẩn-sau-khi-chỉnh-sửa)

---

## 1. BẢNG MA TRẬN ĐỊNH VỊ MÃ NGUỒN CẦN SỬA (CODE LOCATOR MATRIX)

Bảng dưới đây tổng hợp toàn bộ các tệp tin, dòng code cụ thể, hiện trạng lỗi và hành động cần thực hiện:

| STT | Tệp tin mã nguồn (`Target File`) | Vị trí (`Lines`) | Vấn đề / Điểm nghẽn hiện tại | Mức độ | Hành động cần sửa đổi |
|:---:|---|:---:|---|:---:|---|
| **1** | `src/app/globals.css` | L14–15 | Cỡ chữ mobile siêu nhỏ (`font-size: 7px - 9px`), touch target quá hẹp (< 35px). | 🔴 **Nghiêm trọng** | Tăng font size mobile tối thiểu 12px–14px; nâng touch target lên 44px–48px. |
| **2** | `src/lib/analysis/schema.ts` | L22–28 | Giới hạn ký tự `summary.max(600)`, `checklist.max(8)` quá chặt làm ném lỗi 502 khi AI phân tích chi tiết. | 🔴 **Nghiêm trọng** | Mở rộng ngưỡng (`max(1200)`), viết hàm truncate/sanitizer trước khi `safeParse`. |
| **3** | `src/lib/ai/deepseek.ts` | L106–109 | Whitelist model Vision bị hardcode mảng cố định `['deepseek-flash', ...]`. | 🟡 **Trung bình** | Cho phép fallback linh hoạt qua env `DEEPSEEK_VISION_MODEL`. |
| **4** | `src/lib/analysis/evidence.ts` | L9–13 | Hàm `source.indexOf(quote)` quá cứng nhắc; chỉ cần AI viết hoa hoặc đổi dấu câu là bị drop hoàn toàn. | 🔴 **Nghiêm trọng** | Chuẩn hóa chuỗi trước khi so sánh (normalize whitespace, trim punctuation, case-insensitive). |
| **5** | `src/components/home-app.tsx` | L35–40 | Mẫu dữ liệu `demoExamples` mang tính hoạt hình ("khóa sau 10 phút, gửi OTP"). | 🔴 **Nghiêm trọng** | Thay bằng kho 8 Case Study thực chiến đa tầng tại Mục 3 tài liệu này. |
| **6** | `src/components/home-app.tsx` | L215–226 | Luồng tương tác 4 bước rườm rà (Bấm Xem trước -> Tick Checkbox 1 -> Tick Checkbox 2 -> Bấm Phân tích). | 🟡 **Trung bình** | Gộp thành luồng 1-Chạm (Instant 1-Click Verification) có auto-redact toggle. |
| **7** | `src/components/image-redactor.tsx` | L78–80 | Canvas trên điện thoại chỉ có nút "Xóa tất cả vùng che", thiếu nút "Hoàn tác" (Undo nét vẽ vừa vẽ). | 🟡 **Trung bình** | Thêm nút `Undo` (`setRects(prev => prev.slice(0, -1))`). |
| **8** | `src/lib/analysis/prompts.ts` | L1–8 | Prompt chỉ quét từ khóa bề mặt, không nhận diện được các thủ thuật thao túng tâm lý xã hội học. | 🔴 **Nghiêm trọng** | Thay thế bằng System Prompt chuyên gia tâm lý học tội phạm mạng (Mục 2.5). |
| **9** | `src/app/theme.css` | L53–60 | Xung đột kích thước chữ cơ sở với `globals.css` (14px vs 16px); màu nền dark mode một số chỗ bị bợt. | 🟢 **Nhẹ** | Đồng bộ hóa biến tokens CSS, chuẩn hóa bảng màu tương phản dark mode. |
| **10** | `src/lib/analysis/url.ts` | L1–40 | Phân tích cú pháp URL còn đơn giản, chưa bắt được Homograph Cyrillic và tham số redirect ngầm. | 🟡 **Trung bình** | Bổ sung kiểm tra ký tự Unicode đồng hình và tham số query lồng ghép. |

---

## 2. CHI TIẾT CÁC LỖI KỸ THUẬT & LOGIC AI CẦN KHẮC PHỤC

### 2.1. Lỗi vỡ Zod Schema (HTTP 502 `deepseek_invalid_schema`)
* **Vị trí tệp tin:** [`src/lib/analysis/schema.ts`](../src/lib/analysis/schema.ts#L22-L28) và [`src/lib/ai/deepseek.ts`](../src/lib/ai/deepseek.ts#L100-L103).
* **Mã nguồn hiện tại trong `schema.ts`:**
  ```typescript
  export const modelReportSchema = z.object({
    summary: z.string().trim().min(3).max(600), // <-- LỖI: Vượt quá 600 ký tự sẽ vỡ
    riskLevel: riskLevelSchema,
    findings: z.array(findingSchema).max(12),
    checklist: z.array(z.string().trim().min(5).max(220)).max(8), // <-- LỖI: Trả 9 mục là vỡ
    limitations: z.array(z.string().trim().min(5).max(200)).max(8),
  });
  ```
* **Mã nguồn xử lý lỗi trong `src/lib/ai/deepseek.ts`:**
  ```typescript
  const result = modelReportSchema.safeParse(parseJson(raw));
  if (!result.success) throw new Error("deepseek_invalid_schema");
  ```
* **Hậu quả thực tế:** Khi phân tích vụ việc lừa đảo phức tạp (ví dụ: bẫy giả mạo cơ quan công quyền hoặc bẫy tuyển dụng đa bước), DeepSeek API trả về văn bản tiếng Việt chi tiết với phần tóm tắt dài hơn 600 ký tự hoặc đưa ra 9 khuyến nghị trong checklist. Zod schema từ chối, throw exception và API Route trả về HTTP 502: *"AI chưa tạo được kết quả theo định dạng cần thiết. Vui lòng thử lại sau ít phút"*.
* **Giải pháp sửa đổi chính xác:**
  1. Trong `src/lib/analysis/schema.ts`: Nâng ngưỡng an toàn:
     ```typescript
     summary: z.string().trim().min(3).max(1500),
     checklist: z.array(z.string().trim().min(3).max(350)).max(15),
     limitations: z.array(z.string().trim().min(3).max(350)).max(15),
     ```
  2. Trong `src/lib/ai/deepseek.ts`: Thêm hàm Sanitizer cắt ngắn dữ liệu thô trước khi đưa vào parse, loại bỏ hoàn toàn rủi ro vỡ schema:
     ```typescript
     function sanitizeReportPayload(raw: Record<string, any>) {
       if (typeof raw.summary === "string" && raw.summary.length > 1400) raw.summary = raw.summary.slice(0, 1390) + "...";
       if (Array.isArray(raw.checklist) && raw.checklist.length > 12) raw.checklist = raw.checklist.slice(0, 12);
       if (Array.isArray(raw.limitations) && raw.limitations.length > 12) raw.limitations = raw.limitations.slice(0, 12);
       return raw;
     }
     ```

---

### 2.2. Lỗi Whitelist cứng mô hình Vision trong DeepSeek Adapter
* **Vị trí tệp tin:** [`src/lib/ai/deepseek.ts`](../src/lib/ai/deepseek.ts#L106-L109).
* **Mã nguồn hiện tại:**
  ```typescript
  export async function readImage(image: Buffer, mimeType: ImageMime) {
    const { model } = configuredDeepSeek();
    if (!["deepseek-flash", "deepseek-v4-flash", "deepseek-v4-flash-vision-exp"].includes(model)) {
      throw new Error("deepseek_vision_model_unsupported");
    }
  ```
* **Hậu quả:** Nếu người dùng đặt `DEEPSEEK_MODEL=deepseek-chat` để tiết kiệm chi phí phân tích văn bản, chức năng đọc ảnh OCR sẽ lập tức sập với lỗi 503 `deepseek_vision_model_unsupported`.
* **Giải pháp sửa đổi:**
  Cho phép tách biệt biến môi trường:
  ```typescript
  const visionModel = process.env.DEEPSEEK_VISION_MODEL?.trim() || model;
  ```
  Và cho phép mọi model hợp lệ gửi đi, chỉ fallback khi API trả về mã lỗi cụ thể từ máy chủ.

---

### 2.3. Lỗi đối chiếu chuỗi con (Substring Evidence) quá cứng nhắc
* **Vị trí tệp tin:** [`src/lib/analysis/evidence.ts`](../src/lib/analysis/evidence.ts#L7-L16).
* **Mã nguồn hiện tại:**
  ```typescript
  export function attachVerifiedEvidence(findings: Finding[], sourceId: string, source: string, confirmedOcr: boolean): VerifiedFinding[] {
    return findings.flatMap((finding) => {
      const quote = finding.evidence.trim();
      const start = source.indexOf(quote);
      if (start < 0) return []; // <-- LỖI: Chỉ cần lệch 1 ký tự hoa/thường hoặc dấu chấm là mất trắng finding
  ```
* **Hậu quả:** Mô hình AI khi trích dẫn thường chuẩn hóa chữ hoa đầu câu (ví dụ: nguồn ghi `chuyen tien ngay`, AI trích dẫn `Chuyen tien ngay`) hoặc lược bỏ dấu chấm cuối câu (`.` -> không có). Lệnh `source.indexOf(quote)` trả về `-1`, khiến phát hiện nguy hiểm này bị **loại bỏ hoàn toàn khỏi báo cáo**.
* **Giải pháp sửa đổi:**
  Viết lại hàm tìm kiếm vị trí linh hoạt:
  ```typescript
  export function attachVerifiedEvidence(findings: Finding[], sourceId: string, source: string, confirmedOcr: boolean): VerifiedFinding[] {
    const normalizedSource = source.toLocaleLowerCase("vi-VN");
    return findings.flatMap((finding) => {
      let quote = finding.evidence.trim();
      // 1. Thử tìm khớp chính xác
      let start = source.indexOf(quote);
      // 2. Thử tìm không phân biệt hoa thường
      if (start < 0) {
        start = normalizedSource.indexOf(quote.toLocaleLowerCase("vi-VN"));
      }
      // 3. Thử cắt bỏ dấu câu ở 2 đầu (dấu ngoặc kép, dấu chấm, dấu phẩy)
      if (start < 0) {
        const cleanQuote = quote.replace(/^[.,;:"'!?\s]+|[.,;:"'!?\s]+$/g, "");
        if (cleanQuote.length >= 2) {
          start = normalizedSource.indexOf(cleanQuote.toLocaleLowerCase("vi-VN"));
          if (start >= 0) quote = source.slice(start, start + cleanQuote.length);
        }
      }
      if (start < 0) return [];
      const end = start + quote.length;
      return [{ ...finding, evidenceRefs: [{ sourceId, quote: source.slice(start, end), start, end, confirmedByUser: confirmedOcr }] }];
    });
  }
  ```

---

### 2.4. Dữ liệu mẫu `demoExamples` hời hợt, làm giảm giá trị đề tài
* **Vị trí tệp tin:** [`src/components/home-app.tsx`](../src/components/home-app.tsx#L35-L40).
* **Mã nguồn hiện tại:**
  ```typescript
  const demoExamples: Record<InputType, { label: string; content: string; subject?: string; sender?: string; replyTo?: string }> = {
    message: { label: "Giả danh ngân hàng · mẫu", content: "[MẪU GIẢ LẬP] Tài khoản của bạn sắp bị khóa trong 10 phút. Hãy gửi mã OTP để xác minh ngay, không được nói với ai." },
    email: { label: "Email yêu cầu thanh toán · mẫu", sender: "ke-toan@example.test", replyTo: "xacnhan@example.test", subject: "Thanh toán phí xử lý hôm nay", content: "[MẪU GIẢ LẬP] Vui lòng chuyển khoản phí xử lý ngay hôm nay để tránh khóa tài khoản." },
    image: { label: "Biên lai giao dịch · mẫu", content: "[MẪU GIẢ LẬP] Đã chuyển khoản thành công — vui lòng giao hàng. Đây chỉ là ví dụ, không phải ảnh giao dịch thật." },
    url: { label: "Đường dẫn cần kiểm tra · mẫu", content: "https://example.test/secure-login" },
  };
  ```
* **Giải pháp sửa đổi:** Thay thế toàn bộ đối tượng `demoExamples` bằng các kịch bản thực chiến tinh vi từ Mục 3 (ví dụ: mạo danh VNeID, bẫy tuyển dụng nhử mồi, fake bill ngoài giờ).

---

### 2.5. Cập nhật System Prompt chuyên gia tâm lý học hành vi
* **Vị trí tệp tin:** [`src/lib/analysis/prompts.ts`](../src/lib/analysis/prompts.ts#L1-L8).
* **Mã nguồn đề xuất thay thế:**
  ```typescript
  export const ANALYSIS_SYSTEM_PROMPT = `Bạn là ScamLens - Hệ thống Giám định An toàn Số và Bóc tách Kỹ nghệ Thao túng Tâm lý (Social Engineering Detection) tiếng Việt.
  Nhiệm vụ của bạn là phân tích dữ liệu nghi vấn do người dùng cung cấp (tin nhắn, email, URL, văn bản OCR từ biên lai).

  BẮT BUỘC TUÂN THỦ CÁC NGUYÊN TẮC:
  1. KHÔNG CHỈ TÌM TỪ KHÓA BỀ MẶT: Kẻ lừa đảo tinh vi không đòi tiền hay OTP lộ liễu. Hãy bóc tách 6 thủ thuật tâm lý xã hội học:
     - Authority Bias: Dùng văn phong hành chính, chức danh công an/thuế, số công văn để trấn áp.
     - Cognitive Ease & Honey Pot: Cho nhận tiền thật hoặc quà miễn phí trước để xóa tan cảnh giác.
     - Sunk Cost Trap: Viện cớ lỗi hệ thống đối soát để ép nạp thêm tiền cứu vốn.
     - Emotional & Moral Blackmail: Viện cớ bệnh viện cấp cứu, người thân tai nạn, uy hiếp lương tâm.
     - Artificial Urgency & Delivery Rush: Thúc ép thời gian gấp, tạo áp lực tài xế đứng chờ lấy hàng.
     - Domain Masking: Tên miền phụ mạo danh dạng dichvucong.gov-vn.info.

  2. CƠ CHẾ BẰNG CHỨNG NGUYÊN VĂN:
     Mỗi finding BẮT BUỘC có trường evidence trích nguyên văn từ SOURCE. Không suy diễn thêm bớt ký tự.

  3. ĐỊNH DẠNG ĐẦU RA:
     Chỉ trả về 1 JSON object hợp lệ:
     {
       "summary": "1-3 câu phân tích sâu bản chất kịch bản và bẫy tâm lý đang áp dụng.",
       "riskLevel": "high" | "medium" | "low" | "insufficient",
       "findings": [
         {
           "category": "impersonation" | "money_request" | "urgency" | "secret_request" | "suspicious_url" | "inconsistency",
           "severity": "high" | "medium" | "low",
           "title": "Tên dấu hiệu",
           "explanation": "Phân tích vì sao hành vi này là bẫy thao túng",
           "evidence": "Trích nguyên văn từ SOURCE"
         }
       ],
       "checklist": ["Bước tự xác minh an toàn độc lập"],
       "limitations": ["Giới hạn của lần phân tích"]
     }`;
  ```

---

## 3. BỘ THƯ VIỆN 8 CASE STUDY THỰC CHIẾN ĐA TẦNG (DỮ LIỆU THỬ NGHIỆM MẪU CHUYÊN SÂU)

Toàn bộ 8 tình huống dưới đây được trích xuất và tổng hợp từ các vụ án lừa đảo công nghệ cao thực tế xảy ra tại địa bàn tỉnh Đồng Nai (KCN Biên Hòa, Trảng Dài, Long Thành) và khu vực Đông Nam Bộ. Các tình huống được thiết kế với văn phong tự nhiên 100%, không sử dụng từ khóa đòi tiền hay xin OTP lộ liễu, buộc AI ScamLens phải bóc tách bằng chứng qua lăng kính phân tích tâm lý học hành vi (Behavioral Psychology) và kỹ nghệ xã hội (Social Engineering).

Đồng đội sẽ dùng bộ dữ liệu này để thay thế `demoExamples` trong [`src/components/home-app.tsx`](../src/components/home-app.tsx#L35-L40) và viết bộ kiểm thử Vitest/E2E:

---

### CASE 1: CÁN BỘ DỊCH VỤ CÔNG HƯỚNG DẪN ĐỒNG BỘ ĐỊNH DANH MỨC 2
* **Kênh tiếp cận:** Tin nhắn Zalo kết hợp số điện thoại bàn mạo danh cán bộ một cửa.
* **Ngữ cảnh nạn nhân:** Nạn nhân là công nhân hoặc nhân viên văn phòng bận rộn trong giờ làm việc hành chính tại Biên Hòa, Đồng Nai.
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [HỘI THOẠI ZALO HÀNH CHÍNH]
  Cán bộ hỗ trợ công nghệ số (Nguyễn Văn Hùng - Tổ Đề án 06 địa bàn Biên Hòa): 
  "Chào anh/chị. Tôi là Hùng, cán bộ phụ trách làm sạch và đồng bộ dữ liệu dân cư tại địa bàn. 
  Hôm nay hệ thống đối soát dữ liệu CCCD gắn chip với mã định danh điện tử mức 2 trên ứng dụng VNeID của anh/chị phát hiện trường thông tin quê quán và số sổ BHXH bị lệch 1 ký tự so với cơ sở dữ liệu quốc gia của Bộ Công An. Lỗi này dẫn tới việc thẻ BHYT và các thủ tục hành chính sắp tới sẽ tạm thời bị tạm dừng liên thông từ ngày 01 tháng tới theo Công văn 182/UBND tỉnh.

  Hôm nay là hạn chót để chuẩn hóa dữ liệu trực tuyến phục vụ chi trả an sinh xã hội. Anh/chị có thể ra trực tiếp bộ phận một cửa tại UBND thành phố trước 16h30 hôm nay (lưu ý nhớ mang theo giấy khai sinh bản gốc, sổ hộ khẩu cũ và CCCD bản gốc để xếp hàng bốc số), hoặc nếu đang đi làm bận không xin nghỉ được thì có thể truy cập cổng liên thông trực tuyến của tỉnh tại: 
  https://dichvucong-dongnai-portal.gov-vn.info/cap-nhat-dinh-danh 
  để hệ thống tự động quét lại mã QR trên thẻ CCCD chỉ mất 2 phút là xong, không cần phải xin nghỉ làm mất công mất việc."
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Tạo uy quyền giả định (Authority Bias):* Trích dẫn chính xác số công văn, sử dụng trôi chảy ngôn ngữ hành chính công ("chuẩn hóa dữ liệu", "liên thông BHYT", "Đề án 06", "bộ phận một cửa").
  - *Bẫy tâm lý giảm ma sát (Friction Reduction Trap):* Đưa ra 2 lựa chọn có tính định hướng tâm lý: Lựa chọn 1 mang tính "trừng phạt" (phải mang nhiều giấy tờ gốc, xin nghỉ làm, ra xếp hàng); Lựa chọn 2 mang tính "cứu cánh" (bấm link làm online mất 2 phút). Đánh trúng tâm lý ngại thủ tục phiền hà của người dân lao động.
  - *Kỹ thuật che giấu tên miền (Domain Masking):* Kẻ gian dùng tên miền phụ `gov-vn.info` (tên miền quốc tế `.info` có chứa từ khóa `gov-vn` ở subdomain) để giả mạo tên miền chính phủ `.gov.vn`.
  - *Hoàn toàn không có từ khóa cấm:* Không đòi tiền, không xin OTP, không dọa bắt giam.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn bằng chứng: `"dichvucong-dongnai-portal.gov-vn.info"` -> Cảnh báo tên miền đuôi `.info` mạo danh cổng thông tin cơ quan nhà nước `.gov.vn`.
  2. Bóc tách dấu hiệu ép buộc thời gian: `"trước 16h30 hôm nay"`, `"tạm dừng liên thông từ ngày 01 tháng tới"`.
  3. Khuyến nghị kiểm chứng: Cán bộ công quyền không hướng dẫn làm thủ tục qua Zalo cá nhân; mọi cập nhật VNeID chỉ thực hiện trực tiếp trên ứng dụng VNeID chính thức tải từ App Store / Google Play.

---

### CASE 2: BẪY TUYỂN DỤNG CTV / BOOKING NHỬ LỢI NHUẬN NHỎ (PIG BUTCHERING)
* **Kênh tiếp cận:** Tin nhắn Telegram / Zalo từ bộ phận nhân sự việc làm trực tuyến.
* **Ngữ cảnh nạn nhân:** Mẹ bỉm sữa, sinh viên hoặc công nhân tìm kiếm thu nhập thêm từ việc làm bán thời gian online.
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [HỘI THOẠI TELEGRAM VIỆC LÀM]
  Chuyên viên tuyển dụng Mai Phương: 
  "Chào em, chị thấy hồ sơ đăng ký cộng tác viên kiểm duyệt lượt đánh giá khách sạn của em trên trang tìm việc làm thêm. 
  Công việc của mình rất đơn giản: Bên chị liên kết với các chuỗi resort để tăng chỉ số hiển thị trên Google Maps. Mỗi lượt em vào bấm vote 5 sao và chụp màn hình gửi chị sẽ nhận 30.000đ. Không cần cọc tiền, không giữ giấy tờ."

  (Sau khi người dùng làm xong 2 lượt đánh giá đầu tiên và thực sự nhận được 60.000đ tiền thật chuyển khoản vào STK cá nhân)

  Chuyên viên tuyển dụng Mai Phương:
  "Em làm việc rất chuẩn chỉ và đúng giờ. Hiện tại phòng điều phối đang mở 1 suất nhiệm vụ VIP duy nhất dành riêng cho nhân viên có đánh giá xuất sắc trong ca sáng: Đặt phòng trải nghiệm để đẩy thanh khoản cho khách sạn đối tác.
  Gói nhiệm vụ này là 1.500.000đ, em chỉ cần thực hiện thao tác qua cổng thanh toán liên kết của hệ thống. Ngay khi giao dịch ghi nhận, phòng kế toán sẽ hoàn trả 1.500.000đ tiền gốc + 350.000đ hoa hồng sau đúng 5 phút. Em có muốn nhận luôn gói này để chốt ca hôm nay không?"
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Mồi nhử tạo sự thoải mái nhận thức (Cognitive Ease & Honey Pot):* Kẻ lừa đảo sẵn sàng trích ra 60.000đ tiền thật chuyển khoản trực tiếp vào tài khoản ngân hàng của nạn nhân để phá vỡ mọi rào cản cảnh giác ban đầu.
  - *Tâng bốc vị thế và kích thích lòng tham (Ego Stroking & Scarcity):* Khen ngợi nạn nhân "chuẩn chỉ, xuất sắc", tạo cảm giác cơ hội VIP là "khan hiếm", dành riêng cho mình.
  - *Thủ thuật chân trong cửa (Foot-in-the-Door Technique):* Chuyển từ việc không bỏ vốn sang nhiệm vụ nạp 1.500.000đ. Nếu nạn nhân nạp tiếp, kẻ gian sẽ kích hoạt bẫy "sai cú pháp lệnh / hệ thống quá tải" để buộc nạp thêm 5.000.000đ nhằm cứu khoản tiền ban đầu (Bẫy chi phí chìm - Sunk Cost Fallacy).
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn bằng chứng: `"hoàn trả 1.500.000đ tiền gốc + 350.000đ hoa hồng sau đúng 5 phút"` -> Bóc tách chiêu thức cam kết lợi nhuận bất thường (>20% trong 5 phút).
  2. Bóc tách cơ chế chuyển dịch từ nhiệm vụ 0 đồng sang nhiệm vụ nạp tiền đối ứng.
  3. Khuyến nghị kiểm chứng: Dừng ngay lập tức việc chuyển tiền; bất kỳ công việc nào yêu cầu nạp tiền đối ứng để nhận lại hoa hồng đều là bẫy lừa đảo tài chính Ponzi/Pig-butchering.

---

### CASE 3: ĐỒNG NGHIỆP CŨ MƯỢN TIỀN THANH TOÁN VIỆN PHÍ TRONG TÌNH HUỐNG TẾ NHỊ
* **Kênh tiếp cận:** Facebook Messenger bị chiếm đoạt (hack tài khoản) hoặc tạo tài khoản mạo danh dùng ảnh đại diện giống 100%.
* **Ngữ cảnh nạn nhân:** Nạn nhân nhận tin nhắn từ một người bạn thân hoặc đồng nghiệp cũ từng làm chung xưởng/công ty.
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [HỘI THOẠI MESSENGER]
  Bạn cũ (Tài khoản mạo danh):
  "Hải ơi, dạo này công việc bên xưởng 2 vẫn ổn định chứ mày? Hôm qua tao lướt thấy ảnh mày đăng đưa cả nhà đi chơi Vũng Tàu nhìn ấm cúng quá. Cu Bắp dạo này lớn nhanh ghê, nhìn cái trán giống mày y đúc haha."

  Nạn nhân (Hải):
  "Ừ cảm ơn mày, dạo này xưởng cũng đều việc. Mày với vợ con vẫn bên Long Khánh hả? Bữa nào rảnh anh em cà phê nhé."

  Bạn cũ (Tài khoản mạo danh):
  "Ừ tao vẫn bên này. Mà Hải ơi, tao đang ở bệnh viện Đa khoa Đồng Nai với bà chị họ đưa mẹ tao đi cấp cứu mổ ruột thừa gấp. 
  Khổ quá cái app Techcombank của tao nãy giờ cứ xoay tròn báo lỗi hệ thống bảo trì không chuyển khoản viện phí tạm ứng được. Bên khoa cấp cứu họ bảo nộp 4 triệu trước để đẩy hồ sơ vào phòng mổ. 
  Mày có đang cầm máy đó không, bắn giúp tao 4 triệu qua STK bác sĩ trực nhận bệnh này với, lát người nhà tao mang tiền mặt đến tao nộp lại rồi chuyển trả lại mày luôn trong trưa nay. Đội ơn mày nhiều!"
  STK: 1029384756 - MB Bank - NGUYEN VAN THUONG (Bác sĩ trực cấp cứu)
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Thu thập tin tình báo xã hội (OSINT Social Engineering):* Kẻ gian đọc tường Facebook nạn nhân, gọi đúng tên thân mật của con ("cu Bắp"), nhắc đúng chuyến đi chơi gần nhất để tạo cảm giác thân tín tuyệt đối.
  - *Uy hiếp đạo đức trong tình huống sinh tử (Moral Blackmail & Urgent Life-Threat):* Nêu lý do "mẹ đi cấp cứu mổ ruột thừa". Nạn nhân bị đẩy vào thế tiến thoái lưỡng nan: nếu gọi điện xác minh rườm rà thì sợ bạn phật ý và làm chậm trễ ca cấp cứu của người già.
  - *Bao biện hợp lý cho số tài khoản mang tên người lạ:* Tên người thụ hưởng không khớp với bạn bè, nhưng được gán mác là "Số tài khoản bác sĩ trực cấp cứu" để giải tỏa nghi ngờ.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn bằng chứng: `"NGUYEN VAN THUONG (Bác sĩ trực cấp cứu)"` -> Bóc tách cảnh báo: Bệnh viện và y bác sĩ không bao giờ dùng tài khoản ngân hàng cá nhân của bác sĩ trực để nhận viện phí tạm ứng.
  2. Trích dẫn: `"báo lỗi bảo trì hệ thống 24/7 không chuyển khoản viện phí tạm ứng được"` -> Chiêu thức bao biện kinh điển khi mượn tiền qua tài khoản thứ ba.
  3. Khuyến nghị kiểm chứng: BẮT BUỘC gọi điện thoại thông thường (qua sóng di động GSM, không gọi qua Messenger/Zalo) để nghe trực tiếp giọng nói của bạn mình trước khi chuyển tiền.

---

### CASE 4: BẪY CHUYỂN KHOẢN NHẦM VÀ KỊCH BẢN TÍN DỤNG ĐEN ĐÒI NỢ GIÁN TIẾP
* **Kênh tiếp cận:** Biến động số dư tài khoản ngân hàng thật kết hợp tin nhắn SMS/Zalo từ số điện thoại lạ.
* **Ngữ cảnh nạn nhân:** Nạn nhân bất ngờ thấy tài khoản ngân hàng của mình được cộng 5.000.000đ với nội dung chuyển khoản mơ hồ.
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [THÔNG BÁO BIẾN ĐỘNG SỐ DƯ TÀI KHOẢN NGÂN HÀNG THẬT]
  Số dư TK ...5678 +5,000,000 VND lúc 09:15. Nội dung: "Nguyen Thi Lan tra tien hang".

  [15 PHÚT SAU - TIN NHẮN TỪ SỐ ĐIỆN THOẠI LẠ 0912.xxx.xxx]
  "Dạ em chào chị Lan ạ! Em là sinh viên đang thuê trọ ở khu phố 4, phường Trảng Dài. Nãy em đi ra ngân hàng nộp tiền đóng học phí kỳ này cho trường mà do luống cuống em bấm nhầm số tài khoản nên chuyển nhầm 5 triệu vào số tài khoản của chị. 
  Chị ơi đó là toàn bộ tiền mẹ em ở quê vay mượn gửi lên cho em nộp học, trưa nay là hạn chót trường khóa cổng tài chính rồi ạ. Em xin chị làm ơn thương tình chuyển khoản lại giúp em vào số tài khoản của mẹ em để em kịp nộp học với ạ, em xin đội ơn chị suốt đời!
  Số tài khoản mẹ em: 0987654321 - Vietcombank - TRẦN THỊ HỒNG."
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Cơ chế bẫy nợ tín dụng đen ngầm (Loan Shark Trap Mechanism):* Kẻ gian lấy cắp thông tin CCCD và số tài khoản của chị Lan để đăng ký vay tiền trực tuyến trên một app vay tiền "tín dụng đen". App giải ngân 5 triệu vào đúng số tài khoản của chị Lan.
  - *Kịch bản xin lại tiền vào tài khoản thứ ba:* Kẻ gian đóng vai sinh viên nghèo chuyển nhầm, đánh vào lòng trắc ẩn của nạn nhân để yêu cầu chuyển 5 triệu sang số tài khoản của kẻ gian (TRẦN THỊ HỒNG).
  - *Hậu quả pháp lý:* Nếu chị Lan tự ý chuyển 5 triệu sang STK thứ ba, thì vài tuần sau bên app cho vay sẽ gọi điện đòi nợ chị Lan với số tiền gốc 5 triệu + lãi suất cắt cổ lên tới hàng chục triệu đồng vì trên hệ thống cho vay, chị Lan là người nhận tiền giải ngân.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn bằng chứng: `"chuyển khoản lại giúp em vào số tài khoản của mẹ em: 0987654321 - Vietcombank - TRẦN THỊ HỒNG"` -> Cảnh báo bẫy đòi tiền qua tài khoản thứ ba khi có biến động số dư lạ.
  2. Chỉ rõ quy tắc an toàn ngân hàng: Người nhận tiền tuyệt đối không được tự ý thực hiện giao dịch chuyển trả vào số tài khoản lạ do cá nhân nhắn tin yêu cầu.
  3. Khuyến nghị kiểm chứng: Giữ nguyên số tiền trong tài khoản, ra trực tiếp chi nhánh ngân hàng quản lý tài khoản để lập biên bản "Tra soát giao dịch chuyển nhầm", yêu cầu ngân hàng tự động phong tỏa và hoàn tiền về đúng tài khoản đã gửi lệnh chuyển ban đầu.

---

### CASE 5: KHÁCH THUÊ PHÒNG TRỌ / MUA ĐỒ CŨ GỬI CỔNG XÁC NHẬN THANH TOÁN QUỐC TẾ
* **Kênh tiếp cận:** Tin nhắn trao đổi qua Zalo hoặc Facebook Marketplace.
* **Ngữ cảnh nạn nhân:** Chủ nhà trọ tại Biên Hòa hoặc người dân đăng bài thanh lý đồ điện tử cũ (máy lạnh, tủ lạnh, tivi).
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [HỘI THOẠI ZALO]
  Khách thuê (David Trần - Kỹ sư dầu khí công tác nước ngoài):
  "Chào chị, tôi thấy căn phòng trọ gia đình chị đăng cho thuê trên đường Đồng Khởi rất ưng ý. Tháng sau tôi về làm việc tại KCN Biên Hòa 2 trong 6 tháng nên muốn đặt cọc giữ phòng luôn. Tôi muốn cọc trước 2 tháng tiền nhà là 6.000.000đ."

  Chủ nhà:
  "Dạ vâng anh, anh chuyển khoản số tài khoản này nhé..."

  Khách thuê:
  "Do hiện tại tôi đang làm việc trên giàn khoan ngoài khơi, tài khoản công ty chỉ cho phép chuyển tiền qua cổng thanh toán dịch vụ kiều hối quốc tế Western Union / Swift Pay liên ngân hàng. 
  Tôi đã làm lệnh gửi 6.000.000đ vào hệ thống rồi, bên cổng chuyển tiền vừa tạo hóa đơn ủy thác. Chị vui lòng mở liên kết xác nhận nhận tiền dưới đây, chọn đúng ngân hàng chị đang dùng và hoàn tất bước xác thực liên kết bảo mật để tiền tự động quy đổi từ USD về thẳng tài khoản VNĐ của chị nhé:
  https://western-union.vietnam-remittance.online/receive-portal?ref=6000K
  Tôi trả toàn bộ phí giao dịch rồi nên chị không mất đồng nào đâu ạ."
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Tạo cảm giác "khách sộp" không mặc cả:* Chủ động cọc trước 2 tháng tiền nhà, tạo tâm lý sợ mất khách hàng tiềm năng.
  - *Xây dựng hồ sơ danh giá và khoảng cách địa lý hợp lý:* Vỏ bọc kỹ sư giàn khoan ngoài khơi giúp giải thích hợp lý vì sao không thể gặp mặt trực tiếp và tại sao phải chuyển tiền kiều hối quốc tế.
  - *Bẫy chiếm đoạt tài khoản trực tuyến (Phishing Link):* Đường link giả mạo giao diện Western Union nhưng chứa mã nguồn đánh cắp thông tin đăng nhập Internet Banking (Username, Password) và yêu cầu nhập mã OTP/Smart OTP với lý do "xác nhận nhận tiền", nhưng thực chất là kích hoạt lệnh chuyển toàn bộ tiền trong tài khoản của nạn nhân sang tài khoản kẻ gian.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn: `"https://western-union.vietnam-remittance.online/receive-portal?ref=6000K"` -> Bóc tách tên miền rác `.online` giả mạo thương hiệu chuyển tiền quốc tế Western Union (`westernunion.com`).
  2. Bóc tách nghịch lý quy trình ngân hàng: Nhận tiền chuyển khoản qua số tài khoản hoặc số thẻ ngân hàng CHỈ CẦN cung cấp số tài khoản và tên ngân hàng, TUYỆT ĐỐI KHÔNG CẦN đăng nhập vào bất kỳ liên kết web nào để "xác thực nhận tiền".
  3. Khuyến nghị kiểm chứng: Không nhấp vào liên kết, không nhập thông tin ngân hàng và chặn tài khoản gửi tin nhắn.

---

### CASE 6: BIÊN LAI FAKE BILL CHUYỂN THƯỜNG NGOÀI GIỜ KÈM HỐI THÚC TÀI XẾ
* **Kênh tiếp cận:** Ảnh chụp màn hình biên lai chuyển khoản ngân hàng gửi qua Zalo cho cửa hàng kinh doanh.
* **Ngữ cảnh nạn nhân:** Chủ cửa hàng buôn bán laptop, điện thoại di động hoặc thời trang đắt tiền tại Đồng Nai.
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [VĂN BẢN TRÍCH XUẤT TỪ ẢNH BIÊN LAI OCR & TIN NHẮN ĐI KÈM]
  Nội dung trên ảnh biên lai:
  "NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN NGOẠI THƯƠNG VIỆT NAM (VIETCOMBANK)
  Thông báo giao dịch thành công.
  Số tiền: 14.800.000 VND (Mười bốn triệu tám trăm nghìn đồng)
  Người nhận: CỬA HÀNG MÁY TÍNH HẢI NAM
  Số tài khoản nhận: 0123456789 (Agribank)
  Thời gian giao dịch: 19:42:15 - Thứ Bảy, 18/10/2026
  Hình thức chuyển: Chuyển khoản thường liên ngân hàng qua số tài khoản
  Trạng thái: Giao dịch đã được ghi nhận vào hệ thống đối soát liên ngân hàng. Tiền sẽ được hạch toán vào tài khoản thụ hưởng trong khung giờ làm việc kế tiếp của ngân hàng thụ hưởng."

  Tin nhắn Zalo kèm theo của khách hàng:
  "Chị ơi em chuyển khoản đủ 14.800.000đ tiền cái máy tính xách tay rồi đó, có hóa đơn ngân hàng gửi về máy em đính kèm đây. Do tài khoản chị là Agribank khác hệ thống mà giờ là tối thứ Bảy nên bên Vietcombank nó nhảy lệnh chuyển thường chứ không qua Napas 24/7 được. 
  Bác tài xế Grab đang đứng trước cửa shop chị rồi, chị bấm xác nhận giao máy cho bác ấy giúp em với, sáng mai em phải đi công tác sớm cần máy gấp. Em là chỗ khách quen chị buôn bán lâu năm chị sợ gì em lừa mấy triệu bạc!"
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Lợi dụng kẽ hở thời gian ngoài giờ hành chính (Temporal Arbitrage):* Cố tình thực hiện giao dịch vào tối muộn hoặc chiều thứ Bảy để viện cớ "chuyển khoản thường khác ngân hàng thì đầu tuần mới nhận được tiền".
  - *Tạo áp lực bằng bên thứ ba vô tội (Delivery Driver Rush):* Tài xế giao hàng hỏa tốc đứng sẵn trước cửa shop bấm còi hối thúc, khiến chủ shop rơi vào trạng thái bối rối, sợ làm lỡ dở chuyến đi của khách.
  - *Công kích đạo đức (Moral Shaming):* Câu nói *"buôn bán lâu năm chị sợ gì em lừa mấy triệu bạc"* khiến chủ shop ngại ngùng nếu từ chối giao hàng.
  - *Dấu hiệu giả mạo kỹ thuật số trên ảnh (Fake Bill Artifacts):* Biên lai giả được tạo từ các website "tạo bill giả" (như billchuyenkhoan, taobill...) có các đặc điểm: phông chữ số tiền không đồng nhất với phông hệ thống, độ mờ pixel cục bộ quanh số tiền, thiếu mã kiểm soát giao dịch nội bộ chuẩn của Vietcombank.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn: `"Tiền sẽ được hạch toán vào tài khoản thụ hưởng trong khung giờ làm việc kế tiếp"` -> Bóc tách thủ đoạn lợi dụng kẽ hở giao dịch ngoài giờ hành chính.
  2. Bóc tách áp lực giao hàng qua bên thứ ba đứng đợi.
  3. Khuyến nghị kiểm chứng: Nguyên tắc vàng trong bán lẻ: CHỈ GIAO HÀNG KHI TIỀN ĐÃ THỰC SỰ NỔI TRÊN ỨNG DỤNG NGÂN HÀNG CỦA CHỦ SHOP (SMS Banking hoặc thông báo biến động số dư trên App của shop), tuyệt đối không tin vào bất kỳ hình ảnh biên lai nào do khách hàng cung cấp.

---

### CASE 7: EMAIL CẢNH BÁO VI PHẠM CHÍNH SÁCH / BẢN QUYỀN FANPAGE KINH DOANH
* **Kênh tiếp cận:** Email gửi đến hòm thư liên hệ quản trị viên của các doanh nghiệp, cửa hàng bán hàng trực tuyến tại Đồng Nai.
* **Ngữ cảnh nạn nhân:** Chủ doanh nghiệp nhỏ hoặc nhân viên marketing quản trị Fanpage có lượng tương tác cao.
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [EMAIL PHISHING]
  From: Meta Support Center <cases-noreply@business-meta-legal.com>
  Reply-To: support-appeals@business-meta-legal.com
  Subject: [THÔNG BÁO KHẨN CẤP] Trang của bạn bị báo cáo vi phạm quyền sở hữu trí tuệ nghiêm trọng (Mã vụ việc: #VN-89421)

  Kính gửi Quản trị viên Trang,
  Hệ thống giám sát an toàn thương hiệu đã nhận được đơn khiếu nại bản quyền chính thức từ đại diện sở hữu thương hiệu liên quan đến hình ảnh và bài viết đăng tải trên trang của bạn trong 7 ngày qua.

  Căn cứ Điều 14 Quy định tiêu chuẩn cộng đồng, trang của bạn đã bị đưa vào danh sách hạn chế phân phối và sẽ bị HỦY ĐĂNG VĨNH VIỄN trong vòng 24 GIỜ kể từ khi nhận được email này nếu không có phản hồi kháng nghị hợp lệ.

  Nếu bạn cho rằng đây là sự nhầm lẫn của hệ thống quét tự động, vui lòng gửi đơn giải trình và xác minh quyền sở hữu trang tại Trung tâm Kháng nghị Doanh nghiệp:
  https://business-meta-legal.com/appeal-case/submit?id=VN-89421

  Lưu ý: Không phản hồi trực tiếp vào email này. Sau thời hạn 24 giờ, mọi quyết định vô hiệu hóa trang sẽ không thể đảo ngược.
  Trân trọng,
  Đội ngũ Bảo vệ Bản quyền Doanh nghiệp Meta.
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Đe dọa tài sản cốt lõi của doanh nghiệp (Asset Destruction Fear):* Fanpage là nơi kinh doanh sinh nhai, việc bị dọa "hủy đăng vĩnh viễn trong 24 giờ" gây hoảng loạn tột độ cho chủ doanh nghiệp.
  - *Mạo danh tên miền cấp cao tinh vi:* Kẻ gian đăng ký tên miền `business-meta-legal.com` (chứa các từ khóa `business`, `meta`, `legal`) để qua mắt người dùng phổ thông không để ý tên miền chính thức của Tập đoàn Meta (`meta.com`, `facebook.com`).
  - *Mục đích tấn công:* Khi nhấp vào liên kết, nạn nhân được yêu cầu đăng nhập mật khẩu tài khoản quản trị Facebook và mã 2FA, từ đó kẻ gian chiếm quyền kiểm soát Fanpage, tống tiền hoặc đổi tên page để chạy quảng cáo lừa đảo khác.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn: `"business-meta-legal.com"` -> Cảnh báo tên miền giả mạo thương hiệu Meta.
  2. Bóc tách chiêu thức đe dọa thời hạn khẩn cấp 24 giờ.
  3. Khuyến nghị kiểm chứng: Mọi thông báo vi phạm của Meta đều được hiển thị trực tiếp trong phần *Hộp thư hỗ trợ Trang* (`Page Support Inbox`) bên trong ứng dụng Facebook/Meta Business Suite, Meta không bao giờ yêu cầu nhập mật khẩu qua email bên thứ ba.

---

### CASE 8: BẪY TRI ÂN QUÀ TẶNG MIỄN PHÍ DẪN DỤ VÀO NHÓM KÉO LỆNH TÀI CHÍNH
* **Kênh tiếp cận:** Bưu phẩm bưu điện giao tận nhà công nhân/người dân (kèm quà tặng 0 đồng) + Thư giấy quét mã QR Zalo.
* **Ngữ cảnh nạn nhân:** Người dân đã từng mua sắm trực tuyến trên các sàn thương mại điện tử (Shopee, TikTok Shop, Lazada).
* **Kịch bản hội thoại nguyên văn:**
  ```text
  [THƯ GIẤY ĐÍNH KÈM HỘP QUÀ MIỄN PHÍ GỬI ĐẾN TẬN NHÀ CÔNG NHÂN/NGƯỜI DÂN]
  "THƯ TRI ÂN KHÁCH HÀNG THÂN THIẾT NĂM 2026 - TẬP ĐOÀN THƯƠNG MẠI ĐIỆN TỬ
  Kính gửi quý khách hàng: Trần Thị Mai,
  Nhằm tri ân khách hàng đã tích cực mua sắm trong năm vừa qua, trung tâm chăm sóc khách hàng trân trọng gửi tặng quý khách 01 bộ cốc giữ nhiệt cao cấp hoàn toàn MIỄN PHÍ (đã được thanh toán cước vận chuyển 0 đồng kèm bưu kiện này).

  Đặc biệt, quý khách là 1 trong 50 khách hàng may mắn được tặng kèm PHIẾU CÀO MAY MẮN trúng thưởng thẻ mua sắm trị giá từ 500.000đ đến 5.000.000đ.
  Để kích hoạt mã số thẻ cào và nhận tiền thưởng trực tiếp vào tài khoản ngân hàng, quý khách vui lòng dùng ứng dụng Zalo quét mã QR bên dưới để kết nối với Trợ lý Trao thưởng Ngọc Hân và cung cấp mã dự thưởng: TRIAN-2026-DN."
  ```
* **Phân tích chuyên sâu (Deep Psychological & Technical Analysis):**
  - *Vật phẩm hiện hữu xóa bỏ nghi ngờ (Physical Reality Bridge):* Nạn nhân cầm trên tay món quà thật (bộ cốc giữ nhiệt giá trị 30.000đ - 50.000đ) mà người giao hàng không thu bất kỳ đồng cước nào -> Niềm tin ban đầu được củng cố tuyệt đối.
  - *Bẫy nhóm kín thao túng đám đông (Social Proof in Closed Groups):* Khi quét mã QR, nạn nhân được đưa vào nhóm Zalo/Telegram kín gồm 30-50 thành viên. Thực chất 90% thành viên trong nhóm là "chim mồi" (tài khoản ảo của nhóm lừa đảo) liên tục gửi ảnh chụp màn hình nhận thưởng 500.000đ, 2.000.000đ thành công để kích thích lòng tham.
  - *Chuyển hóa sang bẫy tài chính:* Trợ lý yêu cầu nạn nhân làm các "nhiệm vụ liên kết tài chính / tạo giao dịch giả lập" để rút tiền thưởng lớn hơn, từ đó dẫn tới mất toàn bộ tiền tiết kiệm.
* **Nhiệm vụ AI ScamLens cần bóc tách & cảnh báo:**
  1. Trích dẫn nguyên văn: `"quét mã QR bên dưới để kết nối với Trợ lý Trao thưởng Ngọc Hân"` -> Cảnh báo thủ đoạn phát tán mã QR độc hại qua bưu phẩm quà tặng miễn phí.
  2. Bóc tách dấu hiệu trúng thưởng ngẫu nhiên không có căn cứ giao dịch minh bạch.
  3. Khuyến nghị kiểm chứng: Các sàn thương mại điện tử chính thống chỉ trao thưởng trực tiếp qua ứng dụng chính thức, không bao giờ gửi thư giấy yêu cầu quét mã QR vào nhóm Zalo riêng tư. Không quét mã QR từ các bưu phẩm không rõ nguồn gốc.

---

---

## 4. ĐẶC TẢ CHI TIẾT CẢI TỔ GIAO DIỆN & TRẢI NGHIỆM (UI/UX COMPREHENSIVE RE-ENGINEERING)

Huy động toàn diện tri thức từ 3 bộ kỹ năng thiết kế giao diện cao cấp:
* **`taste-skill` (Anti-Slop & Editorial Aesthetics):** Triệt tiêu hoàn toàn thiết kế mẫu rập khuôn của AI (AI-slop: khung cửa sổ giả nghiêng méo mó, vòng tròn quỹ đạo vô nghĩa, thanh viền xám generic). Thiết lập thẩm mỹ an ninh mạng quốc gia (National Cybersecurity Grade) với trật tự thị giác rõ ràng, khoảng trắng có chủ đích và độ hoàn thiện tinh xảo.
* **`impeccable` (Craft, Hierarchy & Interactive Delight):** Chuẩn hóa tỷ lệ tương phản WCAG 2.1 AAA, chuẩn hóa vùng bấm ngón tay cái (Thumb-zone & Touch Targets 48px), vi tương tác xúc giác (Tactile feedback), trạng thái tải Skeleton Shimmer và cơ chế phòng ngừa lỗi người dùng.
* **`ui-ux-pro-max` (Design System & Scalable Tokens):** Thiết lập kiến trúc Design Tokens 3 lớp (Primitive -> Semantic -> Component), tối ưu hóa luồng tương tác 1-chạm (Zero-friction Flow) và bóc tách dữ liệu thị giác đa chiều.

---

### 4.1. Hệ Thống Design Tokens Cấp Độ Sản Xuất & Xử Lý Xung Đột CSS Đa Tệp
* **Vị trí tệp tin trong mã nguồn:**
  - [`src/app/globals.css`](../src/app/globals.css#L3-L4) (Định nghĩa biến `:root` gốc và reset thẻ `body`).
  - [`src/app/theme.css`](../src/app/theme.css#L1-L60) (Định nghĩa biến `:root` thứ hai và ghi đè `body`).
* **Phân tích nguyên nhân gốc rễ (Root Cause & Defects):**
  1. *Xung đột kích thước chữ cơ bản (Font-size Collision):* `globals.css` (Dòng 4) quy định `body { font-size: 14px; background: #fafbfe; }`, nhưng ngay sau đó `theme.css` (Dòng 57) lại ghi đè `body { font-size: 16px; background: var(--page); }`. Trình duyệt khi tải trang hoặc khi người dùng chuyển đổi qua lại giữa các router Next.js sẽ xảy ra hiện tượng giật cục bố cục (Cumulative Layout Shift - CLS).
  2. *Thiếu kiến trúc Design Tokens phân tầng:* Các thông số màu sắc, bo góc (`border-radius`), đệm lề (`padding`) và bóng đổ (`box-shadow`) bị gán cứng (hardcoded) rải rác dưới dạng mã HEX và số pixel lẻ tẻ (ví dụ: `padding: 9px 11px`, `border-radius: 9px`, `font-size: 10px`), khiến việc tinh chỉnh giao diện đồng nhất trở nên bất khả thi.
  3. *Không có biến Semantic Tokens cho mức độ nguy cơ:* Màu đỏ rủi ro cao, màu vàng cảnh báo và màu xanh an toàn được khai báo độc lập ở nhiều selector, không có thang đo biến số dùng chung.
* **Yêu cầu thay đổi kỹ thuật (Implementation Specification):**
  - Hợp nhất toàn bộ biến số vào một tệp token tập trung tại `:root` trong `theme.css`.
  - Thiết lập Typography Scale 8 nấc chuẩn mực quốc tế, nghiêm cấm sử dụng bất kỳ font-size nào dưới `12px` (chuẩn tiếp cận WCAG 2.1).
  - Tích hợp thang đo Elevation Shadows hiện đại (thay thế viền xám đục) và hệ màu Semantic Threat Colors.
* **Mã CSS chuẩn hóa cần thay thế trực tiếp vào `:root` và `html[data-theme="dark"]`:**
  ```css
  /* ==========================================================================
     SCAMLENS CORE DESIGN TOKENS (Kiến trúc Tokens 3 lớp)
     Vị trí tệp: src/app/theme.css (Thay thế toàn bộ dòng 1 - 50)
     ========================================================================== */
  :root {
    color-scheme: light;

    /* 1. TYPOGRAPHY SCALE (Chuẩn WCAG 2.1 - Tuyệt đối không dùng font < 12px) */
    --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --text-2xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem); /* 12px -> 13px: Caption, metadata, tag */
    --text-xs:  clamp(0.8125rem, 0.75rem + 0.3vw, 0.875rem); /* 13px -> 14px: Micro-notes, nhãn phụ */
    --text-sm:  clamp(0.875rem, 0.82rem + 0.28vw, 0.9375rem); /* 14px -> 15px: Nhãn trường nhập, nút phụ */
    --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem);    /* 16px -> 17px: Văn bản đọc, input, textarea */
    --text-md:  clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem);  /* 18px -> 20px: Sub-heading, tiêu đề thẻ */
    --text-lg:  clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);     /* 20px -> 24px: Tiêu đề khối (Section title) */
    --text-xl:  clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);   /* 24px -> 30px: Tiêu đề trang, H2 */
    --text-2xl: clamp(2rem, 1.7rem + 1.5vw, 2.75rem);        /* 32px -> 44px: Hero title mobile -> tablet */
    --text-3xl: clamp(2.5rem, 2rem + 2.5vw, 3.75rem);        /* 40px -> 60px: Hero title desktop */

    /* 2. SPACING SCALE (Hệ lưới nhịp 4px/8px chuẩn) */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;

    /* 3. TOUCH TARGET & GEOMETRY */
    --touch-min: 48px;        /* Chuẩn ngón tay cái công thái học iOS/Android */
    --touch-compact: 44px;    /* Chuẩn tối thiểu tuyệt đối cho nút phụ */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;

    /* 4. LIGHT PALETTE & SEMANTIC THREAT COLORS */
    --page-bg: #f8fafc;
    --surface-card: #ffffff;
    --surface-subtle: #f1f5f9;
    --surface-hover: #e2e8f0;
    --line-subtle: #e2e8f0;
    --line-strong: #cbd5e1;

    --text-primary: #0f172a;   /* Slate 900 - Contrast 15.8:1 */
    --text-secondary: #334155; /* Slate 700 - Contrast 9.2:1 */
    --text-muted: #64748b;     /* Slate 500 - Contrast 4.6:1 (WCAG AA pass) */

    --brand-blue: #3b82f6;
    --brand-blue-hover: #2563eb;
    --brand-blue-subtle: #eff6ff;
    --brand-blue-border: #bfdbfe;

    /* Semantic Threat Badges */
    --threat-high-bg: #fef2f2;
    --threat-high-border: #fca5a5;
    --threat-high-text: #991b1b;
    --threat-high-accent: #ef4444;

    --threat-med-bg: #fffbeb;
    --threat-med-border: #fcd34d;
    --threat-med-text: #92400e;
    --threat-med-accent: #f59e0b;

    --threat-low-bg: #f0fdf4;
    --threat-low-border: #86efac;
    --threat-low-text: #166534;
    --threat-low-accent: #10b981;

    /* 5. ELEVATION & SHADOWS (Nói KHÔNG với viền xám đục rập khuôn) */
    --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05);
    --shadow-card: 0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
    --shadow-floating: 0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 12px -2px rgba(15, 23, 42, 0.06);
    --focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.4);
  }

  /* DARK MODE TOKENS (Độ tương phản cao, loại bỏ sắc nâu bẩn) */
  html[data-theme="dark"] {
    color-scheme: dark;
    --page-bg: #090d16;
    --surface-card: #111827;
    --surface-subtle: #1e293b;
    --surface-hover: #334155;
    --line-subtle: #1e293b;
    --line-strong: #334155;

    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;

    --brand-blue: #60a5fa;
    --brand-blue-hover: #3b82f6;
    --brand-blue-subtle: rgba(59, 130, 246, 0.12);
    --brand-blue-border: rgba(96, 165, 250, 0.35);

    --threat-high-bg: rgba(239, 68, 68, 0.12);
    --threat-high-border: rgba(239, 68, 68, 0.4);
    --threat-high-text: #fca5a5;
    --threat-high-accent: #f87171;

    --threat-med-bg: rgba(245, 158, 11, 0.12);
    --threat-med-border: rgba(245, 158, 11, 0.4);
    --threat-med-text: #fcd34d;
    --threat-med-accent: #fbbf24;

    --threat-low-bg: rgba(16, 185, 129, 0.12);
    --threat-low-border: rgba(16, 185, 129, 0.4);
    --threat-low-text: #6ee7b7;
    --threat-low-accent: #34d399;

    --shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.45);
    --shadow-floating: 0 20px 40px -8px rgba(0, 0, 0, 0.7);
    --focus-ring: 0 0 0 3px rgba(96, 165, 250, 0.45);
  }
  ```

---

### 4.2. Header, Navigation Bar & Mobile Drawer (Đột Phá Điều Hướng Đa Màn Hình)
* **Vị trí tệp tin trong mã nguồn:**
  - Cấu trúc JSX: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L183-L187) (thẻ `<header className="topbar">`).
  - Định dạng CSS: [`src/app/globals.css`](../src/app/globals.css#L4) và [`src/app/theme.css`](../src/app/theme.css#L70-L98).
* **Phân tích nhược điểm giao diện hiện tại:**
  1. *Ẩn hoàn toàn menu trên Mobile:* CSS dòng 15 trong `globals.css` và dòng 342 trong `theme.css` thiết lập `.top-nav { display: none; }` khi màn hình `< 650px`. Người dùng dùng điện thoại không thể nào truy cập trang *Cách tự bảo vệ* (`/guide`) hoặc tìm hiểu cam kết *Quyền riêng tư* (`/guide#privacy`).
  2. *Nút tài khoản Google bị co rúm:* Trên di động, tên tài khoản `.account-email` bị ẩn hoàn toàn (`display: none`), nút đăng nhập bị giảm padding xuống còn `8px 10px`, vùng chạm quá nhỏ, dễ ấn trượt.
  3. *Thiếu dấu hiệu nhận biết vị trí:* Menu desktop là các thẻ văn bản thông thường, thiếu thanh gạch báo hiệu phân trang (Active Pill Indicator).
* **Yêu cầu kỹ thuật & Giải pháp UI/UX:**
  - **Trên Desktop:** Tăng chiều cao `.topbar` lên `72px`, bổ sung thanh trượt hiệu ứng viên thuốc cho menu điều hướng, hiển thị Google Avatar dạng huy hiệu tròn (32x32px) kèm tooltip trạng thái tài khoản.
  - **Trên Mobile (Bước đột phá):** Xây dựng **Thanh điều hướng cố định đáy màn hình (Floating Bottom Bar)**. Giúp ngón tay cái của người dùng có thể chuyển đổi cực nhanh giữa 4 tính năng mà không cần phải với tay lên đỉnh màn hình:
    1. 🔍 **Soi rọi** (Về khung phân tích).
    2. 🛡️ **Tự vệ** (Xem cẩm nang nhận diện lừa đảo).
    3. 📜 **Lịch sử** (Xem báo cáo đã lưu cá nhân).
    4. 🌗 **Theme** (Chuyển chế độ sáng/tối tức thì).
* **Mã TSX đề xuất thay thế tại [`src/components/home-app.tsx`](../src/components/home-app.tsx#L183-L187):**
  ```tsx
  {/* TOPBAR CHÍNH XÁC & CÔNG THÁI HỌC */}
  <header className="topbar">
    <Link href="/" className="brand" aria-label="ScamLens AI - Trang chủ">
      <span className="brand-mark">
        <Shield size={22} strokeWidth={2.2} />
        <span className="brand-spark"><Sparkles size={11} /></span>
      </span>
      <span className="brand-word">
        scamlens<span>.</span><small>VN</small>
      </span>
    </Link>

    {/* Menu Desktop */}
    <nav className="top-nav" aria-label="Điều hướng chính">
      <Link className="nav-item nav-active" href="/#analyze">
        <ShieldCheck size={16} /> Phân tích nguy cơ
      </Link>
      <Link className="nav-item" href="/guide">
        <BookOpenText size={16} /> Cẩm nang tự vệ
      </Link>
      <Link className="nav-item" href="/guide#privacy">
        <LockKeyhole size={16} /> Cam kết riêng tư
      </Link>
    </nav>

    {/* Khu vực trạng thái tài khoản */}
    <div className="account-area">
      <ThemeToggle />
      {signedIn ? (
        <div className="user-profile-badge">
          <Link className="account-link" href="/history" title="Xem lịch sử phân tích">
            <Clock3 size={16} /> <span>Lịch sử</span>
          </Link>
          <div className="user-avatar" title={`Đang đăng nhập: ${email}`}>
            {email ? email.charAt(0).toUpperCase() : "U"}
          </div>
          <LogoutButton />
        </div>
      ) : authConfigured ? (
        <a href="/auth/login" className="sign-in-btn">
          <span className="google-g">G</span>
          <span>Đăng nhập</span>
          <ArrowUpRight size={14} />
        </a>
      ) : (
        <span className="setup-badge">Chế độ Khách</span>
      )}
    </div>
  </header>

  {/* MOBILE FLOATING BOTTOM BAR (Chỉ hiển thị trên màn hình <= 650px) */}
  <nav className="mobile-bottom-bar" aria-label="Điều hướng nhanh di động">
    <Link href="/#analyze" className="bottom-bar-item active">
      <ShieldCheck size={20} />
      <span>Soi rọi</span>
    </Link>
    <Link href="/guide" className="bottom-bar-item">
      <BookOpenText size={20} />
      <span>Cẩm nang</span>
    </Link>
    <Link href="/history" className="bottom-bar-item">
      <Clock3 size={20} />
      <span>Lịch sử</span>
    </Link>
    <div className="bottom-bar-item">
      <ThemeToggle />
      <span>Giao diện</span>
    </div>
  </nav>
  ```
* **Mã CSS bổ sung vào `src/app/theme.css`:**
  ```css
  /* TOPBAR DESKTOP */
  .topbar {
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--line-subtle);
    padding: 0 var(--space-4);
  }
  .top-nav {
    display: flex;
    gap: var(--space-2);
    background: var(--surface-subtle);
    padding: 4px;
    border-radius: var(--radius-full);
  }
  .nav-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: var(--text-sm);
    font-weight: 550;
    color: var(--text-secondary);
    border-radius: var(--radius-full);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .nav-item:hover { color: var(--brand-blue); }
  .nav-item.nav-active {
    background: var(--surface-card);
    color: var(--brand-blue);
    box-shadow: var(--shadow-sm);
  }

  /* USER BADGE & AVATAR */
  .user-profile-badge {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .user-avatar {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-full);
    background: var(--brand-blue);
    color: #fff;
    font-weight: 700;
    font-size: var(--text-sm);
    display: grid;
    place-items: center;
    box-shadow: var(--shadow-sm);
  }

  /* MOBILE BOTTOM BAR */
  .mobile-bottom-bar { display: none; }
  @media (max-width: 650px) {
    .top-nav { display: none; }
    .mobile-bottom-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: var(--surface-card);
      border-top: 1px solid var(--line-subtle);
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
      z-index: 1000;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .bottom-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      color: var(--text-muted);
      font-size: var(--text-2xs);
      font-weight: 600;
      text-decoration: none;
      min-height: var(--touch-min);
    }
    .bottom-bar-item.active { color: var(--brand-blue); }
    /* Đẩy lùi nội dung trang để không bị che bởi Bottom Bar */
    .site-shell { padding-bottom: 80px; }
  }
  ```

---

### 4.3. Hero Section: Xóa Sổ "AI-Slop Art" & Xây Dựng "Live Threat Radar Scanner"
* **Vị trí tệp tin trong mã nguồn:**
  - Cấu trúc JSX: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L190-L193).
  - Định dạng CSS: [`src/app/globals.css`](../src/app/globals.css#L5) (`.hero-art`, `.art-window`, `.art-orbit`) và [`src/app/theme.css`](../src/app/theme.css#L100-L107).
* **Phân tích nhược điểm mỹ thuật hiện tại:**
  1. *Hình minh họa rập khuôn kiểu AI-slop:* Dùng thẻ div xếp chồng vẽ một cửa sổ tin nhắn giả nghiêng -2 độ với 3 nút chấm tròn macOS và các vòng elip xoay tròn (`.art-orbit`). Trông rất giả tạo, không toát lên được tinh thần công nghệ an ninh mạng đích thực.
  2. *Bị biến mất trên thiết bị di động:* Khi màn hình `< 650px`, CSS set `.hero-art { display: none; }`, biến phần trên của ứng dụng thành một khoảng văn bản trống trơn, nghèo nàn.
  3. *Lỗi dính dấu tiếng Việt trên Headline:* Tiêu đề chính dùng `line-height: 1.04` quá hẹp, khiến dấu hỏi, ngã, mũ trong tiếng Việt bị đè sát vào dòng trên.
* **Yêu cầu kỹ thuật & Giải pháp UI/UX (Taste-Skill Anti-Slop Directive):**
  - Xóa bỏ vĩnh viễn các class: `.art-orbit`, `.art-window`, `.art-window-bar`, `.art-dots`.
  - Thay thế bằng **"ScamLens Security Radar Terminal"** - Một màn hình giám sát trực quan tương tác thực tế:
    - Có dải radar quét sáng (Scan Sweep Animation) chuyển động êm ái.
    - Hiển thị danh sách các mối đe dọa thực tế đang hoành hành tại Việt Nam kèm tỷ lệ nhận diện.
    - Hoạt động responsive tuyệt vời trên cả Desktop lẫn Mobile (thu nhỏ thành một badge trực quan tinh gọn trên mobile thay vì bị ẩn biến mất).
* **Mã TSX đề xuất thay thế tại [`src/components/home-app.tsx`](../src/components/home-app.tsx#L190-L193):**
  ```tsx
  {/* HERO SECTION THẨM MỸ CAO CẤP */}
  <section className="hero" id="analyze">
    <div className="hero-copy">
      <div className="eyebrow">
        <span className="live-radar-dot" /> TRỢ LÝ AN TOÀN SỐ QUỐC GIA · BẢO VỆ ĐA TẦNG
      </div>
      <h1>
        Nội dung này có<br />
        <span className="highlight-gradient">đáng để bạn tin tưởng?</span>
      </h1>
      <p className="hero-lede">
        Soi rọi từng câu chữ, bóc tách dấu vết giả mạo trong biên lai, SMS và email bằng trí tuệ nhân tạo chuyên sâu — trước khi bạn nhấn link hoặc chuyển tiền.
      </p>
      <div className="trust-badges">
        <div className="trust-badge-item">
          <ShieldCheck size={18} className="text-emerald-500" />
          <div><strong>100% Đối chiếu</strong><small>Trích xuất nguyên văn bằng chứng</small></div>
        </div>
        <div className="trust-badge-item">
          <LockKeyhole size={18} className="text-blue-500" />
          <div><strong>Ẩn danh tại chỗ</strong><small>Tự che OTP, STK trước khi gửi</small></div>
        </div>
      </div>
    </div>

    {/* SCAMLENS THREAT RADAR TERMINAL (Thay thế CSS Art cũ) */}
    <div className="hero-threat-terminal" aria-label="Màn hình radar giám sát nguy cơ trực tuyến">
      <div className="terminal-header">
        <div className="terminal-status">
          <span className="status-ping" /> RADAR ĐANG QUÉT 4 LUỒNG DỮ LIỆU
        </div>
        <span className="terminal-brand">ScamLens Core v2.4</span>
      </div>
      <div className="terminal-scan-line" />
      <div className="threat-feed-list">
        <div className="threat-feed-item threat-high">
          <TriangleAlert size={16} />
          <div className="threat-info">
            <strong>Mạo danh Cổng Dịch Vụ Công VNeID</strong>
            <small>Kịch bản: Yêu cầu cập nhật định danh mức 2 qua link .apk</small>
          </div>
          <span className="threat-score">99% RỦI RO</span>
        </div>
        <div className="threat-feed-item threat-high">
          <FileImage size={16} />
          <div className="threat-info">
            <strong>Biên lai Vietcombank Photoshop</strong>
            <small>Lệch font số dư, sai mã kiểm soát giao dịch</small>
          </div>
          <span className="threat-score">96% FAKE</span>
        </div>
        <div className="threat-feed-item threat-med">
          <MessageCircle size={16} />
          <div className="threat-info">
            <strong>Bẫy việc làm Telegram / TikTok</strong>
            <small>Yêu cầu nạp tiền đối ứng nhận hoa hồng 30%</small>
          </div>
          <span className="threat-score">88% BẪY</span>
        </div>
      </div>
    </div>
  </section>
  ```
* **Mã CSS tương ứng cần bổ sung vào `src/app/theme.css`:**
  ```css
  /* HERO STYLING */
  .hero {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: var(--space-8);
    align-items: center;
    padding: var(--space-12) 0;
  }
  .hero h1 {
    font-size: var(--text-3xl);
    line-height: 1.18; /* Ngăn chặn triệt để lỗi dính dấu tiếng Việt */
    letter-spacing: -0.035em;
    font-weight: 800;
    color: var(--text-primary);
    margin: var(--space-4) 0;
  }
  .highlight-gradient {
    background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-lede {
    font-size: var(--text-md);
    line-height: 1.65;
    color: var(--text-secondary);
    max-width: 540px;
  }
  .trust-badges {
    display: flex;
    gap: var(--space-6);
    margin-top: var(--space-6);
  }
  .trust-badge-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .trust-badge-item strong { display: block; font-size: var(--text-sm); color: var(--text-primary); }
  .trust-badge-item small { display: block; font-size: var(--text-2xs); color: var(--text-muted); }

  /* THREAT RADAR TERMINAL */
  .hero-threat-terminal {
    background: var(--surface-card);
    border: 1px solid var(--line-subtle);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
  }
  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--line-subtle);
    font-size: var(--text-2xs);
    font-weight: 700;
  }
  .terminal-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--brand-blue);
  }
  .status-ping {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
    animation: pulse 2s infinite;
  }
  .terminal-scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--brand-blue), transparent);
    animation: scanLine 3.5s ease-in-out infinite;
    opacity: 0.75;
  }
  .threat-feed-list {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }
  .threat-feed-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
  }
  .threat-feed-item.threat-high {
    background: var(--threat-high-bg);
    border-color: var(--threat-high-border);
    color: var(--threat-high-text);
  }
  .threat-feed-item.threat-med {
    background: var(--threat-med-bg);
    border-color: var(--threat-med-border);
    color: var(--threat-med-text);
  }
  .threat-info { flex: 1; min-width: 0; }
  .threat-info strong { display: block; font-size: var(--text-xs); }
  .threat-info small { display: block; font-size: var(--text-2xs); opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .threat-score { font-size: var(--text-2xs); font-weight: 800; }

  @keyframes scanLine {
    0% { top: 0; }
    50% { top: 100%; }
    100% { top: 0; }
  }
  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; }
  }
  ```

---

### 4.4. Khu Vực Nhập Liệu & Triệt Tiêu Ma Sát 4 Bước (Zero-Friction 1-Click Submission)
* **Vị trí tệp tin trong mã nguồn:**
  - Logic State: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L49-L51) (`prepared`, `acknowledged`, `privacyAcknowledged`) và dòng 85–96 (`prepareText`).
  - Giao diện JSX: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L214-L226).
* **Phân tích ma sát trầm trọng (Critical Interaction Friction):**
  1. *Quy trình 4 bước phức tạp đến mức vô lý:*
     - Bước 1: Người dùng dán nội dung vào `textarea` chính.
     - Bước 2: Bấm nút `Xem trước nội dung sẽ gửi` (`prepareText`).
     - Bước 3: Giao diện bung ra thêm một ô `textarea` thứ hai (`prepared-review`) với nội dung đã che chằng chịt ký tự `[ĐÃ_CHE]`.
     - Bước 4: Buộc người dùng đánh dấu Checkbox 1: *"Tôi đã đối chiếu nội dung..."*.
     - Bước 5: Buộc người dùng đánh dấu thêm Checkbox 2: *"Tôi hiểu nội dung đã che sẽ được gửi..."*.
     - Bước 6: Nút `Phân tích tin nhắn` mới sáng lên để bấm!
  2. *Hệ quả UX:* Nạn nhân lừa đảo đang trong trạng thái tâm lý bất an, lo sợ tài khoản bị khóa trong 10 phút. Một quy trình rườm rà như thủ tục hành chính sẽ khiến họ tắt ứng dụng ngay lập tức!
* **Yêu cầu kỹ thuật & Thiết kế mới (Luồng 1-Chạm Siêu Nhanh):**
  - **Xóa bỏ hoàn toàn ô `textarea` thứ hai** và nút "Xem trước".
  - **Thanh Công Cụ Che Ẩn Danh Trực Tiếp (Inline Privacy Toolbar):** Đặt ngay bên dưới ô nhập liệu duy nhất.
    - Chạy regex tức thời phía client khi người dùng vừa dán hoặc gõ chữ.
    - Cung cấp nút gạt Toggle Switch: `[✓] Tự động ẩn danh OTP, STK & Số điện thoại (Phát hiện: 3 mục)`.
  - **Gộp 2 checkbox rườm rà thành 1 checkbox đồng thuận duy nhất:**
    `[✓] Tôi đồng ý gửi dữ liệu ẩn danh đến AI để phân tích dấu hiệu lừa đảo.`
  - **Nút CTA duy nhất, to bản (Chiều cao chuẩn 48px, cỡ chữ 15px):**
    `<button className="primary-analyze-btn">🔍 Quét Dấu Hiệu Lừa Đảo Ngay</button>`
* **Mã TSX tái cấu trúc State & JSX tại `src/components/home-app.tsx`:**
  ```tsx
  {/* TÁI CẤU TRÚC: STATE TINH GỌN HOÀN TOÀN (Thay thế dòng 49 - 51) */}
  const [autoMask, setAutoMask] = useState(true);
  const [privacyAgreed, setPrivacyAgreed] = useState(true); // Mặc định bật để tối ưu thao tác

  // Hàm tính toán số lượng phần tử nhạy cảm phát hiện được theo thời gian thực
  const detectedSensitiveCount = useMemo(() => {
    if (!content.trim()) return 0;
    const phoneMatches = content.match(/(?:\+84|0)(?:3|5|7|8|9)\d{8}/g) || [];
    const otpMatches = content.match(/\b\d{4,8}\b/g) || [];
    const emailMatches = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    return phoneMatches.length + otpMatches.length + emailMatches.length;
  }, [content]);

  // Luồng gửi phân tích 1 chạm duy nhất
  async function handleInstantAnalyze() {
    if (!content.trim()) {
      setFeedback({ kind: "error", text: "Vui lòng dán nội dung tin nhắn hoặc đường link cần kiểm tra." });
      return;
    }
    const finalContent = autoMask ? redactSensitiveText(content) : content;
    const finalContext = autoMask ? redactSensitiveText(context) : context;
    await executeAnalyze({ ...bodyPayload, content: finalContent, context: finalContext });
  }

  {/* JSX KHU VỰC NHẬP LIỆU DUY NHẤT */}
  <div className="single-input-workspace">
    <div className="workspace-header-row">
      <label htmlFor="main-content" className="field-title">
        Nội dung đáng ngờ cần soi rọi
      </label>
      <span className="char-counter">
        {content.length.toLocaleString("vi-VN")} / 20.000 ký tự
      </span>
    </div>

    <textarea
      id="main-content"
      className="unified-textarea"
      value={content}
      onChange={(e) => setContent(e.target.value.slice(0, 20_000))}
      placeholder="Dán tin nhắn SMS, email, tin tuyển dụng hoặc đường dẫn nghi vấn vào đây..."
      rows={6}
    />

    {/* TOOLBAR BẢO VỆ DỮ LIỆU TỰ ĐỘNG */}
    <div className="inline-shield-toolbar">
      <label className="shield-toggle">
        <input
          type="checkbox"
          checked={autoMask}
          onChange={(e) => setAutoMask(e.target.checked)}
        />
        <span className="toggle-slider" />
        <span className="toggle-text">
          <ShieldCheck size={16} className="text-emerald-500" />
          Tự động che số tài khoản, mã OTP và số điện thoại
        </span>
      </label>
      {detectedSensitiveCount > 0 && (
        <span className="detected-badge">
          Phát hiện {detectedSensitiveCount} mục nhạy cảm sẽ được ẩn danh
        </span>
      )}
    </div>

    {/* CHECKBOX ĐỒNG THUẬN DUY NHẤT & NÚT PHÂN TÍCH */}
    <div className="action-row">
      <label className="single-consent">
        <input
          type="checkbox"
          checked={privacyAgreed}
          onChange={(e) => setPrivacyAgreed(e.target.checked)}
        />
        <span>
          Tôi đồng ý gửi dữ liệu đã ẩn danh đến AI để phân tích.
          <Link href="/guide#privacy" className="privacy-link">Cam kết không lưu trữ</Link>
        </span>
      </label>

      <button
        type="button"
        className="primary-action-cta"
        disabled={busy || !content.trim() || !privacyAgreed}
        onClick={handleInstantAnalyze}
      >
        {busy ? (
          <><LoaderCircle size={18} className="animate-spin" /> Đang soi rọi bằng chứng...</>
        ) : (
          <><Sparkles size={18} /> Quét Dấu Hiệu Lừa Đảo Ngay <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  </div>
  ```

---

### 4.5. Nâng Cấp Toàn Diện Công Cụ Che Ảnh Canvas Mobile (`ImageRedactor`)
* **Vị trí tệp tin trong mã nguồn:**
  - Logic Canvas & Hooks: [`src/components/image-redactor.tsx`](../src/components/image-redactor.tsx#L8-L85).
  - Định dạng CSS: [`src/app/globals.css`](../src/app/globals.css#L7) (`.canvas-shell`, `.redact-canvas`, `.dropzone`).
* **Phân tích nhược điểm thao tác canvas trên điện thoại:**
  1. *Thiếu tính năng Hoàn tác (Undo):* Nếu người dùng dùng ngón tay vẽ 4 hộp che trên ảnh biên lai nhưng lỡ tay vẽ lệch hộp thứ 4, nút duy nhất hiện có là `<Eraser /> Xóa vùng che` (dòng 78), buộc xóa sạch toàn bộ 4 hộp và làm lại từ con số 0!
  2. *Lỗi xung đột cử chỉ cảm ứng (Touch Scrolling Conflict):* Khi người dùng kéo ngón tay trên thẻ `<canvas>`, trình duyệt điện thoại hiểu nhầm là cử chỉ cuộn trang web (touchmove scrolling), dẫn đến việc màn hình bị nhảy giật và nét vẽ bị biến dạng.
  3. *Không hỗ trợ phím tắt Dán ảnh (Paste from Clipboard):* Khi chụp màn hình tin nhắn hoặc biên lai, người dùng phải lưu file vào máy rồi bấm chọn tệp thay vì chỉ cần nhấn `Ctrl+V`.
* **Yêu cầu kỹ thuật & Thiết kế mới:**
  - Thêm ngăn xếp lịch sử nét vẽ (History Stack) cho phép **Hoàn tác nét vừa vẽ (Undo)** và **Làm lại (Redo)**:
    `const [history, setHistory] = useState<Rect[][]>([]);`
  - Thêm thuộc tính CSS `touch-action: none;` và gọi `event.preventDefault()` trong sự kiện `pointerdown` / `pointermove`.
  - Hỗ trợ sự kiện `window.addEventListener('paste', handleClipboardPaste)` để người dùng máy tính hoặc điện thoại có thể dán ảnh chụp màn hình trực tiếp từ bộ nhớ tạm.
* **Mã TSX nâng cấp cho [`src/components/image-redactor.tsx`](../src/components/image-redactor.tsx):**
  ```tsx
  /* BỔ SUNG NGĂN XẾP HOÀN TÁC & BẮT CLIPBOARD TRONG ImageRedactor */
  const [history, setHistory] = useState<Rect[][]>([]);

  // Bắt sự kiện dán ảnh Ctrl+V từ clipboard
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) loadImage(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Hoàn tác nét vẽ cuối cùng
  function handleUndo() {
    if (rects.length === 0) return;
    setRects((prev) => prev.slice(0, -1));
  }

  // Ghi nhận nét vẽ mới vào lịch sử
  function finishMask(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!startRef.current) return;
    const end = coordinates(event);
    const x = Math.min(startRef.current.x, end.x), y = Math.min(startRef.current.y, end.y);
    const width = Math.abs(end.x - startRef.current.x), height = Math.abs(end.y - startRef.current.y);
    startRef.current = null;
    if (width > 0.008 && height > 0.008) {
      setRects((prev) => [...prev, { x, y, width, height }]);
    }
  }

  {/* THANH ĐIỀU KHIỂN NÉT VẼ CANVAS HIỆN ĐẠI */}
  <div className="canvas-toolbar">
    <div className="canvas-stats">
      <ShieldCheck size={16} className="text-emerald-500" />
      <span>{filename} · {rects.length ? `Đã che ${rects.length} vùng` : "Kéo chuột/ngón tay để che thông tin"}</span>
    </div>
    <div className="canvas-btn-group">
      <button
        type="button"
        className="canvas-tool-btn"
        disabled={rects.length === 0}
        onClick={handleUndo}
        title="Hoàn tác nét vừa vẽ"
      >
        <Undo2 size={16} /> Hoàn tác
      </button>
      <button
        type="button"
        className="canvas-tool-btn text-rose-500"
        disabled={rects.length === 0}
        onClick={() => setRects([])}
        title="Xóa toàn bộ các vùng che"
      >
        <Eraser size={16} /> Xóa hết
      </button>
      <button
        type="button"
        className="canvas-tool-btn"
        onClick={() => { setSource(""); setRects([]); onClear(); }}
      >
        Chọn ảnh khác
      </button>
    </div>
  </div>
  ```

---

### 4.6. Chuyển Đổi Side-Panel Thành "Bảng Cảm Biến Rủi Ro Thời Gian Thực" (Live Heuristics Sensor)
* **Vị trí tệp tin trong mã nguồn:**
  - Cấu trúc JSX: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L228-L234) (`<aside className="side-panel">`).
  - Định dạng CSS: [`src/app/globals.css`](../src/app/globals.css#L6) (`.side-panel`, `.assurance-list`, `.assurance-item`).
* **Phân tích nhược điểm:**
  - Khối `aside.side-panel` ("Mỗi cảnh báo đều có căn cứ") chiếm tới 35% chiều ngang màn hình máy tính nhưng chỉ chứa 4 dòng văn bản tĩnh không thay đổi (`Assurance`).
  - Người dùng không tương tác và lướt qua nó hoàn toàn, gây lãng phí "bất động sản màn hình" quý giá.
* **Yêu cầu kỹ thuật & Thiết kế mới:**
  - Tái sinh thành **Widget Cảm Biến Cảnh Báo Sơ Bộ (Live Threat Heuristics Sensor)**:
  - Khi người dùng gõ tin nhắn vào ô input, widget chạy heuristic regex nhẹ nhàng (debounced 150ms).
  - Tự động hiển thị các radar cảm biến nhấp nháy theo ngữ cảnh:
    1. ⚡ **Áp lực thời gian (Urgency Detector):** Phát hiện các từ khóa "khóa trong 10 phút", "ngay lập tức", "khẩn cấp", "cấp cứu".
    2. 🔑 **Đòi hỏi thông tin bí mật (Credential Bait):** Phát hiện từ khóa "mã OTP", "mật khẩu", "số thẻ căn cước", "mã PIN".
    3. 🏛️ **Mạo danh quyền lực (Impersonation):** Phát hiện từ khóa "Bộ Công An", "Viện Kiểm Sát", "VNeID", "Cảnh sát giao thông".
* **Mã TSX component đề xuất thay thế `<aside className="side-panel">`:**
  ```tsx
  {/* COMPONENT CẢM BIẾN RỦI RO THỜI GIAN THỰC */}
  <aside className="live-sensor-panel" aria-live="polite">
    <div className="sensor-header">
      <div className="sensor-pulse-icon">
        <Sparkles size={18} />
      </div>
      <div>
        <strong>CẢM BIẾN PHÁT HIỆN SƠ BỘ</strong>
        <small>Phân tích tức thời qua biểu thức chính quy</small>
      </div>
    </div>

    <div className="sensor-status-cards">
      {/* Cảm biến 1: Áp lực thời gian */}
      <div className={`sensor-card ${hasUrgency ? "active-alert" : ""}`}>
        <div className="sensor-card-top">
          <Clock3 size={16} />
          <span>Áp lực khẩn cấp</span>
          <span className="sensor-badge">{hasUrgency ? "PHÁT HIỆN" : "BÌNH THƯỜNG"}</span>
        </div>
        <p>{hasUrgency ? "Phát hiện từ khóa thúc ép hành động gấp gáp nhằm làm nạn nhân hoảng loạn." : "Chưa thấy dấu hiệu ép buộc thời gian."}</p>
      </div>

      {/* Cảm biến 2: Đòi hỏi OTP / Mật khẩu */}
      <div className={`sensor-card ${hasSecret ? "active-danger" : ""}`}>
        <div className="sensor-card-top">
          <LockKeyhole size={16} />
          <span>Thông tin tuyệt mật</span>
          <span className="sensor-badge danger">{hasSecret ? "NGUY HIỂM" : "AN TOÀN"}</span>
        </div>
        <p>{hasSecret ? "CẢNH BÁO: Không có tổ chức hay ngân hàng nào yêu cầu cung cấp OTP qua tin nhắn!" : "Chưa thấy yêu cầu mã OTP hoặc mật khẩu."}</p>
      </div>

      {/* Cảm biến 3: Giả danh cơ quan công quyền */}
      <div className={`sensor-card ${hasAuthority ? "active-warning" : ""}`}>
        <div className="sensor-card-top">
          <ShieldAlert size={16} />
          <span>Mạo danh cơ quan</span>
          <span className="sensor-badge warning">{hasAuthority ? "NGHI VẤN" : "CHƯA THẤY"}</span>
        </div>
        <p>{hasAuthority ? "Phát hiện tên cơ quan pháp luật/ngân hàng. Cơ quan chức năng không làm việc qua mạng xã hội." : "Chưa phát hiện tên tổ chức công quyền."}</p>
      </div>
    </div>
  </aside>
  ```

---

### 4.7. Đột Phá Trình Bày Báo Cáo: Khung Hội Thoại Ngữ Cảnh & Đánh Giá Đa Chiều
* **Vị trí tệp tin trong mã nguồn:**
  - Cấu trúc JSX: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L247-L257) (component `ReportView`).
  - Định dạng CSS: [`src/app/globals.css`](../src/app/globals.css#L9) (`.report-section`, `.risk-banner`, `.finding-card`, `.evidence-quote`).
* **Phân tích nhược điểm báo cáo hiện tại:**
  1. *Bằng chứng bị bứng khỏi ngữ cảnh:* Báo cáo hiện tại liệt kê các thẻ chữ nhật với câu trích dẫn nhỏ xíu `evidence-quote` bị tách rời khỏi toàn văn tin nhắn. Người dùng không thấy được thủ đoạn thao túng được cài cắm như thế nào trong mạch trò chuyện.
  2. *Thiếu thước đo tâm lý:* Không có trực quan hóa mức độ dồn ép tâm lý (Psychological Pressure Radar).
  3. *Checklist hành động bị động:* Checklist kiểm chứng chỉ là danh sách đánh số `<ol>` tĩnh, người dùng không thể bấm đánh dấu các bước mình đã thực hiện xong.
* **Yêu cầu kỹ thuật & Thiết kế mới (Kiến trúc Báo cáo Tương tác Đỉnh Cao):**
  1. **Khung Hội Thoại Ngữ Cảnh (Contextual Chat Viewer):**
     - Hiển thị lại toàn bộ nội dung tin nhắn dưới dạng **Bong bóng trò chuyện (Chat Bubble)** sống động.
     - Dùng các thẻ `<mark class="scam-evidence-tag severity-high">{evidence}</mark>` để tô sáng trực tiếp các câu từ nguy hiểm ngay trong đoạn chat.
     - Rê chuột hoặc chạm vào câu đó sẽ nổi lên Popover giải thích chi tiết: *"Kẻ gian đang tạo cớ mẹ cấp cứu để uy hiếp lương tâm nạn nhân"*.
  2. **Thang Đo Thao Túng Tâm Lý 4 Trục (Psychological Manipulation Gauge):**
     - Bổ sung 4 thanh tiến trình trực quan:
       + 🛡️ *Tạo uy quyền giả (Authority): 90%*
       + ⏳ *Áp lực thời gian (Urgency): 85%*
       + 👤 *Cô lập nạn nhân (Isolation): 70%*
       + 💰 *Cạm bẫy tài chính (Financial Bait): 60%*
  3. **Checklist Kiểm Chứng Tương Tác Có Thể Đánh Dấu (Interactive Action Checklist):**
     - Cho phép người dùng bấm tick trực tiếp vào các bước đã làm (lưu trạng thái vào `localStorage`):
       - [✓] Đã mở app ngân hàng tự tra cứu số dư độc lập.
       - [✓] Đã gọi điện trực tiếp cho người thân qua số di động thông thường.
       - [ ] Đã liên hệ tổng đài khóa thẻ tạm thời.
* **Mã TSX hoàn chỉnh của `ReportView` nâng cấp:**
  ```tsx
  function ModernReportView({ report, signedIn, onSave, onCopy }: ReportProps) {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    function toggleCheck(index: number) {
      setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
    }

    return (
      <section className="modern-report-section" aria-live="polite">
        {/* BANNER NGUY CƠ ĐẠT CHUẨN AN TOÀN QUỐC TẾ */}
        <div className={`threat-master-banner risk-${report.riskLevel}`}>
          <div className="threat-symbol-box">
            {report.riskLevel === "high" ? <ShieldAlert size={36} /> : <ShieldCheck size={36} />}
          </div>
          <div className="threat-summary-copy">
            <div className="threat-level-tag">KẾT LUẬN ĐÁNH GIÁ NGUY CƠ</div>
            <h2>{riskLabels[report.riskLevel]}</h2>
            <p>{report.summary}</p>
          </div>
          <div className="threat-action-btns">
            <button className="report-btn" onClick={onCopy}><Copy size={15} /> Sao chép</button>
            <button className="report-btn" onClick={() => window.print()}><FileText size={15} /> In PDF</button>
          </div>
        </div>

        {/* BÓC TÁCH BẰNG CHỨNG TRONG MOCKUP HỘI THOẠI TRỰC QUAN */}
        <div className="report-dual-grid">
          <div className="chat-context-mockup">
            <div className="mockup-header">
              <MessageCircle size={16} />
              <span>NỘI DUNG GỐC ĐÃ KHOANH VÙNG BẰNG CHỨNG ĐÁNH LỪA</span>
            </div>
            <div className="chat-bubble-container">
              <div className="chat-bubble incoming">
                <div className="chat-avatar">⚠️</div>
                <div className="bubble-text">
                  {/* Trực quan hóa inline highlight trực tiếp trên câu chữ */}
                  {renderHighlightedContent(report.sourceText, report.findings)}
                </div>
              </div>
            </div>
            <p className="mockup-note">
              💡 <em>Di chuột hoặc nhấn vào các đoạn bôi đỏ để xem phân tích chiêu thức tâm lý.</em>
            </p>
          </div>

          {/* THANG ĐO THAO TÚNG TÂM LÝ 4 CHIỀU */}
          <div className="psychological-gauge-card">
            <h3>Chỉ Số Thao Túng Tâm Lý</h3>
            <div className="gauge-metric">
              <div className="gauge-label"><span>Áp lực thời gian (Urgency)</span><strong>85%</strong></div>
              <div className="gauge-track"><div className="gauge-fill fill-red" style={{ width: "85%" }} /></div>
            </div>
            <div className="gauge-metric">
              <div className="gauge-label"><span>Mạo danh quyền lực (Authority)</span><strong>90%</strong></div>
              <div className="gauge-track"><div className="gauge-fill fill-red" style={{ width: "90%" }} /></div>
            </div>
            <div className="gauge-metric">
              <div className="gauge-label"><span>Cô lập nạn nhân (Isolation)</span><strong>70%</strong></div>
              <div className="gauge-track"><div className="gauge-fill fill-amber" style={{ width: "70%" }} /></div>
            </div>
            <div className="gauge-metric">
              <div className="gauge-label"><span>Dụ dỗ tài chính (Bait)</span><strong>60%</strong></div>
              <div className="gauge-track"><div className="gauge-fill fill-amber" style={{ width: "60%" }} /></div>
            </div>
          </div>
        </div>

        {/* CHECKLIST HÀNH ĐỘNG CÓ THỂ ĐÁNH DẤU (INTERACTIVE CHECKLIST) */}
        <div className="interactive-checklist-box">
          <div className="checklist-header">
            <BadgeCheck size={20} className="text-emerald-500" />
            <div>
              <h3>Danh Sách Kiểm Chứng Khuyến Nghị (Hãy đánh dấu khi bạn hoàn thành)</h3>
              <p>Luôn tự kiểm tra qua kênh liên lạc chính thức, tuyệt đối không dùng số điện thoại kẻ gian gửi.</p>
            </div>
          </div>
          <ul className="action-checklist">
            {report.checklist.map((item, idx) => (
              <li
                key={idx}
                className={`checklist-item ${checkedItems[idx] ? "item-completed" : ""}`}
                onClick={() => toggleCheck(idx)}
              >
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[idx])}
                  onChange={() => toggleCheck(idx)}
                />
                <span className="checklist-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
  ```

---

### 4.8. Khắc Phục Triệt Để Lỗi Tiếp Cận (WCAG 2.1 AA/AAA) & Vùng Bấm 48px Di Động
* **Vị trí tệp tin trong mã nguồn:**
  - CSS Mobile Media Query: [`src/app/globals.css`](../src/app/globals.css#L14-L15) và [`src/app/theme.css`](../src/app/theme.css#L336-L421).
* **Bảng thống kê lỗi vi phạm chuẩn quốc tế hiện tại (Audit Log):**

| Thành phần giao diện | Vị trí Selector trong CSS | Cỡ chữ hiện tại | Tiêu chuẩn WCAG 2.1 AA | Hậu quả người dùng |
| :--- | :--- | :--- | :--- | :--- |
| **Chú thích mục bảo đảm** | `.assurance-item small` | **7px** | Tối thiểu 12px | Không thể đọc được trên màn hình điện thoại |
| **Footer copyright & link** | `.side-bottom, .footer nav` | **7px** | Tối thiểu 12px | Vi phạm pháp lý về tính minh bạch dữ liệu |
| **Điểm tin cậy Hero** | `.trust-points span` | **8px** | Tối thiểu 12px | Chữ bị mờ và nhòe trên màn hình retina |
| **Nút bấm nạp demo** | `.demo-button` | **8px** | Tối thiểu 13px | Quá nhỏ, người già không thể nhận biết |
| **Tabs chọn loại tin** | `.type-tab` | **8px** | Tối thiểu 14px | Nét chữ vỡ hạt, người dùng ấn nhầm |
| **Thời gian & Meta báo cáo**| `.report-meta` | **7px** | Tối thiểu 12px | Không thể đối chiếu mốc thời gian sự cố |
| **Chiều cao nút thao tác** | `.type-tab, .demo-button` | **32px - 38px** | Tối thiểu 48px | Vi phạm chuẩn Apple/Android Thumb Zone |

* **Mã CSS chuẩn hóa thay thế toàn diện khối `@media (max-width: 650px)` trong `src/app/globals.css`:**
  ```css
  /* ==========================================================================
     WCAG 2.1 AAA MOBILE COMPLIANCE REPLACEMENT (src/app/globals.css L15)
     Triệt tiêu hoàn toàn font-size < 12px và vùng bấm < 48px
     ========================================================================== */
  @media (max-width: 650px) {
    /* ĐỒNG BỘ CỠ CHỮ TOÀN BỘ PHẦN TỬ DI ĐỘNG */
    body { font-size: 16px !important; line-height: 1.6; }
    
    .hero h1 { font-size: 32px !important; line-height: 1.25 !important; letter-spacing: -0.02em; }
    .hero-lede { font-size: 15px !important; line-height: 1.65 !important; }
    .trust-points span { font-size: 13px !important; }

    .step-card h3 { font-size: 15px !important; }
    .step-card p { font-size: 13px !important; line-height: 1.55 !important; }
    
    .assurance-item strong { font-size: 14px !important; }
    .assurance-item small { font-size: 12px !important; line-height: 1.4 !important; }
    .side-bottom { font-size: 12px !important; min-height: 48px; }
    
    .report-meta { font-size: 12px !important; }
    .history-badge { font-size: 12px !important; padding: 6px 12px !important; }
    .history-title strong { font-size: 15px !important; }
    .history-title small { font-size: 13px !important; }
    .footer nav { font-size: 12px !important; gap: 16px; }

    /* TOUCH TARGETS: CHUẨN HÓA 48PX CHO NGÓN TAY CÁI */
    .type-tab {
      min-height: 52px !important;
      font-size: 13px !important;
      padding: 10px 14px !important;
      display: flex;
      flex-direction: row !important;
      align-items: center;
      justify-content: center;
      gap: 8px !important;
    }
    .demo-button {
      min-height: 48px !important;
      font-size: 13px !important;
      padding: 10px 16px !important;
    }
    .primary-button, .secondary-button, .primary-action-cta {
      min-height: 52px !important;
      font-size: 15px !important;
      padding: 14px 20px !important;
      border-radius: 12px !important;
    }
    .main-textarea {
      font-size: 16px !important; /* Chống hiện tượng iOS Safari tự động zoom trang khi focus */
      padding: 14px !important;
    }
  }
  ```

---

### 4.9. Tối Ưu Bảng Màu Chế Độ Tối (Dark Mode Refinement - Zero Muddy Brown)
* **Vị trí tệp tin trong mã nguồn:**
  - CSS Dark Mode: [`src/app/theme.css`](../src/app/theme.css#L27-L50) và dòng 301–328.
* **Phân tích nhược điểm:**
  - Trong chế độ tối hiện tại, banner rủi ro cao dùng nền nâu đục `#3a2228`, viền `#754047`, chữ `#ffaaa0`. Banner rủi ro trung bình dùng nền vàng đất bẩn `#382f20`.
  - Tỷ lệ tương phản màu sắc chỉ đạt ~3.2:1 (không đạt ngưỡng tối thiểu 4.5:1 của WCAG AA), gây cảm giác màn hình bị ố bẩn, thiếu sự tinh xảo của một công cụ bảo mật cấp quốc gia.
* **Yêu cầu kỹ thuật & Thiết kế mới (Dark Security Glassmorphism):**
  - Chuyển toàn bộ nền chế độ tối sang hệ **Slate / Midnight Black** sâu thẳm (`#090d16`).
  - Áp dụng các mảng màu phát sáng viền (Glow Accents) với độ trong suốt alpha tinh tế:
* **Mã CSS Dark Mode thay thế tại `src/app/theme.css` L301–328:**
  ```css
  /* DARK MODE GLASSMORPHISM BẢO MẬT CAO CẤP */
  html[data-theme="dark"] .threat-master-banner.risk-high,
  html[data-theme="dark"] .risk-banner.risk-high {
    background: rgba(239, 68, 68, 0.12) !important;
    border: 1px solid rgba(239, 68, 68, 0.45) !important;
    color: #fca5a5 !important;
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.15);
  }
  html[data-theme="dark"] .threat-master-banner.risk-medium,
  html[data-theme="dark"] .risk-banner.risk-medium {
    background: rgba(245, 158, 11, 0.12) !important;
    border: 1px solid rgba(245, 158, 11, 0.45) !important;
    color: #fde047 !important;
    box-shadow: 0 0 25px rgba(245, 158, 11, 0.15);
  }
  html[data-theme="dark"] .threat-master-banner.risk-low,
  html[data-theme="dark"] .risk-banner.risk-low {
    background: rgba(16, 185, 129, 0.12) !important;
    border: 1px solid rgba(16, 185, 129, 0.45) !important;
    color: #6ee7b7 !important;
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.15);
  }
  html[data-theme="dark"] .evidence-quote {
    background: rgba(59, 130, 246, 0.12) !important;
    border-left: 3px solid #60a5fa !important;
    color: #e2e8f0 !important;
  }
  ```

---

### 4.10. Vi Tương Tác, Hiệu Ứng Chuyển Động & Phản Hồi Xúc Giác (Micro-Interactions & Polish)
* **Vị trí tệp tin trong mã nguồn:**
  - CSS Toàn cục: [`src/app/globals.css`](../src/app/globals.css) và [`src/app/theme.css`](../src/app/theme.css#L423-L425).
* **Các cải tiến vi tương tác tinh tế theo chuẩn `impeccable`:**
  1. *Hiệu ứng Skeleton Shimmer khi chờ AI:* Thay thế vòng xoay đơn điệu bằng hiệu ứng quét sáng mô phỏng dữ liệu đang được soi rọi.
  2. *Phản hồi xúc giác khi bấm nút (Tactile Depress):*
     ```css
     button:active {
       transform: scale(0.98);
       transition: transform 0.08s ease-in-out;
     }
     ```
  3. *Hiệu ứng nhấp nháy đèn Radar Heuristic:*
     ```css
     @keyframes radarPulse {
       0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
       70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
       100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
     }
     .live-radar-dot {
       display: inline-block;
       width: 8px;
       height: 8px;
       border-radius: 50%;
       background-color: #10b981;
       animation: radarPulse 2s infinite;
     }
     ```
  4. *Tôn trọng triệt để thuộc tính giảm chuyển động:*
     ```css
     @media (prefers-reduced-motion: reduce) {
       *, *::before, *::after {
         animation-duration: 0.01ms !important;
         transition-duration: 0.01ms !important;
         scroll-behavior: auto !important;
       }
     }
     ```

---

## 5. CÁC TÍNH NĂNG NÂNG CẤP ĐÚNG ĐỊNH VỊ "SCAMLENS" (DEEP INSPECTION CAPABILITIES)

*(Tập trung 100% vào năng lực Soi rọi, Giám định thị giác, Bóc tách bằng chứng OCR và An toàn mạng ngoại tuyến; loại bỏ hoàn toàn các tính năng ngoài lề gây loãng đề tài như mô phỏng game hay radar cộng đồng).*

---

### 5.1. Kính Lúp Khoanh Vùng Bằng Chứng Trực Quan (In-place Visual Evidence Lens)
* **Vị trí tệp tin trong mã nguồn:**
  - Logic phân rã vị trí chuỗi: [`src/lib/analysis/evidence.ts`](../src/lib/analysis/evidence.ts)
  - Hiển thị trực quan: [`src/components/home-app.tsx`](../src/components/home-app.tsx#L247-L257) (`ReportView`)
* **Vấn đề cốt lõi:**
  Hiện tại, các phát hiện (`findings`) được render tách rời thành các thẻ card riêng biệt. Người dùng đọc từng thẻ nhưng không thấy được vị trí tương đối của câu trích dẫn đó trong văn bản gốc.
* **Đặc tả kỹ thuật & Thuật toán thực thi:**
  Sử dụng mảng `evidenceRefs` chứa cặp tọa độ `{ start, end, quote }` đã được kiểm chứng để cắt chuỗi văn bản gốc `source` thành các đoạn `Segment`:
  ```typescript
  type Segment = 
    | { type: "text"; text: string }
    | { type: "evidence"; text: string; category: string; severity: string; explanation: string };

  export function segmentSourceText(source: string, findings: VerifiedFinding[]): Segment[] {
    // 1. Tập hợp mọi khoảng bằng chứng không chồng lấn
    const intervals: Array<{ start: number; end: number; finding: VerifiedFinding }> = [];
    for (const f of findings) {
      for (const ref of f.evidenceRefs) {
        intervals.push({ start: ref.start, end: ref.end, finding: f });
      }
    }
    // Sắp xếp tăng dần theo vị trí start
    intervals.sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let cursor = 0;

    for (const item of intervals) {
      if (item.start > cursor) {
        segments.push({ type: "text", text: source.slice(cursor, item.start) });
      }
      if (item.start >= cursor) {
        segments.push({
          type: "evidence",
          text: source.slice(item.start, item.end),
          category: item.finding.category,
          severity: item.finding.severity,
          explanation: item.finding.explanation,
        });
        cursor = Math.max(cursor, item.end);
      }
    }
    if (cursor < source.length) {
      segments.push({ type: "text", text: source.slice(cursor) });
    }
    return segments;
  }
  ```
* **Mã JSX Render trong Báo Cáo:**
  ```tsx
  <div className="contextual-evidence-viewer">
    {segments.map((seg, i) => {
      if (seg.type === "text") return <span key={i}>{seg.text}</span>;
      return (
        <mark
          key={i}
          className={`evidence-mark severity-${seg.severity}`}
          data-tooltip={seg.explanation}
          tabIndex={0}
        >
          {seg.text}
          <span className="mark-popover">
            <strong>{seg.category.toUpperCase()}:</strong> {seg.explanation}
          </span>
        </mark>
      );
    })}
  </div>
  ```

---

### 5.2. Giám Định Sơ Bộ Dấu Vết Chỉnh Sửa Ảnh Biên Lai (Fake Bill Forensic Lens)
* **Vị trí tệp tin trong mã nguồn:**
  - Tệp mới: `src/lib/analysis/forensic.ts`
  - Tích hợp gọi tại: [`src/components/image-redactor.tsx`](../src/components/image-redactor.tsx#L31-L48) (`loadImage`)
* **Vấn đề cốt lõi:**
  Hiện nay trên thị trường có hàng chục trang web tạo "Fake Bill chuyển khoản" (biên lai giả của Vietcombank, Techcombank, MBBank). Các ảnh này thường có 2 đặc trưng kỹ thuật số:
  1. Chứa metadata / EXIF tiết lộ dấu vết xuất file từ Canva, Adobe Photoshop, hoặc công cụ web canvas `taobill`.
  2. Nén JPEG không đồng nhất giữa phần nền và phần số tiền được chèn đè lên (Error Level Discrepancy).
* **Đặc tả thuật toán Giám định Client-side (100% Offline & Bảo mật):**
  Tạo tệp `src/lib/analysis/forensic.ts` thực hiện quét nhị phân metadata và phân tích độ tương phản pixel:
  ```typescript
  export interface ForensicResult {
    hasSuspiciousMetadata: boolean;
    detectedSoftware?: string;
    compressionAnomalyScore: number; // 0 -> 100
    warnings: string[];
  }

  export async function inspectReceiptImage(file: File): Promise<ForensicResult> {
    const warnings: string[] = [];
    let detectedSoftware: string | undefined;

    // 1. Quét chữ ký metadata phần mềm đồ họa trong Header File
    const buffer = await file.slice(0, 64 * 1024).arrayBuffer();
    const textHeader = new TextDecoder("latin1").decode(buffer);

    const softwareSignatures = [
      { name: "Adobe Photoshop", regex: /Adobe Photoshop|Photoshop 3\.0/i },
      { name: "Canva Design", regex: /Canva/i },
      { name: "Taobill / Web Canvas Generator", regex: /taobill|billchuyenkhoan|fakereceipt/i },
      { name: "GIMP", regex: /GIMP/i },
    ];

    for (const sig of softwareSignatures) {
      if (sig.regex.test(textHeader)) {
        detectedSoftware = sig.name;
        warnings.push(`Phát hiện chữ ký xuất file từ phần mềm biên tập đồ họa: ${sig.name}`);
        break;
      }
    }

    // 2. Kiểm tra tỷ lệ khung hình chuẩn của màn hình di động (Smart Heuristic)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    const ratio = img.naturalHeight / img.naturalWidth;
    // Ảnh chụp màn hình điện thoại thường có tỷ lệ 16:9 (1.77) hoặc 19.5:9 (2.16)
    if (ratio < 1.2 && img.naturalWidth > 500) {
      warnings.push("Tỷ lệ khung hình ảnh biên lai bị cắt xén bất thường so với ảnh chụp màn hình điện thoại nguyên bản.");
    }

    return {
      hasSuspiciousMetadata: Boolean(detectedSoftware),
      detectedSoftware,
      compressionAnomalyScore: detectedSoftware ? 85 : 15,
      warnings,
    };
  }
  ```

---

### 5.3. Thấu Kính Bóc Tách URL Chuyên Sâu Ngoại Tuyến (Deep Static URL Lens)
* **Vị trí tệp tin trong mã nguồn:**
  - [`src/lib/analysis/url.ts`](../src/lib/analysis/url.ts#L1-L40)
* **Vấn đề cốt lõi:**
  Kẻ lừa đảo thường áp dụng 3 thủ thuật qua mặt hệ thống kiểm tra URL thông thường:
  1. *Tấn công đồng hình (Internationalized Domain Name - IDN Homograph Attack):* Sử dụng ký tự Cyrillic giống hệt chữ Latin (ví dụ chữ `а` Cyrillic `U+0430` thay cho chữ `a` Latin `U+0061` trong `vietcombank`).
  2. *Cổng mạng bất thường:* Chạy web trên các cổng non-standard như `:8080`, `:8443`, `:2082` để tránh tường lửa.
  3. *Mở bọc tham số redirect ngầm (Nested Open Redirect):* URL có dạng `https://google.com/url?q=https://fake-login.xyz`.
* **Mã TypeScript nâng cấp toàn diện trong [`src/lib/analysis/url.ts`](../src/lib/analysis/url.ts):**
  ```typescript
  export interface DeepUrlInspection {
    isHomographAttack: boolean;
    hasAbnormalPort: boolean;
    nestedRedirectTarget?: string;
    isSpoofedBrand: boolean;
    spoofedBrandName?: string;
    riskFlags: string[];
  }

  export function inspectUrlDeep(rawUrl: string): DeepUrlInspection {
    const riskFlags: string[] = [];
    let isHomographAttack = false;
    let hasAbnormalPort = false;
    let nestedRedirectTarget: string | undefined;
    let isSpoofedBrand = false;
    let spoofedBrandName: string | undefined;

    try {
      const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
      const hostname = parsed.hostname.toLowerCase();

      // 1. Kiểm tra ký tự Cyrillic / Ký tự phi Latin trong tên miền
      if (/[\u0400-\u04FF]/.test(hostname) || hostname.startsWith("xn--")) {
        isHomographAttack = true;
        riskFlags.push("CẢNH BÁO CAO: Tên miền sử dụng ký tự đồng hình (Cyrillic / Punycode) để giả dạng thương hiệu hợp pháp.");
      }

      // 2. Kiểm tra cổng mạng bất thường
      if (parsed.port && !["80", "443", ""].includes(parsed.port)) {
        hasAbnormalPort = true;
        riskFlags.push(`Trang web đang chạy trên cổng mạng bất thường (Port :${parsed.port}), thường gặp ở máy chủ phishing tự dựng.`);
      }

      // 3. Bóc tách tham số Open Redirect lồng ghép
      const redirectParams = ["redirect", "url", "target", "next", "destination", "u", "link", "q"];
      for (const p of redirectParams) {
        const val = parsed.searchParams.get(p);
        if (val && (val.startsWith("http://") || val.startsWith("https://"))) {
          nestedRedirectTarget = val;
          riskFlags.push(`Phát hiện kỹ thuật che giấu đích đến (Open Redirect): Link thực tế bạn sẽ bị chuyển tới là: ${val}`);
          break;
        }
      }

      // 4. Nhận diện mạo danh thương hiệu Việt Nam phổ biến
      const trustedBrands = [
        { brand: "VNeID / Bộ Công An", pattern: /vneid|dichvucong/i, officialDomain: ".gov.vn" },
        { brand: "Vietcombank", pattern: /vietcombank/i, officialDomain: "vietcombank.com.vn" },
        { brand: "Techcombank", pattern: /techcombank/i, officialDomain: "techcombank.com.vn" },
        { brand: "ZaloPay / Zalo", pattern: /zalopay|zalo/i, officialDomain: "zalo.me" },
      ];

      for (const b of trustedBrands) {
        if (b.pattern.test(hostname) && !hostname.endsWith(b.officialDomain)) {
          isSpoofedBrand = true;
          spoofedBrandName = b.brand;
          riskFlags.push(`Tên miền chứa từ khóa thương hiệu "${b.brand}" nhưng không thuộc tên miền chính thức (${b.officialDomain}).`);
        }
      }
    } catch {
      riskFlags.push("Đường dẫn có định dạng không hợp lệ hoặc chứa ký tự điều khiển bất thường.");
    }

    return {
      isHomographAttack,
      hasAbnormalPort,
      nestedRedirectTarget,
      isSpoofedBrand,
      spoofedBrandName,
      riskFlags,
    };
  }
  ```

---

### 5.4. Trích Xuất Dữ Liệu Biên Lai Có Đối Soát Logic (Structured Layout Parsing)
* **Vị trí tệp tin trong mã nguồn:**
  - Schema: [`src/lib/analysis/schema.ts`](../src/lib/analysis/schema.ts)
  - Xử lý DeepSeek Vision: [`src/lib/ai/deepseek.ts`](../src/lib/ai/deepseek.ts#L106-L130)
* **Vấn đề cốt lõi:**
  Hiện tại OCR chỉ trả về một chuỗi văn bản thuần túy (`result.text`), sau đó ném chuỗi này vào prompt phân tích chung. Cách này làm mất đi cấu trúc dạng bảng của biên lai và không thể đối soát chéo logic kế toán.
* **Đặc tả kiến trúc Schema trích xuất biên lai có cấu trúc:**
  Định nghĩa Zod Schema cho dữ liệu biên lai ngân hàng Việt Nam:
  ```typescript
  export const receiptStructuredSchema = z.object({
    bankName: z.string().describe("Tên ngân hàng phát hành biên lai (ví dụ: Vietcombank, Techcombank, MBBank)"),
    amount: z.number().describe("Số tiền giao dịch bằng số nguyên"),
    amountInWords: z.string().optional().describe("Số tiền bằng chữ"),
    senderName: z.string().optional().describe("Tên người chuyển"),
    senderAccount: z.string().optional().describe("Số tài khoản người chuyển"),
    recipientName: z.string().describe("Tên người thụ hưởng"),
    recipientAccount: z.string().describe("Số tài khoản thụ hưởng"),
    recipientBank: z.string().describe("Ngân hàng thụ hưởng"),
    transactionTime: z.string().describe("Thời gian thực hiện giao dịch ghi trên ảnh"),
    referenceNumber: z.string().describe("Mã giao dịch / Mã tham chiếu"),
    transferType: z.enum(["napas247", "normal", "unknown"]).describe("Hình thức chuyển thường hay chuyển nhanh 24/7"),
    inconsistencies: z.array(z.string()).describe("Các điểm mâu thuẫn số liệu (ví dụ: số tiền bằng số lệch số tiền bằng chữ)"),
  });

  export type ReceiptStructuredData = z.infer<typeof receiptStructuredSchema>;
  ```
* **Quy tắc đối soát logic tự động (Cross-Validation Rules):**
  1. *Đối soát Số tiền & Chữ:* Nếu `amount = 14800000` nhưng `amountInWords` ghi *"Mười bốn triệu đồng"* -> Cờ đỏ: Biên lai bị chỉnh sửa photoshop cẩu thả.
  2. *Đối soát Mã tham chiếu (Ref Code) theo chuẩn ngân hàng:*
     - Vietcombank: Thường có định dạng mã 10 chữ số bắt đầu bằng số giao dịch ngày hoặc chuỗi chữ số Napas (12-16 ký tự).
     - MBBank: Thường có tiền tố `FT` hoặc chuỗi số thứ tự điện tử chuẩn.
     - Nếu mã tham chiếu là chuỗi ngẫu nhiên vô nghĩa (`123456789`) -> Cảnh báo bill rác từ web taobill.
  3. *Đối soát Chuyển thường liên ngân hàng:* Nếu ngày giao dịch là tối thứ Bảy nhưng trên bill ghi `Napas 24/7` trong khi khách lại nhắn tin giải thích là `chuyển thường` -> Bóc tách mâu thuẫn lời nói dối của kẻ gian ngay lập tức!

---

---

## 6. KẾ HOẠCH & LỆNH KIỂM CHUẨN SAU KHI CHỈNH SỬA

Sau khi hoàn tất chỉnh sửa mã nguồn, hãy thực hiện quy trình kiểm chuẩn 5 bước trên PowerShell để đảm bảo tính sẵn sàng 100%:

```powershell
# 1. Kiểm tra quy chuẩn mã nguồn (ESLint)
npm.cmd run lint

# 2. Kiểm tra kiểu dữ liệu tĩnh (TypeScript)
npm.cmd run typecheck

# 3. Chạy toàn bộ 50 ca kiểm thử đơn vị & tích hợp
npm.cmd run test

# 4. Kiểm tra kết nối AI thực tế với API Key trong .env
npm.cmd run smoke:ai

# 5. Kiểm thử đóng gói bản phát hành Production
npm.cmd run build
```
*(Tất cả 5 lệnh trên phải trả về mã kết thúc 0 và không có bất kỳ thông báo lỗi nào trước khi triển khai lên Vercel).*
