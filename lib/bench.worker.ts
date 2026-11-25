// The Web Worker that runs the attack bench off the main thread. Every message is parsed
// with BenchRequestSchema before anything else happens. Replies are { id, ok: true, result, ms }
// or { id, ok: false, error, hint }. No stack trace, coordinate or file content is ever posted
// or logged.

import { runBench } from "./attack";
import { LOG_PREFIX } from "./config";
import { BENCH_HINTS } from "./errors";
import { BenchRequestSchema } from "./schemas";

const ctx = self as unknown as { onmessage: ((e: MessageEvent) => void) | null; postMessage(m: unknown): void };

function idOf(data: unknown): number {
  if (typeof data === "object" && data !== null) {
    const id = (data as { id?: unknown }).id;
    if (typeof id === "number" && Number.isInteger(id)) return id;
  }
  return -1;
}

ctx.onmessage = (e: MessageEvent) => {
  const parsed = BenchRequestSchema.safeParse(e.data);
  if (!parsed.success) {
    const id = idOf(e.data);
    console.warn(`${LOG_PREFIX} worker invalid-input id=${id} issues=${parsed.error.issues.length}`);
    ctx.postMessage({ id, ok: false, error: "invalid-input", hint: BENCH_HINTS["invalid-input"] });
    return;
  }
  const req = parsed.data;
  try {
    const t0 = performance.now();
    const result = runBench(req.tracks, req.trueHome, req.settings, req.seed);
    ctx.postMessage({ id: req.id, ok: true, result, ms: performance.now() - t0 });
  } catch {
    console.warn(`${LOG_PREFIX} worker worker-error id=${req.id}`);
    ctx.postMessage({ id: req.id, ok: false, error: "worker-error", hint: BENCH_HINTS["worker-error"] });
  }
};
