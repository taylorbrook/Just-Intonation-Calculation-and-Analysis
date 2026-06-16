---
phase: quick-260616-efo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/generate-fields.ts
  - src/components/generate-ji-set.ts
  - src/components/generate-ed.ts
  - src/components/generate-harmonic.ts
  - src/components/generate-rank2.ts
  - src/components/generate-welltemp.ts
  - src/components/generate-cps.ts
  - src/components/generate-cs.ts
  - src/components/generate-fokker.ts
  - src/components/scale-table.ts
  - src/components/edo-ji-table.ts
  - src/components/__tests__/generate-fields.test.ts
autonomous: true
requirements: ["#19"]

must_haves:
  truths:
    - "All eight generate-*.ts files import parseIntOrNull / parsePositiveInt / parseRatio / makeIntField / makeRatioField from src/components/generate-fields.ts and contain no local copies"
    - "Consolidated parseIntOrNull rejects values below the field's min (e.g. negatives when min=1) at the UI layer, returning null so closure state is left untouched"
    - "CPS kInput rejects '3.5' and '3abc' (strict integer parse) instead of coercing to 3"
    - "generate-ji-set limit input carries a per-sub-method max attribute (diamond 1023, odd-limit 31, prime-limit 31, farey 1000)"
    - "scale-table.ts and edo-ji-table.ts build their <th> header cells via createElement + textContent, never innerHTML"
    - "All 659+ existing tests still pass; no observable behavior changes beyond min-rejection, strict CPS int parse, and the added max attribute"
  artifacts:
    - path: "src/components/generate-fields.ts"
      provides: "Shared generator field helpers (parse + field-factory functions)"
      exports: ["parseIntOrNull", "parsePositiveInt", "parseRatio", "makeIntField", "makeRatioField"]
    - path: "src/components/__tests__/generate-fields.test.ts"
      provides: "Unit tests for the consolidated helpers incl. min-rejection and strict-parse"
  key_links:
    - from: "src/components/generate-ed.ts"
      to: "src/components/generate-fields.ts"
      via: "import"
      pattern: "from \"./generate-fields.js\""
    - from: "src/components/generate-cps.ts"
      to: "parsePositiveInt"
      via: "kInput input handler strict parse"
      pattern: "parsePositiveInt"
---

