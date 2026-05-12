# Research: Interactive Monzo Builder on `src/pages/monzos.md`

**Date:** 2026-05-12
**Mode:** quick-task
**Target file:** `src/pages/monzos.md`

## Goal

Add an interactive Monzo builder above the round-trip cell (~line 84) on `monzos.md` with bidirectional sync between 5 prime-exponent number inputs (range [-12,12]) and a ratio-string input, live-display the resulting `Interval` (ratioPill + bra-ket + cents + ▶), and below it render a 2D `Plot.dot` scatter of the four worked examples on (3-axis, 5-axis), plus a `## Further reading` section linking the Xenharmonic Wiki monzo page.

## Key findings

### 1. Observable Framework reactive input pattern — TWO options used in this codebase

The codebase mixes two patterns. **For this task, use Pattern B (component-style).**

**Pattern A — `view(Inputs.number(...))` (used in `analysis.md`).** Top-level reactive cell binding:

```ts
// src/pages/analysis.md:124
const baseHz = view(Inputs.number({ value: 440, step: 0.01, label: "Reference pitch (Hz)" }));
```

Each `view(...)` becomes a reactive variable; any cell that reads it re-runs on change. Clean for single-direction flow but **bad for bidirectional sync** — Observable Inputs binds value-out, and writing back to them from another cell creates feedback churn.

**Pattern B — `addEventListener("input", ...)` + closure-local state + `replaceChildren` (used in `src/components/mos-builder.ts`).** Build raw `<input type="number">` elements via `createElement`, attach listeners, recompute and re-render into a host `<div>` via `host.replaceChildren(...)`. Closure-local state means no Observable reactivity is involved — the whole widget is one DOM node, the cell only displays it once. **This is the right pattern here** because we need two-way sync between 5 prime inputs and a ratio-string input within the same widget. `mos-builder.ts` lines 109-145 is the canonical reference.

```ts
// src/components/mos-builder.ts:109-145 (abbreviated)
const nInput = document.createElement("input");
nInput.type = "number";
nInput.min = "1";
nInput.step = "1";
nInput.value = String(initialN);
nInput.setAttribute("aria-label", `${labelText} numerator`);
nInput.addEventListener("input", () => {
  const n = clampInt(nInput.value, ...);
  onChange(n, ...);
  rebuild();
});
```

The single `rebuild()` function rewrites the output host via `host.replaceChildren(scaleTable(...))`. No reactive loop, no Generators.observe, no Mutable.

### 2. Bidirectional sync — closure-local state + suppression flag

There is **no existing two-way binding** in the codebase. `mos-builder.ts` is one-way (inputs → output). The cleanest pattern given Observable's model:

- One `rebuild()` function reads the canonical state (the 5 exponents) and writes derived values to:
  1. the ratio-string input's `.value` (DOM property — does not fire `input` events programmatically)
  2. the ratioPill / bra-ket / cents / ▶ display hosts (via `replaceChildren`)
- The ratio-string input's `input` listener parses `new Interval(value).monzo`, writes back into the 5 exponent inputs' `.value` properties (also no event fired), updates the canonical exponent array, then calls a `renderDerived()` step that updates the display **without** writing back to the ratio input again.

Two safety details:
- **Setting `input.value = "..."` programmatically does NOT fire the `input` event** — this is the browser default and is what makes the loop terminate. Confirmed standard behavior, no shim needed.
- Wrap the ratio-input parse in `try/catch` so a transient invalid string (user mid-typing "3/", "5/4 ", etc.) preserves the prior exponent state and renders an inline error region instead of throwing. `fraction.js` throws on invalid n/d (per `mos-builder.ts:241` comment).

If we want belt-and-suspenders against accidental loops, gate each direction with a `suppress` flag:

```ts
let suppress = false;
const setRatioFromExponents = (iv: Interval) => {
  suppress = true;
  ratioInput.value = iv.toString();
  suppress = false;
};
ratioInput.addEventListener("input", () => {
  if (suppress) return;
  // ... parse, update exponents, rerender derived only
});
```

