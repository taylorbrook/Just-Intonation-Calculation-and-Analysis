---
phase: 06-exact-rational-ji-harmonic-generators
reviewed: 2026-06-10T09:55:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - src/lib/cps.ts
  - src/lib/harmonic.ts
  - src/lib/generators.ts
  - src/components/scale-table.ts
  - src/components/generate-cps.ts
  - src/components/generate-harmonic.ts
  - src/components/generate-ji-set.ts
  - src/components/generate-ed.ts
  - src/components/scale-table.css
  - src/components/generate-cps.css
  - src/components/generate-harmonic.css
  - src/components/generate-ji-set.css
  - src/components/generate-ed.css
  - src/styles.css
  - src/lib/__tests__/cps.test.ts
  - src/lib/__tests__/harmonic.test.ts
  - src/lib/__tests__/generators.test.ts
  - src/components/__tests__/scale-table.test.ts
  - src/components/__tests__/generate-cps.test.ts
  - src/components/__tests__/generate-harmonic.test.ts
  - src/components/__tests__/generate-ji-set.test.ts
  - src/components/__tests__/generate-ed.test.ts
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-06-10T09:55:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

The four exact-JI kernels (`cps`, `harmonic`, the JI-set builders in `generators.ts`) hold the load-bearing invariant well: products stay BigInt-exact, dedupe is keyed strictly on the canonical `n/d` string, and floats are confined to sort keys. The deliberate single tempered family (`edScale`) is correctly documented and tested cents-first. The four widgets follow the closure-local Pattern-2 idiom with `createElement` + `textContent` discipline and an error-preserving `rebuild()`. The 48 reviewed kernel/component tests pass.

However, the **tempered-vs-exact boundary is not airtight at the component layer.** `scaleTable`'s copy-button path emits the lossy float-derived fraction of a tempered pitch as a "Ratio" column, contradicting SURF-06 — and that exact `{ tempered: true, copyButton: true }` combination is explicitly exercised as valid by the test suite. This is the one BLOCKER: the invariant is enforced in the visible table but bypassed in the clipboard export the same component owns.

Secondary issues cluster around input-validation inconsistency between the four widgets, a stale-UI-vs-stale-table desync when the kernel caps reject an edit, and several documented-but-real completeness/period gaps in the JI-set builders.

## Critical Issues

### CR-01: Tempered copy-export launders lossy float-ratios as exact "Ratio" column (SURF-06 violation)

**File:** `src/components/scale-table.ts:93-114` (with `src/lib/scala.ts:190-202`)