<objective>
Refactor (#19): remove the copy-pasted generator field helpers scattered across the
eight `generate-*.ts` widgets by extracting them into a single new
`src/components/generate-fields.ts`, then import from one place. Fold in three small
hardening changes while consolidating: (1) `parseIntOrNull` honors the field's `min`
so below-min values (negatives) are rejected at the UI instead of reaching the kernel,
(2) the CPS `kInput` uses a strict integer parse, (3) the generate-ji-set limit input
gains a per-sub-method `max`. Separately, replace the static `<th>` innerHTML header
strings in `scale-table.ts` / `edo-ji-table.ts` with `createElement` + `textContent`
to keep the project's no-innerHTML discipline uniform.

Purpose: One source of truth for the field helpers; eliminate drift; finish the
no-innerHTML discipline; small input-hardening wins.
Output: New `generate-fields.ts` + its test; eight widgets re-pointed; two table
components de-innerHTML'd.

DO NOT change observable behavior except the three intended hardening changes. The
project values stability — every existing test must stay green.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md

# Source files being consolidated (read for exact helper bodies + divergences)
@src/components/generate-ji-set.ts
@src/components/generate-ed.ts
@src/components/generate-harmonic.ts
@src/components/generate-rank2.ts
@src/components/generate-welltemp.ts
@src/components/generate-cps.ts
@src/components/generate-cs.ts
@src/components/generate-fokker.ts
@src/components/scale-table.ts
@src/components/edo-ji-table.ts
</context>

<verified_findings>
Investigated the actual source before planning. Key facts the executor MUST honor:

DUPLICATE INVENTORY (verified body-by-body):
- `parseIntOrNull` (module-level): IDENTICAL body in ji-set, ed, harmonic, rank2,
  welltemp (5 copies — only the doc comments differ). Body: trim → ""→null →
  `parseInt(trimmed,10)` → `Number.isInteger(n) ? n : null`.
- `parsePositiveInt` (module-level): IDENTICAL body in cps, fokker (2 copies). Body:
  trim → ""→null → `/^\d+$/`-reject → `parseInt` → `(!Number.isInteger(n)||n<1)`→null.
- `parseRatio` (module-level): IDENTICAL body in cs, fokker (2 copies). Body: trim →
  `/^(\d+)\/(\d+)$/` → BigInt both → `<1n`→null → normalized `${n}/${d}`.
- `makeIntField` (nested inside the factory): DIVERGENT across the four files that have it:
  * ed, harmonic: call `parseIntOrNull(input.value)` in the input handler; NO clamp-reflection.
  * cs: inline trim+parseInt+Number.isInteger; NO clamp-reflection.
  * fokker: inline trim+parseInt+Number.isInteger; PLUS a clamp-reflection line
    `input.value = String(Math.max(0, Math.min(MAX_EXTENT, parsed)))` — UNIQUE to fokker.
  All four also (a) hardcode a per-component BEM className (`generate-ed__field`,
  `generate-harmonic__field`, `generate-cs__field`, `generate-fokker__field`) and
  (b) capture the closure's `rebuild()`.
- `makeRatioField` (nested): exists ONLY in ed + harmonic; bodies identical except the
  per-component BEM className (`__field`, `__slash`) and the captured `rebuild()`.

CRITICAL REGRESSION RISK — CSS is BEM-scoped per component:
  Each `generate-*.css` defines its own `.generate-XXX__field` / `__field-label` /
  `__slash` rules (verified: 4–8 field rules per file; NO shared rules in generate.css).
  Therefore the shared factory MUST receive the call site's existing className prefix
  and reproduce the EXACT same class names. Changing/normalizing class names = visual
  regression. Preserve them verbatim per call site.

MIN-REJECTION CHANGE (intended hardening):
  Today `min` lives only as the input's `min` attribute and is enforced lazily by the
  kernel's RangeError. The consolidated parse path must read the effective `min` and
  return null for below-min values so closure state is left untouched (same "leave
  state, no crash" idiom already used for empty/non-integer). Make `min` available at
  parse time — pass it as a parameter to the consolidated `parseIntOrNull` (default
  `-Infinity` to preserve the current no-floor behavior for any caller that does not
  opt in). See per-task wiring below for which call sites opt in.

CPS kInput STRICT PARSE (intended hardening):
  generate-cps.ts line ~276 currently does lenient `parseInt(kInput.value, 10)` then
  `if (Number.isInteger(parsed))`. Lenient parseInt coerces "3.5"→3, "3abc"→3. Replace
  with the consolidated strict `parsePositiveInt` (kernel requires `1 <= k <= factors.length`
  integer — verified src/lib/cps.ts:67). Preserve the existing "leave k untouched on
  invalid (null)" semantics; the upper bound stays enforced by the kernel RangeError
  (unchanged). The chip-input add path (line ~249) already uses `parsePositiveInt` —
  re-point it to the import, behavior identical.

JI-SET per-sub-method MAX (intended hardening) — kernel caps (verified):
  diamond → diamondScale → enumerateDiamond bounds oddLimit ≤ 1023 (src/lib/diamond.ts:70);
    NOTE diamond ALSO requires ODD oddLimit (even rejected) — that constraint is
    unchanged here; only add max="1023". Do NOT add new odd-only UI validation.
  odd-limit → oddLimitSet limit ∈ [1,31] (ODD_LIMIT_CAP=31, src/lib/edo.ts:32 / generators.ts).
  prime-limit → primeLimitSet limit ∈ [1,31] (same cap).
  farey → fareyScale order ∈ [1, MAX_FAREY_ORDER=1000] (src/lib/generators.ts:56).
  The limitInput already has `min="1"`; add the matching `max` and update it on
  sub-method swap (mirror the existing label/aria-label/value swap in the change handler).

TH INNERHTML (no behavior change — pure DOM-construction swap):
  scale-table.ts ~63-65: two variants —
    tempered  → `<tr><th>Degree</th><th>Cents</th><th>¢ from 12-TET</th></tr>`
    JI (else) → `<tr><th>Degree</th><th>Ratio</th><th>Cents</th><th>¢ from 12-TET</th></tr>`
  edo-ji-table.ts ~141: one variant —
    `<tr><th>Step</th><th>Cents</th><th>JI Approx</th></tr>`
  NO colspan / class / other attributes on any of these <th> or <tr> — plain text only.
  Replace each with createElement('tr') + createElement('th') + textContent, appended
  to the existing `thead`. Header strings must match BYTE-FOR-BYTE (incl. the "¢"
  glyph and the em/non-breaking characters as written).
</verified_findings>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create src/components/generate-fields.ts with the consolidated helpers + tests</name>
  <files>src/components/generate-fields.ts, src/components/__tests__/generate-fields.test.ts</files>
  <behavior>
    parseIntOrNull(raw, min = -Infinity):
      - "" / whitespace → null
      - non-integer ("3.5", "abc", "1e3") → null
      - integer ≥ min → the number
      - integer < min → null   (NEW: e.g. parseIntOrNull("-1", 1) === null; parseIntOrNull("0", 1) === null; parseIntOrNull("1", 1) === 1)
      - no min passed → current behavior preserved (parseIntOrNull("-5") === -5)
    parsePositiveInt(raw):
      - strict /^\d+$/ — rejects "3.5", "3abc", "1e3", "0x4", "-2", "" → null
      - "0" → null (n < 1); "1" → 1; "12" → 12
    parseRatio(raw):
      - "3/2" → "3/2"; " 5/4 " → "5/4"; "0/1" → null; "1/0" → null; "abc" → null; "3" → null
      - BigInt-backed: a numerator/denominator past 2^53 is preserved exactly, not rounded
    makeIntField(classPrefix, labelText, nameAttr, value, onInput, attrs?, opts?):
      - returns a div.{classPrefix}__field containing a span.{classPrefix}__field-label and an input[type=number][step=1]
      - sets input.min / input.max from attrs when provided; sets value + aria-label = labelText
      - input handler: parse via parseIntOrNull honoring attrs.min (when present), call onInput(parsed) + opts.onCommit() on a non-null parse; do nothing on null
      - optional opts.clampReflect: when true, after onCommit, reflect input.value = String(clamp(parsed)) using the [min..max] from attrs (preserves fokker's MAX_EXTENT snap-back)
    makeRatioField(classPrefix, labelText, nNameAttr, dNameAttr, initialN, initialD, onChange, opts?):
      - returns div.{classPrefix}__field with n input + span.{classPrefix}__slash "/" + d input, each min=1 step=1, own name + aria-label "{labelText} numerator/denominator"
      - both inputs' input handler: parse n and d via parseIntOrNull(min 1); bail if either null; else onChange(n,d) + opts.onCommit()
  </behavior>
  <action>
    Create src/components/generate-fields.ts exporting the five helpers. Derive the exact
    bodies from the verified findings above — the three parse functions are the existing
    bodies verbatim plus the new `min` parameter on parseIntOrNull (default -Infinity;
    after the Number.isInteger check, `return n >= min ? n : null`).

    For makeIntField / makeRatioField: hoist the nested ed/harmonic/cs/fokker bodies into
    standalone factories that take a `classPrefix` string (so each call site keeps its
    own BEM class names — see CSS regression risk in verified_findings) and an
    `onCommit` callback in place of the closure-captured `rebuild()`. Parameterize the
    two divergences: (a) makeIntField parses via parseIntOrNull(value, attrs.min) so the
    cs/fokker inline-parse and ed/harmonic parseIntOrNull paths converge on one
    behavior — this is acceptable because all four had functionally identical parse
    intent (reject empty/non-integer); the only new effect is min-rejection, which is the
    intended hardening; (b) fokker's clamp-reflection becomes opt-in via opts.clampReflect
    so only fokker keeps the snap-back.

    Do NOT inline code fences in this action — author via the Write tool. Match the
    project's existing JSDoc + comment style (see the source files). Import-as-.js
    convention applies to consumers (next task), not to this leaf module.

    Write generate-fields.test.ts (vitest + happy-dom, mirror generate-ed.test.ts setup)
    covering every bullet in <behavior>, especially: min-rejection (negatives + below-min),
    strict parsePositiveInt rejection of "3.5"/"3abc", parseRatio BigInt-exactness past
    2^53, and that makeIntField applies the right className prefix + min/max attrs + fires
    onCommit only on a valid parse.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx vitest run src/components/__tests__/generate-fields.test.ts && npx tsc --noEmit</automated>
  </verify>
  <done>generate-fields.ts exports all five helpers with the verified bodies + the min param + opt-in clampReflect; its test passes; tsc --noEmit clean.</done>
</task>

<task type="auto">
  <name>Task 2: Re-point all eight generate-*.ts widgets to the shared helpers + apply CPS strict parse and ji-set max</name>
  <files>src/components/generate-ji-set.ts, src/components/generate-ed.ts, src/components/generate-harmonic.ts, src/components/generate-rank2.ts, src/components/generate-welltemp.ts, src/components/generate-cps.ts, src/components/generate-cs.ts, src/components/generate-fokker.ts</files>
  <action>
    In each of the eight files: delete the local copy of every helper now living in
    generate-fields.ts and add `import { ... } from "./generate-fields.js";` (the .js
    extension per CLAUDE.md Framework convention). Specifically:

    - ji-set, rank2, welltemp: import parseIntOrNull (drop local copy). These call
      parseIntOrNull only at module-level/handler call sites — pass the field's min where
      one exists so the min-rejection hardening takes effect. For ji-set, the limitInput
      handler should call parseIntOrNull(limitInput.value, 1) (min=1 matches the existing
      min attribute). welltemp's parseIntOrNull may take a negative numerator (its comment
      notes negatives are valid) — DO NOT pass a min there (keep the no-floor default) so
      existing behavior is preserved. rank2: pass min only where the existing input has a
      min="1" attribute; otherwise keep the no-floor default. Verify against each call
      site before adding a min — do not introduce min-rejection where the field legitimately
      accepts negatives/zero.
    - ed, harmonic: import parseIntOrNull + makeIntField + makeRatioField; delete the local
      nested copies. Replace each makeIntField/makeRatioField call with the shared factory,
      passing classPrefix "generate-ed" / "generate-harmonic" respectively and
      onCommit: rebuild. Existing per-call min/max attrs (e.g. { min: "1" }) pass through
      unchanged — they now also drive parse-time min-rejection (intended).
    - cs: import parseRatio + makeIntField; delete local copies. classPrefix "generate-cs",
      onCommit: rebuild. cs's makeIntField had no min on its ordinal field — keep it that
      way (no behavior change) unless it already carried a min attr.
    - fokker: import parsePositiveInt + parseRatio + makeIntField; delete local copies.
      classPrefix "generate-fokker", onCommit: rebuild, and opts.clampReflect: true on the
      extent fields so the MAX_EXTENT snap-back is preserved (still uses attrs max for the clamp).
    - cps: import parsePositiveInt; delete local copy. Re-point the chip-input add handler
      (line ~249) to the imported parsePositiveInt (identical behavior). Replace the kInput
      input handler (line ~276) lenient `parseInt(kInput.value, 10)` + Number.isInteger
      gate with `const parsed = parsePositiveInt(kInput.value); if (parsed !== null) { k = parsed; rebuild(); }`
      — this is the STRICT-parse hardening; preserves "leave k untouched on invalid".

    ji-set per-sub-method MAX: in generate-ji-set.ts add a MAX-per-sub-method map alongside
    DEFAULT_LIMIT / LIMIT_LABEL:
      diamond 1023, odd-limit 31, prime-limit 31, farey 1000 (kernel caps, verified).
    Set limitInput.max = String(MAX[sub]) at construction (after the existing min/step),
    and in the subSelect change handler add a line setting limitInput.max alongside the
    existing label/aria/value swap. Do NOT add odd-only validation for diamond — out of scope.

    Remove now-unused imports/constants left behind by the deletions (e.g. if fokker's
    MAX_EXTENT is still referenced by the clampReflect path, KEEP it; only remove what is
    genuinely orphaned). Run tsc to catch dangling references.

    Stability guard: this is a refactor. Apart from (a) min-rejection on opted-in fields,
    (b) CPS strict kInput parse, (c) ji-set max attribute, NOTHING else may change. If any
    call site's class names, aria-labels, names, defaults, or rebuild wiring would shift,
    that is a regression — preserve them exactly.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx vitest run src/components/__tests__/generate-ji-set.test.ts src/components/__tests__/generate-ed.test.ts src/components/__tests__/generate-harmonic.test.ts src/components/__tests__/generate-rank2.test.ts src/components/__tests__/generate-welltemp.test.ts src/components/__tests__/generate-cps.test.ts src/components/__tests__/generate-cs.test.ts src/components/__tests__/generate-fokker.test.ts && npx tsc --noEmit && grep -L "from \"./generate-fields.js\"" src/components/generate-ji-set.ts src/components/generate-ed.ts src/components/generate-harmonic.ts src/components/generate-rank2.ts src/components/generate-welltemp.ts src/components/generate-cps.ts src/components/generate-cs.ts src/components/generate-fokker.ts</automated>
  </verify>
  <done>All eight widgets import from generate-fields.js with no local helper copies; their tests pass; tsc clean; the grep -L returns no file (every file has the import); CPS kInput rejects "3.5"/"3abc"; ji-set limit input has per-sub-method max.</done>
</task>

<task type="auto">
  <name>Task 3: Replace static &lt;th&gt; innerHTML headers in scale-table.ts and edo-ji-table.ts with createElement + textContent</name>
  <files>src/components/scale-table.ts, src/components/edo-ji-table.ts</files>
  <action>
    scale-table.ts (~lines 60-66): replace the `thead.innerHTML = tempered ? ... : ...`
    assignment with DOM construction. Build one `<tr>` (createElement('tr')), then append
    one `<th>` (createElement('th'), th.textContent = label) per header label, then
    thead.appendChild(tr). Use the verified label lists:
      tempered: ["Degree", "Cents", "¢ from 12-TET"]
      JI (else): ["Degree", "Ratio", "Cents", "¢ from 12-TET"]
    The "¢ from 12-TET" string must be byte-identical to the current innerHTML (copy the
    glyph exactly). Update/remove the now-stale "innerHTML is safe" comment to reflect the
    textContent discipline.

    edo-ji-table.ts (~line 138-142): same swap for the single header
      ["Step", "Cents", "JI Approx"].
    Update the stale "innerHTML safe" comment.

    No colspan/class/other attributes existed on these <th>/<tr> — do not add any. This is
    a pure construction-method swap; rendered output must be identical.
  </action>
  <verify>
    <automated>cd "/Users/taylorbrook/Dev/Tuning Systems" && npx vitest run src/components/__tests__/scale-table.test.ts src/components/__tests__/edo-ji-table.test.ts && grep -c "innerHTML" src/components/scale-table.ts src/components/edo-ji-table.ts && npx tsc --noEmit</automated>
  </verify>
  <done>Neither file constructs headers via innerHTML (the remaining innerHTML mentions, if any, are comments documenting the discipline, not assignments — verify visually that no `thead.innerHTML =` / `.innerHTML =` assignment remains); both table tests pass; tsc clean.</done>
</task>

</tasks>

<verification>
Full-suite + type-check + build gate after all three tasks:

```
cd "/Users/taylorbrook/Dev/Tuning Systems" && npm run lint:types && npm run test && npm run build
```

Manual regression sanity (no behavior change beyond the three intended):
- Open the Generate page in `npm run dev`; for each widget confirm fields render with the
  same styling (BEM classes intact), same defaults, edits still rebuild the table.
- ji-set: confirm the limit input now caps at 1023/31/31/1000 per sub-method (browser
  number spinner respects max).
- CPS: typing "3.5" or "3abc" into k leaves k unchanged (no coercion to 3).
</verification>

<success_criteria>
- src/components/generate-fields.ts exists and exports parseIntOrNull, parsePositiveInt,
  parseRatio, makeIntField, makeRatioField.
- All eight generate-*.ts import these from "./generate-fields.js" and contain no local copies.
- Consolidated parseIntOrNull rejects below-min values on opted-in fields; ji-set negatives
  rejected at UI.
- CPS kInput strict-parses (rejects "3.5"/"3abc").
- generate-ji-set limit input has per-sub-method max (1023/31/31/1000).
- scale-table.ts + edo-ji-table.ts build <th> via createElement + textContent (no innerHTML
  assignment).
- `npm run ci`-equivalent gates pass (lint:types, test, build); existing test count unchanged
  or higher (new generate-fields tests added). No unrelated behavior changed.
</success_criteria>

<output>
Create `.planning/quick/260616-efo-extract-duplicated-generator-helpers-int/260616-efo-SUMMARY.md` when done.
</output>
