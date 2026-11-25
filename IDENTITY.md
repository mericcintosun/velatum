# IDENTITY (contract; every later phase obeys this file)

DIRECTION: D11 museum
GROUND: #f4f1ea bone
SURFACE: #ece7dc
DEEP: #e2dccd
LINE: #d3cab4
INK: #191713
ACCENT: #7a6220 antique-gold
ON_ACCENT: #f4f1ea
SECOND: #ad8c3a hairline-gold
OK: #2e7d4f
WARN: #a8641c
BAD: #b3382c
FONT_DISPLAY: F12 Cormorant Garamond (next/font/google: Cormorant_Garamond, weight: ["500", "600", "700"] is required)
FONT_BODY: Mulish (next/font/google: Mulish)
FONT_MONO: none
STRUCTURE: S1 single-surface
ARCHETYPE: L4 bento
MOTION: M5 fade, prefix velatum-
KIT: K1 motion
RADIUS: sharp
HEADER: solid ground, border-b in LINE, sticky
LOGO_POLICY: brand-mark

## Why

The farm assigned this identity so that no two projects share a look, a route map or an interaction style. The most recent projects it differs from: SLAY HACKS (D18, S5, L2, K7); InnovArt 2027: Art and Technology Hack Day (D16, S2, L1, K3); Arbiter Hacks V1 (D1, S3, L5, K5). It is not a suggestion. Tie the product's own nouns to it; do not swap any row for a familiar one.

## Direction: D11 museum

Bone ground with hairline gold, wide-tracked caps labels, generous margins.

Surface treatment: 1px gold hairlines, wide-tracked uppercase labels, object-on-a-plinth compositions with large empty margins, numbered captions like exhibit labels.

Every hex in app/globals.css comes from the key block above. RADIUS sharp means 0 to 0.125rem on every card, panel and control. ON_ACCENT is the text color on an ACCENT fill. The semantic colors (OK, WARN, BAD) mark state only, never brand.

## Structure: S1 single-surface

The product IS the home route. There is no marketing landing page.

Route map (name the bracketed parts with the product's own words):
- `/` : the working tool, seeded and usable in the first viewport, with the claim in a slim band
- `/about` : why it exists, how it works, the sponsor tech (reached from the header)
- shareable state lives in the URL (search params such as `?view=` or `?id=`), so a result has a link

Rules:
- the first viewport is the tool, not copy about the tool
- onboarding is inline (hints, an example already loaded), never a separate page
- the header holds the mark, one link and one action; no multi-link nav

## Archetype: L4 bento (the composition of the home route)

The hero is a 12-column grid of 5 to 7 unequal cells: one cell is the CTA, one is the live product, one is pure image; no traditional hero copy block exists.

MUSTs: no two cells share dimensions; the claim lives inside the largest cell; every cell has content, none is filler.
Bans: a lead paragraph above the grid; equal-width card rows.

## Motion: M5 fade (the entrance signature)

opacity only, linear, 280ms, no transform. One keyframe block implements it; every keyframe name starts with `velatum-`. A `prefers-reduced-motion: reduce` block disables it.

## Interaction kit: K1 motion

Motion (the successor of Framer Motion): layout animation, gestures and presence.

Packages for package.json dependencies: "motion": "^14.14.0".

Typical import: `import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from "motion/react";`

Signature interactions (the scaffold ships the first; all three exist by the end of the frontend phase):
1. a shared-layout transition: the core result grows from its list or summary cell into the detail view with `layoutId`, no cut
2. a draggable or pointer-tracked hero artifact (`drag`, `whileHover`, `useMotionValue`) bound to a real seed value, so moving it changes the number on screen
3. `AnimatePresence` staging on the demo route: loading, result and error swap with exit animations, and list items stagger through `variants`

Rules:
- use `initial={false}` on content that must be readable in server HTML
- add the packages above to package.json `dependencies` (and `devDependencies` where listed) with exactly these ranges; the runner installs them
- every import of a kit package lives in a component that starts with `"use client"`
- server HTML must be readable with JavaScript off: never server-render content at opacity 0 or off screen; animate from the visible state or on interaction
- honor `prefers-reduced-motion: reduce`: the content and every control stay usable with motion off
- every interaction is driven by the real seed data; a decorative animation with no product meaning does not count as a signature

## Amendments (append-only; later phases add dated lines here, never edit anything above)
