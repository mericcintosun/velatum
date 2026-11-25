// The typed core shared by the adapter, the API stub and the page.

export type { DefenseSettings, BenchResult, Verdict } from "./attack";
export type { Track, XY } from "./geo";
export type { RunnerProfile } from "./data";
export type { ParseIssue } from "./gpx";
export type { BenchError, BenchErrorCode } from "./errors";

import type { BenchResult } from "./attack";
import type { BenchError } from "./errors";

/** "fake": the seeded bench on the main thread. "real": the same attacks behind a Web Worker. */
export type AdapterMode = "fake" | "real";

/** Where a measurement was computed. Shown in words under the result number. */
export type BenchEngine = "worker" | "main-thread" | "main-thread-fallback";

export interface Measurement {
  result: BenchResult;
  engine: BenchEngine;
  /** Wall time of the computation in milliseconds. */
  ms: number;
  /** Set only when the worker failed and the main thread stepped in. */
  fallback: BenchError | null;
}

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
