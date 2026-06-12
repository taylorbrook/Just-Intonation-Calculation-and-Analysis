---
phase: 07-sonicweave-adapter-tempered-lattice-free-text
reviewed: 2026-06-12T04:42:12Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - package.json
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
  - src/lib/INVENTORY.md
  - src/lib/__tests__/fokker.test.ts
  - src/lib/__tests__/sonicweave.test.ts
  - src/lib/fokker.ts
  - src/lib/sonicweave.ts
  - src/pages/generate.md
  - src/styles.css
  - vitest.config.ts
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-06-12T04:42:12Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed the Phase-7 SonicWeave adapter (`src/lib/sonicweave.ts`), the Fokker
cardinality kernel (`src/lib/fokker.ts`), the four new widgets
(rank-2, well-temperament, Fokker, free-text), their tests, the `generate.md`
page wiring, the sonic-weave patch, and config/CSS changes. All 60 new tests
pass. The adapter's overall contract design (cap-first, never-throws,
isFractional discriminator, D-13 unison prepend) is sound, and the
well-temperament vectors check out against the published degree cents.

Two findings are confirmed-by-execution incorrect behavior:

1. The rank-2 widget's POTE/TE/CTE branch hardcodes generator `3/2`, so the
   Magic and Hanson presets (and any custom generator) silently produce a
   chain-of-fifths scale instead of the documented third-chain scale —
   verified empirically against `evaluateSource`.
2. The Fokker widget never re-renders the per-axis extent fields when basis
   chips are added or removed — verified with a DOM repro: adding basis `7`
   leaves the new axis with no Up/Down inputs (stuck at 0/0), and removing a
   chip leaves stale fields that write to the wrong axis.

A third notable defect: the adapter drops the sign of negative rationals
(fraction.js v5 stores sign in `f.s`, not `f.n`), so a free-text `-3/2` is
silently laundered into `3/2` — verified empirically.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: POTE/TE/CTE source hardcodes generator 3/2 — Magic and Hanson presets produce the wrong scale

**File:** `src/components/generate-rank2.ts:298-301`
**Issue:** `composeSource()` for the POTE/TE/CTE tunings always emits
`rank2(3/2, up, down)` regardless of the selected preset's generator or the
user's typed generator:

```ts
// POTE / TE / CTE — the two-line temper pattern (RESEARCH Pattern 2).
const seed = PRESETS[preset];
const comma = seed ? seed.comma : "81/80";
return `rank2(3/2, ${String(up)}, ${String(down)})\n${tuning}([${comma}])`;
```

The Magic preset is documented (line 90) as "generator ≈ 380.4¢ (major third
chain)" with `genN: 5, genD: 4`, and Hanson as a 6/5 minor-third chain — but
the composed source ignores `genN/genD`. Verified by direct evaluation:

- As composed (`rank2(3/2, 6, 3)` + `POTE([3125/3072])`):
  `200.6 299.1 401.2 499.7 601.8 700.3 900.9 999.4 1101.5 1200.0` — a
  tempered chain of fifths.
- With the preset's own generator (`rank2(5/4, 6, 3)` + `POTE([3125/3072])`):
  `59.8 320.2 380.1 439.9 700.3 760.1 819.9 1080.4 1140.2 1200.0` — the
  actual Magic third-chain scale.

The UI compounds this: when Magic is selected the Generator field displays
`5/4` while the rendered scale was built from `3/2`. The displayed parameters
and the produced scale disagree. The preset's `up`/`down` counts (chosen for
the third chain) are applied to a fifth chain, so the scale's mode/shape is
also wrong.
**Fix:**
```ts
const seed = PRESETS[preset];
const comma = seed ? seed.comma : "81/80";
const gen = `${String(genN)}/${String(genD)}`;
return `rank2(${gen}, ${String(up)}, ${String(down)})\n${tuning}([${comma}])`;
```
(And see WR-05 for the custom-preset comma fallback.)

### CR-02: Fokker basis-chip add/remove never re-renders extent fields — new axes are uneditable and stale fields write to the wrong axis

**File:** `src/components/generate-fokker.ts:318-341` (chip handlers), `369-394` (extent-field rendering)
**Issue:** The per-axis Up/Down extent fields are created only inside
`renderParams()`, but the chip Add and Remove handlers call `renderChips()` +
`rebuild()` only — `renderParams()` is never invoked. Confirmed with a DOM
repro (happy-dom): the default widget shows 4 extent inputs (2 axes); after
typing `7` into the basis input and clicking Add, the chip appears and the
readout updates, but the number of extent inputs remains 4. Consequences:

