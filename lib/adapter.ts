// The bench adapter: the one seam between the page and the attack code.
// No process.env here; the mode is decided on the server (lib/adapter-mode.ts) and passed in.
// Uploaded files go through measure() inside the tab and never leave it, in either mode.

import { fakeBenchAdapter } from "./adapter.fake";
import { realBenchAdapter } from "./adapter.real";
import type { AdapterMode, BenchResult, DefenseSettings, Measurement, RunnerProfile, RunnerSummary, Track, XY } from "./types";

export interface BenchAdapter {
  mode: AdapterMode;
  listRunners(): RunnerSummary[];
  loadSample(id: string): { profile: RunnerProfile; tracks: Track[] };
  /** Synchronous, main thread. Used once, for the server-rendered first paint. */
  measureNow(tracks: XY[][], trueHome: XY | null, s: DefenseSettings, seed: number): BenchResult;
  /** Asynchronous. Fake: main thread. Real: Web Worker with timeout, one retry and fallback. */
  measure(tracks: XY[][], trueHome: XY | null, s: DefenseSettings, seed: number): Promise<Measurement>;
}

export { fakeBenchAdapter };

/** The only branch on the adapter mode in the codebase. */
export function createBenchAdapter(mode: AdapterMode): BenchAdapter {
  return mode === "real" ? realBenchAdapter : fakeBenchAdapter;
}
