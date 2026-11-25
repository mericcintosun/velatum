// Seed data: synthetic runners. None of these people exist. Every home sits on a
// fictional street grid at Null Island (0°N 0°E), so no coordinate is a real address.

import { maxOffset, type DefenseSettings } from "./attack";

export interface RunnerProfile {
  /** URL slug, used in ?runner= so a result has a shareable link. */
  id: string;
  name: string;
  habit: string;
  sport: "run" | "ride";
  /** How many synthetic GPX recordings the generator writes for this runner. */
  activities: number;
  /** Home position in meters east and north of the grid origin. */
  homeEast: number;
  homeNorth: number;
  /** Typical street spacing; the grid is jittered so it is not a perfect lattice. */
  blockMeters: number;
  /** Standard deviation of GPS error in meters. */
  gpsNoise: number;
  /** Share of recordings that start and end somewhere other than home. */
  awayShare: number;
  /** Min and max number of street blocks per loop. */
  loopBlocks: [number, number];
  seed: number;
  firstActivity: string;
  startHour: number;
}

export const RUNNERS: RunnerProfile[] = [
  {
    id: "maya",
    name: "Maya R.",
    habit: "Night loops of 5 to 8 km after evening lectures",
    sport: "run",
    activities: 24,
    homeEast: 1240,
    homeNorth: 860,
    blockMeters: 125,
    gpsNoise: 8,
    awayShare: 0.12,
    loopBlocks: [14, 26],
    seed: 41017,
    firstActivity: "2026-09-01",
    startHour: 21,
  },
  {
    id: "kerem",
    name: "Kerem A.",
    habit: "Weekend gravel rides that leave from the front gate",
    sport: "ride",
    activities: 16,
    homeEast: -2150,
    homeNorth: 1430,
    blockMeters: 160,
    gpsNoise: 12,
    awayShare: 0.1,
    loopBlocks: [30, 52],
    seed: 52211,
    firstActivity: "2026-08-02",
    startHour: 8,
  },
  {
    id: "aylin",
    name: "Aylin D.",
    habit: "5 a.m. runs before a hospital shift",
    sport: "run",
    activities: 18,
    homeEast: 3020,
    homeNorth: -640,
    blockMeters: 110,
    gpsNoise: 6,
    awayShare: 0.05,
    loopBlocks: [12, 20],
    seed: 60493,
    firstActivity: "2026-09-14",
    startHour: 5,
  },
  {
    id: "jonas",
    name: "Jonas W.",
    habit: "Lunch runs, mostly from the office, sometimes from home",
    sport: "run",
    activities: 12,
    homeEast: -900,
    homeNorth: -1780,
    blockMeters: 130,
    gpsNoise: 9,
    awayShare: 0.6,
    loopBlocks: [12, 22],
    seed: 70219,
    firstActivity: "2026-09-20",
    startHour: 12,
  },
  {
    id: "priya",
    name: "Priya S.",
    habit: "Track intervals, then a cool-down jog home",
    sport: "run",
    activities: 20,
    homeEast: 540,
    homeNorth: -2460,
    blockMeters: 120,
    gpsNoise: 15,
    awayShare: 0.15,
    loopBlocks: [16, 28],
    seed: 81307,
    firstActivity: "2026-08-25",
    startHour: 18,
  },
  {
    id: "tomas",
    name: "Tomás L.",
    habit: "Commute rides between a shared flat and campus",
    sport: "ride",
    activities: 10,
    homeEast: -3100,
    homeNorth: -420,
    blockMeters: 150,
    gpsNoise: 10,
    awayShare: 0.3,
    loopBlocks: [20, 34],
    seed: 90127,
    firstActivity: "2026-10-01",
    startHour: 7,
  },
  {
    id: "sofia",
    name: "Sofia M.",
    habit: "A 30-day streak, one run every single morning",
    sport: "run",
    activities: 30,
    homeEast: 2280,
    homeNorth: 2240,
    blockMeters: 115,
    gpsNoise: 9,
    awayShare: 0.07,
    loopBlocks: [10, 24],
    seed: 10357,
    firstActivity: "2026-10-01",
    startHour: 6,
  },
  {
    id: "elif",
    name: "Elif K.",
    habit: "Short late-night loops with the dog",
    sport: "run",
    activities: 14,
    homeEast: -1520,
    homeNorth: 2980,
    blockMeters: 105,
    gpsNoise: 7,
    awayShare: 0,
    loopBlocks: [8, 14],
    seed: 11923,
    firstActivity: "2026-10-10",
    startHour: 22,
  },
];

