"use client";

import { useEffect, useRef, useState } from "react";

type Rect = { x: number; y: number; width: number; height: number };

export function ImageRedactor({ onPrepared, onClear }: { onPrepared(file: File): void; onClear(): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLImageElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const renderVersionRef = useRef(0);
  const onPreparedRef = useRef(onPrepared);
  onPreparedRef.current = onPrepared;
  const [source, setSource] = useState("");
  const [rects, setRects] = useState<Rect[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const image = originalRef.current;
    if (!canvas || !ctx || !image || !dimensions.width || !dimensions.height) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#273043";
    rects.forEach((rect) => ctx.fillRect(rect.x * canvas.width, rect.y * canvas.height, rect.width * canvas.width, rect.height * canvas.height));
    const renderVersion = ++renderVersionRef.current;
    canvas.toBlob((blob) => {
      if (renderVersion !== renderVersionRef.current) return;
      if (!blob) { setError("Không tạo được ảnh đã che."); return; }
      if (blob.size > 3 * 1024 * 1024) { setError("Ảnh sau xử lý còn quá lớn. Hãy chọn ảnh có kích thước nhỏ hơn."); return; }
      setError("");
      onPreparedRef.current(new File([blob], "scamlens-redacted.jpg", { type: "image/jpeg", lastModified: Date.now() }));
    }, "image/jpeg", 0.84);
  }, [source, rects, dimensions]);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);

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
  }, []);

  function loadImage(file: File) {
    renderVersionRef.current += 1;
    onClear();
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Chọn ảnh JPEG, PNG hoặc WebP, dung lượng gốc tối đa 10 MiB."); return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      setDimensions({ width, height });
      setRects([]); originalRef.current = image; setSource(objectUrl);
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); setError("Không thể đọc ảnh này."); };
    image.src = objectUrl;
  }

  function coordinates(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) };
  }

  function finishMask(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!startRef.current) return;
    const end = coordinates(event);
    const x = Math.min(startRef.current.x, end.x), y = Math.min(startRef.current.y, end.y);
    const width = Math.abs(end.x - startRef.current.x), height = Math.abs(end.y - startRef.current.y);
    startRef.current = null;
    if (width > 0.008 && height > 0.008) { onClear(); setRects((previous) => [...previous, { x, y, width, height }]); }
  }

  return <div className="redactor">
    {!source ? <label className="dropzone"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) loadImage(file); }} /><span className="drop-icon">＋</span><strong>Chọn ảnh chụp cần đọc</strong><small>JPEG, PNG hoặc WebP · Tối đa 10 MiB</small></label> : <>
      <div className="canvas-shell"><canvas ref={canvasRef} className="redact-canvas" tabIndex={0} onPointerDown={(event) => { event.preventDefault(); startRef.current = coordinates(event); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (startRef.current) event.preventDefault(); }} onPointerUp={finishMask} onPointerCancel={() => { startRef.current = null; }} aria-label="Ảnh xem trước; kéo để che vùng nhạy cảm. Có thể dán ảnh khi ảnh đang được chọn." /></div>
    </>}
    {error && <p className="inline-error" role="alert">{error}</p>}
  </div>;
}
