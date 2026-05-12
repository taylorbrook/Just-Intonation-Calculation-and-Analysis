---
phase: quick-260511-uuh
plan: 01
subsystem: theory-pages
tags:
  - observable-framework
  - katex
  - partch
  - otonality
  - utonality
  - ji-theory
dependency_graph:
  requires:
    - src/lib/interval.ts (Interval class — fraction, monzo, inv, octaveReduce, equals)
    - src/audio/synth.ts (createSynth, SynthHandle.playNotes)
    - src/components/ratio-pill.ts (ratioPill widget)
  provides:
    - "src/pages/otonality-utonality.md — theory page introducing Partch's otonal/utonal duality with two 4-note simultaneous-chord audition buttons"
  affects:
    - observablehq.config.ts (one new entry inserted into Theory notes group)
tech_stack:
  added: []
  patterns_followed:
    - "ARCHITECTURE Pattern 4 / Pitfall #2 — cell-owned AudioContext via lazy createSynth + invalidation.then(synth.dispose)"
    - "R-01 / Pitfall #1 — Interval (BigInt Fraction) is source of truth; floats appear ONLY at the audio Hz boundary (synth.playNotes input)"
    - "KaTeX bra-ket monzo notation — \\begin{bmatrix} ... \\end{bmatrix}\\rangle mirrors monzos.md / syntonic-comma.md"
    - "Kernel-side truth check — utonal chord derived via .inv().octaveReduce() with .equals() assertions in display()"
key_files:
  created:
    - src/pages/otonality-utonality.md
  modified:
    - observablehq.config.ts
decisions:
  - "Otonal: [1/1, 5/4, 3/2, 7/4]; Utonal: [1/1, 8/7, 4/3, 8/5] — both rooted on the same fundamental for direct A/B audition, NOT one above and one below (mirror by inversion + octave-reduction, then re-root upward)"
  - "Chord buttons built inline via document.createElement('button') + synth.playNotes(freqs) — NOT via playInterval (which plays a dyad, not a 4-note simultaneous chord)"
  - "Inserted in sidebar BEFORE the comma pages and AFTER Monzos — both Monzos and Otonality & utonality are foundational notational primitives that the comma pages assume"
metrics:
  duration_minutes: 3
  tasks: 2
  files_changed: 2
  completed: 2026-05-12T05:19:47Z
---

# quick-260511-uuh: Otonality & utonality theory page

One-liner: New theory page at `/pages/otonality-utonality` introducing Partch's
otonal (4:5:6:7) and utonal (1/4:1/5:1/6:1/7) chord-formation duality, with two
simultaneous-chord audition buttons and a kernel-side `.inv().octaveReduce()`
truth-check.

## Files

| Path | Status | Lines | Commit |
|---|---|---|---|
| `src/pages/otonality-utonality.md` | created | 207 | 5677701 |
| `observablehq.config.ts` | modified | +1 | 64ab9a2 |

## What it does

Adds a new theory page that introduces Harry Partch's central duality:

- **Otonal (over-N) chord** = harmonics 4:5:6:7 above a fundamental → octave-reduced
  to `1, 5/4, 3/2, 7/4` (7-limit dominant-7-flavored sonority).
- **Utonal (under-N) chord** = symmetric inversion. Subharmonics `1/4:1/5:1/6:1/7`
  below a guide tone, each inverted and octave-reduced upward to read as
  `1, 8/7, 4/3, 8/5` from the same fundamental — for direct A/B audition.
- Two `.play-btn` buttons, each calling `synth.playNotes(freqs)` on a 4-note
  simultaneous chord. Buttons built inline (no new component file).
- A `display(utonalDerived)` cell computes the utonal chord by
  `otonal.map(iv => iv.inv().octaveReduce())` and asserts `.equals(claimed)`
  per row — kernel-side proof that the prose matches reality (same discipline
  as the round-trip cell on `/pages/monzos`).
- KaTeX section "Monzo signs flip" shows the four pairs as bra-ket monzos
  with sign flips on the 5- and 7-prime exponents.
- Cross-links: `/` (tonality-diamond is the joint viz of this duality),
  `/pages/monzos`, `/pages/syntonic-comma`, `/pages/odd-limits` (forward link,
  expected to 404 until the next quick task creates that page).

Sidebar updated to insert the new page as the second entry under "Theory notes",
right after Monzos.

## Chord math (hand-verified, written inline as KaTeX)

**Otonal**, ascending from fundamental (4:5:6:7 octave-reduced):

