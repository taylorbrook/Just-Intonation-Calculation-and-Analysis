---
phase: quick-260512-udc
plan: 01
status: complete
subsystem: research-pages
tags:
  - comma-pages
  - tempered-out-by
  - canonical-blockquote
  - playDyad
  - consistency
dependency_graph:
  requires:
    - src/components/play-dyad.ts (existing — playDyad signature unchanged)
    - src/lib/interval.js, src/lib/commas.js (existing — kernel untouched)
  provides:
    - "pythagorean-comma.md: first simultaneous-dyad audition via playDyad(pureOctave, cycleOctave) + canonical Tempered-out-by blockquote"
    - "schisma.md: canonical Tempered-out-by blockquote (additive to existing Schismatic-temperament deep-dive section)"
    - "Cross-page invariant: all four comma pages (syntonic / Pythagorean / schisma / septimal) contain '> **Tempered out by.**' exactly once in the same canonical position"
  affects:
    - src/pages/pythagorean-comma.md
    - src/pages/schisma.md
tech_stack:
  added: []
  patterns:
    - "Canonical Tempered-out-by blockquote shape: bare markdown `>` lines, `**Tempered out by.**` bold prefix with period after `by`, no `.callout` div, no CSS class — sibling of `## In monzos` / `## See also`"
    - "Simultaneous-dyad audition pattern: playDyad(a, b, synth, { label: '<aFrac> + <bFrac> (<context> beat)' }) — same shape syntonic/septimal already use"
key_files:
  created: []
  modified:
    - path: src/pages/pythagorean-comma.md
      change: "+13 lines (3 insertions): playDyad import line; one-line dyad-intro prose + playDyad call; 7-line blockquote"
    - path: src/pages/schisma.md
      change: "+7 lines (1 insertion): 6-line blockquote + 1 blank line"
decisions:
  - "User-listed 19-EDO is recorded VERBATIM in the pythagorean-comma blockquote per the user's directive. SME flag: under the patent val, 19-EDO does NOT temper the Pythagorean comma (12 fifths = 12 × 11 = 132 steps; 7 octaves = 7 × 19 = 133 steps — they differ by one step ≈ 63¢, which is the Pythagorean comma mapped to 1/19-octave). 19-EDO patent-val flag for SME confirmation: either a non-patent / 12-mapping is intended, or the list should be tightened to 12-EDO + 24-EDO (+ other 12-stable EDOs). No edit made — flagged for SME review."
  - "Schisma blockquote names schismatic temperament with Helmholtz / Groven / Garibaldi parenthetical (matches the existing ## Schismatic temperament section's Helmholtz framing) + 53-EDO + 41-EDO per user spec — 53-EDO and 41-EDO are both classic schismatic-temperament EDOs (53-EDO maps the schismatic generator near-exactly; 41-EDO is the smaller schismatic-friendly EDO)."
  - "Pythagorean blockquote frames its EDO list as 'any 12-stable EDO whose patent val maps twelve fifths to seven octaves' — gives the reader the underlying invariant rather than a closed enumeration; contrasts against 53-EDO + 665-EDO which preserve the comma."
  - "Did NOT add a Hz-beat IIFE on pythagorean-comma — the existing drift chart already quantifies the gap; one inline simultaneous-dyad button is the consistency target per plan."
  - "Preserved schisma's existing ## Schismatic temperament deep-dive section byte-for-byte (lines 110–133 baseline): schismaticThird + fiveLimitThird playDyad untouched. The new blockquote is the scan-find summary; the prose section remains the deep-dive."
  - "Both commits are pure-additive: zero deletions per `git diff --diff-filter=D --name-only` on each commit."
metrics:
  duration_min: ~10
  completed: 2026-05-12
  tasks_completed: 2
  files_modified: 2
  commits:
    - "c632a8f feat(quick-260512-udc): pythagorean-comma.md — playDyad import, simultaneous-dyad audition (2/1 + 531441/262144), and canonical Tempered-out-by blockquote"
    - "0e922e1 feat(quick-260512-udc): schisma.md — canonical Tempered-out-by blockquote between ## In monzos and ## See also"
---

# Phase quick-260512-udc Plan 01: Bring four comma pages to consistent section structure — Summary

Lifted `pythagorean-comma.md` and `schisma.md` to the canonical comma-page section structure already in place on `syntonic-comma.md` and `septimal-comma.md`, so all four pages share an identical shape: (1) definition + cents, (2) audition (dyads + simultaneous via playDyad), (3) "In monzos", (4) "Tempered out by" blockquote — listing temperaments / EDOs that vanish this comma, (5) "See also" + "Further reading".

## Tasks Completed

### Task 1 — pythagorean-comma.md (commit `c632a8f`)

Three atomic edits, single file:

1. **Imports cell (line 11):** Inserted `import { playDyad } from "../components/play-dyad.js";` directly after the existing `playInterval` import — same path convention as `syntonic-comma.md` / `septimal-comma.md` / `schisma.md`.

2. **After third playInterval bullet, before `## The closure gap, visualized` (lines 53–55):** Inserted a one-line prose intro plus the simultaneous-dyad button:

   ```markdown
   The pure octave and the cycle-of-fifths octave together — the Pythagorean comma as a beat-rate:

   ${playDyad(pureOctave, cycleOctave, synth, { label: "2/1 + 531441/262144 (Pythagorean-comma beat)" })}
   ```

   This is the page's first simultaneous-dyad audition. `pureOctave` (line 29) and `cycleOctave` (line 35) bindings already exist in the upper reactive cell; reused, not redeclared.

