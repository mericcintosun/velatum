import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardLabel } from "@/components/ui/card";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl space-y-6 border-t border-gold py-24 text-center">
      <CardLabel number={404} className="justify-center">
        Empty plinth
      </CardLabel>
      <p className="font-display text-5xl font-semibold tracking-wide">Velatum</p>
      <h1 className="text-3xl">No exhibit here</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This address shows nothing. The bench with the sample runner Maya is one click away.
      </p>
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/?runner=maya">Back to the bench</Link>
      </Button>
    </section>
  );
}
