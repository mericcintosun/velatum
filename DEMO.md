# DEMO: the judged click path

This file is the demo contract. Later phases may add to it, but they must not move step 1 or break any step below.

**Problem.** People who share their runs and rides publicly give away the door they start from, and the privacy zone their app offers often does not hide it.

**Trigger.** Someone who shares runs is followed home.

**Wow moment.** With the 200 m zone on, the dashed circle lands on Maya's sample home. Moving the offset and trim sliders makes the guess drift away, the meter number climbs and cell B turns from red to green.

**Closing.** Close on the before and after numbers as the result card shows them.

**Demo start route: `/?runner=maya`** (`app/page.tsx`).

Maya is a seeded synthetic runner (`fixtures/runners.json`, id `maya`). Her home sits on a fictional grid at 0°N 0°E, in open sea. No number in this file is a measurement; read the numbers off the screen.

## Steps

1. **Open `/?runner=maya`** (`app/page.tsx`, cell A). Maya's 24 synthetic runs are on the plot and the "Files stay in this tab" badge is visible in cell A.
2. **Click preset "No zone"** (`app/page.tsx`, cell C, then read cell B). Cell B shows the endpoint guess and the meters to the sample home, in red.
3. **Click "200 m zone"** (`/?runner=maya&zone=200&offset=0&trim=0`, `app/page.tsx`, cells C and A). Orange exit dots appear and the dashed circle sits on the home. The card in cell B is still red.
4. **Click "Offset + ragged edge" or drag the sliders** (`/?runner=maya&zone=1000&offset=700&trim=400`, `app/page.tsx`, cell C). The number in cell B climbs and the card turns green.
5. **Click "Download cleaned GPX"** (`app/page.tsx`, cell C). One metadata-free GPX file downloads, cut exactly as measured.
6. **Go to `/#your-files` and click "Try a broken file"** (`app/page.tsx`, cell D). A red error appears in cell D.
7. **Open the evidence dialog** (`app/page.tsx`, cell B, "Open the evidence") and read the distance-leak limitation. `/about` (`app/about/page.tsx`) lists the rest of the limitations.

## Seams

- Adapter: `lib/adapter.ts` (mode chosen on the server by `lib/adapter-mode.ts`, env `ADAPTER_MODE`)
- Seed: `lib/data/seed.ts` (reads `fixtures/runners.json`; `npm run seed` validates it and writes `fixtures/seed-manifest.json`)
- API: `app/api/runners/route.ts` (public synthetic profiles only; the page never calls it)
- Tokens: `app/globals.css`
- Worker: lib/bench.worker.ts via lib/adapter.real.ts
- Proof: npm run proof
