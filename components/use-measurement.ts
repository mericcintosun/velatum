"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BenchAdapter } from "@/lib/adapter";
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

/**
 * Seeds a real number synchronously (so server HTML shows one), then measures through
 * adapter.measure with latest-wins coalescing: at most one request in flight, the newest
 * waiting request replaces any older one, and a counter drops stale replies.
 */
export function useMeasurement(
  adapter: BenchAdapter,
  subject: MeasureSubject,
  measured: DefenseSettings
): { measurement: Measurement; pending: boolean } {
  const [measurement, setMeasurement] = useState<Measurement>(() => ({
    result: adapter.measureNow(subject.xy, subject.trueHome, measured, subject.seed),
    engine: "main-thread",
    ms: 0,
    fallback: null,
  }));
  const [pending, setPending] = useState(true);

  const latest = useRef(0);
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
          setMeasurement(m);
          setPending(false);
        }
      })
      .catch(() => {
        // Keep the last good number on screen; the adapters already fall back internally.
        if (alive.current && job.id === latest.current) setPending(false);
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

  return { measurement, pending };
}
