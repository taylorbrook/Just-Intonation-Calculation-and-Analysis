# Quick Task 260608-dyv: Scale generation feature — Plan

**Planned:** 2026-06-08
**Mode:** plan-only (this run produces PLAN.md; NO source edits, NO execution)
**Inputs:** `260608-dyv-CONTEXT.md` (locked decisions), `260608-dyv-RESEARCH.md` (method menu + integration design)
**Confidence:** HIGH — every precedent file read; kernel/component/integration APIs confirmed in source.

---

## How to read this plan

This is a **large, multi-run feature**. It is NOT meant to be executed in one
`/gsd-quick` pass. It is structured as **one foundation wave (Wave 0) followed by
three method tranches (T1–T3)**, each independently executable in a future run.

- **Wave 0 is the gate.** It builds the additive shared-state integration AND the
  page scaffold. Its R1 boot-equivalence test MUST go RED→GREEN before any
  "Send to…" wiring exists. Nothing in T1–T3 should be wired to the store until
  Wave 0 is green.
- **Tranches T1–T3 each add generators.** Within a tranche, tasks are atomic and
  individually committable (strict RED→GREEN TDD per task). Tranches are mostly
  independent of each other (see Dependency Ordering) so you can pick up any
  tranche in a fresh run once Wave 0 has landed.

**Suggested future entry points** (one per future run; `/clear` between runs):

| Run | Command | Scope |
|-----|---------|-------|
| 1 | `/gsd-execute-phase` on Wave 0 (or `/gsd-quick` "build Wave 0 of 260608-dyv") | Integration foundation + page scaffold + R1 gate |
| 2 | `/gsd-quick` "build Tranche 1 of 260608-dyv" | Exact-rational hand-rolled generators |
| 3 | `/gsd-quick` "build Tranche 2 of 260608-dyv" | SonicWeave adapter + tempered/lattice wrappers + free-text |
| 4 | `/gsd-quick` "build Tranche 3 of 260608-dyv" | Circle-of-pitches viz, rotate-to-mode, transform strip, Wilson/metallic, CS |

Each tranche is large enough to warrant its own run for context-quality reasons;
if a tranche feels heavy mid-run, split it at a task boundary and resume.

---

## Architecture (three-layer purity — locked)

```
src/lib/            KERNEL — pure, BigInt Fraction source of truth, NO DOM/audio.
  scale-store.ts      shared "current scale" store (theme-prefs twin). [Wave 0]
  cps.ts              CPS / Hexany / Dekany / Eikosany.                [T1]
  harmonic.ts         harmonic/subharmonic segment, ADO, isoharmonic.  [T1]
  generators.ts       diamondScale, oddLimitSet, primeLimitSet, farey,
                      edScale (tempered).  (or split per-method — see note) [T1]
  sonicweave.ts       evaluateSource → Scale adapter (rational + tempered). [T2]
  meru.ts             Wilson recurrence / metallic-ratio scales.       [T3]

src/components/     COMPONENTS — Pattern-2 factories (synth, opts) => HTMLElement,
                    createElement + textContent XSS discipline, status region.
  generate-*.ts       one factory per method family (cps-builder, harmonic-builder,
                      ed-builder, ji-set-builder, sonicweave-input, …).
  circle-of-pitches.ts  SVG ring preview viz (plain createElementNS).   [T3]

src/pages/
  generate.md         PAGE — owns the synth (Pattern 4), hosts the method picker,
                      mounts the chosen factory, owns "Send to…" buttons.  [Wave 0 scaffold + grows per tranche]
  index.md            +1 additive listener cell, +1 `??` boot clause.     [Wave 0]
  analysis.md         +1 additive listener cell, +1 `??` boot clause.     [Wave 0]

observablehq.config.ts  +1 nav entry "Generate" between Analysis and Theory.  [Wave 0]
src/lib/INVENTORY.md    every new kernel symbol listed.                   [each tranche]
```

**Kernel-module granularity (Claude's discretion per CONTEXT):** group the
exact-rational generators by family rather than one-file-per-method — `cps.ts`,
`harmonic.ts`, and a `generators.ts` for the remaining single-purpose exact
builders (diamondScale, oddLimitSet, primeLimitSet, farey, edScale). This mirrors
the kernel's existing grain (`mos.ts`, `diamond.ts`, `edo.ts` each host a small
family). If any file exceeds ~150 LOC during execution, split it.

---

## Conventions every task MUST follow (locked, from CONTEXT + RESEARCH)

