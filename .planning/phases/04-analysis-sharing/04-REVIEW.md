---
phase: 04-analysis-sharing
reviewed: 2026-05-06T00:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - src/lib/edo.ts
  - src/lib/mos.ts
  - src/lib/url.ts
  - src/lib/__tests__/edo.test.ts
  - src/lib/__tests__/mos.test.ts
  - src/lib/__tests__/url.test.ts
  - src/components/edo-jit-table.ts
  - src/components/edo-jit-table.css
  - src/components/edo-ji-table.ts
  - src/components/edo-ji-table.css
  - src/components/mos-builder.ts
  - src/components/mos-builder.css
  - src/components/scale-compare.ts
  - src/components/scale-compare.css
  - src/components/__tests__/edo-jit-table.test.ts
  - src/components/__tests__/edo-ji-table.test.ts
  - src/components/__tests__/mos-builder.test.ts
  - src/components/__tests__/scale-compare.test.ts
  - src/__tests__/url-hash-integration.test.ts
  - src/pages/analysis.md
  - src/index.md
  - src/styles.css
  - src/lib/INVENTORY.md
  - vitest.config.ts
  - package.json
findings:
  blocker: 2
  warning: 7
  total: 9
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-06
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Phase 4 ships four substantive features (EDO↔JI mapping kernel, hand-rolled MOS,
shareable URL hash, scale-compare widget) plus three new components and integration
into both `index.md` and `pages/analysis.md`. The kernel modules are clean and
well-disciplined: BigInt Fraction equality is honored throughout, `Fraction` is
never imported from `xen-dev-utils`, defense-in-depth caps are present, the
URL decoder is total (returns null on every failure path), and the MOS algorithm
uses semi-convergents (not just CF convergents) as required.

The single most serious issue is a **shape mismatch between scaleA and the
BUILTIN_B_SCALES presets in scaleCompare** (BL-01). Production wiring
(`new Scale(parseScala(scaleText))`) gives an A scale with a leading `1/1`
unison; every preset and the paste/.scl import path strips that leading `1/1`
to a 7-interval shape. The result is a guaranteed-broken first row in the
alignment table for the seed scale (A° 1 = `1/1` aligns to nearest B = `9/8`
at 100¢/200¢, |Δ¢| ≈ 100–204), and the common-subset count is undercounted
because no preset contains `1/1`. The Vitest suite passes because every test
fixture hand-builds A WITHOUT the leading `1/1`, masking the production
discrepancy. BL-02 calls out a related correctness gap in nearest-cents
alignment that misses exact BigInt matches when an inexact-but-cents-closer
B interval happens to be earlier in B's list.

The remaining findings are quality/UX: free-typing in numeric inputs (no debounce,
no input vs. change distinction) causes mid-typing scale rebuilds with clamped
values; `scaleCompare`'s mode switch leaves stale paste-derived `scaleB` in place;
prime-limit kind in `edoJiTable` accepts limit=1 (which throws inside
`jiSubsetOfEdo`); per-page `let timer = null; clearTimeout(timer)` patterns are
dead code; and the dashboard's `Analyze this scale →` flow + page-cell `display:`
binding to `audioActive` work via Observable Mutable dereferencing but the pattern
is implicit and hard to verify by reading the cell alone (informational).

---

## BLOCKER Findings

### BL-01: scaleA shape mismatch with BUILTIN_B_SCALES — first row meaningless, common-subset undercounted

**File:** `src/components/scale-compare.ts:75-120`, `src/components/scale-compare.ts:135-164`, `src/pages/analysis.md:106`
**Classification:** BLOCKER
**Issue:** Production scaleA is constructed as `new Scale(parseScala(scaleText))` (analysis.md line 106). `parseScala` auto-prepends `1/1` per D-13, so the seed scale produces 8 intervals: `[1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1]`. Every entry in `BUILTIN_B_SCALES` is hand-coded with NO leading `1/1` (7 intervals for `pythagorean-7` / `5-limit-7`, 12 for `12tet`, etc.), and both the paste handler (line 435) and the .scl import handler (line 456) explicitly do `intervals.slice(1)` to "drop the auto-prepended 1/1 so scaleB matches the same shape as the presets." The result is that the alignment table's first row always shows A° 1 = `1/1` (0¢) aligned to B's nearest-cents interval (e.g. `9/8` at 203.91¢ for `pythagorean-7`, or 100¢ for `12tet`), with |Δ¢| ≈ 100–204. The common-subset count is also undercounted because none of the presets contain `1/1` even though scaleA always does.

