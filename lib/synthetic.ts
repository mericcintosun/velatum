// Synthetic runner generator. Builds seeded loops on an irregular street grid at Null
// Island, adds correlated GPS noise and timestamps, and returns ordinary tracks, so the
// sample runner goes through exactly the same attack code as an uploaded file.

import type { RunnerProfile } from "./data";
import { NULL_ISLAND, gaussian, makePlane, mulberry32, type Track, type TrackPoint, type XY } from "./geo";

type Node = [number, number];

const DIRS: Node[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const same = (a: Node, b: Node) => a[0] === b[0] && a[1] === b[1];

function lineJitter(seed: number, axis: number, i: number, block: number): number {
  if (i === 0) return 0;
  const r = mulberry32((seed * 31 + axis * 7919 + (i + 1000) * 104729) >>> 0)();
  return (r - 0.5) * block * 0.4;
}

function walkLoop(rng: () => number, start: Node, blocks: number): Node[] {
  const path: Node[] = [start];
  let cur = start;
  let prev: Node | null = null;
  const md = (p: Node) => Math.abs(p[0] - start[0]) + Math.abs(p[1] - start[1]);
  const pref = DIRS[Math.floor(rng() * 4)];
  const pref2 = DIRS[Math.floor(rng() * 4)];
  const half = Math.max(3, Math.floor(blocks / 2));
  for (let k = 0; k < half; k++) {
    const options: Node[] = [];
    for (const d of DIRS) {
      const n: Node = [cur[0] + d[0], cur[1] + d[1]];
      if ((prev && same(n, prev)) || md(n) < md(cur)) continue;
      const weight = same(d, pref) ? 3 : same(d, pref2) ? 2 : 1;
      for (let w = 0; w < weight; w++) options.push(n);
    }
    if (!options.length) break;
    prev = cur;
    cur = options[Math.floor(rng() * options.length)];
    path.push(cur);
  }
  while (!same(cur, start)) {
    const dx = Math.sign(start[0] - cur[0]);
    const dy = Math.sign(start[1] - cur[1]);
    const moveX = dx !== 0 && (dy === 0 || rng() < 0.5);
    cur = moveX ? [cur[0] + dx, cur[1]] : [cur[0], cur[1] + dy];
    path.push(cur);
  }
  return path;
}

function densify(points: XY[], step: number): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  out.push(points[points.length - 1]);
  return out;
}

const cache = new Map<string, Track[]>();

export function generateRunnerTracks(r: RunnerProfile): Track[] {
  const hit = cache.get(r.id);
  if (hit) return hit;

  const rng = mulberry32(r.seed);
  const plane = makePlane(NULL_ISLAND);
  const block = r.blockMeters;
  const home: XY = { x: r.homeEast, y: r.homeNorth };
  // Home sits mid-block on an east-west street between grid nodes (0,0) and (1,0).
  const base: XY = { x: home.x - block * 0.4, y: home.y };
  const nodePos = ([i, j]: Node): XY => ({
    x: base.x + i * block + lineJitter(r.seed, 1, i, block),
    y: base.y + j * block + lineJitter(r.seed, 2, j, block),
  });
  const awayNode: Node = [6 + Math.floor(rng() * 5), -4 - Math.floor(rng() * 5)];
  const step = r.sport === "run" ? 8 : 15;
  const speed = r.sport === "run" ? 2.8 : 6.5;
  const firstDay = Date.parse(`${r.firstActivity}T00:00:00Z`);

  const tracks: Track[] = [];
  for (let k = 0; k < r.activities; k++) {
    const blocks = r.loopBlocks[0] + Math.floor(rng() * (r.loopBlocks[1] - r.loopBlocks[0] + 1));
    const fromHome = rng() >= r.awayShare;
    let waypoints: XY[];
    if (fromHome) {
      const door: Node = rng() < 0.5 ? [0, 0] : [1, 0];
      waypoints = [home, ...walkLoop(rng, door, blocks).map(nodePos), home];
    } else {
      waypoints = walkLoop(rng, awayNode, blocks).map(nodePos);
    }
    const dense = densify(waypoints, step);

    // Correlated GPS error (AR(1)), so the trace wobbles like a phone, not like static.
    const a = 0.9;
    const s = r.gpsNoise * Math.sqrt(1 - a * a);
    let nx = gaussian(rng) * r.gpsNoise;
    let ny = gaussian(rng) * r.gpsNoise;

    const day = firstDay + Math.floor(k * (r.sport === "ride" ? 3.5 : 1.4)) * 86_400_000;
    let t = day + r.startHour * 3_600_000 + Math.floor(rng() * 40) * 60_000;
    const points: TrackPoint[] = dense.map((p) => {
      nx = a * nx + s * gaussian(rng);
      ny = a * ny + s * gaussian(rng);
      t += (step / speed) * 1000;
      const ll = plane.toLatLon({ x: p.x + nx, y: p.y + ny });
      return { lat: ll.lat, lon: ll.lon, time: new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") };
    });

    const first = r.name.split(" ")[0];
    tracks.push({ name: `${first} ${r.sport === "run" ? "run" : "ride"} ${String(k + 1).padStart(2, "0")}`, points });
  }

  cache.set(r.id, tracks);
  return tracks;
}
