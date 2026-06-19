---
phase: quick-260619-gpc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/interval.ts
  - src/lib/cents.ts
  - src/lib/scale.ts
  - src/lib/harmonic.ts
  - src/lib/generators.ts
  - src/lib/cps.ts
  - src/lib/sonicweave.ts
  - src/lib/scala.ts
  - src/lib/fokker.ts
  - src/lib/edo.ts
  - src/lib/mos.ts
autonomous: true
requirements: [REVIEW-260618-wgg]
must_haves:
  truths:
    - "The period > 1/1 guard reads identically across scale, interval, harmonic, generators (one predicate, not four spellings)"
    - "The non-positive-ratio guard reads identically where a kernel Interval is in hand (interval.octaveReduce, cps factor check)"
    - "The cents-from-12tet projection formula c - Math.round(c/100)*100 exists in exactly one place"
    - "fokker.ts has no hand-maintained PRIMES array — it reuses the shared monzo.ts re-export"
    - "Every behavior is preserved: npm test stays 753/753 green and npm run ci exits 0 after every commit"
  artifacts:
    - path: src/lib/interval.ts
      provides: "isAboveUnison predicate (C1) + isPositive predicate (C2); centsFrom12tet getter delegates to cents.ts (C3)"
    - path: src/lib/fokker.ts
      provides: "imports PRIMES from ./monzo.js (D3); no local PRIMES const"
  key_links:
    - from: src/lib/interval.ts
      to: src/lib/cents.ts
      via: "centsFrom12tet getter imports + delegates to centsFrom12tet()"
      pattern: "centsFrom12tet"
    - from: src/lib/fokker.ts
      to: src/lib/monzo.ts
      via: "import { PRIMES } from ./monzo.js"
      pattern: "from \"\\./monzo\\.js\""
---

<objective>
Apply the remaining `src/lib` review items (C1, C2, C3, C4, D3, B1, B2, and the
header-cleanup doc-nit) from
`.planning/quick/260618-wgg-do-a-code-review-and-simplification-pass/260618-wgg-REVIEW.md`.
S1–S3 + D1 already shipped in quick task 260619-f7n, so the shared `finalizeScale`
helper, the `Interval.key` getter, and the shared `UNISON` / `OCTAVE` singletons
already exist — this plan builds the remaining consistency/dedup/cleanup items ON TOP
of those.

Purpose: every item is a pure consistency / DRY / doc cleanup. ALL changes are
behavior-preserving — no metric changes, no algorithm changes, no output changes.
The 753-test `src/lib` suite is the regression gate and MUST stay 753/753 green after
EVERY commit, and `npm run ci` MUST exit 0 at the end.

Output: 8 atomic commits (one per review item), conventional-commit subjects scoped
`quick-260619-gpc`.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/quick/260618-wgg-do-a-code-review-and-simplification-pass/260618-wgg-REVIEW.md
@./CLAUDE.md
@src/lib/interval.ts
@src/lib/cents.ts
@src/lib/scale.ts
@src/lib/harmonic.ts
@src/lib/generators.ts
@src/lib/cps.ts
@src/lib/sonicweave.ts
@src/lib/scala.ts
@src/lib/fokker.ts
@src/lib/monzo.ts
@src/lib/edo.ts
@src/lib/mos.ts
</context>

<critical_constraints>
GROUNDED IN POST-f7n CODE (line numbers below are VERIFIED against the current files,
NOT the stale review). Key facts established during planning:

1. **Shared singletons already exist** (S3): `interval.ts` exports
   `export const UNISON = new Interval("1/1")` and
   `export const OCTAVE = new Interval("2/1")` (interval.ts:184-185). scale.ts,
   harmonic.ts, generators.ts, cps.ts, edo.ts, mos.ts all already import + use them.

2. **`Interval.key` getter already exists** (S1, interval.ts:121-123) and
   `finalizeScale` already exists (scale.ts:147-165). DO NOT re-add these.

