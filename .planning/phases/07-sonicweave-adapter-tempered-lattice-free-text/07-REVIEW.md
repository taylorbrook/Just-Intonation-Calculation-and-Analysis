---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
reviewed: 2026-06-12T05:43:34Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - patches/sonic-weave+0.14.1.patch
  - src/components/__tests__/generate-fokker.test.ts
  - src/components/__tests__/generate-rank2.test.ts
  - src/components/__tests__/generate-sonicweave.test.ts
  - src/components/__tests__/generate-welltemp.test.ts
  - src/components/generate-fokker.css
  - src/components/generate-fokker.ts
  - src/components/generate-rank2.css
  - src/components/generate-rank2.ts
  - src/components/generate-sonicweave.css
  - src/components/generate-sonicweave.ts
  - src/components/generate-welltemp.css
  - src/components/generate-welltemp.ts
  - src/lib/__tests__/fokker.test.ts
  - src/lib/__tests__/sonicweave.test.ts
  - src/lib/fokker.ts
  - src/lib/INVENTORY.md
  - src/lib/sonicweave.ts
  - src/pages/generate.md
  - src/styles.css
findings:
  critical: 1
  warning: 2
  info: 5
  total: 8
status: issues_found
---

# Phase 7: Code Review Report (Re-review after gap closure 07-05 / 07-06)

**Reviewed:** 2026-06-12T05:43:34Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Re-reviewed the Phase-7 surface after gap-closure plans 07-05/07-06. All 70
phase tests pass (6 files, run during this review).

**Prior-finding verification:**

| Prior finding | Status | Evidence |
|---|---|---|
| CR-01 (hardcoded 3/2 in POTE/TE/CTE) | **FIXED, sound** | `composeSource()` now builds `rank2(${genN}/${genD}, …)` in the temper branch (generate-rank2.ts:304-307); regression tests assert the Magic 5/4 chain (≈59.8¢ second degree) and Hanson 6/5 chain (≈68.0¢), not the fifth chain. |
| CR-02 (extent fields never regenerated) | **FIXED with a residual defect** | `renderExtents()` + the `onListChanged` callback regenerate the Up/Down fields on every Add/Remove (generate-fokker.ts:332-337, 361, 433), and the dedicated `extentsHost` avoids dropping an in-progress chip value. However, Remove misassigns surviving axes' extents — see WR-01 below. |
| WR-01/WR-02 (sign laundering / zero interval) | **FIXED, sound** | `if (f.s < 0n || Number(f.n) === 0)` fails closed (sonicweave.ts:130-132). The mixed Number/BigInt comparison is correct (`<` coerces; the `Number(f.n)` zero test correctly avoids the `number !== bigint` strict-equality trap). Tests cover `-3/2` and `0/1`. |
| WR-03 (wrong cap constant, silent swallow) | **FIXED, sound** | Per-instance `cap` parameter (MAX_BASIS=6 / MAX_COMMAS=8) with a visible status message (generate-fokker.ts:350-356); test adds a 7th chip and asserts the message. |
| WR-04 (parseInt comma rounding) | **FIXED at the chip layer** | `parseRatio` validates/normalizes with BigInt (generate-fokker.ts:109-112). Note the math path downstream (`toMonzo`) still cannot handle >2^53 values — it now throws "Numerator above safe limit", which the comma-mode try/catch converts to a status message (fail-closed, verified). Acceptable; readout mislabel noted in IN-05. |
| WR-06 (negative rank-2 generator) | **Neutralized** | A negative typed generator now hits the adapter's fail-closed non-positive guard → status message, prior preview preserved. |
| WR-05 (custom + POTE silent 81/80) | **NOT FIXED** | Carried forward as WR-02 below. |
| IN-01..IN-04 | **NOT FIXED** | All four carried forward unchanged. |

