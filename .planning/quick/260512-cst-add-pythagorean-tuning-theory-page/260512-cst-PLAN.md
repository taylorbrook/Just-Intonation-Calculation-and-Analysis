---
phase: quick-260512-cst
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/pythagorean-tuning.md
  - observablehq.config.ts
autonomous: true
requirements:
  - QUICK-260512-cst
must_haves:
  truths:
    - "User can navigate to /pages/pythagorean-tuning from the Theory notes sidebar (entry placed AFTER 'The Pythagorean comma' and BEFORE 'The schisma')"
    - "Page renders prose explaining the 12-note chain of pure 3/2 fifths and why the cycle fails to close into 7 octaves (gap = one Pythagorean comma, ~23.46¢)"
    - "Page renders the 12-tone Pythagorean scale (13 rows incl. 2/1 period) via the existing scaleTable widget at baseHz = 261.625 (middle C)"
    - "User can click '▶' on the pure 5th (3/2) button and hear 701.96¢"
    - "User can click '▶' on the wolf 5th (262144/177147) button and hear 678.49¢ — audibly narrower than the pure version"
    - "Page cross-links to /pages/pythagorean-comma (the comma that the wolf manifests), /pages/harmonic-series (prerequisite framing), and / (dashboard)"
    - "AudioContext is NOT created on page load — only on first button click (Pattern 4 / Pitfall #2)"
    - "Cross-page navigation does not leak the AudioContext (invalidation.then(synth.dispose))"
  artifacts:
    - path: "src/pages/pythagorean-tuning.md"
      provides: "Theory page mirroring syntonic-comma.md / comma-pump.md cell discipline with inline chainOfFifths(n), scaleTable render, and two playInterval buttons (pure 5th + wolf 5th)"
      contains: "chainOfFifths"
    - path: "observablehq.config.ts"
      provides: "Sidebar registration entry for Pythagorean tuning, positioned immediately after The Pythagorean comma and before The schisma"
      contains: "pythagorean-tuning"
  key_links:
    - from: "src/pages/pythagorean-tuning.md"
      to: "src/audio/synth.ts (createSynth)"
      via: "import + cell-owned synth"
      pattern: 'import.*createSynth.*from "../audio/synth.js"'
    - from: "src/pages/pythagorean-tuning.md"
      to: "src/lib/interval.ts (Interval) + src/lib/scale.ts (Scale)"
      via: "inline chainOfFifths uses Interval.mul + octaveReduce; builds a Scale with 2/1 period"
      pattern: 'import.*Interval.*from "../lib/interval.js"'
    - from: "src/pages/pythagorean-tuning.md"
      to: "src/components/scale-table.ts (scaleTable)"
      via: "render of 12-tone Pythagorean scale at baseHz = 261.625"
      pattern: "scaleTable\\(pythagorean12"
    - from: "src/pages/pythagorean-tuning.md"
      to: "src/components/play-interval.ts (playInterval)"
      via: "two ▶ buttons for pure 5th and wolf 5th audition"
      pattern: "playInterval\\(wolfFifth"
    - from: "observablehq.config.ts Theory notes group"
      to: "/pages/pythagorean-tuning"
      via: "pages array entry placed after The Pythagorean comma, before The schisma"
      pattern: "Pythagorean tuning.*pythagorean-tuning"
---

<objective>
Add a `pythagorean-tuning` theory page that demonstrates the classic 12-note chain of pure 3/2 fifths and the "wolf 5th" — the closing interval (262144/177147 ≈ 678.49¢) that's narrower than a pure fifth by exactly one Pythagorean comma. The page provides: an inline `chainOfFifths(n)` helper (~10 lines, no new kernel file) that builds the 12-tone Pythagorean scale; a scaleTable render of that scale; and two play buttons auditioning the pure 5th vs. the wolf 5th. No new files in src/lib/, src/audio/, or src/components/.

Purpose: This is the natural application page for the Pythagorean comma — it shows *where* the comma lives in a real 12-tone tuning system, *which interval* manifests it (the wolf 5th = diminished sixth that closes the cycle), and *why* meantone/well-tempered systems were invented to redistribute the wolf. Completes the Pythagorean narrative that the pythagorean-comma page establishes definitionally.

Output: One new Markdown page + one sidebar entry; single atomic feat commit.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/pages/syntonic-comma.md
@src/pages/comma-pump.md
@src/pages/pythagorean-comma.md
@src/pages/harmonic-series.md
@src/audio/synth.ts
@src/components/scale-table.ts
@src/components/play-interval.ts
@src/components/ratio-pill.ts
@src/lib/interval.ts
@src/lib/scale.ts
@observablehq.config.ts

