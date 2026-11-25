// npm run seed: validates fixtures/runners.json and writes fixtures/seed-manifest.json.
// Deterministic on purpose: no clock, no randomness, sorted output, so two runs write
// byte-identical files. The runners are synthetic; the page generates their tracks in the tab.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = join(root, "fixtures", "runners.json");
const manifestPath = join(root, "fixtures", "seed-manifest.json");

function fail(message) {
  console.error(`seed: ${message}`);
  process.exit(1);
}

let runners;
try {
  runners = JSON.parse(readFileSync(fixturePath, "utf8"));
} catch (err) {
  fail(`could not read fixtures/runners.json (${err instanceof Error ? err.message : String(err)})`);
}

if (!Array.isArray(runners) || runners.length === 0) fail("fixtures/runners.json must be a non-empty array");

const seen = new Set();
for (const [i, r] of runners.entries()) {
  const where = `runner #${i} (${r && typeof r.id === "string" ? r.id : "no id"})`;
  if (!r || typeof r !== "object") fail(`${where} is not an object`);
  if (typeof r.id !== "string" || r.id.length === 0) fail(`${where} needs a string id`);
  if (seen.has(r.id)) fail(`${where} repeats the id "${r.id}"; ids must be unique`);
  seen.add(r.id);
  if (r.sport !== "run" && r.sport !== "ride") fail(`${where} has sport "${r.sport}"; use "run" or "ride"`);
  for (const [key, value] of Object.entries(r)) {
    if (typeof value === "number" && !Number.isFinite(value)) fail(`${where} has a non-finite number in "${key}"`);
  }
  for (const key of ["activities", "homeEast", "homeNorth", "blockMeters", "gpsNoise", "awayShare", "seed", "startHour"]) {
    if (typeof r[key] !== "number" || !Number.isFinite(r[key])) fail(`${where} needs a finite number in "${key}"`);
  }
  if (!Array.isArray(r.loopBlocks) || r.loopBlocks.length !== 2 || !r.loopBlocks.every((n) => typeof n === "number" && Number.isFinite(n))) {
    fail(`${where} needs loopBlocks as two finite numbers`);
  }
  if (r.activities < 3) fail(`${where} has ${r.activities} activities; the attacks need at least 3`);
}

const sorted = runners.map((r) => ({ id: r.id, activities: r.activities })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const manifest = {
  runners: sorted,
  totalActivities: sorted.reduce((sum, r) => sum + r.activities, 0),
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`seed: ${sorted.length} runners, ${manifest.totalActivities} activities, wrote fixtures/seed-manifest.json`);