**Issue:** `scaleTable` drops the Ratio column for tempered scales in the visible table (correct, D-01), but the optional copy button calls `scalaToCsv(scale, baseHz)` **unconditionally and without the tempered flag**. `scalaToCsv` always emits a `Ratio` column via `formatRatio(iv)` = `${iv.fraction.n}/${iv.fraction.d}`. For a tempered `edScale` pitch the underlying fraction is the lossy projection (e.g. 12-EDO's 700¢ step becomes `2126312/1419143` — verified). Copying a tempered table therefore produces a spreadsheet whose "Ratio" column presents a meaningless float-derived rational **as if it were exact JI** — precisely the laundering the phase forbids ("tempered, not laundered JI"). This is not hypothetical: `src/components/__tests__/scale-table.test.ts:103-108` asserts `{ tempered: true, copyButton: true }` renders a working copy button, blessing the exact combination that emits the bad data. The visible safeguard (drop the Ratio column, show a "tempered" badge) is undone the moment the user clicks Copy.

Note the ED widget itself does not currently pass `copyButton`, so today this is reachable only by any caller (including the test) that combines the two flags — but the component's public contract advertises both flags as composable, so the invariant is violated at the contract level, not merely in one wiring.

**Fix:** Make the copy path tempered-aware so it never emits a float-derived ratio for a tempered scale. Either thread the flag into a cents-only serializer, or refuse to attach a Ratio-emitting copy button when `tempered`:

```ts
// scale-table.ts — inside the copy handler
copyBtn.addEventListener("click", () => {
  const tsv = tempered
    ? scalaToCentsCsv(scale, baseHz) // Degree | Cents | ¢-from-12tet | Hz — NO Ratio column
    : scalaToCsv(scale, baseHz);
  void navigator.clipboard.writeText(tsv).then(/* … */);
});
```

```ts
// scala.ts — new sibling serializer; mirrors the D-01 tempered table shape.
export function scalaToCentsCsv(scale: Scale, baseHz: number): string {
  const rows: string[][] = [["Degree", "Cents", "¢ from 12-TET", "Hz"]];
  scale.intervals.forEach((iv, i) => {
    rows.push([
      String(i + 1),
      iv.cents.toFixed(2),
      iv.centsFrom12tet.toFixed(2),
      (baseHz * Number(iv.fraction.valueOf())).toFixed(3),
    ]);
  });
  return rows.map((r) => r.join("\t")).join("\n");
}
```

Add a test asserting the tempered copy payload contains **no** `n/d` ratio token (e.g. matches no `/^\d+\/\d+$/` cell).

## Warnings

### WR-01: Inconsistent integer parsing — three widgets silently truncate `"2.5"→2`, `"1e3"→1`, `"12abc"→12`

**File:** `src/components/generate-harmonic.ts:73-78`, `src/components/generate-ji-set.ts:86-91`, `src/components/generate-ed.ts:75-80`

**Issue:** `generate-cps.ts` uses a strict `parsePositiveInt` (`/^\d+$/` regex — correctly rejects `"2.5"`, `"1e3"`, `"0x4"`, line 70). The other three widgets use `parseIntOrNull`, which calls bare `parseInt(trimmed, 10)` and then guards with `Number.isInteger(parsed)`. That guard is vacuous: `parseInt` always returns an integer or `NaN`, so `"2.5"` is accepted as `2`, `"1e3"` as `1`, `"12abc"` as `12` (all verified). The `min`/`max` HTML attributes do not block programmatically-set `.value` or the truncated parse, so a user typing `2.5` into the ADO divisions / Farey order / EDO divisions field silently gets a different scale than what they typed, with no error. This also diverges from the CPS widget's stricter behavior for no documented reason.

**Fix:** Make `parseIntOrNull` reject non-canonical integer strings, matching `parsePositiveInt`:

```ts
function parseIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null; // reject "2.5", "1e3", "12abc", ""
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
}
```

Consider hoisting one shared `parseIntOrNull`/`parsePositiveInt` into a small util so all four widgets validate identically.

### WR-02: Adding a chip past the cap leaves a phantom chip with a stale table

**File:** `src/components/generate-cps.ts:251-262` (and the remove handler at 218-226)

**Issue:** When `factors.length` is already 12 and the user clicks Add, the code pushes the 13th value into `factors`, re-renders 13 chips, then calls `rebuild()`. `cps()` throws `RangeError` (factors.length > MAX_FACTORS), which surfaces in the status region while the prior 12-factor table is preserved (intended). But `factors` and the chip list now show 13 entries that do **not** correspond to the rendered table — the UI state and the displayed result have silently diverged, and the user has no signal that the 13th chip is "not counted" beyond a generic error string. The same desync occurs for any committed out-of-range `k`. This is a state-consistency defect: the widget's visible inputs no longer describe its visible output.

**Fix:** Validate against the cap before mutating `factors`, or roll back the push when `rebuild()` fails. Simplest:

```ts
addBtn.addEventListener("click", () => {
  const n = parsePositiveInt(chipInput.value);
  if (n === null) return;
  if (factors.length >= 12) { // mirror the kernel cap (MAX_FACTORS)
    status.textContent = "Maximum 12 factors.";
    return;
  }
  factors.push(n);
  // …rest unchanged…
});
```

### WR-03: `oddLimitSet` / `primeLimitSet` accept a `period` param that breaks the enumeration's completeness contract

**File:** `src/lib/generators.ts:134-148` and `163-177`

**Issue:** Both builders take `period = OCTAVE` and call `.octaveReduce(period)` inside the loop, then `foldExactSet(intervals, period)`. But the enumeration bound (`i,j <= limit` for odd-limit; `i,j <= PRIME_SET_HEIGHT` for prime-limit) and the odd-limit / prime-limit predicates are all **octave-centric** — they were derived assuming reduction into `[1, 2)`. If a caller passes a non-octave `period` (e.g. `3/1`), the loop reduces into `[1, 3)`, which (a) lets ratios like `5/3`, `7/3`, `8/3` survive that are outside the intended odd-limit domain and (b) under-enumerates others, so the returned "odd-limit set over the tritave" is neither complete nor sound. The predicate `oddLimit(monzo)` ignores the period entirely. Today the only caller (`generate-ji-set.ts`) always uses the default octave, so this is latent — but the parameter is public API and silently produces incorrect sets when used as its signature invites.

**Fix:** Either remove the `period` parameter (these JI families are octave-fixed per D-07 — make that structural, not a defaulted-but-unsafe argument), or document and guard it: throw if `period` is not `2/1`. Given D-07 fixes the equave at the octave for every exact-JI family, removing the parameter is the honest signature.

### WR-04: `edScale` last interval and `Scale.period` silently disagree (lossy pitch vs. exact equave)

**File:** `src/lib/generators.ts:242-252`

**Issue:** The loop builds `k = divisions` as `centsToRatio(equaveCents)` — a lossy float-derived fraction approximating the equave — but the `Scale` is constructed with the **exact** `equave` as its `period` (line 252). So `scale.intervals[divisions]` and `scale.period` are two different fractions that are equal only within float epsilon, not exactly. Any consumer that relies on "the last interval equals the period" (the D-14 contract that the exact-JI builders satisfy by exact construction) will find it false for `edScale`. `Scale.reduce()` (`scale.ts:77-79`) special-cases `iv.equals(this.period)` to preserve the period — for a tempered scale that equality is false, so the tempered top pitch would be octave-reduced to `~1/1` rather than preserved, changing the scale shape if `reduce()` is ever called on a tempered scale. This is a correctness landmine masked by the fact that tempered scales currently aren't passed through `reduce()`.

**Fix:** Make the intent explicit. Either set the final interval to the exact `equave` (so last-interval === period exactly, matching every other builder's D-14 contract):

```ts
for (let k = 0; k < divisions; k++) {
  const stepCents = (k / divisions) * equaveCents;
  intervals.push(new Interval(centsToRatio(stepCents)));
}
intervals.push(equave); // exact equave as the top pitch == period (D-14)
```

…or add an explicit comment + invariant test documenting that for tempered scales the last interval is intentionally the lossy projection and the period is exact, and assert no caller calls `.reduce()` on it.

### WR-05: ADO over a fractional equave is not guaranteed monotonic / in-range as the equave shrinks toward 1/1

**File:** `src/lib/harmonic.ts:159-188`

**Issue:** `adoScale` validates `equave > 1/1` (good) but with a fractional equave `p/q` the per-step rise is `(p − q)/(divisions·q)`. For an equave only slightly above 1 (e.g. `equave = 101/100`, divisions large), every degree is a distinct exact ratio so the math is sound — but the resulting "scale" is a cluster of near-unison microtones with denominators on the order of `divisions·q`, and there is no guard that the degrees are musically meaningful or that `divisions` is sane relative to the equave. More concretely, there is no validation that `equave` is finite/well-formed beyond `> 1/1`; a UI passing `adoEquaveN/adoEquaveD` where the user typed e.g. `n` huge could mint very large BigInts per degree. The kernel won't crash (BigInt is exact), but combined with WR-01's loose parsing a user can produce a 1000-degree scale of large-denominator near-unisons with no feedback. This is a robustness gap, not a crash.

**Fix:** Lower-priority: consider a sanity guard (e.g. reject `divisions` grossly disproportionate to the equave, or cap denominator growth). At minimum, document that ADO degree denominators scale with `divisions × equave.denominator` so callers size inputs accordingly. Resolving WR-01 (strict integer parsing) removes the most likely abuse path.

### WR-06: `jiSubsetOfEdo` fallback silently substitutes `1/1` for a missing approximation, and a doc/code mismatch on `maxExponent`

**File:** `src/lib/scale.ts:166-180` (consumed by `bestJiInEdo` → `generate-ed.ts` best-JI path)

**Issue:** Two problems in the best-JI-in-EDO path the ED widget exercises (D-05): (1) When `approximatePrimeLimit` returns no candidate within tolerance, the code pushes `new Interval("1/1")` as a placeholder (lines 176-179). A `1/1` silently injected at a non-unison step is a wrong pitch presented without any flag — and because the ED widget renders tempered (cents-only), the user sees `0.0¢` at, say, step 7 with no indication it's a fallback rather than a real approximation. (2) The inline comment at lines 169-171 says `maxExponent=5` is required to avoid overflow, but the comment block at 176-177 still references `maxExponent=8` ("should not happen … at 50¢ tolerance and maxExponent=8"), a stale doc that contradicts the actual argument. The mismatch suggests the fallback reasoning was never re-validated against the value actually passed.

**Fix:** Make the fallback observable rather than silent — e.g. carry a flag or throw so the widget can surface "no JI approximation within tolerance for step k" in its status region, instead of emitting a deceptive `0.0¢`. Fix the stale `maxExponent=8` comment to read `5`. (This file is outside the phase-6 changed set but is directly on the GEN-05/D-05 path under review; flag for the owning phase if out of scope.)

## Info

### IN-01: `degreeToFreq` defined but the widgets compute Hz inline instead of using it

**File:** `src/lib/scale.ts:120-128` vs. `src/components/play-scale.ts:36`

**Issue:** `Scale.degreeToFreq(degree, baseHz)` exists as the canonical degree→Hz boundary, but `playScale` recomputes `baseHz * Number(iv.fraction.valueOf())` inline (and so does `scalaToCsv`). Two code paths for the same conversion invite drift. Not a bug today.

**Fix:** Have `playScale` and `scalaToCsv` call `scale.degreeToFreq(i, baseHz)` so the float-boundary lives in one place.

### IN-02: Vacuous `Number.isInteger` guards across all four widgets

**File:** `src/components/generate-cps.ts:283`, `generate-harmonic.ts:77`, `generate-ji-set.ts:90`, `generate-ed.ts:79`

**Issue:** `Number.isInteger(parseInt(x, 10))` is always true unless the parse is `NaN`; it reads as a real validation but checks nothing `parseInt` didn't already guarantee. See WR-01 for the substantive fix; flagging separately because the pattern recurs and misleads readers into thinking non-integers are rejected.

**Fix:** Replace with the strict regex parse from WR-01.

### IN-03: Negative-zero deviation renders as `"-0.0"`

**File:** `src/components/scale-table.ts:77`

**Issue:** `(delta > 0 ? "+" : "") + delta.toFixed(precision)` renders a small negative deviation that rounds to zero (e.g. `-0.04` at precision 1) as `"-0.0"` (verified). Cosmetic only; the design-conscious profile may notice it.

**Fix:** Normalize `-0` before formatting: `const shown = Object.is(delta, -0) || delta === 0 ? 0 : delta;` then `(shown > 0 ? "+" : "") + shown.toFixed(precision)` — or special-case `Math.abs` results that round to 0.

### IN-04: `primeLimitSet` silently omits low-complexity ratios above the `PRIME_SET_HEIGHT=81` grid

**File:** `src/lib/generators.ts:59-65`, `170-176`

**Issue:** The grid bound (81) is documented as covering "common 5-limit / Pythagorean staples," but it silently excludes lower-complexity members like `243/128` (prime-3, but numerator 243 > 81) from `primeLimitSet(3)`, while including higher-complexity included-by-grid ratios. The set is necessarily bounded (prime-limit is infinite), and this is acknowledged, but a user reasonably expecting "all Pythagorean ratios up to some complexity" gets an arbitrary grid-shaped subset. Behavior is documented; flagging so the UI can set expectations.

**Fix:** Surface the bound to the user (e.g. a caption "limited to numerator/denominator ≤ 81"), or switch to a complexity-bounded (Tenney/Benedetti-height) enumeration so inclusion is monotone in complexity rather than grid-shaped.

---

_Reviewed: 2026-06-10T09:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
