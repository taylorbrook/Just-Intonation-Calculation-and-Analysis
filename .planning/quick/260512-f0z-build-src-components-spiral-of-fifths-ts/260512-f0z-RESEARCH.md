# Quick 260512-f0z — Spiral of fifths component — Research

**Researched:** 2026-05-12
**Domain:** SVG visualization component (raw DOM `createElementNS`, no D3 force layout)
**Confidence:** HIGH

## Summary

- **`keyboard.ts` — not `tonality-diamond.ts` — is the right structural analog.** Tonality-diamond uses D3 selections (`d3.create("svg").selectAll(...)`); keyboard uses raw `document.createElementNS(svgNS, ...)`. The task spec says "raw SVG (no D3 force layout)" — mirror keyboard.ts.
- **All math primitives already exist.** Use `new Interval("3/2")`, `iv.octaveReduce()`, `iv.cents`, `iv.centsFrom12tet`, `iv.fraction.toFraction()`. Pythagorean comma is `commaByName("Pythagorean comma")` (returns `Interval` for `531441/524288`). No new helpers needed in `src/lib/`.
- **Geometry is unambiguous.** `θ_k = k · (fifthCents / 1200) · 2π`. For n=12 pure-3/2 the chain wraps `12·701.955 / 1200 = 7.0195` turns — render as a near-circle with a tiny outward spiral so the visible gap between point-0 and point-12 *is* the Pythagorean comma (≈ 7.03° of arc when angles are taken `mod 2π`).
- **Octave-reduced ratios stay exact via `Interval` ONLY when `temperedFifthCents` is undefined.** Tempered fifths are irrational — when `temperedFifthCents` is passed, drop the ratio label and show cents-only. The component returns *one* shape; the per-step record carries `ratio: Interval | null` and the renderer branches at the label layer.
- **Signed cents-from-12-TET is already implemented on `Interval` as `iv.centsFrom12tet`.** For tempered fifths it lives on a derived cents value: `cents - Math.round(cents/100) * 100` (the `centsFrom12tet(cents)` function in `src/lib/cents.ts`).

**Primary recommendation:** Geometry kernel (`spiralGeometry(n, fifthCents) -> SpiralStep[]`) is a pure function in the same file (or co-located), exported for vitest, no DOM. The `spiralOfFifths(n, opts) -> HTMLDivElement` factory calls it and renders SVG via `createElementNS`. Add `spiral-of-fifths.css` matching the `keyboard.css` shape (theme tokens only, `var(--theme-...)`).

## Math primitives in this repo (verified import paths)

All `[VERIFIED: read in this session]`.

| What | Where | Signature / shape |
|---|---|---|
| `Interval` class (BigInt source of truth) | `../lib/interval.js` | `new Interval("3/2")`, `.mul(other)`, `.octaveReduce()`, `.cents` (lazy float), `.centsFrom12tet` (lazy float), `.fraction.toFraction()` (string `"3/2"`) |
| Octave reduction | `Interval.octaveReduce(period?)` | Default period `2/1`. Throws on period ≤ 1/1 (CR-01 fix). Returns NEW instance (D-24 immutability). |
| Cents from a ratio Number | `toCents(value: number \| number[])` in `../lib/cents.js` | Used only at the audio/display boundary. Wraps `valueToCents` / `monzoToCents` from xen-dev-utils. **NEVER use this on a Fraction directly — use `iv.cents`.** |
| Signed cents from 12-TET (when you only have cents, not Interval) | `centsFrom12tet(cents: number): number` in `../lib/cents.js` | One-liner: `cents - Math.round(cents/100) * 100`. Use this for tempered-fifth steps where there's no Interval. |
| Cents → ratio (Number) | `centsToRatio(cents: number): number` in `../lib/cents.js` | Lossy, audio-projection only. Used by `meantone.md`. Use only if you need a Number ratio for tempered audition; you don't need this for the spiral. |
| Pythagorean comma (Interval) | `commaByName("Pythagorean comma")` in `../lib/commas.js` | Returns `Interval | undefined`. Monzo `[-19, 12]` → `531441/524288` ≈ 23.46¢. Useful for the wolf-interval annotation, not for geometry. |
| `Fraction` direct import | `import { Fraction } from "fraction.js"` | **R-01: never import Fraction from `xen-dev-utils`** (Number-backed, loses precision). The spiral doesn't need to import Fraction at all — `Interval` is sufficient. |

