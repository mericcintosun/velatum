import { CardLabel } from "@/components/ui/card";

// Static museum placeholder while the bench route renders. No pulse, no motion.
// The cell spans mirror the bento in components/exposure-bench.tsx (A 7, B 5, D 4, E 3, F 12).
export default function BenchSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <CardLabel number={1}>Preparing the bench</CardLabel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-hidden="true">
        <div className="h-96 border border-border bg-card lg:col-span-7 lg:row-span-2" />
        <div className="h-64 border border-border bg-card lg:col-span-5" />
        <div className="h-64 border border-border bg-card lg:col-span-5 lg:col-start-8" />
        <div className="h-48 border border-border bg-card lg:col-span-4" />
        <div className="h-48 border border-border bg-card lg:col-span-3" />
        <div className="h-24 border border-border bg-card lg:col-span-12" />
      </div>
    </div>
  );
}
