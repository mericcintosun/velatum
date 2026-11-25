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
    body: "Your GPX files are parsed with the browser's own XML reader. Broken files, planned routes without recordings and files with no timestamps each get a plain message instead of a crash.",
  },
  {
    title: "Attack 1: cluster the starts and finishes",
    body: "DBSCAN groups every start and finish point within 75 m of each other. The densest group, its centroid, is the attacker's guess for home. This is the attack a privacy zone is meant to stop.",
  },
  {
    title: "Attack 2: fit a circle to the zone's edge",
    body: "A zone cuts every point within a fixed radius of its center, so the places where tracks reappear lie on a circle. RANSAC drops the exits that do not fit and a Kasa least-squares fit recovers the circle, its center and its radius.",
  },
  {
    title: "Defend and measure again",
    body: "Move the zone center a secret distance away from home and cut a different random length from each recording. Both attacks run again on every change, and the page reports the closer of the two guesses in meters.",
  },
];

const BUILT = [
  ["Written during SafeSpace Hacks", "GPX reader and writer, synthetic runner generator, DBSCAN, Kasa fit, RANSAC, the defense model, every screen and all copy."],
  ["Pre-existing, credited", "Next.js, React, Tailwind CSS, shadcn/ui primitive patterns, Motion for the result transition, Cormorant Garamond and Mulish from Google Fonts."],
  ["Research we build on", "Hassan et al., USENIX Security 2018, and Dhondt et al. (KU Leuven), ACM CCS 2022, both showing privacy zones can be undone."],
  ["AI assistance", "AI coding assistants helped with scaffolding and boilerplate. Architecture, the attack choices and the final review are ours."],
];

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-5xl space-y-16 py-6">
      <header className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="space-y-5 lg:col-span-7">
          <CardLabel number={1}>Why it exists</CardLabel>
          <h1 className="text-5xl leading-[1.05]">A privacy zone you cannot test is a promise, not a protection</h1>
          <p className="max-w-[68ch] leading-relaxed text-muted-foreground">
            Runners and riders share recordings publicly, and most of those recordings start and stop at the front door. Fitness
            apps offer a privacy zone that hides the first and last stretch. Researchers have shown, twice, that the hidden spot
            can still be found. Velatum lets the person at risk check their own setting before someone else does.
          </p>
        </div>
        <figure className="space-y-2 lg:col-span-5">
          <SceneSlot
            n={2}
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
          <h2 className="text-4xl">Who is at risk, and from what</h2>
        </div>
        <div className="max-w-[68ch] space-y-4 leading-relaxed">
          <p>
            The person we built for is a student who runs alone at night, or anyone who has a reason not to be found: a
            stalker, an ex, a persistent stranger from the comments. Their public activity feed is a dataset. If 20 of 24 runs
            begin on the same doorstep, the doorstep is the answer.
          </p>
          <details className="group border-t border-border pt-4">
            <summary className="text-sm font-semibold text-primary underline decoration-gold underline-offset-4">
              Read what the research found
            </summary>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                Hassan and colleagues (USENIX Security 2018) showed that the endpoints of protected activities can be matched to
                recover the hidden location. Dhondt and colleagues at KU Leuven (ACM CCS 2022) went further, reporting that a
                large share of protected locations, up to about 85% depending on the attack and dataset, could be inferred,
                including from the distances apps still display.
              </p>
              <p>
                Neither paper ships a tool for the person being tracked. Apps apply the zone, but never show whether it works.
                We could not find a public tool that checks a GPX file for home exposure. Velatum is that check.
              </p>
            </div>
          </details>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={3}>How it works</CardLabel>
          <h2 className="text-4xl">Four steps, all inside the browser tab</h2>
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
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <figure className="space-y-2 lg:col-span-5">
          <SceneSlot
            n={3}
            alt="The same gold zone moved off center with ragged, scattered exit dots; the red fitted circle sits far from the small house, which stays hidden"
            width={960}
            height={640}
            className="border border-border"
          />
          <figcaption className="text-xs text-muted-foreground">Fig. 3. Offset center, ragged edge: the fit lands somewhere else.</figcaption>
        </figure>
        <div className="space-y-5 lg:col-span-7">
          <CardLabel number={4}>A safe outcome</CardLabel>
          <h2 className="text-4xl">What a good result looks like</h2>
          <p className="max-w-[68ch] leading-relaxed">
            Load the sample runner Maya ({RUNNERS[0].activities} synthetic night runs). With no zone, the start and finish cluster
            sits a few meters from her door. Turn on the typical 200 m zone and the circle fit finds the door again. Apply the
            offset and ragged-edge preset and both guesses land hundreds of meters away. The result card turns green, the link in
            the address bar reproduces the exact numbers, and the cleaned file downloads with the same cuts.
          </p>
          <Button asChild>
            <Link href="/?runner=maya&zone=200&offset=0&trim=0">Open Maya with a 200 m zone</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={5}>Trust</CardLabel>
          <h2 className="text-4xl">What we did so the tool does not become the threat</h2>
        </div>
        <ul className="max-w-[68ch] list-disc space-y-3 pl-5 leading-relaxed marker:text-gold">
          <li>Files are read in the tab. The site&apos;s Content-Security-Policy sets connect-src to self, so the page cannot send them anywhere.</li>
          <li>No map tiles. A tile server would learn which neighborhood you are looking at, so the plot is a plain plane view.</li>
          <li>It only reads files you already own. It never fetches anyone&apos;s profile, and it has no search box for other people.</li>
          <li>The sample runners are synthetic and live at 0°N 0°E, in open sea, so no demo coordinate is a real home.</li>
          <li>Uploaded files never reach the URL. Only sample results are shareable.</li>
        </ul>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={6}>Limitations</CardLabel>
          <h2 className="text-4xl">What Velatum cannot see</h2>
        </div>
        <ul className="max-w-[68ch] space-y-3 leading-relaxed">
          {LIMITATIONS.map((l) => (
            <li key={l} className="border-l border-gold pl-4 text-sm">
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <CardLabel number={7}>Technology and credits</CardLabel>
          <h2 className="text-4xl">Built here, borrowed, and credited</h2>
          <p className="max-w-[68ch] text-sm text-muted-foreground">
            SafeSpace Hacks names no sponsor SDK. Everything listed runs on the page; nothing is called on a server.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-12">
          {BUILT.map(([title, body], i) => (
            <Card key={title} className={i === 0 ? "p-6 md:col-span-8" : i === 1 ? "p-6 md:col-span-4" : i === 2 ? "p-6 md:col-span-5" : "p-6 md:col-span-7"}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{title}</p>
              <p className="mt-2 text-sm leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </section>
    </article>
  );
}
