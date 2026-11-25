// The bench adapter: the one seam between the page and the attack code.
// No process.env here; the mode is decided on the server (lib/adapter-mode.ts) and passed in.
// Uploaded files go through measure() inside the tab and never leave it, in either mode.

import { fakeBenchAdapter } from "./adapter.fake";
import { realBenchAdapter } from "./adapter.real";
import { NULL_ISLAND, makePlane } from "./geo";
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

/** A seeded sample runner, projected onto the plane the bench measures in. */
export interface SampleSubject {
  profile: RunnerProfile;
  tracks: Track[];
  xy: XY[][];
  trueHome: XY | null;
  seed: number;
}

/**
 * Builds the measure subject for one sample runner. Shared by the bench (cell A to C) and the
 * roll call (cell F), so both measure exactly the same points.
 */
export function sampleSubject(adapter: BenchAdapter, id: string): SampleSubject {
  const { profile, tracks } = adapter.loadSample(id);
  const plane = makePlane(NULL_ISLAND);
  return {
    profile,
    tracks,
    xy: tracks.map((t) => t.points.map((p) => plane.toXY(p))),
    trueHome: { x: profile.homeEast, y: profile.homeNorth },
    seed: profile.seed,
  };
}

/** The only branch on the adapter mode in the codebase. */
export function createBenchAdapter(mode: AdapterMode): BenchAdapter {
  return mode === "real" ? realBenchAdapter : fakeBenchAdapter;
}
