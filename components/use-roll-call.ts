"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sampleSubject, type BenchAdapter, type SampleSubject } from "@/lib/adapter";
import type { Verdict } from "@/lib/attack";
import type { DefenseSettings, RunnerSummary } from "@/lib/types";

export interface RollCallRow {
  id: string;
  error: number | null;
  verdict: Verdict;
}

export type RollCallState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; rows: RollCallRow[]; protectedCount: number };

/** Internal state remembers which settings it was measured for, so an old roster never reads as the new one. */
type Stored =
  | { status: "idle" }
  | { status: "error"; key: string }
  | { status: "ready"; key: string; rows: RollCallRow[]; protectedCount: number };

function keyOf(s: DefenseSettings): string {
  return `${s.zoneRadius}:${s.centerOffset}:${s.extraTrim}`;
}

function isProtected(v: Verdict): boolean {
  return v === "protected" || v === "nothing-left";
}

/**
 * Cell F roll call: measures every sample runner at the current settings, one runner at a time,
 * through the same adapter.measure as cell B. Latest wins: a settings change (or a pause while
 * cell B measures) bumps the counter and every reply of the older sweep is dropped.
 */
export function useRollCall(
  adapter: BenchAdapter,
  runners: RunnerSummary[],
  settings: DefenseSettings,
  enabled: boolean
): RollCallState {
  const [stored, setStored] = useState<Stored>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);
  const doneKey = useRef<string | null>(null);
  const subjects = useRef<{ adapter: BenchAdapter; byId: Map<string, SampleSubject> } | null>(null);

  // A retry shows the loading line again, then starts a fresh sweep for the same settings.
  const retry = useCallback(() => {
    setStored({ status: "idle" });
    setAttempt((n) => n + 1);
  }, []);

  const { zoneRadius, centerOffset, extraTrim } = settings;
  const key = keyOf(settings);

  useEffect(() => {
    if (!enabled) return;
    if (doneKey.current === key) return;
    const id = ++latest.current;
    const s: DefenseSettings = { zoneRadius, centerOffset, extraTrim };

    if (!subjects.current || subjects.current.adapter !== adapter) {
      subjects.current = { adapter, byId: new Map() };
    }
    const cache = subjects.current.byId;
    const subjectFor = (runnerId: string): SampleSubject => {
      const hit = cache.get(runnerId);
      if (hit) return hit;
      const made = sampleSubject(adapter, runnerId);
      cache.set(runnerId, made);
      return made;
    };

    const sweep = async () => {
      const rows: RollCallRow[] = [];
      try {
        for (const r of runners) {
          if (id !== latest.current) return;
          const subject = subjectFor(r.id);
          const m = await adapter.measure(subject.xy, subject.trueHome, s, subject.seed);
          if (id !== latest.current) return;
          rows.push({ id: r.id, error: m.result.headline.error, verdict: m.result.verdict });
        }
      } catch {
        if (id === latest.current) setStored({ status: "error", key });
        return;
      }
      if (id !== latest.current) return;
      doneKey.current = key;
      setStored({ status: "ready", key, rows, protectedCount: rows.filter((r) => isProtected(r.verdict)).length });
    };
    void sweep();

    return () => {
      // A newer sweep (or unmount) makes every reply of this one stale.
      if (latest.current === id) latest.current += 1;
    };
  }, [adapter, runners, key, zoneRadius, centerOffset, extraTrim, enabled, attempt]);

  if (stored.status === "ready" && stored.key === key) {
    return { status: "ready", rows: stored.rows, protectedCount: stored.protectedCount };
  }
  if (stored.status === "error" && stored.key === key) {
    return { status: "error", retry };
  }
  return { status: "loading" };
}
