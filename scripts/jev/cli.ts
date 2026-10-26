import { loadEnvConfig } from "@next/env";
import { open, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createCorpus, createEvidencePairs, splitCorpus, splitEvidencePairs } from "./corpus";
import { BUDGET_DEEPSEEK_USD, BUDGET_TOTAL_USD, BUDGET_TYPESAFE_USD, MAX_REQUEST_BYTES, actualProviderCost, assertCanSpend, estimateProviderCost, readLedger, writeLedger, type BudgetLedger } from "./budget";
import type { EvaluationRecord, EvaluationSplit } from "./contracts";
import { assessEvidence, assessSignals, classificationRequest, evidenceRequest } from "./jev-client";
import { evaluateEvidence, evaluateSignals, summarize } from "./metrics";
import { deepSeekPayloadForEstimate, runDeepSeekBaseline, runRulesBaseline } from "./deepseek-baseline";

loadEnvConfig(process.cwd());

const OUT = join(process.cwd(), ".jev-local");
const LEDGER = join(OUT, "ledger.json");
const RESULTS = join(OUT, "results.json");
const MODEL = process.env.TYPESAFE_MODEL?.trim() || "jev-1.14.0";
type Task = "all" | "signals" | "evidence";
type CliOptions = { command: "dry-run" | "smoke" | "eval" | "report"; split: EvaluationSplit; task: Task; live: boolean; deepseekLive: boolean; limit?: number };

function fail(message: string): never { throw new Error(message); }

function parseOptions(args: string[]): CliOptions {
  const command = args[0] ?? "dry-run";
  if (!["dry-run", "smoke", "eval", "report"].includes(command)) fail("jev_usage_invalid");
  const option = (name: string) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  const split = option("--split") ?? "dev";
  const task = option("--task") ?? "all";
  const limitText = option("--limit");
  if (split !== "dev" && split !== "test") fail("jev_split_invalid");
  if (task !== "all" && task !== "signals" && task !== "evidence") fail("jev_task_invalid");
  if (limitText !== undefined && (!/^\d+$/.test(limitText) || Number(limitText) < 1)) fail("jev_limit_invalid");
  return {
    command: command as CliOptions["command"],
    split: split as EvaluationSplit,
    task: command === "smoke" ? "all" : task as Task,
    live: args.includes("--live"),
    deepseekLive: args.includes("--deepseek-live"),
    ...(command === "smoke" ? { limit: 3 } : limitText ? { limit: Number(limitText) } : {}),
  };
}

function assertLiveReady(provider: "typesafe" | "deepseek-ai") {
  if (provider === "typesafe") {
    if (process.env.TYPESAFE_KEY_ROTATED !== "true") fail("live_blocked_rotate_key_and_set_TYPESAFE_KEY_ROTATED_true");
    if (!process.env.TYPESAFE_API_KEY?.trim()) fail("typesafe_not_configured");
    if (MODEL !== "jev-1.14.0") fail("typesafe_model_must_be_pinned");
    const baseURL = process.env.TYPESAFE_BASE_URL?.trim() || "https://api.typesafe.ai";
    if (new URL(baseURL).protocol !== "https:") fail("typesafe_https_required");
  } else if (!process.env.DEEPSEEK_API_KEY?.trim() || !process.env.DEEPSEEK_MODEL?.trim()) {
    fail("deepseek_not_configured");
  }
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, path);
}

