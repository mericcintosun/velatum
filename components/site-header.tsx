import Link from "next/link";
import { BrandLink, HeaderLink } from "@/components/header-link";
import { Button } from "@/components/ui/button";

// IDENTITY HEADER row: solid ground, LINE border-b, sticky. The mark, one link, one action.
// The brand link (with the one BrandMark) and "How it works" live in header-link.tsx so they
// can read the current path and set aria-current.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[82.5rem] items-center justify-between gap-6 px-5 lg:px-10">
        <BrandLink />
        <nav aria-label="Primary" className="flex items-center gap-5">
          <HeaderLink />
          <Button asChild variant="outline" size="sm">
            <Link href="/#your-files">Check your files</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
