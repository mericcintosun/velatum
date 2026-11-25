// The two home-finding attacks and the defenses Velatum measures them against.
// Written during SafeSpace Hacks; no clustering or fitting library is used.
//
// Attack 1 (endpoint clustering): most recordings start and stop at the front door, so
// DBSCAN over all start and finish points finds a dense cluster whose centroid is home.
// Attack 2 (zone edge circle fit): a privacy zone hides everything within a fixed radius
// of a center, so the points where hidden tracks reappear lie on a circle around that
// center. RANSAC throws out exits that do not fit, then a Kasa least-squares fit recovers
// the circle, and with it the hidden center.

import { centroid, dist, mulberry32, type XY } from "./geo";

export interface DefenseSettings {
  /** Privacy zone radius in meters. 0 means no zone. */
  zoneRadius: number;
  /** How far the zone center sits from home, in meters (random secret direction). */
  centerOffset: number;
  /** Up to this many extra meters are cut from the start and the end of each recording. */
  extraTrim: number;
}

export const DBSCAN_EPS_M = 75;
export const DBSCAN_MIN_PTS = 3;
export const VERDICT_BANDS = { exposed: 150, protected: 400 } as const;

/** Home must stay inside the zone, so the center can move at most 80% of the radius. */
export function maxOffset(radius: number): number {
  return Math.max(0, Math.floor((radius * 0.8) / 10) * 10);
}

/* ---------------------------------------------------------------- DBSCAN */

export function dbscan(points: XY[], eps = DBSCAN_EPS_M, minPts = DBSCAN_MIN_PTS): number[] {
  const UNVISITED = -2;
  const NOISE = -1;
  const labels = new Array<number>(points.length).fill(UNVISITED);
  const neighbors = (i: number) => {
    const out: number[] = [];
    for (let j = 0; j < points.length; j++) if (dist(points[i], points[j]) <= eps) out.push(j);
    return out;
  };
  let cluster = 0;
  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== UNVISITED) continue;
    const seeds = neighbors(i);
    if (seeds.length < minPts) {
      labels[i] = NOISE;
      continue;
    }
    labels[i] = cluster;
    const queue = [...seeds];
    while (queue.length) {
      const j = queue.shift() as number;
      if (labels[j] === NOISE) labels[j] = cluster;
      if (labels[j] !== UNVISITED) continue;
      labels[j] = cluster;
      const nj = neighbors(j);
      if (nj.length >= minPts) queue.push(...nj);
    }
    cluster++;
  }
  return labels;
}

export interface EndpointAttack {
  guess: XY | null;
  clusterSize: number;
  endpointCount: number;
}

export function endpointAttack(endpoints: XY[]): EndpointAttack {
  if (endpoints.length < DBSCAN_MIN_PTS) return { guess: null, clusterSize: 0, endpointCount: endpoints.length };
  const labels = dbscan(endpoints);
  const counts = new Map<number, number>();
  for (const l of labels) if (l >= 0) counts.set(l, (counts.get(l) ?? 0) + 1);
  let best = -1;
  let bestN = 0;
  for (const [label, n] of counts) {
    if (n > bestN) {
      best = label;
      bestN = n;
    }
  }
  if (best < 0) return { guess: null, clusterSize: 0, endpointCount: endpoints.length };
  const members = endpoints.filter((_, i) => labels[i] === best);
  return { guess: centroid(members), clusterSize: members.length, endpointCount: endpoints.length };
}

/* ------------------------------------------------------ Kasa + RANSAC */

export interface Circle {
  center: XY;
  radius: number;
}

function solve3(m: number[][], v: number[]): number[] | null {
  const det = (a: number[][]) =>
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
    a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
    a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const d = det(m);
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
  const out: number[] = [];
  for (let c = 0; c < 3; c++) {
    const mc = m.map((row, r) => row.map((val, k) => (k === c ? v[r] : val)));
    out.push(det(mc) / d);
  }
  return out;
}

