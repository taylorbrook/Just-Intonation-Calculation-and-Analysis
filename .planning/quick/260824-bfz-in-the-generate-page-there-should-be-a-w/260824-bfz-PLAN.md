---
phase: quick-260824-bfz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/pitch.ts
  - src/lib/__tests__/pitch.test.ts
  - src/lib/scala.ts
  - src/lib/INVENTORY.md
  - src/components/scale-table.ts
  - src/components/scale-table.css
  - src/components/__tests__/scale-table.test.ts
  - src/components/circle-of-pitches.ts
  - src/components/__tests__/circle-of-pitches.test.ts
  - src/components/generate-ji-set.ts
  - src/pages/generate.md
autonomous: true
requirements: [QUICK-260824-bfz]

must_haves:
  truths:
    - "On the Generate page a user can choose a tonic note (C, C#, D, ... B) plus an octave, and the whole page — every generator widget's table, the shared circle, the transformed table, and every ⏵⏵ Play button — re-anchors 1/1 to that pitch"
    - "The out-of-the-box defaults (tonic A, octave 4, A4 calibration 440) produce baseHz === 440, so first paint and all existing audio are unchanged"
    - "Every scale table renders an Hz column alongside Degree / Ratio / Cents / ¢-from-12-TET, and the tempered variant renders Hz alongside its Degree / Cents / ¢-from-12-TET columns"
    - "The Hz shown in the table is the SAME number the ⏵⏵ Play button sends to the synth for that degree (one projection, not two)"
    - "Hovering a circle-of-pitches marker shows that degree's Hz in the tooltip"
    - "npm run ci exits 0 and the vitest suite finishes green with zero failures (baseline 753 passing, and the new tests raise that count)"
  artifacts:
    - path: src/lib/pitch.ts
      provides: "NOTE_NAMES, NoteName, A4_MIDI, DEFAULT_A4_HZ, noteToMidi, midiToHz, noteToHz, formatNoteName — the 12-TET note-name → Hz projection, wrapping xen-dev-utils' centOffsetToFrequency (Pitfall #5)"
    - path: src/lib/__tests__/pitch.test.ts
      provides: "unit coverage for the note-name/MIDI/Hz round trip, the A4-calibration knob, and the input guards"
    - path: src/components/scale-table.ts
      provides: "Hz column on both the JI (5-column) and tempered (4-column) variants, sourced from Scale.degreeToFreq"
    - path: src/pages/generate.md
      provides: "tonic-note select + tonic-octave input + A4-calibration input + a derived baseHz cell + a live 'Tonic X = N Hz' readout"
  key_links:
    - from: src/pages/generate.md
      to: src/lib/pitch.ts
      via: "import { NOTE_NAMES, noteToHz, formatNoteName, DEFAULT_A4_HZ } from ../lib/pitch.js — the derived baseHz cell"
      pattern: "noteToHz"
    - from: src/components/scale-table.ts
      to: src/lib/scale.ts
      via: "scale.degreeToFreq(i, baseHz) supplies the Hz cell"
      pattern: "degreeToFreq"
    - from: src/lib/scala.ts
      to: src/lib/scale.ts
      via: "scalaToCsv's Hz column routes through scale.degreeToFreq so the clipboard payload and the rendered table can never disagree"
      pattern: "degreeToFreq"
---

<objective>
Give the Generate page a tonic-note picker and surface frequency in Hz everywhere the
page already shows ratio / cents / ¢-from-12-TET.

Today the page exposes a single raw `Reference pitch (Hz)` number input (`src/pages/generate.md:209`)
and no table anywhere in the repo shows Hz — even though `Scale.degreeToFreq` already
computes it and `scalaToCsv` already exports an Hz column to the clipboard.

Purpose: a tuning notebook is only useful against a real instrument if you can say
"anchor this scale on Eb3" and read the resulting partials in Hz. Two halves:
(1) name the tonic instead of typing a frequency, (2) show the frequency you get.

