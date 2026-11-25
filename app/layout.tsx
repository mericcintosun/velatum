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

export const metadata: Metadata = {
  title: "Velatum: does your privacy zone hide your front door?",
  description:
    "Drop in your run or ride GPX files and Velatum shows how a stalker would find your home from them, then measures how many meters each hiding setting makes the attack miss by. Files never leave your device.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-[1320px] px-5 pb-20 pt-8 lg:px-10">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between lg:px-10">
            <p>Velatum. Built for SafeSpace Hacks 2026 by a student team.</p>
            <p>Every sample runner is synthetic and lives on a fictional grid at 0°N 0°E.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
