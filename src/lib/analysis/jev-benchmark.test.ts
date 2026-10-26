import { describe, expect, it, vi } from "vitest";
import { createCorpus, createEvidencePairs, splitCorpus, splitEvidencePairs } from "../../../scripts/jev/corpus";
import { assertCanSpend, BUDGET_DEEPSEEK_USD, BUDGET_TOTAL_USD, BUDGET_TYPESAFE_USD, createEmptyLedger, estimateProviderCost, MAX_REQUEST_BYTES } from "../../../scripts/jev/budget";
import { CLASSIFICATION_QUESTIONS, assessEvidence, assessSignals, evidenceRequest, isSignalPositive } from "../../../scripts/jev/jev-client";
import { evaluateEvidence, evaluateSignals, summarize } from "../../../scripts/jev/metrics";
import type { EvaluationRecord } from "../../../scripts/jev/contracts";

describe("JEV synthetic benchmark", () => {
  it("creates the agreed 240 records across the three balanced strata and four source types", () => {
    const samples = createCorpus();
    expect(samples).toHaveLength(240);
    for (const group of ["suspicious", "benign", "insufficient"] as const) {
      const selected = samples.filter((sample) => sample.labels.group === group);
      expect(selected).toHaveLength(80);
      for (const type of ["message", "email", "url", "image"] as const) {
        expect(selected.filter((sample) => sample.sourceType === type)).toHaveLength(20);
      }
    }
  });

  it("keeps related paraphrases and variants in one deterministic split", () => {
    const samples = createCorpus();
    const dev = splitCorpus(samples, "dev");
    const test = splitCorpus(samples, "test");
    expect(dev).toHaveLength(60);
    expect(test).toHaveLength(180);
    expect(splitCorpus(samples, "dev").map((sample) => sample.id)).toEqual(dev.map((sample) => sample.id));
    expect(new Set(dev.map((sample) => sample.familyId)).intersection(new Set(test.map((sample) => sample.familyId))).size).toBe(0);
  });

  it("creates and family-splits 120 evidence pairs evenly by expected decision", () => {
    const pairs = createEvidencePairs();
    expect(pairs).toHaveLength(120);
    for (const decision of ["supported", "unsupported", "insufficient"] as const) {
      expect(pairs.filter((pair) => pair.expected === decision)).toHaveLength(40);
    }
    const dev = splitEvidencePairs(pairs, "dev");
    const test = splitEvidencePairs(pairs, "test");
    expect(dev).toHaveLength(30);
    expect(test).toHaveLength(90);
    expect(new Set(dev.map((pair) => pair.familyId)).intersection(new Set(test.map((pair) => pair.familyId))).size).toBe(0);
  });
});

describe("JEV request contracts", () => {
  it("sends only the source fields and seven typed questions, never benchmark labels", async () => {
    const sample = createCorpus().find((item) => item.id === "suspicious-01-plain")!;
    const answers = Object.fromEntries([
      ...["requests_credentials", "requests_payment", "uses_pressure", "claims_authority", "bypasses_official_channel", "promises_guaranteed_return"].map((name) => [name, { type: "noul", noul: 0.9 }]),
      ["sufficiency", { type: "choice", choice: "usable", probabilities: { usable: 0.9, limited: 0.08, unusable: 0.02 }, confidence: 0.85 }],
    ]);
    const systemOne = vi.fn().mockResolvedValue({ answers, model: "jev-1.14.0", usage: { input_tokens: 120, output_tokens: 16 } });
    const result = await assessSignals(sample, { systemOne } as never);

    expect(Object.keys(CLASSIFICATION_QUESTIONS)).toHaveLength(7);
    expect(result.sufficiency).toBe("usable");
    expect(result.probabilities.requests_credentials).toBe(0.9);
    const request = systemOne.mock.calls[0][0];
    expect(request.model).toBe("jev-1.14.0");
    expect(request.state.CONTENT).toContain("OTP");
    expect(JSON.stringify(request)).not.toContain('"labels"');
    expect(JSON.stringify(request)).not.toContain('"suspicious"');
  });

  it("rejects evidence quotes absent from the source before invoking JEV", async () => {
    const pair = createEvidencePairs()[0];
    const systemOne = vi.fn();
    await expect(assessEvidence({ ...pair, quote: "not source evidence" }, { systemOne } as never)).rejects.toThrow("jev_invalid_evidence_pair");
    expect(systemOne).not.toHaveBeenCalled();
  });

  it("validates the finite confidence distribution for evidence decisions", async () => {
    const pair = createEvidencePairs().find((item) => item.expected === "supported")!;
    const systemOne = vi.fn().mockResolvedValue({
      answers: { evidence: { type: "choice", choice: "supported", probabilities: { supported: 0.9, unsupported: 0.05, insufficient: 0.05 }, confidence: 0.85 } },
      model: "jev-1.14.0",
      usage: { input_tokens: 80, output_tokens: 12 },
    });
    await expect(assessEvidence(pair, { systemOne } as never)).resolves.toMatchObject({ decision: "supported", probabilities: { supported: 0.9 } });
    expect(evidenceRequest(pair).state).toHaveProperty("quotedEvidence", pair.quote);
  });

  it("applies explicit positive, negative and uncertain threshold bands", () => {
    expect(isSignalPositive(0.8)).toBe(true);
    expect(isSignalPositive(0.2)).toBe(false);
    expect(isSignalPositive(0.5)).toBe("uncertain");
    expect(() => isSignalPositive(1.1)).toThrow("jev_invalid_threshold");
  });
});