**Pure-3/2 in cents (constant for spec/tests):** `1200 * Math.log2(1.5) ≈ 701.9550008653874`. The repo computes this on the fly via `iv.cents`; no shared constant. Tests assert via the `701.9 < c < 702.0` window pattern (`src/lib/__tests__/interval.test.ts:24`).

**Existing chain-of-fifths reference implementation** (markdown cell — not exported, but shape is canonical) at `src/pages/pythagorean-tuning.md:34-45`:

```ts
const fifth = new Interval("3/2");
let acc = new Interval("1/1");
for (let k = 1; k < n; k++) {
  acc = acc.mul(fifth).octaveReduce();
  intervals.push(acc);
}
```

Reuse this loop verbatim in `spiralGeometry()`.

## Component conventions — mimic `keyboard.ts` exactly

- **File header** — JSDoc block with: factory signature, three-layer-discipline note ("never instantiates Web-Audio surface itself" — for spiral this becomes "no audio surface at all"), pitfall callouts.
- **Imports** — type-only for cross-layer (`import type { Interval } from "../lib/interval.js"`). Note the **`.js` extension** on the import path even though the source is `.ts` (per CLAUDE.md "Observable Framework Conventions").
- **Factory shape** — `export function spiralOfFifths(n, opts = {}): HTMLDivElement`. The task says `HTMLDivElement` (narrower than `HTMLElement`). Keyboard returns `HTMLElement` from a `<section>` root; here use a `<div>` for the spec.
- **Root container** — `const root = document.createElement("div"); root.className = "spiral-of-fifths-widget";`. No heading/helper required by the spec (task says "Don't wire into any page yet" — no page-level chrome). If you want consistency with other widgets, add an `<h2>Spiral of fifths</h2>` *inside* the div; doesn't change the return type.
- **SVG construction** — `createElementNS(svgNS, ...)`. `svgNS = "http://www.w3.org/2000/svg"`. Attributes set with `setAttribute("attr", String(value))` — note the explicit `String()` coercion required by strict TS (Phase 1 D-16 `noUncheckedIndexedAccess` + `strict`).
- **viewBox + size** — keyboard's pattern: `viewBox="0 0 W H"` + `preserveAspectRatio="xMidYMid meet"` + explicit `width` and `height` attrs. CSS sets `width: 100%; height: auto;` so SVG scales fluidly. For the spiral, use a **centered viewBox** like lattice.ts: `viewBox="${-W/2} ${-H/2} ${W} ${H}"` so `(0,0)` is the center of the circle — simpler than translating every coordinate.
- **Default width** — `opts.width ?? 480` is reasonable. Diamond uses 720 (square), keyboard uses `keyWidth * N + 8`, lattice uses 600×400. A square spiral (W = H) at 480 reads well; CSS `max-width: 720px` matches the project convention.
- **CSS classes** — BEM-ish `spiral-of-fifths__node`, `spiral-of-fifths__label`, `spiral-of-fifths__ratio`, `spiral-of-fifths__cents`, `spiral-of-fifths__wolf`, `spiral-of-fifths__gap`. CSS file `spiral-of-fifths.css` co-located. Theme tokens only (`var(--theme-foreground)`, `var(--theme-blue)`, `var(--monospace)`).
- **Per-page CSS loading caveat** — per `ratio-pill.ts:15-16` comment, CSS for components is loaded via per-page `style:` frontmatter (a Plan-06-deferred quirk). Since this component isn't wired to a page yet, the `.css` file just sits next to the `.ts` and waits for the wiring task. Match the play-dyad pattern.
- **No SynthHandle** — this is a pure visualization, no audio. Don't accept a synth argument. (Task spec confirms.)
- **No ratio-pill reuse** — `ratioPill` returns a `<span>` with `<code>` inside, not SVG. The spiral's labels are SVG `<text>` elements. Inline the label markup (as `keyboard.ts` does).

