---
phase: quick-260615-jtm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/interval.ts
  - src/lib/scala.ts
  - src/lib/__tests__/scala.test.ts
autonomous: true
requirements:
  - QUICK-260615-jtm
must_haves:
  truths:
    - "A cents-derived/EDO scale exports via writeScl as dotted cents lines (e.g. \"408.000000\"), NOT as invented exact ratios."
    - "A ratio/monzo-defined scale still exports as n/d ratio lines (no regression)."
    - "parseScl(writeScl(s)) on a cents-source scale re-detects cents (round-trips through the cents path, not a laundered ratio)."
    - "Provenance is per-interval: a mixed scale emits cents lines for its cents degrees and ratio lines for its ratio degrees in the same file."
    - "Every existing `new Interval(...)` call site stays valid — provenance defaults to \"ratio\"/exact."
  artifacts:
    - path: "src/lib/interval.ts"
      provides: "Interval carries an immutable readonly `source: \"ratio\" | \"cents\"` provenance flag, defaulting to \"ratio\"."
      contains: "source"
    - path: "src/lib/scala.ts"
      provides: "parsePitchToken tags the dotted-cents path as cents-source; writeScl serializes per-interval provenance (cents → iv.cents.toFixed(6), exact → formatRatio)."
      contains: "toFixed(6)"
    - path: "src/lib/__tests__/scala.test.ts"
      provides: "Round-trip test proving a cents-derived scale exports as dotted cents, not laundered ratios."
      contains: "toFixed"
  key_links:
    - from: "src/lib/scala.ts parsePitchToken (cents path)"
      to: "Interval constructor source param"
      via: "new Interval(ratioFloat, \"cents\")"
      pattern: "new Interval\\([^)]*\"cents\"\\)"
    - from: "src/lib/scala.ts writeScl"
      to: "iv.source"
      via: "per-interval branch on provenance"
      pattern: "iv\\.source"
---