export const DEFAULT_RUNNER_ID = "maya";

export function getRunner(id: string): RunnerProfile {
  return RUNNERS.find((r) => r.id === id) ?? RUNNERS[0];
}

export const DEFENSE_LIMITS = {
  zoneRadius: { min: 0, max: 1600, step: 25 },
  centerOffset: { min: 0, step: 10 },
  extraTrim: { min: 0, max: 500, step: 10 },
} as const;

export interface DefensePreset {
  id: string;
  label: string;
  note: string;
  settings: DefenseSettings;
}

export const DEFENSE_PRESETS: DefensePreset[] = [
  {
    id: "none",
    label: "No zone",
    note: "What most public profiles share by default.",
    settings: { zoneRadius: 0, centerOffset: 0, extraTrim: 0 },
  },
  {
    id: "app-default",
    label: "200 m zone",
    note: "A typical in-app privacy zone, centered on the door.",
    settings: { zoneRadius: 200, centerOffset: 0, extraTrim: 0 },
  },
  {
    id: "velatum",
    label: "Offset + ragged edge",
    note: "1 km zone, center moved 700 m, up to 400 m extra cut per recording.",
    settings: { zoneRadius: 1000, centerOffset: 700, extraTrim: 400 },
  },
];

export interface BenchParams {
  runnerId: string;
  zone: number;
  offset: number;
  trim: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

function num(v: string | string[] | undefined, min: number, max: number, fallback: number): number {
  const raw = Array.isArray(v) ? v[0] : v;
  const n = raw === undefined ? NaN : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Reads ?runner=&zone=&offset=&trim= so a measured result can be shared as a link. */
export function parseBenchParams(sp: SearchParams): BenchParams {
  const rawRunner = Array.isArray(sp.runner) ? sp.runner[0] : sp.runner;
  const runnerId = RUNNERS.some((r) => r.id === rawRunner) ? (rawRunner as string) : DEFAULT_RUNNER_ID;
  const zone = num(sp.zone, 0, DEFENSE_LIMITS.zoneRadius.max, 0);
  const offset = zone === 0 ? 0 : num(sp.offset, 0, maxOffset(zone), 0);
  const trim = zone === 0 ? 0 : num(sp.trim, 0, DEFENSE_LIMITS.extraTrim.max, 0);
  return { runnerId, zone, offset, trim };
}

/** A truncated download, used by the "try a broken file" button to show the error path. */
export const BROKEN_GPX_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SportsApp" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Evening Run</name><trkseg>
    <trkpt lat="0.00781" lon="0.01114"><time>2026-11-02T21:04:11Z</time></trkpt>
    <trkpt lat="0.00785" lon="0.01121"><time>2026-11-02T21:04`;

export const SAFETY_STEPS: string[] = [
  "Start and stop recording a few streets from your door, never on the doorstep.",
  "Use a privacy zone of at least 500 m, and center it on a point that is not your home.",
  "Vary where recordings begin. The same corner every morning becomes a new doorstep.",
  "Hide start times and total distance if your app allows it. Velatum does not measure those leaks yet.",
];

export const LIMITATIONS: string[] = [
  "Distance leak attack not covered: the CCS 2022 work also recovers zones from the total distance an app still shows. Velatum only measures the geometry left in the file.",
  "One home assumed. Two homes (a family house and a dorm) split the clusters and can make the score look safer than it is.",
  "For your own files the reference point is the raw-file guess, not your real door, because Velatum never asks where you live.",
  "Rural areas with few roads funnel every exit through one or two streets. Zones there need to be much larger than in a city grid.",
  "The sample runners are synthetic. Real GPS traces are messier, which can help or hurt an attacker.",
];
