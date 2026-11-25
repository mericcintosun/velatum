# CLAUDE.md: Velatum

Read `IDENTITY.md` first (it is law), then `HANDOFF.md` and `DEMO.md` (the judged click path).

## Commands
- `npm install`
- `npm run dev` (http://localhost:3000)
- `npm run build`
- `npm run seed` (validates `fixtures/runners.json`, writes `fixtures/seed-manifest.json`, deterministic)

## Stack
Next 15 App Router, React 19, TypeScript strict, Tailwind v4 with no config file (tokens in `app/globals.css`), motion 14 (`motion/react`).

## Pitfalls
- No network calls from the page. No `fetch` in pages or components. The CSP in `next.config.ts` (`connect-src 'self'`) is the privacy proof; never loosen it.
- `@/lib/data` resolves to `lib/data.ts`. Never create `lib/data/index.ts`; it would shadow it.
- Kit imports (`motion/react`) only in files that start with `"use client"`.
- `lib/adapter.ts` never reads `process.env`; the mode comes from `lib/adapter-mode.ts` on the server.
- Synthetic runners only. No real addresses or real tracks.

## Never touch
- `components/ui/` variants
- `public/illustrations/`
- `node_modules`
- `.next`

## Vercel guardrails
- no `fs.write*` in `app/`, `components/` or `lib/` (Grep `writeFile|appendFile|mkdirSync`; `next.config.ts` reads at build time only);
- Grep `useSearchParams` has 0 hits, or every hit sits under `<Suspense>`;
- no `output: "export"`, no custom server, no Node-only API in an edge route;
- every `process.env.X` has an `X=` line in `.env.example`. `NODE_ENV` is exempt because Next sets it; say so in HANDOFF.

When compacting, preserve the list of modified files and test commands.
