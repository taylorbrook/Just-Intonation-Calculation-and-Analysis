---
status: complete
phase: 260512-mk8
plan: 01
date: 2026-05-12
commit: ce78eab
files_modified:
  - src/pages/otonality-utonality.md
requirements:
  - QUICK-OTONAL-UTONAL-PARTIALS-CHART-PER-NOTE-PLAY-FURTHER-READING-01
---

# Quick task 260512-mk8: paired partials chart + per-note play buttons + Further reading on otonality-utonality page

## Files touched

| File | Delta | Notes |
|------|-------|-------|
| `src/pages/otonality-utonality.md` | +96 / −8 (net +88) | Three additive blocks: imports cell extension (+2 lines), `### The mirror, visualized` chart cell + prose paragraph (+82 lines), `## Further reading` section (+4 lines). Per-note buttons are inline-appended to the 8 existing chord-member bullets (no net line delta from those). |

Single-file edit — no new components, no new CSS, no new test files.

## Imports added

```ts
import { playInterval } from "../components/play-interval.js";
import * as Plot from "npm:@observablehq/plot";
```

Both placed in the existing single imports cell (Framework module-scope rule honored — adding a second imports cell would re-bind `Plot` / `playInterval` and break reactivity; this lesson was logged in the 260512-kzw prime-limits task and is now standard discipline).

## Chart structure

Two `Plot.plot` calls in a `<div style="display:flex; gap:24px; flex-wrap:wrap; justify-content:center;">` parent built via `document.createElement` (defense-in-depth T-02-22/T-02-23 — no `innerHTML` for any interpolated value).

| Axis | Setting |
|------|---------|
| x | `domain: [0, 1050]` shared, `label: "Cents from fundamental"`, `grid: true` |
| y | categorical: `domain: otonalRows.map(r => r.label)`, `reverse: true` (higher pitch on top, matches musical-staff intuition) |
| Width × Height | 360 × 220 px per subchart |
| Otonal color | `#4269d0` blue (D-33 anchor) |
| Utonal color | `#ef8e3a` orange (D-33 anchor) |
| Marks | `Plot.ruleY` (horizontal line from 0 to `cents`) + `Plot.dot` at endpoint (r:4, white stroke for legibility) |

Otonal subchart y-domain (top → bottom): `7/4, 3/2, 5/4, 1/1`.
Utonal subchart y-domain (top → bottom): `8/5, 4/3, 8/7, 1/1`.

