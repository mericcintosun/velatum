// The typed core shared by the adapter, the API stub and the page.

export type { DefenseSettings, BenchResult, Verdict } from "./attack";
export type { Track, XY } from "./geo";
export type { RunnerProfile } from "./data";
export type { ParseIssue } from "./gpx";

/** "fake": the seeded bench on the main thread. "real": the same attacks behind a Web Worker (Phase 2). */
export type AdapterMode = "fake" | "real";

/** The public part of a synthetic runner profile. */
export interface RunnerSummary {
  id: string;
  name: string;
  habit: string;
  sport: "run" | "ride";
  activities: number;
}

export type ApiResponse<T> =
  | { ok: true; mode: AdapterMode; data: T }
  | { ok: false; error: { code: string; message: string } };