## Geometry — concrete formulas

Pull these into an exported pure function `spiralGeometry(n, fifthCents, opts) -> SpiralStep[]` so vitest can test geometry without booting the DOM.

```ts
export interface SpiralStep {
  k: number;                 // 0, 1, 2, ..., n
  cumulativeCents: number;   // k * fifthCents
  angleRad: number;          // (cumulativeCents / 1200) * 2π
  x: number;                 // r_k * sin(θ_k) — top-of-circle origin
  y: number;                 // -r_k * cos(θ_k)
  centsFrom12tet: number;    // signed deviation of octave-reduced step
  ratio: Interval | null;    // exact when pure 3/2; null when temperedFifthCents set
}
```

**Angle convention** — task spec: `θ_k = k · (fifthCents / 1200) · 2π`. Place `k=0` at top (12 o'clock), proceed clockwise — matches a clock face / common circle-of-fifths illustration. Concretely:

```ts
// SVG y-axis points down. 12 o'clock = (0, -r). Clockwise = +sin, -cos.
const x = r_k * Math.sin(θ_k);
const y = -r_k * Math.cos(θ_k);
```

This is unambiguous; the lattice + diamond don't lock a convention because they're not angular layouts.

**Radius — slight outward spiral** to (a) make the comma gap visible for n=12 and (b) avoid overlap for large n that wraps multiple times.

```ts
const r0 = R_BASE;                // e.g. 140 (viewBox units)
const dr = R_GROWTH_PER_WRAP;     // e.g. 6 (units of r per full turn)
const turns = θ_k / (2 * Math.PI);
const r_k = r0 + dr * turns;
```

Concrete defaults: `r0 = 140`, `dr = 6`. For n=12 pure 3/2:
- step 0: r=140, angle=0 → (0, -140)
- step 12: turns ≈ 7.0195, r ≈ 140 + 42.12 ≈ 182.12, angle mod 2π ≈ 0.1227 rad ≈ 7.03° → barely-displaced from step 0, on a visibly outer ring. The gap reads as a small radial+angular offset.

For n=24 the outermost step sits at r ≈ 224 (still well inside a 240-unit half-viewBox at W=480). For n=53 (Mercator), r ≈ 326 — clamp or auto-shrink `dr` if `n > 30`. Suggested guard: `const effectiveDr = Math.min(dr, (R_MAX - r0) / Math.max(1, n * fifthCents / 1200))`.

**Gap visualization** — for n=12, draw a dashed arc (or chord) between point-12 and point-0 with class `spiral-of-fifths__gap`. The gap *cents value* is the closing-error:

```ts
export function closingErrorCents(n: number, fifthCents: number): number {
  const total = n * fifthCents;
  return total - Math.round(total / 1200) * 1200;
}
// closingErrorCents(12, 701.955) ≈ +23.460   ← Pythagorean comma
// closingErrorCents(12, 700)     ≈    0      ← 12-TET (closes exactly)
// closingErrorCents(12, 696.578) ≈ -40.7     ← 1/4-comma meantone
```

**Wolf interval** — when `highlightWolf: true`, draw a chord between the **last point of the chain (k=n) and k=0** with class `spiral-of-fifths__wolf`. Don't compute the wolf ratio inside this component (it's tuning-system-dependent — Pythagorean wolf is `262144/177147 ≈ 678.49¢`, see `src/pages/pythagorean-tuning.md:54-60`). Just visually mark the closure gap; the page that uses this component can layer a separate `ratioPill` or `playInterval` near the chord.