<interfaces>
<!-- Key types and helpers the executor needs. Use these directly — no codebase exploration. -->

From src/lib/interval.ts:
```typescript
export class Interval {
  readonly fraction: Fraction;          // BigInt-backed (R-01)
  get monzo(): number[];
  get cents(): number;                  // lazy display projection
  get centsFrom12tet(): number;
  mul(other: Interval): Interval;       // immutable (D-24)
  div(other: Interval): Interval;
  octaveReduce(period?: Interval): Interval; // default period = 2/1
  equals(other: Interval): boolean;
  toString(): string;                   // e.g. "3/2"
}
// Construct from a string ratio: new Interval("3/2")
// Project to Hz at the audio boundary: baseHz * Number(iv.fraction.valueOf())
```

From src/lib/scale.ts:
```typescript
export class Scale {
  readonly intervals: readonly Interval[];
  readonly period: Interval;
  // D-14: last interval IS the period. Constructor pins period (default = last).
  // CR-01: period must be > 1/1 or the constructor throws.
  constructor(intervals: readonly Interval[], period?: Interval);
}
// For this page: build intervals[] = [1/1, ...11 chain pitches sorted ascending..., 2/1]
// and pass `new Interval("2/1")` as the explicit period. Length = 13.
```

From src/audio/synth.ts:
```typescript
export interface SynthHandle {
  playNote(hz: number, dur?: number): () => void;
  playNotes(freqs: number[], dur?: number): void;
  dispose(): void;
}
export function createSynth(opts?: CreateSynthOpts): SynthHandle;
// Lazy AudioContext — NOT created until first playNote/playNotes call.
```

From src/components/scale-table.ts:
```typescript
export interface ScaleTableOpts {
  copyButton?: boolean;   // default false — DO NOT enable for this page
  precision?: number;     // cents decimal places, default 1 (0.1¢)
}
export function scaleTable(scale: Scale, baseHz: number, opts?: ScaleTableOpts): HTMLElement;
// 4-col table: Degree | Ratio | Cents | ¢ from 12-TET. Renders all scale.intervals.
```

From src/components/play-interval.ts:
```typescript
export function playInterval(interval: Interval, synth: SynthHandle, opts?: PlayIntervalOpts): HTMLButtonElement;
// Returns a ▶ button; opts.label = true to show the ratio next to ▶.
// Plays the interval as a dyad against baseHz on click.
```

From src/components/ratio-pill.ts:
```typescript
export function ratioPill(interval: Interval): HTMLElement;
// Inline pill displaying the ratio (e.g. "3/2") — for prose interpolation.
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/pages/pythagorean-tuning.md and register sidebar entry</name>
  <files>src/pages/pythagorean-tuning.md, observablehq.config.ts</files>
  <action>
Create `src/pages/pythagorean-tuning.md` mirroring the cell discipline of `src/pages/syntonic-comma.md` and `src/pages/comma-pump.md`. Register the sidebar entry in `observablehq.config.ts` immediately after "The Pythagorean comma" and immediately before "The schisma" inside the Theory notes group.

**Page structure (in this order):**

1. **Title + one-line tagline.**
   - `# Pythagorean tuning`
   - Tagline: "Twelve pure fifths, one wolf — why a 3-limit cycle of fifths doesn't close into an octave."

