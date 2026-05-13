---
quick_id: 260513-akn
slug: scale-workshop-interop
date: 2026-05-13
status: complete
commits:
  - TBD (filled by post-commit backfill if needed)
---

# Scale Workshop interop tutorial — SUMMARY

## What shipped

New tutorial page `src/pages/scale-workshop-interop.md` (157 lines) walking a
4-phase round-trip of a 5-limit just diatonic (`9/8 5/4 4/3 3/2 5/3 15/8 2/1`)
between this notebook and [Scale Workshop](https://scaleworkshop.plainsound.org/)
via `.scl`:

1. **Build a scale on the dashboard** — instructions to paste the seven pitch
   lines into the `/` dashboard textarea; inline `ratioPill` row renders the
   seven non-unison degrees.
2. **Export to `.scl`** — the existing `sclIo` component from
   `src/components/scl-io.ts` is mounted in-page, scoped to the diatonic Scale,
   with `defaultFilename: "diatonic-5-limit-just"`. A dynamic `<pre><code>`
   block shows the exact bytes `writeScl(diatonic)` produces — kernel-derived,
   not hardcoded (Pitfall #1). Format anchors per the Huygens-Fokker spec
   (description line, pitch count excluding 1/1, ratios vs cents per D-19,
   last-pitch-is-period per D-14).
3. **Import into Scale Workshop** — Open `scaleworkshop.plainsound.org`, use
   File → Open from disk or paste-import. Cents anchors in prose
   (`5/4 → 386.314¢`, `3/2 → 701.955¢`, `15/8 → 1088.269¢`, `2/1 → 1200.000¢`)
   are derived inline at runtime via `${diatonic.intervals[i].cents.toFixed(3)}¢`
   — no hardcoded float-cent literals (grep gate clean).
4. **Round-trip back** — re-import the same `.scl` via the embedded `sclIo`
   import button + an in-page reactive cell that calls
   `parseScl(writeScl(diatonic))` and compares Fraction-equality element-by-
   element. Renders a plain-DOM table (#, Original, Re-parsed, Cents,
   Fraction-equal?) with a summary caption confirming all 8 intervals
   round-trip exact. Cents-source-is-lossy caveat documented in a
   blockquote per the `src/lib/scala.ts` header docstring.

`## Further reading` rendered via the shared `furtherReading([...])` helper —
three entries:

- Scale Workshop app (scaleworkshop.plainsound.org)
- Scale Workshop GitHub repo (xenharmonic-devs/scale-workshop) — link to docs
- Huygens-Fokker `.scl` format spec (huygens-fokker.org/scala/scl_format.html)

## Wiring

One-line edit to `observablehq.config.ts` adding a NEW top-level **Tools**
section (cleaner than appending to Theory notes — this is a how-to, not a
theory primer; "Tools" is the natural home for future interop / export /
workflow tutorials).

Resulting sidebar:

- Dashboard
- Analysis
- Theory notes (16 entries — unchanged)
- **Tools** (new)
  - Scale Workshop interop

## Pillars honored

- **Pitfall #1** — all cents in prose derived from
  `diatonic.intervals[i].cents.toFixed(3)` at the display boundary; the static
  `.scl` body is rendered via `writeScl(diatonic)` (no hardcoded payload);
  grep gate `! grep -nE '[0-9]+\.[0-9]+¢' src/pages/scale-workshop-interop.md`
  is clean.
- **Pitfall #2** — no `createSynth()` on this page; no AudioContext owner; the
  `sclIo` component has no audio dependency.
- **T-02-22/T-02-23 XSS discipline** — every dynamic surface (pillRow,
  sclPreview, roundTripTable) is built via `createElement` + `textContent`;
  no `innerHTML`, no user-derived raw HTML strings.
- **Framework module-scope rule** — single import cell at the top of the page.
- **Three-layer discipline** — page imports only from `src/lib/*` and
  `src/components/*`; kernel side untouched.
- **R-01** — every Interval flows through `new Interval("n/d")`, never through
  `xen-dev-utils` Fraction directly.
- `## Further reading` H2 stays in Markdown so Framework's TOC picks it up;
  body rendered via the project-canonical `furtherReading([...])` factory.

## Gates passed

- `npx tsc --noEmit` — exit 0; baseline unchanged.
- `npm run test` — 302/302 passed across 24 test files.
- `npm run lint` — clean (eslint).
- `npm run format:check` — clean (prettier).
- `npm run build` — clean; **21 pages** rendered (was 20), **111 links**
  validated (was 107); new page renders at 20 kB Page + 129 kB Imports (light
  — no Plot dependency).
- Rendered HTML grep `grep -c 'class="scl-io"' dist/pages/scale-workshop-interop.html`
  shows the embedded sclIo mount; round-trip table + further-reading section
  both present.

## Files touched

- `src/pages/scale-workshop-interop.md` (new, 157 lines)
- `observablehq.config.ts` (+5 lines for the new Tools section)
- `.planning/quick/260513-akn-scale-workshop-interop/PLAN.md` (new)
- `.planning/quick/260513-akn-scale-workshop-interop/SUMMARY.md` (this file)

## Kernel side untouched

- `src/lib/*` — no changes
- `src/audio/*` — no changes
- `src/components/*` — no changes (reuses sclIo, ratioPill, furtherReading
  unchanged)
- No new components, no new tests, no new CSS

## Notes for future work

- A natural follow-up under the new **Tools** section: a `.kbm` interop page
  walking through the keyboard-mapping companion file format. Out of scope
  here; covered by `src/lib/kbm.ts` and the `sclIo` component's `.kbm` import
  branch.
- If Scale Workshop's UI ever changes its File-menu wording, the
  prose-instructions in §3 will need a one-line update — the rest of the
  tutorial is kernel-bound and self-correcting.