async function readResults(): Promise<EvaluationRecord[]> {
  try {
    const value: unknown = JSON.parse(await readFile(RESULTS, "utf8"));
    return Array.isArray(value) ? value as EvaluationRecord[] : fail("jev_results_invalid");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function needsRun(records: EvaluationRecord[], provider: EvaluationRecord["provider"], split: EvaluationSplit, sampleId: string) {
  return !records.some((record) => record.provider === provider && record.split === split && record.sampleId === sampleId && record.outcome === "success");
}

function safeErrorCode(error: unknown) {
  if (error instanceof Error && /^[a-z0-9_]{1,64}$/.test(error.message)) return error.message;
  return error instanceof Error ? error.name : "unknown_error";
}

async function callWithBudget<T extends { inputTokens: number; outputTokens: number; model: string; latencyMs: number }>(input: {
  provider: "typesafe" | "deepseek-ai";
  split: EvaluationSplit;
  sampleId: string;
  familyId: string;
  payloadForEstimate: unknown;
  ledger: BudgetLedger;
  invoke: () => Promise<T>;
  extra?: (result: T) => Pick<EvaluationRecord, "signals" | "supportedSignals" | "sufficiency" | "evidenceDecision">;
}) {
  const requestBytes = Buffer.byteLength(JSON.stringify(input.payloadForEstimate), "utf8");
  if (requestBytes > MAX_REQUEST_BYTES) fail("jev_request_exceeds_budget_bound");
  const reserveUsd = estimateProviderCost(input.provider, requestBytes);
  assertCanSpend(input.ledger, input.provider, reserveUsd);
  const reservationIndex = input.ledger.calls.length;
  input.ledger.uncertainUsd = Number((input.ledger.uncertainUsd + reserveUsd).toFixed(8));
  input.ledger.calls.push({
    sampleId: input.sampleId, familyId: input.familyId, split: input.split,
    provider: input.provider === "typesafe" ? "typesafe" : "deepseek-ai",
    model: input.provider === "typesafe" ? MODEL : process.env.DEEPSEEK_MODEL || "unknown",
    outcome: "error", inputTokens: 0, outputTokens: 0, estimatedCostUsd: reserveUsd,
    latencyMs: 0, errorCode: "request_in_flight",
  });
  await writeLedger(LEDGER, input.ledger);

  try {
    const response = await input.invoke();
    const cost = actualProviderCost(input.provider, response.inputTokens, response.outputTokens);
    const record: EvaluationRecord = {
      sampleId: input.sampleId, familyId: input.familyId, split: input.split,
      provider: input.provider === "typesafe" ? "typesafe" : "deepseek-ai",
      model: response.model, outcome: "success", inputTokens: response.inputTokens,
      outputTokens: response.outputTokens, estimatedCostUsd: cost,
      latencyMs: response.latencyMs, ...input.extra?.(response),
    };
    input.ledger.uncertainUsd = Math.max(0, Number((input.ledger.uncertainUsd - reserveUsd).toFixed(8)));
    input.ledger.spentUsd = Number((input.ledger.spentUsd + cost).toFixed(8));
    input.ledger.calls[reservationIndex] = record;
    await writeLedger(LEDGER, input.ledger);
    return record;
  } catch (error) {
    // A timeout can happen after the provider accepted a billed request; keep the full reservation held.
    input.ledger.calls[reservationIndex].errorCode = safeErrorCode(error);
    await writeLedger(LEDGER, input.ledger);
    throw error;
  }
}

function samplesFor(split: EvaluationSplit, limit?: number) {
  const samples = splitCorpus(createCorpus(), split);
  return limit ? samples.slice(0, limit) : samples;
}
function pairsFor(split: EvaluationSplit, limit?: number) {
  const pairs = splitEvidencePairs(createEvidencePairs(), split);
  return limit ? pairs.slice(0, limit) : pairs;
}

async function dryRun(options: CliOptions) {
  const ledger = await readLedger(LEDGER);
  const results = await readResults();
  const samples = options.task === "evidence" ? [] : samplesFor(options.split, options.limit);
  const pairs = options.task === "signals" ? [] : pairsFor(options.split, options.limit);
  const estimates = { typesafe: 0, deepseek: 0 };
  for (const sample of samples) {
    estimates.typesafe += estimateProviderCost("typesafe", Buffer.byteLength(JSON.stringify(classificationRequest(sample)), "utf8"));
    if (options.deepseekLive) {
      estimates.deepseek += estimateProviderCost("deepseek-ai", Buffer.byteLength(JSON.stringify(deepSeekPayloadForEstimate(sample)), "utf8"));
    }
  }
  for (const pair of pairs) estimates.typesafe += estimateProviderCost("typesafe", Buffer.byteLength(JSON.stringify(evidenceRequest(pair)), "utf8"));
  const estimatesWithPrior = {
    typesafe: Number((estimates.typesafe + ledger.calls.filter((r) => r.provider === "typesafe").reduce((sum, r) => sum + r.estimatedCostUsd, 0)).toFixed(6)),
    deepseek: Number((estimates.deepseek + ledger.calls.filter((r) => r.provider === "deepseek-ai").reduce((sum, r) => sum + r.estimatedCostUsd, 0)).toFixed(6)),
  };
  const output = {
    mode: "dry-run", split: options.split, task: options.task, model: MODEL,
    counts: { classificationSamples: samples.length, evidencePairs: pairs.length },
    upperBoundUsdIncludingLedger: { ...estimatesWithPrior, total: Number((estimatesWithPrior.typesafe + estimatesWithPrior.deepseek + ledger.uncertainUsd).toFixed(6)) },
    limitsUsd: { total: BUDGET_TOTAL_USD, typesafe: BUDGET_TYPESAFE_USD, deepseek: BUDGET_DEEPSEEK_USD },
    ledger: { spentUsd: ledger.spentUsd, uncertainUsd: ledger.uncertainUsd },
    alreadyRecorded: results.length,
    privacy: "Synthetic fixtures only; labels are not sent to a provider.",
  };
  console.log(JSON.stringify(output, null, 2));
  if (estimatesWithPrior.typesafe + ledger.uncertainUsd > BUDGET_TYPESAFE_USD) fail("jev_provider_budget_exceeded");
  if (estimatesWithPrior.deepseek + ledger.uncertainUsd > BUDGET_DEEPSEEK_USD) fail("deepseek_provider_budget_exceeded");
  if (estimatesWithPrior.typesafe + estimatesWithPrior.deepseek + ledger.uncertainUsd > BUDGET_TOTAL_USD) fail("jev_total_budget_exceeded");
}

async function acquireLock() {
  await mkdir(OUT, { recursive: true });
  const path = join(OUT, "live.lock");
  const handle = await open(path, "wx", 0o600).catch(() => fail("jev_live_process_already_running"));
  await handle.writeFile(String(process.pid));
  await handle.close();
  return async () => { await unlink(path).catch(() => undefined); };
}

async function liveSmoke() {
  const samples = createCorpus().filter((sample) => sample.variant === "plain" && ["suspicious-01", "benign-01", "insufficient-01"].includes(sample.familyId));
  const pairs = createEvidencePairs().filter((pair) => pair.id.endsWith("-01"));
  const ledger = await readLedger(LEDGER);
  const records = await readResults();
  for (const sample of samples) {
    if (!needsRun(records, "typesafe", "dev", sample.id)) continue;
    const record = await callWithBudget({ provider: "typesafe", split: "dev", sampleId: sample.id, familyId: sample.familyId, payloadForEstimate: classificationRequest(sample), ledger, invoke: () => assessSignals(sample), extra: (value) => ({ signals: value.probabilities, sufficiency: value.sufficiency }) });
    records.push(record); await writeJsonAtomic(RESULTS, records);
    console.log(JSON.stringify({ sampleId: record.sampleId, provider: record.provider, model: record.model, tokens: record.inputTokens + record.outputTokens }));
  }
  for (const pair of pairs) {
    if (!needsRun(records, "typesafe", "dev", pair.id)) continue;
    const record = await callWithBudget({ provider: "typesafe", split: "dev", sampleId: pair.id, familyId: pair.familyId, payloadForEstimate: evidenceRequest(pair), ledger, invoke: () => assessEvidence(pair), extra: (value) => ({ evidenceDecision: value.decision }) });
    records.push(record); await writeJsonAtomic(RESULTS, records);
    console.log(JSON.stringify({ sampleId: record.sampleId, provider: record.provider, model: record.model, tokens: record.inputTokens + record.outputTokens }));
  }
  console.log(JSON.stringify({ mode: "live-smoke-complete", classificationSamples: samples.length, evidencePairs: pairs.length, spentUsd: ledger.spentUsd, uncertainUsd: ledger.uncertainUsd }));
}

async function liveEvaluation(options: CliOptions) {
  const samples = options.task === "evidence" ? [] : samplesFor(options.split, options.limit);
  const pairs = options.task === "signals" ? [] : pairsFor(options.split, options.limit);
  const ledger = await readLedger(LEDGER);
  const records = await readResults();
  for (const sample of samples) {
    const ruleRecord = await runRulesBaseline(sample);
    ruleRecord.split = options.split;
    if (needsRun(records, "deepseek-rules", options.split, sample.id)) records.push(ruleRecord);
    if (needsRun(records, "typesafe", options.split, sample.id)) {
      const result = await callWithBudget({ provider: "typesafe", split: options.split, sampleId: sample.id, familyId: sample.familyId, payloadForEstimate: classificationRequest(sample), ledger, invoke: () => assessSignals(sample), extra: (value) => ({ signals: value.probabilities, sufficiency: value.sufficiency }) });
      records.push(result); await writeJsonAtomic(RESULTS, records);
    }
    if (options.deepseekLive && needsRun(records, "deepseek-ai", options.split, sample.id)) {
      const result = await callWithBudget({ provider: "deepseek-ai", split: options.split, sampleId: sample.id, familyId: sample.familyId, payloadForEstimate: deepSeekPayloadForEstimate(sample), ledger, invoke: () => runDeepSeekBaseline(sample), extra: (value) => ({ signals: value.signals, supportedSignals: value.supportedSignals, sufficiency: value.sufficiency }) });
      records.push(result); await writeJsonAtomic(RESULTS, records);
    }
    await writeJsonAtomic(RESULTS, records);
  }
  for (const pair of pairs) {
    if (needsRun(records, "typesafe", options.split, pair.id)) {
      const result = await callWithBudget({ provider: "typesafe", split: options.split, sampleId: pair.id, familyId: pair.familyId, payloadForEstimate: evidenceRequest(pair), ledger, invoke: () => assessEvidence(pair), extra: (value) => ({ evidenceDecision: value.decision }) });
      records.push(result); await writeJsonAtomic(RESULTS, records);
    }
  }
  console.log(JSON.stringify({ mode: "live-evaluation-complete", split: options.split, task: options.task, records: records.length, spentUsd: ledger.spentUsd, uncertainUsd: ledger.uncertainUsd }));
}

async function report() {
  const results = await readResults();
  const reportData: Record<string, unknown> = { version: 1, generatedAt: new Date().toISOString(), model: MODEL, threshold: 0.8, splits: {} };
  for (const split of ["dev", "test"] as const) {
    const splitResults = results.filter((record) => record.split === split);
    const providers: Record<string, unknown> = {};
    for (const provider of ["typesafe", "deepseek-rules", "deepseek-ai"] as const) {
      const records = splitResults.filter((record) => record.provider === provider);
      const samples = createCorpus().filter((sample) => records.some((record) => record.sampleId === sample.id));
      const pairs = createEvidencePairs().filter((pair) => records.some((record) => record.sampleId === pair.id));
      providers[provider] = {
        ...summarize(records),
        signals: evaluateSignals(samples, records.filter((record) => record.signals), 0.8),
        evidence: evaluateEvidence(pairs, records),
        limitations: provider === "typesafe" ? [] : ["Legacy baselines expose four of the six semantic indicators; remaining signals are reported as unavailable."],
      };
    }
    (reportData.splits as Record<string, unknown>)[split] = { count: splitResults.length, providers };
  }
  await writeJsonAtomic(join(OUT, "report.json"), reportData);
  console.log(JSON.stringify(reportData, null, 2));
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.command === "report") return report();
  if (!options.live) {
    if (options.command === "smoke") {
      console.log(JSON.stringify({ mode: "dry-run", action: "smoke", model: MODEL, classificationSamples: 3, evidencePairs: 3 }));
      return;
    }
    return dryRun(options);
  }
  assertLiveReady("typesafe");
  if (options.command === "smoke" && options.deepseekLive) fail("jev_smoke_deepseek_not_supported");
  if (options.deepseekLive) assertLiveReady("deepseek-ai");
  const release = await acquireLock();
  try {
    if (options.command === "smoke") await liveSmoke();
    else await liveEvaluation(options);
  } finally { await release(); }
}

main().catch((error: unknown) => {
  const code = safeErrorCode(error);
  console.error(JSON.stringify({
    error: code,
    help: code === "live_blocked_rotate_key_and_set_TYPESAFE_KEY_ROTATED_true"
      ? "Revoke the key exposed in chat, replace it locally, then set TYPESAFE_KEY_ROTATED=true in .env."
      : undefined,
  }));
  process.exitCode = 1;
});