2. **Imports cell** (TypeScript fenced as ` ```ts `):
   ```ts
   import { Interval } from "../lib/interval.js";
   import { Scale } from "../lib/scale.js";
   import { createSynth } from "../audio/synth.js";
   import { scaleTable } from "../components/scale-table.js";
   import { playInterval } from "../components/play-interval.js";
   import { ratioPill } from "../components/ratio-pill.js";
   ```
   (NO `commaByName` import — the Pythagorean comma is referenced by ratio + cross-link only.)

3. **Synth cell** (own cell, NO dependencies on other cells; copy verbatim from syntonic-comma.md):
   ```ts
   // Synth cell — owns this page's AudioContext (ARCHITECTURE Pattern 4 / Pitfall #2).
   // Must NOT depend on any other cell. The lazy createSynth() does not allocate the
   // AudioContext until the first playNote / playNotes call (i.e. the first user click),
   // so simply rendering this page does not create an AudioContext.
   const synth = createSynth();
   invalidation.then(() => synth.dispose());
   ```

4. **chainOfFifths cell** — inline ~10-line helper that returns a `Scale` of 12 unique pitches plus the 2/1 period (length = 13). Implement directly in the cell; do NOT add to src/lib/:

   ```ts
   // Stack n pure fifths (3/2) from 1/1, octave-reducing each step into [1, 2),
   // sort ascending by cents (display ordering is fine here per Pitfall #1: the
   // BigInt Fraction inside Interval remains the source of truth for arithmetic),
   // and append 2/1 as the period (D-14: last interval = period).
   //
   // For n = 12 this yields the classic Pythagorean 12-tone scale:
   //   1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1
   //
   // The chain does NOT close — see the wolf-5th cell below. Closing the 12th
   // fifth requires shrinking it by exactly one Pythagorean comma (~23.46¢).
   const chainOfFifths = (n) => {
     const fifth = new Interval("3/2");
     const intervals = [new Interval("1/1")];
     let acc = new Interval("1/1");
     for (let k = 1; k < n; k++) {
       acc = acc.mul(fifth).octaveReduce();
       intervals.push(acc);
     }
     intervals.sort((a, b) => a.cents - b.cents);
     intervals.push(new Interval("2/1")); // period (D-14)
     return new Scale(intervals, new Interval("2/1"));
   };

   const pythagorean12 = chainOfFifths(12);
   ```

   Notes on the math (do not put these in the code — these are for the executor's understanding so they don't second-guess the helper):
   - After octaveReduce, every chain pitch is in [1, 2). Sorting by cents puts them in ascending pitch order.
   - The 12 unique pitches plus 2/1 = 13 intervals total. scaleTable will render 13 rows.
   - D-24 (immutability) is honored: `acc.mul(fifth).octaveReduce()` returns a new Interval each iteration.
   - Pitfall #1: cents-as-sort-key is acceptable here because that's *display ordering*. Fraction equality (used downstream by Scale.dedupe etc.) still uses BigInt.

5. **scaleTable render cell** — render the 12-tone Pythagorean scale at middle C (no copy button):

   ```ts
   display(scaleTable(pythagorean12, 261.625));
   ```
   (261.625 Hz = C4, keeping the chain pitches in a comfortable register around middle C. NO `copyButton: true` — this page is for theory, not export.)

6. **Wolf-fifth cell** — declare the pure and wolf fifths as Intervals:

   ```ts
   // The "wolf 5th" is the interval needed to close the 12-tone cycle after eleven
   // pure 3/2 fifths have been laid down. After octave-reducing 12 pure fifths,
   // the top of the chain (A♯ at (3/2)^11, octave-reduced) sits just BELOW C′ +
   // one Pythagorean comma. The 12th interval that completes the 7-octave cycle
   // is therefore ~678.49¢, not the pure 701.96¢ — narrower by one Pythagorean
   // comma (531441/524288 ≈ 23.46¢).
   //
   // Constructive derivation:
   //   wolf = (2/1)^7 / (3/2)^11
   //        = 2^7 / (3^11 / 2^11)
   //        = 2^18 / 3^11
   //        = 262144 / 177147
   //        ≈ 678.49¢
   //
   // This is the diminished sixth that conventionally lives between G♯ and E♭
   // in the historical 12-note Pythagorean tuning. It is a 3-limit ratio (monzo
   // [18, -11]) — equal in magnitude to a pure fifth minus the Pythagorean comma.
   const pureFifth = new Interval("3/2");
   const wolfFifth = new Interval("262144/177147");
   ```

7. **Play-button cells** — two `playInterval` calls, used inline in the audition prose:

   ```ts
   const playPure = playInterval(pureFifth, synth, { label: true });
   const playWolf = playInterval(wolfFifth, synth, { label: true });
   ```

8. **Prose** (KaTeX via `tex\`...\`` inline; cross-links per scope_specifics):

   - **Lead paragraph:** Stack twelve pure fifths from ${tex`1/1`} and you have a recipe for a 12-note scale: each fifth lands on a fresh pitch class, and octave-reducing each step into ${tex`[1, 2)`} builds the classic Pythagorean diatonic. But the chain does not close. After eleven pure 3/2 fifths the chain reaches a pitch that sits one [Pythagorean comma](/pages/pythagorean-comma) (${tex`531441/524288 \approx 23.46\text{¢}`}) BELOW where a closing fifth needs to land — so the 12th "fifth" is forced to shrink by exactly that comma. That narrowed interval is the **wolf**.

   - **The chain** — explain that 12 pure fifths reach ${tex`(3/2)^{12} = 531441/4096 \approx 7\text{ octaves} + 23.46\text{¢}`} (sharp by one Pythagorean comma). Closing the cycle forces the 12th interval down by that comma:
     ${tex`\frac{(2/1)^7}{(3/2)^{11}} = \frac{2^{18}}{3^{11}} = \frac{262144}{177147} \approx 678.49\text{¢}`}
     Equivalently: ${tex`701.96 - 23.46 = 678.50`} cents.

   - **The 12-note scale table** — short intro sentence then the scaleTable render (already done in cell 5 — the display() call drops the table into the page at that position; structure the markdown so cell 5 is positioned right after this prose paragraph). The 12 pitches plus the period (13 rows total): ${tex`1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1`} — sorted ascending by cents, with the cents-from-12-TET deviation shown for each.

   - **Audition the wolf** — two play buttons inline in a short bulleted list:
     - ${playPure} sounds the pure fifth (${ratioPill(pureFifth)}) — 701.96¢, the chain's building block. Beat-free against any 1/1 drone.
     - ${playWolf} sounds the wolf fifth (${ratioPill(wolfFifth)}) — 678.49¢, the diminished sixth that closes the chain. Audibly narrow and slightly sour against the pure version; sound them back-to-back and the ~23.5¢ gap is unmistakable.

   - **Where the wolf lives** — short paragraph: in the historical 12-note Pythagorean tuning, the wolf is conventionally placed between G♯ and E♭ (or their enharmonic equivalents — different historical sources pick different spots, but the wolf has to live *somewhere*). Six pure fifths up from C + five pure fifths down from C + one wolf = closed 12-tone cycle. Modulating into a key whose dominant crosses the wolf produces an audibly broken fifth — which is why Western tuning evolved away from pure Pythagorean toward meantone (16th c.) and well-tempered systems (Werckmeister, 17th c.) and ultimately 12-TET.

