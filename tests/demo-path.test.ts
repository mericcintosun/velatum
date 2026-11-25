// Demo path guarantees: the worst-case worker wait fits the 5 second step budget, and the
// step 5 download is deterministic for the same input.

import { describe, expect, it } from "vitest";
import { DEMO_STEP_BUDGET_MS, WORKER_RETRIES, WORKER_TIMEOUT_MS } from "@/lib/config";
import { serializeGpx, type CleanedTrack } from "@/lib/gpx";

describe("demo path", () => {
  it("fits the worst-case worker wait plus the fallback into the step budget", () => {
    expect(WORKER_TIMEOUT_MS * (WORKER_RETRIES + 1) + 500).toBeLessThanOrEqual(DEMO_STEP_BUDGET_MS);
  });

  it("serializes the same cleaned tracks to the same GPX string", () => {
    const make = (): CleanedTrack[] => [
      {
        name: "Night run <1>",
        segments: [
          [
            { lat: 0.001, lon: 0.002, time: "2026-01-01T20:00:00Z" },
            { lat: 0.0011, lon: 0.0021 },
          ],
        ],
      },
    ];
    const a = serializeGpx(make());
    const b = serializeGpx(make());
    expect(a).toBe(b);
    expect(a).toContain("<trkseg>");
  });
});
