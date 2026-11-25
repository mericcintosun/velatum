import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

// IDENTITY HEADER row: solid ground, LINE border-b, sticky. The mark, one link, one action.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-6 px-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3 font-display text-2xl font-semibold tracking-wide text-foreground">
          <BrandMark />
          Velatum
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/about"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground underline decoration-transparent underline-offset-8 transition-colors hover:text-foreground hover:decoration-gold"
          >
            How it works
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/#your-files">Check your files</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