9. **See also** section:
   - The [Pythagorean comma](/pages/pythagorean-comma) — the ${tex`531441/524288`} ratio that the wolf manifests. The pythagorean-comma page defines the interval; this page shows *where* it lives in a real 12-tone tuning system.
   - The [harmonic series](/pages/harmonic-series) is the prerequisite framing: 3-limit JI privileges intervals built from partials 1 and 3 (the perfect fifth being 3:2). Pythagorean tuning is what you get when you build a 12-note scale from that single interval alone.
   - The [dashboard](/) — paste any of the 13 Pythagorean pitches into the scale text and audition them against a drone. Try the wolf ratio `262144/177147` directly: it's audibly narrower than `3/2`.

**Sidebar registration** in `observablehq.config.ts`:

Insert exactly one new entry inside the Theory notes group's `pages` array, immediately AFTER `{ name: "The Pythagorean comma", path: "/pages/pythagorean-comma" }` and immediately BEFORE `{ name: "The schisma", path: "/pages/schisma" }`:

```ts
        { name: "The Pythagorean comma", path: "/pages/pythagorean-comma" },
        { name: "Pythagorean tuning", path: "/pages/pythagorean-tuning" },
        { name: "The schisma", path: "/pages/schisma" },
```

Do NOT touch any other entries; do NOT change the header link; do NOT alter the Dashboard / Analysis / Comma pump entries.

**Discipline reminders (per CLAUDE.md ARCHITECTURE patterns):**
- Three-layer discipline: page may import from `src/lib/`, `src/audio/`, `src/components/`. NEVER imports `sw-synth`, `xen-dev-utils`, or `fraction.js` directly.
- R-01: pass strings into `new Interval(...)` (BigInt path); only coerce to Number at the audio boundary, which is already handled inside `scaleTable` and `playInterval`.
- D-24: Interval is immutable — `acc.mul(fifth).octaveReduce()` returns new instances; the loop reassigns `acc` to the new instance.
- D-14: the Scale's last interval IS the period — append `new Interval("2/1")` last AND pass it explicitly to the Scale constructor as the period.
- Pitfall #1: cents-as-sort-key inside chainOfFifths is acceptable because that's display ordering. Fraction equality remains BigInt-backed.
- Pattern 4 / Pitfall #2: synth lives in its own cell, no dependencies, `invalidation.then(synth.dispose)` cleans up on cell re-eval and on page navigation.
- No new files in `src/lib/`, `src/audio/`, or `src/components/`. Single new file `src/pages/pythagorean-tuning.md` + one-entry edit to `observablehq.config.ts`. No INVENTORY.md change.

