// The fake bench adapter: seeded synthetic runners, attacked on the main thread.
// listRunners, loadSample and measureNow are shared with the real adapter; only
// measure() differs (the real one sends the work to a Web Worker).

import type { BenchAdapter } from "./adapter";
import { runBench } from "./attack";
import { RUNNERS, getRunner } from "./data";
import { generateRunnerTracks } from "./synthetic";

/** The parts every adapter shares: fixture-backed samples and the synchronous first paint. */
export const sharedBench: Pick<BenchAdapter, "listRunners" | "loadSample" | "measureNow"> = {
  listRunners() {
    return RUNNERS.map((r) => ({ id: r.id, name: r.name, habit: r.habit, sport: r.sport, activities: r.activities }));
  },
  loadSample(id) {
    const profile = getRunner(id);
    return { profile, tracks: generateRunnerTracks(profile) };
  },
  measureNow(tracks, trueHome, s, seed) {
    return runBench(tracks, trueHome, s, seed);
  },
};

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export const fakeBenchAdapter: BenchAdapter = {
  mode: "fake",
  ...sharedBench,
  async measure(tracks, trueHome, s, seed) {
    const t0 = now();
    const result = runBench(tracks, trueHome, s, seed);
    return { result, engine: "main-thread", ms: now() - t0, fallback: null };
  },
};