**New finding:** one Critical. The adapter's interval-mapping loop (STEP 3)
sits outside any try/catch, and two of its calls provably throw on legitimate
user input — `iv.toFraction()` throws for any rational whose numerator or
denominator exceeds 2^53 (sonic-weave's Fraction is Number-backed), and
`new Interval(centsToRatio(...))` throws when the cents value projects to
Infinity. Both escape `scaleFromSonicWeave`, violating its documented
never-throws contract (D-18 / T-07-04). Verified by execution against the
installed libraries.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Adapter mapping loop throws past 2^53 and on non-finite cents projections — the never-throws contract (D-18 / T-07-04) is violated on legitimate input

**File:** `src/lib/sonicweave.ts:117-140` (the STEP 3 loop; throwing calls at 121 and 138)
**Issue:** The try/catch (lines 104-112) wraps only `evaluateSource`. The
mapping loop that follows is unguarded, and two of its calls throw —
empirically verified against the installed packages:

1. **`iv.toFraction()` (line 121)** — sonic-weave's `Fraction` is
   xen-dev-utils' Number-backed implementation, which throws
   `Error: Numerator above safe limit` for any value whose numerator or
   denominator exceeds 2^53. Verified:
   `evaluateSource("3^45")` → `iv.value.isFractional() === true` →
   `iv.toFraction()` throws. The same happens for **Mercator's comma
   `3^53/2^84`** — a ratio in the repo's own `COMMAS` table — and for the
   cents literal `2400000.` (exactly 2^2000, so `isFractional()` is true).
   This is squarely inside the project's stated core value ("arbitrary
   ratios, no prime-limit ceiling").

2. **`new Interval(centsToRatio(iv.totalCents()))` (line 138)** — for a
   tempered value above ≈1,228,800 cents (e.g. the program `1228801.`),
   `centsToRatio` returns `Infinity` and fraction.js v5 throws
   `The number Infinity cannot be converted to a BigInt`. Verified.

Either throw escapes `scaleFromSonicWeave` into the caller. In the free-text
widget (`generate-sonicweave.ts:148`), the Evaluate click handler throws
uncaught: the status region is never updated, the user gets silence plus a
console error, and the module-header promise "(D-18 / T-07-04: NEVER throws
to the caller)" is false. Every widget calls this one adapter, so the
free-text path is the user-reachable crash surface (typed `3^45` is a
one-line repro).

**Fix:** Wrap the per-interval mapping fail-closed and guard the non-finite
projection:

```ts
for (const iv of visitor.currentScale) {
  try {
    if (iv.value.isFractional()) {
      const f = iv.toFraction();
      if (f.s < 0n || Number(f.n) === 0) {
        return { scale: null, tempered, error: "Scale contains a non-positive interval." };
      }
      out.push(new Interval(`${String(f.n)}/${String(f.d)}`));
    } else {
      tempered = true;
      const ratio = centsToRatio(iv.totalCents());
      if (!Number.isFinite(ratio) || ratio <= 0) {
        return { scale: null, tempered, error: "Scale contains an interval too large to represent." };
      }
      out.push(new Interval(ratio));
    }
  } catch (e) {
    return {
      scale: null,
      tempered,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
```

Add regression tests: `scaleFromSonicWeave("3^45")`,
`scaleFromSonicWeave("3^53/2^84\n2/1")`, and `scaleFromSonicWeave("1228801.")`
must each return `{ scale: null, error }` without throwing.

## Warnings

### WR-01: Removing a Fokker basis chip reassigns the removed axis's extents to the surviving axes — Up/Down values silently jump between primes

**File:** `src/components/generate-fokker.ts:417-424` (basis `setList`), `332-339` (chip Remove)
**Issue:** The CR-02 fix regenerates the extent *fields* correctly, but the
extent *values* are realigned by position only:

```ts
basisGenerators = next.map((s) => parseInt(s, 10)).slice(0, MAX_BASIS);
ups = basisGenerators.map((_, i) => ups[i] ?? 0);
downs = basisGenerators.map((_, i) => downs[i] ?? 0);
```

`setList` receives only the post-splice list, so the removal index is lost
and `ups`/`downs` keep their leading entries regardless of *which* axis was
removed. Concretely, from the default state (basis `[3, 5]`, ups `[3, 1]`,
downs `[0, 1]`): removing the **3** chip leaves basis `[5]` with
`ups = [3]`, `downs = [0]` — prime 5 inherits prime 3's extents (3 up, 0
down) instead of keeping its own (1 up, 1 down), and the rendered block
silently changes from the user's intent. The CR-02 regression test checks
only the field *count* after removal, not the values, so this passes the
suite. (Add is unaffected: the new axis correctly appends `0/0`.)
**Fix:** Splice the extents in parallel with the basis. Either pass the
mutation index through `makeChipInput` (e.g.
`onListChanged?.(removedIndex?)`) or, simplest, have the basis `setList`
realign by diffing: since the remove handler already knows `i`, change
`makeChipInput` to call a `setListAt(next, removedIndex)` variant for the
basis instance and do `ups.splice(removedIndex, 1); downs.splice(removedIndex, 1);`
before the positional map. Then extend the CR-02 removal test to assert the
surviving axis keeps its own Up/Down values.

