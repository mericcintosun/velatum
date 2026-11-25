"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ResultCell } from "@/components/result-cell";
import { TracePlot } from "@/components/trace-plot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { createBenchAdapter } from "@/lib/adapter";
import { maxOffset, type DefenseSettings } from "@/lib/attack";
import { BROKEN_GPX_SAMPLE, DEFENSE_LIMITS, DEFENSE_PRESETS, type BenchParams } from "@/lib/data";
import { NULL_ISLAND, formatMeters, makePlane, planeFor, type Track, type XY } from "@/lib/geo";
import { parseGpxFile, serializeGpx, type ParseIssue } from "@/lib/gpx";
import type { AdapterMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type Source =
  | { kind: "sample"; runnerId: string }
  | { kind: "upload"; fileNames: string[]; tracks: Track[]; seed: number };

const MAX_FILE_BYTES = 15 * 1024 * 1024;

interface ExposureBenchProps {
  initial: BenchParams;
  /** Chosen on the server from ADAPTER_MODE. "fake" is the seeded main-thread bench. */
  mode: AdapterMode;
  /** The pure-image bento cell, rendered on the server and passed through. */
  imageCell: ReactNode;
}

function normalize(next: DefenseSettings): DefenseSettings {
  if (next.zoneRadius <= 0) return { zoneRadius: 0, centerOffset: 0, extraTrim: 0 };
  return { ...next, centerOffset: Math.min(next.centerOffset, maxOffset(next.zoneRadius)) };
}

export function ExposureBench({ initial, mode, imageCell }: ExposureBenchProps) {
  const adapter = useMemo(() => createBenchAdapter(mode), [mode]);
  const runners = useMemo(() => adapter.listRunners(), [adapter]);
  const [source, setSource] = useState<Source>({ kind: "sample", runnerId: initial.runnerId });
  const [settings, setSettings] = useState<DefenseSettings>(() =>
    normalize({ zoneRadius: initial.zone, centerOffset: initial.offset, extraTrim: initial.trim })
  );
  const [issues, setIssues] = useState<ParseIssue[]>([]);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const measured = useDeferredValue(settings);

  const subject = useMemo(() => {
    if (source.kind === "sample") {
      const { profile: runner, tracks } = adapter.loadSample(source.runnerId);
      const plane = makePlane(NULL_ISLAND);
      return {
        tracks,
        xy: tracks.map((t) => t.points.map((p) => plane.toXY(p))),
        trueHome: { x: runner.homeEast, y: runner.homeNorth } as XY | null,
        seed: runner.seed,
        label: `${runner.name}, ${tracks.length} synthetic ${runner.sport === "run" ? "runs" : "rides"}`,
        referenceLabel: "Sample home",
        fileName: `velatum-${runner.id}-cleaned.gpx`,
      };
    }
    const plane = planeFor(source.tracks);
    return {
      tracks: source.tracks,
      xy: source.tracks.map((t) => t.points.map((p) => plane.toXY(p))),
      trueHome: null as XY | null,
      seed: source.seed,
      label: `your ${source.tracks.length} activities from ${source.fileNames.length} file${source.fileNames.length === 1 ? "" : "s"}`,
      referenceLabel: "Raw-file guess",
      fileName: "velatum-cleaned.gpx",
    };
  }, [source, adapter]);

  const result = useMemo(
    () => adapter.measure(subject.xy, subject.trueHome, measured, subject.seed),
    [adapter, subject, measured]
  );

  // Shareable state: a sample result lives in the URL. Nothing about uploaded files ever does.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (source.kind === "sample") {
      url.searchParams.set("runner", source.runnerId);
      url.searchParams.set("zone", String(settings.zoneRadius));
      url.searchParams.set("offset", String(settings.centerOffset));
      url.searchParams.set("trim", String(settings.extraTrim));
    } else {
      for (const k of ["runner", "zone", "offset", "trim"]) url.searchParams.delete(k);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [source, settings]);

  const update = (patch: Partial<DefenseSettings>) => setSettings((prev) => normalize({ ...prev, ...patch }));

  const readFiles = useCallback(async (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    setReading(true);
    const found: Track[] = [];
    const next: ParseIssue[] = [];
    for (const f of files) {
      if (!/\.gpx$/i.test(f.name)) {
        next.push({ file: f.name, level: "error", message: "Only .gpx files are read. Export the activity as GPX from your app first." });
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        next.push({ file: f.name, level: "error", message: "Larger than 15 MB. Split very long recordings before checking them." });
        continue;
      }
      try {
        const out = parseGpxFile(f.name, await f.text());
        found.push(...out.tracks);
        next.push(...out.issues);
      } catch {
        next.push({ file: f.name, level: "error", message: "The browser could not read this file." });
      }
    }
    if (found.length > 0 && found.length < 3) {
      next.push({
        file: "All files",
        level: "error",
        message: `Velatum needs at least 3 activities to look for a repeated start point. It found ${found.length}. The sample runner stays loaded.`,
      });
    } else if (found.length >= 3) {
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      setSource({ kind: "upload", fileNames: files.map((f) => f.name), tracks: found, seed });
    }
    setIssues(next);
    setReading(false);
  }, []);

  const tryBrokenFile = () => {
    setIssues(parseGpxFile("interrupted-download.gpx", BROKEN_GPX_SAMPLE).issues);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void readFiles(e.dataTransfer.files);
  };

  const download = () => {
    const cleaned = subject.tracks
      .map((t, i) => ({
        name: t.name,
        segments: (result.zone.tracks[i]?.segments ?? []).map(([a, b]) => t.points.slice(a, b + 1)),
      }))
      .filter((t) => t.segments.length > 0);
    const blob = new Blob([serializeGpx(cleaned)], { type: "application/gpx+xml" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = subject.fileName;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const zoneOn = settings.zoneRadius > 0;
  const offsetMax = maxOffset(settings.zoneRadius);
  const activePreset = DEFENSE_PRESETS.find(
    (p) =>
      p.settings.zoneRadius === settings.zoneRadius &&
      p.settings.centerOffset === settings.centerOffset &&
      p.settings.extraTrim === settings.extraTrim
  );

  return (
    <div className="velatum-bento grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Cell A, the largest: the claim and the live product. */}
      <Card className="velatum-enter flex flex-col gap-5 bg-background p-6 lg:col-span-7 lg:row-span-2 lg:p-8">
        <div className="space-y-2 border-b border-border pb-5">
          <CardLabel number={1}>Home exposure bench</CardLabel>
          <h1 className="text-4xl leading-[1.05] sm:text-5xl">Does your privacy zone actually hide your front door?</h1>
          <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
            Velatum runs the two published home-finding attacks on running and riding recordings, inside this tab, and tells you
            how many meters they miss by. A sample runner is already loaded.
          </p>
        </div>
        <figure className="space-y-3">
          <div className="overflow-x-auto border border-border">
            <TracePlot tracks={subject.xy} result={result} referenceLabel={subject.referenceLabel} />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">Fig. 1.</span> {subject.label}. Plane view, north up, no map tiles.
            </span>
            <Badge variant="default">Files stay in this tab</Badge>
          </figcaption>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Legend">
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 bg-primary" /> {subject.referenceLabel}
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 border-2 border-bad" /> Attacker guesses
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 bg-warn" /> Where hidden tracks reappear
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-px w-4 bg-gold" /> Privacy zone
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-px w-4 bg-border" /> Hidden by the zone
            </li>
          </ul>
        </figure>
      </Card>

      {/* Cell B: the result summary, which grows into the evidence view. */}
      <Card className="velatum-enter p-0 lg:col-span-5 lg:col-start-8">
        <ResultCell result={result} settings={measured} subjectLabel={subject.label} referenceLabel={subject.referenceLabel} />
      </Card>

      {/* Cell C: the defenses. */}
      <Card className="velatum-enter flex flex-col gap-6 p-6 lg:col-span-5 lg:col-start-8 lg:row-span-2">
        <div className="space-y-2">
          <CardLabel number={3}>Defenses</CardLabel>
          <h2 className="text-3xl">Move a slider, the attack runs again</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFENSE_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant="outline"
              size="sm"
              aria-pressed={activePreset?.id === p.id}
              title={p.note}
              className={cn(activePreset?.id === p.id && "border-primary bg-secondary")}
              onClick={() => setSettings(normalize(p.settings))}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="space-y-5">
          <label className="block space-y-1">
            <span className="flex justify-between text-sm">
              <span>Privacy zone radius</span>
              <span className="font-semibold">{zoneOn ? formatMeters(settings.zoneRadius) : "Off"}</span>
            </span>
            <Slider
              min={DEFENSE_LIMITS.zoneRadius.min}
              max={DEFENSE_LIMITS.zoneRadius.max}
              step={DEFENSE_LIMITS.zoneRadius.step}
              value={settings.zoneRadius}
              onChange={(e) => update({ zoneRadius: Number(e.target.value) })}
            />
            <span className="block text-xs text-muted-foreground">Everything this close to the center is cut from the shared file.</span>
          </label>

          <label className="block space-y-1">
            <span className="flex justify-between text-sm">
              <span>Move the center away from home</span>
              <span className="font-semibold">{formatMeters(settings.centerOffset)}</span>
            </span>
            <Slider
              min={DEFENSE_LIMITS.centerOffset.min}
              max={Math.max(offsetMax, 10)}
              step={DEFENSE_LIMITS.centerOffset.step}
              value={settings.centerOffset}
              disabled={!zoneOn}
              onChange={(e) => update({ centerOffset: Number(e.target.value) })}
            />
            <span className="block text-xs text-muted-foreground">
              {zoneOn
                ? `Secret random direction. Capped at ${formatMeters(offsetMax)} so home stays inside the zone.`
                : "Turn on a privacy zone first."}
            </span>
          </label>

          <label className="block space-y-1">
            <span className="flex justify-between text-sm">
              <span>Extra random cut per recording</span>
              <span className="font-semibold">up to {formatMeters(settings.extraTrim)}</span>
            </span>
            <Slider
              min={DEFENSE_LIMITS.extraTrim.min}
              max={DEFENSE_LIMITS.extraTrim.max}
              step={DEFENSE_LIMITS.extraTrim.step}
              value={settings.extraTrim}
              disabled={!zoneOn}
              onChange={(e) => update({ extraTrim: Number(e.target.value) })}
            />
            <span className="block text-xs text-muted-foreground">
              Each recording loses a different length after leaving the zone, so the exits stop lining up on one circle.
            </span>
          </label>
        </div>

        <div className="mt-auto space-y-3 border-t border-border pt-5">
          <Button variant="outline" onClick={download} disabled={!zoneOn}>
            Download cleaned GPX
          </Button>
          <p className="text-xs text-muted-foreground">
            {zoneOn
              ? "One file with every recording as measured above. No device, author or app metadata is written."
              : "Set a privacy zone to produce a cleaned file."}
          </p>
        </div>
      </Card>

      {/* Cell D: the one primary call to action. */}
      <Card
        id="your-files"
        className={cn("velatum-enter flex scroll-mt-24 flex-col gap-4 p-6 lg:col-span-4", dragging && "border-primary bg-secondary")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <CardLabel number={4}>Your own files</CardLabel>
        <h2 className="text-3xl">Check your runs</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Export three or more activities as GPX and drop them here. They are read by this page only: no upload, no account,
          and the page&apos;s security policy blocks every outgoing request.
        </p>
        <Input
          ref={fileRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          multiple
          aria-label="GPX files to check"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files) void readFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button size="lg" onClick={() => fileRef.current?.click()} disabled={reading}>
          {reading ? "Reading files" : "Choose GPX files"}
        </Button>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Button variant="link" size="sm" className="h-auto px-0" onClick={tryBrokenFile}>
            Try a broken file
          </Button>
          {source.kind === "upload" && (
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => {
                setSource({ kind: "sample", runnerId: initial.runnerId });
                setIssues([]);
              }}
            >
              Forget my files
            </Button>
          )}
        </div>
        {source.kind === "sample" && issues.length === 0 && (
          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            No files checked yet. Your results replace the sample runner and never leave this tab.
          </p>
        )}
        {issues.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-3" aria-live="polite">
            {issues.map((issue, i) => (
              <li key={`${issue.file}-${i}`} className="flex gap-2 text-xs leading-relaxed">
                <Badge variant={issue.level === "error" ? "bad" : "warn"} className="shrink-0">
                  {issue.level}
                </Badge>
                <span>
                  <span className="font-semibold">{issue.file}:</span> {issue.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Cell E: pure image. */}
      <Card className="velatum-enter flex flex-col justify-between gap-3 p-4 lg:col-span-3">{imageCell}</Card>

      {/* Cell F: the seeded runners. */}
      <Card className="velatum-enter flex flex-col gap-4 p-6 lg:col-span-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <CardLabel number={6}>Sample runners, all synthetic</CardLabel>
          <p className="text-xs text-muted-foreground">Homes sit on a fictional street grid at 0°N 0°E, so none is a real doorstep.</p>
        </div>
        {runners.length === 0 && (
          <p className="text-sm text-muted-foreground">No sample runners are loaded. Drop your own GPX files in cell 4.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {runners.map((r) => {
            const active = source.kind === "sample" && source.runnerId === r.id;
            return (
              <Button
                key={r.id}
                variant="outline"
                aria-pressed={active}
                className={cn("h-auto flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left", active && "border-primary bg-secondary")}
                onClick={() => {
                  setSource({ kind: "sample", runnerId: r.id });
                  setIssues([]);
                }}
              >
                <span>
                  {r.name} · {r.activities} {r.sport === "run" ? "runs" : "rides"}
                </span>
                <span className="text-[11px] font-normal normal-case tracking-normal text-muted-foreground">{r.habit}</span>
              </Button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