## Octave-reduced ratio — algorithm + tempered branch

**Pure 3/2 branch** (task says: "with pure 3/2"):

```ts
const fifth = new Interval("3/2");
let acc = new Interval("1/1");
const steps: SpiralStep[] = [];
steps.push({ k: 0, ratio: acc, cumulativeCents: 0, ... });
for (let k = 1; k <= n; k++) {
  acc = acc.mul(fifth).octaveReduce();   // exact BigInt math via Interval
  steps.push({
    k,
    ratio: acc,
    cumulativeCents: k * fifthCents,
    centsFrom12tet: acc.centsFrom12tet,
    ...
  });
}
```

Step 12 with pure 3/2 reduces to `Interval("1/1")` after octave-reduction — that's the visual coincidence that the *visible spiral gap* exposes. The k=12 record carries `ratio = 1/1` (exact!), `cumulativeCents = 8423.46`, `angleRad ≈ 44.122 rad` (i.e., 7.0195 turns × 2π). Renderer plots it at the angle-mod-2π position, not at angle-0, so it lands slightly past k=0.

**Tempered branch** (`opts.temperedFifthCents !== undefined`):

```ts
const c5 = opts.temperedFifthCents;
for (let k = 0; k <= n; k++) {
  const cumulative = k * c5;
  // octave-reduce in cents space: cumulative mod 1200, signed in [0, 1200)
  const reducedCents = ((cumulative % 1200) + 1200) % 1200;
  // signed cents-from-12-TET on the reduced cents (not the cumulative!)
  const dev = centsFrom12tet(reducedCents);
  steps.push({ k, ratio: null, cumulativeCents: cumulative, centsFrom12tet: dev, ... });
}
```

