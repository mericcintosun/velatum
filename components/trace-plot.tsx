"use client";

import { useRef, useState } from "react";
import { ZoneHandle } from "@/components/zone-handle";
import type { BenchResult } from "@/lib/attack";
import { formatMeters, type XY } from "@/lib/geo";

interface TracePlotProps {
  tracks: XY[][];
  /** Null while the measurement belongs to another set of tracks: only the raw tracks are drawn. */
  result: BenchResult | null;
  referenceLabel: string;
  /** Kit signature 2. The point applyDefenses moves the zone away from. */
  home?: XY | null;
  /** zoneAngle(seed), the secret direction of the offset. */
  angle?: number;
  /** Live settings (not the deferred measured ones), so the handle follows the slider at once. */
  zoneRadius?: number;
  centerOffset?: number;
  offsetMax?: number;
  onOffset?: (meters: number) => void;
}

interface Box {
  vx: number;
  vy: number;
  w: number;
  h: number;
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
export function TracePlot({
  tracks,
  result,
  referenceLabel,
  home = null,
  angle,
  zoneRadius = 0,
  centerOffset = 0,
  offsetMax = 0,
  onOffset,
}: TracePlotProps) {
  // While the handle is dragged the frame holds still, so the plot never rescales under the finger.
  const frozenBox = useRef<Box | null>(null);
  const [panning, setPanning] = useState(false);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const t of tracks) {
    for (const p of t) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const zone = result?.zone ?? null;
  if (zone?.center) {
    minX = Math.min(minX, zone.center.x - zone.radius);
    maxX = Math.max(maxX, zone.center.x + zone.radius);
    minY = Math.min(minY, zone.center.y - zone.radius);
    maxY = Math.max(maxY, zone.center.y + zone.radius);
  }
  if (home && zoneRadius > 0 && onOffset) {
    // Keep the whole drag path of the handle inside the frame.
    minX = Math.min(minX, home.x - offsetMax);
    maxX = Math.max(maxX, home.x + offsetMax);
    minY = Math.min(minY, home.y - offsetMax);
    maxY = Math.max(maxY, home.y + offsetMax);
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
  const fitted: Box = { vx: cx - w / 2, vy: -cy - h / 2, w, h };
  const frame = panning && frozenBox.current ? frozenBox.current : fitted;
  const vx = frame.vx;
  const vy = frame.vy;
  w = frame.w;
  h = frame.h;
  const u = w / 160;
  const showHandle = zoneRadius > 0 && onOffset !== undefined && home !== null && angle !== undefined;

  const onPanChange = (next: boolean) => {
    frozenBox.current = next ? frame : null;
    setPanning(next);
  };

  const endpointGuess = result?.endpoint.guess ?? null;
  const circle = result?.circle?.circle ?? null;
  const ref = result?.reference ?? null;
  const label =
    result === null
      ? "Measuring this set."
      : result.headline.error !== null
        ? `The closest attack guess lands ${formatMeters(result.headline.error)} from the ${referenceLabel.toLowerCase()}.`
        : "No attack produced a guess.";
  const scale = w > 6000 ? 1000 : 500;
  const plotLabel = `Plane view of ${tracks.length} recordings. ${label}${showHandle ? " The gold handle moves the zone center." : ""}`;

  return (
    <svg
      viewBox={[vx, vy, w, h].join(" ")}
      className="aspect-[4/3] w-full bg-background"
      role={showHandle ? "group" : "img"}
      aria-label={plotLabel}
    >
      {tracks.map((t, i) => (
        <path key={`raw-${i}`} d={toPath(thin(t, 3))} fill="none" className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      {zone &&
        tracks.map((t, i) =>
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

      {zone?.center && (
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

      {zone?.center &&
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

      {showHandle && home && angle !== undefined && onOffset && (
        <ZoneHandle
          home={home}
          angle={angle}
          centerOffset={centerOffset}
          offsetMax={offsetMax}
          unit={u}
          onOffset={onOffset}
          onPanChange={onPanChange}
        />
      )}
    </svg>
  );
}
