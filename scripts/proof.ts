// npm run proof: measures the seeded runners with the same runBench the Web Worker runs and
// writes the numbers into README.md (and SUBMISSION.md if it exists), only between
// <!-- PROOF:BEGIN name --> and <!-- PROOF:END name --> markers. A missing marker pair is
// logged and skipped. This script never throws and always exits 0.
//
// Writes only inside the repo. Imports lib/ through relative paths so it runs under tsx.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { runBench, type BenchResult } from "../lib/attack";
import { DEMO_STEP_BUDGET_MS, WORKER_RETRIES, WORKER_TIMEOUT_MS } from "../lib/config";
import { DEFENSE_PRESETS, RUNNERS, getRunner } from "../lib/data";
import { NULL_ISLAND, formatMeters, makePlane } from "../lib/geo";
import { serializeGpx } from "../lib/gpx";
import { generateRunnerTracks } from "../lib/synthetic";

const ROOT = process.cwd();
const TARGETS = ["README.md", "SUBMISSION.md"];
const today = new Date().toISOString().slice(0, 10);

function bench(runnerId: string, presetId: string): BenchResult {
  const runner = getRunner(runnerId);
  const preset = DEFENSE_PRESETS.find((p) => p.id === presetId) ?? DEFENSE_PRESETS[0];
  const plane = makePlane(NULL_ISLAND);
  const xy = generateRunnerTracks(runner).map((t) => t.points.map((p) => plane.toXY(p)));
  return runBench(xy, { x: runner.homeEast, y: runner.homeNorth }, preset.settings, runner.seed);
}

function meters(v: number | null): string {
  return v === null ? "no guess" : formatMeters(v);
}

const SOURCE_LABEL: Record<string, string> = {
  endpoint: "start and finish clustering",
  circle: "zone edge circle fit",
};