3. **C2 routing is constrained — an Interval/Fraction must be IN HAND:**
   - interval.ts octaveReduce (interval.ts:156): guards a kernel `Fraction f` →
     route through the new predicate (an Interval IS available: `this`).
   - cps.ts (cps.ts:75): guards `f.fraction` where `f` is a kernel `Interval` →
     route through `f.isPositive()`.
   - sonicweave.ts (sonicweave.ts:132): `f` is a **SonicWeave runtime Fraction**
     (`.s`/`.n` are runtime **Numbers**), NOT a kernel Interval — the kernel
     Interval is only constructed on the NEXT line (sonicweave.ts:135). C2 CANNOT
     route this guard through `Interval.isPositive()`. This guard is C4's target
     (cosmetic `0n` → `0`), NOT C2's.
   - scala.ts parsePitchToken (scala.ts:326): guards `Number(numStr) <= 0 ||
     Number(denStr) <= 0` on PARSED STRINGS, BEFORE the Interval is constructed
     (scala.ts:331). No Interval in hand → C2 MUST leave this string-based guard
     UNCHANGED.

4. **C4 is NOT subsumed by C2** (see #3): sonicweave's guard cannot route through
   `isPositive()` because no kernel Interval exists at that point. Sequence: C2
   first (interval.ts + cps.ts), then C4 fixes the sonicweave literal independently.

5. **D3 is a clean swap:** fokker.ts:65 `const PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37]`
   is byte-identical to xen-dev-utils' first 12 PRIMES (verified). monzo.ts:18
   re-exports `PRIMES` (D1 removed monzoAdd/Sub/Scale/wilsonHeight but PRIMES
   survived — verified). fokker.ts does NOT import from monzo.ts yet and monzo.ts
   does NOT import fokker (no circular import). fokker.ts uses `PRIMES[idx]` only at
   fokker.ts:141. fokker.ts does NOT export PRIMES (no public-surface break). The
   fokker tests define their OWN local PRIMES in fokker.test.ts (do not import it).

6. **C3 import direction is SAFE:** cents.ts imports ONLY from xen-dev-utils
   (no kernel imports), so interval.ts importing `centsFrom12tet` from `./cents.js`
   creates NO circular dependency. (interval.ts already imports from xen-dev-utils;
   add the cents.ts import.)

7. **Cleanup is conservative — f7n already trimmed most headers.** The module
   headers in cps/harmonic/generators/mos/scale already say "via the shared
   `finalizeScale`" / "via the shared tail". The remaining cleanup is to verify each
   header points at the shared helper and trim any RESIDUAL passage that still
   re-describes the dedupe→sort→append idiom in full rather than deferring to
   finalizeScale. Comment-only. If a header is already clean, leave it.

8. **BOM hygiene:** all 12 in-scope files were verified BOM-FREE at plan time
   (none begins with the byte sequence 0xEF 0xBB 0xBF). Keep them BOM-free.
   Hazard: writing the U+FEFF character into a file (whether as a literal or via a
   unicode escape that the editor materializes on roundtrip) embeds a literal BOM
   in the bytes. If any edit would introduce one, author the change via a script
   and byte-strip 0xEF 0xBB 0xBF afterward (e.g. perl -0777 -i -pe to remove it),
   then re-scan the file's bytes to confirm none remain. NEVER type, paste, or
   escape the U+FEFF character anywhere in source or in this plan — refer to it
   only by its codepoint name (U+FEFF) or its UTF-8 byte sequence (0xEF 0xBB 0xBF).

9. **No `--no-verify`.** Plain `git commit`. ONE atomic commit per item.

SEQUENCING (load-bearing — do the tasks IN THIS ORDER):
C1 → C2 → C3 → C4 → D3 → B1 → B2 → Cleanup.
- C1 before C2: both add Interval predicates; land the structural one first.
- C2 before C4: per task detail; C2 covers the routable guards, C4 then fixes the
  sonicweave literal that C2 could not route.
- C1 + C3 before Cleanup: Cleanup may reference the final predicate names and the
  delegated getter, so it runs LAST.
</critical_constraints>

<tasks>

<task type="auto">
  <name>Task 1 (C1): Unify the "period > 1/1" guard behind one Interval predicate</name>
  <files>src/lib/interval.ts, src/lib/scale.ts, src/lib/harmonic.ts, src/lib/generators.ts</files>
  <action>
Add a single shared predicate on `Interval` built on the shared UNISON singleton
(S3), then route the 4 spellings of the "period must be > 1/1" guard through it.

1. In `src/lib/interval.ts`, add an instance method on the `Interval` class:
   `isAboveUnison(): boolean { return this.fraction.compare(UNISON.fraction) > 0; }`.
   Add it after the `key` getter (~interval.ts:123) and BEFORE `mul` so it sits with
   the other accessors. Add a one-line doc comment: this is the single source of
   truth for the "is this interval strictly above 1/1?" contract that Scale,
   Interval.octaveReduce, adoScale, and edScale all enforce as the period guard.
   NOTE: `UNISON` is declared at interval.ts:184 (after the class), but JS class
   methods are evaluated at call time, not definition time — the const is in scope
   when `isAboveUnison` actually runs. (Confirm via the passing test suite.)

2. Route the 4 guards to `!iv.isAboveUnison()` (the negation = "is NOT above unison"
   = "is <= 1/1", preserving the exact existing reject condition). The error MESSAGES
   and thrown types (RangeError) stay byte-identical — only the boolean expression
   changes:
   - `src/lib/scale.ts:39` (constructor): `p.fraction.compare(UNISON.fraction) <= 0`
     → `!p.isAboveUnison()`.
   - `src/lib/interval.ts:144` (octaveReduce period guard):
     `p.fraction.compare(one) <= 0` → `!p.isAboveUnison()`. The local
     `const one = new Fraction(1n, 1n)` (interval.ts:143) is STILL used by the
     octave-reduction loop (interval.ts:163-164 `f.compare(one)`) and by the
     non-positive guard comment, so KEEP the `one` declaration — only the period
     guard expression changes. Do NOT remove `one`.
   - `src/lib/harmonic.ts:148` (adoScale equave guard):
     `equave.fraction.compare(UNISON.fraction) <= 0` → `!equave.isAboveUnison()`.
   - `src/lib/generators.ts:219` (edScale equave guard):
     `equave.fraction.compare(UNISON.fraction) <= 0` → `!equave.isAboveUnison()`.

DO NOT change mos.ts:145 / mos.ts:201 (`period.fraction.compare(UNISON.fraction) <= 0`)
or edo.ts in this task — the review's C1 scope is exactly the 4 sites above. (Optional:
if routing mos.ts through the predicate is trivially behavior-preserving you MAY include
it for consistency, but it is NOT required by C1 — prefer the minimal 4-site change to
keep the commit tight. If you include mos.ts, keep it in THIS commit.)

