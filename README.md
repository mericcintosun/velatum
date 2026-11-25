# Velatum

Drop in your run or ride recordings and Velatum shows you how someone would find your home from them. Then try hiding settings and watch the same attack miss by more and more meters. Your files never leave your device.

The judged click path is in DEMO.md.

> Live demo: https://velatum.vercel.app

## The problem

People who share their runs and rides publicly, especially women who run alone and students who train at night, give away more than a route. Most recordings start and stop at the front door. Fitness apps offer a privacy zone that hides the first and last stretch, and most people assume that settles it.

It does not. Hassan et al. (USENIX Security 2018) showed that the hidden location can be recovered from protected activities. Dhondt et al. at KU Leuven (ACM CCS 2022) reported recovery rates up to about 85% depending on attack and dataset. Nobody gives the person at risk a way to check their own setting. We could not find a single public tool that looks at a GPX file and says "this points at your home, by this many meters".

## The solution

Velatum is one screen. You load your GPX files (or keep the synthetic sample runner that is already loaded) and the page runs two attacks on them:

1. **Start and finish clustering.** DBSCAN (75 m radius, 3 points minimum) groups every start and finish point. The densest group's centroid is the guess for home.
2. **Zone edge circle fit.** A privacy zone cuts everything within a fixed radius of its center, so the points where tracks reappear lie on a circle. RANSAC throws out the exits that do not fit, then a Kasa least-squares fit recovers the circle, and the hidden center with it.

Then you defend. Three sliders: zone radius, how far to move the zone center away from home (in a secret random direction), and an extra random length cut from each recording. Every change re-runs both attacks and the big number updates: the distance from the closer guess to the home. When you are happy, you download the cleaned GPX, cut exactly as measured.

### A safe outcome, step by step

Open the sample runner Maya (24 synthetic night runs) and follow the result card:

- **No zone.** The start and finish cluster lands a few meters from her door. Red card.
- **200 m zone, centered on the door** (what most apps do). The circle fit recovers the hidden center almost exactly. Still red. The zone was not protecting her.
- **Offset + ragged edge preset** (1 km zone, center moved 700 m, up to 400 m extra cut per recording). Both attacks now guess hundreds of meters away. The card turns green and the cleaned file downloads with those cuts.

Every sample state is encoded in the URL (`/?runner=maya&zone=1000&offset=700&trim=400`), so a judge can open the exact same measurement we did.

<!-- PROOF:BEGIN bench-numbers -->
Measured by `npm run proof` on 2026-11-25 with the same `runBench` the Web Worker runs (runner Maya, fixed seed).

| Preset | Closest guess | Distance to sample home | Verdict |
| --- | --- | --- | --- |
| No zone | start and finish clustering | 2 m | exposed |
| 200 m zone | zone edge circle fit | 1 m | exposed |
| Offset + ragged edge | start and finish clustering | 447 m | protected |
<!-- PROOF:END bench-numbers -->

### A limitation we want you to know about

Velatum measures the geometry left in the file. It does not cover the distance leak attack from the CCS 2022 paper, where an app still displays the full distance of a run and that number gives the zone away. Hide total distance in your app as well. More limitations are listed on the How it works page.

## Measured results

`npm run proof` computes these with the same `runBench` the Web Worker runs and rewrites only the blocks below.

<!-- PROOF:BEGIN bench-runners -->
Headline distance from the closer guess to each synthetic sample home, measured on 2026-11-25.

| Runner | No zone | 200 m zone | Offset + ragged edge |
| --- | --- | --- | --- |
| Maya R. | 2 m | 1 m | 447 m |
| Kerem A. | 2 m | 4 m | 426 m |
| Aylin D. | 1 m | 1 m | 333 m |
| Jonas W. | 5 m | 787 m | 525 m |
| Priya S. | 1 m | 3 m | 570 m |
| Tomás L. | 2 m | 206 m | 514 m |
| Sofia M. | 3 m | 1 m | 228 m |
| Elif K. | 2 m | 1 m | 775 m |
<!-- PROOF:END bench-runners -->

<!-- PROOF:BEGIN bench-tests -->
`npm test` on 2026-11-25: 14 passed, 0 failed.

Worker latency is measured in the browser and shown under the result; this script does not measure it.
<!-- PROOF:END bench-tests -->

## Trust and responsible design

- Files are parsed in the browser. The production Content-Security-Policy sets `connect-src 'self'`, so the page physically cannot send them to another origin.
- No map tiles. A tile server would learn which neighborhood you are looking at, so the plot is a plain plane view.
- It reads only files you already have. There is no search for other people's profiles and no scraping.
- All demo data is synthetic. Sample homes sit on a fictional street grid at 0°N 0°E, in open sea, so no demo coordinate is anyone's address.
- Uploaded files never reach the URL. For your own files there is no known "true home", so Velatum measures from the raw-file guess and says so on screen.

## How it uses the required tech

SafeSpace Hacks does not require a sponsor SDK. The core is our own code: a GPX reader and writer on the browser's DOMParser, a seeded synthetic runner generator, DBSCAN, the Kasa circle fit, RANSAC, and the defense model, all in `lib/`. Motion drives the one transition where the result card grows into the evidence view.

The bench runs in a Web Worker in your tab (`lib/bench.worker.ts`): every message is checked with zod, a hung worker is restarted once, and if it still fails the page computes the result itself and says so under the number.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4 with shadcn/ui-style primitives
- Motion (`motion/react`) for the shared-layout result transition
- Hand-written DBSCAN, Kasa fit and RANSAC (no geometry or clustering library)
- Web Worker (browser platform API) so the bench never blocks the page
- zod 4 for worker message validation
- Vitest 3 for the snapshot and property tests, tsx to run the proof script
- Deployed on Vercel as a static-friendly app with a strict CSP

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
npm test          # snapshot and property tests over the seeded runners
npm run proof     # measures the runners and rewrites the Measured results blocks
```

No environment variables are needed. `npm run build && npm start` runs the production build with the CSP enabled.

## What was built during the event

Built during SafeSpace Hacks: everything in `lib/` (GPX reader and writer, synthetic generator, both attacks, defenses), every component in `components/` except the primitive patterns, all pages and copy, and the illustrations.

Pre-existing and credited: Next.js, React, Tailwind CSS, the shadcn/ui primitive patterns in `components/ui/`, Motion, and the Cormorant Garamond and Mulish typefaces from Google Fonts. The attack ideas come from Hassan et al. (USENIX Security 2018) and Dhondt et al. (ACM CCS 2022).

## What we would build next

- Cover the distance leak: compare displayed distance with visible distance and flag zones that leak through it.
- Report the average error over 20 seeds per sample runner, so the defense presets are tuned on numbers, not intuition.
- An optional map view with a clear warning that the tile server sees the area.
- Strip or shift timestamps as a fourth defense.

## AI use

<!-- AI use disclosure: adjust to the hackathon's rules before submitting. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.