function benchNumbers(): string {
  const rows = DEFENSE_PRESETS.map((p) => {
    const r = bench("maya", p.id);
    const source = r.headline.source ? SOURCE_LABEL[r.headline.source] : "none";
    return `| ${p.label} | ${source} | ${meters(r.headline.error)} | ${r.verdict} |`;
  });
  console.log(`proof bench-numbers: maya ${rows.length} presets measured`);
  return [
    `Measured by \`npm run proof\` on ${today} with the same \`runBench\` the Web Worker runs (runner Maya, fixed seed).`,
    "",
    "| Preset | Closest guess | Distance to sample home | Verdict |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function benchRunners(): string {
  const presets = ["none", "app-default", "velatum"];
  const rows = RUNNERS.map((runner) => {
    const cells = presets.map((id) => meters(bench(runner.id, id).headline.error));
    return `| ${runner.name} | ${cells.join(" | ")} |`;
  });
  console.log(`proof bench-runners: ${rows.length} runners x ${presets.length} presets measured`);
  return [
    `Headline distance from the closer guess to each synthetic sample home, measured on ${today}.`,
    "",
    "| Runner | No zone | 200 m zone | Offset + ragged edge |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function benchTests(): string {
  const latency = "Worker latency is measured in the browser and shown under the result; this script does not measure it.";
  const bin = path.join(ROOT, "node_modules", ".bin", "vitest");
  if (!fs.existsSync(bin)) {
    console.log("proof bench-tests: vitest is not installed, skipped");
    return ["Not run in this build: vitest is not installed.", "", latency].join("\n");
  }
  const run = spawnSync(bin, ["run", "--reporter=json"], { cwd: ROOT, encoding: "utf8", timeout: 90_000 });
  if (run.error || typeof run.stdout !== "string") {
    console.log("proof bench-tests: vitest did not finish within 90 s or could not start");
    return ["Not run in this build: vitest did not finish within 90 seconds.", "", latency].join("\n");
  }
  const out = run.stdout;
  let passed: number | null = null;
  let failed: number | null = null;
  const a = out.indexOf("{");
  const b = out.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try {
      const report = JSON.parse(out.slice(a, b + 1)) as { numPassedTests?: unknown; numFailedTests?: unknown };
      if (typeof report.numPassedTests === "number") passed = report.numPassedTests;
      if (typeof report.numFailedTests === "number") failed = report.numFailedTests;
    } catch {
      // fall through to the "could not read" line below
    }
  }
  if (passed === null || failed === null) {
    console.log("proof bench-tests: vitest ran but its report could not be read");
    return ["Not run in this build: the vitest report could not be read.", "", latency].join("\n");
  }
  console.log(`proof bench-tests: ${passed} passed, ${failed} failed`);
  return [`\`npm test\` on ${today}: ${passed} passed, ${failed} failed.`, "", latency].join("\n");
}

/** Step 5 output for one runner and preset, built exactly like the download in the bench. */
function cleanedGpx(runnerId: string, presetId: string): string {
  const runner = getRunner(runnerId);
  const preset = DEFENSE_PRESETS.find((p) => p.id === presetId) ?? DEFENSE_PRESETS[0];
  const plane = makePlane(NULL_ISLAND);
  const tracks = generateRunnerTracks(runner);
  const xy = tracks.map((t) => t.points.map((p) => plane.toXY(p)));
  const result = runBench(xy, { x: runner.homeEast, y: runner.homeNorth }, preset.settings, runner.seed);
  const cleaned = tracks
    .map((t, i) => ({
      name: t.name,
      segments: (result.zone.tracks[i]?.segments ?? []).map(([a, b]) => t.points.slice(a, b + 1)),
    }))
    .filter((t) => t.segments.length > 0);
  return serializeGpx(cleaned);
}

function demoPath(): string {
  let slowest = 0;
  let slowestAt = "";
  for (const runner of RUNNERS) {
    for (const preset of DEFENSE_PRESETS) {
      const t0 = performance.now();
      bench(runner.id, preset.id);
      const ms = performance.now() - t0;
      if (ms > slowest) {
        slowest = ms;
        slowestAt = `${runner.name}, ${preset.label}`;
      }
    }
  }
  const velatum = DEFENSE_PRESETS.find((p) => p.id === "velatum") ?? DEFENSE_PRESETS[DEFENSE_PRESETS.length - 1];
  const a = cleanedGpx("maya", velatum.id);
  const b = cleanedGpx("maya", velatum.id);
  const hashA = createHash("sha256").update(a).digest("hex");
  const hashB = createHash("sha256").update(b).digest("hex");
  const bytes = Buffer.byteLength(a, "utf8");
  const worstWait = WORKER_TIMEOUT_MS * (WORKER_RETRIES + 1);
  console.log(`proof demo-path: slowest runBench ${Math.round(slowest)} ms, step 5 file ${bytes} bytes`);
  return [
    `Measured by \`npm run proof\` on ${today} in Node with the same \`runBench\` the Web Worker runs.`,
    "",
    "| Check | Value | Budget |",
    "| --- | --- | --- |",
    `| Slowest \`runBench\` over ${RUNNERS.length} runners x ${DEFENSE_PRESETS.length} presets (${slowestAt}) | ${Math.round(slowest)} ms | ${DEMO_STEP_BUDGET_MS} ms |`,
    `| Step 5 file size, Maya at "${velatum.label}" | ${bytes} bytes | none |`,
    `| Step 5 file identical across two \`serializeGpx\` calls (sha256) | ${hashA === hashB ? "match" : "MISMATCH"} \`${hashA.slice(0, 12)}\` | match |`,
    `| Worst-case worker wait, ${WORKER_TIMEOUT_MS} ms x ${WORKER_RETRIES + 1} attempts | ${worstWait} ms | ${DEMO_STEP_BUDGET_MS} ms |`,
  ].join("\n");
}

function rewrite(file: string, blocks: Record<string, string>): void {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    if (file !== "SUBMISSION.md") console.log(`proof: ${file} not found, skipped`);
    return;
  }
  let text = fs.readFileSync(full, "utf8");
  for (const [name, body] of Object.entries(blocks)) {
    const begin = `<!-- PROOF:BEGIN ${name} -->`;
    const end = `<!-- PROOF:END ${name} -->`;
    const i = text.indexOf(begin);
    const j = text.indexOf(end);
    if (i < 0 || j < 0 || j < i) {
      console.log(`proof: ${file} has no ${name} marker pair, skipped`);
      continue;
    }
    text = `${text.slice(0, i + begin.length)}\n${body}\n${text.slice(j)}`;
  }
  fs.writeFileSync(full, text);
  console.log(`proof: ${file} updated`);
}

function safe(name: string, make: () => string): string | null {
  try {
    return make();
  } catch (e) {
    console.log(`proof ${name}: failed (${e instanceof Error ? e.name : "error"}), block left unchanged`);
    return null;
  }
}

function main(): void {
  const blocks: Record<string, string> = {};
  const numbers = safe("bench-numbers", benchNumbers);
  if (numbers !== null) blocks["bench-numbers"] = numbers;
  const runners = safe("bench-runners", benchRunners);
  if (runners !== null) blocks["bench-runners"] = runners;
  const tests = safe("bench-tests", benchTests);
  if (tests !== null) blocks["bench-tests"] = tests;
  const demo = safe("demo-path", demoPath);
  if (demo !== null) blocks["demo-path"] = demo;
  for (const file of TARGETS) {
    try {
      rewrite(file, blocks);
    } catch {
      console.log(`proof: could not rewrite ${file}`);
    }
  }
}

main();
process.exitCode = 0;
