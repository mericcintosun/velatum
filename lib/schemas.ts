// zod schemas for the Web Worker message boundary. The worker parses every request with
// BenchRequestSchema before any other logic; the real adapter parses every reply with
// BenchReplySchema. Nothing crosses the boundary unchecked.

import { z } from "zod";
import type { BenchResult } from "./attack";
import { MAX_POINTS_TOTAL, MAX_TRACKS } from "./config";
import { DEFENSE_LIMITS } from "./data";

const finite = z.number().refine((n) => Number.isFinite(n), "must be a finite number");

const XYSchema = z.object({ x: finite, y: finite });

const DefenseSettingsSchema = z.object({
  zoneRadius: z.number().min(DEFENSE_LIMITS.zoneRadius.min).max(DEFENSE_LIMITS.zoneRadius.max),
  // The offset is capped by maxOffset(zoneRadius) inside applyDefenses; here it only has to be sane.
  centerOffset: z.number().min(DEFENSE_LIMITS.centerOffset.min).max(DEFENSE_LIMITS.zoneRadius.max),
  extraTrim: z.number().min(DEFENSE_LIMITS.extraTrim.min).max(DEFENSE_LIMITS.extraTrim.max),
});

export const BenchRequestSchema = z.object({
  id: z.number().int(),
  tracks: z
    .array(z.array(XYSchema))
    .max(MAX_TRACKS)
    .superRefine((tracks, ctx) => {
      let total = 0;
      for (const t of tracks) total += t.length;
      if (total > MAX_POINTS_TOTAL) {
        ctx.addIssue({ code: "custom", message: `more than ${MAX_POINTS_TOTAL} points in total`, input: tracks.length });
      }
    }),
  trueHome: XYSchema.nullable(),
  settings: DefenseSettingsSchema,
  seed: z.number().int(),
});

function isBenchResult(v: unknown): v is BenchResult {
  if (typeof v !== "object" || v === null) return false;
  const r = v as { verdict?: unknown; headline?: unknown };
  if (typeof r.verdict !== "string") return false;
  if (typeof r.headline !== "object" || r.headline === null) return false;
  const h = r.headline as { error?: unknown };
  return h.error === null || typeof h.error === "number";
}

const BenchResultSchema = z.custom<BenchResult>(isBenchResult, "not a bench result");

const ErrorCodeSchema = z.enum(["invalid-input", "worker-timeout", "worker-error", "parse-failure", "not-configured"]);

export const BenchReplySchema = z.discriminatedUnion("ok", [
  z.object({ id: z.number().int(), ok: z.literal(true), result: BenchResultSchema, ms: z.number() }),
  z.object({ id: z.number().int(), ok: z.literal(false), error: ErrorCodeSchema, hint: z.string() }),
]);

export type BenchRequest = z.infer<typeof BenchRequestSchema>;
export type BenchReply = z.infer<typeof BenchReplySchema>;
