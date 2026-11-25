// Server only: reads ADAPTER_MODE. Import this from server components and route handlers,
// never from a "use client" file. lib/adapter.ts stays free of process.env.

import type { AdapterMode } from "./types";

export function getAdapterMode(): AdapterMode {
  return process.env.ADAPTER_MODE === "real" ? "real" : "fake";
}