After writing the page and updating the config, commit with:
```
feat(quick-260512-cst): add pythagorean-tuning theory page
```
(Single atomic commit covering both files.)
  </action>
  <verify>
<automated>
# 1. TypeScript type-check passes (page imports resolve correctly).
npm run lint:types

# 2. Lint passes on the page + config.
npm run lint -- src/pages/pythagorean-tuning.md observablehq.config.ts || npm run lint

# 3. Build succeeds — Framework will transpile the .md cells and link the sidebar.
npm run build

# 4. Sidebar entry positioning — Pythagorean tuning must appear immediately after The Pythagorean comma.
grep -A 1 "pythagorean-comma" observablehq.config.ts | grep -q "pythagorean-tuning"

# 5. Page contains the required structural elements.
grep -q "createSynth" src/pages/pythagorean-tuning.md
grep -q "invalidation.then" src/pages/pythagorean-tuning.md
grep -q "chainOfFifths" src/pages/pythagorean-tuning.md
grep -q "scaleTable" src/pages/pythagorean-tuning.md
grep -q "/pages/pythagorean-comma" src/pages/pythagorean-tuning.md

# 6. The pure fifth and the wolf fifth are present as exact-string Interval
#    constructions (R-01 BigInt path, NOT float-derived).
grep -q '"3/2"' src/pages/pythagorean-tuning.md
grep -q '"262144/177147"' src/pages/pythagorean-tuning.md

# 7. No accidental direct kernel imports (three-layer discipline).
! grep -q 'from "sw-synth"' src/pages/pythagorean-tuning.md
! grep -q 'from "npm:sw-synth"' src/pages/pythagorean-tuning.md
! grep -q 'from "xen-dev-utils"' src/pages/pythagorean-tuning.md
! grep -q 'from "fraction.js"' src/pages/pythagorean-tuning.md
</automated>
  </verify>
  <done>
- `src/pages/pythagorean-tuning.md` exists with: imports cell, isolated synth cell with `invalidation.then(synth.dispose)`, inline `chainOfFifths(n)` helper (~10 lines, uses Interval.mul + octaveReduce, sorts by cents, appends 2/1 period), `scaleTable(pythagorean12, 261.625)` render, wolf-fifth declarations (`pureFifth = new Interval("3/2")`, `wolfFifth = new Interval("262144/177147")`), two `playInterval` buttons, prose explaining the chain + wolf with KaTeX inline math, and a See also section linking to /pages/pythagorean-comma + /pages/harmonic-series + /.
- `observablehq.config.ts` Theory notes group has a new `{ name: "Pythagorean tuning", path: "/pages/pythagorean-tuning" }` entry placed immediately AFTER "The Pythagorean comma" and immediately BEFORE "The schisma".
- `npm run lint:types`, `npm run lint`, and `npm run build` all exit 0.
- All grep gates above pass.
- Single atomic commit `feat(quick-260512-cst): add pythagorean-tuning theory page` covers both files.
- STATE.md table update is left for the orchestrator.
  </done>
</task>

</tasks>

<verification>
- Page renders at /pages/pythagorean-tuning after `npm run build`; the entry appears in the Theory notes sidebar between "The Pythagorean comma" and "The schisma".
- scaleTable shows 13 rows (12 chain pitches sorted ascending + 2/1 period) with the canonical Pythagorean ratios: 1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1.
- Clicking either play button triggers AudioContext creation on first click only; subsequent clicks reuse the same cell-owned synth handle.
- Pure 5th button sounds ~701.96¢; wolf 5th button sounds ~678.49¢ — audibly narrower.
- Navigating away from the page invokes `synth.dispose` via `invalidation.then(...)` — no leaked AudioContext.
</verification>

<success_criteria>
- `src/pages/pythagorean-tuning.md` exists, builds, and renders the scaleTable + two play buttons described in the must-haves.
- `observablehq.config.ts` registers the new sidebar entry in the correct position (between Pythagorean comma and schisma).
- `npm run lint:types`, `npm run lint`, and `npm run build` all exit 0.
- Single commit `feat(quick-260512-cst): add pythagorean-tuning theory page` lands on main.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-cst-add-pythagorean-tuning-theory-page/SUMMARY.md`.
</output>
