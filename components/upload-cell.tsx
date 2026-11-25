"use client";

import { useCallback, useRef, useState, type DragEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BROKEN_GPX_SAMPLE } from "@/lib/data";
import type { Track } from "@/lib/geo";
import { parseGpxFile, type ParseIssue } from "@/lib/gpx";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

// Motion M5: opacity only, linear, 280 ms, no transform.
const FADE = { duration: 0.28, ease: "linear" } as const;

const listVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: FADE },
};

interface UploadCellProps {
  /** Called once three or more activities were read. The tracks never leave this tab. */
  onLoaded: (tracks: Track[], fileNames: string[], seed: number) => void;
  /** Returns the bench to the sample runner and forgets the uploaded tracks. */
  onForget: () => void;
  /** True while the bench shows uploaded files instead of a sample runner. */
  uploadActive: boolean;
  /** Changes whenever a sample runner is picked in cell F; clears the issue list. */
  resetKey?: number;
}

function Stage({ id, children }: { id: string; children: ReactNode }) {
  return (
    <motion.div data-stage={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE} className="space-y-3">
      {children}
    </motion.div>
  );
}

function IssueList({ issues }: { issues: ParseIssue[] }) {
  return (
    <motion.ul className="space-y-2" variants={listVariants} initial="hidden" animate="shown">
      {issues.map((issue, i) => (
        <motion.li key={`${issue.file}-${i}`} variants={itemVariants} className="flex gap-2 text-xs leading-relaxed">
          <Badge variant={issue.level === "error" ? "bad" : "warn"} className="shrink-0">
            {issue.level}
          </Badge>
          <span>
            <span className="font-semibold">{issue.file}:</span> {issue.message}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function UploadReadingSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reading your files in this tab</p>
      <div className="space-y-3" aria-hidden="true">
        <div className="h-px w-full bg-gold" />
        <div className="h-px w-5/6 bg-border" />
        <div className="h-px w-2/3 bg-border" />
      </div>
    </div>
  );
}

export function UploadErrorState({
  issues,
  onChooseOther,
  onBackToSample,
}: {
  issues: ParseIssue[];
  onChooseOther: () => void;
  /** Only passed while an upload is active. */
  onBackToSample?: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bad">These files could not be checked</p>
      <IssueList issues={issues} />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Button variant="outline" size="sm" onClick={onChooseOther}>
          Choose other files
        </Button>
        {onBackToSample && (
          <Button variant="link" size="sm" className="h-auto px-0" onClick={onBackToSample}>
            Back to the sample runner
          </Button>
        )}
      </div>
    </div>
  );
}

export function UploadWarnings({ issues }: { issues: ParseIssue[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warn">Checked, with notes</p>
      <IssueList issues={issues} />
    </div>
  );
}

export function UploadLoadedState({ fileCount }: { fileCount: number }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      Your {fileCount} file{fileCount === 1 ? " is" : "s are"} on the bench above. They stay in this tab and are forgotten when you
      close it.
    </p>
  );
}

export function UploadEmptyState({ onTryBroken }: { onTryBroken: () => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs leading-relaxed text-muted-foreground">
        No files checked yet. Your results replace the sample runner and never leave this tab.
      </p>
      <Button variant="link" size="sm" className="h-auto px-0" onClick={onTryBroken}>
        Try a broken file
      </Button>
    </div>
  );
}

/** Cell D: the one primary call to action. Kit signature 3 stages its states. */
export function UploadCell({ onLoaded, onForget, uploadActive, resetKey = 0 }: UploadCellProps) {
  const [issues, setIssues] = useState<ParseIssue[]>([]);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [seenReset, setSeenReset] = useState(resetKey);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  // A runner picked in cell F clears old messages (adjusted during render, no effect).
  if (seenReset !== resetKey) {
    setSeenReset(resetKey);
    setIssues([]);
  }

  const readFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list);
      if (!files.length) return;
      setReading(true);
      const found: Track[] = [];
      const next: ParseIssue[] = [];
      try {
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
          setLoadedCount(files.length);
          onLoaded(found, files.map((f) => f.name), seed);
        }
      } finally {
        setIssues(next);
        setReading(false);
      }
    },
    [onLoaded]
  );

  const openPicker = () => fileRef.current?.click();

  const tryBrokenFile = () => {
    setIssues(parseGpxFile("interrupted-download.gpx", BROKEN_GPX_SAMPLE).issues);
  };

  const forget = () => {
    setIssues([]);
    onForget();
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (!reading) setDragging(true);
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (reading) return;
    void readFiles(e.dataTransfer.files);
  };

  const hasError = issues.some((i) => i.level === "error");
  const stage = reading ? "reading" : hasError ? "error" : issues.length > 0 ? "warnings" : uploadActive ? "loaded" : "empty";

  return (
    <Card
      id="your-files"
      className={cn("velatum-enter flex scroll-mt-24 flex-col gap-4 p-6 lg:col-span-4", dragging && "border-primary bg-secondary")}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
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
          if (e.target.files && !reading) void readFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button size="lg" onClick={openPicker} disabled={reading}>
        {reading ? "Reading files" : "Choose GPX files"}
      </Button>
      {uploadActive && (
        <Button variant="link" size="sm" className="h-auto self-start px-0" onClick={forget}>
          Forget my files
        </Button>
      )}

      <MotionConfig reducedMotion="user">
        <div className="border-t border-border pt-3" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {stage === "reading" && (
              <Stage key="reading" id="reading">
                <UploadReadingSkeleton />
              </Stage>
            )}
            {stage === "error" && (
              <Stage key="error" id="error">
                <UploadErrorState issues={issues} onChooseOther={openPicker} onBackToSample={uploadActive ? forget : undefined} />
              </Stage>
            )}
            {stage === "warnings" && (
              <Stage key="warnings" id="warnings">
                <UploadWarnings issues={issues} />
              </Stage>
            )}
            {stage === "loaded" && (
              <Stage key="loaded" id="loaded">
                <UploadLoadedState fileCount={loadedCount} />
              </Stage>
            )}
            {stage === "empty" && (
              <Stage key="empty" id="empty">
                <UploadEmptyState onTryBroken={tryBrokenFile} />
              </Stage>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </Card>
  );
}
