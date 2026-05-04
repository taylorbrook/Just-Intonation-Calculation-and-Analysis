---
id: 260504-i3v
description: "fix CR-01: Interval.octaveReduce infinite loop on period <= 1/1"
date: 2026-05-04
status: complete
commits:
  - 5591d54  # fix(quick-260504-i3v): reject period <= 1/1 in Interval.octaveReduce
  - e288037  # fix(quick-260504-i3v): reject period <= 1/1 in Scale constructor
files_changed:
  - src/lib/interval.ts
  - src/lib/scale.ts
  - src/lib/__tests__/interval.test.ts
  - src/lib/__tests__/scale.test.ts
tests:
  total: 140
  passed: 140
  new: 4
---

# Quick Task 260504-i3v — Summary

## What changed

Closes **CR-01** from `.planning/phases/02-math-kernel-composition-anchor-mvp/02-REVIEW.md`.

`Interval.octaveReduce` previously infinite-looped when `period <= 1/1`:
- `period = 1/1` → loop B (`while f >= pf`) divides `f / 1 = f` forever.
- `period < 1/1` → loop B divides by a fraction `< 1`, so `f` grows unboundedly.

`Scale`'s constructor accepted any `period` without validation, so a malformed
period (e.g. a single-element scale where the default period = `intervals[0] = 1/1`,
or an explicit `period: 1/1` override) would silently wait until the first
`reduce()` / `rotate()` call to hang the dashboard tab.

### Fix

1. **`src/lib/interval.ts`** — guard at the kernel boundary in `octaveReduce`:
   ```ts
   if (p.fraction.compare(one) <= 0) {
     throw new RangeError(
       `Interval.octaveReduce: period must be > 1/1 (got ${p.fraction.toFraction()})`,
     );
   }
   ```

2. **`src/lib/scale.ts`** — mirror guard in `Scale` constructor so the failure is
   reported at construction time, not at first `.reduce()`. Imports `Fraction`
   from `fraction.js` (R-01 — never from `xen-dev-utils`).

3. Added 4 unit tests:
   - `Interval.octaveReduce` throws `RangeError` when `period === 1/1`.
   - `Interval.octaveReduce` throws `RangeError` when `period < 1/1` (`1/2`).
   - `new Scale(..., new Interval("1/1"))` throws `RangeError` (explicit override).
   - `new Scale([new Interval("1/1")])` throws `RangeError` (default period = last interval = `1/1`).

## Verification

- `npx vitest run` — **140/140 passing** (was 136 + 4 new = 140).
- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/{interval,scale}.ts src/lib/__tests__/{interval,scale}.test.ts` — clean.

## must_haves traceability

| must_have                                                              | evidence                                                        |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Interval.octaveReduce` throws `RangeError` when period <= 1/1         | `interval.ts:78-92`, tests at `interval.test.ts:88-95`          |
| `Scale` constructor throws `RangeError` when period <= 1/1             | `scale.ts:30-44`, tests at `scale.test.ts:29-41`                |
| Round-trip behavior for valid period > 1/1 unchanged                   | All 16 pre-existing `Interval` + 23 pre-existing `Scale` tests still pass |
| `src/lib/interval.ts` updated with period validation                   | commit 5591d54                                                  |
| `src/lib/scale.ts` updated with period validation                      | commit e288037                                                  |
| `src/lib/__tests__/interval.test.ts` has guard test                    | commit 5591d54 — 2 new tests                                    |
| `src/lib/__tests__/scale.test.ts` has guard test                       | commit e288037 — 2 new tests                                    |

## Notes

- This is a kernel-boundary tightening only. No changes to `parseScala`,
  `parseScl`, `writeScl`, audio layer, or dashboard. The bug was reachable from
  user input (malformed `.scl`, dashboard textarea) but the fix sits behind the
  data path, not in it.
- Defense-in-depth: both layers (`Interval.octaveReduce` and `Scale` constructor)
  now reject `period <= 1/1`. `Scale`'s guard fires earliest; `Interval`'s guard
  catches direct callers that bypass `Scale`.
- R-01 honored: `scale.ts` imports `Fraction` from `fraction.js`, not `xen-dev-utils`.
