import { SIGNAL_IDS, type BenchmarkSample, type EvaluationRecord, type EvidenceDecision, type EvidencePair } from "./contracts";
import { isSignalPositive } from "./jev-client";

export function confusionMatrix<T extends string>(expected: T[], predicted: T[], labels: readonly T[]) {
  if (expected.length !== predicted.length) throw new Error("metric_length_mismatch");
  const matrix = Object.fromEntries(labels.map((a) => [a, Object.fromEntries(labels.map((p) => [p, 0]))]));
  for (let i = 0; i < expected.length; i++) {
    if (!labels.includes(expected[i]) || !labels.includes(predicted[i])) throw new Error("metric_unknown_label");
    matrix[expected[i]][predicted[i]]++;
  }
  return matrix;
}

function binaryMetrics(tp: number, fp: number, fn: number, tn: number) {
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  return { tp, fp, fn, tn, precision, recall, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0 };
}

export function scoreSignal(sample: BenchmarkSample, probability: number, threshold = 0.8) {
  const decision = isSignalPositive(probability, threshold);
  const actual = sample.labels.signals.requests_credentials;
  return { decision, actual, correct: decision !== "uncertain" && decision === actual };
}

export function evaluateSignals(samples: BenchmarkSample[], records: EvaluationRecord[], threshold = 0.8) {
  const byId = new Map(records.map((record) => [record.sampleId, record]));
  return Object.fromEntries(SIGNAL_IDS.map((signal) => {
    let tp = 0, fp = 0, fn = 0, tn = 0, uncertain = 0, brierSum = 0, brierN = 0;
    for (const sample of samples) {
      const record = byId.get(sample.id);
      if (!record || record.outcome !== "success" || !record.signals || (record.supportedSignals && !record.supportedSignals.includes(signal))) continue;
      const probability = record.signals[signal];
      if (probability === undefined) continue;
      const expected = Number(sample.labels.signals[signal]);
      const predicted = isSignalPositive(probability, threshold);
      if (predicted === "uncertain") { uncertain++; if (expected) fn++; else tn++; }
      else if (predicted && expected) tp++;
      else if (predicted && !expected) fp++;
      else if (!predicted && expected) fn++;
      else tn++;
      brierSum += (probability - expected) ** 2;
      brierN++;
    }
    const totals = binaryMetrics(tp, fp, fn, tn);
    const attempted = tp + fp + fn + tn;
    return [signal, { ...totals, uncertain, coverage: attempted ? (attempted - uncertain) / attempted : 0, brierScore: brierN ? brierSum / brierN : null, evaluated: attempted }];
  }));
}

export function evaluateEvidence(pairs: EvidencePair[], records: EvaluationRecord[]) {
  const byId = new Map(records.map((record) => [record.sampleId, record]));
  const labels = ["supported", "unsupported", "insufficient"] as const satisfies readonly EvidenceDecision[];
  const expected: EvidenceDecision[] = [];
  const predicted: EvidenceDecision[] = [];
  for (const pair of pairs) {
    const record = byId.get(pair.id);
    if (!record || record.outcome !== "success" || !record.evidenceDecision) continue;
    expected.push(pair.expected);
    predicted.push(record.evidenceDecision);
  }
  const matrix = confusionMatrix(expected, predicted, labels);
  const perClass = Object.fromEntries(labels.map((label) => {
    const tp = matrix[label][label];
    const fp = labels.reduce((total, actual) => actual === label ? total : total + matrix[actual][label], 0);
    const fn = labels.reduce((total, prediction) => prediction === label ? total : total + matrix[label][prediction], 0);
    const tn = expected.length - tp - fp - fn;
    return [label, binaryMetrics(tp, fp, fn, tn)];
  }));
  return {
    confusion: matrix,
    perClass,
    macroF1: labels.length ? labels.reduce((sum, label) => sum + perClass[label].f1, 0) / labels.length : 0,
    supportedPrecision: perClass.supported.precision,
    evaluated: expected.length,
  };
}

export function summarize(records: EvaluationRecord[]) {
  const successful = records.filter((record) => record.outcome === "success");
  const errors = records.length - successful.length;
  const latencies = successful.map((record) => record.latencyMs).sort((a, b) => a - b);
  const percentile = (p: number) => latencies.length ? latencies[Math.max(0, Math.ceil(p * latencies.length) - 1)] : null;
  return {
    count: records.length,
    successCount: successful.length,
    errorCount: errors,
    estimatedCostUsd: Number(successful.reduce((sum, record) => sum + record.estimatedCostUsd, 0).toFixed(8)),
    inputTokens: successful.reduce((sum, record) => sum + record.inputTokens, 0),
    outputTokens: successful.reduce((sum, record) => sum + record.outputTokens, 0),
    latencyP50Ms: percentile(0.5),
    latencyP95Ms: percentile(0.95),
  };
}