Do NOT touch the non-positive `f.s < 0n || f.n === 0n` guard (that is C2).
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>One `isAboveUnison()` predicate on Interval; the 4 period guards in scale/interval/harmonic/generators route through it; error messages + RangeError types unchanged; `npm test` 753/753 green. Committed: `refactor(quick-260619-gpc): unify period > 1/1 guard via Interval.isAboveUnison (C1)`.</done>
</task>

<task type="auto">
  <name>Task 2 (C2): Add Interval.isPositive() and route the in-hand non-positive guards</name>
  <files>src/lib/interval.ts, src/lib/cps.ts</files>
  <action>
Add an `isPositive()` predicate on `Interval` and route ONLY the two guards where a
kernel Interval/Fraction is actually in hand. Do NOT touch sonicweave.ts (C4) or
scala.ts (string-based, no Interval in hand — see critical_constraints #3).

1. In `src/lib/interval.ts`, add:
   `isPositive(): boolean { return this.fraction.s > 0n && this.fraction.n !== 0n; }`
   Place it next to `isAboveUnison` (added in Task 1). One-line doc: single source of
   truth for the "is this a positive ratio (> 0)?" fail-closed check — sign-and-zero
   based (`.s`/`.n`), NOT a compare-to-1 (which would over-reject valid sub-unison
   ratios). NOTE: `this.fraction.s` and `this.fraction.n` are BigInt on a kernel
   Interval (fraction.js@5 BigInt internals), so `> 0n` / `!== 0n` are the correct
   BigInt comparisons here.

2. Route the two in-hand guards. The negation must preserve the EXACT existing reject
   condition (`s < 0n || n === 0n` ≡ `!(s > 0n && n !== 0n)`):
   - `src/lib/interval.ts:156` (octaveReduce non-positive guard, currently
     `if (f.s < 0n || f.n === 0n)`): change to guard on the INTERVAL, not the local
     `f` — use `if (!this.isPositive())`. At this point `f` is still `this.fraction`
     (the loop reassigning `f` is BELOW this guard at interval.ts:163-164), so
     `this.isPositive()` and the old `f.s/f.n` test are equivalent. KEEP the existing
     explanatory comment block (interval.ts:150-155) about why this is sign/zero based
     and not compare(one) — it is load-bearing documentation; you MAY trim its now-
     redundant "`.s < 0n || .n === 0n`" spelling line to point at `isPositive()`.
   - `src/lib/cps.ts:75` (factor check, currently
     `if (factors.some((f) => f.fraction.s < 0n || f.fraction.n === 0n))`): change to
     `if (factors.some((f) => !f.isPositive()))`. KEEP the cps.ts:72-74 comment
     explaining WHY (reject non-positive factors at cps's own boundary).

3. Leave sonicweave.ts:132 and scala.ts:326 UNCHANGED in this task (sonicweave = C4;
   scala = intentionally string-based, no Interval in hand).
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>`isPositive()` predicate on Interval; interval.octaveReduce + cps factor check route through it; sonicweave + scala guards untouched; reject conditions + messages unchanged; `npm test` 753/753 green. Committed: `refactor(quick-260619-gpc): add Interval.isPositive and route in-hand non-positive guards (C2)`.</done>
</task>

<task type="auto">
  <name>Task 3 (C3): De-duplicate centsFrom12tet — getter delegates to cents.ts</name>
  <files>src/lib/interval.ts, src/lib/cents.ts</files>
  <action>
Have the `Interval.centsFrom12tet` getter delegate to the `cents.ts`
`centsFrom12tet` function so the projection formula `c - Math.round(c/100)*100`
lives in exactly one place (cents.ts:18-20).

Import direction is SAFE (verified): cents.ts imports ONLY from xen-dev-utils, so
interval.ts importing from cents.ts creates NO circular dependency.

1. In `src/lib/interval.ts`, add an import:
   `import { centsFrom12tet } from "./cents.js";` (use the `.js` extension per the
   project's Framework convention — see CLAUDE.md). Place it with the existing
   relative-import region (there are currently no relative imports in interval.ts —
   add it after the xen-dev-utils import at interval.ts:24, before the type alias).
   AVOID a name clash with the getter: import the function under its own name
   `centsFrom12tet` and reference it as the free function inside the getter (the
   getter is `get centsFrom12tet()`, a property accessor — the imported free function
   name does not collide with the accessor name at the call site below). If your
   tooling flags shadowing, alias the import as
   `import { centsFrom12tet as centsFrom12tetFn } from "./cents.js";` and call
   `centsFrom12tetFn(...)`.

2. Change the getter body (interval.ts:109-112) from
   `const c = this.cents; return c - Math.round(c / 100) * 100;`
   to delegate: `return centsFrom12tet(this.cents);` (or `centsFrom12tetFn(this.cents)`
   if aliased). Keep the getter signature `get centsFrom12tet(): number`. Update the
   getter's doc to note it delegates to the cents.ts projection (single source of
   truth).

3. Do NOT change cents.ts's `centsFrom12tet` body — it is now the sole owner of the
   formula. (Optionally add a one-line note in cents.ts that Interval.centsFrom12tet
   delegates here.)

Behavior is identical: same formula, same float, same result.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>The `c - Math.round(c/100)*100` formula exists ONLY in cents.ts; Interval.centsFrom12tet getter delegates to it; no circular import (tsc clean via build/ci); `npm test` 753/753 green. Committed: `refactor(quick-260619-gpc): Interval.centsFrom12tet delegates to cents.ts (C3)`.</done>
</task>

<task type="auto">
  <name>Task 4 (C4): Fix the Number/BigInt comparison clarity in sonicweave.ts</name>
  <files>src/lib/sonicweave.ts</files>
  <action>
Cosmetic clarity fix. At `src/lib/sonicweave.ts:132` the guard is
`if (f.s < 0n || Number(f.n) === 0)`. Here `f` is a SonicWeave runtime Fraction whose
`.s` and `.n` arrive as runtime **Numbers** (NOT BigInts — see the explanatory comment
at sonicweave.ts:129-131). The `< 0n` literal reads as if `f.s` were a BigInt.

Change ONLY `f.s < 0n` → `f.s < 0` (keep `Number(f.n) === 0` exactly as-is). The
behavior is identical (JS mixed number/bigint relational `<` already worked); this is
clarity only, matching the documented reality that `f.s` is a Number here.

Update the inline comment at sonicweave.ts:129-131 if it references the `0n` literal,
so the comment and code agree (the comment already explains f.s/f.n are Numbers — just
ensure no stale reference to comparing `.s` against a BigInt remains).

Do NOT route this through Interval.isPositive() — there is no kernel Interval in hand
at this point (the Interval is constructed on the next line, sonicweave.ts:135). This
guard correctly stays a literal check on the SonicWeave Fraction (C2 explicitly left
it for C4 — see critical_constraints #3/#4).
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>sonicweave.ts:132 reads `f.s < 0` (Number comparison); `Number(f.n) === 0` unchanged; comment and code agree; behavior identical; `npm test` 753/753 green. Committed: `style(quick-260619-gpc): clarify sonicweave sign test as Number comparison (C4)`.</done>
</task>

<task type="auto">
  <name>Task 5 (D3): fokker.ts reuses the shared PRIMES re-export</name>
  <files>src/lib/fokker.ts</files>
  <action>
Delete the hand-rolled local `PRIMES` array and import the shared `PRIMES`
re-export from monzo.ts.

Verified facts: fokker.ts:65 `const PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37]` is
byte-identical to xen-dev-utils' first 12 PRIMES (re-exported via monzo.ts:18). No
circular import (monzo.ts does not import fokker). fokker.ts uses `PRIMES[idx]` only
at fokker.ts:141. fokker.ts does NOT export PRIMES (no public-surface change). The
fokker tests define their own local PRIMES (they do not consume fokker's).

1. In `src/lib/fokker.ts`, change the import at fokker.ts:52
   (`import { toMonzo, integerDet } from "xen-dev-utils";`) — keep it, and ADD a new
   import line: `import { PRIMES } from "./monzo.js";` (use the `.js` extension per the
   Framework convention; monzo.ts re-exports PRIMES so the value is identical to
   pulling it from xen-dev-utils directly).
   - Alternatively, add `PRIMES` to the existing xen-dev-utils import. PREFER importing
     from `./monzo.js` per the review's intent (single shared boundary), since
     monzo.ts is the project's monzo/primes re-export home.

2. DELETE the local `const PRIMES = [...]` (fokker.ts:65) and its doc comment
   (fokker.ts:64). The remaining references at fokker.ts:80-82 (header doc),
   fokker.ts:99 (comment), and fokker.ts:141 (`survivingMonzoIndices.map((idx) =>
   PRIMES[idx])`) now resolve to the imported shared `PRIMES`. Index semantics are
   unchanged (PRIMES[0]=2, PRIMES[1]=3, …).

3. Optionally trim the header note (fokker.ts:64 region) to say it reuses the shared
   monzo.ts PRIMES rather than describing a local list.

Behavior is identical — same prime values, same indices.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>fokker.ts has no local PRIMES const; imports PRIMES from ./monzo.js; fokkerCardinality's live-prime readout unchanged; `npm test` 753/753 green. Committed: `refactor(quick-260619-gpc): fokker reuses shared PRIMES re-export (D3)`.</done>
</task>

<task type="auto">
  <name>Task 6 (B1): Document why bestEdosForScale includes both endpoints as zero-error degrees</name>
  <files>src/lib/edo.ts</files>
  <action>
KEEP current behavior (no metric change — the ranking is unaffected; this is
comment-only). `bestEdosForScale` builds `idealCentsList` (edo.ts:101) from ALL
intervals, including the unison (0¢) and the period (1200¢ for an octave scale). Both
are perfect fits at every EDO, so each contributes 0 to max/RMS and inflates the RMS
denominator by 2 "free" points — but the dilution is identical across all EDOs, so
RANKING is unaffected (a modeling nuance, not a bug).

The unison case is already commented (edo.ts:99-100). Add a comment documenting the
PERIOD case too:

1. In `src/lib/edo.ts`, extend the comment block at edo.ts:99-100 (the
   "The 1/1 unison is a free fit…" passage immediately above `const idealCentsList`)
   to ALSO note that the PERIOD interval (e.g. 1200¢ for an octave scale) is likewise
   a perfect fit at every EDO and is intentionally included. Document the decision:
   both endpoints stay in the error population because (a) the dilution is identical
   across all EDOs so ranking is unaffected, and (b) excluding them would require the
   builder to special-case the endpoints, adding complexity for a body-only metric the
   UI does not request. Note explicitly that reported RMS/max are therefore slightly
   optimistic versus a body-only metric — a documented, accepted modeling choice.

Comment-only. Do NOT change `idealCentsList`, the loop, or any metric. Do NOT change
the function signature or any output value.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>edo.ts documents why both the unison (0¢) and the period (1200¢) are included as zero-error degrees; no metric/behavior change; `npm test` 753/753 green. Committed: `docs(quick-260619-gpc): document endpoint inclusion in bestEdosForScale error population (B1)`.</done>
</task>

<task type="auto">
  <name>Task 7 (B2): Note the monotonic-insertion-order reliance on finalizeScale sort:false</name>
  <files>src/lib/scale.ts, src/lib/edo.ts</files>
  <action>
Add a one-line comment at the two builders that pass `{ sort: false }` to
finalizeScale, making the load-bearing invariant explicit: their nearest-ratio /
step insertion order is already monotonic ascending in cents, which is why
`finalizeScale(..., { sort: false })` is correct (preserving that order yields output
identical to a sort).

1. In `src/lib/scale.ts`, at `jiSubsetOfEdo`'s `finalizeScale(intervals, OCTAVE,
   { sort: false })` call (scale.ts:230). The existing comment (scale.ts:226-229)
   already explains sort:false; ADD/extend to state that this RELIES ON the monotonic
   nearest-ratio insertion order being ascending in cents (nearest-neighbor on a
   sorted candidate set is monotonic in the query), so `sort:false` is safe AND
   `finalizeScale`'s default `sort:true` would also be harmless — the order is
   already correct.

2. In `src/lib/edo.ts`, at `bestJiInEdo`'s `finalizeScale(intervals, OCTAVE,
   { sort: false })` call (edo.ts:185). The existing comment (edo.ts:182-184) already
   mirrors jiSubsetOfEdo; ADD the same one-line note that the monotonic step insertion
   order is what makes `sort:false` correct (the steps are produced in ascending-cents
   order; nearest-ratio selection preserves that monotonicity).

Comment-only. Do NOT change the `{ sort: false }` option or any logic.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>jiSubsetOfEdo (scale.ts) and bestJiInEdo (edo.ts) each document that finalizeScale's sort:false relies on monotonic nearest-ratio insertion order; no logic change; `npm test` 753/753 green. Committed: `docs(quick-260619-gpc): note monotonic-insertion reliance behind finalizeScale sort:false (B2)`.</done>
</task>

<task type="auto">
  <name>Task 8 (Cleanup): Trim residual hand-rolled-idiom passages in module headers</name>
  <files>src/lib/cps.ts, src/lib/harmonic.ts, src/lib/generators.ts, src/lib/mos.ts, src/lib/scale.ts</files>
  <action>
Now that `finalizeScale` owns the dedupe→sort→append-period tail (shipped in f7n),
trim any RESIDUAL header/comment passage that still RE-DESCRIBES the dedupe/append
idiom in full, and point it at the shared helper instead. f7n already trimmed most of
these — this task is a CONSERVATIVE final pass: read each header, and ONLY trim where a
passage still spells out the full "dedupe by exact n/d → sort by cents → append the
period" mechanics as if the module hand-rolls it. If a header already says "via the
shared `finalizeScale`" / "via the shared tail" and is concise, LEAVE IT.

Comment-only — NO logic change in any file.

Candidate passages to review (trim to a brief "via the shared `finalizeScale` tail"
reference where they redundantly re-describe the mechanics; preserve the load-bearing
Pitfall #1/#6 "never cents-within-epsilon" warnings and the D-07/D-14 period
contract — those are NOT redundant):
   - `src/lib/cps.ts`: header (cps.ts:8-21 region) and the `foldExactSet`-style inline
     comment — note cps has NO local fold helper anymore; it calls finalizeScale
     directly at cps.ts:108 with a comment at cps.ts:105-107. Trim that inline comment
     only if it re-describes mechanics finalizeScale already documents.
   - `src/lib/harmonic.ts`: `foldToOctave` (harmonic.ts:49-60) — the body comment
     (harmonic.ts:55-57) re-describes "octave-reduce → dedupe by exact n/d → sort →
     append the 2/1 period via the shared tail". Trim the mechanics re-description;
     keep "octave-reduce every interval into [1, 2) BEFORE calling finalizeScale" (that
     is the caller's required pre-condition, load-bearing) and the Pitfall warning.
   - `src/lib/generators.ts`: `foldExactSet` (generators.ts:62-77) — its doc/body
     comment re-describes the tail; trim to "delegates to the shared `finalizeScale`
     (callers reduce into [1, period) first)". Keep the Pitfall #1/#6 + D-07/D-14 note.
   - `src/lib/mos.ts`: the buildMos inline comment (mos.ts:181-184) and any header line
     that describes "sort, dedupe, append the period". Keep the HAND-TRACE blocks
     (mos.ts:113-142) — those are correctness documentation, NOT redundant.
   - `src/lib/scale.ts`: `Scale.reduce`/`Scale.dedupe` comments + the module header.
     scale.ts is finalizeScale's HOME, so its description of the tail is canonical, NOT
     redundant — only trim per-method comments that re-describe what finalizeScale
     already documents.

IMPORTANT: this is the LAST task — it may reference the final names from C1/C3
(`isAboveUnison`, the delegated `centsFrom12tet`) if any header mentions those guards.
Do NOT remove any comment that documents WHY (Pitfall references, decision IDs,
pre-conditions). When in doubt, leave the comment — over-trimming loses provenance.
  </action>
  <verify>
    <automated>npm run ci</automated>
  </verify>
  <done>Residual full re-descriptions of the dedupe/sort/append idiom in cps/harmonic/generators/mos/scale headers/comments point at the shared `finalizeScale` instead; Pitfall/decision-ID/pre-condition notes preserved; NO logic change; `npm run ci` exits 0 (tsc + 753/753 vitest + eslint + prettier + build all clean). Committed: `docs(quick-260619-gpc): trim residual dedupe-idiom passages toward shared finalizeScale (Cleanup)`.</done>
</task>

</tasks>

<verification>
After EACH task: `npm test` must finish 753/753 green (zero failures). Any red test
means the change altered behavior — revert and re-derive before committing.

Final gate (after Task 8): `npm run ci` must exit 0 — this runs
`tsc --noEmit && vitest run && eslint . && prettier --check . && observable build`.
All five stages must pass. Pay special attention to:
- tsc: the C3 cents.ts import and C1/C2 new Interval methods must type-check.
- prettier --check: all edited files must be formatted (run `npm run format` if needed,
  but fold any formatting into the relevant item's commit — do NOT add a separate
  formatting commit).
- BOM: confirm no edited file gained a literal BOM (all were BOM-free at plan time).
</verification>

<success_criteria>
- 8 atomic commits, one per review item (C1, C2, C3, C4, D3, B1, B2, Cleanup), each
  with a conventional-commit subject scoped `quick-260619-gpc`.
- `npm test` is 753/753 green after every commit (no behavior change at any step).
- `npm run ci` exits 0 after the final commit.
- C1: one `Interval.isAboveUnison()` predicate; 4 period guards route through it.
- C2: one `Interval.isPositive()` predicate; interval.octaveReduce + cps factor check
  route through it; sonicweave + scala guards correctly left unchanged.
- C3: the `c - Math.round(c/100)*100` formula lives only in cents.ts; the Interval
  getter delegates; no circular import.
- C4: sonicweave.ts sign test reads `f.s < 0` (Number); behavior identical.
- D3: fokker.ts has no local PRIMES; imports the shared re-export from monzo.ts.
- B1: bestEdosForScale documents the endpoint-inclusion decision (no metric change).
- B2: jiSubsetOfEdo + bestJiInEdo document the monotonic-insertion reliance behind
  sort:false.
- Cleanup: residual dedupe-idiom re-descriptions trimmed toward finalizeScale;
  Pitfall/decision-ID/pre-condition provenance preserved.
- No file gained a literal BOM.
</success_criteria>

<output>
This is a quick-task plan — no SUMMARY file required. On completion, the 8 commits ARE
the deliverable. Report the final `npm run ci` exit status and the 8 commit SHAs.
</output>
