"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Image as ImageIcon, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { decodeQrCanvas } from "@/lib/analysis/qr";

type Rect = { x: number; y: number; width: number; height: number };

export function ImageRedactor({ onPrepared, onClear, onQrContent }: { onPrepared(file: File): void; onClear(): void; onQrContent?(text: string): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLImageElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const renderVersionRef = useRef(0);
  const onPreparedRef = useRef(onPrepared);
  const imageLoadVersion = useRef(0);
  const [qrText, setQrText] = useState("");
  const [qrFeedback, setQrFeedback] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  function resetQr() { setQrText(""); setQrFeedback(""); setQrBusy(false); setImageReady(false); }
  async function readQr() {
    const canvas = canvasRef.current;
    if (!canvas || !imageReady) return;
    const version = renderVersionRef.current;
    setQrBusy(true); setQrText(""); setQrFeedback("");
    try {
      const text = await decodeQrCanvas(canvas);
      if (version === renderVersionRef.current) setQrText(text);
    } catch {
      if (version === renderVersionRef.current) setQrFeedback("Chưa đọc được QR. Hãy dùng ảnh rõ nét, thấy đủ bốn góc mã và thử lại.");
    } finally { if (version === renderVersionRef.current) setQrBusy(false); }
  }

  useEffect(() => {
    onPreparedRef.current = onPrepared;
  }, [onPrepared]);

  const [source, setSource] = useState("");
  const [rects, setRects] = useState<Rect[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const image = originalRef.current;
    if (!canvas || !ctx || !image || !dimensions.width || !dimensions.height) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1e293b";
    rects.forEach((rect) =>
      ctx.fillRect(rect.x * canvas.width, rect.y * canvas.height, rect.width * canvas.width, rect.height * canvas.height)
    );

    const renderVersion = ++renderVersionRef.current;
    canvas.toBlob((blob) => {
      if (renderVersion !== renderVersionRef.current) return;
      if (!blob) { setError("Không tạo được ảnh đã che."); return; }
      if (blob.size > 3 * 1024 * 1024) { setError("Ảnh sau xử lý còn quá lớn. Hãy chọn ảnh có kích thước nhỏ hơn."); return; }
      setError("");
      setImageReady(true);
      onPreparedRef.current(new File([blob], "scamlens-redacted.jpg", { type: "image/jpeg", lastModified: Date.now() }));
    }, "image/jpeg", 0.86);
  }, [source, rects, dimensions]);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);
  useEffect(() => () => { imageLoadVersion.current++; renderVersionRef.current++; }, []);

  const loadImage = useCallback((file: File) => {
    renderVersionRef.current += 1;
    const loadVersion = ++imageLoadVersion.current;
    setImageReady(false);
    resetQr();
    onClear();
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Chọn ảnh JPEG, PNG hoặc WebP, dung lượng gốc tối đa 10 MiB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (loadVersion !== imageLoadVersion.current) { URL.revokeObjectURL(objectUrl); return; }
      const max = 1600;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      setDimensions({ width, height });
      setRects([]);
      originalRef.current = image;
      setSource(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      if (loadVersion !== imageLoadVersion.current) return;
      setError("Không thể đọc ảnh này.");
    };
    image.src = objectUrl;
  }, [onClear]);

  useEffect(() => {
    function handleClipboardPaste(event: ClipboardEvent) {
      if (!canvasRef.current?.closest(".redactor")?.contains(document.activeElement)) return;
      const imageFile = Array.from(event.clipboardData?.files ?? []).find((file) => /^image\/(jpeg|png|webp)$/.test(file.type));
      if (!imageFile) return;
      event.preventDefault();
      loadImage(imageFile);
    }
    window.addEventListener("paste", handleClipboardPaste);
    return () => window.removeEventListener("paste", handleClipboardPaste);
  }, [loadImage]);

  function coordinates(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }

  function finishMask(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!startRef.current) return;
    const end = coordinates(event);
    const x = Math.min(startRef.current.x, end.x), y = Math.min(startRef.current.y, end.y);
    const width = Math.abs(end.x - startRef.current.x), height = Math.abs(end.y - startRef.current.y);
    startRef.current = null;
    if (width > 0.008 && height > 0.008) {
      resetQr();
      onClear();
      setRects((previous) => [...previous, { x, y, width, height }]);
    }
  }

  function undoMask() {
    resetQr();
    onClear();
    setRects((prev) => prev.slice(0, -1));
  }

  function clearAllMasks() {
    resetQr();
    onClear();
    setRects([]);
  }

  function resetImage() {
    setImageReady(false);
    imageLoadVersion.current++; renderVersionRef.current++;
    resetQr();
    if (source) URL.revokeObjectURL(source);
    setSource("");
    setRects([]);
    originalRef.current = null;
    setDimensions({ width: 0, height: 0 });
    onClear();
  }

  return (
    <div className="redactor">
      {!source ? (
        <label
          className={`dropzone ${isDragging ? "is-dragover" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) loadImage(file);
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) loadImage(file);
            }}
          />
          <span className="drop-icon"><UploadCloud size={28} /></span>
          <strong>Tải lên hoặc kéo thả ảnh chụp màn hình</strong>
          <small>Hỗ trợ JPEG, PNG, WebP · Dung lượng tối đa 10 MiB · Có thể bấm Ctrl+V để dán trực tiếp</small>
        </label>
      ) : (
        <div className="redactor-preview-shell">
          <div className="redactor-toolbar">
            <span className="redactor-status-badge">
              <Check size={14} /> Ảnh đã chọn · rà soát trước khi gửi
            </span>
            <div className="redactor-actions">
              <button type="button" className="toolbar-btn" onClick={readQr} disabled={qrBusy || !imageReady}>{qrBusy ? "Đang đọc QR…" : "Đọc QR trên thiết bị"}</button>
              <button type="button" className="toolbar-btn" aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "Thu gọn ảnh" : "Phóng to ảnh"}</button>
              {rects.length > 0 && (
                <>
                  <button type="button" className="toolbar-btn" onClick={undoMask} title="Hoàn tác vùng che vừa vẽ">
                    <RotateCcw size={13} /> Hoàn tác che ({rects.length})
                  </button>
                  <button type="button" className="toolbar-btn text-danger" onClick={clearAllMasks} title="Xóa tất cả vùng đã che">
                    <Trash2 size={13} /> Xóa che
                  </button>
                </>
              )}
              <button type="button" className="toolbar-btn" onClick={resetImage} title="Chọn ảnh khác">
                <ImageIcon size={13} /> Đổi ảnh khác
              </button>
            </div>
          </div>

          <div className={expanded ? "canvas-shell is-expanded" : "canvas-shell"}>
            <canvas
              ref={canvasRef}
              className="redact-canvas"
              tabIndex={0}
              onPointerDown={(event) => {
                event.preventDefault();
                startRef.current = coordinates(event);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (startRef.current) event.preventDefault();
              }}
              onPointerUp={finishMask}
              onPointerCancel={() => {
                startRef.current = null;
              }}
              aria-label="Ảnh xem trước; kéo để che vùng nhạy cảm nếu muốn. Bấm Quét dấu hiệu lừa đảo để phân tích."
            />
          </div>
          {qrText && <div className="qr-result"><strong>Nội dung QR đọc trên thiết bị</strong><pre>{qrText}</pre><p>Đây là dữ liệu trong mã; chưa xác minh người nhận hoặc đích đến. Chưa có nội dung QR nào được gửi cho AI.</p>{onQrContent && <button type="button" className="secondary-button" onClick={() => onQrContent(qrText)}>Đưa nội dung QR vào bản xem trước</button>}</div>}
          {qrFeedback && <p className="micro-note" role="status">{qrFeedback}</p>}
          <p className="micro-note redact-hint">
            💡 <strong>Tùy chọn bảo vệ quyền riêng tư:</strong> Kéo chuột trên ảnh để vẽ ô che số tài khoản, tên riêng hoặc số dư trước khi gửi (nếu cần).
          </p>
        </div>
      )}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}
