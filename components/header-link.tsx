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
      className="flex min-h-11 items-center gap-3 font-display text-2xl font-semibold tracking-wide text-foreground"
    >
      <BrandMark />
      Velatum
    </Link>
  );
}

/** The one header link, "How it works", marked as current on /about. */
export function HeaderLink({
  className,
  onClick,
}: {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const active = usePathname() === "/about";
  return (
    <Link
      href="/about"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground underline decoration-transparent underline-offset-8 transition-colors hover:text-foreground hover:decoration-gold",
        active && "text-foreground decoration-gold",
        className
      )}
    >
      How it works
    </Link>
  );
}

/**
 * Below md the header's one link and one action sit in a native disclosure. The mark stays
 * outside it, in BrandLink. A click on either link closes the panel.
 */
export function MobileMenu() {
  const close = (e: React.MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.closest("details");
    if (details) details.open = false;
  };
  return (
    <details className="group md:hidden">
      <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center border border-gold px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <nav
        aria-label="Primary"
        className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-border bg-background px-5 pb-4 pt-2"
      >
        <HeaderLink className="w-full" onClick={close} />
        <Link
          href="/#your-files"
          onClick={close}
          className="inline-flex min-h-11 w-full items-center border border-gold px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground hover:bg-secondary"
        >
          Check your files
        </Link>
      </nav>
    </details>
  );
}
