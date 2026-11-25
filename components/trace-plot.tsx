import type { BenchResult } from "@/lib/attack";
import { formatMeters, type XY } from "@/lib/geo";

interface TracePlotProps {
  tracks: XY[][];
  result: BenchResult;
  referenceLabel: string;
}

function thin(points: XY[], every: number): XY[] {
  return points.filter((_, i) => i % every === 0 || i === points.length - 1);
}

function toPath(points: XY[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${(-p.y).toFixed(1)}`).join("");
}

/**
 * Map-free plane view of every recording: hidden parts in LINE, what stays public in INK,
 * exit points in WARN, the attackers' guesses in BAD and the reference home in ACCENT.
 * No tiles are requested from any map server.
 */
export function TracePlot({ tracks, result, referenceLabel }: TracePlotProps) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const t of tracks) {
    for (const p of t) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const { zone } = result;
  if (zone.center) {
    minX = Math.min(minX, zone.center.x - zone.radius);
    maxX = Math.max(maxX, zone.center.x + zone.radius);
    minY = Math.min(minY, zone.center.y - zone.radius);
    maxY = Math.max(maxY, zone.center.y + zone.radius);
  }
  if (!Number.isFinite(minX)) {
    minX = -500;
    maxX = 500;
    minY = -500;
    maxY = 500;
  }
  // Fit a 4:3 frame around the content with an exhibit-style margin.
  let w = maxX - minX;
  let h = maxY - minY;
  const pad = Math.max(w, h) * 0.08 + 60;
  w += pad * 2;
  h += pad * 2;
  if (w / h > 4 / 3) h = (w * 3) / 4;
  else w = (h * 4) / 3;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const vx = cx - w / 2;
  const vy = -cy - h / 2;
  const u = w / 160;

  const endpointGuess = result.endpoint.guess;
  const circle = result.circle?.circle ?? null;
  const ref = result.reference;
  const scale = w > 6000 ? 1000 : 500;

  return (
    <svg
      viewBox={`${vx} ${vy} ${w} ${h}`}
      className="aspect-[4/3] w-full bg-background"
      role="img"
      aria-label={`Plane view of ${tracks.length} recordings. ${
        result.headline.error !== null ? `The closest attack guess lands ${formatMeters(result.headline.error)} from the ${referenceLabel.toLowerCase()}.` : "No attack produced a guess."
      }`}
    >
      {tracks.map((t, i) => (
        <path key={`raw-${i}`} d={toPath(thin(t, 3))} fill="none" className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      {tracks.map((t, i) =>
        zone.tracks[i]?.segments.map(([a, b], k) => (
          <path
            key={`kept-${i}-${k}`}
            d={toPath(thin(t.slice(a, b + 1), 3))}
            fill="none"
            className="stroke-foreground"
            strokeOpacity={0.55}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        ))
      )}

      {zone.center && (
        <circle
          cx={zone.center.x}
          cy={-zone.center.y}
          r={zone.radius}
          fill="none"
          className="stroke-gold"
          strokeWidth={1.5}
          strokeDasharray="6 5"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {zone.center &&
        zone.exits.map((p, i) => <circle key={`exit-${i}`} cx={p.x} cy={-p.y} r={u * 0.9} className="fill-warn" />)}

      {circle && (
        <g className="stroke-bad" fill="none" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
          <circle cx={circle.center.x} cy={-circle.center.y} r={circle.radius} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          <path
            d={`M${circle.center.x - u * 3} ${-circle.center.y}H${circle.center.x + u * 3}M${circle.center.x} ${-circle.center.y - u * 3}V${-circle.center.y + u * 3}`}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )}

      {endpointGuess && (
        <circle
          cx={endpointGuess.x}
          cy={-endpointGuess.y}
          r={u * 3.2}
          fill="none"
          className="stroke-bad"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      )}

      {ref && (
        <g transform={`translate(${ref.x} ${-ref.y})`}>
          <path d={`M${-u * 1.8} ${u * 1.6}V${-u * 0.2}L0 ${-u * 2}L${u * 1.8} ${-u * 0.2}V${u * 1.6}Z`} className="fill-primary" />
        </g>
      )}

      <g className="fill-muted-foreground stroke-muted-foreground">
        <path
          d={`M${vx + u * 4} ${vy + h - u * 4}h${scale}`}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <text x={vx + u * 4} y={vy + h - u * 5.5} fontSize={u * 2.6} stroke="none">
          {scale === 1000 ? "1 km" : "500 m"}
        </text>
        <text x={vx + w - u * 4} y={vy + u * 5} fontSize={u * 2.6} stroke="none" textAnchor="end">
          N ↑
        </text>
      </g>
    </svg>
  );
}
