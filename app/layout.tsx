import type { Metadata } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

const body = Mulish({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mulish",
});

const TITLE = "Velatum: does your privacy zone hide your front door?";
const DESCRIPTION =
  "Your run files can lead a stalker to your door. Velatum runs that attack in your browser and measures how far each hiding setting throws it off.";

// The image for both cards comes from app/opengraph-image.tsx; metadataBase makes its URL absolute.
export const metadata: Metadata = {
  metadataBase: new URL("https://velatum.vercel.app"),
  title: {
    default: TITLE,
    template: "%s | Velatum",
  },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Velatum",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FOOTER_LINK =
  "inline-flex min-h-11 items-center text-primary underline decoration-gold underline-offset-4 hover:text-foreground";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-[82.5rem] px-5 pb-20 pt-8 lg:px-10">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-[82.5rem] flex-col gap-2 px-5 py-8 text-xs text-muted-foreground lg:px-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <p>Velatum. Built for SafeSpace Hacks 2026 by a student team.</p>
              <p>Every sample runner is synthetic and lives on a fictional grid at 0°N 0°E.</p>
            </div>
            <p className="flex flex-wrap items-center gap-x-4">
              <span>No wallet, no contract, no account. Source and security notes:</span>
              <a href="https://github.com/mericcintosun/velatum" target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                Source on GitHub
              </a>
              <a
                href="https://github.com/mericcintosun/velatum/blob/main/SECURITY.md"
                target="_blank"
                rel="noopener noreferrer"
                className={FOOTER_LINK}
              >
                SECURITY.md
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
