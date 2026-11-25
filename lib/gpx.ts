// GPX reading and writing. Runs only in the browser (DOMParser); files never leave the tab.

import type { Track, TrackPoint } from "./geo";

export interface ParseIssue {
  file: string;
  level: "error" | "warning";
  message: string;
}

export interface ParseOutcome {
  tracks: Track[];
  issues: ParseIssue[];
}

function childText(el: Element, name: string): string | undefined {
  const child = Array.from(el.children).find((c) => c.localName === name);
  const text = child?.textContent?.trim();
  return text ? text : undefined;
}

export function parseGpxFile(fileName: string, text: string): ParseOutcome {
  const issues: ParseIssue[] = [];
  const fail = (message: string): ParseOutcome => ({ tracks: [], issues: [{ file: fileName, level: "error", message }] });

  if (!text.trim()) return fail("The file is empty.");

  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    return fail("This is not valid XML, so it cannot be read as GPX. The download may have been cut short.");
  }
  const root = doc.documentElement;
  if (root.localName !== "gpx") return fail(`This is XML, but not GPX: the top element is <${root.localName}>.`);

  const trks = Array.from(doc.getElementsByTagNameNS("*", "trk"));
  if (!trks.length) {
    return fail("No recorded tracks found. Planned routes and waypoints are not activities, so they are skipped.");
  }

  const tracks: Track[] = [];
  let skippedPoints = 0;
  let timed = 0;
  trks.forEach((trk, k) => {
    const name = childText(trk, "name") ?? `${fileName} #${k + 1}`;
    const points: TrackPoint[] = [];
    for (const pt of Array.from(trk.getElementsByTagNameNS("*", "trkpt"))) {
      const lat = Number(pt.getAttribute("lat"));
      const lon = Number(pt.getAttribute("lon"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        skippedPoints++;
        continue;
      }
      const time = childText(pt, "time");
      if (time) timed++;
      points.push({ lat, lon, time });
    }
    if (points.length < 2) {
      issues.push({ file: fileName, level: "warning", message: `"${name}" has fewer than 2 usable points and was skipped.` });
      return;
    }
    tracks.push({ name, points });
  });

  if (skippedPoints) {
    issues.push({ file: fileName, level: "warning", message: `${skippedPoints} points had missing or impossible coordinates and were ignored.` });
  }
  if (tracks.length && timed === 0) {
    issues.push({
      file: fileName,
      level: "warning",
      message: "No timestamps. The location attacks still work; timing patterns are simply not part of this check.",
    });
  }
  return { tracks, issues };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export interface CleanedTrack {
  name: string;
  segments: TrackPoint[][];
}

/** One GPX file with every cleaned recording. No author, device or app metadata is written. */
export function serializeGpx(tracks: CleanedTrack[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Velatum" xmlns="http://www.topografix.com/GPX/1/1">',
  ];
  for (const t of tracks) {
    lines.push(`  <trk><name>${esc(t.name)}</name>`);
    for (const seg of t.segments) {
      lines.push("    <trkseg>");
      for (const p of seg) {
        const time = p.time ? `<time>${esc(p.time)}</time>` : "";
        lines.push(`      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}">${time}</trkpt>`);
      }
      lines.push("    </trkseg>");
    }
    lines.push("  </trk>");
  }
  lines.push("</gpx>");
  return lines.join("\n");
}