<objective>
Fix `writeScl` laundering tempered/cents-derived scales into fake "exact" ratios (finding #1, src/lib/scala.ts).

Today `writeScl` serializes EVERY `Interval` as a ratio via `formatRatio` (`${n}/${d}`), even when the Interval was derived from a cents value. A dotted-cents pitch (e.g. `408.0`) is converted to a float-derived `Fraction` in `parsePitchToken`; emitting that as `${n}/${d}` launders a tempered pitch into a bogus high-limit JI ratio. The header comments at scala.ts:17-23 and 138-144 document this as a known limitation.

Fix: track ratio-vs-cents provenance on `Interval` (immutable, set once at construction per D-24), set it at parse time in `parsePitchToken` (ratio/monzo token → `"ratio"`, dotted-cents token → `"cents"`), and have `writeScl` emit `iv.cents.toFixed(6)` for cents-source degrees — mirroring `serializeDegrees` in src/lib/scala-archive.ts — while keeping `formatRatio` for exact degrees. Provenance is PER-INTERVAL (strictly better than scala-archive's scale-wide `tempered` flag).

Purpose: a cents/EDO scale must export as cents, never as invented ratios. This is the difference between a correct and a silently-wrong .scl export.
Output: provenance-aware `Interval`, provenance-setting `parsePitchToken`, provenance-aware `writeScl`, and a round-trip test pinning the behavior.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

# The exact precedent to mirror (do NOT modify this file — read it for the pattern):
# src/lib/scala-archive.ts serializeDegrees (lines 97-107):
#   tempered ? iv.cents.toFixed(4) : `${iv.fraction.n}/${iv.fraction.d}`
# Here we use per-interval provenance instead of a scale-wide `tempered` flag,
# and toFixed(6) (the user-specified precision) instead of 4.

<interfaces>
<!-- Key contracts the executor needs. Extracted from the codebase. Use directly — no exploration needed. -->

From src/lib/interval.ts (CURRENT — you will extend the constructor):
```typescript
export type FractionInput =
  | Fraction | string | bigint | number
  | { n: bigint; d: bigint } | { n: number; d: number };

export class Interval {
  readonly fraction: Fraction;
  constructor(input: FractionInput) { ... }      // ← add optional source param
  static fromMonzo(monzo: number[]): Interval { ... }
  get cents(): number { ... }                    // 1200 * Math.log2(Number(fraction.valueOf()))
  get centsFrom12tet(): number { ... }
  mul/div/inv/octaveReduce/equals/toString ...   // all return new Interval (default source)
}
```

From src/lib/scala.ts (CURRENT — the cents path to tag, and writeScl to branch):
```typescript
// parsePitchToken cents path (line 286-287):
const ratioFloat = centsToValue(cents);
return new Interval(ratioFloat);              // ← tag as "cents"

// writeScl loop (line 158-160):
for (const iv of intervals) {
  lines.push(` ${formatRatio(iv)}`);          // ← branch on iv.source
}

function formatRatio(iv: Interval): string {
  return `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add immutable per-interval provenance to Interval</name>
  <files>src/lib/interval.ts</files>
  <behavior>
    - new Interval("5/4").source === "ratio" (default — backward-compatible; bare construction unchanged)
    - new Interval(1.25, "cents").source === "cents" (explicit cents-source tag)
    - Interval.fromMonzo([-2,0,1]).source === "ratio" (monzo is exact by construction)
    - The flag is readonly: it is set once in the constructor and never reassigned (D-24 immutability)
    - .cents, .fraction, .equals, mul/div/inv/octaveReduce are UNCHANGED in value (provenance does not affect math or equality)
  </behavior>
  <action>
    Add an optional second constructor parameter `source: IntervalSource = "ratio"` where `IntervalSource = "ratio" | "cents"` (export the type alias). Store it as `readonly source: IntervalSource` set once in the constructor. Default MUST be "ratio" so all existing `new Interval(...)` call sites (parseScala's `new Interval("1/1")`, scale.ts arithmetic, jiSubsetOfEdo, every test) remain valid with zero changes — verify by NOT touching their call sites.

    `static fromMonzo` constructs an exact interval — it stays "ratio" (do not add a param; monzo is exact by construction).

    Do NOT propagate source through mul/div/inv/octaveReduce — those construct NEW Intervals and correctly default to "ratio" (a transposed/reduced cents pitch is no longer the same pitch; threading provenance through arithmetic is explicitly OUT OF SCOPE for this fix). Leave those methods unchanged. The lazy `#cents` cache and the `cents` getter are unchanged — `source` is metadata only and does not affect the cents computation.

    R-01/D-24: this is metadata on the immutable Interval; cents remains a display projection derived from the BigInt Fraction. Do not import Fraction from xen-dev-utils.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx tsc --noEmit && npx vitest run src/lib/__tests__/scala.test.ts src/lib/__tests__/interval.test.ts 2>/dev/null || npx vitest run src/lib/__tests__</automated>
  </verify>
  <done>Interval has a readonly `source: "ratio" | "cents"` (exported type), default "ratio"; `tsc --noEmit` passes; existing Interval/scale/scala tests still green (no call-site breakage).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Set cents provenance in parsePitchToken and make writeScl provenance-aware</name>
  <files>src/lib/scala.ts</files>
  <behavior>
    - parsePitchToken("408.0").source === "cents" (dotted-cents path tags cents)
    - parsePitchToken("5/4").source === "ratio" (ratio path stays exact)
    - parsePitchToken("[-2 0 1>").source === "ratio" (monzo via fromMonzo stays exact)
    - writeScl on an all-cents Scale emits each cents degree as iv.cents.toFixed(6) (a string containing "." so re-parse hits the cents path, D-19)
    - writeScl on an all-ratio Scale is byte-identical to before (formatRatio per degree — no regression)
    - writeScl on a MIXED scale emits cents lines for cents degrees and n/d lines for ratio degrees in the same file (per-interval, not scale-wide)
    - The leading-1/1 strip (D-13) and the period line (last interval, D-14) still work, each line honoring ITS OWN provenance
  </behavior>
  <action>
    In `parsePitchToken`, the dotted-cents branch (currently `const ratioFloat = centsToValue(cents); return new Interval(ratioFloat);`): tag as cents → `return new Interval(centsToValue(cents), "cents");`. The interval STILL stores the float-derived Fraction so `.cents` recomputes correctly and `.equals`/dedupe keep working — only serialization changes. Leave the ratio branch and the monzo branch (`Interval.fromMonzo`) untagged (they default to "ratio").

    In `writeScl`, replace the unconditional `formatRatio(iv)` in the loop with a per-interval branch mirroring serializeDegrees in scala-archive.ts:
      - `iv.source === "cents"` → ` ${iv.cents.toFixed(6)}` (carries a "." so the receiver's D-19 cents-detection fires)
      - otherwise → ` ${formatRatio(iv)}`
    Extract a small `formatPitch(iv)` helper (next to formatRatio) so the branch is named and testable; writeScl calls `formatPitch`. Do NOT introduce a scale-wide tempered flag — provenance is per-interval (strictly better than scala-archive). Keep formatRatio as-is for the exact path.

    Precision caveat to document in a comment: the cents path is float→Fraction→float (parse stores centsToValue(cents); writeScl re-derives iv.cents = 1200*log2(...)). This is deterministic for a given input but not bit-exact to the typed string — toFixed(6) of the recomputed cents is acceptably close (well within audible tolerance) and the dotted form round-trips through the cents path. Note this mirrors scala-archive's cents-of-record discipline.

    Update the now-stale header comments at scala.ts:17-23 and 138-144 that claim "the kernel does not currently track source provenance" / "always emits ratios" — replace with the new behavior: provenance is tracked per-interval at parse time; writeScl emits cents for cents-source degrees and ratios for exact degrees.

    SCOPE BOUNDARY (state in a comment so the verifier doesn't flag it): only the parse-time path (parsePitchToken) sets provenance. Generator paths (jiSubsetOfEdo in scale.ts, and any all-cents generator) are NOT in scope — jiSubsetOfEdo intentionally produces approximated EXACT ratios via approximatePrimeLimit, so "ratio" is correct for it. Derived Scale ops (rotate/reduce/dedupe/transpose) lose provenance by design (new pitch ≠ same pitch). Threading provenance through arithmetic or generators is a documented follow-up, NOT this fix.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx tsc --noEmit && npx vitest run src/lib/__tests__/scala.test.ts</automated>
  </verify>
  <done>parsePitchToken tags the cents path "cents"; writeScl emits dotted cents (toFixed(6)) for cents-source degrees and n/d for exact degrees, per-interval; all-ratio output unchanged (existing writeScl + golden round-trip tests still green); stale header comments updated; tsc passes.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Pin the fix with a cents-provenance round-trip test</name>
  <files>src/lib/__tests__/scala.test.ts</files>
  <behavior>
    - A cents-derived scale (parsed from F02-cents-only.scl, or built by tagging intervals "cents") exported via writeScl: every non-header pitch line matches /\d+\.\d{6}/ (dotted cents) and NONE is a laundered fake ratio like "415363.../329308..." (no n/d for the cents degrees)
    - parseScl(writeScl(centsScale)) re-detects the cents path: the reparsed cents-source intervals are still cents-source (source === "cents") and their .cents are close (~6dp tolerance) to the originals
    - An all-ratio scale exported via writeScl still emits n/d lines and NO dotted-cents lines (regression guard — the fix is per-interval, not blanket)
    - A mixed scale (F03-mixed-ratio-cents.scl) emits BOTH: dotted cents for its cents degree(s) and n/d for its ratio degrees, in the same file
  </behavior>
  <action>
    Add a new `describe("writeScl cents provenance (finding #1)")` block to scala.test.ts. Use the existing F02-cents-only.scl and F03-mixed-ratio-cents.scl fixtures (already in the fixtures dir) via the existing `readFixture` helper, and/or construct cents-source intervals directly with `new Interval(centsToValue(c), "cents")` (import centsToValue from "xen-dev-utils" as the lib does, OR build the scale by parsing the fixture).

    Assertions:
      1. Cents export: `writeScl(new Scale(parseScl(readFixture("F02-cents-only.scl")).intervals))` — split the output into pitch lines (filter out `!` comments, the description line, and the bare-integer count line, mirroring the existing writeScl test's pitch-line filter). Assert EVERY pitch line matches /^\s*-?\d*\.\d{6}\s*$/ (dotted, 6-decimal cents) and assert the output does NOT contain a multi-digit fake ratio for the cents degrees (e.g. expect(out).not.toMatch(/\d{4,}\/\d{4,}/) — a laundered high-limit ratio).
      2. Round-trip cents detection: `const reparsed = parseScl(writeScl(new Scale(centsScale.intervals)))` — assert the non-unison reparsed intervals have `source === "cents"` and `.cents` toBeCloseTo the originals (2-3 dp tolerance; document the float caveat inline).
      3. Regression — ratio scale stays ratios: build an all-ratio Scale (e.g. 1/1, 9/8, 5/4, 3/2, 2/1), writeScl, assert output contains "9/8" and "3/2" and does NOT match /\d+\.\d{6}/ (no dotted cents leaked in).
      4. Mixed: `writeScl(new Scale(parseScl(readFixture("F03-mixed-ratio-cents.scl")).intervals))` — assert the output contains at least one /\d+\.\d{6}/ line AND at least one /\d+\/\d+/ ratio line.

    Keep tests deterministic and DOM-free (Vitest, node env) consistent with the existing file.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx vitest run src/lib/__tests__/scala.test.ts</automated>
  </verify>
  <done>New cents-provenance describe block passes: cents scale exports as dotted cents (no laundered ratios), round-trip re-detects cents, ratio scale stays ratios, mixed scale emits both. Full src/lib/__tests__ suite still green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| .scl text → parseScl/parsePitchToken | Untrusted file/textarea input crosses into the kernel (already hardened: 1MB cap, monzo caps, negative/zero-ratio + out-of-range-cents rejection). |
| Scale → writeScl → downloaded .scl | Kernel state crosses out to a file the user (or another tool) consumes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-jtm-01 | Tampering (data integrity) | writeScl serialization | mitigate | THE BUG: cents-source pitches laundered into fake exact ratios corrupts the exported scale's meaning. Fix emits cents-of-record per provenance; round-trip test pins it. |
| T-jtm-02 | Information disclosure / correctness | Interval.source default | accept | Default "ratio" is correct for all exact-construction paths; a generator that should be "cents" but isn't merely falls back to the prior (ratio) serialization — no new corruption beyond the documented out-of-scope follow-up. |
| T-jtm-03 | Denial of service | new toFixed(6) path | accept | No new external input parsed; toFixed on an already-bounded, validated cents value (MAX_ABS_CENTS guard upstream). No unbounded work introduced. |
| T-jtm-SC | Tampering | npm/pip/cargo installs | mitigate | No new dependencies installed; uses existing `xen-dev-utils` (centsToValue) and `fraction.js` already vetted in the stack. No package legitimacy gate needed. |
</threat_model>

<verification>
- `npx tsc --noEmit` passes (no call-site breakage from the new constructor param).
- `npx vitest run src/lib/__tests__` — full lib suite green, including the existing writeScl + golden round-trip tests (no regression) and the new cents-provenance block.
- Manual grep sanity: `grep -n 'iv.source' src/lib/scala.ts` shows the per-interval branch; `grep -n '"cents"' src/lib/scala.ts` shows the parsePitchToken tag; the stale "does not currently track source provenance" comment is gone.
</verification>

<success_criteria>
- A cents-derived/EDO scale exports through writeScl as dotted cents lines (toFixed(6)), NOT invented ratios.
- A ratio/monzo scale still exports as n/d (byte-compatible with prior behavior; golden round-trips unchanged).
- Mixed scales emit per-interval: cents for cents degrees, ratios for ratio degrees, same file.
- All existing `new Interval(...)` call sites remain valid (default "ratio"); D-24 immutability honored (source set once, readonly); R-01 honored (cents stays a display projection; no xen-dev-utils Fraction).
- New round-trip test proves cents export + cents re-detection and the ratio/mixed regression guards.
</success_criteria>

<output>
Create `.planning/quick/260615-jtm-fix-writescl-laundering-tempered-cents-s/260615-jtm-SUMMARY.md` when done.
</output>