1. **R-01 / fraction.js only.** Import `Fraction` from `"fraction.js"`, NEVER from
   `xen-dev-utils`. Any `xen-dev-utils` Fraction (e.g. from `kCombinations` results
   or SonicWeave's `.toFraction()`) round-trips into our `Interval` via the
   `${n}/${d}` string — exactly the `jiSubsetOfEdo` pattern (scale.ts:184).
2. **BigInt dedupe, never cents tolerance.** Dedupe with a `Set` keyed on
   `` `${String(iv.fraction.n)}/${String(iv.fraction.d)}` `` (Pitfall #1/#6). Copy the
   exact pattern from `buildMos` (mos.ts:176–184) and `enumerateDiamond`.
3. **Period-reduce + append-period (D-14).** Octave/period-reduce via
   `Interval.octaveReduce(period)` (default 2/1); ensure the last interval equals
   the period (append if missing), like `buildMos` and `Scale.reduce`.
4. **Tempered scales carry cents, never laundered JI.** EDO/ED-n, tempered rank-2,
   and well-temperaments are irrational. Construct their pitches from cents at the
   display/audio boundary; flag the scale "tempered" so the ratio column does not
   lie (Pitfall #1, OQ-3 → "tempered" badge + cents-primary). See "Tempered-scale
   representation" below.
5. **Defense-in-depth caps.** Mirror `enumerateDiamond`'s `[1,1023]` and
   `buildMos`'s `≤1024` — cap CPS factor count, k, EDO divisions, harmonic hi,
   Farey order, SonicWeave input length (reuse `MAX_SCALE_TEXT_BYTES` = 8 KB).
6. **Component XSS discipline.** `createElement` + `textContent` ONLY; never
   `innerHTML` for dynamic content. Status region `role="status" aria-live="polite"`.
   Copy `mosBuilder` shape verbatim (closure-local state, `replaceChildren` re-render).
7. **Page owns synth (Pattern 4 / Pitfall #2/#11).** `generate.md` declares ONE
   `createSynth()` cell with `invalidation.then(synth.dispose)`. The
   `scale-changed` listener and Esc handler bind in dedicated cells, never re-bind
   per input.
8. **Three-layer purity.** Kernel imports nothing from `components/` or `audio/`.
   `scale-store.ts` is the ONE allowed shared dep between page and the store
   (mirrors theme-prefs.ts's carve-out) — constants + pure read/validate, no
   top-level side effects.
9. **No new npm packages. Do NOT upgrade `xen-dev-utils` (stay 0.13.1).** Every
   dependency needed is installed (`sonic-weave@0.14.1`, `xen-dev-utils@0.13.1`,
   `fraction.js@5.3.4`).
10. **List every new kernel symbol in `src/lib/INVENTORY.md`** with Source + Reason,
    per the existing discipline.

### Tempered-scale representation (resolve OQ-3 here, once)

Tempered scales (EDO, ED-n, tempered rank-2, well-temperament) cannot carry exact
ratios. **Decision for this feature:** the kernel builders for tempered families
return a `Scale` whose intervals are constructed from cents via the existing
`centsToRatio` projection (monzo.ts), AND the generating component tags the scale
as tempered for the UI. Since `Scale`/`Interval` have no `tempered` field today,
carry the flag at the **component layer** (the builder knows which family it ran)
rather than mutating the kernel types — the badge + cents-primary table is a
component concern. Do NOT add a field to `Interval`/`Scale` in this feature (avoids
destabilizing the kernel the dashboard depends on). The scale TEXT pushed to the
store for tempered scales is the cents form (one cents value per line, e.g.
`100.0`), which `parseScala` already handles (cents-detection via `.`), so
Dashboard/Analysis render it correctly as a tempered scale.

---

# WAVE 0 — Integration foundation + page scaffold  (THE GATE)

**Goal:** A new `/pages/generate` tab exists and renders a method picker; a pure
`scale-store.ts` exists; Dashboard + Analysis opt into live updates **additively**;
and the R1 boot-equivalence regression test proves boot is byte-identical when the
store is empty — BEFORE any "Send to…" wiring is live.

**Autonomous:** yes. **Depends on:** nothing.

**HARD REGRESSION CONSTRAINT (user's #1 sensitivity):** the integration MUST be
additive. The only change to each existing page's boot expression is a single `??`
clause that is **inert when the store is empty**. One-way data flow: ONLY the
"Send to…" buttons write the store; consumers only read at boot + listen for the
event. Consumers NEVER write the store (prevents the R2 feedback loop). The R1 test
gates this wave.

### Task 0.1 — `scale-store.ts` (pure store) + tests

- **files:** `src/lib/scale-store.ts`, `src/lib/__tests__/scale-store.test.ts`,
  `src/lib/INVENTORY.md`
- **TDD (RED first):** write `scale-store.test.ts` before the module. Test
  inventory:
  - `writeSharedScale("…")` then `readSharedScale()` returns `{ text, source? }`.
  - `readSharedScale()` returns `null` when the key is absent (fresh load).
  - `readSharedScale()` returns `null` on malformed JSON / wrong shape / array /
    primitive (mirror `readThemePrefs` validation branches).
  - Length cap: text > `MAX_SCALE_TEXT_BYTES` (reuse the `url.ts` constant) →
    `writeSharedScale` no-ops / `readSharedScale` returns `null` (choose: validate
    on read AND refuse on write).
  - `localStorage` throws (stub `getItem`/`setItem` to throw) → read returns
    `null`, write is a silent no-op (mirror theme-prefs T-9mn-03).
  - `writeSharedScale` dispatches a `CustomEvent(SCALE_CHANGED_EVENT)` whose
    `detail` is `{ text, source }` (assert via `window.addEventListener` in a
    happy-dom test, `// @vitest-environment happy-dom`).
- **action:** Create `scale-store.ts` mirroring `theme-prefs.ts` precisely:
  exported constants `SCALE_STORAGE_KEY = "tuning-systems:scale"`,
  `SCALE_CHANGED_EVENT = "tuning-systems:scale-changed"`; interface
  `SharedScale { text: string; source?: string }`; pure
  `readSharedScale(): SharedScale | null` (try/catch localStorage, validate shape,
  cap length at `MAX_SCALE_TEXT_BYTES` imported from `./url.js`); and
  `writeSharedScale(text, source?): void` (try/catch `setItem`, then
  `window.dispatchEvent(new CustomEvent(SCALE_CHANGED_EVENT, { detail: { text, source } }))`).
  No top-level side effects. Add an INVENTORY.md row under a new
  "Quick 260608-dyv — scale generation" section: `scale-store` → Custom (this
  repo), Source/Reason "theme-prefs.ts carve-out twin: shared current-scale state;
  localStorage + CustomEvent; one-way (only Send-to writes)."
- **verify:** `npx vitest run src/lib/scale-store.test.ts`
- **done:** all store tests green; module exports the 2 constants + interface + 2
  functions; no DOM/side-effects at module top level; INVENTORY updated.

### Task 0.2 — R1 boot-equivalence regression test (THE GATE) + additive boot helper

- **files:** `src/__tests__/scale-store-boot.test.ts` (new),
  optionally `src/lib/scale-store.ts` (add a tiny pure `resolveInitialScaleText`
  helper so the boot precedence is unit-testable without a page)
- **TDD (RED first):** This is the critical gate. Encode the C-3 precedence rule as
  a pure function and test it. Test inventory:
  - **R1 (empty-store boot equivalence):** with the store empty,
    `resolveInitialScaleText(hashDecoded, readSharedScale(), seedText)` returns
    EXACTLY `hashDecoded ?? seedText` for the cases:
    (hash present → hash), (no hash → seedText). Assert the result is
    byte-identical to the current `hashDecoded ?? seedText` expression. This proves
    the new `??` clause is inert when the store is empty.
  - Precedence order C-3: hash beats store beats seed —
    `resolveInitialScaleText(hash, stored, seed)` returns `hash` when hash present
    even if `stored` is non-null; returns `stored.text` when no hash and stored
    non-null; returns `seed` when neither.
  - The helper never throws on a `null` stored value.
- **action:** Add a pure helper to `scale-store.ts`:
  `resolveInitialScaleText(hashDecoded: string | null, stored: SharedScale | null, seedText: string): string`
  returning `hashDecoded ?? stored?.text ?? seedText`. (A 1-line function — its
  value is that it makes the precedence testable and gives both pages one symbol to
  import, keeping the `.md` change to a single `??` clause.) Write
  `scale-store-boot.test.ts` exercising the inventory above.
- **verify:** `npx vitest run src/__tests__/scale-store-boot.test.ts`
- **done:** R1 test green and asserts empty-store equivalence explicitly. **This
  test is the wave gate — it must exist and pass before Task 0.4 wires any pages.**

### Task 0.3 — `generate.md` scaffold + nav entry

- **files:** `src/pages/generate.md` (new), `observablehq.config.ts`
- **action:** Create `generate.md` with: a title + one-paragraph intro card
  (mirror index.md's intro card tone); the **page synth cell** copied verbatim from
  analysis.md (lines 17–38 — `createSynth()`, Esc keydown, `audioActive` Mutable,
  activeVoices poll, consolidated `invalidation.then` cleanup); a **method-picker**
  cell (`Inputs.select` grouped by the 5 families as `<optgroup>`s — Regular · JI
  combinatorial · Harmonic · Advanced · SonicWeave — initially with only a
  placeholder option per family, methods fill in per tranche); a **params host**
  div and a **preview host** div that the chosen factory will populate; and the
  floating Stop button cell (copy from analysis.md lines 187–200). No "Send to…"
  buttons yet (Task 0.5). Add a nav entry `{ name: "Generate", path: "/pages/generate" }`
  to `observablehq.config.ts` `pages` array **between** `Analysis` and
  `Theory notes`; also add `Generate` to the `header` breadcrumb string for parity
  with the existing header links.
- **verify:** `npx vitest run && npm run build` (build proves the page compiles and
  the nav renders; the existing suite proves no regression). Manual: `npm run dev`,
  visit `/pages/generate`, confirm nav shows Generate between Analysis and Theory.
- **done:** `/pages/generate` builds and renders with a synth-owning page, a method
  picker (placeholder options), empty params + preview hosts, and a working Stop
  button; nav + header updated; full suite still green.

### Task 0.4 — Additive opt-in on Dashboard + Analysis (consumers; read + listen only)

- **files:** `src/index.md`, `src/pages/analysis.md`
- **action:** Make the **single additive change** to each page's boot, plus add ONE
  listener cell. Two edits per page:
  1. **Boot `??` clause.** In `index.md`, change `seedText` (line 78) from
     `hashDecoded ?? seedTextLiteral` to
     `resolveInitialScaleText(hashDecoded, readSharedScale(), seedTextLiteral)`
     (import `readSharedScale, resolveInitialScaleText` from `./lib/scale-store.js`).
     In `analysis.md`, change `initialScaleText` (line 70) from
     `hashDecoded ?? seedText` to
     `resolveInitialScaleText(hashDecoded, readSharedScale(), seedText)` (import
     from `../lib/scale-store.js`). **Nothing else in the boot/hash/write logic
     changes** — this is the inert-when-empty clause the R1 test guarantees.
  2. **Listener cell (NEW, additive).** Add one cell that grabs the existing
     textarea element (the `view(Inputs.textarea(...))` returns the value; capture
     the element — `Inputs.textarea` returns an element you can query, or wrap so
     the cell can reach `document.querySelector` on the page's textarea), then:
     ```
     const onScale = (e) => {
       const t = e?.detail?.text;
       if (typeof t === "string" && t.length) {
         textareaEl.value = t;
         textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
       }
     };
     window.addEventListener(SCALE_CHANGED_EVENT, onScale);
     invalidation.then(() => window.removeEventListener(SCALE_CHANGED_EVENT, onScale));
     ```
     The listener writes ONLY the textarea (never the store — R2 guard); the page's
     existing debounced hash-write picks up the synthetic `input` event through its
     unchanged code path. Import `SCALE_CHANGED_EVENT` from the store module.
  - **Implementation note for the executor:** Observable's `view(Inputs.textarea)`
    pattern means the textarea element must be reachable by the listener cell. The
    cleanest approach: assign the textarea to a named cell (e.g.
    `const scaleInput = Inputs.textarea({...}); const scaleText = view(scaleInput);`)
    so `scaleInput` IS the element and the listener cell can reference it directly.
    This is a refactor of the existing two-line textarea cell into a named-element +
    `view` pair — verify the existing `scaleText` reactive value still flows
    identically (it does; `view(el)` returns the element's value generator).
- **verify:** `npx vitest run` (R1 + dashboard-seed tests prove no boot regression);
  `npm run build`; manual: `npm run dev`, open Dashboard with no `#s=` and empty
  store → seed scale shown (unchanged); open with `#s=` → hash scale shown
  (unchanged).
- **done:** both pages import the store, use `resolveInitialScaleText` for boot, and
  have an additive `scale-changed` listener that only writes the textarea; full
  suite green; manual boot-with-empty-store is byte-identical to before.

### Task 0.5 — "Send to Dashboard / Analysis" buttons on `generate.md` (producer; the only writer)

- **files:** `src/pages/generate.md`
- **action:** Add two buttons to `generate.md`'s preview area: "Send to Dashboard →"
  and "Send to Analysis →". On click, each:
  (a) `writeSharedScale(currentScaleText, "<method-name>")` — the ONLY place the
  store is written (one-way data flow); and
  (b) optionally also navigate with `#s=` for deep-link parity, exactly like the
  dashboard's "Analyze this scale →" button (index.md:202–218): try
  `encodeScaleToHash(currentScaleText)`, `window.location.assign("../" + hash)` for
  Dashboard or `window.location.assign("./analysis" + hash)` for Analysis; catch
  RangeError → navigate without hash. The buttons read the current preview scale's
  text (serialize the previewed `Scale` to scale text — ratios for JI families, one
  cents value per line for tempered families per the Tempered-scale representation
  rule). If a live tab is already open, the store write makes it update live; if
  navigating, the hash seeds the target page. Buttons render via createElement +
  textContent.
- **verify:** `npm run build`; manual two-tab test: open Dashboard in tab A, open
  Generate in tab B (same browser context/tab — note: same-document `CustomEvent`
  is same-tab; the two-tab "live" path is via navigation/hash unless OQ-2 cross-tab
  is added). Within a single tab navigation flow: generate a scale, click "Send to
  Dashboard", confirm Dashboard opens seeded with the generated scale.
- **done:** Send-to buttons write the store (one-way) and deep-link via `#s=`;
  generated scale reaches Dashboard/Analysis; no consumer writes the store.

**Wave 0 merge gate:** `npx vitest run` (full suite, incl. R1) green +
`npm run lint:types` + `npm run lint` (R-01 ESLint green) + `npm run build`.

**OQ resolutions applied in Wave 0:** OQ-1 → `localStorage` (theme-prefs parity);
OQ-2 → single-tab `CustomEvent` only (cross-tab `storage`-event listener deferred,
additive if wanted later); OQ-3 → tempered handled via cents-text + component badge
(see representation rule).

---

# TRANCHE 1 — Exact-rational generators (hand-rolled, BigInt-pure)

**Goal:** Ship the JI core the user cares about most as transparent, owned kernel
primitives, each surfaced as a Pattern-2 method widget mounted by the picker. All
exact rational, all `S`-effort.

**Autonomous:** yes. **Depends on:** Wave 0 (page scaffold + picker host). Does NOT
depend on T2/T3.

Each task is RED→GREEN TDD: kernel test first, then kernel; then component test
(happy-dom, mirror `mos-builder.test.ts`), then component; wire into the picker.
Add every kernel symbol to INVENTORY.md.

### Task 1.1 — CPS kernel (`cps.ts`) + Hexany/Dekany/Eikosany presets

- **files:** `src/lib/cps.ts`, `src/lib/__tests__/cps.test.ts`, `src/lib/INVENTORY.md`
- **test inventory (RED first):**
  - `cps([1,3,5,7], 2)` (the 1-3-5-7 Hexany) octave-reduced == the canonical set
    `{1/1, 7/6, 5/4, 35/24, 5/3, 7/4}` + period 2/1 (assert via BigInt `n/d`
    strings, sorted by cents). This is the research's verified vector.
  - Dekany preset: `cps([1,3,5,7,9], 2)` yields 10 distinct degrees (+period).
  - Eikosany preset: `cps([1,3,5,7,9,11], 3)` yields 20 distinct degrees (+period).
  - Dedupe is exact (no float): a factor set producing a coincident product yields
    one entry.
  - Defense-in-depth: factor count cap + k bounds (`1 ≤ k ≤ factors.length`,
    factors.length capped ~ 12) → RangeError outside bounds.
- **action:** Implement `cps(factors: Interval[], k: number, period = new Interval("2/1")): Scale`
  per RESEARCH's verified pattern (lines 446–464): `kCombinations(factors, k)` from
  `xen-dev-utils`, multiply each subset (`reduce(mul, 1/1)`), `octaveReduce(period)`,
  Set-dedupe by `${n}/${d}`, sort by cents, append period (D-14). NOTE:
  `kCombinations` returns combinations of the `Interval[]` themselves (works on
  objects). Keep the result exact — the factors are `Interval`s built from integer
  ratios, so products stay BigInt-exact. INVENTORY row: `cps` → Custom, Reason
  "flagship JI structure; hand-rolled over xen-dev-utils' kCombinations for
  transparent BigInt ownership (OQ-4); SW cps is the one-line alternative."
- **verify:** `npx vitest run src/lib/cps.test.ts`
- **done:** Hexany matches canonical set exactly; presets yield correct cardinality;
  exact dedupe; caps enforced; INVENTORY updated.

### Task 1.2 — CPS method widget (`generate-cps.ts`) + picker wiring

- **files:** `src/components/generate-cps.ts`,
  `src/components/__tests__/generate-cps.test.ts`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom, mirror mos-builder.test.ts):**
  - factory returns an `HTMLElement` with a known class + heading.
  - factor-set **chips** input present (add/remove integer chips); a preset
    `<select>` (Hexany/Dekany/Eikosany/custom) that sets factors + k.
  - default render (Hexany preset) shows a `scaleTable` with the correct row count
    (6 degrees + period = 7 rows).
  - changing the preset re-renders the table (assert row count changes).
  - a Play button (`playScale`) is present.
- **action:** Build `generateCps(synth, opts)` as a Pattern-2 factory copying
  `mosBuilder`'s shape: closure-local state, status region, `replaceChildren`
  re-render, output via `scaleTable` + `playScale`. New small **chip input** for the
  factor set (add/remove integer chips — the one genuinely new input idiom;
  createElement + textContent). Preset select pre-fills (factors, k). On change,
  call `cps(...)` and render. Expose the current `Scale` so `generate.md` can
  serialize it for "Send to…". In `generate.md`, register this factory under the
  "JI combinatorial" optgroup so selecting "CPS / Hexany" mounts it into the params
  host and renders into the preview host.
- **verify:** `npx vitest run src/components/__tests__/generate-cps.test.ts`;
  `npm run build`; manual: pick CPS in the picker, see the Hexany, hear it, Send it.
- **done:** CPS widget renders/auditions, chips + preset work, mounted via the
  picker, "Send to…" serializes the CPS scale.

### Task 1.3 — `harmonic.ts` (harmonic/subharmonic segment, ADO, isoharmonic) + tests

- **files:** `src/lib/harmonic.ts`, `src/lib/__tests__/harmonic.test.ts`,
  `src/lib/INVENTORY.md`
- **test inventory (RED first):**
  - `harmonicSegment(8, 16)` → ratios `h/8` for h in 8..16, exact:
    `1/1, 9/8, 10/8(=5/4), 11/8, 12/8(=3/2), 13/8, 14/8(=7/4), 15/8, 16/8(=2/1)`
    (assert exact `n/d`).
  - `subharmonicSegment(8, 16)` → reciprocal mode (`8/h`, octave-handled), exact.
  - `adoScale(6, new Interval("2/1"))` → `7/6, 4/3, 3/2, 5/3, 11/6, 2/1` (the
    research's verified AFDO-6 vector), exact, with 1/1 + period.
  - `isoharmonic(start, diff, count)` → integer-frequency arithmetic chord over the
    lowest member, exact.
  - Defense-in-depth: `lo ≥ 1`, `hi ≤` a cap (~1024), `hi > lo`, divisions cap →
    RangeError.
- **action:** Implement all four in one `harmonic.ts` (~80 LOC total per RESEARCH).
  Pure integer/Fraction math; Set-dedupe by `${n}/${d}`; period-reduce only where
  the family calls for it (harmonic/subharmonic segments may be left unreduced as
  literal overtone scales OR octave-reduced — expose a `reduce` flag, default the
  literal overtone form; document the choice). Append period (D-14). INVENTORY rows
  for each symbol.
- **verify:** `npx vitest run src/lib/harmonic.test.ts`
- **done:** all four builders match their exact vectors; caps enforced; INVENTORY
  updated.

### Task 1.4 — Harmonic-family method widget(s) + picker wiring

- **files:** `src/components/generate-harmonic.ts`,
  `src/components/__tests__/generate-harmonic.test.ts`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom):** factory returns HTMLElement; a
  sub-method select (harmonic / subharmonic / ADO / isoharmonic); appropriate
  number inputs per sub-method (lo/hi for segments, divisions+equave for ADO,
  start/diff/count for isoharmonic); default render shows a table; changing inputs
  re-renders; Play present.
- **action:** Build `generateHarmonic(synth, opts)` Pattern-2 factory; a sub-method
  select swaps the relevant inputs; calls the matching `harmonic.ts` builder.
  Output via `scaleTable` + `playScale`. Expose current `Scale`. Register under the
  "Harmonic" optgroup in `generate.md`.
- **verify:** `npx vitest run src/components/__tests__/generate-harmonic.test.ts`;
  `npm run build`.
- **done:** harmonic family widget renders/auditions all four sub-methods, mounted
  via picker, Send works.

### Task 1.5 — `generators.ts`: diamondScale, oddLimitSet, primeLimitSet, farey, edScale + tests

- **files:** `src/lib/generators.ts`, `src/lib/__tests__/generators.test.ts`,
  `src/lib/INVENTORY.md`
- **test inventory (RED first):**
  - `diamondScale(7)` → the unique octave-reduced ratios of the 7-limit diamond
    (reuse `enumerateDiamond` from diamond.ts, take unique `cell.ratio`, ignore
    `inScale`), exact; sorted; +period.
  - `oddLimitSet(9)` → every reduced `i/j` with `oddLimit(iv) ≤ 9` in [1,2), exact,
    deduped; `primeLimitSet(5)` analog for prime limit.
  - `fareyScale(8)` → Farey order-8 fractions in [1,2) (all `a/b`, `b ≤ 8`, reduced),
    exact; assert a known small Farey set.
  - `edScale(12, new Interval("2/1"))` → **tempered** 12-EDO: 12 steps with cents
    `k*100`, constructed from cents (NOT fake ratios); assert cents values, and
    assert the scale is flagged tempered (component-level flag — kernel returns the
    cents-derived Scale; the test asserts cents, not exact ratios). `edScale(13, 3/1)`
    → ED3 tritave division.
  - Defense-in-depth caps: oddLimit/primeLimit ≤ 31 (kernel precedent), Farey order
    cap, EDO divisions cap (~1000 like analysis.md).
- **action:** Implement the four exact builders + `edScale`. diamondScale wraps
  `enumerateDiamond` (reuse, don't re-derive). oddLimitSet/primeLimitSet enumerate
  reduced ratios under the ceiling (use `oddLimit` from monzo.ts /
  `approximatePrimeLimit` set-style per RESEARCH A-2 #8). fareyScale is pure integer
  enumeration. `edScale(divisions, equave)` computes step cents
  `(k/divisions) * equave.cents` and builds each pitch from cents via `centsToRatio`
  (tempered, cents-source — DO NOT present as exact JI). INVENTORY rows for each;
  for `edScale` note "tempered: cents is source of truth (Pitfall #1); flagged
  tempered by the component."
- **verify:** `npx vitest run src/lib/generators.test.ts`
- **done:** all exact builders match vectors; edScale carries correct cents and is
  tempered-flagged at the boundary; caps enforced; INVENTORY updated.

### Task 1.6 — JI-set + EDO method widget(s) + picker wiring

- **files:** `src/components/generate-ji-set.ts`, `src/components/generate-ed.ts`,
  their `__tests__`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom):** ji-set widget: sub-method select
  (diamond / odd-limit / prime-limit / Farey) + limit/order input; renders table;
  Play. ed widget: divisions input + equave n/d ratio field (reuse mosBuilder's
  `makeRatioField` idiom); renders **tempered** table with a "tempered" badge +
  cents-primary presentation (OQ-3); Play.
- **action:** Two Pattern-2 factories. `generateJiSet` calls diamondScale /
  oddLimitSet / primeLimitSet / fareyScale by sub-method. `generateEd` calls
  `edScale`, renders with a visible "tempered" badge and cents as the primary
  column (ratio column suppressed or annotated `≈`). Both expose current `Scale`;
  for tempered, the "Send to…" serialization uses cents-per-line text. Register
  under "JI combinatorial" (ji-set) and "Regular" (ed) optgroups.
- **verify:** `npx vitest run src/components/__tests__/generate-ji-set.test.ts src/components/__tests__/generate-ed.test.ts`; `npm run build`.
- **done:** JI-set + EDO widgets render/audition, tempered badge shows for EDO,
  mounted via picker, Send works (cents-text for tempered).

**Tranche 1 merge gate:** full suite + lint + build green; every T1 kernel symbol in
INVENTORY.md; picker offers CPS, Harmonic family, JI-set family, EDO/ED-n.

---

# TRANCHE 2 — SonicWeave adapter + tempered/lattice wrappers + free-text

**Goal:** Retire the L-effort risk on the hard methods by wrapping `sonic-weave`
builtins, and ship a SonicWeave free-text escape hatch (delivers parked TEMP-07).

**Autonomous:** yes. **Depends on:** Wave 0. Independent of T1 and T3 (can be a
separate run). Shares `generate.md` (picker host) — additive registrations only.

### Task 2.1 — `sonicweave.ts` adapter + tests

- **files:** `src/lib/sonicweave.ts`, `src/lib/__tests__/sonicweave.test.ts`,
  `src/lib/INVENTORY.md`
- **test inventory (RED first):**
  - `scaleFromSonicWeave("cps([1,3,5,7], 2)")` == the Hexany (cross-check identical
    to Task 1.1's `cps(...)` output, BigInt `n/d`).
  - `scaleFromSonicWeave("rank2(3/2, 5, 1)")` == `buildMos(3/2, 2/1, 7)` exactly
    (the research's verified Pythagorean-diatonic equivalence — strong cross-kernel
    regression).
  - **Tempered detection:** a tempered expression (e.g. `wellTemperament(...)` or a
    tempered `rank2`) returns a scale flagged tempered with cents as source — assert
    the discriminator (`iv.value instanceof TimeReal` per Assumption A4; verify the
    exact type at implementation time, fall back to try/catch `.toFraction()`).
  - R-01 boundary: a rational result's intervals are our BigInt `Interval`s
    (round-tripped via `${n}/${d}`), NOT SonicWeave's Fraction object.
  - Input-length cap (reuse `MAX_SCALE_TEXT_BYTES`); malformed expression →
    structured error (never throws uncaught; returns `{ scale: null, error }` or
    throws a typed error the component catches — choose and document).
- **action:** Implement `scaleFromSonicWeave(src): { scale, tempered, error? }`
  (or `Scale` + a tempered flag) per RESEARCH's verified adapter (lines 420–443):
  `evaluateSource(src, /*includePrelude=*/true).currentScale`, map each `Interval`:
  rational → `.toFraction()` → `${n}/${d}` BigInt round-trip (R-01); tempered →
  `.totalCents()` → `centsToRatio` (cents-source, set tempered flag). Cap input
  length; try/catch → structured error. Verify the rational-vs-real discriminator
  empirically (A4) rather than relying on try/catch alone. INVENTORY row:
  `scaleFromSonicWeave` → Custom adapter wrapping `sonic-weave@0.14.1`, Reason
  "delivers rank-2/well-temperament/Fokker + free-text via one already-installed
  dep; R-01 round-trip at the boundary; tempered → cents-source."
- **verify:** `npx vitest run src/lib/sonicweave.test.ts`
- **done:** adapter round-trips rational exactly (cross-checked vs `cps`/`buildMos`),
  flags tempered, enforces R-01 at the boundary, caps input, never throws uncaught;
  INVENTORY updated.

### Task 2.2 — SonicWeave free-text input widget + picker wiring

- **files:** `src/components/generate-sonicweave.ts`,
  `src/components/__tests__/generate-sonicweave.test.ts`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom):** factory returns HTMLElement with a
  `<textarea>` + "Evaluate" button + status region; entering `cps([1,3,5,7], 2)` +
  Evaluate renders a table (7 rows); a malformed expression surfaces an error in the
  status region (textContent, never innerHTML) and preserves the prior render; the
  scale is exposed for "Send to…".
- **action:** Pattern-2 factory: `<textarea>` (length-capped), "Evaluate" button
  (evaluate on click, NOT per keystroke — Pitfall A2/4), status region for errors.
  Calls `scaleFromSonicWeave`; renders via `scaleTable` + `playScale`; shows a
  "tempered" badge when the result is tempered. Register under a fifth "SonicWeave
  expression" picker option (its own optgroup).
- **verify:** `npx vitest run src/components/__tests__/generate-sonicweave.test.ts`;
  `npm run build`.
- **done:** free-text SonicWeave input evaluates on demand, renders/auditions, shows
  errors safely, flags tempered, Send works.

### Task 2.3 — Rank-2 / well-temperament / Fokker form widgets + picker wiring

- **files:** `src/components/generate-rank2.ts`,
  `src/components/generate-welltemp.ts`, `src/components/generate-fokker.ts`,
  their `__tests__`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom):**
  - rank2 widget: generator (n/d ratio OR cents toggle), up/down counts, period;
    pure-ratio path renders exact JI; cents/tempered path renders a tempered table
    with badge; `rank2(3/2,5,1)`-equivalent inputs reproduce the Pythagorean
    diatonic.
  - well-temperament widget: comma-fraction inputs + comma select; renders tempered
    table with badge.
  - fokker widget: basis chips + per-axis extents; renders an exact rational block
    (delivers parked TEMP-08); cardinality matches the chosen extents.
- **action:** Three Pattern-2 factories that build the corresponding SonicWeave
  expression from typed params and call `scaleFromSonicWeave`. rank2 offers a
  POTE/TE/CTE/pure tuning select (RESEARCH A-1 #3). All tempered results carry the
  badge + cents-primary table; exact results (pure-ratio rank2, Fokker) render
  ratios normally. Expose current `Scale`. Register rank2 + well-temperament under
  "Regular", Fokker under "Advanced".
- **verify:** `npx vitest run src/components/__tests__/generate-rank2.test.ts src/components/__tests__/generate-welltemp.test.ts src/components/__tests__/generate-fokker.test.ts`; `npm run build`.
- **done:** rank-2 (pure + tempered), well-temperament, and Fokker block widgets
  render/audition via the SonicWeave adapter, tempered badge correct, mounted via
  picker, Send works.

**Tranche 2 merge gate:** full suite + lint (R-01 ESLint must stay green — watch the
SonicWeave Fraction boundary) + build green; adapter cross-checks vs `cps`/`buildMos`
pass; INVENTORY updated.

---

# TRANCHE 3 — Preview viz + transforms + Wilson/metallic + constant-structure

**Goal:** The "shape at a glance" preview (Leimma lesson) and the cheap polish that
applies to every generator, plus the remaining advanced methods.

**Autonomous:** yes. **Depends on:** Wave 0 + at least one of T1/T2 (needs scales to
preview). Independent ordering otherwise.

### Task 3.1 — Circle-of-pitches preview viz + tests

- **files:** `src/components/circle-of-pitches.ts`,
  `src/components/__tests__/circle-of-pitches.test.ts`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom):** factory `(scale, synth, opts) =>
  HTMLElement` returns an `<svg>`; N degree markers placed at their cents angle
  (assert marker count == scale length); rim labels via textContent (never
  innerHTML); clicking a marker calls `synth.playNote` (assert via stub synth);
  octave-only/empty scales render an empty-state (mirror lattice's empty handling).
- **action:** Plain `createElementNS` SVG ring (~60 LOC per RESEARCH; the
  `keyboard.ts` component is the precedent — no d3 needed). Each degree placed at
  angle `cents / period.cents * 2π`; labels around the rim; click → audition.
  Mount in `generate.md`'s preview host alongside `scaleTable` so every method's
  result shows both. Pattern-2 factory; XSS discipline.
- **verify:** `npx vitest run src/components/__tests__/circle-of-pitches.test.ts`;
  `npm run build`.
- **done:** circle viz renders degree markers + labels + click-audition for any
  Scale, empty-state safe, wired into the preview area.

### Task 3.2 — Rotate-to-mode + transform strip (reduce/dedupe/transpose) + tests

- **files:** `src/components/scale-transform-strip.ts`,
  `src/components/__tests__/scale-transform-strip.test.ts`, `src/pages/generate.md`
- **test inventory (RED first, happy-dom):** a "rotate to mode N" select wired to
  `Scale.rotate` (assert the previewed table changes to the rotated scale); reduce /
  dedupe / transpose-by-ratio controls calling the existing `Scale` methods;
  transforms compose and re-render; the transformed scale is what "Send to…"
  serializes.
- **action:** A Pattern-2 strip that post-processes the current preview `Scale` via
  the existing `Scale.rotate/reduce/dedupe/transpose` (all already in scale.ts) and
  re-renders the preview. transpose uses a `makeRatioField`-style n/d input. This is
  cheap polish that applies to EVERY generator's output (RESEARCH A-5). Mount above
  the "Send to…" buttons so the sent scale reflects transforms.
- **verify:** `npx vitest run src/components/__tests__/scale-transform-strip.test.ts`;
  `npm run build`.
- **done:** rotate-to-mode + reduce/dedupe/transpose work on any previewed scale and
  feed "Send to…".

### Task 3.3 — Wilson recurrence / metallic (`meru.ts`) + constant-structure + widgets

- **files:** `src/lib/meru.ts`, `src/lib/__tests__/meru.test.ts`,
  `src/components/generate-meru.ts`, `src/components/generate-cs.ts`, their
  `__tests__`, `src/pages/generate.md`, `src/lib/INVENTORY.md`
- **test inventory (RED first):**
  - `meru.ts`: recurrence `x_n = a·x_{n-1} + b·x_{n-2}`; Fibonacci (a=1,b=1) →
    successive-ratio convergents (exact rational) AND the metallic limit (φ ≈
    833.09¢, tempered/cents-source). Assert a known convergent set is exact; assert
    the metallic-limit cents. Caps on term count.
  - constant-structure widget: `csgs(generators, ordinal)` / `gs(...)` via the
    SonicWeave adapter (T2 dependency for this sub-method) — assert a small CS scale
    renders.
- **action:** Hand-roll `meruScale` (recurrence → ratios; convergents exact, metallic
  limit cents-source per RESEARCH A-4 #15). Constant-structure via
  `scaleFromSonicWeave("csgs(...)")` (so generate-cs depends on T2's adapter — if T2
  not yet built, gate this sub-task). Two Pattern-2 widgets. INVENTORY row for
  `meruScale`.
- **verify:** `npx vitest run src/lib/meru.test.ts src/components/__tests__/generate-meru.test.ts src/components/__tests__/generate-cs.test.ts`; `npm run build`.
- **done:** Wilson/metallic + constant-structure widgets render/audition (metallic
  limit tempered-flagged), mounted via picker, Send works; INVENTORY updated.

**Tranche 3 merge gate:** full suite + lint + build green; INVENTORY updated.

---

## Dependency ordering (which waves are independent)

```
Wave 0  ──┬── Tranche 1  (exact-rational; independent of T2/T3)
          ├── Tranche 2  (SonicWeave; independent of T1; needs Wave 0 only)
          └── Tranche 3  (viz/transforms/advanced; needs Wave 0 + ≥1 of T1/T2;
                          generate-cs sub-task needs T2's adapter)
```

- **Wave 0 must land first** (page scaffold + store + R1 gate). Everything else
  mounts into the `generate.md` picker host Wave 0 creates.
- **T1 and T2 are mutually independent** — either can be run first. Both only add
  picker registrations (additive edits to `generate.md`) + new kernel/component
  files; no file-ownership conflict except `generate.md` and `INVENTORY.md`, which
  are append-only here, so sequence the two runs (don't run T1 and T2 truly
  concurrently against the same `generate.md`).
- **T3 needs Wave 0 + at least one scale-producing tranche** to have something to
  preview/transform; its `generate-cs` sub-task additionally needs T2's adapter.
- **Within a tranche, tasks are ordered** kernel → component → picker-wiring (the
  interface-first ordering: the kernel contract exists before the component
  consumes it).

## New kernel symbols → INVENTORY.md (consolidated)

Add under a new section `## Quick 260608-dyv — scale generation`:

| Symbol | File | Source | Reason / Notes |
|--------|------|--------|----------------|
| `scale-store` (consts + `readSharedScale`/`writeSharedScale`/`resolveInitialScaleText`) | `scale-store.ts` | Custom | theme-prefs.ts carve-out twin; localStorage `tuning-systems:scale` + `CustomEvent`; one-way (only Send-to writes); `resolveInitialScaleText` = `hash ?? store ?? seed`. |
| `cps` | `cps.ts` | Custom over `xen-dev-utils.kCombinations` | Flagship JI CPS; hand-rolled for transparent BigInt ownership (OQ-4). |
| `harmonicSegment`, `subharmonicSegment`, `adoScale`, `isoharmonic` | `harmonic.ts` | Custom | Purest JI (literal integer harmonics); exact rational. |
| `diamondScale`, `oddLimitSet`, `primeLimitSet`, `fareyScale` | `generators.ts` | Custom (diamondScale wraps `enumerateDiamond`) | Exact rational JI sets. |
| `edScale` | `generators.ts` | Custom | EDO / ED-n; **tempered** (cents source of truth; flagged tempered at component boundary). |
| `scaleFromSonicWeave` | `sonicweave.ts` | Custom adapter over `sonic-weave@0.14.1` | rank-2/well-temperament/Fokker + free-text; R-01 round-trip at boundary; tempered → cents. |
| `meruScale` | `meru.ts` | Custom | Wilson recurrence/metallic; convergents exact, metallic limit cents-source. |

(Component symbols — `generateCps`, `generateHarmonic`, `generateJiSet`,
`generateEd`, `generateSonicweave`, `generateRank2`, `generateWelltemp`,
`generateFokker`, `circleOfPitches`, `scaleTransformStrip`, `generateMeru`,
`generateCs` — are also listed in INVENTORY per the existing
"components listed for discoverability" convention.)

---

## Risk / regression section (centered on the additive-integration constraint)

This is the user's #1 sensitivity. The integration is strictly additive; the
neutralizations below come straight from RESEARCH Half C and are encoded as tasks.

| # | Risk | Trigger | Neutralization (where enforced) |
|---|------|---------|---------------------------------|
| **R1** | **Boot regression** — store seeds a page that should show seed/hash. | Store non-empty on unrelated load. | C-3 precedence `hash ?? store ?? seed`; store empty by default → boot byte-identical. **Enforced by the R1 boot-equivalence test (Task 0.2) — the wave gate, RED→GREEN before any Send-to wiring (Task 0.4/0.5).** |
| R2 | **Infinite event loop** — consumer writes store → re-broadcast. | Listener writing back to the store. | One-way data flow: ONLY "Send to…" writes the store (Task 0.5); listeners write ONLY the textarea (Task 0.4). Encoded as the explicit listener contract. |
| R3 | **Synthetic-input feedback.** | Dispatched `input` event. | Identical to a real keystroke; page already debounces (300 ms) + re-parses idempotently. Set `value` before dispatch. |
| R4 | **localStorage throws** (private browsing). | `getItem`/`setItem` in locked-down contexts. | `readSharedScale`/`writeSharedScale` try/catch → `null`/no-op (Task 0.1 tests cover this; mirrors theme-prefs T-9mn-03). Degrades to copy/paste + hash. |
| R5 | **Oversized/malformed stored text** reaches a parser. | Tampered localStorage. | Length cap `MAX_SCALE_TEXT_BYTES` (8 KB) + shape validation in `readSharedScale` (Task 0.1); pages already wrap `parseScala` in try/catch. Malformed → null → seed. |
| R6 | **Stale store across sessions** overrides today's seed. | localStorage persists. | Intended "remember last scale" (OQ-1 → localStorage). Hash always still wins, so sharing unaffected. If undesired later, switch to `sessionStorage` (1-line change). |
| R7 | **Cross-tab vs same-tab events.** | Two tabs open. | Same-document `CustomEvent` covers the single-tab live requirement (OQ-2 → ship single-tab). A native `storage`-event listener for true cross-tab is additive/optional, deferred. |

**Other regression guards baked into the plan:**

- **Tempered laundering (Pitfall #1).** EDO/rank-2/well-temperament scales carry
  cents as source; ratio column flagged "tempered" / shown `≈`; Send-to serializes
  cents-text. Enforced in Tasks 1.5/1.6, 2.1/2.3, 3.3.
- **R-01 boundary (Pitfall #4).** Every `xen-dev-utils`/SonicWeave Fraction
  round-trips via `${n}/${d}`; R-01 ESLint stays green at each merge gate. Watched
  especially in Task 2.1.
- **Synth/listener re-binding (Pitfall #11).** Page synth + `scale-changed` listener
  bound in dedicated cells with `invalidation.then(cleanup)`; never per-input.
- **No kernel-type churn.** This feature adds NO field to `Interval`/`Scale` (the
  dashboard depends on them); tempered-ness lives at the component boundary. Keeps
  the existing 192-test suite stable.
- **Append-only shared files.** `generate.md` and `INVENTORY.md` are extended
  additively per tranche; sequence tranche runs to avoid concurrent edits to them.

---

## Multi-source coverage audit

**GOAL (CONTEXT):** new scale-generation surface generating JI/tempered/harmonic
scales across 4 families + live Dashboard/Analysis integration → COVERED (Wave 0
integration + T1–T3 across all four families).

**Locked decisions (CONTEXT):**
- New `generate.md` tab, nav between Analysis and Theory, method picker + params +
  preview + audition + Send-to → COVERED (Wave 0 Task 0.3, 0.5; picker grows per
  tranche).
- All four families (Regular / JI-combinatorial / Harmonic / Advanced) → COVERED
  (Regular: edScale T1.5/1.6 + rank2/well-temp T2.3; JI-comb: CPS T1.1/1.2 +
  diamond/odd/prime/Farey T1.5/1.6 + Euler genus via SonicWeave T2.2; Harmonic:
  T1.3/1.4; Advanced: Fokker T2.3 + Wilson/metallic + CS T3.3).
- Live shared state, additive, theme-prefs pattern, `#s=` backbone, opt-in
  listeners, empty-store byte-identical boot → COVERED (Wave 0, with R1 as gate).

**RESEARCH:** method menu (A-0 table), UI recommendation (B-2), SonicWeave exposure
(B-3 → T2.2), integration design (Half C → Wave 0), tranche sequencing (→ this
plan's Wave 0 + T1/T2/T3), pitfalls (→ Conventions + Risk section), test map (→
per-task test inventories) → COVERED.

**Excluded (not gaps):** harmonic-entropy-guided selection (needs `harmonic-entropy`
dep, parked TEMP-05 → out of v1, RESEARCH-stated); tetrachordal Chalmers builder
(deferred, lower demand, RESEARCH-stated); cross-tab `storage` sync (OQ-2 optional);
staff notation / MIDI bridge (out of scope per CONTEXT Deferred Ideas);
`xen-dev-utils` 0.15.0 upgrade (explicitly out of scope).

No unplanned source items. No PHASE SPLIT needed — the feature is already split into
independently executable waves/tranches per the user's plan-only directive.
