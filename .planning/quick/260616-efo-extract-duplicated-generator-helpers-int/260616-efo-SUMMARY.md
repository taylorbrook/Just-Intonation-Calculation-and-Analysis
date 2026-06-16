---
phase: quick-260616-efo
plan: 01
subsystem: components/generate
tags: [refactor, dedup, hardening, no-innerHTML, "#19"]
requires:
  - src/components/generate-*.ts (the eight method widgets)
  - src/components/scale-table.ts
  - src/components/edo-ji-table.ts
provides:
  - src/components/generate-fields.ts (single source of truth for generator field helpers)
affects:
  - all eight generate-*.ts widgets
  - scale-table.ts / edo-ji-table.ts header construction
tech-stack:
  added: []
  patterns:
    - "Shared field-factory module takes a BEM classPrefix so per-component CSS keeps matching"
    - "Closure rebuild() passed as explicit opts.onCommit; fokker snap-back via opt-in opts.clampReflect"
key-files:
  created:
    - src/components/generate-fields.ts
    - src/components/__tests__/generate-fields.test.ts
  modified:
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
decisions:
  - "parseIntOrNull keeps legacy lenient parseInt body ('3.5'->3); only parsePositiveInt + CPS kInput got strict parse"
  - "makeRatioField parses n/d with min 1 (matches the inputs' min=1 attribute) per the plan's behavior spec"
  - "rank2 up/down/gen + cs ordinal min-rejection applied (all carry min attrs); welltemp keeps no-floor default (negative numerators valid)"
metrics:
  duration: ~9min
  completed: 2026-06-16
---

# Quick 260616-efo: Extract Duplicated Generator Helpers Summary

One source of truth (`src/components/generate-fields.ts`) for the five copy-pasted generator field helpers, eight widgets re-pointed to it, plus three folded-in hardening wins (min-rejection, strict CPS k parse, ji-set per-sub-method max) and the two table headers de-innerHTML'd — 729→751 vitest green (+22), tsc + build clean.

## What Was Built

**Task 1 — `generate-fields.ts` + tests (commit 3daa154):**
- Exports `parseIntOrNull(raw, min = -Infinity)`, `parsePositiveInt(raw)`, `parseRatio(raw)`, `makeIntField(classPrefix, ...)`, `makeRatioField(classPrefix, ...)`.
- `parseIntOrNull` adds an optional `min` (default -Infinity preserves the prior no-floor behavior); below-min integers return null at the UI layer.
- Field factories take a `classPrefix` (so each call site keeps its exact `generate-XXX__field` / `__field-label` / `__slash` BEM names), an `opts.onCommit` callback in place of the closure `rebuild()`, and `makeIntField` gains `opts.clampReflect` to preserve fokker's MAX_EXTENT snap-back.
- 22 tests cover every behavior bullet: min-rejection (negatives + below-min), strict `parsePositiveInt` rejection of `3.5`/`3abc`/`1e3`/`0x4`, `parseRatio` BigInt-exactness past 2^53, and factory class-prefix/min-max/onCommit/clampReflect wiring.

**Task 2 — eight widgets re-pointed (commit 61b7eaf):**
- Deleted every local helper copy; each widget now `import { ... } from "./generate-fields.js"`.
- ed/harmonic: import `makeIntField` + `makeRatioField` (+ `parseIntOrNull` transitively unused → not imported); existing per-call min/max pass through and now drive parse-time min-rejection.
- cs: import `makeIntField` + `parseRatio`. fokker: import `makeIntField` + `parsePositiveInt` + `parseRatio`, extent fields use `clampReflect: true`.
- cps: import `parsePositiveInt`; chip-add re-points to it (identical); **kInput handler switched from lenient `parseInt` to strict `parsePositiveInt`** (now rejects `3.5`/`3abc` instead of coercing to 3).
- ji-set: import `parseIntOrNull`, limit handler passes `min 1`; **added per-sub-method `max`** (diamond 1023, odd-limit 31, prime-limit 31, farey 1000) set at construction and swapped in the sub-method change handler.
- rank2: import `parseIntOrNull`, pass each field's min (up=1, down=0, gen n/d=1) to the parse.
- welltemp: import `parseIntOrNull`, **no min passed** (numerators legitimately negative, e.g. -1/6).

**Task 3 — table headers de-innerHTML'd (commit 9877447):**
- `scale-table.ts`: `thead.innerHTML = ...` (tempered 3-col / JI 4-col) replaced with a `createElement('tr')` + per-label `createElement('th')`/`textContent` loop; the `¢ from 12-TET` glyph copied byte-for-byte.
- `edo-ji-table.ts`: same swap for the single `[Step, Cents, JI Approx]` header.
- Both stale "innerHTML is safe" module comments updated to the uniform no-innerHTML discipline.

## Behavior Changes (the only three intended)

1. **Min-rejection** on opted-in fields (ji-set limit, rank2 up/down/gen, cs ordinal, ed/harmonic min-carrying fields): below-min values (negatives, below-floor) are now rejected at the UI, leaving closure state untouched, instead of reaching the kernel RangeError. welltemp deliberately exempt.
2. **CPS kInput strict parse**: `3.5`/`3abc` no longer coerce to 3; the field is left untouched. Upper bound still enforced by the kernel RangeError.
3. **ji-set per-sub-method max attribute**: the browser number spinner now caps at each sub-method's kernel ceiling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test] Corrected two test assertions to match the verified legacy `parseIntOrNull` body**
- **Found during:** Task 1 (first test run).
- **Issue:** Initial test asserted `parseIntOrNull("3.5") === null`, but the verified original body is `parseInt(trimmed, 10)` + `Number.isInteger` — which yields `3` for `"3.5"` and `1` for `"1e3"` (lenient by design). The consolidated function must preserve this (only `parsePositiveInt`/CPS got the strict-parse hardening), so the test was wrong, not the code.
- **Fix:** Split the assertion — `parseIntOrNull("abc") === null` (genuinely non-numeric) and a new "legacy lenient" test asserting `"3.5"->3`, `"1e3"->1`. Likewise updated the makeIntField "transient edit" test to use `"abc"` instead of `"3.5"`.
- **Files modified:** src/components/__tests__/generate-fields.test.ts
- **Commit:** 3daa154

No other deviations — the refactor preserved all class names, aria-labels, names, defaults, and rebuild wiring exactly.

## Verification

- Per-task: Task 1 (22 tests + tsc), Task 2 (114 widget tests + tsc + grep -L empty + no orphaned local defs), Task 3 (20 table tests + no `.innerHTML =` assignment remaining).
- Full gate: `npm run lint:types` clean, `npm run test` 751/751 pass (+22 vs 729 baseline), `npm run build` succeeds (140 links validated, no errors/warnings).

## Self-Check: PASSED

- FOUND: src/components/generate-fields.ts
- FOUND: src/components/__tests__/generate-fields.test.ts
- FOUND commit: 3daa154 (Task 1)
- FOUND commit: 61b7eaf (Task 2)
- FOUND commit: 9877447 (Task 3)
- Working tree clean (build artifacts gitignored).
