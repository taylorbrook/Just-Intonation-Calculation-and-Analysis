---
quick_id: 260512-jiq
mode: quick
goal: >
  Add an interactive Monzo builder to src/pages/monzos.md with bidirectional
  sync between five prime-exponent inputs (primes 2/3/5/7/11, range [-12,12])
  and a ratio-string input, live-displaying the bra-ket form, ratioPill, cents,
  and a ▶ play button. Below the builder, render a small Plot.dot scatter of
  the four worked examples on (prime-3, prime-5) axes. Append a `## Further
  reading` section linking en.xen.wiki/w/Monzo. BigInt-Fraction stays the
  source of truth — cents derived only at the display boundary.
files_modified:
  - src/components/monzo-builder.ts        # NEW — closure-component
  - src/pages/monzos.md                    # EDIT — insert builder + scatter + Further reading
  - src/styles.css                         # EDIT — @import monzo-builder.css
  - src/components/monzo-builder.css       # NEW — minimal layout (mirrors mos-builder.css scoping)
success_criteria:
  - npm run typecheck (tsc --noEmit) exits 0
  - npm test (vitest) all green (293/293 baseline preserved; if a builder spec is added, it must pass)
  - npm run build (observable build) exits 0, no broken links
  - In dev: typing into a prime-exponent input updates ratioPill + bra-ket + cents + ▶ button live
  - In dev: typing "5/4" into the ratio input updates the five exponent inputs to [-2, 0, 1, 0, 0]
  - Ratio "13/12" surfaces an inline error "Ratio uses primes above 11 …" without touching exponent state
  - Scatter plot below builder shows 4 labeled points; 3/2 and 7/6 collision at (-1, 0) is acknowledged in prose
  - Every dynamic text path uses createElement + textContent (no innerHTML for user values)
  - BigInt path preserved: kernel never round-trips through cents

---

# Plan: Interactive Monzo Builder on `src/pages/monzos.md`

## Task 1 — Build `src/components/monzo-builder.ts` (NEW)

**Files:**
- CREATE `src/components/monzo-builder.ts`
- CREATE `src/components/monzo-builder.css`
- EDIT  `src/styles.css` (one-line `@import "./components/monzo-builder.css";` after the existing component imports — match the pattern already used for `scale-compare`, `spiral-of-fifths`, etc.)

**Action:**
Implement `monzoBuilder(synth: SynthHandle, opts?: MosBuilderOpts) => HTMLElement` modeled on `src/components/mos-builder.ts` (closure-component, Pattern 2 factory, no module-level state). Imports:
```ts
import { Interval } from "../lib/interval.js";
import { ratioPill } from "./ratio-pill.js";
import { playInterval } from "./play-interval.js";
import type { SynthHandle } from "../audio/synth.js";
```

Internal contract:
- Closure-local canonical state: `let exponents: number[] = [0, 0, 0, 0, 0];` (primes 2/3/5/7/11).
- Five `<input type="number" min="-12" max="12" step="1">` elements with `aria-label="Exponent of prime 2"` etc. Initial `value="0"`. Group label `<span>` "Exponents" precedes the row.
- One `<input type="text" aria-label="Ratio">` for the ratio-string field, initial `value="1"`.
- Display hosts (each a `<div>` updated via `replaceChildren` per change):
  - `braketHost` — sets `textContent = "[ " + exponents.join("  ") + " ⟩"` on a child `<code>` with `font-variant-numeric: tabular-nums` to keep columns aligned. **Unicode brackets only — no KaTeX re-typeset.**
  - `pillHost` — `replaceChildren(ratioPill(iv, { showCents: false }))`.
  - `centsHost` — child `<span>`'s `textContent = \`(~${iv.cents.toFixed(2)}¢)\``.
  - `playHost` — `replaceChildren(playInterval(iv, synth, { label: false }))`.
  - `errHost` — `role="status"`, `aria-live="polite"`; `textContent = ""` on success.

