import { CardLabel } from "@/components/ui/card";

// Static placeholder while the How it works page renders. No pulse, no motion.
export default function AboutSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-5xl space-y-8 py-6">
      <CardLabel number={1}>Opening how it works</CardLabel>
      <div className="space-y-6" aria-hidden="true">
        <div className="h-48 border border-border border-t-gold bg-card" />
        <div className="h-72 border border-border bg-card" />
      </div>
    </div>
  );
}
