import { describe, expect, it } from "vitest";
import { jevAssessmentSchema } from "./schema";
import { JEV_SIGNAL_IDS } from "@/lib/ai/jev-signals";

const signal = (id: (typeof JEV_SIGNAL_IDS)[number]) => ({ id, probability: 0.05, result: "not_detected" as const });

describe("JEV report compatibility", () => {
  it("continues to read historical six-signal reports", () => {
    const oldIds = ["requests_credentials", "requests_payment", "uses_pressure", "claims_authority", "bypasses_official_channel", "promises_guaranteed_return"] as const;
    expect(jevAssessmentSchema.safeParse({ status: "complete", model: "jev-1.14.0", sufficiency: "limited", signals: oldIds.map(signal) }).success).toBe(true);
  });

  it("accepts the current nine-signal assessment and actual request diagnostics", () => {
    expect(jevAssessmentSchema.safeParse({
      status: "complete", model: "jev-1.14.0", sufficiency: "usable", sufficiencyConfidence: 0.91,
      diagnostics: { latencyMs: 430, inputTokens: 220, outputTokens: 24 },
      signals: JEV_SIGNAL_IDS.map(signal),
    }).success).toBe(true);
  });

  it("rejects duplicate indicators instead of presenting a misleading card count", () => {
    const signals = JEV_SIGNAL_IDS.slice(0, 6).map(signal);
    signals[5] = signal("requests_credentials");
    expect(jevAssessmentSchema.safeParse({ status: "complete", model: "jev-1.14.0", sufficiency: "usable", signals }).success).toBe(false);
  });
});