Render-layer branch: when `step.ratio === null`, the SVG `<text class="ratio">` is omitted (or replaced with a per-step label like `°5` / `°7` if you want — task is silent, so omit). The cents-deviation label still renders. This branching is well-precedented in the repo (see `meantone.md`'s cents-built audition path).

**Edge case** — `temperedFifthCents = 700` produces a perfect 12-TET ring with `closingError = 0`. The spiral collapses to a single ring with 12 evenly-spaced points; the gap class would render zero-length. Confirm tests cover this (closing error = 0 ⇒ no visible gap).

## Vitest spec — mirror `play-dyad.test.ts` + `interval.test.ts`

Location: `src/components/__tests__/spiral-of-fifths.test.ts`. The vitest config already includes this glob.

**Geometry tests** import the named export `spiralGeometry` and `closingErrorCents`. No `@vitest-environment happy-dom` needed if the test file ONLY tests the pure geometry functions. **Add `// @vitest-environment happy-dom` only if you also assert on the DOM output** (the play-dyad and keyboard tests both do).

Skeleton:

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { spiralOfFifths, spiralGeometry, closingErrorCents } from "../spiral-of-fifths.js";
import { Interval } from "../../lib/interval.js";

describe("closingErrorCents", () => {
  it("12 pure 3/2 fifths leave a +23.46¢ Pythagorean-comma gap", () => {
    const PURE_FIFTH = 1200 * Math.log2(1.5);
    const err = closingErrorCents(12, PURE_FIFTH);
    expect(err).toBeGreaterThan(23.4);
    expect(err).toBeLessThan(23.5);
  });
  it("12-TET (700¢) closes exactly", () => {
    expect(closingErrorCents(12, 700)).toBeCloseTo(0, 9);
  });
  it("1/4-comma meantone (≈696.578¢) leaves a negative gap", () => {
    expect(closingErrorCents(12, 696.578)).toBeLessThan(-40);
  });
});

describe("spiralGeometry — pure 3/2", () => {
  const PURE_FIFTH = 1200 * Math.log2(1.5);

  it("step 0 has ratio 1/1, angle 0, cents 0", () => {
    const s = spiralGeometry(12, PURE_FIFTH)[0]!;
    expect(s.ratio?.equals(new Interval("1/1"))).toBe(true);
    expect(s.angleRad).toBe(0);
  });
  it("step 1 is 3/2 (octave-reduced)", () => {
    const s = spiralGeometry(12, PURE_FIFTH)[1]!;
    expect(s.ratio?.equals(new Interval("3/2"))).toBe(true);
    expect(s.centsFrom12tet).toBeGreaterThan(1.9);
    expect(s.centsFrom12tet).toBeLessThan(2.0);
  });
  it("step 2 is 9/8", () => {
    expect(spiralGeometry(12, PURE_FIFTH)[2]!.ratio!.equals(new Interval("9/8"))).toBe(true);
  });
  it("step 12 octave-reduces to 1/1 (exact) but lands at angle ≠ 0 (gap)", () => {
    const s = spiralGeometry(12, PURE_FIFTH)[12]!;
    expect(s.ratio!.equals(new Interval("1/1"))).toBe(true);
    const wrapped = s.angleRad % (2 * Math.PI);
    expect(wrapped).toBeGreaterThan(0.12);   // ≈ 7.03° in radians
    expect(wrapped).toBeLessThan(0.13);
  });
});

describe("spiralGeometry — tempered", () => {
  it("temperedFifthCents=700 closes exactly at k=12", () => {
    const steps = spiralGeometry(12, 700);
    expect(steps[12]!.ratio).toBeNull();                     // no exact Fraction
    expect(steps[12]!.angleRad % (2 * Math.PI)).toBeCloseTo(0, 9);
  });
});

describe("spiralOfFifths factory (DOM)", () => {
  it("returns an HTMLDivElement with class 'spiral-of-fifths-widget'", () => {
    const el = spiralOfFifths(12);
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.className).toContain("spiral-of-fifths-widget");
  });
  it("renders n+1 node groups for n fifths (k=0..n)", () => {
    const el = spiralOfFifths(12);
    const nodes = el.querySelectorAll(".spiral-of-fifths__node");
    expect(nodes.length).toBe(13);
  });
  it("highlights wolf when opts.highlightWolf=true", () => {
    const el = spiralOfFifths(12, { highlightWolf: true });
    expect(el.querySelector(".spiral-of-fifths__wolf")).not.toBeNull();
  });
});
```

**Imports to verify:** the `Interval` test uses `expect(i.cents).toBeGreaterThan(701.9)` (window pattern) rather than `.toBeCloseTo()` — both are acceptable in this codebase. The pattern in `interval.test.ts` is window-based; use that where the exact decimal matters less than "in the right neighborhood."

## Pitfalls / gotchas

1. **R-01 (kernel-discipline)** — never import `Fraction` from `xen-dev-utils`. The spiral component should not need to import `Fraction` at all — `Interval` covers everything. ESLint will fail the build if you do (`eslint.config.js` no-restricted-imports rule).
2. **`Interval.octaveReduce` is immutable + period-aware (D-24 / Pitfall #13).** Calling `acc.mul(fifth).octaveReduce()` returns a NEW Interval; don't try to mutate `acc` in place.
3. **BigInt → Number coercion only at the audio boundary (S-3).** Spiral has no audio boundary. Treat ratios as `Interval` end-to-end; only call `.cents` / `.centsFrom12tet` when *rendering* the cents label. Don't precompute `Number(iv.fraction.valueOf())` — irrelevant for SVG.
4. **No `new AudioContext()`** (Pitfall #2). Doesn't apply directly (no audio), but worth restating: zero audio surface in this component.
5. **strict TS gotchas:** `noUncheckedIndexedAccess` means `array[k]` is `T | undefined`. The pattern in keyboard.ts is `const iv = scale.intervals[i]; if (!iv) continue;`. Apply the same guard pattern when iterating `steps`.
6. **`setAttribute` requires string values** — wrap numbers in `String(x)`. Keyboard.ts does this everywhere; ESLint type-aware rules will flag `setAttribute("x", x)` where `x: number`.
7. **`textContent`, never `innerHTML`** (XSS — T-3-18 mitigation). All label text goes via `el.textContent = "..."` or `el.appendChild(document.createTextNode(...))`.
8. **U+2212 minus sign, not hyphen-minus**, for signed cents — `keyboard.ts:54` and `lattice.ts:284` both use `cents >= 0 ? "+" : "−"` (U+2212). Match for typographic consistency.
9. **Cents precision = 0.1¢ default (Pitfall #16 / Phase 2 D-06)** — `Math.abs(centsFromTwelveTet).toFixed(1)`. Don't show more than one decimal unless an `opts.precision` knob is added (out of scope per task spec).
10. **Per-page CSS-loading quirk** — the `.css` file co-located with the `.ts` file is *not* auto-loaded by Framework. Components that need their CSS to render on a page require the page to opt in via `style:` frontmatter or by direct `<link>` head injection. Since the task says "don't wire into any page yet," this is a future-task problem; just ship the `.css` and the wiring task can deal with it.
11. **n=0 edge case** — `spiralGeometry(0, ...)` should produce a single step (k=0, 1/1, angle 0). Guard in the factory: if `n < 0` throw a `RangeError`; for `n === 0` render the lonely 1/1 point with no chord/gap. Mirror `Interval.octaveReduce`'s `RangeError` pattern.
12. **Closing error sign** — be deliberate about whether `closingError > 0` means "fifths overshoot the octave" (pure 3/2: yes, +23.46¢) or "fifths undershoot." Document the convention in a JSDoc one-liner so the next reader doesn't have to derive it from the math.

## Sources

All `[VERIFIED: file in this repo, this session]`:
- `src/lib/interval.ts` — `Interval` class, octaveReduce, cents, centsFrom12tet
- `src/lib/cents.ts` — `toCents`, `centsFrom12tet`, `centsToRatio`
- `src/lib/commas.ts` — `commaByName("Pythagorean comma")` returns `Interval` for 531441/524288
- `src/lib/scale.ts` — Scale shape (for context, not needed by spiral)
- `src/components/keyboard.ts` + `keyboard.css` — closest structural analog (raw SVG, no D3)
- `src/components/tonality-diamond.ts` + `tonality-diamond.css` — D3-based analog (skip the D3 patterns, copy the CSS-class shape)
- `src/components/lattice.ts` — centered-viewBox pattern
- `src/components/ratio-pill.ts` — ratio formatting reference (use the formatting; don't reuse the function — it returns `<span>`, spiral needs `<text>`)
- `src/components/__tests__/keyboard.test.ts`, `play-dyad.test.ts` — vitest patterns + happy-dom env directive
- `src/components/__tests__/test-utils.ts` — `makeStubSynth` (not needed for spiral — no synth arg)
- `vitest.config.ts` — confirms `src/components/**/__tests__/**/*.test.ts` glob coverage
- `src/pages/pythagorean-tuning.md:34-45` — canonical chain-of-fifths loop pattern
- `src/lib/__tests__/interval.test.ts`, `cents.test.ts`, `commas.test.ts` — test idiom (window-based, no globals, named imports from vitest)

## Metadata

**Confidence breakdown:**
- Math primitives: HIGH — all helpers exist, all signatures verified against source
- Component conventions: HIGH — keyboard.ts is a near-perfect template, just adapt the geometry
- Geometry math: HIGH — formulas derived and spot-checked against the existing pythagorean-tuning.md page
- Test patterns: HIGH — three sibling test files read in this session

**Research date:** 2026-05-12
**Valid until:** indefinite (this is a leaf component; no external library deltas expected)