/** Kasa algebraic circle fit: least squares on x² + y² = a·x + b·y + c. */
export function kasaFit(points: XY[]): Circle | null {
  if (points.length < 3) return null;
  const m = centroid(points);
  let sxx = 0, syy = 0, sxy = 0, sx = 0, sy = 0, sxz = 0, syz = 0, sz = 0;
  for (const p of points) {
    const x = p.x - m.x;
    const y = p.y - m.y;
    const z = x * x + y * y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
    sx += x;
    sy += y;
    sxz += x * z;
    syz += y * z;
    sz += z;
  }
  const sol = solve3(
    [
      [sxx, sxy, sx],
      [sxy, syy, sy],
      [sx, sy, points.length],
    ],
    [sxz, syz, sz],
  );
  if (!sol) return null;
  const cx = sol[0] / 2;
  const cy = sol[1] / 2;
  const r2 = sol[2] + cx * cx + cy * cy;
  if (!(r2 > 0)) return null;
  return { center: { x: cx + m.x, y: cy + m.y }, radius: Math.sqrt(r2) };
}

export interface CircleAttack {
  circle: Circle | null;
  exitCount: number;
  inliers: number;
}

export function circleAttack(exits: XY[], seed: number, iterations = 400): CircleAttack {
  if (exits.length < 5) return { circle: null, exitCount: exits.length, inliers: 0 };
  const rng = mulberry32(seed ^ 0x5bd1e995);
  let best: Circle | null = null;
  let bestInliers: XY[] = [];
  for (let it = 0; it < iterations; it++) {
    const i = Math.floor(rng() * exits.length);
    const j = Math.floor(rng() * exits.length);
    const k = Math.floor(rng() * exits.length);
    if (i === j || j === k || i === k) continue;
    const c = kasaFit([exits[i], exits[j], exits[k]]);
    if (!c || c.radius < 40 || c.radius > 4000) continue;
    const tol = Math.max(20, c.radius * 0.05);
    const inliers = exits.filter((p) => Math.abs(dist(p, c.center) - c.radius) <= tol);
    if (inliers.length > bestInliers.length) {
      best = c;
      bestInliers = inliers;
    }
  }
  if (!best || bestInliers.length < 4) return { circle: null, exitCount: exits.length, inliers: bestInliers.length };
  return { circle: kasaFit(bestInliers) ?? best, exitCount: exits.length, inliers: bestInliers.length };
}

/* ------------------------------------------------------------ defenses */

/** Inclusive index range of points that survive inside one recording. */
export type Segment = [number, number];

export interface ZonedTrack {
  segments: Segment[];
}

export interface ZoneOutcome {
  center: XY | null;
  radius: number;
  tracks: ZonedTrack[];
  /** First and last surviving point of every recording: what a viewer can still see. */
  exits: XY[];
}

function outsideRuns(xy: XY[], center: XY, radius: number): Segment[] {
  const out: Segment[] = [];
  let start = -1;
  for (let i = 0; i < xy.length; i++) {
    const outside = dist(xy[i], center) > radius;
    if (outside && start < 0) start = i;
    if (!outside && start >= 0) {
      if (i - 1 > start) out.push([start, i - 1]);
      start = -1;
    }
  }
  if (start >= 0 && xy.length - 1 > start) out.push([start, xy.length - 1]);
  return out;
}

function trimFront(segs: Segment[], xy: XY[], meters: number): Segment[] {
  const out = [...segs];
  let left = meters;
  while (out.length && left > 0) {
    const [a, b] = out[0];
    let i = a;
    while (i < b && left > 0) {
      left -= dist(xy[i], xy[i + 1]);
      i++;
    }
    if (left > 0) {
      out.shift();
      continue;
    }
    if (b - i >= 1) out[0] = [i, b];
    else out.shift();
    break;
  }
  return out;
}

function trimBack(segs: Segment[], xy: XY[], meters: number): Segment[] {
  const out = [...segs];
  let left = meters;
  while (out.length && left > 0) {
    const [a, b] = out[out.length - 1];
    let i = b;
    while (i > a && left > 0) {
      left -= dist(xy[i], xy[i - 1]);
      i--;
    }
    if (left > 0) {
      out.pop();
      continue;
    }
    if (i - a >= 1) out[out.length - 1] = [a, i];
    else out.pop();
    break;
  }
  return out;
}

