---
phase: 03-visualization-mobile-audio-audit
reviewed: 2026-05-06T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/diamond.ts
  - src/lib/__tests__/diamond.test.ts
  - src/components/tonality-diamond.ts
  - src/components/__tests__/tonality-diamond.test.ts
  - src/audio/synth.ts
  - src/audio/__tests__/synth.test.ts
findings:
  blocker: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 3: Code Review Report (Post-Gap-Closure)

**Reviewed:** 2026-05-06
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This is the post-gap-closure re-review for phase 3. Plan 03-07 closed the two
BLOCKERs (CR-01 layout collapse, CR-02 arpeggio panic gap) and backfilled the
mobile-audit footer. Both fixes are correct, surgical, and accompanied by load-bearing
regression tests:

- **CR-01 (DiamondCell layout collapse)** — `DiamondCell` now carries the original
  odd-integer pair as non-optional `i: number; j: number;` fields (`src/lib/diamond.ts:40-42`).
  `enumerateDiamond` populates them inside the (i, j) loop (`src/lib/diamond.ts:88-95`).
  The SVG layout in `tonality-diamond.ts` keys `rankOf` lookups on `d.i` / `d.j`
  instead of the octave-reduced `d.numerator` / `d.denominator` (`tonality-diamond.ts:202-203`).
  The regression test at `tonality-diamond.test.ts:49-96` asserts (a) 16 cells
  render at oddLimit=7, (b) all 12 non-diagonal cells have unique transforms,
  (c) all 4 diagonal cells render at x=0 (correct rhombus geometry — central
  vertical unison axis), and (d) every transform across all 16 cells is unique.
  This is stricter than the original 03-07-PLAN's "diagonals collapse to one
  transform" — the executor delivered the more correct rhombic-diamond layout
  where the four `1/1` diagonals stack vertically rather than overlapping. The
  test would fail against the pre-fix code (rankOf.get(undefined) → 0 fallback
  collapses every cell with even reduced numerator onto the row=0 axis).

- **CR-02 (arpeggio panic gap)** — `arpTimers: Set<ReturnType<typeof setTimeout>>`
  declared in the createSynth closure scope (`synth.ts:125`). `playArpeggio`
  captures each timer handle, adds it to the Set, and self-removes on fire
  (`synth.ts:265-272`). `panic()` clears all timers BEFORE `synth.allNotesOff()`
  (`synth.ts:297-298`). `dispose()` clears them as the first teardown step
  (`synth.ts:314-315`). The regression test at `synth.test.ts:290-309` starts a
  5-note arpeggio at 500ms cadence, advances time to fire note 2, calls
  `synth.panic()`, then advances 2000ms and asserts `noteOn` call count is
  pinned at 2 (no further notes fire). Test is load-bearing — would fail
  against the pre-fix code.

- **No new bugs introduced.** The fixes are minimal, scoped, and do not perturb
  unrelated audio/visualization paths. Closure scope of `arpTimers` matches the
  `createSynth` lifetime; bounded by the existing MAX_ARPEGGIO_LEN=256 cap.

The remaining findings below are minor/pre-existing and out of scope for the
gap-closure plan (the verifier explicitly deferred WR-01..WR-08 to a polish
phase). This review surfaces two warnings worth tracking and two info-level
notes specific to the gap-closure deltas.

## Blocker Issues

None. Both prior BLOCKERs (CR-01 / CR-02) are correctly resolved with load-bearing
regression tests.

## Warnings

### WR-01: `playNoteImpl`'s release-callback timer is not tracked in `arpTimers`; closures persist after `panic()` for `noteLen` seconds

**File:** `src/audio/synth.ts:212-229, 265-272`
**Issue:** The CR-02 fix tracks the **arpeggio scheduling** timers (the per-step
`setTimeout` that fires the next note) but NOT the **release** timers that
`playNoteImpl` itself creates at line 224 (`setTimeout(release, dur * 1000)`).
After `panic()` is called mid-arpeggio:

1. `arpTimers` is cleared — pending step timers are cancelled. Correct.
2. `synth.allNotesOff()` silences the currently-sounding voice. Correct.
3. `activeVoices = 0` is set. Correct as observed counter state.
4. **But** the per-note release timer queued by `playNoteImpl` for the
   currently-sounding voice (and any earlier note still within its `noteLen`
   window) keeps ticking in the timer queue. When it fires, `release()` calls
   the underlying `off()` (already a no-op after `allNotesOff`) and decrements
   `activeVoices` via `Math.max(0, activeVoices - 1)`.

The functional impact is benign: `Math.max(0, 0 - 1) === 0`, and `off()` after
`allNotesOff()` is idempotent (sw-synth's noteOff handlers are individually
released). But each unfired release timer holds a closure capturing `synth`,
`ctx`, and `off`, which means the disposed AudioContext cannot be GC'd until
the longest pending release timer elapses. For an arpeggio at the default
0.45s/step with 0.95 ratio, that is up to ~430ms per note × 256 notes = ~110s
of held closures after dispose, even with the CR-02 fix.

This was flagged in passing in CR-02's original write-up ("each closure holds
a reference to the disposed `ctx`, blocking GC of the disposed AudioContext")
but the chosen fix only addressed the scheduling-timer half. The release-timer
half is a smaller version of the same leak shape.

**Fix:** Track release timers in a sibling Set (or extend `arpTimers` to a
generic `pendingTimers` Set). Cancel them in `panic()` and `dispose()`:

```ts
// closure scope
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

// inside playNoteImpl:
const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
  pendingTimers.delete(timer);
  release();
}, dur * 1000);
pendingTimers.add(timer);
return () => {
  pendingTimers.delete(timer);
  clearTimeout(timer);
  release();
};
```