The Vitest suite does not catch this: every test fixture (`seedA()` line 23-32, `pythagorean7()` line 34-46) hand-constructs scaleA WITHOUT a leading `1/1`, so Test 9's assertion `rows.length === seedA().intervals.length` (= 7) passes against a 7-interval shape that production never produces.

**Reproduction (analysis page, default seed):**
- A = `[1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1]` (8 entries)
- Default B preset = `12tet` = 12 EDO steps `[100¢, 200¢, …, 1200¢]` (no 1/1)
- Row 1: A° 1 = 1/1 (0¢) → nearest B = first 12-EDO step (100¢) → |Δ¢| = 100¢
- "Common subset" never includes the unison even though both A and B agree on it musically.

**Fix:** Normalize scaleA at the scaleCompare boundary so it matches the preset shape. Two equivalent options:

```ts
// Option A — strip leading 1/1 in scaleCompare itself, keeping the page cell unchanged.
export function scaleCompare(scaleA: Scale, synth: SynthHandle, opts: ScaleCompareOpts = {}): HTMLElement {
  // …
  const aNormalized = (scaleA.intervals[0] && scaleA.intervals[0].equals(new Interval("1/1")))
    ? new Scale(scaleA.intervals.slice(1), scaleA.period)
    : scaleA;
  // …use aNormalized in render/align below.
}
```

```ts
// Option B — add 1/1 to every BUILTIN_B_SCALES entry AND auto-prepend on paste/.scl,
// matching the shape that parseScala produces. Keeps A and B both 1/1-prefixed.
// Either choice is acceptable; pick one and apply it consistently.
```

Add a regression test that constructs scaleA via `new Scale(parseScala(seedText))` (the production path) and asserts the table row count matches the user-visible degree count, and that the common-subset count includes `1/1` when both sides agree on it. (e.g. seedA-from-parseScala vs `pythagorean-7` should report common subset ≥ 5, not ≥ 4.)

---

### BL-02: align() picks first-cents-nearest B, can miss exact BigInt match later in list

**File:** `src/components/scale-compare.ts:135-164`
**Classification:** BLOCKER
**Issue:** `align()` finds the nearest-cents B interval for each A interval, then uses `aIv.equals(best)` to flag exact matches. When two B intervals are equidistant in cents (or the inexact-but-closer one comes earlier in `b.intervals`), the loop's `if (d < bestDist)` (strict less-than) keeps the FIRST tied candidate. If a later B interval is BigInt-equal to A but tied or epsilon-farther in float cents, it is silently passed over and the row is reported as a non-match.

Concrete trigger: any B preset where two intervals are within float-rounding of the same cents value. Less contrived: `12tet` has step 12 = `2/1` exactly (float `2.0` → BigInt `2/1`). When scaleA contains `2/1`, the cents distance to step 12 is 0; nothing closer exists; `best === step 12`; `aIv.equals(step 12)` is true; the row is flagged as a match. So the period case works.