export function applyDefenses(tracks: XY[][], home: XY, s: DefenseSettings, seed: number): ZoneOutcome {
  const rng = mulberry32(seed);
  const angle = rng() * Math.PI * 2;
  if (s.zoneRadius <= 0) {
    const zoned = tracks.map((t) => ({ segments: t.length > 1 ? ([[0, t.length - 1]] as Segment[]) : [] }));
    const exits = tracks.flatMap((t) => (t.length > 1 ? [t[0], t[t.length - 1]] : []));
    return { center: null, radius: 0, tracks: zoned, exits };
  }
  const offset = Math.min(s.centerOffset, maxOffset(s.zoneRadius));
  const center = { x: home.x + Math.cos(angle) * offset, y: home.y + Math.sin(angle) * offset };
  const zoned: ZonedTrack[] = [];
  const exits: XY[] = [];
  for (const xy of tracks) {
    // Two draws per recording, always, so the result does not jump when a slider moves.
    const cutStart = rng() * s.extraTrim;
    const cutEnd = rng() * s.extraTrim;
    let segs = outsideRuns(xy, center, s.zoneRadius);
    segs = trimFront(segs, xy, cutStart);
    segs = trimBack(segs, xy, cutEnd);
    zoned.push({ segments: segs });
    if (segs.length) {
      exits.push(xy[segs[0][0]], xy[segs[segs.length - 1][1]]);
    }
  }
  return { center, radius: s.zoneRadius, tracks: zoned, exits };
}

/* --------------------------------------------------------------- bench */

export type Verdict = "exposed" | "narrowed" | "protected" | "nothing-left" | "inconclusive";

export interface BenchResult {
  reference: XY | null;
  referenceKind: "sample-home" | "raw-estimate";
  baseline: EndpointAttack & { error: number | null };
  zone: ZoneOutcome;
  endpoint: EndpointAttack & { error: number | null };
  circle: (CircleAttack & { error: number | null; radiusError: number | null }) | null;
  headline: { error: number | null; source: "endpoint" | "circle" | null };
  verdict: Verdict;
}

export function verdictFor(error: number | null): Verdict {
  if (error === null) return "inconclusive";
  if (error < VERDICT_BANDS.exposed) return "exposed";
  if (error < VERDICT_BANDS.protected) return "narrowed";
  return "protected";
}

/**
 * Runs both attacks on the raw recordings (the "before" number) and on the defended
 * recordings (the "now" number). With a sample runner the true home is known; with
 * uploaded files the raw-file guess stands in for it, because Velatum never asks
 * where you live.
 */
export function runBench(tracks: XY[][], trueHome: XY | null, s: DefenseSettings, seed: number): BenchResult {
  const rawEndpoints = tracks.flatMap((t) => (t.length > 1 ? [t[0], t[t.length - 1]] : []));
  const rawAttack = endpointAttack(rawEndpoints);
  const reference = trueHome ?? rawAttack.guess;
  const err = (g: XY | null) => (g && reference ? dist(g, reference) : null);

  const zone = applyDefenses(tracks, reference ?? { x: 0, y: 0 }, reference ? s : { ...s, zoneRadius: 0 }, seed);
  const endpoint = endpointAttack(zone.exits);
  const circle = zone.center ? circleAttack(zone.exits, seed) : null;

  const endpointError = err(endpoint.guess);
  const circleError = circle ? err(circle.circle?.center ?? null) : null;

  // Report the closer of the two guesses: an attacker would try both.
  let headline: BenchResult["headline"] = { error: null, source: null };
  if (endpointError !== null) headline = { error: endpointError, source: "endpoint" };
  if (circleError !== null && (headline.error === null || circleError < headline.error)) {
    headline = { error: circleError, source: "circle" };
  }

  const nothingLeft = zone.center !== null && zone.tracks.every((t) => t.segments.length === 0);

  return {
    reference,
    referenceKind: trueHome ? "sample-home" : "raw-estimate",
    baseline: { ...rawAttack, error: err(rawAttack.guess) },
    zone,
    endpoint: { ...endpoint, error: endpointError },
    circle: circle
      ? { ...circle, error: circleError, radiusError: circle.circle ? Math.abs(circle.circle.radius - zone.radius) : null }
      : null,
    headline,
    verdict: nothingLeft ? "nothing-left" : verdictFor(headline.error),
  };
}
