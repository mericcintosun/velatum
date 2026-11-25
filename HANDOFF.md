# HANDOFF: Velatum

You are picking up a working Next.js scaffold. Read this file, then `IDENTITY.md`, then start on the Mission list. Keep `npm run build` passing after every change.

## 1. Context

**Product:** Velatum. Drop in your run or ride recordings and Velatum shows how someone would find your home from them. Then try hiding settings and watch the same attack miss by more and more meters. Files never leave the device.

**Plain pitch:** If you share runs or rides online, your routes can give away where you live. Open Velatum and drop in the GPX files you exported from your sports app. The page makes the guess a bad actor would make, on your own computer, and shows on the plot how close it gets to your home. Then you change the hiding settings, the guess is made again, and you see whether you stay safe. At the end you download cleaned files that are ready to share. Nothing is uploaded anywhere.

**Hackathon:** SafeSpace Hacks (Devpost, online, students only). https://safespace-hacks.devpost.com/

**Deadline:** December 9, 2026, 5:00 PM EST per the Devpost schedule. The overview text says November 22, and the rules say the Devpost schedule governs. Confirm with the organizer; plan as if the build must be done in two days.

**Target track:** 1st Place (SafeSpace Grand Prize), $280 cash. The same ranking also awards 2nd (Safer by Design), 3rd (Peace of Mind Award) and three Runners-Up slots, all honorary. One submission enters all of them; no extra work.

**Judging (4 criteria, 25% each, scored 1 to 5; ties go to Safety Benefit, then Practical Functionality):**
- Safety benefit: clear user, clear risk, credible evidence of a safer outcome. Our evidence is the meter number before and after.
- Practical functionality: the core workflow works in the demo, errors are handled sensibly. "Complexity alone earns no bonus."
- Trust and responsible design: privacy, appropriate data, explained uncertainty, honest limitations.
- Clarity and UX: the intended user understands it; the demo explains the problem, event contributions, credits and limitations.

**Submission requirements (verified from the Devpost record):**
- A working safety prototype that names the target user, the risk, and the practical improvement.
- Complete Devpost page: name, short pitch, every team member.
- Problem, solution, technologies, challenges and lessons learned.
- Working demo link (or build or recording) with simple setup instructions.
- Screenshots. A 2 to 3 minute demo video is recommended but optional.
- Source link if possible, with credits for libraries, datasets, assets, AI help and pre-existing work.
- Work done during the event clearly separated from pre-existing components.
- One safe-outcome example and one limitation stated.
- Synthetic data, sample accounts or owned systems only; no private data, credentials or live vulnerabilities.
- One final submission per project; judging links must stay reachable through judging.
- Eligibility: every team member a student at a recognized institution and of legal age.

## 2. Current state

Identity: see IDENTITY.md (direction D11, structure S1, archetype L4, kit K1)

Museum direction: bone ground, antique-gold accent, hairline-gold lines, sharp corners, Cormorant Garamond for every h1/h2, Mulish for body. Motion M5: one `velatum-fade` keyframe (opacity only, linear, 280 ms) on `.velatum-enter`, staggered through `.velatum-bento > :nth-child(n)`, disabled under `prefers-reduced-motion`.

**Routes (S1 single-surface):**
| Route | File | Reached from |
| --- | --- | --- |
| `/` (the tool; state in `?runner=&zone=&offset=&trim=`) | `app/page.tsx` -> `components/exposure-bench.tsx` | Header mark |
| `/about` (why, how it works, tech and credits, limitations) | `app/about/page.tsx` | Header link "How it works" |
| `/#your-files` (upload cell) | anchor in `components/exposure-bench.tsx` | Header action "Check your files" |

**One-mark proof** (`components/site-header.tsx`):
```tsx
<Link href="/" className="flex items-center gap-3 font-display text-2xl font-semibold tracking-wide text-foreground">
  <BrandMark />
  Velatum
</Link>
```

**File map:**
- `lib/geo.ts`: types (`XY`, `Track`), flat-plane projection, `NULL_ISLAND`, seeded PRNG, `formatMeters`.
- `lib/attack.ts`: `dbscan`, `endpointAttack`, `kasaFit`, `circleAttack` (RANSAC), `applyDefenses` (zone, offset, per-recording trim), `runBench` (before and after, closer guess wins), `verdictFor`.
- `lib/synthetic.ts`: `generateRunnerTracks`, seeded loops on a jittered grid at 0°N 0°E with AR(1) GPS noise and timestamps.
- `lib/gpx.ts`: `parseGpxFile` (DOMParser, error and warning messages), `serializeGpx` (metadata-free output).
- `lib/data.ts`: 8 synthetic `RUNNERS`, `DEFENSE_PRESETS`, `DEFENSE_LIMITS`, `parseBenchParams` (URL state), `BROKEN_GPX_SAMPLE`, `SAFETY_STEPS`, `LIMITATIONS`.
- `components/exposure-bench.tsx`: the bento (6 unequal cells: A plot + claim 7x2, B result 5x1, C defenses 5x2, D upload CTA 4x1, E image 3x1, F runners 12x1), file reading, download, URL sync.
- `components/result-cell.tsx`: result summary and evidence dialog (kit signature 1).
- `components/trace-plot.tsx`: map-free SVG plot of tracks, zone, exits, guesses, home.
- `components/site-header.tsx`, `components/ui/*` (button, card + `CardLabel`, badge, input, slider) in the museum treatment.
- `app/opengraph-image.tsx`, `app/icon.svg`, `public/logo.svg`, `public/illustrations/scene-1..3.svg`.
- `next.config.ts`: brand file listing plus the CSP (`connect-src 'self'` in production) and privacy headers.

