import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { EvaluationRecord } from "./contracts";

export const BUDGET_TOTAL_USD = 5;
export const BUDGET_TYPESAFE_USD = 1;
export const BUDGET_DEEPSEEK_USD = 4;
export const TYPESAFE_INPUT_USD_PER_MILLION = 0.042;
export const DEEPSEEK_INPUT_USD_PER_MILLION = 0.3;
export const DEEPSEEK_OUTPUT_USD_PER_MILLION = 1.2;
export const MAX_REQUEST_BYTES = 12_000;
export const DEEPSEEK_MAX_OUTPUT_TOKENS = 3_200;

export type BudgetLedger = {
  version: 1;
  spentUsd: number;
  uncertainUsd: number;
  calls: EvaluationRecord[];
};

export function estimateProviderCost(provider: "typesafe" | "deepseek-ai", requestBytes: number) {
  if (!Number.isInteger(requestBytes) || requestBytes < 0 || requestBytes > MAX_REQUEST_BYTES) throw new Error("jev_request_exceeds_budget_bound");
  const inputTokenUpperBound = requestBytes + 512;
  const cost = provider === "typesafe"
    ? inputTokenUpperBound * TYPESAFE_INPUT_USD_PER_MILLION / 1_000_000
    : (inputTokenUpperBound * DEEPSEEK_INPUT_USD_PER_MILLION + DEEPSEEK_MAX_OUTPUT_TOKENS * DEEPSEEK_OUTPUT_USD_PER_MILLION) / 1_000_000;
  return Number(cost.toFixed(8));
}

export function actualProviderCost(provider: "typesafe" | "deepseek-ai", inputTokens: number, outputTokens: number) {
  return provider === "typesafe"
    ? inputTokens * TYPESAFE_INPUT_USD_PER_MILLION / 1_000_000
    : (inputTokens * DEEPSEEK_INPUT_USD_PER_MILLION + outputTokens * DEEPSEEK_OUTPUT_USD_PER_MILLION) / 1_000_000;
}

export function createEmptyLedger(): BudgetLedger {
  return { version: 1, spentUsd: 0, uncertainUsd: 0, calls: [] };
}

export async function readLedger(path: string): Promise<BudgetLedger> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    if (!parsed || typeof parsed !== "object") throw new Error("jev_invalid_ledger");
    const ledger = parsed as BudgetLedger;
    if (ledger.version !== 1 || !Number.isFinite(ledger.spentUsd) || !Number.isFinite(ledger.uncertainUsd) || !Array.isArray(ledger.calls)) throw new Error("jev_invalid_ledger");
    return ledger;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return createEmptyLedger();
    throw error;
  }
}

export async function writeLedger(path: string, ledger: BudgetLedger) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(ledger, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, path);
}

export function assertCanSpend(ledger: BudgetLedger, provider: "typesafe" | "deepseek-ai", reserveUsd: number) {
  const providerCalls = ledger.calls.filter((call) => call.provider === (provider === "typesafe" ? "typesafe" : "deepseek-ai"));
  const providerSpent = providerCalls.reduce((sum, call) => sum + call.estimatedCostUsd, 0);
  const providerLimit = provider === "typesafe" ? BUDGET_TYPESAFE_USD : BUDGET_DEEPSEEK_USD;
  if (reserveUsd + providerSpent > providerLimit + 1e-9) throw new Error("jev_provider_budget_exceeded");
  if (ledger.spentUsd + ledger.uncertainUsd + reserveUsd > BUDGET_TOTAL_USD + 1e-9) throw new Error("jev_total_budget_exceeded");
}
