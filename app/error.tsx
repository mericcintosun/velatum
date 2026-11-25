"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// The error message is never printed: it could echo file content, and it would not help the reader.
// This is the closest error boundary for both "/" and "/about".
export default function BenchErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-xl space-y-6 border-t border-gold py-24 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Exhibit closed</p>
      <p className="font-display text-5xl font-semibold tracking-wide">Velatum</p>
      <h1 className="text-3xl">The bench stopped. Your files were not sent anywhere.</h1>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button className="min-h-11" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild variant="outline" className="min-h-11 max-w-full whitespace-normal">
          <Link href="/?runner=maya">Open the sample runner Maya</Link>
        </Button>
      </div>
    </section>
  );
}