| harmonic | ratio | name |
|---|---|---|
| 4 | 1/1 | fundamental |
| 5 | 5/4 | 5-limit major third |
| 6 | 6/4 = 3/2 | perfect fifth |
| 7 | 7/4 | harmonic seventh (7-limit) |

**Utonal**, ascending from guide tone (each otonal member inverted then
octave-reduced into `[1, 2)`):

| from otonal | inverted | octave-reduced | name |
|---|---|---|---|
| 1/1 | 1/1 | 1/1 | guide tone |
| 5/4 | 4/5 | 8/5 | 5-limit minor sixth |
| 3/2 | 2/3 | 4/3 | perfect fourth |
| 7/4 | 4/7 | 8/7 | 7-limit "supermajor second" |

Kernel derivation in the verification cell:

```ts
const utonalDerived = otonal.map((iv, i) => {
  const mirrored = iv.inv().octaveReduce();
  return { from: iv.toString(), mirrored: mirrored.toString(),
           claimed: utonal[i].toString(), ok: mirrored.equals(utonal[i]) };
});
display(utonalDerived);
```

All four `ok` flags read `true` at runtime — `display(...)` exposes the array
to the user so any future kernel drift surfaces visibly.

## Deviations from monzos.md / syntonic-comma.md template

None substantive. Two specifically-different choices, both prescribed by the
plan:

1. **No `playInterval` import.** `playInterval` plays a dyad (root + one
   interval); the otonal/utonal page needs 4-note simultaneous chords, so the
   buttons are built inline via `document.createElement('button')` + `synth.playNotes(freqs)`.
   Reuses `.play-btn` class so styling matches.
2. **Extra verification cell** beyond the existing-pages pattern: the
   `utonalDerived` `display(...)` cell asserts `.inv().octaveReduce()` agrees
   with the claimed utonal ratios. monzos.md has the analogous round-trip cell
   for `Interval ↔ monzo`; this is the structural counterpart for the
   inversion-via-octave-reduction operation that is the page's pedagogical
   hook.

No new components, no CSS changes, no kernel changes.

## Verification

- `tsc --noEmit` introduces zero new errors against the new file (pre-existing
  `npm:*` import errors in `src/audio/synth.ts`, `src/components/lattice.ts`,
  `src/components/scale-compare.ts` are unrelated and out of scope per the
  scope-boundary rule).
- `npm run build` succeeds. `dist/pages/otonality-utonality.html` is emitted at
  ~22 kB with all three component bundles wired:
  `_import/components/ratio-pill.900fffd5.js`,
  `_import/audio/synth.3b23f67f.js`,
  `_import/lib/interval.2ebef6ba.js`.
- One build warning: `/pages/otonality-utonality → /pages/odd-limits` is
  flagged as broken. **Expected** — the user is staging the odd-limits page as
  the next quick task. The forward-link is intentional per the plan's
  `<cross_link_caveat>`. The link will resolve as soon as the next quick task
  lands; including it now means we don't have to revisit this file.
- Sidebar order verified in `dist/index.html`: `Monzos → Otonality & utonality
  → The syntonic comma → The Pythagorean comma → The schisma → The septimal
  comma`.
- Source-side grep checks pass: `4:5:6:7`, `1/4:1/5:1/6:1/7`, `playNotes` (3
  occurrences), cross-links to `/`, `/pages/monzos`, `/pages/odd-limits`,
  `/pages/syntonic-comma` all present.

Note on the plan's `grep -q 'class="ratio-pill"' dist/...html` assertion: that
class is **runtime-rendered** by the `ratioPill()` component when the page
loads in the browser, not present in the static-HTML build output. The same
applies to KaTeX spans — both `dist/pages/monzos.html` and
`dist/pages/syntonic-comma.html` also lack those classes in static HTML. The
assertion was a planner overstatement; the relevant fact is that the new page
bundles the same component scripts as the known-working pages.

## STATE.md row

```
| 260511-uuh | add otonality-utonality theory page (Partch's over-N/under-N duality; 4:5:6:7 vs 1/4:1/5:1/6:1/7 with kernel-side .inv().octaveReduce() verification); sidebar entry registered | 2026-05-12 | 64ab9a2 | [260511-uuh-otonality-utonality](./quick/260511-uuh-otonality-utonality/) |
```

## Self-Check: PASSED

- src/pages/otonality-utonality.md — FOUND
- observablehq.config.ts — FOUND (modified)
- 5677701 (Task 1) — FOUND in git log
- 64ab9a2 (Task 2) — FOUND in git log
- dist/pages/otonality-utonality.html — FOUND (built successfully)
- Sidebar entry verified in dist/index.html with correct ordering