Cents data is read once at chart-build time via `iv.cents` on the existing `otonal[i]` / `utonal[i]` `Interval` bindings (Pitfall #1 — BigInt-Fraction kernel is source of truth; cents is display-boundary projection only).

A one-paragraph prose tag follows the chart, describing the otonal "gaps shrink as you go up" / utonal "gaps grow as you go up" interior-spacing divergence as the visible mirror.

## Per-note buttons placement

8 buttons total — 4 otonal (lines 80-83) + 4 utonal (lines 195-198). Each bullet now reads:

```
${ratioPill(otonal[i])} — <description>. ${playInterval(otonal[i], synth, { label: true })}
```

The `label: true` opt renders `▶ Play 5/4`, `▶ Play 3/2`, etc. (vs the default unlabeled `▶`). Reuses the page's existing `synth` binding from the synth cell (Pitfall #2 — no second `createSynth()` call). `baseHz` is left at the playInterval factory default of 440 Hz (D-08); duration default 1.5 s (D-18). The existing chord buttons (`otonalBtn`, `utonalBtn`) are unchanged — they still play 4-note simultaneous chords; the new per-note buttons add per-member auditioning.

`playInterval(otonal[2], synth, { label: true })` renders `▶ Play 3/2` (NOT `▶ Play 6/4`) because `new Interval("3/2").fraction.toFraction()` returns `"3/2"` — fraction.js canonicalises, which matches the post-octave-reduced reading already used in the prose and ratio pills.

## Further reading links

| Link | Rationale |
|------|-----------|
| https://en.xen.wiki/w/Otonality_and_utonality | Community-curated reference covering Partch's duality in full, with worked tonality-diamond examples and the canonical numerator/denominator framing. |
| https://www.kylegann.com/wtp.html | Kyle Gann's composer's-eye survey of La Monte Young's *The Well-Tuned Piano* — the most-cited example of long-form otonal-chord-cluster composition; the dream-house tunings draw their pitch lattice from selected otonal chords on 7- and 11-limit harmonics. |

Style matches the prose-y "— short editorial framing —" precedent established by 260512-fg3 (harmonic-series), 260512-mvw (odd-limits), 260512-ilb (schisma), 260512-hdv (edo-approximation), 260512-aph (prime-limits), and 260512-kzw (prime-limits explorer). Plain `## Further reading` heading, plain bulleted links, brief contextualizing prose per link.

## Build + test results

| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | 5 errors — baseline unchanged | Same 5 pre-existing `npm:` specifier errors in non-markdown source files documented in STATE.md (`src/audio/synth.ts:29`, `src/components/lattice.ts:32,197,198`, `src/components/scale-compare.ts:38`). Framework transpiles `.md` reactive cells via esbuild, not tsc, so edits to `.md` files cannot introduce new tsc errors. |
| `npm run build` | not run | Out of scope per quick-task constraints — the file reads back as syntactically valid (matched braces, fenced ```ts blocks closed, IIFE complete, all template `${...}` interpolations closed). Page bundle size delta expected to track other Plot-using pages (~12 kB → ~26 kB single-page; ~390 kB → ~900 kB total imports, matching harmonic-series.md / edo-approximation.md / prime-limits.md / monzos.md after their Plot additions). |
| Grep gates (plan-specified) | all pass | See "Verification — grep gates" below. |

## Verification — grep gates

All grep gates from the plan executed against the post-commit file:

| Gate | Expected | Actual |
|------|----------|--------|
| `grep -c 'playInterval(otonal\['` | 4 | 4 ✓ |
| `grep -c 'playInterval(utonal\['` | 4 | 4 ✓ |
| `grep -c 'import \* as Plot from "npm:@observablehq/plot"'` | 1 | 1 ✓ |
| `grep -c 'from "../components/play-interval.js"'` | 1 | 1 ✓ |
| `grep -c '^## Further reading'` | 1 | 1 ✓ |
| `grep -c 'Plot\.plot'` | 2 | 2 ✓ |
| `grep -n 'en.xen.wiki/w/Otonality_and_utonality'` | present | line 294 ✓ |
| `grep -n 'kylegann.com/wtp'` | present | line 295 ✓ |
| `grep -nE 'cents:\s*(386\.31\|701\.96\|968\.83\|231\.17\|498\.04\|813\.69)'` | 0 matches | 0 matches ✓ (no hardcoded float cents in data values; Pitfall #1) |
| `createSynth` actual invocations | 1 | 1 ✓ (the existing `const synth = createSynth();` on line 18; grep `-c 'createSynth()'` returns 2 only because the same literal also appears inside a comment on line 15 — this is identical to the baseline state of the file prior to this edit) |

Integer cents tokens `969 / 498 / 814 / 231 / 386 / 702` appear in the file but only inside descriptive prose paragraphs (line 83 — pre-existing prose about the harmonic seventh; lines 182-186 — new prose paragraph below the chart describing the interior-spacing divergence). They are **not** present in the chart cell (lines 110-179), which reads every cents value from `iv.cents` on the existing `Interval` bindings. The plan explicitly permits cents-as-prose-text and forbids cents-as-data-literal.

## Decisions made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Otonal/utonal color split | otonal blue `#4269d0`, utonal orange `#ef8e3a` | Both are D-33 anchor palette tokens, color-blind-safe, and already established as the project's primary chart palette (scale-compare.ts, 260512-fg3 harmonic-series, 260512-fxk pythagorean-comma). The blue/orange split also reads metaphorically — blue "cool/major" for otonal (which has a bright dominant-7 character), orange "warm" for utonal (which has a darker minor character). |
| x-axis domain | `[0, 1050]` cents | Encompasses the highest member of either chord (7/4 ≈ 968.83¢) with a small headroom. Same domain on both subcharts so the mirror is visually comparable side-by-side. |
| y-axis order | array order ascending + `reverse: true` | `1/1` is the lowest pitch, `7/4` / `8/5` is the highest. `reverse: true` flips the categorical y-axis so the higher pitch sits at the top of the chart — matches musical-staff intuition (higher pitch = higher on the chart). |
| Layout | flex row with `flex-wrap: wrap`, `justify-content: center` | On wide viewports the two charts read as a paired A/B comparison; on narrow viewports they stack gracefully. Matches the responsive pattern used elsewhere in the codebase. |
| Sub-heading | `### The mirror, visualized` | H3 (not H2) so it nests under `## The otonal chord (over-N)` rather than appearing as a peer of the major chord-section H2s. Frames the chart as a visual extension of the otonal section it follows. |
| Chart wrapper construction | `document.createElement` + `appendChild`, no `innerHTML` | Defense-in-depth T-02-22/T-02-23. Nothing in this cell is user-controlled, but the pattern stays consistent with the rest of the codebase. |

## What was NOT changed

- Imports cell apart from the two new lines — byte-identical to baseline in the other 3 lines.
- Synth cell (lines 13-20) — byte-identical.
- otonal/utonal/baseHz binding cell (lines 22-52) — byte-identical.
- `otonalBtn` cell (lines 85-104) — byte-identical (existing chord button retained).
- `utonalBtn` cell (lines 222-238) — byte-identical (existing chord button retained).
- `display(utonalDerived)` truth-check cell (lines 200-215) — byte-identical.
- Prose paragraphs on lines 54-74, 76-78, 191-193, 217-220, 242-247 — byte-identical.
- `## Monzo signs flip` section (lines 249-267) — byte-identical.
- `## See also` block (lines 269-290) — byte-identical.
- No CSS files added or modified.
- No `@import` lines added to `src/styles.css` (the `play-btn` styles are already loaded via the existing `@import "./components/play-buttons.css"` line in styles.css, so the 8 new per-note buttons pick up styling for free).

## Deferred items

None. All grep gates pass; tsc baseline unchanged; the only items not run are full `npm run build` and visual smoke-test — both are out of scope for the quick-task executor.

## Self-Check: PASSED

- Modified file exists: `src/pages/otonality-utonality.md` — FOUND.
- Commit exists: `ce78eab` — FOUND in `git log --all`.
- All grep gates pass (see table above).
- File reads back as syntactically valid (manual visual inspection — matched braces, fenced ```ts blocks closed, IIFE complete, all template `${...}` interpolations closed).
