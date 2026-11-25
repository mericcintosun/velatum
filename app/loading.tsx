import { CardLabel } from "@/components/ui/card";

// Static museum placeholder while the bench route renders. No pulse, no motion.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <CardLabel number={1}>Preparing the bench</CardLabel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-72 border border-border bg-card lg:col-span-7" />
        <div className="h-72 border border-border bg-card lg:col-span-5" />
        <div className="h-24 border border-border bg-card lg:col-span-12" />
      </div>
    </div>
  );
}