Then panic/dispose do `for (const t of pendingTimers) clearTimeout(t); pendingTimers.clear();`
in addition to clearing `arpTimers`. Prefer the unified-Set refactor — keeping
two parallel Sets invites future asymmetry bugs.

Lower priority than the CR-02 fix because the leak is bounded (max ~110s) and
the audio output is correct; defer to a polish pass.

### WR-02: Diagonal cells (i === j) all render the literal text "1/1" at distinct vertical positions — visual ambiguity with no labeling differentiation

**File:** `src/components/tonality-diamond.ts:202-206, 235-242`
**Issue:** With the CR-01 fix, the four diagonal cells `(1,1), (3,3), (5,5), (7,7)`
at oddLimit=7 each octave-reduce to `1/1` and render at distinct vertical
positions along the unison axis (x=0, y=0/2*STRIDE/4*STRIDE/6*STRIDE). The
regression test at `tonality-diamond.test.ts:83-91` correctly verifies this
geometry. However, the cell text label and `aria-label` are derived from
`d.numerator` / `d.denominator` and `d.ratio.fraction.toFraction()` (lines 220-222,
241-242, 249-250), so all four cells display the identical text "1/1" with
identical tooltip "1/1 | +0.0¢ | 1-limit | …" — the user has no way to
distinguish (3,3) from (5,5) visually. The original (i, j) pair is now
available on the cell datum but is not surfaced to the UI.

This is a UX regression introduced by the CR-01 fix — pre-fix, the four
diagonals all collapsed onto the apex (a different bug); post-fix, they're
distinct positions but indistinguishable by label. The Partch/Erlich diamond
convention is to label diagonal cells with their ORIGINAL `i:j` pair (e.g.
"3:3", "5:5") to surface the otonal/utonal symmetry.

**Fix:** Either label diagonal cells by `i:j` (or `i/j` pre-reduction) or
collapse all four diagonals to the apex (the original 03-07-PLAN's intent —
`expect(diagonalTransforms.size).toBe(1)`) and let the apex represent "1/1"
with a single cell. The current half-state — distinct positions, identical
labels — is the worst of both worlds.

```ts
// Option A (preferred): label by original (i:j) for diagonal cells
.text((d: DiamondCell) =>
  d.i === d.j && d.numerator === 1
    ? `${String(d.i)}:${String(d.j)}`
    : `${String(d.numerator)}/${String(d.denominator)}`
);
```

Out of scope for the CR-01 gap-closure fix per se (the regression test the plan
specified was "all transforms unique," which the executor delivered). Surface
in the next polish pass.

## Info

### IN-01: `INVENTORY.md` description of `DiamondCell` is stale — does not mention the new `i, j` fields

**File:** (out-of-scope file, but worth noting) `src/lib/INVENTORY.md:81`
**Issue:** The inventory entry still describes `DiamondCell` as
`{ ratio, numerator, denominator, inScale }`. The interface contract changed
in this gap-closure to add `i: number; j: number;` as non-optional fields, but
INVENTORY.md was not updated.

INVENTORY.md is the canonical reference per project convention (see CLAUDE.md
"Three-layer discipline" and the per-file inventory pattern). Drift between
the live interface and INVENTORY.md is a documentation tax that compounds.

**Fix:** Update line 81 to:
```
| `DiamondCell` (interface, `src/lib/diamond.ts`) | Custom (this repo) | Cell record for the tonality-diamond viz: `{ i, j, ratio, numerator, denominator, inScale }`. `i, j` preserve the ORIGINAL odd-integer pair from the (i, j) enumeration; `numerator, denominator` reflect the OCTAVE-REDUCED ratio's `n, d` (so consumers see "5/4" for the (i=5, j=1) cell). The (i, j) split is required by the SVG layout in `src/components/tonality-diamond.ts` — reduced n/d are not always odd (e.g. (3,5)→6/5) and would miss a rank table keyed on the odd integers (CR-01). VIZ-02 / D-22. |
```

INVENTORY.md is not in this review's file scope, but the drift is a direct
consequence of the gap-closure delta, so it deserves a flag.

### IN-02: Defensive `?? 0` fallback on `rankOf.get(d.i) / rankOf.get(d.j)` is dead code post-fix; comment acknowledges this but keeps it

**File:** `src/components/tonality-diamond.ts:202-203`
**Issue:** The transform callback reads:

```ts
const row = rankOf.get(d.i) ?? 0;
const col = rankOf.get(d.j) ?? 0;
```

The block comment at lines 196-201 explicitly states "The fallback `?? 0` is
no longer load-bearing (every cell now has integer i and j by construction)
but stays for defense-in-depth." This is a defensible decision — the fallback
covers the hypothetical case where a future caller passes a `DiamondCell` not
produced by `enumerateDiamond` (e.g. external test fixtures, manual cell
arrays). But "defense-in-depth that silently maps to the apex" is a poor
failure mode: a future bug that produces (i, j) values outside the rankOf set
would silently collapse cells onto (0, 0) — exactly the broken behavior CR-01
fixed.

**Fix (low priority):** Replace the silent fallback with a fail-fast assertion
or a logged warning so a future regression surfaces immediately:

```ts
const row = rankOf.get(d.i);
const col = rankOf.get(d.j);
if (row === undefined || col === undefined) {
  throw new Error(
    `tonalityDiamond: cell (${String(d.i)}, ${String(d.j)}) not in rankOf table — ` +
      `oddLimit=${String(limit)} expected odds in [1, ${String(limit)}]`,
  );
}
```

Alternatively, drop the `?? 0` entirely and let TypeScript surface the
`number | undefined` at the call site so the contract is visible. The current
half-defensive form is the worst option: it neither catches bugs nor cleanly
declares the invariant.

---

_Reviewed: 2026-05-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