This is the standard "form sync" pattern; cheap and obvious.

### 3. `Interval` API — exact contract from `src/lib/interval.ts`

| Method/getter | Signature | Behavior |
|---|---|---|
| `new Interval(input)` | `FractionInput = Fraction \| string \| bigint \| number \| {n,d}` | Strings parsed by fraction.js (`"3/2"`, `"1.5"`, decimals accepted). **Throws** on invalid input (e.g. `"3/"`, `""`, `"abc"`). |
| `Interval.fromMonzo(monzo: number[])` | static | Wraps `xen-dev-utils.monzoToBigNumeratorDenominator` then `new Fraction(numerator, denominator)`. **Handles negative exponents fine** (the kernel uses `monzoOfFraction` that subtracts n-monzo and d-monzo). Empty array → 1/1 (returns `new Fraction(1n, 1n)`). |
| `Interval.monzo` (getter) | `number[]` | Lazy + cached. **Length = max(n-prime-monzo.length, d-prime-monzo.length) — trailing zeros are NOT suppressed.** Each entry is the signed exponent (n's exponent minus d's exponent). E.g. `new Interval("3/2").monzo` is `[-1, 1]` (length 2 — no trailing zero), `new Interval("5/4").monzo` is `[-2, 0, 1]` (length 3, includes the zero in the 3-prime slot). |
| `Interval.cents` (getter) | `number` | Lazy + cached. **Converts through `Number(this.fraction.valueOf())` then `Math.log2` — float math.** Comment at `interval.ts:51`: "Display projection only — float math is acceptable here (Pitfall #1)." BigInt path is preserved on the fraction itself; cents is a one-way derivation. |
| `Interval.toString()` | `string` | Delegates to `this.fraction.toFraction()` — returns `"3/2"`, `"81/80"`, `"1/1"` for unison. |
| `Interval.equals(other)` | `boolean` | Delegates to `this.fraction.equals(other.fraction)` — BigInt-exact. |
| `Interval.mul(other)` | `Interval` | BigInt-exact. |

**Important monzo-length gotcha:** when reading `iv.monzo` for the 5-input builder, we need to pad/truncate to exactly 5 slots [p2, p3, p5, p7, p11]. If `iv = new Interval("3/2")`, `iv.monzo` is `[-1, 1]` — only 2 entries. We must `[...iv.monzo, 0, 0, 0].slice(0, 5)`. Conversely, if the user enters a ratio with a prime > 11 (e.g. `"13/12"`), `iv.monzo.length` will be ≥ 6 — we should detect this and surface "Ratio contains primes above 11" rather than silently dropping the 13-coordinate.

### 4. `ratioPill` and `playInterval` — return `HTMLElement`, safe to re-render

| Function | Signature | Returns |
|---|---|---|
| `ratioPill(interval, opts?)` | `(interval, { showCents?: boolean }) => HTMLSpanElement` | `<span class="ratio-pill"><code>3/2</code><small> (~702.0¢)</small></span>` — built via `createElement` + `textContent`. |
| `playInterval(interval, synth, opts?)` | `(interval, synth, { baseHz?, duration?, label? }) => HTMLButtonElement` | `<button class="play-btn">▶</button>` or `▶ Play 5/4` with `label: true`. Click handler captures `interval` and `synth` lexically. |

**Both return DOM elements** (not strings, not HTML). Both are **safe to call repeatedly inside `replaceChildren`** — each call builds a fresh element with its own listener. **No listener leak risk on the audio side**: `playInterval`'s click listener lives on the discarded button; when `replaceChildren` removes that button from the DOM, the listener is garbage-collected along with the node. The `synth` itself is owned by the page-level cell and is NOT recreated.

Markdown-inline calls like `${ratioPill(fifth)}` use Framework's htl interpolation, which appends the element. That works for static usage; for live updates we must put `ratioPill` calls inside `replaceChildren` on a host div, NOT inside a string template that's re-evaluated.

### 5. `Plot.dot` + per-point text labels — copy-pasteable from `comma-pump.md`

The cleanest pattern in the repo is layering `Plot.text` on top of `Plot.dot` over the same data:

