# Devpost submission: Velatum

Fields in the order the Devpost form asks for them. Copy each block into its field.

## Project name

Velatum

## Elevator pitch (200 characters max)

Velatum runs the published home-finding attacks on your run and ride files, in your browser, and shows how many meters each privacy setting makes them miss by.

## About the project

### Inspiration

Most public runs and rides start and stop at the front door. Fitness apps offer a privacy zone that hides the first and last stretch, and two research papers (Hassan et al., USENIX Security 2018; Dhondt et al., ACM CCS 2022) showed that the hidden spot can still be found. The people at risk, such as a student who runs alone at night, have no way to check their own setting. We wanted to give them that check.

### What it does

Velatum is one screen. It loads your GPX files, or a synthetic sample runner that is already there, and runs two attacks in your browser tab: start and finish clustering (DBSCAN) and a zone edge circle fit (RANSAC plus a Kasa fit). It shows the distance from the closer guess to the home. Then you defend: change the zone radius, drag the zone center away from home on the plot, or cut a random length from each recording, and both attacks run again. A roll call measures all 8 synthetic sample runners at the same settings. When the guess misses by enough, you download a cleaned, metadata-free GPX file cut exactly as measured. Your files never leave the tab: the page's Content-Security-Policy blocks every request to another origin.

One safe outcome, measured on the sample runner Maya:

<!-- PROOF:BEGIN bench-numbers -->
Measured by `npm run proof` on 2026-11-25 with the same `runBench` the Web Worker runs (runner Maya, fixed seed).

| Preset | Closest guess | Distance to sample home | Verdict |
| --- | --- | --- | --- |
| No zone | start and finish clustering | 2 m | exposed |
| 200 m zone | zone edge circle fit | 1 m | exposed |
| Offset + ragged edge | start and finish clustering | 447 m | protected |
<!-- PROOF:END bench-numbers -->

One limitation: Velatum does not cover the distance leak attack from the CCS 2022 paper, where an app still shows the full distance of a run and that number gives the zone away. Velatum only measures the geometry left in the file, so hide total distance in your app as well.

### How we built it

Next.js 15 and React 19 with TypeScript, Tailwind CSS 4 and Motion 14. The attacks, the defense model, the GPX reader and writer and the synthetic runner generator are hand-written in `lib/`, with no clustering or geometry library. The bench runs in a Web Worker; every message is checked with zod, a hung worker is restarted once, and the page falls back to computing on the main thread. Vitest covers the bench with snapshot and property tests, and a proof script writes the measured numbers into the README.

### Challenges we ran into

Keeping every number honest. A sample home had to be known to measure a distance, so the sample runners are synthetic and live on a fictional grid at 0°N 0°E. For uploaded files there is no true home, so Velatum measures from the raw-file guess and says so. Making the defense deterministic was the other one: the secret offset direction and the random cuts come from a seeded generator, so a shared link reproduces the same measurement.

### Accomplishments that we're proud of

The whole safety claim is checkable. The settings live in the URL, the same bench runs in the worker and in the proof script, and the page makes no network request at all.

### What we learned

A privacy zone centered on the door mostly redraws the door: the points where tracks reappear outline the circle, and its center is the home. Moving the center and roughening the edge is what makes the guesses miss.

### What's next

Cover the distance leak, report the average error over 20 seeds per sample runner, an optional map view with a clear warning about the tile server, and timestamp shifting as a fourth defense.

## Work done during the event vs pre-existing

Built during SafeSpace Hacks: everything in `lib/` (GPX reader and writer, synthetic generator, both attacks, the defense model, the worker bench), every component in `components/` except the primitive patterns in `components/ui/`, both pages, all copy, the illustrations and the tests. Pre-existing and credited: Next.js, React, Tailwind CSS, the shadcn/ui primitive patterns, Motion, zod, lucide-react, Vitest, and the Cormorant Garamond and Mulish typefaces from Google Fonts. The attack ideas come from Hassan et al. (USENIX Security 2018) and Dhondt et al. (ACM CCS 2022).

## Credits and AI use

The hackathon's policy, as the record states it: "AI tools may be used; AI assistance must be named in the credits."

AI coding agents (Claude Code) drafted much of the code and documentation from the builder's specifications. The builder chose the problem, directed and reviewed the changes, and ran the demo. The product itself calls no AI model.

## Built with

next, react, react-dom, typescript, tailwindcss, @tailwindcss/postcss, motion, zod, lucide-react, @radix-ui/react-slot, class-variance-authority, clsx, tailwind-merge, vitest, tsx

## Try it out

- Live app: https://velatum.vercel.app/?runner=maya
- Source: https://github.com/mericcintosun/velatum