3. **Between `## In monzos` paragraph and `## See also` heading (lines 131–137):** Inserted the canonical blockquote:

   ```markdown
   > **Tempered out by.** 12-EDO, 19-EDO, 24-EDO — and more broadly, any
   > 12-stable EDO whose patent val maps twelve fifths to seven octaves.
   > Tempering 531441/524288 to a unison is precisely what lets a 12-note
   > cycle of fifths close: the comma's ~23.46¢ overshoot is absorbed back
   > into the octave. By contrast, 53-EDO (and finer Pythagorean-friendly
   > divisions like 665-EDO) preserve the Pythagorean comma as a distinct,
   > audible step — twelve fifths and seven octaves remain non-equivalent.
   ```

   `+13 / -0` for the whole task.

### Task 2 — schisma.md (commit `0e922e1`)

One atomic edit, single file:

**Between `## In monzos` paragraph and `## See also` heading (lines 145–151):** Inserted the canonical blockquote:

```markdown
> **Tempered out by.** Schismatic temperament (Helmholtz / Groven /
> Garibaldi — narrow each fifth by ~0.24¢ so a chain of eight fifths
> lands on a pure 5/4), 53-EDO, and 41-EDO. These mappings identify
> 8192/6561 with 5/4 — the Pythagorean diminished fourth and the
> 5-limit major third collapse onto the same scale degree, and the
> ~1.95¢ schisma vanishes from the system.
```

The pre-existing `## Schismatic temperament` H2 section (lines 110–133 in the baseline) — including its `schismaticThird + fiveLimitThird` `playDyad` call and surrounding Helmholtz prose — was preserved byte-for-byte. The new blockquote is the scan-find summary in the canonical position; the longer prose section remains the deep-dive.

`+7 / -0` for the task.

## SME Confirmation Flag — 19-EDO and the Pythagorean comma

The pythagorean-comma blockquote lists **19-EDO** among the EDOs that temper out the Pythagorean comma, per the user's explicit verbatim directive. Recording this for SME review:

- **Patent val of 19-EDO:** maps 2 → 19 steps, 3 → 30 steps. Twelve fifths = 12 × (30 − 19) = 132 steps; seven octaves = 7 × 19 = 133 steps. Difference = 1 step ≈ 63.16¢ — that's where the Pythagorean comma lands in 19-EDO under the patent mapping, **NOT** zero.
- So under the patent val, 19-EDO does *not* temper out 531441/524288. By contrast, 12-EDO and 24-EDO do (both have 12-step octaves with the standard fifth = 7 steps, so 12 fifths = 84 = 7 × 12 octaves exactly).
- **Two possible resolutions for SME:**
  1. The user intends a *non-patent* mapping of 3 in 19-EDO that makes twelve fifths = seven octaves (would require fifth = ~700¢, i.e. not the 19-EDO patent fifth of ~694.74¢).
  2. The list should be tightened to "12-EDO, 24-EDO — and more broadly any 12-stable EDO whose patent val maps twelve fifths to seven octaves" (dropping 19-EDO).
- **Action:** No edit made. Recorded verbatim per user directive; flagged here for SME to confirm before any future tightening.

## Verification — outputs

### Cross-page canonical-blockquote consistency

```
src/pages/pythagorean-comma.md: 1
src/pages/syntonic-comma.md: 1
src/pages/schisma.md: 1
src/pages/septimal-comma.md: 1
OK — all four comma pages contain '> **Tempered out by.**' exactly once.
```

### playDyad import-path consistency

```
src/pages/pythagorean-comma.md: OK
src/pages/syntonic-comma.md: OK
src/pages/schisma.md: OK
src/pages/septimal-comma.md: OK
OK — all four pages import playDyad from canonical path.
```

### Kernel-untouched (src/lib/ MUST be empty)

```
OK — src/lib/ untouched.
```

### Framework type-check (tsc --noEmit)

Five pre-existing `npm:` specifier errors (same baseline as `260512-ngj`): `src/audio/synth.ts:29 (npm:sw-synth)`, `src/components/lattice.ts:32 (npm:ji-lattice)`, `src/components/lattice.ts:197/198 (implicit any)`, `src/components/scale-compare.ts:38 (npm:@observablehq/plot)`. **No new errors** referencing `pythagorean-comma.md` or `schisma.md`. Clean delta.

## Deviations from Plan

None — plan executed exactly as written. Both commits are pure-additive (zero deletions, zero modifications to existing lines).

## Self-Check

- [x] `src/pages/pythagorean-comma.md` — modified (commit `c632a8f`)
- [x] `src/pages/schisma.md` — modified (commit `0e922e1`)
- [x] `.planning/quick/260512-udc-bring-four-comma-pages-to-consistent-sec/260512-udc-SUMMARY.md` — created (this file)
- [x] Task 1 verification command — all four checks pass
- [x] Task 2 verification command — all five checks pass
- [x] Cross-page consistency — all four comma pages contain canonical blockquote exactly once
- [x] Import-path consistency — all four pages import playDyad from `../components/play-dyad.js`
- [x] Kernel-untouched — `git diff --name-only src/lib/` empty
- [x] tsc baseline unchanged — no new errors referencing edited files
- [x] Commits exist: `c632a8f`, `0e922e1`

## Self-Check: PASSED
