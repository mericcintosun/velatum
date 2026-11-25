// Snapshot test over the fixed seeds: the same runBench the worker runs, pinned per runner
// and preset. The .snap file is written by Vitest on the first run; never hand-edit it.

import { describe, expect, it } from "vitest";
import { VERDICT_BANDS, kasaFit, runBench, verdictFor } from "@/lib/attack";
import { DEFENSE_PRESETS, RUNNERS, getRunner } from "@/lib/data";
import { NULL_ISLAND, makePlane, type XY } from "@/lib/geo";
import { generateRunnerTracks } from "@/lib/synthetic";

function benchFor(runnerId: string, presetId: string) {
  const runner = getRunner(runnerId);
  const preset = DEFENSE_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`unknown preset ${presetId}`);
  const plane = makePlane(NULL_ISLAND);
  const xy = generateRunnerTracks(runner).map((t) => t.points.map((p) => plane.toXY(p)));
  const home: XY = { x: runner.homeEast, y: runner.homeNorth };
  return runBench(xy, home, preset.settings, runner.seed);
}

function round1(v: number | null): number | null {
  return v === null ? null : Math.round(v * 10) / 10;
}

const otherRunners = RUNNERS.filter((r) => r.id !== "maya")
  .slice(0, 2)
  .map((r) => r.id);

const CASES: Array<{ runner: string; preset: string }> = [
  ...DEFENSE_PRESETS.map((p) => ({ runner: "maya", preset: p.id })),
  ...otherRunners.map((id) => ({ runner: id, preset: "app-default" })),
];

describe("runBench on the seeded runners", () => {
  it("has the 8 seeded runners", () => {
    expect(RUNNERS).toHaveLength(8);
  });

  for (const c of CASES) {
    it(`${c.runner} under ${c.preset}`, () => {
      const r = benchFor(c.runner, c.preset);
      expect({
        runner: c.runner,
        preset: c.preset,
        verdict: r.verdict,
        headlineSource: r.headline.source,
        headlineError: round1(r.headline.error),
      }).toMatchSnapshot();
    });
  }

  it("is deterministic for the same seed", () => {
    expect(benchFor("maya", "velatum")).toEqual(benchFor("maya", "velatum"));
  });
});

describe("kasaFit", () => {
  it("recovers the center of 12 exact points on a circle within 1 m", () => {
    const center = { x: 300, y: -150 };
    const radius = 200;
    const points: XY[] = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
    });
    const fit = kasaFit(points);
    expect(fit).not.toBeNull();
    expect(Math.hypot(fit!.center.x - center.x, fit!.center.y - center.y)).toBeLessThan(1);
    expect(Math.abs(fit!.radius - radius)).toBeLessThan(1);
  });
});

describe("verdictFor", () => {
  it("respects VERDICT_BANDS", () => {
    expect(verdictFor(null)).toBe("inconclusive");
    expect(verdictFor(0)).toBe("exposed");
    expect(verdictFor(VERDICT_BANDS.exposed - 0.1)).toBe("exposed");
    expect(verdictFor(VERDICT_BANDS.exposed)).toBe("narrowed");
    expect(verdictFor(VERDICT_BANDS.protected - 0.1)).toBe("narrowed");
    expect(verdictFor(VERDICT_BANDS.protected)).toBe("protected");
    expect(verdictFor(VERDICT_BANDS.protected * 10)).toBe("protected");
  });
});