But the algorithm is fragile in principle: if a future preset (or pasted scale) puts a non-`2/1` interval at exactly 1200¢ and lists it BEFORE the `2/1` period, the period match is missed. Common-subset detection (D-32 / Pitfall #1) is supposed to be exact-rational; the cents-nearest pre-filter undermines that contract.

**Fix:** Two-pass alignment:

```ts
function align(a: Scale, b: Scale): AlignedRow[] {
  return a.intervals.map((aIv, i) => {
    if (b.intervals.length === 0) {
      return { aDegree: i + 1, aInterval: aIv, bMatch: null, centsDelta: null, exactMatch: false };
    }
    // Pass 1: BigInt-exact match wins unconditionally (D-32 / Pitfall #1).
    const exact = b.intervals.find((bIv) => aIv.equals(bIv));
    if (exact) {
      return {
        aDegree: i + 1,
        aInterval: aIv,
        bMatch: exact,
        centsDelta: 0,
        exactMatch: true,
      };
    }
    // Pass 2: nearest-cents fallback for inexact case.
    let best = b.intervals[0]!;
    let bestDist = Math.abs(aIv.cents - best.cents);
    for (let j = 1; j < b.intervals.length; j++) {
      const cur = b.intervals[j]!;
      const d = Math.abs(aIv.cents - cur.cents);
      if (d < bestDist) { best = cur; bestDist = d; }
    }
    return {
      aDegree: i + 1,
      aInterval: aIv,
      bMatch: best,
      centsDelta: bestDist,
      exactMatch: false,
    };
  });
}
```

Add a test: B contains a non-equal interval at the same cents-rounded position as a BigInt match (e.g. construct B with a Number-derived interval at exactly `1200¢` followed by `2/1`); assert the row reports `exactMatch: true` and `centsDelta: 0`.

---

## WARNING Findings

### WR-01: Free-typing in numeric inputs causes mid-typing rebuilds with clamped intermediate values

**File:** `src/components/mos-builder.ts:129-140`, `src/components/mos-builder.ts:178-181`, `src/components/edo-ji-table.ts:107-126`
**Classification:** WARNING
**Issue:** Every numeric input fires `input` events on every keystroke and immediately calls `rebuild()` / `renderTable()`. The handlers feed the raw value through `clampPositiveInt` / `clampLimit`, which floors empty / `NaN` / out-of-range inputs to 1 (mos-builder) or `DEFAULT_LIMIT` (edo-ji-table). Concretely:

- mos-builder: user clears the size field to type "12". After deleting, the field is empty for one frame; `clampPositiveInt("", 1024)` returns 1; `rebuild()` runs with size=1; the table re-renders to a 2-row scale; user finishes typing "12" and the table corrects to 13 rows. Visible flicker.
- edo-ji-table: user types "33" in limit while kind=odd. After typing "3", `clampLimit(3)` returns 3 and the status announces no clamp; user types "3" again to make "33", `clampLimit(33)` returns 31 and the status announces "Limit clamped to 31." But because `limitInput.addEventListener("change", onLimitChange)` is ALSO bound and fires after the user blurs/presses Enter, the change-event re-runs `onLimitChange` with the now-clamped value `31`, the `clamped !== raw` branch is false, and `setStatus("")` clears the just-shown clamp message. The user sees the announcement flash and disappear.

**Fix (option A — debounce input):**
```ts
let inputDebounce: ReturnType<typeof setTimeout> | null = null;
sizeInput.addEventListener("input", () => {
  if (inputDebounce) clearTimeout(inputDebounce);
  inputDebounce = setTimeout(() => { /* rebuild */ }, 200);
});
```

**Fix (option B — only act on `change`, not `input`):** Drop the `input` listener and rely on `change` (fires on blur / Enter). Simpler; matches the `Inputs.number` reactivity pattern used elsewhere on the page.

For edo-ji-table specifically: bind only one of `input` or `change` (currently both), so the clamp message isn't immediately overwritten.

---

### WR-02: `edoJiTable` `kind="prime"` accepts `limit=1` which throws RangeError inside the kernel

**File:** `src/components/edo-ji-table.ts:32-34`, `src/components/edo-ji-table.ts:218-224`
**Classification:** WARNING
**Issue:** The limit input's `min` / `max` is universal `[1, 31]` regardless of `kind`. For `kind="prime"`, `bestJiInEdo(edoSteps, 1, "prime")` delegates to `jiSubsetOfEdo(edoSteps, 1)`; the latter computes `limitIndex = -1` (no prime ≤ 1) and throws `RangeError: jiSubsetOfEdo: primeLimit 1 below 2`. The component's `try/catch` in `renderTable()` (line 161-165) surfaces the error in the status region and clears the table, but the user sees an empty table and a kernel-internal error message — UX confusion.

This is a contract drift: the component's clamp range covers a value the kernel doesn't support for the prime branch.

**Fix:** Tighten `clampLimit` to depend on `kind`, OR validate at the input boundary and surface a friendlier message:
```ts
function clampLimit(n: number, kind: EdoJiKind): number {
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  const i = Math.floor(n);
  const min = kind === "prime" ? 2 : ODD_LIMIT_MIN;
  if (i < min) return min;
  if (i > ODD_LIMIT_MAX) return ODD_LIMIT_MAX;
  return i;
}
// And re-clamp on kind change:
kindSelect.addEventListener("change", () => {
  kind = kindSelect.value === "odd" ? "odd" : "prime";
  const newLimit = clampLimit(limit, kind);
  if (newLimit !== limit) {
    limit = newLimit;
    limitInput.value = String(limit);
  }
  // …
});
```

---

### WR-03: scaleCompare mode switch doesn't reset stale `scaleB` from prior mode

**File:** `src/components/scale-compare.ts:397-407`
**Classification:** WARNING
**Issue:** `applyMode(mode)` only toggles `display: none` on the Preset / Paste / Import wrappers. It does not reset `scaleB` to the currently-visible source. Sequence to reproduce:
1. User starts in "Preset" mode, B = 12-EDO.
2. User switches to "Paste", types `5/4\n3/2\n2/1` → scaleB updates to the parsed paste, table re-renders.
3. User switches BACK to "Preset" — the preset dropdown still shows "12tet", but `scaleB` is still the pasted scale. The visible table still reflects the paste; the user now thinks they're seeing a `12tet` comparison.

**Fix:** Reset `scaleB` based on the visible source in `applyMode`:
```ts
function applyMode(mode: string): void {
  presetSelect.style.display = mode === "Preset" ? "" : "none";
  pasteWrap.style.display = mode === "Paste" ? "" : "none";
  importWrap.style.display = mode === "Import .scl" ? "" : "none";
  if (mode === "Preset") {
    scaleB = BUILTIN_B_SCALES[presetSelect.value]!();
    rerender();
  } else if (mode === "Paste") {
    // Re-parse the textarea if it has content; else keep prior scaleB.
    const text = pasteTextarea.value.trim();
    if (text !== "") {
      try { scaleB = new Scale(parseScala(text).slice(1)); rerender(); } catch { /* status already set */ }
    }
  }
  // Import mode: nothing to reset; user must re-pick a file.
}
```

---

### WR-04: Period mismatch in scaleCompare (e.g. A=2/1 octave vs B=`bohlen-pierce-9` 3/1) is silent and produces nonsensical alignment

**File:** `src/components/scale-compare.ts:135-164`, `src/components/scale-compare.ts:369-387`
**Classification:** WARNING
**Issue:** `align()` matches each A interval to its nearest-cents B interval over the entire B range, even when B's period is structurally larger. With A = octave heptatonic (2/1 last) and B = `bohlen-pierce-9` (3/1 last, intervals up to ~1902¢), A's period 2/1 (1200¢) maps to B's `15/7` (1319.4¢, |Δ¢| ≈ 119) — meaningless musically, since A and B don't share an equivalence interval. The plot ranges over `Math.max(scaleA.period.cents, scaleB.period.cents)` so the X-axis runs to 1902¢, but A's data only populates [0, 1200]; the visualization is confusing.

The status region offers no warning. The summary's "Common subset" works correctly via BigInt equality (returns 0 in this case for typical scales), but the user has no signal that the comparison is structurally invalid.

**Fix:** When `!scaleA.period.equals(scaleB.period)`, post a status-region warning ("A and B have different periods; cents alignment is approximate.") and consider plotting only up to the smaller period or marking the X-axis discontinuity. Adding a regression test for this case (A=octave, B=Bohlen-Pierce → status text contains "different period") would lock in the contract.

---

### WR-05: Dead `clearTimeout(timer)` immediately after `let timer = null` in hash-write debounce

**File:** `src/index.md:136-148`, `src/pages/analysis.md:137-150`
**Classification:** WARNING
**Issue:** Both pages run a debounce cell of the form:
```ts
{
  let timer = null;
  const flush = () => { /* … */ };
  clearTimeout(timer);   // <-- dead: timer is null
  timer = setTimeout(flush, 300);
  invalidation.then(() => clearTimeout(timer));
}
```
The inline `clearTimeout(timer)` runs against `null` (a no-op). The actual debounce works only because Observable's `invalidation.then` cancels the PREVIOUS cell-run's timer before the current run's setTimeout is scheduled. The dead line implies a misunderstanding of the debounce mechanism; if a future maintainer adds another scheduler in this cell that returns the same `timer` handle, the dead clear becomes confusing.

**Fix:** Drop the dead line:
```ts
{
  const flush = () => { /* … */ };
  const timer = setTimeout(flush, 300);
  invalidation.then(() => clearTimeout(timer));
}
```

---

### WR-06: scaleCompare paste handler runs full parseScala on every keystroke

**File:** `src/components/scale-compare.ts:420-443`
**Classification:** WARNING
**Issue:** The paste textarea binds to `input` events. Every keystroke calls `parseScala(text)`, which walks the entire textarea content (up to 1 MB) to build a fresh `Interval[]`. For large pastes (many lines), the user observes UI lag. The pre-existing dashboard textarea has the same shape, but the new scale-compare paste is on the analysis page and adds a second instance running on every keystroke.

**Fix:** Debounce the paste handler at 200-300ms (matches the hash-write debounce cadence):
```ts
let pasteDebounce: ReturnType<typeof setTimeout> | null = null;
pasteTextarea.addEventListener("input", () => {
  if (pasteDebounce) clearTimeout(pasteDebounce);
  pasteDebounce = setTimeout(() => { /* parse + rerender */ }, 250);
});
```
Also worth adding `invalidation.then(() => clearTimeout(pasteDebounce))` via the existing `disposeScaleCompare` registry — small leak risk if the cell tears down while a debounce is pending.

---

### WR-07: scaleCompare with B period < A period: A intervals beyond B's period have nowhere meaningful to map

**File:** `src/components/scale-compare.ts:135-164`
**Classification:** WARNING
**Issue:** The `paste` handler at line 432-436 throws if `intervals.length < 2`, which prevents the empty case. But it allows pasting a scale where the LAST line is not 2/1 — for instance, a user pastes only `9/8`, parseScala returns `[1/1, 9/8]`, slicing gives `[9/8]`, `new Scale([9/8])` defaults `period = 9/8` (last interval). This passes the constructor's `period > 1/1` check (9/8 > 1/1). The user now has scaleB with period 9/8.

In `align()`, A's `2/1` (1200¢) maps to nearest B = `9/8` (203.91¢, |Δ¢| ≈ 996) — silly. The plot's X-axis is `Math.max(1200, 203.91) = 1200`, B's data only fills [0, 203.91]. No status warning.

This is closely related to WR-04 but distinct: the paste handler accepts inputs whose period is implicit and unintuitive. There's no UI signal that the user's paste was interpreted with period = the last line.

**Fix:** Surface period in the status region after a successful paste/import:
```ts
status.textContent = `Loaded ${intervals.length - 1} pitches; period = ${scaleB.period.fraction.toFraction()}.`;
```
And consider rejecting / warning when the paste's period is < the period of A (e.g. `if (scaleB.period.cents < scaleA.period.cents) status.textContent = "Warning: B's period (${…}) is smaller than A's";`).

---

## Out of scope / not flagged

- **Performance:** O(n²) `oddLimitApproximation` enumeration (`oddLimitCap=31` → ~250 iterations; bounded). Performance findings are out of scope per the Phase 4 review charter.
- **Test fixture mismatch with production scaleA** (independent of BL-01): the test files for `edoJitTable` and `scaleCompare` use hand-built scales without leading `1/1`, while production wires through `new Scale(parseScala(...))` which auto-prepends. For `edoJitTable` the discrepancy is harmless (1/1 contributes 0 to all error metrics). Recorded here as documentation for future test review.
- **`oddLimit ≤ 31` cap**, `replaceState` (not `pushState`), URL-safe Base64 alphabet, version-byte prefix, decoder is total, `Fraction` only from `fraction.js`, `moment-of-symmetry` package absent from `package.json`, `chainLoFor` lookup table for (3/2, 2/1), semi-convergents in `nearestMosSize`, three-layer purity (`src/lib/` has no DOM/audio), `.js` extension on `.ts` source imports — all verified compliant with phase invariants.
- **Phase 3 CR-02 panic-clear (Esc + dispose):** scaleCompare correctly registers a component-local keydown listener for `Escape` → `clearPendingAuditions()`, and `disposeScaleCompare(el)` removes it AND clears pending B-note timers. The page cell calls `disposeScaleCompare` from `invalidation.then(...)`. Tests 10b and 13 lock in both branches. Compliant.

---

_Reviewed: 2026-05-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
