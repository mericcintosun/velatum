"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardLabel } from "@/components/ui/card";
import type { DefenseSettings, Verdict } from "@/lib/attack";
import { SAFETY_STEPS } from "@/lib/data";
import { BENCH_HINTS } from "@/lib/errors";
import { formatMeters } from "@/lib/geo";
import type { Measurement } from "@/lib/types";
import { cn } from "@/lib/utils";

const VERDICT_COPY: Record<Verdict, { tag: string; line: string; tone: "bad" | "warn" | "ok" | "outline" }> = {
  exposed: { tag: "Exposed", line: "The guess lands within a short walk of the door.", tone: "bad" },
  narrowed: { tag: "Narrowed", line: "Down to a few streets. Better, not yet safe.", tone: "warn" },
  protected: { tag: "Misses wide", line: "Both attacks miss by more than 400 m.", tone: "ok" },
  "nothing-left": {
    tag: "Nothing left",
    line: "Every recording sits inside the zone, so nothing is public to attack.",
    tone: "ok",
  },
  inconclusive: {
    tag: "No guess",
    line: "Neither attack found a repeated point. That is not proof of safety.",
    tone: "outline",
  },
};

const TONE_TEXT = { bad: "text-bad", warn: "text-warn", ok: "text-ok", outline: "text-foreground" } as const;
const TONE_BORDER = { bad: "border-bad", warn: "border-warn", ok: "border-ok", outline: "border-border" } as const;

interface ResultCellProps {
  measurement: Measurement;
  /** True while a newer measurement is on its way; the shown number is the last finished one. */
  pending?: boolean;
  settings: DefenseSettings;
  subjectLabel: string;
  referenceLabel: string;
}

function m(v: number | null): string {
  return v === null ? "no guess" : formatMeters(v);
}

/** One line under the number that names the engine that produced it. Switches on codes, never on text. */
function EngineLine({ measurement, pending }: { measurement: Measurement; pending: boolean }) {
  if (pending) {
    return <p className="font-sans text-xs text-muted-foreground">Measuring in this tab. Sample runners are synthetic.</p>;
  }
  switch (measurement.engine) {
    case "worker":
      return (
        <p className="font-sans text-xs text-muted-foreground">
          Measured in this tab by a background worker in {Math.max(1, Math.round(measurement.ms))} ms. Sample runners are synthetic.
        </p>
      );
    case "main-thread":
      return (
        <p className="font-sans text-xs text-muted-foreground">
          Measured on the page&apos;s main thread (sample bench mode, the background worker is off in this build). Sample runners
          are synthetic.
        </p>
      );
    case "main-thread-fallback": {
      const code = measurement.fallback?.error ?? "worker-error";
      return (
        <div className="flex flex-wrap items-center gap-2 font-sans text-xs text-muted-foreground" data-fallback={code}>
          <Badge variant="warn">Worker fallback</Badge>
          <span>{measurement.fallback?.hint ?? BENCH_HINTS[code]}</span>
        </div>
      );
    }
  }
}

/**
 * Cell B while the shown measurement belongs to another set of tracks: the same cell size,
 * no number, so an old runner's distance is never read as the new one's. No pulse.
 */
export function ResultSkeleton({ referenceLabel }: { referenceLabel: string }) {
  return (
    <div role="status" aria-live="polite" className="flex h-full min-h-[260px] flex-col justify-between gap-5 border-l-2 border-border bg-card p-6">
      <div className="space-y-3">
        <CardLabel number={2}>Distance from guess to {referenceLabel.toLowerCase()}</CardLabel>
        <p className="font-display text-4xl leading-none text-muted-foreground">Measuring this set</p>
        <div className="space-y-2" aria-hidden="true">
          <div className="h-px w-3/4 bg-gold" />
          <div className="h-px w-1/2 bg-border" />
          <div className="h-px w-2/3 bg-border" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">The number appears when this set has been measured in this tab.</p>
    </div>
  );
}

/**
 * Kit signature 1 (shared-layout transition): the summary number grows from its bento
 * cell into the evidence view through one layoutId, with no cut, and shrinks back.
 */
