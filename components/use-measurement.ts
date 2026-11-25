"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BenchAdapter } from "@/lib/adapter";
import { benchError } from "@/lib/errors";
import type { DefenseSettings, Measurement, XY } from "@/lib/types";

export interface MeasureSubject {
  xy: XY[][];
  trueHome: XY | null;
  seed: number;
}

interface Job {
  id: number;
  adapter: BenchAdapter;
  subject: MeasureSubject;
  settings: DefenseSettings;
}

export interface MeasurementState {
  measurement: Measurement;
  /** True while a newer measurement is on its way. */
  pending: boolean;
  /**
   * True while the shown measurement was computed for a different subject than the current
   * one (a runner switch or a file load whose answer has not landed yet). A stale result must
   * not be drawn over the new tracks and must not be downloaded.
   */
  stale: boolean;
}

/**
 * Seeds a real number synchronously (so server HTML shows one), then measures through
 * adapter.measure with latest-wins coalescing: at most one request in flight, the newest
 * waiting request replaces any older one, and a counter drops stale replies.
 */
export function useMeasurement<S extends MeasureSubject>(
  adapter: BenchAdapter,
  subject: S,
  measured: DefenseSettings
): MeasurementState {
  const [measurement, setMeasurement] = useState<Measurement>(() => ({
    result: adapter.measureNow(subject.xy, subject.trueHome, measured, subject.seed),
    engine: "main-thread",
    ms: 0,
    fallback: null,
  }));
  const [pending, setPending] = useState(true);

  const latest = useRef(0);
  // The subject the shown measurement belongs to, kept next to the job id.
  const shownSubject = useRef<MeasureSubject>(subject);
  const inFlight = useRef(false);
  const queued = useRef<Job | null>(null);
  const alive = useRef(true);

  // Annotated so the self-call in finally() does not make the type circular.
  const pump: () => void = useCallback(() => {
    if (inFlight.current || !queued.current) return;
    const job = queued.current;
    queued.current = null;
    inFlight.current = true;
    job.adapter
      .measure(job.subject.xy, job.subject.trueHome, job.settings, job.subject.seed)
      .then((m) => {
        if (alive.current && job.id === latest.current) {
          shownSubject.current = job.subject;
          setMeasurement(m);
          setPending(false);
        }
      })
      .catch(() => {
        if (!alive.current || job.id !== latest.current) return;
        // The adapters already fall back internally; this is the last line. Never leave an
        // answer for the old subject on screen: compute the new one here.
        try {
          const result = job.adapter.measureNow(job.subject.xy, job.subject.trueHome, job.settings, job.subject.seed);
          shownSubject.current = job.subject;
          setMeasurement({ result, engine: "main-thread-fallback", ms: 0, fallback: benchError("worker-error") });
        } catch {
          // Keep the last good number; `stale` stays true so it is neither drawn nor downloaded.
        }
        setPending(false);
      })
      .finally(() => {
        inFlight.current = false;
        pump();
      });
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const id = ++latest.current;
    queued.current = { id, adapter, subject, settings: measured };
    setPending(true);
    pump();
  }, [adapter, subject, measured, pump]);

  const stale = shownSubject.current !== subject;
  return { measurement, pending, stale };
}
