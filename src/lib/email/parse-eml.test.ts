// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { parseEml, MAX_EML_BYTES } from "./parse-eml";
import { POST } from "@/app/api/import-email/route";

const eml = [
  "From: Meta Support <notice@sender.example>", "Reply-To: appeal@other.example",
  "Subject: =?UTF-8?B?VGjDtG5nIGLDoW8=?=",
  "Authentication-Results: untrusted.example; spf=pass; dkim=fail; dmarc=none",
  "MIME-Version: 1.0", 'Content-Type: multipart/mixed; boundary="fixture"', "",
  "--fixture", "Content-Type: text/html; charset=UTF-8", "",
  '<p>Kiểm tra hồ sơ</p><img src="https://tracker.example/pixel"><script>alert(1)</script>',
  "--fixture", 'Content-Type: application/javascript; name="sample.js"',
  'Content-Disposition: attachment; filename="sample.js"', "", 'throw new Error("never execute");',
  "--fixture--",
].join("\r\n");

describe("EML import", () => {
  it("extracts structured fields and attachment metadata without rendering HTML or requesting trackers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const result = await parseEml(Buffer.from(eml));
    expect(result.sender).toContain("notice@sender.example");
    expect(result.replyTo).toContain("appeal@other.example");
    expect(result.subject).toBe("Thông báo");
    expect(result.content).toContain("Kiểm tra hồ sơ");
    expect(result).not.toHaveProperty("html");
    expect(result.attachments).toEqual([{ name: "sample.js", size: expect.any(Number) }]);
    expect(result.notes.join(" ")).toContain("chưa được xác minh");
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
  it("rejects malformed or oversized files and cross-origin requests", async () => {
    await expect(parseEml(Buffer.from("not an email"))).rejects.toThrow();
    await expect(parseEml(Buffer.alloc(MAX_EML_BYTES + 1))).rejects.toThrow();
    expect((await POST(new Request("https://app.example/api/import-email", { method: "POST", headers: { origin: "https://other.example" }, body: eml }))).status).toBe(403);
    expect((await POST(new Request("https://app.example/api/import-email", { method: "POST", headers: { origin: "https://app.example" }, body: eml }))).status).toBe(200);
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_EML_BYTES + 1)); controller.close(); } });
    const request = new Request("https://app.example/api/import-email", { method: "POST", headers: { origin: "https://app.example" }, body: stream, duplex: "half" } as RequestInit);
    expect((await POST(request)).status).toBe(413);
  });
});
