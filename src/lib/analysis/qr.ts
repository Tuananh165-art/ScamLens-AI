export async function decodeQrCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const { BrowserQRCodeReader } = await import("@zxing/browser");
  const { DecodeHintType } = await import("@zxing/library");
  // Pixel decoding only: no camera, navigation, remote image or URL request.
  let text: string;
  try {
    text = new BrowserQRCodeReader().decodeFromCanvas(canvas).getText().trim();
  } catch {
    // Clean, axis-aligned QR images can fail perspective finder detection.
    // The pure-barcode path still verifies QR error correction and payload.
    text = new BrowserQRCodeReader(new Map([[DecodeHintType.PURE_BARCODE, true]])).decodeFromCanvas(canvas).getText().trim();
  }
  if (!text || text.length > 20_000) throw new Error("qr_content_limit");
  return text;
}
