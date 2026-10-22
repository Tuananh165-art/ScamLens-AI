import { describe, expect, it } from "vitest";
import { detectLiveHeuristics } from "./heuristics";

describe("local live heuristics", () => {
  it("reports contextual signals and stays empty on an ordinary message", () => {
    expect(detectLiveHeuristics("Cán bộ VNeID yêu cầu hoàn tất trước 16h30, gửi mã OTP.")).toHaveLength(3);
    expect(detectLiveHeuristics("Chiều nay mình gặp ở quán cà phê nhé.")).toEqual([]);
  });
});