- A newly added axis has no Up/Down controls; its extents are frozen at the
  `?? 0` defaults, so the new basis interval can never contribute more than
  one step — the user cannot actually use the axis they added.
- Removing a chip shifts `basisGenerators`/`ups`/`downs` (the `setList`
  callback re-maps by index) but leaves the old extent fields in the DOM with
  their old labels and captured indices. Editing "Up (prime 5)" after
  removing the prime-3 chip writes `ups[1]`, which now belongs to no axis (or
  to a different generator), so edits are silently dropped or applied to the
  wrong axis while the label claims otherwise.

**Fix:** Re-render the extent fields whenever the basis list changes. The
simplest structure: split extent-cell rendering into its own
`renderExtents()` host element that `renderParams()` mounts, and call
`renderExtents()` from the basis chip input's `setList` path (or pass an
`onListChanged` callback into `makeChipInput` that the basis instance binds
to `renderParams`). Note `renderParams()` as-is recreates the chip input too,
which would drop the in-progress input value — re-rendering just the extent
host avoids that.

## Warnings

### WR-01: Adapter drops the sign of negative rationals — `-3/2` is silently laundered to `3/2`

**File:** `src/lib/sonicweave.ts:121-122`
**Issue:** fraction.js v5 stores the numerator `n` and denominator `d` as
non-negative BigInts with the sign in `f.s`. The R-01 round-trip
`new Interval(`${String(f.n)}/${String(f.d)}`)` therefore discards the sign.
Verified: evaluating the free-text program `-3/2\n2/1` yields
`toFraction()` with `n=3, d=2` (`isFractional() === true`), and the adapter
maps it to kernel `3/2`. A user's negative interval is silently flipped
positive — wrong output with no error, inconsistent with `parseScala`, which
fails closed on negative ratios (Pitfall #6 per INVENTORY.md).
**Fix:**
```ts
const f = iv.toFraction();
if (f.s < 0n || f.n === 0n) {
  return { scale: null, tempered, error: "Scale contains a non-positive interval." };
}
out.push(new Interval(`${String(f.n)}/${String(f.d)}`));
```

### WR-02: Adapter accepts the zero interval — `0/1` produces cents of −Infinity

**File:** `src/lib/sonicweave.ts:118-122`
**Issue:** A free-text program containing `0/1` evaluates cleanly
(`isFractional() === true`, `n=0, d=1`) and the adapter builds
`new Interval("0/1")`. The kernel `Interval.cents` getter computes
`1200 * Math.log2(0)` = `-Infinity`, which flows into the scale table
(rendering `-Infinity` / `NaN` cells) and into `playScale` as a 0 Hz
frequency (only saved by the synth's 20 Hz clamp). The adapter's contract is
"all failure modes return a structured error" — a degenerate interval should
be one of them.
**Fix:** Covered by the same guard as WR-01 (`f.n === 0n` → structured error).

### WR-03: Basis chip Add uses the wrong cap constant — 7th/8th basis chips silently vanish

**File:** `src/components/generate-fokker.ts:335` (cap check), `357` (silent slice)
**Issue:** `makeChipInput`'s Add handler enforces `next.length >= MAX_COMMAS`
(8) for both chip inputs, but the basis `setList` callback then does
`.slice(0, MAX_BASIS)` (6). Adding a 7th basis interval passes the Add
handler's cap, gets pushed, and is then silently truncated by the slice — the
chip never appears, the input is cleared, and no status message explains why.
The user's action is swallowed without feedback, and the two caps disagree
about which limit applies.
**Fix:** Pass the cap as a parameter to `makeChipInput` (6 for basis, 8 for
commas), and write a status message when the cap is hit instead of returning
silently:
```ts
if (next.length >= cap) {
  status.textContent = `At most ${String(cap)} ${labelText.toLowerCase()}.`;
  return;
}
```

### WR-04: `parseRatio` parses unbounded digit strings with `parseInt` — precision loss past 2^53 silently changes the comma

**File:** `src/components/generate-fokker.ts:101-109`
**Issue:** Comma chips are normalized via `parseInt(m[1]!, 10)` /
`parseInt(m[2]!, 10)` and re-serialized from those Numbers. For a comma whose
numerator or denominator exceeds 2^53 (the project explicitly supports
arbitrary ratios — "no prime-limit ceiling", and CLAUDE.md disqualifies
Number-backed ratio paths), the parsed value is rounded and the stored chip
is a *different ratio* than the user typed, which then feeds `toMonzo` and
the determinant. Mercator-comma-scale inputs (the repo's own COMMAS table
includes a 25-digit ratio) are silently corrupted rather than rejected.
**Fix:** Validate/normalize with BigInt:
```ts
const n = BigInt(m[1]!);
const d = BigInt(m[2]!);
if (n < 1n || d < 1n) return null;
return `${String(n)}/${String(d)}`;
```

### WR-05: Custom preset + POTE/TE/CTE silently tempers by the meantone comma 81/80

**File:** `src/components/generate-rank2.ts:299-300`
**Issue:** `const comma = seed ? seed.comma : "81/80"` — when
`preset === "custom"` (no entry in `PRESETS`), selecting POTE/TE/CTE
silently optimizes against the syntonic comma. Combined with CR-01's
hardcoded `3/2`, a user who typed a custom generator and picked POTE gets a
POTE meantone scale that has nothing to do with their inputs, with no status
message or any UI hint that the comma was assumed. There is no comma input in
this widget, so the user cannot even see what was tempered out.
**Fix:** Either surface it (`status.textContent = "Custom + POTE/TE/CTE
tempers the syntonic comma 81/80; use the free-text method for other
commas."`) or disable the POTE/TE/CTE options while `preset === "custom"`.

### WR-06: Rank-2 generator inputs accept zero/negative values — negative generators are then sign-laundered

**File:** `src/components/generate-rank2.ts:114-119` (`parseIntOrNull`), `215-231` (gen inputs)
**Issue:** Unlike the Fokker widget's `parsePositiveInt`, the rank-2
generator fields use `parseIntOrNull`, which accepts `0` and negatives; the
`min="1"` attribute does not prevent typed input. `genD = 0` produces a
`3/0` source whose adapter error is surfaced (acceptable), but a *negative*
generator (e.g. `-3`/`2`) composes `rank2(-3/2, …)`, which SonicWeave
evaluates, and the adapter's sign-dropping (WR-01) then renders it as a
positive-ratio scale — wrong output, no error. Fixing WR-01 turns this into a
raw adapter error; better to validate at the field.
**Fix:** Clamp/validate in `onGenEdit`: reject `n < 1 || d < 1` with a status
message before composing, mirroring `parsePositiveInt`.

## Info

### IN-01: Dead cents-generator path in generate-rank2

**File:** `src/components/generate-rank2.ts:135-137, 291`
**Issue:** `genIsCents` is initialized `false` and only ever assigned `false`
(lines 339, 371); `genCents` is a `const 700` marked "reserved". The ternary
`genIsCents ? String(genCents) : …` at line 291 is unreachable dead code that
implies a typed-cents feature that does not exist.
**Fix:** Delete `genIsCents`/`genCents` and the ternary until the cents
generator path is actually built.

### IN-02: Comma-mode enumeration is an all-upward HNF box, not the classic centered block

**File:** `src/components/generate-fokker.ts:121-144`
**Issue:** `commaToParallelotopeSource` sets `downs` to all zeros and uses the
HNF diagonal for `ups`. This is a mathematically valid transversal of the
comma lattice (cardinality is exactly |det|), but it is *a* periodicity
block, not the textbook centered one — e.g. for 81/80 + 128/125 it contains
135/128 where the canonical block contains 16/15. The widget's UI copy and
docs say "the classic 12-note block", which may surprise users comparing
against published Fokker blocks.
**Fix:** Document the convention in the widget copy (e.g. "block notes are
enumerated upward from 1/1"), or center the extents
(`up = floor((h-1)/2)`, `down = ceil((h-1)/2)`) if the classic block is
intended.

### IN-03: Unreachable `!first` branch in the adapter

**File:** `src/lib/sonicweave.ts:138-141`
**Issue:** `out.length === 0` returns at line 132, so `out[0]` is always
defined; the `!first ||` guard is dead. Harmless, but it implies a reachable
empty case that the earlier guard already eliminated.
**Fix:** `if (!out[0]!.equals(UNISON)) out.unshift(new Interval("1/1"));` (or
keep the non-null assertion style used elsewhere in the file).

### IN-04: Basis chips accept `1` and composite integers

**File:** `src/components/generate-fokker.ts:87-94`
**Issue:** `parsePositiveInt` admits `1` (a degenerate axis — every step is
the unison, producing duplicate 1/1 entries in the parallelotope) and
composite integers (e.g. `9`, `15`), while the extent labels say
"Up (prime N)" and the `PRIMES` comment frames axes as primes. No crash, but
a `1` axis silently inflates the "→ N notes" readout (∏(u+d+1)) above the
actual distinct-note count.
**Fix:** Reject `1` in the basis validator (`n < 2 → null`), and either
relabel "prime" → "basis" or validate primality.

---

_Reviewed: 2026-06-12T04:42:12Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