### WR-02: Custom preset + POTE/TE/CTE still silently tempers by the syntonic comma 81/80 (prior WR-05, unfixed)

**File:** `src/components/generate-rank2.ts:304-305`
**Issue:** `const comma = seed ? seed.comma : "81/80"` — when
`preset === "custom"` (no `PRESETS` entry), selecting POTE/TE/CTE optimizes
against the syntonic comma with no status message and no comma input in the
widget. A user who typed a custom generator (say 7/4) and picked POTE gets a
scale tempered against a comma they never chose and cannot see. The CR-01
generator fix makes the result *less* wrong than before (the generator is now
honored), but the assumed comma remains invisible.
**Fix:** Surface it in the status region when `preset === "custom"` and a
temper tuning is active (e.g. "Custom + POTE/TE/CTE tempers the syntonic
comma 81/80; use the free-text method for other commas."), or disable the
POTE/TE/CTE options while `preset === "custom"`.

## Info

### IN-01: Dead cents-generator path in generate-rank2 (carried, unfixed)

**File:** `src/components/generate-rank2.ts:136-137, 292`
**Issue:** `genIsCents` is only ever assigned `false` (lines 345, 377);
`genCents` is a `const 700` marked "reserved". The ternary
`genIsCents ? String(genCents) : …` in the `pure` branch is unreachable dead
code implying a typed-cents feature that does not exist.
**Fix:** Delete `genIsCents`/`genCents` and the ternary until the cents
generator path is actually built.

### IN-02: Comma-mode enumeration is an all-upward HNF box, not the textbook centered block (carried, unfixed)

**File:** `src/components/generate-fokker.ts:125-148`
**Issue:** `commaToParallelotopeSource` sets all `downs` to zero and uses the
HNF diagonal for `ups`. Mathematically valid transversal (cardinality is
exactly |det| — the upper-triangular coset argument holds), but it is *a*
periodicity block, not the canonical centered one (e.g. it contains 135/128
where the classic 12-tone block has 16/15), while the tests and UI framing
say "the classic … block".
**Fix:** Document the upward-from-1/1 convention in the widget copy, or
center the extents (`up = floor((h-1)/2)`, `down = ceil((h-1)/2)`).

### IN-03: Unreachable `!first` branch in the adapter's unison prepend (carried, unfixed)

**File:** `src/lib/sonicweave.ts:149-150`
**Issue:** `out.length === 0` already returned at line 143, so `out[0]` is
always defined and the `!first ||` guard is dead.
**Fix:** `if (!out[0]!.equals(UNISON)) out.unshift(new Interval("1/1"));`

### IN-04: Basis chips accept `1` and composite integers while labels claim "prime" (carried, unfixed)

**File:** `src/components/generate-fokker.ts:87-94, 387/399 (labels)`
**Issue:** `parsePositiveInt` admits `1` (a degenerate axis — every step is
the unison, inflating the "→ N notes" readout above the distinct-note count)
and composites/duplicates (`9`, or adding `3` twice → singular-feeling
duplicate axes), while the extent labels read "Up (prime N)".
**Fix:** Reject `1` in the basis validator (`n < 2 → null`) and either
relabel "prime" → "basis" or validate primality/uniqueness.

### IN-05: Comma-mode error readout always blames squareness; fokkerCardinality JSDoc claims only RangeError

**File:** `src/components/generate-fokker.ts:484`; `src/lib/fokker.ts:57-59`
**Issue:** The comma-mode catch writes the fixed readout
`"→ — notes (needs a square comma set)"` for *every* failure — including the
over-cap case, the degenerate-determinant case, and the new
`toMonzo` "Numerator above safe limit" case for >2^53 commas (the status
region does carry the real message, so this is cosmetic). Relatedly,
`fokkerCardinality`'s JSDoc says `@throws RangeError`, but `toMonzo` can
propagate a plain `Error` through it.
**Fix:** Use a neutral readout (`"→ — notes"`) and let the status message
explain; amend the JSDoc to `@throws RangeError | Error`.

---

_Reviewed: 2026-06-12T05:43:34Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