Output: three atomic commits scoped `quick-260824-bfz` — a new `src/lib/pitch.ts` kernel
module wired end-to-end into the page, an Hz column on `scaleTable`, and the Hz tooltip
plus inventory/doc catch-up.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@src/lib/INVENTORY.md
@src/lib/scale.ts
@src/lib/cents.ts
@src/lib/scala.ts
@src/components/scale-table.ts
@src/components/scale-table.css
@src/components/__tests__/scale-table.test.ts
@src/components/circle-of-pitches.ts
@src/pages/generate.md
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Tonic-note picker end-to-end — new src/lib/pitch.ts wired into the Generate page</name>
  <files>src/lib/pitch.ts, src/lib/__tests__/pitch.test.ts, src/pages/generate.md</files>

  <behavior>
    src/lib/pitch.ts (all pure, no DOM, no audio):
    - `noteToMidi("C", 4)` is 60; `noteToMidi("A", 4)` is 69; `noteToMidi("C", -1)` is 0; `noteToMidi("B", 4)` is 71.
    - `midiToHz(69)` is exactly 440; `midiToHz(57)` is exactly 220; `midiToHz(81)` is exactly 880.
    - `midiToHz(60)` is close to 261.6255653005986 (12 decimal places).
    - `midiToHz(69, 432)` is exactly 432; `midiToHz(57, 432)` is exactly 216.
    - `noteToHz("A", 4)` is exactly 440 — the default-path anti-regression anchor.
    - `noteToHz("C", 4)` equals `midiToHz(noteToMidi("C", 4))`.
    - `NOTE_NAMES` has exactly 12 entries, index 0 is "C" and index 9 is "A".
    - `formatNoteName("A", 4)` is "A4"; `formatNoteName("C#", -1)` is "C#-1".
    - `noteToMidi` throws RangeError for a name not in NOTE_NAMES, and for a non-integer or non-finite octave.
    - `midiToHz` throws RangeError when a4Hz is zero, negative, or non-finite, and when midi is non-finite.
  </behavior>

  <action>
Create `src/lib/pitch.ts`. Export a frozen `NOTE_NAMES` tuple of the twelve sharp-spelled
names in C-first chromatic order (C, C#, D, D#, E, F, F#, G, G#, A, A#, B), a `NoteName`
union type derived from it, `A4_MIDI = 69`, and `DEFAULT_A4_HZ = 440`.

Export `noteToMidi(note: NoteName, octave: number): number` computing
`(octave + 1) * 12 + NOTE_NAMES.indexOf(note)` — the scientific-pitch-notation convention
where C4 is MIDI 60 and A4 is MIDI 69. Guard first: reject a name absent from NOTE_NAMES
and reject an octave that is not a finite integer, throwing RangeError with a message that
names the offending value (mirror the guard style already used in `src/lib/kbm.ts`).

Export `midiToHz(midi: number, a4Hz: number = DEFAULT_A4_HZ): number` implemented by
delegating to `centOffsetToFrequency` imported from `xen-dev-utils`, called as
`centOffsetToFrequency((midi - A4_MIDI) * 100, a4Hz)`. Pitfall #5 discipline (wrap, do not
reimplement) — this is the reason the plan does NOT hand-roll a Math.pow expression. That
upstream helper is `centsToValue(offset) * baseFrequency` where `centsToValue` is
`Math.pow(2, cents / 1200)`, so whole-octave offsets stay bit-exact: A3 reads 220 and A5
reads 880 with no float dust. Guard a4Hz as finite and strictly greater than zero, and midi
as finite; throw RangeError otherwise.

