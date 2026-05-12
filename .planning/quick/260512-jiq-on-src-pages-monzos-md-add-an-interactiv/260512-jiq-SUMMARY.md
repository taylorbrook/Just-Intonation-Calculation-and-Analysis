---
quick_id: 260512-jiq
mode: quick
status: complete
completed: 2026-05-12
duration: ~25 minutes
files_changed:
  - src/components/monzo-builder.ts (NEW — 261 lines)
  - src/components/monzo-builder.css (NEW — 102 lines)
  - src/components/__tests__/monzo-builder.test.ts (NEW — 117 lines)
  - src/styles.css (+1 line — @import)
  - src/pages/monzos.md (+82 lines — builder section + scatter section + Further reading)
commits:
  - 0e9504b feat(quick-260512-jiq): interactive monzo builder + 3-5 plane scatter + Further reading on monzos page
---

# Quick task 260512-jiq — Interactive Monzo Builder on `src/pages/monzos.md`

## One-liner

Closure-component monzo builder with bidirectional sync between 5 prime-exponent
inputs (2/3/5/7/11, range [-12, 12]) and a ratio-string field, plus a 3-5 plane
`Plot.dot` scatter of the four worked examples and a `## Further reading`
section linking the Xenharmonic Wiki monzo page.

## What shipped

### `src/components/monzo-builder.ts` (NEW)

Pattern 2 factory `monzoBuilder(synth: SynthHandle, opts?: MonzoBuilderOpts) => HTMLElement`.
Mirrors `mos-builder.ts` closure-component shape exactly. No module-level state.

Closure-local canonical state: `let exponents: number[] = [0, 0, 0, 0, 0]` over
primes 2/3/5/7/11. Two render entry points:

- `applyExponents()` — fired from exponent-input listeners. Builds
  `Interval.fromMonzo([...exponents])`, writes `ratioInput.value = iv.toString()`
  **only if** `document.activeElement !== ratioInput` (Pitfall #5 — don't
  canonicalise the ratio field out from under the user mid-typing), then
  re-renders the display row.
- `applyRatio()` — fired from the ratio-input listener. `try { new Interval(raw) }`
  on transient invalid input (e.g. `"3/"`, `""`) — preserves prior exponent state
  and surfaces `err.message` via `errHost.textContent`. On success: detects
  primes above 11 via `iv.monzo.slice(5).some((x) => x !== 0)`; range-checks
  each padded slot against `[-12, 12]`; only then writes back into the five
  exponent inputs.

Display surfaces (all re-rendered per state change, all via `textContent` /
`replaceChildren` — never `innerHTML`):

1. **Bra-ket** — Unicode `[ 0  0  0  0  0 ⟩` on a `<code>` with `tabular-nums`
   (KaTeX would re-typeset on every keystroke and flicker; Unicode is fine).
2. **Ratio pill** — existing `ratioPill(iv, { showCents: false })`.
3. **Cents** — `(~ddd.dd¢)` to 2 d.p.
4. **▶ button** — existing `playInterval(iv, synth, { label: false, baseHz })`.
   Each call returns a fresh button; the discarded one GCs with its click
   listener — no leak. Synth handle is captured but the AudioContext is owned
   by the page-level cell (Pattern 4) and is NOT recreated.
5. **Error region** — `role="status" aria-live="polite"`. textContent only.

Two-way sync correctness: programmatic `.value = ...` writes do NOT fire
`input` events, so the 5 exponent listeners + 1 ratio listener cannot enter a
feedback loop. The `document.activeElement` gate is the small additional
courtesy that prevents `4/2` → `2` canonicalisation from clobbering the user's
literal keystrokes in the ratio field.

Empty-input rule: `parseInt("", 10)` returns `NaN`; `clampExponent` returns
`null` in that case, and the listener `return`s without touching state — so
mid-typing empties preserve the prior canonical value rather than coercing to
`0`. Mirrors the pattern from `mos-builder.ts:53-59`.

### `src/components/monzo-builder.css` (NEW)

Minimal layout following the `mos-builder.css` convention: flex column for the
section, flex row for exponent + ratio + display + error regions, prime-label
above each exponent input as a small monospace cap, tabular-nums on the bra-ket
`<code>`. Token vocabulary matches `mos-builder.css` exactly
(`--theme-foreground`, `--theme-foreground-alt`, `--theme-foreground-focus`,
`--theme-background`, `--monospace`, `--sans-serif`). Loaded via a one-line
`@import` in `src/styles.css`.

### `src/components/__tests__/monzo-builder.test.ts` (NEW — 9 happy-dom tests)

1. Factory returns an `HTMLElement` with class `monzo-builder`.
2. Default render shows 5 number inputs named `exponent-2/3/5/7/11`, each
   value `"0"`, `min="-12"`, `max="12"`.
3. Default ratio input named `ratio` with value `"1"`.
4. Typing an exponent (3-prime → 1) updates the ratio input to `"3"` and the
   bra-ket display to `"[ 0  1  0  0  0 ⟩"`.
5. Typing `"5/4"` into the ratio input updates exponents to
   `[-2, 0, 1, 0, 0]`.
6. Typing `"13/12"` surfaces a primes-above-11 error and **leaves the
   pre-seeded exponent state unchanged**.
