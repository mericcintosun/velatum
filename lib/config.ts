// Named constants for the bench core. Imported by the page, the real adapter and the
// Web Worker, so this file reads no process.env: anything here ends up in the client
// bundle and the worker bundle, where server env is not available (and must not leak).
// ADAPTER_MODE stays in the server-only lib/adapter-mode.ts and reaches the page as a prop.

/** No demo step may take longer than this, even when the worker fails. */
export const DEMO_STEP_BUDGET_MS = 5000;

/**
 * How long one worker attempt may take before it is treated as hung.
 * 2 attempts x 2000 ms plus the main-thread fallback stays under DEMO_STEP_BUDGET_MS.
 * Phase 2 used 4000 ms x 2, which broke the 5 second rule.
 */
export const WORKER_TIMEOUT_MS = 2000;

/** How many times a failed or hung worker attempt is retried with a fresh worker. */
export const WORKER_RETRIES = 1;

/** Upper bound on recordings in one bench request. */
export const MAX_TRACKS = 2000;

/** Upper bound on points across all recordings in one bench request. */
export const MAX_POINTS_TOTAL = 500_000;

/** Every core log line starts with this prefix. Logs carry counts and durations only. */
export const LOG_PREFIX = "[core]";