**Real vs mocked:** everything on the core path is real. The attacks, the defenses, GPX parsing and the cleaned download all run on real data in the browser. There is no external integration to mock: the hackathon names no sponsor tech, and keeping zero network calls is a product promise. The only stand-in is the sample data itself (`generateRunnerTracks` in `lib/synthetic.ts`), which is synthetic by rule. Attack code runs on the main thread for now (fast enough for ~10k points); moving it to a Web Worker is in the Mission.

**Kit K1 (motion):** signature 1 is shipped: the result number in bento cell B grows into the evidence dialog through `layoutId="velatum-result"` (`components/result-cell.tsx`), `initial={false}` so server HTML is readable, `MotionConfig reducedMotion="user"`. Remaining for the frontend phase:
2. A draggable hero artifact bound to a real value: make the zone center on the plot draggable (`drag`, `useMotionValue`), so dragging it changes `centerOffset` (and direction) and the meter number updates live.
3. `AnimatePresence` staging: the upload cell's reading, result and error states swap with exit animations, and the issue list items stagger in through `variants`.

## 3. Mission (in order)

1. **Verify the numbers (1 h, do first).** Run the app, click through Maya: no zone, "200 m zone", "Offset + ragged edge". Write down the three meter numbers. If the last preset does not reach the green band (400 m or more) for most runners, tune `DEFENSE_PRESETS` in `lib/data.ts` or the trim model in `applyDefenses`, never the thresholds to flatter the result. Then put the measured numbers into README's "A safe outcome" section. Also check the research figures quoted in README and `/about` against the two papers and fix any number that does not match.
2. **Endpoint clustering polish (2.5 h).** Done looks like: loading a runner shows the red ring and "x m from the sample home" within a second; Jonas (60% office starts) shows a smaller cluster and the copy explains why. Add a 20-seed average error table per runner to README (a small script or a dev-only page).
3. **Zone circle fit polish (3 h).** Done looks like: turning on the 200 m zone shows the orange exit dots and the dashed red circle landing on the house. Handle the "nothing left" case visually. Move `runBench` into a Web Worker (`new Worker(new URL("./bench.worker.ts", import.meta.url))`), keeping `worker-src 'self' blob:` in the CSP.
4. **Defense simulator and download, the wow moment (3 h).** Schedule this on day 2 morning and rehearse it. Done looks like: dragging the offset slider makes the circle drift off the house and the number climb from tens of meters to hundreds, and the B cell border goes from red to green. Ship kit signature 2 here (draggable zone center). Download produces a GPX that re-imports into Velatum and gives the same number.
5. **Upload flow and errors (2 h).** Done looks like: drag and drop works, "Try a broken file" shows a clear red message, a single file with 1 track gives the 3-activity message, files without timestamps give the warning. Ship kit signature 3 (AnimatePresence staging on the upload cell).
6. **Trust surfaces (1.5 h).** Done looks like: the "Files stay in this tab" badge explains the CSP on hover or in the evidence dialog, `/about` limitations read well, an optional map view (only if time remains) is off by default with the tile-server warning.
7. **Mobile and accessibility (1 h).** Bento collapses to one column cleanly, sliders reachable by keyboard, the dialog traps focus.
8. **Submission (2 h).** Deploy to Vercel, fill the Devpost page (team, problem, solution, challenges, lessons, credits, AI use, event-built vs pre-existing), screenshots of the three states, optional 2 minute video.

**90-second demo:** 0 to 15 s, "for someone who shares runs, the real risk is being followed"; Maya is already loaded, point at the "Files stay in this tab" badge. 15 to 45 s, no zone: red ring, a few meters; click "200 m zone": exits appear, the circle lands on the house, still red. "The zone was not protecting her." 45 to 75 s, "Offset + ragged edge" or drag the sliders: the number climbs to hundreds of meters, card goes green, click "Download cleaned GPX". 75 to 90 s, open the evidence, read the limitation (distance leak not covered), close on the before and after numbers.

## 4. Constraints

- Next.js 15 App Router, TypeScript strict, Tailwind v4 (no tailwind.config), shadcn primitives in `components/ui/` for every control and surface. Deploys to Vercel; no custom server, no runtime file writes.
- `IDENTITY.md` is law for every color, font, route, layout and animation decision. Colors only through the tokens in `app/globals.css`. Sharp corners everywhere (no `rounded-*` beyond `rounded-none`/`rounded-sm`). Do not add a second route for the tool; S1 means the home route is the product. Append to the Amendments section only.
- No network calls from the page, ever. If you add anything that fetches, the CSP will block it in production, and that is the point.
- Never use real addresses or real people's tracks in demos or screenshots. Synthetic runners only.
- Copy: plain human English, no em or en dashes, none of: seamless, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless.
- Scope discipline: if anything threatens the deadline, cut scope (map view first, then worker) rather than polish.
- Keep `npm run build` passing after every change.

