import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getAuthenticatedUser: mocks.auth }));

beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle, insert: mocks.insert };
  mocks.from.mockReturnValue(query); mocks.select.mockReturnValue(query); mocks.eq.mockReturnValue(query);
  mocks.insert.mockResolvedValue({ error: null });
  mocks.auth.mockResolvedValue({ configured: true, user: { id: "user-1" }, client: { from: mocks.from } });
});
afterEach(() => vi.clearAllMocks());

const report = {
  schemaVersion: "1.0", id: "849e4317-74ef-4d17-b81a-6e04e5470bf2", createdAt: "2026-10-22T10:00:00.000Z", type: "message", riskLevel: "insufficient",
  summary: "Chưa đủ dữ liệu.", findings: [], checklist: [], limitations: [], source: { id: "s1", content: "Nội dung mẫu", confirmedOcr: false }, model: { text: "fixture" },
};

function post() {
  return POST(new Request("https://scamlens.test/api/reports", { method: "POST", headers: { origin: "https://scamlens.test", "content-type": "application/json" }, body: JSON.stringify({ report }) }));
}

describe("POST /api/reports", () => {
  it("returns the same saved report idempotently without requesting database update permission", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: report.id }, error: null });
    const response = await post();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: report.id, saved: true, alreadySaved: true });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("inserts a new report after confirming the id is not already owned", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await post();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: report.id, saved: true });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ id: report.id, user_id: "user-1" }));
  });
});
