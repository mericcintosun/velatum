"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

/** The brand link to "/", holding the one BrandMark, marked as the current page on the bench. */
export function BrandLink() {
  const active = usePathname() === "/";
  return (
    <Link
      href="/"
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-3 font-display text-2xl font-semibold tracking-wide text-foreground"
    >
      <BrandMark />
      Velatum
    </Link>
  );
}

/** The one header link, "How it works", marked as current on /about. */
export function HeaderLink() {
  const active = usePathname() === "/about";
  return (
    <Link
      href="/about"
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground underline decoration-transparent underline-offset-8 transition-colors hover:text-foreground hover:decoration-gold",
        active && "text-foreground decoration-gold"
      )}
    >
      How it works
    </Link>
  );
}
