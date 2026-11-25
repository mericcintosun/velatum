// The real bench adapter: the same runBench, computed in a Web Worker so dragging a slider
// never blocks the page. Every reply is validated with zod. One attempt may take at most
// WORKER_TIMEOUT_MS; a timeout or error terminates the worker, starts a fresh one and retries
// exactly WORKER_RETRIES times. If that fails too, runBench runs on the main thread and the
// result says so. The bench never renders empty.
//
// Only lib/adapter.ts imports this file. The worker is created lazily on the first measure,
// never at module load, so server rendering never touches it.

import type { BenchAdapter } from "./adapter";
import { sharedBench } from "./adapter.fake";
import { runBench, type BenchResult, type DefenseSettings } from "./attack";
import { LOG_PREFIX, WORKER_RETRIES, WORKER_TIMEOUT_MS } from "./config";
import { benchError, type BenchError, type BenchErrorCode } from "./errors";
import type { XY } from "./geo";
import { BenchReplySchema, type BenchRequest } from "./schemas";
import type { Measurement } from "./types";

type Attempt = { ok: true; result: BenchResult; ms: number } | { ok: false; error: BenchError };

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./bench.worker.ts", import.meta.url), { type: "module" });
  }
  return worker;
}

function dropWorker(): void {
  if (worker) worker.terminate();
  worker = null;
}

function fail(code: BenchErrorCode): Attempt {
  return { ok: false, error: benchError(code) };
}

function attemptOnce(req: BenchRequest): Promise<Attempt> {
  return new Promise((resolve) => {
    if (typeof Worker === "undefined") {
      resolve(fail("not-configured"));
      return;
    }
    let w: Worker;
    try {
      w = getWorker();
    } catch {
      resolve(fail("not-configured"));
      return;
    }
    let settled = false;
    const finish = (a: Attempt) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      w.removeEventListener("messageerror", onMessageError);
      resolve(a);
    };
    const onMessage = (e: MessageEvent) => {
      const parsed = BenchReplySchema.safeParse(e.data);
      if (!parsed.success) {
        finish(fail("parse-failure"));
        return;
      }
      const reply = parsed.data;
      if (reply.id !== req.id) return; // an answer to an older request on the same worker
      if (reply.ok) finish({ ok: true, result: reply.result, ms: reply.ms });
      else finish({ ok: false, error: { error: reply.error, hint: reply.hint } });
    };
    const onError = (e: Event) => {
      e.preventDefault();
      finish(fail("worker-error"));
    };
    const onMessageError = () => finish(fail("parse-failure"));
    const timer = window.setTimeout(() => finish(fail("worker-timeout")), WORKER_TIMEOUT_MS);
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.addEventListener("messageerror", onMessageError);
    try {
      w.postMessage(req);
    } catch {
      finish(fail("worker-error"));
    }
  });
}

async function measureInWorker(
  tracks: XY[][],
  trueHome: XY | null,
  settings: DefenseSettings,
  seed: number
): Promise<Measurement> {
  const id = nextId++;
  const points = tracks.reduce((n, t) => n + t.length, 0);
  console.info(`${LOG_PREFIX} measure requested id=${id} tracks=${tracks.length} points=${points}`);
  const req: BenchRequest = { id, tracks, trueHome, settings, seed };

  let last: BenchError = benchError("worker-error");
  // One first attempt plus exactly WORKER_RETRIES retries, each on a fresh worker.
  for (let attempt = 0; attempt <= WORKER_RETRIES; attempt++) {
    const out = await attemptOnce(req);
    if (out.ok) {
      console.info(`${LOG_PREFIX} worker ok id=${id} ms=${Math.round(out.ms)}`);
      return { result: out.result, engine: "worker", ms: out.ms, fallback: null };
    }
    last = out.error;
    // No worker can exist in this browser, and bad input stays bad: retrying cannot help.
    if (last.error === "not-configured" || last.error === "invalid-input") break;
    dropWorker();
    if (attempt < WORKER_RETRIES) console.warn(`${LOG_PREFIX} worker retry id=${id} code=${last.error}`);
  }

  console.warn(`${LOG_PREFIX} fallback main-thread code=${last.error}`);
  const t0 = performance.now();
  const result = runBench(tracks, trueHome, settings, seed);
  return { result, engine: "main-thread-fallback", ms: performance.now() - t0, fallback: last };
}

export const realBenchAdapter: BenchAdapter = {
  mode: "real",
  ...sharedBench,
  measure(tracks, trueHome, s, seed) {
    return measureInWorker(tracks, trueHome, s, seed);
  },
};