Export `noteToHz(note: NoteName, octave: number, a4Hz: number = DEFAULT_A4_HZ): number` as
the composition of the two, and `formatNoteName(note: NoteName, octave: number): string`
returning the concatenation (A4, C#-1) for readouts and tooltips.

Write the module header in the house style of `src/lib/cents.ts`: state plainly that this
is a twelve-tone-equal-tempered FLOAT projection living at the display/audio boundary, that
its output is a reference anchor for the exact rational scale rather than part of it, and
that a value returned here must never be fed back into kernel rational arithmetic
(Pitfall #1). Note that `xen-dev-utils` also ships `mtof`, and that we do not use it because
it hard-codes the A4 anchor at 440 with no calibration parameter.

Create `src/lib/__tests__/pitch.test.ts` covering every case in the behavior block above.
Follow the existing `src/lib/__tests__` style: named describe blocks, `toBe` for the values
documented as exact, `toBeCloseTo` for C4, `expect(() => ...).toThrow(RangeError)` for the
guards.

Then wire it into `src/pages/generate.md`. Add `NOTE_NAMES`, `noteToHz`, `formatNoteName`
and `DEFAULT_A4_HZ` to the page's existing import cell (import from `../lib/pitch.js` — the
`.js` extension convention). Replace the single-cell
`const baseHz = view(Inputs.number({ value: 440, step: 0.01, label: "Reference pitch (Hz)" }))`
at line 209 with four cells in this order:

  1. a `view(Inputs.select(...))` over NOTE_NAMES bound to `tonicNote`, value "A", label "Tonic note";
  2. a `view(Inputs.number(...))` bound to `tonicOctave`, value 4, min -1, max 9, step 1, label "Tonic octave";
  3. a `view(Inputs.number(...))` bound to `a4Hz`, value 440, min 1, step 0.01, label "A4 calibration (Hz)";
  4. a derived cell `const baseHz = ...` that sanitizes the two numeric inputs before calling
     `noteToHz`, because an Observable number input yields null when the user clears the
     field: fall back to octave 4 when `tonicOctave` is not a finite integer and to
     DEFAULT_A4_HZ when `a4Hz` is not finite or not greater than zero, so `baseHz` is always
     a usable positive number and the kernel guards are never reached from the UI.

The variable name `baseHz` is load-bearing and MUST stay `baseHz`: roughly forty downstream
references across every generator widget, the shared-preview cell, and every playScale call
read it, and none of them may be touched by this task.

Add a fifth cell that displays a live readout element built with `document.createElement("p")`,
`className = "dashboard-helper"`, and `textContent` set to a string of the form
`Tonic A4 = 440.00 Hz — the scale's 1/1.` composed from `formatNoteName(...)` and
`baseHz.toFixed(2)`. Values go in through textContent only, never through markup assignment
(the page-wide discipline). Place it directly under the three inputs.

Confirm by inspection that with the shipped defaults the derived `baseHz` is 440 exactly, so
the page's first paint and every existing audition are unchanged.
  </action>

  <verify>
    <automated>npm test</automated>
  </verify>

  <done>
`src/lib/pitch.ts` exists and exports NOTE_NAMES, NoteName, A4_MIDI, DEFAULT_A4_HZ,
noteToMidi, midiToHz, noteToHz, formatNoteName, with midiToHz delegating to
`centOffsetToFrequency` from `xen-dev-utils`. `src/lib/__tests__/pitch.test.ts` covers every
case in the behavior block and passes. `npm test` finishes green with zero failures and a
total above the 753 baseline. `npm run lint:types` and `npx observable build` both exit 0.
`src/pages/generate.md` shows a Tonic-note select, a Tonic-octave input, an A4-calibration
input, and a live readout; `baseHz` is now a derived cell whose default value is exactly 440;
no other `baseHz` reference in the page was edited. Committed:
`feat(quick-260824-bfz): add src/lib/pitch.ts and a tonic-note picker to the Generate page`.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Hz column on scaleTable (both variants), sourced from Scale.degreeToFreq</name>
  <files>src/components/scale-table.ts, src/components/scale-table.css, src/components/__tests__/scale-table.test.ts, src/lib/scala.ts, src/components/generate-ji-set.ts, src/pages/generate.md</files>

  <behavior>
    Updating `src/components/__tests__/scale-table.test.ts` against the existing
    1/1, 5/4, 3/2, 2/1 fixture rendered at baseHz 440:
    - Default path thead has FIVE th: Degree, Ratio, Cents, ¢ from 12-TET, Hz — in that order.
    - Default path tbody rows have exactly FIVE td, ratio still in column 2 (index 1).
    - Row 1 (1/1) column 5 reads "440.00"; row 2 (5/4) reads "550.00"; row 3 (3/2) reads
      "660.00"; row 4 (2/1) reads "880.00".
    - `{ tempered: false }` is identical to the default path (five columns, no badge).
    - Tempered path thead has FOUR th: Degree, Cents, ¢ from 12-TET, Hz — and does not
      contain a Ratio label.
    - Tempered path tbody rows have exactly FOUR td, with Hz last and still reading "440.00"
      on row 1 at baseHz 440 — dropping the ratio COLUMN never drops the Hz value.
    - `{ hzPrecision: 0 }` renders row 1 as "440" and row 2 as "550".
    - A non-finite or non-positive baseHz (0, -1, NaN) renders the Hz cell as the placeholder
      dash rather than "0.00", "NaN" or "Infinity", on both variants, with column counts and
      every other cell unchanged.
    - The badge-before-table ordering assertion and the tempered+copyButton assertion still pass.
  </behavior>

  <action>
Extend `ScaleTableOpts` in `src/components/scale-table.ts` with an optional
`hzPrecision?: number` documented as decimal places for the Hz column, defaulting to 2 (two
decimals reads cleanly for audible frequencies; the clipboard payload keeps its own three-
decimal precision and is not changed by this task).

Append "Hz" as the FINAL header label in BOTH `headerLabels` arrays — the tempered array
becomes Degree, Cents, ¢ from 12-TET, Hz and the JI array becomes Degree, Ratio, Cents,
¢ from 12-TET, Hz. The existing labels keep their current order and spelling, including the
¢ glyph, so the header row is a pure append on both branches.

In the row loop, compute the frequency for the current index by calling
`scale.degreeToFreq(i, baseHz)`. Route it through that method rather than recomputing
`baseHz * Number(iv.fraction.valueOf())` inline: `degreeToFreq` is the projection the
⏵⏵ Play path already uses, so sourcing the cell from it is what guarantees the printed
number and the sounded number can never drift apart. The loop index is always within range,
so the method's RangeError branch is unreachable here.

Format the value into a local string: when the computed frequency is a finite number render
`freq.toFixed(hzPrecision)`, otherwise render a single em-dash character as an honest
placeholder. Append that string as the last entry of BOTH `cells` array branches, then leave
the surrounding `createElement` plus `textContent` cell-writing loop exactly as it is — the
new column inherits the same no-markup-assignment discipline as every other cell (T-02-23).

Update the module header doc: the opening line currently describes a four-column table, so
restate it as the five-column Degree | Ratio | Cents | ¢ from 12-TET | Hz table, and update
the `tempered` option doc so its parenthetical column list gains Hz. State that the Hz
column is a display projection of `Scale.degreeToFreq` and therefore honors whatever
reference pitch the calling page passes as `baseHz`.

In `src/lib/scala.ts`, change the Hz cell inside `scalaToCsv` from the inline
`baseHz * Number(iv.fraction.valueOf())` expression to `scale.degreeToFreq(i, baseHz)`,
keeping the existing three-decimal formatting untouched. This is a pure de-duplication so
one function owns the degree-to-frequency projection; the emitted payload must stay
byte-identical, and the existing `scalaToCsv` assertions in `src/lib/__tests__/scala.test.ts`
are the proof — they must pass with no edits.

In `src/components/scale-table.css`, add a `@media (max-width: 640px)` block setting
`overflow-x: auto` on `.scale-table` so the wider table scrolls sideways on a phone instead
of crushing the columns. This mirrors the `.scale-compare__table-wrap` precedent already
noted in `src/styles.css`, and it deliberately styles the EXISTING wrapper element rather
than introducing a new wrapper div, because the tests assert the wrapper's direct-child
order (badge before table). Use theme tokens only; add no colours.

Fix the two stale column-count comments this task invalidates: the header comment in
`src/components/generate-ji-set.ts` that describes the default variant as four columns, and
the preview-host comment in `src/pages/generate.md` near line 604 that spells the table as
Degree/Ratio/Cents/¢-from-12tet. Both are comment text only — no logic moves.

Apply every assertion change from the behavior block to
`src/components/__tests__/scale-table.test.ts`, keeping the existing describe-block structure
and fixture helper. Run `npm run format` and fold any resulting formatting into this task's
single commit.
  </action>

  <verify>
    <automated>npm test</automated>
  </verify>

  <done>
Both scaleTable variants render an Hz column last; the JI variant is five columns and the
tempered variant is four. The Hz value comes from `scale.degreeToFreq`, `hzPrecision`
defaults to 2, and a non-finite or non-positive baseHz renders the dash placeholder.
`scalaToCsv` routes its Hz column through the same method with byte-identical output — the
untouched `src/lib/__tests__/scala.test.ts` assertions pass. `.scale-table` scrolls
horizontally below 640px. The stale four-column comments in `generate-ji-set.ts` and
`generate.md` are corrected. `npm test` is green with zero failures. Committed:
`feat(quick-260824-bfz): show frequency in Hz on both scaleTable variants`.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Hz in the circle-of-pitches tooltip, kernel inventory entry, final CI gate</name>
  <files>src/components/circle-of-pitches.ts, src/components/__tests__/circle-of-pitches.test.ts, src/lib/INVENTORY.md</files>

  <behavior>
    Adding to `src/components/__tests__/circle-of-pitches.test.ts`:
    - Rendering the JI-major fixture at baseHz 440, every marker's SVG title text ends with
      the unit "Hz" and its numeric field parses as a finite number greater than zero.
    - The tonic marker's title contains "440.00 Hz".
    - The existing title assertions still hold: each title is non-empty, and at least one
      title carries the U+2212 signed-cents deviation.
    - The tempered fixture at baseHz 100 also gets an Hz field in its title — the tempered
      branch shows cents instead of a ratio but never loses the frequency.
    - The existing playNote assertions still hold: clicking a marker calls playNote once with
      a positive Hz and a positive duration, and the Hz argument equals the number printed in
      that same marker's title when both are rounded to two decimals.
  </behavior>

  <action>
In `src/components/circle-of-pitches.ts`, the per-node loop already derives a `ratio` used by
the click handler as `baseHz * ratio` in its `synth.playNote` calls. Hoist that product into
a single named const computed once per node — name it for what it is, the node's frequency —
and have BOTH `synth.playNote` call sites in that node's handlers use the const instead of
recomputing the product. Deriving the tooltip and the audio from one binding is the point:
the tooltip cannot drift from what the marker sounds.

Extend the SVG title `textContent` on both branches so the existing two fields gain a third:
the tempered branch becomes cents, then the signed deviation, then the frequency; the JI
branch becomes ratio, then the signed deviation, then the frequency. Keep the existing
` | ` separator and the existing field order, and format the frequency as the value fixed to
two decimals followed by a space and the unit, matching the table's default precision from
Task 2. Keep using `textContent` — never markup assignment (T-08-04).

Update the module header note that currently describes the tooltip as pitch info plus
signed cents-from-12tet so it also mentions the frequency field.

Add the new-symbol rows to `src/lib/INVENTORY.md` as a new section at the end of the file,
headed for this quick task, following the established three-column table shape
(Symbol / Source / Notes). Cover `NOTE_NAMES` and `NoteName`, `A4_MIDI` and `DEFAULT_A4_HZ`,
`noteToMidi`, `midiToHz`, `noteToHz`, and `formatNoteName`. In the `midiToHz` note record the
Pitfall #5 outcome explicitly: it wraps `centOffsetToFrequency` from `xen-dev-utils` rather
than hand-rolling the exponential, and `mtof` from the same package was rejected because it
hard-codes A4 at 440 with no calibration parameter. In the `noteToMidi` note record the
scientific-pitch-notation convention (C4 is MIDI 60, A4 is MIDI 69). Restate the Pitfall #1
boundary once for the section: these produce display/audio floats and are never kernel input.

Run `npm run format`, then run the full `npm run ci` gate and confirm it exits 0 across all
five stages (tsc, vitest, eslint, prettier, observable build). Before committing, confirm no
file edited across all three tasks gained a byte-order mark — all of them were free of one at
plan time.
  </action>

  <verify>
    <automated>npm run ci</automated>
  </verify>

  <done>
Every circle-of-pitches marker tooltip carries a frequency field derived from the same const
the marker's playNote calls use, on both the JI and tempered branches. The new title
assertions pass and every pre-existing circle-of-pitches assertion still passes.
`src/lib/INVENTORY.md` has a `quick-260824-bfz` section documenting all eight new symbols
with the Pitfall #5 and Pitfall #1 rationale. `npm run ci` exits 0. No file gained a
byte-order mark. Committed:
`feat(quick-260824-bfz): show Hz in the circle-of-pitches tooltip and log pitch.ts in INVENTORY`.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user input → DOM | Tonic note, tonic octave, and A4 calibration are typed/selected by the user, then rendered back into the page readout and into every table's Hz column. |
| user input → math kernel | The same three inputs flow into `noteToHz`, whose result becomes `baseHz` for every widget, every table, and every synth call. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-bfz-01 | Tampering | `src/components/scale-table.ts` Hz cell | medium | mitigate | The Hz cell is written with `createElement` plus `textContent` like every other cell — the existing no-markup-assignment discipline (T-02-23) extends to the new column with no new code path. |
| T-bfz-02 | Tampering | `src/components/circle-of-pitches.ts` SVG title | medium | mitigate | The frequency field is appended to the existing `title.textContent` assignment (T-08-04) — no markup assignment is introduced. |
| T-bfz-03 | Denial of Service | `src/pages/generate.md` derived `baseHz` cell | medium | mitigate | An Observable number input yields null when cleared; the derived cell sanitizes octave and A4 calibration to safe defaults so `baseHz` is always finite and positive, and no NaN can reach `degreeToFreq` or `synth.playNote`. |
| T-bfz-04 | Denial of Service | `src/lib/pitch.ts` guards | low | mitigate | `noteToMidi` and `midiToHz` throw RangeError on an unknown name, a non-integer octave, a non-finite midi, or a non-positive A4 calibration — defense in depth behind the UI sanitizer, matching the `src/lib/kbm.ts` guard style. |
| T-bfz-05 | Information Disclosure | Hz column with a hostile baseHz | low | mitigate | A non-finite or non-positive frequency renders a dash placeholder rather than printing "NaN" or "Infinity" as if it were a real pitch. |
| T-bfz-SC | Tampering | npm installs | low | accept | This plan installs no packages. `xen-dev-utils@0.13.1` is already a pinned direct dependency and no version changes. No package-legitimacy gate is required. |
</threat_model>

<verification>
After EACH task: `npm test` must finish green with ZERO failures. The baseline before this
plan is 753 passing across 52 files; Tasks 1 and 3 add tests so the total rises, and Task 2
rewrites existing scale-table assertions rather than adding many. Judge on the failure count,
not on a fixed total.

Anti-regression checks that matter most, in order of risk:

1. **Default `baseHz` is still exactly 440.** With tonic A, octave 4, and A4 calibration 440,
   `noteToHz("A", 4, 440)` returns 440 with no float dust because the cent offset is zero.
   If the Generate page's first paint changes pitch, the wiring is wrong.
2. **`baseHz` was not renamed.** Roughly forty downstream references in `src/pages/generate.md`
   read it. Only the four declaring cells change; every consumer stays byte-identical.
3. **`scalaToCsv` output is byte-identical.** The `src/lib/__tests__/scala.test.ts`
   assertions are NOT edited by this plan. If they go red, the Task 2 de-duplication changed
   behavior and must be reverted.
4. **Column counts.** `src/components/__tests__/scale-table.test.ts` is the only test file in
   the repo asserting scale-table column counts; every other widget test asserts only
   `.scale-table__badge`, so those must pass untouched.

Final gate (after Task 3): `npm run ci` must exit 0 — it runs
`tsc --noEmit && vitest run && eslint . && prettier --check . && observable build`. Watch:
- tsc: the `NoteName` union derived from a frozen NOTE_NAMES tuple, and the new
  `hzPrecision` option, must both type-check.
- prettier --check: fold any formatting into the relevant task's commit; do not add a
  separate formatting commit.
- observable build: `src/pages/generate.md` is a build input, so a broken cell fails here
  rather than in vitest.
- No edited file gained a byte-order mark.
</verification>

<success_criteria>
- Three atomic commits, one per task, each with a conventional-commit subject scoped
  `quick-260824-bfz`.
- `npm test` is green with zero failures after every commit; `npm run ci` exits 0 at the end.
- The Generate page offers a tonic-note select over the twelve chromatic names, a tonic-octave
  input, and an A4-calibration input, with a live readout naming the tonic and its frequency.
- Choosing a different tonic re-anchors the entire page: every generator widget's table, the
  shared circle, the transformed table, and every ⏵⏵ Play button follow, because they all
  already read the derived `baseHz`.
- Shipped defaults (A / 4 / 440) yield `baseHz === 440`, so nothing about the page's initial
  state changed.
- Both scaleTable variants show Hz as the last column — five columns for JI, four for
  tempered — everywhere the component is used, including the dashboard and
  `src/pages/pythagorean-tuning.md`.
- The Hz printed for a degree is the same number the synth plays for that degree; one
  projection, `Scale.degreeToFreq`, owns it, and `scalaToCsv` now shares it.
- A non-finite or non-positive reference pitch renders a dash, never a fake frequency.
- Circle-of-pitches tooltips include the marker's frequency on both the JI and tempered
  branches.
- `src/lib/pitch.ts` wraps `xen-dev-utils` rather than reimplementing the exponential
  (Pitfall #5), is documented as a display/audio float projection (Pitfall #1), and is logged
  in `src/lib/INVENTORY.md`.
- No file gained a byte-order mark.
</success_criteria>

<output>
This is a quick-task plan — no SUMMARY file required. On completion, the three commits ARE
the deliverable. Report the final `npm run ci` exit status, the vitest total, and the three
commit SHAs.
</output>