7. Clearing an exponent input (empty string) preserves the prior ratio
   (does NOT coerce to 0).
8. Bra-ket textContent matches the Unicode `[ a  b  c  d  e ⟩` shape.
9. Ratio pill, cents readout (`~0.00¢`), and ▶ play button all render.

### `src/styles.css` (+1)

One-line `@import "./components/monzo-builder.css";` appended to the
component-CSS aggregation block.

### `src/pages/monzos.md` (+82)

Three additive sections, no refactor of existing prose / imports / cells:

1. **Two new imports** at the top of the imports block:
   `import * as Plot from "npm:@observablehq/plot";` and
   `import { monzoBuilder } from "../components/monzo-builder.js";`.

2. **`## Monzo builder` section** between the closing prose of `## Worked
   examples` and the existing `Round-trip check` cell. One orienting sentence,
   one reactive cell `display(monzoBuilder(synth))`, one closing sentence
   about the prime-11 ceiling.

3. **`## Worked examples — projected to the 3-5 plane` section** between the
   builder and the round-trip cell. Prose explains that x = prime-3 exponent
   and y = prime-5 exponent, and explicitly acknowledges the 3/2 and 7/6
   collision at `(-1, 0)`: *"they differ only in their 7-prime coordinate,
   which this projection collapses to zero. The overlap is real, not a
   rendering bug."* The `Plot.plot` cell uses `iv.monzo[1] ?? 0` and
   `iv.monzo[2] ?? 0` against the four existing `Interval` bindings (`fifth`,
   `majorThird`, `syntonic`, `septimalSubminorThird`) — no new `Interval`
   allocations and no hardcoded coordinate literals. Domain `x: [-5, 5]`,
   `y: [-2, 2]` chosen from the syntonic comma's `[-4, 4, -1]` extremes plus
   a touch of headroom.

4. **`## Further reading` section** appended as the final section, matching
   the `schisma.md` / `pythagorean-comma.md` / `edo-approximation.md` format
   exactly (h2, dash-bullet, link with em-dash + two-sentence description):

   > - [Monzo on the Xenharmonic Wiki](https://en.xen.wiki/w/Monzo) —
   >   community-curated reference for the prime-factor vector notation.
   >   Covers the bra-ket form, monzo arithmetic, prime limits, and the
   >   relationship to vals (the dual lattice used in regular-temperament
   >   theory).

Nothing else on the page was touched — the existing four Interval bindings,
the static KaTeX bra-kets, the `Round-trip check` cell, the `## Monzo addition
= ratio multiplication` section, and the `## See also` section all remain
verbatim.

## Verification

| Gate | Result |
|------|--------|
| `npm run lint:types` (tsc --noEmit) | clean (exit 0) |
| `npm test` (vitest) | **302/302 across 24 files** (293 baseline + 9 new monzo-builder tests) |
| `npm run build` (observable build) | clean — 79 links validated; monzos page bundle 11kB → 26kB and 391kB → 918kB (matches Plot-using page footprint: comma-pump 912kB, schisma 916kB, pythagorean-comma 920kB) |
| `npx prettier --check` on all modified files | clean |
| `npx eslint` on new files | clean |
| `grep 'innerHTML' src/components/monzo-builder.ts src/pages/monzos.md` | 0 matches |
| `grep '## Monzo builder' src/pages/monzos.md` | line 86 |
| `grep '## Further reading' src/pages/monzos.md` | line 217 |
| `grep 'en.xen.wiki/w/Monzo' src/pages/monzos.md` | line 219 |

## Deviations from plan

None of consequence. Three small implementation-detail choices made during
execution, all in line with the plan's intent:

1. **Type-safety glue.** TypeScript's `noUncheckedIndexedAccess` flagged the
   array reads `PRIME_LABELS[i]`, `padded[i]`, and `exponentInputs[i]` as
   possibly `undefined`. Used the non-null assertion `!` where the loop
   bounds guarantee in-range access. (Could have done a runtime guard but
   that would be ceremony — the loops are `for (let i = 0; i < SLOT_COUNT;
   i++)` and `SLOT_COUNT = PRIME_LABELS.length`, so the access is provably
   safe.)
2. **Loop-variable capture.** The exponent-input event listener captures `i`
   via a local `const slot = i;` before the closure to make the index-binding
   intent explicit, even though `let i` inside a `for` already scopes per
   iteration.
3. **Cents precision.** Plan said `iv.cents.toFixed(2)` — kept this rather
   than the page's surrounding 1-d.p. convention (the prose is static; the
   builder is live-updating and benefits from a tighter readout).

No threat-model surface added — kernel surface is unchanged; new component
follows the same `textContent` / `replaceChildren` discipline as every other
component in `src/components/`. No new dependencies. The optional `INVENTORY.md`
row for `monzoBuilder` was not added (the team convention appears to be
INVENTORY rows are written during phased plans, not quick tasks — recent
quick-task commits ilb / hdv / fxk also did not add INVENTORY rows).

## Self-Check: PASSED

- src/components/monzo-builder.ts — FOUND
- src/components/monzo-builder.css — FOUND
- src/components/__tests__/monzo-builder.test.ts — FOUND
- src/pages/monzos.md (modified) — FOUND
- src/styles.css (modified) — FOUND
- commit 0e9504b — FOUND in `git log --oneline --all`
