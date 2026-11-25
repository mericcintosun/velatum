import type { Metadata } from "next";
import Link from "next/link";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { LIMITATIONS, RUNNERS } from "@/lib/data";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Why Velatum exists, the two home-finding attacks it runs in your browser, the defenses it measures, and what it cannot see.",
};

const STEPS = [
  {
    title: "Read the files where they are",
    body: "The browser's own XML reader parses your GPX files, and a broken file gets a plain message instead of a crash.",
  },
  {
    title: "Attack 1: cluster the starts and finishes",
    body: "DBSCAN groups start and finish points within 75 m, and the densest group's centroid is the guess for home.",
  },
  {
    title: "Attack 2: fit a circle to the zone's edge",
    body: "Exits from a zone lie on a circle, so RANSAC plus a Kasa fit recovers its center.",
  },
  {
    title: "Defend and measure again",
    body: "Move the zone center a secret distance from home and cut a random length from each recording, then both attacks run again.",
  },
];

const BUILT = [
  ["Written during SafeSpace Hacks", "GPX reader and writer, synthetic runner generator, DBSCAN, Kasa fit, RANSAC, the defense model, every screen and all copy."],
  ["Pre-existing, credited", "Next.js, React, Tailwind CSS, shadcn/ui primitive patterns, Motion, zod, lucide-react, Cormorant Garamond and Mulish from Google Fonts."],
  ["Research we build on", "Hassan et al., USENIX Security 2018, and Dhondt et al. (KU Leuven), ACM CCS 2022, both showing privacy zones can be undone."],
  [
    "AI assistance",
    "AI coding agents (Claude Code) drafted much of the code and documentation from the builder's specifications; the builder chose the problem, directed and reviewed the changes, and ran the demo. The product itself calls no AI model.",
  ],
];

const TRUST = [
  "Files are read in the tab. The site's Content-Security-Policy sets connect-src to self, so the page cannot send them anywhere.",
  "No map tiles. A tile server would learn which neighborhood you are looking at, so the plot is a plain plane view.",
  "It only reads files you already own. It never fetches anyone's profile, and it has no search box for other people.",
  "The sample runners are synthetic and live at 0°N 0°E, in open sea, so no demo coordinate is a real home.",
  "Uploaded files never reach the URL. Only sample results are shareable.",
];

const SUMMARY = "flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary underline decoration-gold underline-offset-4";

function LimitationsEmptyState() {
  return (
    <div className="max-w-[68ch] space-y-4 border-l border-gold pl-4">
      <p className="text-sm text-muted-foreground">
        No limitations are listed in this build. The evidence view on the bench still names the distance leak it cannot measure.
      </p>
      <Button asChild variant="outline" size="sm" className="min-h-11">
        <Link href="/?runner=maya">Open the sample runner Maya</Link>
      </Button>
    </div>
  );
}