describe("JEV budget and evaluation metrics", () => {
  it("keeps the worst-case full evaluation below the JEV and total caps", () => {
    const samples = createCorpus();
    const pairs = createEvidencePairs();
    const cost = (samples.length + pairs.length) * estimateProviderCost("typesafe", 4_000);
    expect(cost).toBeLessThan(BUDGET_TYPESAFE_USD);
    expect(cost).toBeLessThan(BUDGET_TOTAL_USD);
    expect(estimateProviderCost("deepseek-ai", 4_000)).toBeLessThan(BUDGET_DEEPSEEK_USD / samples.length);
    expect(() => estimateProviderCost("typesafe", MAX_REQUEST_BYTES + 1)).toThrow("jev_request_exceeds_budget_bound");
  });

  it("rejects requests that exceed provider or total budget including unresolved spend", () => {
    const ledger = createEmptyLedger();
    ledger.uncertainUsd = 0.999;
    ledger.calls.push({ sampleId: "uncertain", familyId: "uncertain", provider: "typesafe", model: "jev-1.14.0", outcome: "error", inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0.999, latencyMs: 0, errorCode: "request_in_flight" });
    expect(() => assertCanSpend(ledger, "typesafe", 0.002)).toThrow("jev_provider_budget_exceeded");
    ledger.uncertainUsd = 4.999;
    expect(() => assertCanSpend(ledger, "deepseek-ai", 0.002)).toThrow("jev_total_budget_exceeded");
  });

  it("scores unsupported baselines only where their output contract has equivalent labels", () => {
    const sample = createCorpus()[0];
    const record: EvaluationRecord = {
      sampleId: sample.id, familyId: sample.familyId, split: "dev", provider: "deepseek-rules", model: "rules",
      outcome: "success", inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, latencyMs: 1,
      signals: { requests_credentials: 1 }, supportedSignals: ["requests_credentials"],
    };
    const scored = evaluateSignals([sample], [record]);
    expect(scored.requests_credentials).toMatchObject({ tp: 1, recall: 1, evaluated: 1 });
    expect(scored.requests_payment.evaluated).toBe(0);
    expect(summarize([record]).successCount).toBe(1);
  });

  it("reports evidence precision, macro F1 and confusion counts from gold labels", () => {
    const allPairs = createEvidencePairs();
    const pairs = ["supported", "unsupported", "insufficient"].map((label) => allPairs.find((pair) => pair.expected === label)!);
    const records: EvaluationRecord[] = pairs.map((pair) => ({
      sampleId: pair.id, familyId: pair.familyId, split: "dev", provider: "typesafe", model: "jev-1.14.0",
      outcome: "success", inputTokens: 50, outputTokens: 6, estimatedCostUsd: 0.0000021, latencyMs: 100,
      evidenceDecision: pair.expected,
    }));
    expect(evaluateEvidence(pairs, records)).toMatchObject({ macroF1: 1, supportedPrecision: 1, evaluated: 3 });
  });
});
