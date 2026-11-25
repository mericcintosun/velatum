// npm run demo:reset: puts the demo back to its seeded start. Velatum has no store and no
// chain, so the only demo state outside the tab is fixtures/seed-manifest.json. This runs
// `node scripts/seed.mjs` twice and checks that both runs write the same bytes.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedScript = join(root, "scripts", "seed.mjs");
const manifestPath = join(root, "fixtures", "seed-manifest.json");

function seedAndHash(run) {
  const out = spawnSync(process.execPath, [seedScript], { cwd: root, encoding: "utf8" });
  if (out.error || out.status !== 0) {
    console.error(`demo:reset: seed run ${run} failed${out.stderr ? `: ${out.stderr.trim()}` : ""}`);
    process.exit(1);
  }
  return createHash("sha256").update(readFileSync(manifestPath)).digest("hex");
}

const first = seedAndHash(1);
const second = seedAndHash(2);

if (first !== second) {
  console.error(`demo:reset: the seed is not deterministic (${first} vs ${second})`);
  process.exit(1);
}

console.log(`demo:reset: fixtures/seed-manifest.json sha256 ${first}`);
console.log("Start: /?runner=maya");
console.log("No store and no chain: nothing else holds demo state. Close the tab to forget uploaded files.");