```ts
// Adapted from src/pages/comma-pump.md:208-214 and pythagorean-comma.md:108-114
const exampleScatter = Plot.plot({
  width: 480,
  height: 360,
  marginLeft: 60,
  marginRight: 40,
  marginBottom: 50,
  x: { label: "Prime-3 exponent", grid: true, domain: [-5, 5] }, // syntonic is -4..+4 — give a touch of headroom
  y: { label: "Prime-5 exponent", grid: true, domain: [-2, 2] },
  marks: [
    Plot.ruleX([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.dot(scatterData, { x: "p3", y: "p5", fill: "#4269d0", r: 5 }),
    Plot.text(scatterData, {
      x: "p3",
      y: "p5",
      text: "ratio",
      dx: 8,
      textAnchor: "start",
      fontSize: 12,
      fill: "currentColor",
    }),
  ],
});
```

Data shape: `[{ p3: -1, p5: 0, ratio: "3/2" }, { p3: 0, p5: 1, ratio: "5/4" }, { p3: 4, p5: -1, ratio: "81/80" }, { p3: -1, p5: 0, ratio: "7/6" }]`. Note 3/2 and 7/6 BOTH map to `(p3=-1, p5=0)` — they will overlap. Two options: (a) accept the overlap and let the labels stack with `dx`/`dy` per point, or (b) include p7 as the fill channel to color-distinguish them. **Recommend (a) for simplicity**, with a comment in the prose explaining "intervals that share (p3, p5) coordinates differ in their higher primes — `7/6` and `3/2` overlap here."

Pull p3 from `iv.monzo[1] ?? 0` and p5 from `iv.monzo[2] ?? 0` (since monzo[0] is the 2-exponent).

### 6. XSS discipline — T-02-22 / T-02-23 — confirmed convention

**Rule (from multiple file headers, e.g. `src/components/scale-table.ts:13`, `src/components/edo-jit-table.ts:16`):**
> All dynamic cell values go through `createElement` + `textContent` — NEVER `innerHTML` for any interpolated user value.

`T-02-22` is the threat-model ID for "XSS via interpolated user input"; `T-02-23` is the specific "textContent — never innerHTML" mitigation. Confirmed in `STATE.md:115` and the `260511-vlq` / `260512-d38` / `260512-dcp` plans.

**For this widget, every one of these touch points must use `textContent`:**

