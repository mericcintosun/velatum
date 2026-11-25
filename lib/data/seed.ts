// Seed loader: turns the plain JSON fixture into typed runner profiles. Every runner is
// synthetic and lives on a fictional grid at 0°N 0°E. `npm run seed` validates the same
// fixture and writes fixtures/seed-manifest.json.
//
// This folder must never contain an index.ts: `@/lib/data` has to keep resolving to lib/data.ts.

import raw from "../../fixtures/runners.json";
import type { RunnerProfile } from "../data";

export const SEED_VERSION = 1;

interface RawRunner {
  id: string;
  name: string;
  habit: string;
  sport: string;
  activities: number;
  homeEast: number;
  homeNorth: number;
  blockMeters: number;
  gpsNoise: number;
  awayShare: number;
  loopBlocks: number[];
  seed: number;
  firstActivity: string;
  startHour: number;
}

function toProfile(r: RawRunner): RunnerProfile {
  const sport: RunnerProfile["sport"] = r.sport === "ride" ? "ride" : "run";
  const lo = r.loopBlocks[0] ?? 10;
  const hi = r.loopBlocks[1] ?? lo;
  return {
    id: r.id,
    name: r.name,
    habit: r.habit,
    sport,
    activities: r.activities,
    homeEast: r.homeEast,
    homeNorth: r.homeNorth,
    blockMeters: r.blockMeters,
    gpsNoise: r.gpsNoise,
    awayShare: r.awayShare,
    loopBlocks: [lo, hi],
    seed: r.seed,
    firstActivity: r.firstActivity,
    startHour: r.startHour,
  };
}

export const SEED_RUNNERS: RunnerProfile[] = (raw as RawRunner[]).map(toProfile);
