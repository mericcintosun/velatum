// Server only: reads ADAPTER_MODE. Import this from server components and route handlers,
// never from a "use client" file. lib/adapter.ts stays free of process.env.
//
// The default is "real": the bench runs in a Web Worker in the visitor's tab, with a timeout,
// one retry and a main-thread fallback inside lib/adapter.real.ts. Only an explicit
// ADAPTER_MODE=fake forces the main-thread bench (for debugging or a worker-free browser test).

import type { AdapterMode } from "./types";

export function getAdapterMode(): AdapterMode {
  return process.env.ADAPTER_MODE === "fake" ? "fake" : "real";
}