| Surface | Source | Render |
|---|---|---|
| Ratio-string display in any visible region | derived `iv.toString()` | `el.textContent = iv.toString()` (NOT into an htl template) |
| Bra-ket form | 5 exponent ints (already validated to integers) | `el.textContent = "⟨ " + exponents.join(" ") + " ]"` — or KaTeX (see finding #8) |
| Cents display | `iv.cents.toFixed(1)` | `el.textContent = \`(~\${iv.cents.toFixed(1)}¢)\`` |
| Scatter labels | `iv.toString()` per row | Plot.text's `text` channel — Plot renders these as SVG `<text>` nodes with proper escaping; this is safe by default. |
| Error region (invalid ratio input) | `err.message` from fraction.js | `errEl.textContent = err.message` |

Note: `Plot.text` IS safe for user-derived strings — Observable Plot renders to SVG `<text>` elements using D3's text-binding, not innerHTML. Confirmed in `comma-pump.md` and `pythagorean-comma.md` usage with no special escaping. But the **inputs** to Plot.text in our case are all kernel-derived (`iv.toString()`) — the kernel only emits well-formed `"n/d"` strings.

### 7. `## Further reading` section — exact format from `schisma.md`

Heading is `## Further reading` (h2, sentence case "reading"). Format is bullet list with markdown links. Each link's first item is the title, then ` — ` (em dash), then a one- or two-sentence description ending in a period. See `schisma.md:153-161`:

```md
## Further reading

- [Schisma on the Xenharmonic Wiki](https://en.xen.wiki/w/Schisma) —
  community-curated reference for ${tex`32805/32768`} and its role as the
  difference between the Pythagorean and syntonic commas. Covers the
  family of *schismatic temperaments* ...
```

Same format used in `edo-approximation.md:329-338`, `comma-pump.md:360-375`. Match it exactly:

```md
## Further reading

- [Monzo on the Xenharmonic Wiki](https://en.xen.wiki/w/Monzo) —
  community-curated reference for the prime-factor vector notation. Covers
  the bra-ket form, monzo arithmetic, prime limits, and the relationship to
  vals (the dual lattice used in regular-temperament theory).
```

### 8. Bra-ket rendering — KaTeX for prose, plain Unicode for the live builder

The static worked examples in `monzos.md` use KaTeX:

```md
${tex`5/4 = \begin{bmatrix} -2 & 0 & 1 \end{bmatrix}\rangle = ...`}
```

This is great for prose but bad for live updates: `tex\`...\`` returns an HTMLElement built fresh each interpolation; re-running it 60 times/second as the user holds a spinner arrow is wasteful and creates a visible flicker as KaTeX re-typesets. **Recommend Unicode brackets for the live builder display** — matches the bra-ket convention `[a b c d e⟩` using `⟨` (U+27E8) or square `[` + `⟩` (U+27E9). Concretely:

```ts
braketEl.textContent = `[ ${exponents.join("  ")} ⟩`;
```

Style with `font-family: var(--serif)` or `font-variant-numeric: tabular-nums` to keep columns aligned as values change. Keep the static KaTeX bra-kets in the surrounding prose untouched — they look great in the explanatory examples and don't change.

Alternative: render KaTeX once per input event via `tex\`\begin{bmatrix}...\end{bmatrix}\rangle\``. Acceptable but heavier and adds a re-typeset on every keystroke. Stick with Unicode unless the visual mismatch with the static examples bothers you.

### 9. Pitfalls

- **Observable cell re-execution.** The widget should be ONE cell that renders ONE DOM node and never re-runs (no top-level `view()` reactivity). All state lives inside the closure. Calling `synth` from the cell is fine — `synth` is owned by the synth cell up top (`monzos.md:17`); we read it once and pass into each `playInterval(...)` call.
- **BigInt → Number for cents display is REQUIRED and FINE.** `Interval.cents` already does this internally (`interval.ts:51`); we just call `iv.cents.toFixed(1)`. Do NOT round-trip through cents into `Interval.fromCents` (no such method exists, by design — Pitfall #1).
- **Re-rendering audio buttons each change does NOT leak.** Each `playInterval` call returns a fresh `<button>` with its own click listener. `replaceChildren` discards the old node; GC reclaims the listener. The synth itself is NOT recreated — `playInterval` captures the synth handle, not the AudioContext. Confirmed by reading `play-interval.ts` and `synth.ts`'s `createSynth` lifecycle.
- **`<input type="number" step="1" min="-12" max="12">` on Safari/Firefox.** Negative values work; the only quirk is that an empty input fires `input` with `value === ""`. We must treat `""` as "preserve previous value, don't update" rather than coerce to 0 (which would silently jump the user's input to 0 every time they clear it to retype). Pattern: `const parsed = parseInt(inp.value, 10); if (!Number.isFinite(parsed)) return;`. Mirror the clamp pattern in `mos-builder.ts:53-59`.
- **Monzo length when ratio includes high primes.** `new Interval("13/12").monzo` returns length 7 (entries 0..6 for primes 2..13). The 5-input UI can't represent this. Detect: if `iv.monzo.slice(5).some(x => x !== 0)` → surface error "Ratio uses primes above 11 — adjust ratio or use only primes 2/3/5/7/11."
- **Round-trip preservation.** When the user types `"4/2"`, `new Interval("4/2").toString()` returns `"2"` (fraction.js auto-reduces). The exponents will update to `[1]` (length 1, padded to 5 zeros), and the ratio input will display `"2"` on next sync — possibly surprising. Either (a) don't auto-sync the ratio input back from exponents while the user has focus on it, or (b) accept the canonicalization and note it in a comment. **Recommend (a):** only push exponents → ratio-input when the change originated from an exponent input, not from the ratio input itself.
- **`Plot.text` overlapping labels at `(p3=-1, p5=0)`.** 3/2 and 7/6 occupy the same point. Add `dy` offsets per row (e.g. small `dy: -6` for one, `dy: 6` for the other) or accept the overlap with a prose note. Simpler: filter so that visually overlapping points use a single label like `"3/2, 7/6"`.

## Recommended approach

1. **Single closure-component cell** inserted at line ~84 (before `roundTrip`). One outer `<section class="monzo-builder">` host element. All state local to the cell. Pattern mirrors `mos-builder.ts` exactly. No `view()`, no `Mutable`, no `Generators.observe`.

2. **Bidirectional sync via DOM `.value` writes (no event re-fire)** + try/catch on the ratio parse + a `suppress` flag for belt-and-suspenders. Exponents are the canonical state; ratio input is reconstructed via `Interval.fromMonzo([...exponents]).toString()` on every exponent change, and parsed back to exponents on ratio-input change.

3. **5 number inputs in a row**, `type="number" min="-12" max="12" step="1"`, labeled "2", "3", "5", "7", "11" — `aria-label` on each ("Exponent of prime 2", etc.). Empty input → preserve previous value. Initial value `0` for all five.

4. **Display row** under the inputs hosts: bra-ket (Unicode brackets, tabular-nums font), ratioPill, ▶ button. All three are `replaceChildren`d on every state change. Use a `derivedHost` div pattern from `mos-builder.ts:211-217`.

5. **Scatter plot below the builder** — one `Plot.plot` cell with `Plot.dot` + `Plot.text`, data derived from the 4 worked-examples (`fifth`, `majorThird`, `syntonic`, `septimalSubminorThird`) by pulling `iv.monzo[1] ?? 0` and `iv.monzo[2] ?? 0`. Note the 3/2 / 7/6 collision in prose. Domain hinted from the syntonic comma's extremes: `x: [-5, 5]`, `y: [-2, 2]`.

6. **`## Further reading` section at the bottom** with a single bullet linking `https://en.xen.wiki/w/Monzo`, following the exact format used in `schisma.md:153-161` (h2, em-dash separator, two-sentence description).

## Pitfalls / non-obvious gotchas

(See finding #9 above for the full list — copying the high-priority ones here.)

- Empty `<input>` value must NOT coerce to 0 — preserve previous canonical state.
- High-prime ratios (`"13/12"`) must be detected and surfaced as an error, not silently truncated to 5-prime form.
- Fraction.js auto-canonicalizes (`4/2` → `2`); to avoid jarring the user, do NOT re-sync the ratio input back from the exponents while the ratio input itself has focus.
- 3/2 and 7/6 collide at (p3=-1, p5=0) in the scatter — either accept overlap with a prose note or merge their labels.
- KaTeX `tex\`...\`` is too heavy for live re-render — use Unicode `[ a b c d e ⟩` for the live bra-ket display, keep KaTeX for the static prose examples above.
- All textContent paths confirmed: ratio display, bra-ket, cents, error region. `Plot.text` is XSS-safe (SVG, not innerHTML).
- ▶ button re-render is safe: no leak, synth handle is captured but not recreated.

## Open questions

None blocking. Two minor design calls left for the plan/implementation:

1. **Bra-ket bracket style** — `[ a b c d e ⟩` (matches the page's `\begin{bmatrix}...\end{bmatrix}\rangle` convention with square left and angle right) vs. fully symmetric `⟨ a b c d e ⟩`. Recommend the first — it matches the static prose.
2. **Scatter point fill** — single color (`#4269d0` matches the rest of the notebook) vs. fill-by-prime-limit (`color: { domain: ["3-limit", "5-limit", "7-limit"] }`) for visual reinforcement. Recommend single color for minimum visual noise; the prose can call out the limits.

## RESEARCH COMPLETE

File path: `/Users/taylorbrook/Dev/Tuning Systems/.planning/quick/260512-jiq-on-src-pages-monzos-md-add-an-interactiv/260512-jiq-RESEARCH.md`
