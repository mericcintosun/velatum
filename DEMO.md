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
4. **Click "Offset + ragged edge" or drag the sliders, or drag the gold handle on Fig. 1** (`/?runner=maya&zone=1000&offset=700&trim=400`, `app/page.tsx`, cells C and A). The number in cell B climbs and the card turns green. The handle sits at the zone center; drag it along its gold guide line away from the home (or focus it and press the arrow keys), and the offset slider, cell B and the cell F roll call follow.
5. **Click "Download cleaned GPX"** (`app/page.tsx`, cell C). One metadata-free GPX file downloads, cut exactly as measured.
6. **Go to `/#your-files` and click "Try a broken file"** (`app/page.tsx`, cell D). A red error appears in cell D.
7. **Open the evidence dialog** (`app/page.tsx`, cell B, "Open the evidence") and read the distance-leak limitation. `/about` (`app/about/page.tsx`) lists the rest of the limitations.
8. **Click a preset or drag a slider and read cell F** (`/?runner=maya&zone=1000&offset=700&trim=400`, `app/page.tsx`, cell F). Each runner shows its distance at these settings, and the summary line names how many of 8 are protected: "These settings make both attacks miss by 400 m or more for N of 8 sample runners." Click "No zone", then "Offset + ragged edge", and watch the roster move from red to green; read off the screen which runners still fall short of 400 m (Jonas, with his office starts, has a different habit from the rest, so compare his line).

## Seams

- Adapter: `lib/adapter.ts` (mode chosen on the server by `lib/adapter-mode.ts`, env `ADAPTER_MODE`, default `real`)
- Seed: `lib/data/seed.ts` (reads `fixtures/runners.json`; `npm run seed` validates it and writes `fixtures/seed-manifest.json`)
- API: `app/api/runners/route.ts` (public synthetic profiles only; the page never calls it)
- Tokens: `app/globals.css`
- Worker: lib/bench.worker.ts via lib/adapter.real.ts
- Proof: npm run proof
- Reset: npm run demo:reset (no store, no chain; close the tab to forget uploaded files)

### Fallbacks

- Step 1: the seeded number comes from `measureNow` in `components/use-measurement.ts`; if the worker fails, `measureInWorker` in `lib/adapter.real.ts` runs `runBench` on the main thread.
- Step 2: the same worker path, with the main-thread `runBench` after one 2 s retry; cell B shows "Measuring this set" instead of an old number.
- Step 3: the same as step 2; the plot draws tracks only until the new answer lands, so old exits never sit on new tracks.
- Step 4: the same as step 2; the worst case is 2 x 2000 ms plus the main-thread bench, under 5 s.
- Step 5: the download is disabled while the measurement is pending or stale; if the file cannot be built, `DownloadErrorState` in `components/exposure-bench.tsx` offers "Try the download again".
- Step 6: `UploadErrorState` in `components/upload-cell.tsx` lists the issues and offers "Choose other files".
- Step 7: `app/error.tsx` (`BenchErrorState`) covers `/` and `/about`; `LimitationsEmptyState` in `app/about/page.tsx` links back to Maya.
- Step 8: `useRollCall` in `components/use-roll-call.ts` uses the same worker path, then the main-thread `runBench`; if a measurement still rejects, cell F shows the error state with "Measure the roll call again". The roll call waits while cell B measures, so it never delays the number in cell B.
