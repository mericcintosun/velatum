// The one error union of the bench. Failure replies always carry { error, hint }.
// Code branches on `error`, never on the hint text.

export type BenchErrorCode = "invalid-input" | "worker-timeout" | "worker-error" | "parse-failure" | "not-configured";

export interface BenchError {
  error: BenchErrorCode;
  hint: string;
}

export const BENCH_HINTS: Record<BenchErrorCode, string> = {
  "invalid-input": "The recordings were too large or malformed for the background worker, so the bench ran on the page itself.",
  "worker-timeout": "The background worker took too long to answer, so the bench ran on the page itself.",
  "worker-error": "The background worker stopped with an error, so the bench ran on the page itself.",
  "parse-failure": "The background worker sent back an answer the page could not read, so the bench ran on the page itself.",
  "not-configured": "This browser cannot start a background worker, so the bench ran on the page itself.",
};

export function benchError(code: BenchErrorCode): BenchError {
  return { error: code, hint: BENCH_HINTS[code] };
}
