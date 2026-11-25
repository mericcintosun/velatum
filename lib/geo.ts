// Geometry helpers shared by the synthetic generator, the GPX reader and the attacks.
// Everything runs in a local flat plane (meters east and north of an origin), which is
// accurate to well under a meter at the few-kilometer scale of a runner's neighborhood.

export interface XY {
  x: number;
  y: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

export interface TrackPoint extends LatLon {
  /** ISO 8601 timestamp, when the file carries one. */
  time?: string;
}

export interface Track {
  name: string;
  points: TrackPoint[];
}

/**
 * Every synthetic runner lives on a fictional street grid placed at 0°N 0°E (open sea in
 * the Gulf of Guinea), so no sample coordinate can ever be somebody's real doorstep.
 */
export const NULL_ISLAND: LatLon = { lat: 0, lon: 0 };

const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LON_AT_EQUATOR = 111_320;

export interface Plane {
  origin: LatLon;
  toXY(p: LatLon): XY;
  toLatLon(p: XY): LatLon;
}

export function makePlane(origin: LatLon): Plane {
  const kx = M_PER_DEG_LON_AT_EQUATOR * Math.cos((origin.lat * Math.PI) / 180);
  return {
    origin,
    toXY: (p) => ({ x: (p.lon - origin.lon) * kx, y: (p.lat - origin.lat) * M_PER_DEG_LAT }),
    toLatLon: (p) => ({ lat: origin.lat + p.y / M_PER_DEG_LAT, lon: origin.lon + p.x / kx }),
  };
}

/** A plane centered on the mean position of all points (used for uploaded files). */
export function planeFor(tracks: Track[]): Plane {
  let lat = 0;
  let lon = 0;
  let n = 0;
  for (const t of tracks) {
    for (const p of t.points) {
      lat += p.lat;
      lon += p.lon;
      n++;
    }
  }
  return makePlane(n ? { lat: lat / n, lon: lon / n } : NULL_ISLAND);
}

export function dist(a: XY, b: XY): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function centroid(points: XY[]): XY {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

/** Small seeded PRNG so every sample run and every defense draw is reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller). */
export function gaussian(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function formatMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}