Two render entry points (no event loop — DOM `.value` writes do NOT refire `input` events):
1. `applyExponents()` — called from exponent-input listeners. Builds `iv = Interval.fromMonzo([...exponents])`, then:
   - Writes `ratioInput.value = iv.toString()` **only if** `document.activeElement !== ratioInput` (Pitfall #5 — don't fight the user's typing in the ratio field).
   - Calls `renderDerived(iv)`.
2. `applyRatio()` — called from ratio-input listener. Try `new Interval(ratioInput.value.trim())`:
   - On throw (fraction.js rejects empty/partial input): `errHost.textContent = err.message`; **do not** touch exponents.
   - On success: read `iv.monzo`. If `iv.monzo.slice(5).some((x) => x !== 0)` set `errHost.textContent = "Ratio uses primes above 11 — adjust ratio or use only primes 2/3/5/7/11."` and return without writing exponents.
   - Else pad/truncate: `const padded = [...iv.monzo, 0, 0, 0, 0, 0].slice(0, 5);`. If any |padded[i]| > 12: `errHost.textContent = "Exponent out of range [-12, 12] for prime …"`; return.
   - Otherwise: `errHost.textContent = ""`; update `exponents = padded`; write each `exponentInputs[i].value = String(padded[i])`; call `renderDerived(iv)`.

Empty-input rule (Pitfall — mirror `mos-builder.ts:53-59`): in each exponent input listener, `const parsed = parseInt(input.value, 10); if (!Number.isFinite(parsed)) return;` — preserve previous state on mid-typing empty. Then clamp `[-12, 12]` (do NOT auto-correct the DOM value; just clamp the stored `exponents[i]`).

`renderDerived(iv: Interval)` updates the four display hosts (bra-ket / pill / cents / play). Per T-02-22/23: every textual surface uses `el.textContent = …`. `ratioPill` and `playInterval` return `HTMLElement`s — `replaceChildren` is leak-safe (old button's listener GCs with the discarded node, synth handle survives).

CSS file (`src/components/monzo-builder.css`): minimal — `.monzo-builder` flex column with gap, `.monzo-builder__exponent-row` flex row of inputs, `.monzo-builder__display-row` flex row with bra-ket | pill | cents | ▶, `.monzo-builder__braket code { font-variant-numeric: tabular-nums; font-family: var(--serif); }`, `.monzo-builder__error { color: var(--theme-foreground-alt); }` (or whatever the existing pattern from `mos-builder.css` uses for status — match that file's tokens).

**Verify:**
- `npm run typecheck` exits 0
- `npm test -- monzo-builder` passes (if you add a spec — recommended: a small happy-dom spec covering exponent→ratio sync, ratio→exponent sync, "13/12" error, and empty-input preserve-state)
- `grep -n 'innerHTML' src/components/monzo-builder.ts` returns empty (XSS discipline)

---

## Task 2 — Wire builder + scatter + Further reading into `src/pages/monzos.md`

**Files:**
- EDIT `src/pages/monzos.md`

**Action:**
Three additive edits, no refactor of existing prose/imports/cells:

1. **Add import** to the top imports block (after the existing `playInterval` import):
   ```ts
   import * as Plot from "npm:@observablehq/plot";
   import { monzoBuilder } from "../components/monzo-builder.js";
   ```

2. **Insert a new `## Monzo builder` section** between the closing prose paragraph of `## Worked examples` (after line ~83 — the "factor of 3 in the *denominator*" paragraph) and the `Round-trip check` code block (currently starts ~line 84). Section contents:
   - One sentence of orienting prose: "Build any prime-2/3/5/7/11 monzo by hand. The inputs and the ratio field stay synced; the bra-ket form, the ratio, the cents value, and the ▶ button update on every keystroke."
   - One reactive cell: `${monzoBuilder(synth)}` (htl interpolation appends the closure-component's HTMLElement — same pattern used for `${ratioPill(...)}` and `${playInterval(...)}` already on the page).
   - One sentence noting the prime-11 ceiling: "Ratios that include primes above 11 (for example `13/12`) surface an inline error rather than silently truncating — the builder enforces a 5-coordinate ceiling that matches the input grid."

3. **Insert a `## Worked examples — projected to the 3-5 plane` section** between the new builder section and the `Round-trip check` cell. Contents:
   - Two sentences of prose explaining the projection: x = prime-3 exponent, y = prime-5 exponent, and noting the collision: "Notice that ${tex`3/2`} and ${tex`7/6`} both land at ${tex`(-1, 0)`} on this plane — they differ only in their 7-prime coordinate, which this projection collapses to zero. The overlap is real, not a rendering bug."
   - One reactive cell:
     ```ts
     const scatterData = [
       { ratio: "3/2",  p3: fifth.monzo[1] ?? 0,                p5: fifth.monzo[2] ?? 0 },
       { ratio: "5/4",  p3: majorThird.monzo[1] ?? 0,           p5: majorThird.monzo[2] ?? 0 },
       { ratio: "81/80",p3: syntonic.monzo[1] ?? 0,             p5: syntonic.monzo[2] ?? 0 },
       { ratio: "7/6",  p3: septimalSubminorThird.monzo[1] ?? 0,p5: septimalSubminorThird.monzo[2] ?? 0 },
     ];
     const monzoScatter = Plot.plot({
       width: 480,
       height: 360,
       marginLeft: 60,
       marginRight: 40,
       marginBottom: 50,
       x: { label: "Prime-3 exponent", grid: true, domain: [-5, 5] },
       y: { label: "Prime-5 exponent", grid: true, domain: [-2, 2] },
       marks: [
         Plot.ruleX([0], { stroke: "#888", strokeDasharray: "2,3" }),
         Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
         Plot.dot(scatterData, { x: "p3", y: "p5", fill: "#4269d0", r: 5 }),
         Plot.text(scatterData, { x: "p3", y: "p5", text: "ratio", dx: 8, dy: -4, textAnchor: "start", fontSize: 12, fill: "currentColor" }),
       ],
     });
     display(monzoScatter);
     ```
   - The data is built from `iv.monzo[1] ?? 0` / `iv.monzo[2] ?? 0` against the four existing `fifth` / `majorThird` / `syntonic` / `septimalSubminorThird` bindings already on the page — **no new Interval allocations, no hardcoded numeric literals for coordinates**.

4. **Append `## Further reading`** as the final section (after `## See also`), matching the schisma.md / pythagorean-comma.md / edo-approximation.md format exactly:
   ```md
   ## Further reading

   - [Monzo on the Xenharmonic Wiki](https://en.xen.wiki/w/Monzo) —
     community-curated reference for the prime-factor vector notation. Covers
     the bra-ket form, monzo arithmetic, prime limits, and the relationship to
     vals (the dual lattice used in regular-temperament theory).
   ```

Do NOT touch: existing imports (other than the two additions), the synth cell, the four worked-example Interval bindings, the existing `## Worked examples` prose + KaTeX bra-kets, the `Round-trip check` cell, the `## Monzo addition = ratio multiplication` section, or `## See also`.

**Verify:**
- `npm run typecheck` exits 0
- `npm test` exits 0 (baseline + any new spec)
- `npm run build` exits 0 with link validation passing
- `grep -c 'innerHTML' src/pages/monzos.md` → 0 (no innerHTML for user values; the existing tex`` literals are KaTeX-built, not innerHTML)
- `grep -n 'Monzo builder' src/pages/monzos.md` returns the new h2
- `grep -n 'Further reading' src/pages/monzos.md` returns the new h2
- `grep -n 'en.xen.wiki/w/Monzo' src/pages/monzos.md` returns the new link line
- In `npm run dev`: typing exponents updates display live; typing `5/4` → exponents become `[-2, 0, 1, 0, 0]`; typing `13/12` shows inline error and leaves exponents unchanged; clicking ▶ plays the current interval

---

## Notes

- **Component placement** mirrors the existing `mos-builder` / `spiral-of-fifths` convention: TypeScript source under `src/components/`, matching CSS file under `src/components/`, single `@import` line in `src/styles.css`.
- **Two-way sync correctness:** programmatic `.value = …` writes do NOT fire `input` events, so the two listeners (5 number-input handlers + 1 ratio-input handler) cannot enter a feedback loop. The `document.activeElement !== ratioInput` gate is the small additional courtesy that prevents the ratio field from being canonicalized out from under the user mid-typing (e.g. user types `4/2`, fraction.js reduces to `2`, we don't want to clobber the user's literal keystrokes).
- **`Plot.text` XSS:** Observable Plot renders text channels to SVG `<text>` nodes via D3's `.text()` (textContent under the hood), not innerHTML. The label inputs (`iv.toString()` for the four bindings) are kernel-emitted `"n/d"` strings — safe in any case.
- **No new INVENTORY rows expected** — the kernel surface is unchanged. If the team convention is to add a component row, add one line under the Components section of `src/lib/INVENTORY.md` for `monzoBuilder` mirroring `mosBuilder`'s row.

## PLANNING COMPLETE

Plan written: `/Users/taylorbrook/Dev/Tuning Systems/.planning/quick/260512-jiq-on-src-pages-monzos-md-add-an-interactiv/260512-jiq-PLAN.md`