export function ResultCell({ measurement, pending = false, settings, subjectLabel, referenceLabel }: ResultCellProps) {
  const result = measurement.result;
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copy = VERDICT_COPY[result.verdict];
  const headline = result.headline.error;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sourceLine =
    result.headline.source === "circle"
      ? "Closest guess: the zone-edge circle fit."
      : result.headline.source === "endpoint"
        ? "Closest guess: start and finish clustering."
        : "Neither attack produced a guess.";

  return (
    <MotionConfig reducedMotion="user">
      <div className="h-full min-h-[260px]">
        {!open ? (
          <motion.div
            layoutId="velatum-result"
            initial={false}
            className={cn("flex h-full flex-col justify-between gap-5 border-l-2 bg-card p-6", TONE_BORDER[copy.tone])}
          >
            <div className="space-y-3">
              <CardLabel number={2}>Distance from guess to {referenceLabel.toLowerCase()}</CardLabel>
              <p className={cn("font-display text-7xl font-semibold leading-none", TONE_TEXT[copy.tone])} aria-live="polite">
                {headline === null ? "None" : formatMeters(headline)}
              </p>
              <EngineLine measurement={measurement} pending={pending} />
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={copy.tone}>{copy.tag}</Badge>
                <p className="text-sm">{copy.line}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {sourceLine} Before any defense: {m(result.baseline.error)}.
              </p>
            </div>
            <Button variant="outline" className="self-start" onClick={() => setOpen(true)}>
              Open the evidence
            </Button>
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center border border-dashed border-border p-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Evidence open
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="velatum-evidence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "linear" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              layoutId="velatum-result"
              role="dialog"
              aria-modal="true"
              aria-labelledby="velatum-evidence-title"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "max-h-[88vh] w-full max-w-3xl overflow-y-auto border border-border border-l-2 bg-background p-8",
                TONE_BORDER[copy.tone]
              )}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <CardLabel number={2}>Evidence, {subjectLabel}</CardLabel>
                  <h2 id="velatum-evidence-title" className="text-4xl">
                    <span className={TONE_TEXT[copy.tone]}>{headline === null ? "No guess" : formatMeters(headline)}</span> from the{" "}
                    {referenceLabel.toLowerCase()}, down from {m(result.baseline.error)}
                  </h2>
                </div>
                <Button ref={closeRef} variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
                <section className="space-y-2 bg-background p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Attack 1. Start and finish clustering</p>
                  <p className="text-sm leading-relaxed">
                    DBSCAN (75 m radius, 3 points minimum) over {result.endpoint.endpointCount} visible start and finish points.
                    The densest cluster holds {result.endpoint.clusterSize} of them.
                  </p>
                  <p className="font-display text-3xl">{m(result.endpoint.error)}</p>
                </section>
                <section className="space-y-2 bg-background p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Attack 2. Zone edge circle fit</p>
                  {result.circle ? (
                    <>
                      <p className="text-sm leading-relaxed">
                        RANSAC kept {result.circle.inliers} of {result.circle.exitCount} exit points on one circle, then a Kasa fit
                        recovered it.
                        {result.circle.radiusError !== null &&
                          ` Recovered radius is off by ${formatMeters(result.circle.radiusError)}, so the attacker also learns your zone size.`}
                      </p>
                      <p className="font-display text-3xl">{m(result.circle.error)}</p>
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Not run: there is no privacy zone yet, so the start and finish points are the door itself.
                    </p>
                  )}
                </section>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Settings measured: zone {settings.zoneRadius ? formatMeters(settings.zoneRadius) : "off"}, center moved{" "}
                {formatMeters(settings.centerOffset)}, up to {formatMeters(settings.extraTrim)} extra cut per recording.{" "}
                {result.referenceKind === "raw-estimate" &&
                  "For your own files the distance is measured from the raw-file guess, because Velatum never asks for your address."}
              </p>

              <div className="mt-8 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">What to do next</p>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed marker:text-primary">
                  {SAFETY_STEPS.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
