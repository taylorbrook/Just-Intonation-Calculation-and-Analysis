---
phase: quick-260512-dcp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/edo-approximation.md
  - observablehq.config.ts
autonomous: true
requirements:
  - QUICK-260512-dcp
must_haves:
  truths:
    - "User can navigate to /pages/edo-approximation from the Theory notes sidebar (entry placed AFTER 'Meantone' and BEFORE 'The schisma')"
    - "Page renders prose explaining how N-EDOs approximate 5-limit and 7-limit JI, using 12-, 19-, 31-, and 53-EDO as the four worked examples"
    - "Page renders a deviation table with rows = {12-EDO, 19-EDO, 31-EDO, 53-EDO} and columns = {3/2, 5/4, 7/4, 9/8, 11/8}; each cell shows nearest step k and signed cents deviation Δ¢ (rendered like 'k @ ±Δ¢')"
    - "Per-cell math mirrors bestEdosForScale's nearest-step calculation (step = Math.round(idealCents / stepCents); error = step * stepCents − idealCents) — computed inline on the page, NOT exposed as a new export from src/lib/edo.ts (the calc is two lines per pair and belongs at the display layer)"
    - "Headline highlight: 31-EDO's nearest step to 7/4 is step 25 (967.742¢), only ~1.08¢ off pure 968.826¢ — the prose calls this out as why 31-EDO is famous for 7-limit harmony; the table's 31-EDO/7-4 cell makes it visible"
    - "Headline highlight: 53-EDO's nearest step to 3/2 is step 31 (701.887¢), only ~0.07¢ off pure 701.955¢; the prose defines Mercator's comma (53 pure 5ths vs 31 octaves ≈ 3.615¢) as the 3-limit analogue of the Pythagorean comma — and explains that 53-EDO IS the closure of that cycle"
    - "Foil highlight: 12-EDO's nearest step to 7/4 is step 10 (1000¢), off by +31.17¢ — the prose calls this out as why 12-TET has no 7-limit harmony; 12-EDO's 11/8 row is similarly stark (~+48.7¢)"
    - "Page has three audition buttons: pure 7/4 (kernel-exact via playInterval), 31-EDO's nearest step to 7/4 at 25/31 octave = 967.742¢ (built via centsToRatio at the audio boundary, custom .play-btn), and 12-EDO's 7/4 approximation = step 10 = 1000¢ (also built via centsToRatio); user can hear that 31-EDO is audibly close to pure 7/4 and 12-EDO is audibly different"
    - "Page cross-links to /pages/analysis (the interactive EDO ↔ JI dashboard) and /pages/pythagorean-comma (Mercator's comma is its 53-fifths analogue)"
    - "AudioContext is NOT created on page load — only on first button click (Pattern 4 / Pitfall #2)"
    - "Cross-page navigation does not leak the AudioContext (invalidation.then(synth.dispose))"
  artifacts:
    - path: "src/pages/edo-approximation.md"
      provides: "Theory page mirroring meantone.md / syntonic-comma.md cell discipline; covers 12-/19-/31-/53-EDO approximation of 5-limit and 7-limit JI with kernel-exact Intervals + cents-layer step-nearest computation + DOM deviation table + three play buttons"
      contains: "31-EDO"
    - path: "observablehq.config.ts"
      provides: "Sidebar registration entry for EDO approximations, positioned immediately after Meantone and before The schisma"
      contains: "edo-approximation"
  key_links:
    - from: "src/pages/edo-approximation.md"
      to: "src/audio/synth.ts (createSynth)"
      via: "import + cell-owned synth"
      pattern: 'import.*createSynth.*from "../audio/synth.js"'
    - from: "src/pages/edo-approximation.md"
      to: "src/lib/interval.ts (Interval)"
      via: "kernel-exact Intervals for 3/2, 5/4, 7/4, 9/8, 11/8"
      pattern: 'import.*Interval.*from "../lib/interval.js"'
    - from: "src/pages/edo-approximation.md"
      to: "src/lib/cents.ts (centsToRatio)"
      via: "cents → ratio at the audio boundary for irrational EDO-step pitches"
      pattern: 'import.*centsToRatio.*from "../lib/cents.js"'
    - from: "src/pages/edo-approximation.md"
      to: "src/components/play-interval.ts + src/components/ratio-pill.ts"
      via: "playInterval for kernel-exact 7/4, ratioPill for inline prose ratios"
      pattern: "playInterval\\("
    - from: "observablehq.config.ts Theory notes group"
      to: "/pages/edo-approximation"
      via: "pages array entry placed after Meantone, before The schisma"
      pattern: "EDO approximations.*edo-approximation"
