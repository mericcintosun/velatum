// The bench adapter: the one seam between the page and the attack code.
// No process.env here; the mode is decided on the server (lib/adapter-mode.ts) and passed in.
// Uploaded files go through measure() inside the tab and never leave it, in either mode.

import { runBench } from "./attack";
import { RUNNERS, getRunner } from "./data";
import { generateRunnerTracks } from "./synthetic";
import type { AdapterMode, BenchResult, DefenseSettings, RunnerProfile, RunnerSummary, Track, XY } from "./types";

export interface BenchAdapter {
  mode: AdapterMode;
  listRunners(): RunnerSummary[];
  loadSample(id: string): { profile: RunnerProfile; tracks: Track[] };
  measure(tracks: XY[][], trueHome: XY | null, s: DefenseSettings, seed: number): BenchResult;
}

/** The seeded synthetic runners, generated and attacked on the main thread. */
export const fakeBenchAdapter: BenchAdapter = {
  mode: "fake",
  listRunners() {
    return RUNNERS.map((r) => ({ id: r.id, name: r.name, habit: r.habit, sport: r.sport, activities: r.activities }));
  },
  loadSample(id) {
    const profile = getRunner(id);
    return { profile, tracks: generateRunnerTracks(profile) };
  },
  measure(tracks, trueHome, s, seed) {
    return runBench(tracks, trueHome, s, seed);
  },
};

export function createBenchAdapter(mode: AdapterMode): BenchAdapter {
  // Phase 2 adds a Worker-backed "real" adapter that runs the same attacks off the main thread.
  // Until then both modes use the main-thread bench.
  void mode;
  return fakeBenchAdapter;
}
