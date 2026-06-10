# Phase 6: Exact-Rational JI & Harmonic Generators - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 6-exact-rational-ji-harmonic-generators
**Areas discussed:** Tempered display, Octave reduction, EDO / ED-n scope, Picker & defaults, Equave exposure, First-render defaults

---

## Tempered display (SURF-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Nearest-JI ≈ + badge | Cents-primary; ratio column shows nearest JI ratio prefixed `≈`, plus a "tempered" badge | |
| Cents only, no ratios | Drop the ratio column entirely for tempered scales — cents + cents-from-12tet only, with badge | ✓ |
| Show 2^(k/n) form | Render the exact irrational step as `2^(k/12)`-style notation | |

**User's choice:** Cents only, no ratios (+ "tempered" badge)
**Notes:** Stricter than the milestone PLAN's "suppressed-or-`≈`" wording — zero chance of a fake ratio. Tempered flag stays at component layer; no `tempered` field on Interval/Scale (milestone-locked).

---

## Octave reduction (harmonic family)

| Option | Description | Selected |
|--------|-------------|----------|
| Literal + reduce toggle | Default literal overtone form (unreduced), with a "reduce to octave" toggle | ✓ |
| Reduced by default | Octave-reduce into [1,2) by default, toggle to unreduce | |
| Always literal, no toggle | Literal overtone form only; transforms arrive Phase 8 | |

**User's choice:** Literal + reduce toggle
**Notes:** Matches how a composer hears an overtone segment. The toggle is a per-method param shipped this phase — distinct from the general Phase-8 transform strip.

---

## EDO / ED-n scope (GEN-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Pure equal only | Just equal-step divisions; JI-in-EDO lives on /analysis | |
| Equal + JI-in-EDO mode | Add a sub-mode reusing bestJiInEdo for best JI approximations within the EDO | ✓ |

**User's choice:** Equal + JI-in-EDO mode
**Notes:** Accepted overlap with the /analysis EDO mapping — wants it reachable from the Generate surface too. Both modes are tempered output (cents-primary, no ratio column, badge).

---

## Picker & default landing method

| Option | Description | Selected |
|--------|-------------|----------|
| CPS Hexany default; fold harmonic | Default to flagship CPS 1-3-5-7 Hexany; fold the Phase-5 harmonic-segment reference into the full Harmonic widget | |
| Keep harmonic default | Harmonic-segment stays the default landing method; Harmonic widget gains the other sub-methods around it | ✓ |
| No auto-load | Keep the "— pick a method —" placeholder; nothing renders until a pick | |

**User's choice:** Keep harmonic default
**Notes:** Preserves Phase-5 first-load behavior byte-for-byte — anti-regression instinct over flashy first impression. Harmonic-segment becomes the default sub-method of the full Harmonic widget; CPS is one pick away.

---

## Equave / period exposure (JI families)

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 2/1; only ED-n editable | JI families reduce to the octave; only ED-n exposes an equave field | ✓ |
| Editable equave everywhere | Every generator exposes an equave/period ratio field | |

**User's choice:** Fixed 2/1; only ED-n editable
**Notes:** User asked for an explanation of "equave" (interval of equivalence / repeat interval; octave 2/1 by default, e.g. Bohlen-Pierce 3/1 tritave) before deciding. Kernel still takes a `period` param so the capability exists; non-octave equaves for JI families deferred to the Phase-8 transform strip.

---

## First-render defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Common / pedagogical | EDO 12 · ED-n 13-ED3 · CPS 1-3-5-7 Hexany · Dekany 2-of-5 {1,3,5,7,9} · Eikosany 3-of-6 {1,3,5,7,9,11} · harmonic 8..16 · ADO 6 · odd-limit 9 · prime-limit 5 · Farey order 8 | ✓ |
| Showcase the exotic | Lead with adventurous defaults (EDO 31, odd-limit 15, …) | |
| You decide | Leave exact defaults to the planner | |

**User's choice:** Common / pedagogical
**Notes:** Familiar, legible starting values per method.

---

## Claude's Discretion

- Component decomposition (per-family vs per-sub-method factories) — follow mos-builder Pattern-2 + milestone Tranche-1 file layout.
- CPS hand-roll over `kCombinations` vs `SW cps` (hand-roll preferred).
- Factor-set chip-input UX, isoharmonic param shape, defense-in-depth caps, exact "tempered" badge styling (match 05-UI-SPEC tokens).

## Deferred Ideas

- Non-octave equave for JI families → Phase 8 transform strip.
- Rotate-to-mode + reduce/dedupe/transpose strip (SURF-04) → Phase 8.
- Circle-of-pitches viz (SURF-05) → Phase 8.
- SonicWeave methods — rank-2, well-temperament, Fokker, free-text (GEN-06..09) → Phase 7.
- Wilson/metallic + constant-structure (GEN-10) → Phase 8.
- Offering existing tonality-diamond / lattice viz for JI results → revisit with Phase-8 circle viz.
- Tetrachordal (Chalmers) builder, harmonic-entropy selection → out of v1.1.
</content>