export default function AboutPage() {
  const [firstLimit, ...moreLimits] = LIMITATIONS;
  return (
    <article className="mx-auto max-w-5xl space-y-16 py-6">
      <header className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="space-y-5 lg:col-span-7">
          <CardLabel number={1}>Why it exists</CardLabel>
          <h1 className="text-4xl leading-[1.05] sm:text-5xl">A privacy zone you cannot test is a promise, not a protection</h1>
          <p className="max-w-[68ch] leading-relaxed text-muted-foreground">
            Researchers have twice shown that a privacy zone can be undone, so Velatum lets you test yours before someone else does.
          </p>
        </div>
        <figure className="space-y-2 lg:col-span-5">
          <SceneSlot n={2}
            alt="A dashed gold circle on bone paper with small orange dots where running tracks reappear, and a red crosshair landing on the hidden house at its center"
            width={960}
            height={640}
            className="border border-border"
          />
          <figcaption className="text-xs text-muted-foreground">Fig. 2. The exits of a 200 m zone draw its own outline.</figcaption>
        </figure>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={2}>The problem</CardLabel>
          <h2 className="text-2xl sm:text-3xl">Who is at risk, and from what</h2>
        </div>
        <div className="max-w-[68ch] space-y-4 leading-relaxed">
          <p>If 20 of 24 public runs begin on the same doorstep, anyone who wants to find a student who runs alone at night has the answer.</p>
          <details className="group border-t border-border pt-4">
            <summary className={SUMMARY}>Read what the research found</summary>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                Hassan and colleagues (USENIX Security 2018) showed that the endpoints of protected activities can be matched to
                recover the hidden location. Dhondt and colleagues at KU Leuven (ACM CCS 2022) reported that up to about 85% of
                protected locations, depending on the attack and dataset, could be inferred, including from the distances apps still
                display.
              </p>
              <p>Neither paper ships a tool for the person being tracked, and we could not find a public one. Velatum is that check.</p>
            </div>
          </details>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={3}>How it works</CardLabel>
          <h2 className="text-2xl sm:text-3xl">Four steps, all inside the browser tab</h2>
        </div>
        <ol className="grid gap-px border border-border bg-border md:grid-cols-12">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className={
                i % 3 === 0 ? "space-y-2 bg-background p-6 md:col-span-7" : "space-y-2 bg-background p-6 md:col-span-5"
              }
            >
              <p className="font-display text-3xl text-primary">{["I", "II", "III", "IV"][i]}</p>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <figure className="space-y-2 lg:col-span-5">
          <SceneSlot n={3}
            alt="The same gold zone moved off center with ragged, scattered exit dots; the red fitted circle sits far from the small house, which stays hidden"
            width={960}
            height={640}
            className="border border-border"
          />
          <figcaption className="text-xs text-muted-foreground">Fig. 3. Offset center, ragged edge: the fit lands somewhere else.</figcaption>
        </figure>
        <div className="space-y-5 lg:col-span-7">
          <CardLabel number={4}>A safe outcome</CardLabel>
          <h2 className="text-2xl sm:text-3xl">What a good result looks like</h2>
          <p className="max-w-[68ch] leading-relaxed">
            On the sample runner Maya ({RUNNERS[0].activities} synthetic night runs), the 200 m zone still points at her door, and
            moving its center with a ragged edge sends both guesses hundreds of meters away.
          </p>
          <Button asChild className="min-h-11 max-w-full whitespace-normal">
            <Link href="/?runner=maya&zone=200&offset=0&trim=0">Open Maya with a 200 m zone</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={5}>Trust</CardLabel>
          <h2 className="text-2xl sm:text-3xl">What we did so the tool does not become the threat</h2>
        </div>
        <div className="max-w-[68ch] space-y-4 leading-relaxed">
          <p>Your files are read in this tab, and the page&apos;s security policy blocks every request to another site.</p>
          <details className="border-t border-border pt-4">
            <summary className={SUMMARY}>Read all five safeguards</summary>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm marker:text-gold">
              {TRUST.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={6}>Technology and credits</CardLabel>
          <h2 className="text-2xl sm:text-3xl">Built here, borrowed, and credited</h2>
          <p className="max-w-[68ch] text-sm text-muted-foreground">Everything below runs on the page, and nothing is called on a server.</p>
        </div>
        <details className="max-w-[68ch] border-t border-border pt-4">
          <summary className={SUMMARY}>Credits, tools and research</summary>
          <div className="mt-4 grid gap-4">
            {BUILT.map(([title, body]) => (
              <Card key={title} className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{title}</p>
                <p className="mt-2 text-sm leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </details>
      </section>

      <section className="space-y-6">
        <figure className="space-y-2">
          <SceneSlot n={6}
            alt="A quiet street of small houses at dusk in ink and gold, every door unmarked"
            width={1200}
            height={480}
            className="border border-border"
          />
          <figcaption className="text-xs text-muted-foreground">Fig. 4. The goal: a street where no door stands out.</figcaption>
        </figure>
        <div className="space-y-2">
          <CardLabel number={7}>Limitations</CardLabel>
          <h2 className="text-2xl sm:text-3xl">What Velatum cannot see</h2>
        </div>
        {LIMITATIONS.length === 0 ? (
          <LimitationsEmptyState />
        ) : (
          <div className="max-w-[68ch] space-y-4 leading-relaxed">
            <p className="border-l border-gold pl-4 text-sm">{firstLimit}</p>
            {moreLimits.length > 0 && (
              <details className="border-t border-border pt-4">
                <summary className={SUMMARY}>Read the other {moreLimits.length} limitations</summary>
                <ul className="mt-4 space-y-3">
                  {moreLimits.map((l) => (
                    <li key={l} className="border-l border-gold pl-4 text-sm">
                      {l}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>
    </article>
  );
}