---

<objective>
Add an `edo-approximation` theory page that explains how 12-, 19-, 31-, and 53-EDO approximate 5-limit and 7-limit JI. The page is the prose companion to the analysis dashboard's interactive EDO ↔ JI table: it picks four canonical EDOs and five canonical JI intervals (3/2, 5/4, 7/4, 9/8, 11/8) and renders a single deviation matrix that makes the differences scannable. The pedagogical headlines are (1) 31-EDO's near-perfect 7/4 (~1.08¢ off pure) is why 31-EDO is famous for 7-limit harmony, (2) 53-EDO closes the 53-fifths-vs-31-octaves cycle (Mercator's comma, ~3.615¢), the 3-limit analogue of the Pythagorean comma, and (3) 12-EDO's catastrophic 7/4 (+31.17¢) and 11/8 (+48.7¢) are why 12-TET has no 7-limit harmony.

The math mirrors the nearest-step calculation already in `src/lib/edo.ts`'s `bestEdosForScale` (`step = Math.round(ideal / stepCents)`; `error = step * stepCents − ideal`). Per the orchestrator's important_clarifications: the calc is two lines per (interval, EDO) pair and belongs on the page at the display layer — NOT as a new export from `src/lib/edo.ts`. The kernel touches only the rational anchors (Interval for 3/2, 5/4, 7/4, 9/8, 11/8); cents arithmetic lives at the cell boundary; cents-to-Hz for audition goes through the existing `centsToRatio` (added in 260512-d38).

Purpose: This page is the temperament thread's next step after `/pages/meantone`. Meantone narrows the fifth to absorb the syntonic comma; EDOs go all the way and quantize every interval to N equal steps. The page makes vivid which JI intervals a given EDO can or cannot reach, and points the user at the interactive `/pages/analysis` dashboard for arbitrary EDOs and limits.

Output: One new Markdown page + one sidebar entry; single atomic feat commit.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/pages/meantone.md
@src/pages/syntonic-comma.md
@src/pages/pythagorean-tuning.md
@src/pages/pythagorean-comma.md
@src/audio/synth.ts
@src/components/play-interval.ts
@src/components/ratio-pill.ts
@src/lib/interval.ts
@src/lib/cents.ts
@src/lib/edo.ts
@src/lib/scale.ts
@observablehq.config.ts

<interfaces>
<!-- Key types and helpers the executor needs. Use these directly — no codebase exploration. -->

From src/lib/interval.ts:
```typescript
export class Interval {
  readonly fraction: Fraction;          // BigInt-backed (R-01)
  get cents(): number;                  // lazy display projection
  mul(other: Interval): Interval;       // immutable (D-24)
  div(other: Interval): Interval;
  octaveReduce(period?: Interval): Interval;
  toString(): string;
}
// Construct from a string ratio: new Interval("7/4")
```

From src/lib/cents.ts (ALREADY EXISTS — added in 260512-d38):
```typescript
export function toCents(value: number | number[]): number;       // ratio → cents
export function centsFrom12tet(cents: number): number;
export function centsToRatio(cents: number): number;             // cents → ratio (display/audio only, Pitfall #1)
```

From src/audio/synth.ts:
```typescript
export interface SynthHandle {
  playNotes(freqs: number[], dur?: number): void;
  dispose(): void;
}
export function createSynth(opts?: CreateSynthOpts): SynthHandle;
```

From src/components/play-interval.ts:
```typescript
export function playInterval(interval: Interval, synth: SynthHandle, opts?: PlayIntervalOpts): HTMLButtonElement;
// Returns a ▶ button; opts.label = true to show the ratio next to ▶.
// REQUIRES a kernel-exact Interval — cannot be used for irrational EDO-step pitches.
// For irrational pitches, build a custom button that calls synth.playNotes directly.
```

From src/components/ratio-pill.ts:
```typescript
export function ratioPill(interval: Interval): HTMLElement;
```

Reference — the nearest-step math from src/lib/edo.ts `bestEdosForScale` (DO NOT import — re-derive on the page; this is two lines per cell):
```typescript
// For an EDO with `edoSteps`:
const stepCents = 1200 / edoSteps;
const nearest = Math.round(idealCents / stepCents);   // step index (0..edoSteps)
const actual  = nearest * stepCents;                  // the EDO step's cents
const error   = actual - idealCents;                  // signed deviation (¢)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/pages/edo-approximation.md + register sidebar entry between Meantone and The schisma</name>
  <files>src/pages/edo-approximation.md, observablehq.config.ts</files>
  <action>

**Step A — Create `src/pages/edo-approximation.md`.**

Mirror the cell discipline of `src/pages/meantone.md` (the closest analog: kernel-exact rational anchors + cents-layer derived values + DOM table built with createElement + textContent + audition cell with both kernel-exact `playInterval` buttons and a custom `playTempered`-style button for irrational pitches).

**Page structure (in this order):**

1. **Title + one-line tagline:**
   - `# EDO approximations of JI`
   - Tagline: `How 12-, 19-, 31-, and 53-EDO map onto 5-limit and 7-limit just intonation.`

2. **Imports cell** (TypeScript fenced as ` ```ts `):
   ```ts
   import { Interval } from "../lib/interval.js";
   import { centsToRatio } from "../lib/cents.js";
   import { createSynth } from "../audio/synth.js";
   import { ratioPill } from "../components/ratio-pill.js";
   import { playInterval } from "../components/play-interval.js";
   ```

   Note: do NOT import `jiSubsetOfEdo` or `bestEdosForScale`. The orchestrator's important_clarification #2 is explicit — the inverse mapping (per-JI nearest step) is computed inline on the page, not via a new kernel export. The math is `Math.round` of two cents values; it belongs at the display layer.

3. **Synth cell** (verbatim discipline from meantone.md / syntonic-comma.md — own cell, no dependencies on other cells):
   ```ts
   // Synth cell — owns this page's AudioContext (ARCHITECTURE Pattern 4 / Pitfall #2).
   // Must NOT depend on any other cell. The lazy createSynth() does not allocate the
   // AudioContext until the first playNote / playNotes call (i.e. the first user click),
   // so simply rendering this page does not create an AudioContext.
   const synth = createSynth();
   invalidation.then(() => synth.dispose());
   ```

4. **Kernel-exact JI anchors cell** — declare the five rational anchors as Interval instances (R-01: BigInt path via string constructor):

   ```ts
   // Kernel-exact JI anchors (Pitfall #1: BigInt Fraction is the source of truth).
   // The five intervals we ask each EDO to hit:
   const fifth      = new Interval("3/2");   //   701.955¢ — 3-limit
   const majorThird = new Interval("5/4");   //   386.314¢ — 5-limit
   const harm7      = new Interval("7/4");   //   968.826¢ — 7-limit ("harmonic 7th")
   const majorWhole = new Interval("9/8");   //   203.910¢ — 5-limit major whole tone
   const harm11     = new Interval("11/8");  //   551.318¢ — 11-limit (tritone neighbour)
   const jiIntervals = [
     { label: "3/2",  iv: fifth },
     { label: "5/4",  iv: majorThird },
     { label: "7/4",  iv: harm7 },
     { label: "9/8",  iv: majorWhole },
     { label: "11/8", iv: harm11 },
   ];
   const edos = [12, 19, 31, 53];
   ```

5. **Per-EDO nearest-step cell** — compute each (EDO, JI) cell of the table at the display layer. This mirrors `bestEdosForScale`'s nearest-step math (see interfaces above). A code comment makes the parity explicit:

   ```ts
   // Cents-layer nearest-step calc (Pitfall #1: NEVER used as kernel input).
   // Mirrors the math in src/lib/edo.ts bestEdosForScale:
   //   stepCents = 1200 / N
   //   nearest   = Math.round(idealCents / stepCents)
   //   error     = nearest * stepCents − idealCents   (signed; positive = EDO step is sharp of JI)
   //
   // For each EDO N and each JI anchor we record the step number and the signed
   // cents deviation; cells render as "k @ ±Δ¢".
   const approxMatrix = edos.map((N) => {
     const stepCents = 1200 / N;
     const cells = jiIntervals.map(({ label, iv }) => {
       const ideal = iv.cents;
       const step = Math.round(ideal / stepCents);
       const actual = step * stepCents;
       const error = actual - ideal;
       return { label, step, error };
     });
     return { N, cells };
   });
   ```

6. **Deviation table cell** — render a plain DOM table (T-02-22: createElement + textContent only, NO innerHTML interpolation). Rows = EDOs, columns = JI intervals; cell format = "k @ ±Δ¢" with the error shown to 2 decimal places and a leading + sign for positive deviations (sign makes "sharp vs flat" scannable at a glance):

   ```ts
   // Plain DOM table — no component, no innerHTML interpolation (Pitfall: T-02-22 XSS).
   // All cell contents are textContent on real elements. Precision 2 decimals on the
   // cents error (Pitfall #16 — 0.1¢ is the minimum; 2 decimals is enough resolution
   // to separate 31-EDO's 5/4 deviation (~+0.78¢) from its 7/4 deviation (~−1.08¢)
   // without visual noise).
   const deviationTable = (() => {
     const fmtErr = (e) => {
       const rounded = Number(e.toFixed(2));
       const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
       return `${sign}${Math.abs(rounded).toFixed(2)}¢`;
     };
     const table = document.createElement("table");
     const thead = document.createElement("thead");
     const headerRow = document.createElement("tr");
     const corner = document.createElement("th");
     corner.textContent = "EDO";
     headerRow.appendChild(corner);
     for (const { label } of jiIntervals) {
       const th = document.createElement("th");
       th.textContent = label;
       headerRow.appendChild(th);
     }
     thead.appendChild(headerRow);
     table.appendChild(thead);
     const tbody = document.createElement("tbody");
     for (const { N, cells } of approxMatrix) {
       const tr = document.createElement("tr");
       const rowLabel = document.createElement("th");
       rowLabel.scope = "row";
       rowLabel.textContent = `${N}-EDO`;
       tr.appendChild(rowLabel);
       for (const c of cells) {
         const td = document.createElement("td");
         td.textContent = `${c.step} @ ${fmtErr(c.error)}`;
         tr.appendChild(td);
       }
       tbody.appendChild(tr);
     }
     table.appendChild(tbody);
     return table;
   })();
   ```

   Render with `display(deviationTable)` at the appropriate prose anchor (see step 8).

7. **Audition cell** — three play buttons. The pure 7/4 button is kernel-exact via `playInterval`. The 31-EDO and 12-EDO 7/4 approximations are irrational by construction (multiples of 1200/N), so they go through the same `playTempered` custom-button pattern used in meantone.md — `centsToRatio` at the audio boundary, `.play-btn` class so it inherits the global theme:

   ```ts
   // Custom button for the irrational EDO-step pitch. Same pattern as meantone.md:
   // .play-btn class for global theming, centsToRatio at the audio boundary, synth.playNotes
   // called directly. Pitfall #1: the cents value never becomes kernel input.
   const playStepAt = (label, cents) => {
     const btn = document.createElement("button");
     btn.className = "play-btn";
     btn.type = "button";
     btn.textContent = `▶ ${label}`;
     btn.setAttribute("aria-label", label);
     btn.addEventListener("click", () => {
       const baseHz = 440;                                  // D-08
       const ratio = centsToRatio(cents);                   // display/audio projection
       synth.playNotes([baseHz, baseHz * ratio], 1.5);      // D-18 default duration
     });
     return btn;
   };

   // 31-EDO step 25 = (25/31) * 1200 = 967.741935...¢ — ~1.08¢ flat of pure 7/4.
   // 12-EDO step 10 = (10/12) * 1200 = 1000¢ — +31.17¢ sharp of pure 7/4.
   const cents31_25 = (25 / 31) * 1200;
   const cents12_10 = (10 / 12) * 1200;

   const playPure7  = playInterval(harm7, synth, { label: true });
   const play31_7   = playStepAt("Play 31-EDO step 25 (≈ 967.74¢)", cents31_25);
   const play12_7   = playStepAt("Play 12-EDO step 10 (1000¢)", cents12_10);
   ```

8. **Prose** (KaTeX via `` ${tex`...`} `` inline; cross-links per scope_specifics):

   - **Lead paragraph:**
     A [chain of pure 5ths](/pages/pythagorean-tuning) does not close into octaves; [meantone](/pages/meantone) narrows each 5th to absorb the [syntonic comma](/pages/syntonic-comma). An **equal division of the octave** (EDO) goes one step further: divide ${tex`2/1`} into ${tex`N`} equal steps of ${tex`1200/N`} cents and quantize *every* interval to the nearest step. The question becomes: for a given ${tex`N`}, how good is the approximation of the JI ratios we care about?

   - **The construction:**
     For an N-EDO with step size ${tex`s = 1200/N`} cents and a JI target at ${tex`c`} cents, the nearest step is ${tex`k = \mathrm{round}(c/s)`} and the deviation is ${tex`\Delta = k \cdot s - c`} (positive = the EDO step is sharp of JI). This is the same nearest-step math used by the [analysis dashboard](/pages/analysis)'s EDO ↔ JI ranker.

   - **The four canonical EDOs.** Each row trades a different consonance:

     - **12-EDO** is the modern default. 5/4 and 9/8 land within ~14¢ and ~4¢ respectively — usable for 5-limit harmony in passing, though no 5-limit triad is just-intoned. 7/4 and 11/8 are out of reach.
     - **19-EDO** is the 5-limit specialist. Major thirds land closer to pure 5/4 than 12-EDO does, and the minor third lands very close to pure 6/5. Used historically as a meantone-extension target.
     - **31-EDO** is the 7-limit revelation. Step 25 lands within ~1.08¢ of pure 7/4 and step 10 within ~0.78¢ of pure 5/4 — both essentially just-intoned. 31-EDO is what microtonal composers reach for when they want a closed system that does 7-limit harmony.
     - **53-EDO** closes the cycle of 5ths. Step 31 lands within ~0.07¢ of pure 3/2; stack 53 of them and you arrive within a few cents of 31 octaves. The leftover — ${tex`(3/2)^{53} / 2^{31} \approx 3.615\text{¢}`} — is **Mercator's comma**, the 3-limit cousin of the [Pythagorean comma](/pages/pythagorean-comma) (Pythagorean's 12 pure 5ths vs 7 octaves becomes Mercator's 53 pure 5ths vs 31 octaves). 53-EDO IS the closure of that longer chain.

   - **The deviation table.** Drop the table into the page here:

     ```ts
     display(deviationTable);
     ```

     Rows are EDOs, columns are JI targets; each cell shows the nearest step and signed deviation in cents.

   - **What the table says** — three highlights:

     - **31-EDO is the 7-limit winner.** Compare the 7/4 column across the four rows: 12-EDO's step 10 is +31.17¢ off pure 7/4 — completely uninflected, this is why 12-TET has no 7-limit harmony. 19-EDO's step 15 is ~−21¢ off, still too far. 31-EDO's step 25 lands within ~1.08¢ — essentially just-intoned. 53-EDO's step 43 is also very close (~+4.8¢) but 31-EDO is the smallest closed system that gets here.
     - **53-EDO is the 3-limit winner.** The 3/2 column tells the story: 12-EDO's 5th is ~−2¢ off pure; 19-EDO's is ~−7¢; 31-EDO's is ~−5¢; 53-EDO's is ~−0.07¢. For ear training, drone music, and any context where pure 5ths matter, 53-EDO is essentially indistinguishable from JI.
     - **12-EDO can't do 11.** 11/8 sits at ${tex`\approx 551.3\text{¢}`}; 12-EDO's nearest step is the tritone at 600¢, off by ~+48.7¢ — that's nearly half a semitone. 31-EDO's step 14 lands within ~1.1¢. The 11-limit is where the gap between 12-EDO and microtonal EDOs becomes the most audible.

   - **Audition — pure vs 31-EDO vs 12-EDO 7/4.**

     - ${playPure7} sounds the pure ${ratioPill(harm7)} (${tex`\approx 968.83\text{¢}`}) — kernel-exact via `Interval`.
     - ${play31_7} sounds 31-EDO's nearest step (step 25 ≈ 967.74¢). It should sound audibly identical to the pure 7/4 — the deviation is ~1.08¢, below the just-noticeable difference for most listeners.
     - ${play12_7} sounds 12-EDO's nearest step (step 10 = 1000¢, the "minor 7th"). It should sound audibly different — +31.17¢ sharp, well past the ~5–10¢ threshold where the ear starts hearing two distinct pitches.

     The contrast is the point of the page: 31-EDO is what "7-limit harmony in a closed system" sounds like; 12-EDO cannot do it.

   - **Why this matters.**
     Equal divisions are the modern composer's bridge between JI's open chain and a finite, modulation-friendly keyboard. The choice of ${tex`N`} is a choice about which JI intervals you are willing to lose. 12-EDO trades away 7- and 11-limit consonance for ergonomics; 31-EDO buys back the 7-limit (and most of the 11-limit); 53-EDO buys back essentially perfect 3- and 5-limit. The math at the top of this page is the lens through which all such tradeoffs are visible.

9. **See also** section:
   - The [analysis dashboard](/pages/analysis) — the same nearest-step calculation as this page, but interactive: pick any ${tex`N`} from 5 to 1000, any prime- or odd-limit, and rank by max / RMS / Tenney-weighted error. This page picks four EDOs and five intervals; the dashboard explores the full space.
   - The [Pythagorean comma](/pages/pythagorean-comma) — the 12-fifths-vs-7-octaves closure gap. Mercator's comma is the same idea at a longer chain (53 fifths vs 31 octaves); 53-EDO is the smallest EDO that closes that longer cycle.
   - [Meantone](/pages/meantone) — the temperament-thread precursor. Meantone narrows the 5th to absorb the syntonic comma; EDOs go further and quantize everything to ${tex`N`} equal steps.

**Step B — Register sidebar entry in `observablehq.config.ts`.**

Insert exactly one new entry inside the Theory notes group's `pages` array, immediately AFTER `{ name: "Meantone", path: "/pages/meantone" }` and immediately BEFORE `{ name: "The schisma", path: "/pages/schisma" }`:

```ts
        { name: "Meantone", path: "/pages/meantone" },
        { name: "EDO approximations", path: "/pages/edo-approximation" },
        { name: "The schisma", path: "/pages/schisma" },
```

Do NOT touch any other entries; do NOT change the header link; do NOT alter any other Theory notes entries.

**Discipline reminders (per CLAUDE.md ARCHITECTURE patterns):**
- Three-layer discipline: page imports from `src/lib/`, `src/audio/`, `src/components/` only.
- Pitfall #1: cents is a display projection. NEVER construct an `Interval` from a cents-derived float. EDO steps are irrational by construction (multiples of `1200/N`); they live entirely in the cents/Hz domain.
- R-01: pass strings into `new Interval(...)` (BigInt path). Only the five JI anchor ratios get wrapped in Interval here.
- D-24: Interval is immutable — the five kernel anchors are constructed once and reused.
- Pattern 4 / Pitfall #2: synth lives in its own cell, no dependencies, `invalidation.then(synth.dispose)` cleans up on cell re-eval and page navigation.
- T-02-22: deviationTable uses `createElement` + `textContent` only — NO `innerHTML` interpolation of cell values.
- Do NOT add a new export to `src/lib/edo.ts`. The per-cell nearest-step math (two lines) is display-layer work and belongs on the page (orchestrator's important_clarification #2).
- No new files in `src/lib/`, `src/audio/`, or `src/components/`. Single new file `src/pages/edo-approximation.md` + one-entry edit to `observablehq.config.ts`.

After writing the page and updating the sidebar, commit with:
```
feat(quick-260512-dcp): add edo-approximation theory page
```
(Single atomic commit covering both files.)
  </action>
  <verify>
<automated>
# 1. TypeScript type-check passes (page imports resolve; no new lib exports).
npm run lint:types

# 2. Lint passes on the touched files (fall back to full lint if path-targeting unsupported).
npm run lint -- src/pages/edo-approximation.md observablehq.config.ts || npm run lint

# 3. Build succeeds — Framework will transpile the .md cells and link the sidebar.
npm run build

# 4. Sidebar entry positioning — EDO approximations must appear immediately after Meantone.
grep -A 1 '"/pages/meantone"' observablehq.config.ts | grep -v '^#' | grep -q "edo-approximation"

# 5. Page exists and contains the required structural elements (grep -v '^#' to avoid prose markdown # headers counting as comments).
grep -q "createSynth" src/pages/edo-approximation.md
grep -q "invalidation.then" src/pages/edo-approximation.md
grep -q "centsToRatio" src/pages/edo-approximation.md
grep -q "31-EDO" src/pages/edo-approximation.md
grep -q "53-EDO" src/pages/edo-approximation.md
grep -q "Mercator" src/pages/edo-approximation.md
grep -q "/pages/analysis" src/pages/edo-approximation.md
grep -q "/pages/pythagorean-comma" src/pages/edo-approximation.md
grep -q "/pages/meantone" src/pages/edo-approximation.md

# 6. Kernel-exact ratios present as string Interval constructions (R-01 BigInt path).
grep -q '"3/2"' src/pages/edo-approximation.md
grep -q '"5/4"' src/pages/edo-approximation.md
grep -q '"7/4"' src/pages/edo-approximation.md
grep -q '"9/8"' src/pages/edo-approximation.md
grep -q '"11/8"' src/pages/edo-approximation.md

# 7. Nearest-step math is inline (Math.round of cents/stepCents). This is the parity-with-bestEdosForScale gate.
grep -q "Math.round" src/pages/edo-approximation.md
grep -q "1200" src/pages/edo-approximation.md

# 8. No accidental direct kernel imports (three-layer discipline).
! grep -q 'from "sw-synth"' src/pages/edo-approximation.md
! grep -q 'from "npm:sw-synth"' src/pages/edo-approximation.md
! grep -q 'from "xen-dev-utils"' src/pages/edo-approximation.md
! grep -q 'from "fraction.js"' src/pages/edo-approximation.md

# 9. The page does NOT pull jiSubsetOfEdo or bestEdosForScale (orchestrator's important_clarification #2 — inverse math is inline).
! grep -q 'jiSubsetOfEdo' src/pages/edo-approximation.md
! grep -q 'bestEdosForScale' src/pages/edo-approximation.md

# 10. src/lib/edo.ts was NOT modified (no new export added — the math lives on the page).
git diff --name-only HEAD -- src/lib/edo.ts | grep -q . && exit 1 || true

# 11. Tests still pass (no kernel changes; this is a defensive guard).
npm test -- --run
</automated>
  </verify>
  <done>
- `src/pages/edo-approximation.md` exists with: imports cell, isolated synth cell with `invalidation.then(synth.dispose)`, kernel-exact JI anchors cell (3/2, 5/4, 7/4, 9/8, 11/8 as `new Interval(...)`), per-EDO nearest-step cell using inline `Math.round(ideal/stepCents)` math that mirrors `bestEdosForScale`'s formula, deviation table cell (rows = {12, 19, 31, 53} EDO, columns = the five JI anchors, plain DOM + textContent only, cell format "k @ ±Δ¢"), audition cell (three play buttons: pure 7/4 via `playInterval`, 31-EDO step 25 via `centsToRatio`-based custom button, 12-EDO step 10 via the same pattern), prose covering the four EDOs with the 31-EDO 7-limit and 53-EDO Mercator's-comma headlines and the 12-EDO failure-mode foil, and a See also section linking to /pages/analysis + /pages/pythagorean-comma + /pages/meantone.
- `observablehq.config.ts` Theory notes group has a new `{ name: "EDO approximations", path: "/pages/edo-approximation" }` entry placed immediately AFTER "Meantone" and immediately BEFORE "The schisma".
- `src/lib/edo.ts` is unchanged — no new export, no signature change. (Important_clarification #2.)
- `npm run lint:types`, `npm run lint`, `npm run build`, and `npm test -- --run` all exit 0.
- All grep gates above pass.
- Single atomic commit `feat(quick-260512-dcp): add edo-approximation theory page` covers both files.
- STATE.md table update is left for the orchestrator.
  </done>
</task>

</tasks>

<verification>
- Page renders at /pages/edo-approximation after `npm run build`; the entry appears in the Theory notes sidebar between "Meantone" and "The schisma".
- Deviation table shows four rows (12-, 19-, 31-, 53-EDO) and five columns (3/2, 5/4, 7/4, 9/8, 11/8) with nearest-step + signed-cents cells.
- Sanity-check cells (back-of-envelope):
  - 12-EDO / 3/2 → step 7 @ −1.96¢
  - 12-EDO / 7/4 → step 10 @ +31.17¢ (the foil)
  - 12-EDO / 11/8 → step 6 @ +48.68¢ (the foil)
  - 19-EDO / 5/4 → step 6 @ −7.37¢
  - 31-EDO / 5/4 → step 10 @ +0.78¢
  - 31-EDO / 7/4 → step 25 @ −1.08¢ (the headline)
  - 53-EDO / 3/2 → step 31 @ −0.07¢ (the headline)
- Pure-7/4 button and 31-EDO step-25 button sound audibly identical; 12-EDO step-10 button sounds audibly different (sharper).
- Navigating away from the page invokes `synth.dispose` via `invalidation.then(...)` — no leaked AudioContext.
- `centsToRatio((25/31) * 1200)` ≈ 1.7493 (sanity: pure 7/4 = 1.75; ~0.04% flat).
</verification>

<success_criteria>
- `src/pages/edo-approximation.md` exists, builds, and renders the deviation table + three play buttons described in the must-haves.
- `observablehq.config.ts` registers the new sidebar entry in the correct position (between Meantone and The schisma).
- `src/lib/edo.ts` is NOT modified (inverse math lives on the page per important_clarification #2).
- `npm run lint:types`, `npm run lint`, `npm run build`, and `npm test -- --run` all exit 0.
- Single commit `feat(quick-260512-dcp): add edo-approximation theory page` lands on main.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-dcp-add-edo-approximation-theory-page-at-src/260512-dcp-SUMMARY.md`.
</output>
</content>
</invoke>