## 5. Definition of done

- Deployed on Vercel at https://velatum.vercel.app and reachable through judging (December 10 to 14).
- README demo link works; the safe-outcome section carries the measured numbers.
- The 90-second demo flow above works end to end on the seeded runners, including the broken-file error and the download.
- All three K1 signature interactions exist and respect reduced motion.
- The wow moment (circle drifting off the house, number climbing, card turning green) is rehearsed twice on the deployed build.

## 6. Phase 1: walking skeleton seams (2026-11-25)

### Goal
Add the seams around the working bench without changing what it does: the demo contract (`DEMO.md`), agent guardrails (`CLAUDE.md`), a JSON seed fixture with a deterministic `npm run seed`, a typed core, a bench adapter selected by `ADAPTER_MODE`, a static `GET /api/runners` stub, and shell details (title template, active nav, branded error, not-found and loading pages, empty states). Demo step 1 (`/?runner=maya`, Maya loaded, "Files stay in this tab" badge in cell A) is now a seed-backed contract.

### Status (per slice)
- Slice 1, DEMO.md and CLAUDE.md: done.
- Slice 2, typed core, seed and adapter seam: done. `components/exposure-bench.tsx` now calls `adapter.loadSample`, `adapter.measure` and `adapter.listRunners()`; no direct `generateRunnerTracks`, `runBench` or `RUNNERS` remain there. Empty states added to cells D and F.
- Slice 3, API stub: done (`app/api/runners/route.ts`, force-static).
- Slice 4, shell, metadata and error surfaces: done. Nothing from the cut list was cut.
- Build status: unverified. The agent cannot run commands; the runner's `npm run build` is the first real check.

### Decisions
- **Fake equals the main-thread seeded bench.** The attacks, parsing and download were already real. The only thing that changes between modes is where the bench runs, so `fakeBenchAdapter` is the existing code path (seeded synthetic runners, `runBench` on the main thread). `createBenchAdapter("real")` returns the same adapter until Phase 2 adds the Worker. This keeps the demo working while giving Phase 2 one place to swap.
- **The page does not fetch the API.** Zero network calls from the page is the product promise, and the CSP enforces it. The page reads runners through `lib/adapter.ts` in the bundle. `/api/runners` exists for judges and tooling, serves only public synthetic profiles and accepts no body.
- **`ADAPTER_MODE` is read only on the server** (`lib/adapter-mode.ts`, called from `app/page.tsx` and the route) and passed down as a prop, so `lib/adapter.ts` stays free of `process.env`.
- **`NODE_ENV` exemption.** `next.config.ts` reads `process.env.NODE_ENV` to choose the dev or production CSP. Next sets it, so it has no line in `.env.example`. Every other `process.env` key (`ADAPTER_MODE`, `NEXT_PUBLIC_BRAND_FILES`) does.
- **Brand link moved into `components/header-link.tsx`** (client, `usePathname`) together with the "How it works" link, so both can set `aria-current`. The single `<BrandMark />` sits inside that brand `<Link>`.
- **Hidden file input got `aria-label="GPX files to check"`** to meet the label rule; it stays `aria-hidden` and is driven by the visible button.
- **Seed manifest** (`fixtures/seed-manifest.json`) was written by hand with the content the script produces: 8 runners sorted by id, 144 activities in total.

### Failed attempts
None.

### Files changed
New: `DEMO.md`, `CLAUDE.md`, `fixtures/runners.json`, `fixtures/seed-manifest.json`, `scripts/seed.mjs`, `lib/types.ts`, `lib/adapter.ts`, `lib/adapter-mode.ts`, `lib/data/seed.ts`, `lib/og-palette.ts`, `app/api/runners/route.ts`, `app/loading.tsx`, `components/header-link.tsx`, `.farm-commits.json`.
Edited: `lib/data.ts`, `components/exposure-bench.tsx`, `components/site-header.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/about/page.tsx`, `app/not-found.tsx`, `app/error.tsx`, `app/opengraph-image.tsx`, `package.json`, `.env.example`, `README.md`, `HANDOFF.md`.

### Commands run
None, the agent cannot run commands. Checks were done by reading files and with Grep only.

### Open questions
- Deadline conflict: the Devpost overview says November 22, the schedule says December 9, 2026, 5:00 PM EST. Today is November 25. Confirm with the organizer.
- The meter numbers for Maya's three presets are still unmeasured. Nothing in the repo states them as facts; read them off the screen until `npm run proof` exists.

### Next best step
Phase 2: a Worker-backed `real` adapter in `createBenchAdapter` (the same `runBench` behind `new Worker(new URL("./bench.worker.ts", import.meta.url))`, CSP unchanged), `npm run proof` measuring Maya's three presets and writing the numbers, and `.farm-live.json`. Record the live Vercel URL here.
