// Five fixed inputs at the worker boundary.

import { describe, expect, it } from "vitest";
import { MAX_TRACKS } from "@/lib/config";
import { BenchReplySchema, BenchRequestSchema } from "@/lib/schemas";

const valid = {
  id: 1,
  tracks: [
    [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ],
  ],
  trueHome: { x: 0, y: 0 },
  settings: { zoneRadius: 200, centerOffset: 0, extraTrim: 0 },
  seed: 42,
};

describe("BenchRequestSchema", () => {
  it("accepts a valid request", () => {
    expect(BenchRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects NaN coordinates", () => {
    const bad = { ...valid, tracks: [[{ x: Number.NaN, y: 0 }]] };
    expect(BenchRequestSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a negative centerOffset", () => {
    const bad = { ...valid, settings: { ...valid.settings, centerOffset: -10 } };
    expect(BenchRequestSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects too many tracks", () => {
    const bad = { ...valid, tracks: Array.from({ length: MAX_TRACKS + 1 }, () => [{ x: 0, y: 0 }]) };
    expect(BenchRequestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("BenchReplySchema", () => {
  it("rejects a reply without id", () => {
    const bad = { ok: false, error: "worker-error", hint: "The background worker stopped." };
    expect(BenchReplySchema.safeParse(bad).success).toBe(false);
  });
});
