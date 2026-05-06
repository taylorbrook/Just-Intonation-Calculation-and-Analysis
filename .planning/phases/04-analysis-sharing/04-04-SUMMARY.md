---
phase: 04-analysis-sharing
plan: 04
subsystem: ui
tags: [edo, ji, components, vitest, happy-dom, sortable-table]

# Dependency graph
requires:
  - phase: 04-analysis-sharing
    provides: bestEdosForScale, bestJiInEdo, oddLimitApproximation (Plan 04-01 EDO mapping kernel)
  - phase: 02-authoring-input
    provides: Scale, Interval, SynthHandle factory contract (Pattern 2)
provides:
  - edoJitTable factory — sortable scale→EDO ranking with row-click arpeggio
  - edoJiTable factory — N-EDO→JI per-step with prime/odd toggle + limit clamp
  - Two colocated component CSS files (D-25 pattern continuation)
  - 21 happy-dom smoke tests covering both factories
affects: [04-05-dashboard-page, 04-07-analysis-styles, future-anal-plans]

# Tech tracking
tech-stack:
  added: []  # No new dependencies — reuses existing kernel + DOM
  patterns:
    - "Sort-in-place table: closure-local sortKey + sortDir; replaceChildren on every render"
    - "Toggle-driven re-render: <select> + <input> change handlers call shared renderTable() helper"
    - "Defensive kernel-error catch: try/catch around bestJiInEdo surfaces RangeError via aria-live status, never throws to caller"

key-files:
  created:
    - src/components/edo-jit-table.ts
    - src/components/edo-jit-table.css
    - src/components/edo-ji-table.ts
    - src/components/edo-ji-table.css
    - src/components/__tests__/edo-jit-table.test.ts
    - src/components/__tests__/edo-ji-table.test.ts
  modified: []

key-decisions:
  - "Sort behavior: clicking a header sets that key as the active sort and resets to ascending; clicking the SAME header again toggles ascending → descending. No tie-breaker beyond Array.sort stability."
  - "Both factories share a closure-local renderTbody/renderTable helper; UI state lives in plain `let` bindings, not module-level state (Pattern 2)."
  - "Limit input is bidirectional-clamped: HTML attribute (min/max=1/31) gives browser hint; runtime clampLimit() enforces; out-of-band initial opts.limit announces via status region on construction."
  - "Out-of-envelope kernel errors (e.g. xen-dev-utils approximatePrimeLimit safe-integer guard at 12-EDO + prime-limit=13) are caught and surfaced via aria-live=polite status — table tbody is cleared so the user sees nothing-rendered + the error message together."

patterns-established:
  - "Sortable-table pattern: column defs as ColumnDef[] with key + label + format; closure-local sortKey/sortDir state; renderTbody() rebuilds <tbody> with replaceChildren + createElement+textContent"
  - "Click-to-audition row pattern: each <tr> gets role=button, tabindex=0, click + keydown(Enter/Space) handlers, aria-label describing the action"
  - "Status region pattern (continuation of sclIo): <div role=status aria-live=polite> with textContent-only writes (T-04-13/T-04-17 mitigation)"

requirements-completed: [ANAL-01]

# Metrics
duration: 7min
completed: 2026-05-06
---

# Phase 04 Plan 04: EDO Tables Summary

**Two DOM-factory components — sortable scale→EDO ranking (`edoJitTable`) and N-EDO→JI per-step with prime/odd toggle (`edoJiTable`) — backed by Plan 04-01's mapping kernel, click-to-audition via SynthHandle.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-06T21:23:16Z
- **Completed:** 2026-05-06T21:30:05Z
- **Tasks:** 2 (both TDD)
- **Files created:** 6

## Accomplishments

- `edoJitTable(scale, synth, opts?) => HTMLElement` — 4-column ranking (EDO + max/RMS/Tenney cents-error), header-click sort with ascending/descending toggle, row-click arpeggiates the user's scale rendered at the clicked EDO's nearest steps via `synth.playArpeggio(freqs, stepSec)` per D-10.
- `edoJiTable(edoSteps, synth, opts?) => HTMLElement` — 3-column step→JI table (Step | Cents | JI Approx), prime/odd-limit `<select>` + numeric limit input with runtime clamp [1, 31], row-click plays a dyad via `synth.playNotes([baseHz, baseHz × ratio], 1.5)` per D-07 default.
- Both components colocate their own `.css` files per D-25; `@import` lines for `src/styles.css` are queued for Plan 04-07 to add (this plan deliberately did not modify `src/styles.css`).
- Both components catch the kernel's defensive `RangeError`s (`xen-dev-utils` safe-integer guard, ODD_LIMIT cap) and route them to a single aria-live status region — never throwing to the page cell.

## Final Exports + Signatures

```typescript
// src/components/edo-jit-table.ts
export interface EdoJitTableOpts {
  range?: { min: number; max: number };  // default { min: 5, max: 72 }
  baseHz?: number;                        // default 440
  stepSec?: number;                       // default 0.45
  precision?: number;                     // default 1
}
export function edoJitTable(scale: Scale, synth: SynthHandle, opts: EdoJitTableOpts = {}): HTMLElement;

// src/components/edo-ji-table.ts
export interface EdoJiTableOpts {
  kind?: EdoJiKind;   // 'prime' | 'odd', default 'prime'
  limit?: number;     // default 7, clamped to [1, 31]
  baseHz?: number;    // default 440
  precision?: number; // default 1
}
export function edoJiTable(edoSteps: number, synth: SynthHandle, opts: EdoJiTableOpts = {}): HTMLElement;
```

## Sort Behavior (`edoJitTable`)

- Initial state: `sortKey = "edoSteps"`, `sortDir = 1` (ascending). On render, the active column's `<span class="sort-arrow">` shows `▲` (or `▼` when descending) and `data-active="true"`; non-active columns show `—`.
- Click on a `<th>` whose key is NOT the active sort: switch `sortKey` to that column, reset `sortDir = 1`.
- Click on a `<th>` whose key IS the active sort: toggle `sortDir` between `1` and `-1`.
- Sorting uses `Array.prototype.sort((a, b) => (a[sortKey] - b[sortKey]) * sortDir)` on a copy of the precomputed rows. No tie-breaker beyond JavaScript's stable-sort guarantee.
- Each `<th>` carries `aria-sort="ascending" | "descending" | "none"`, plus `role="button"` + `tabindex="0"` + Enter/Space keydown handlers (matches Phase 3 keyboard component a11y).

## Status-Region Message Strings (`edoJiTable`)

These strings flow through the status region (`role="status"` + `aria-live="polite"`) via `textContent` only. Plan 04-07's threat-model grep can verify nothing reaches `innerHTML`.

| Trigger | Message |
| --- | --- |
| `kindSelect` change | `Showing prime-limit JI approximations.` / `Showing odd-limit JI approximations.` |
| Limit input clamp (out of [1, 31]) | `Limit clamped to {N} (must be in [1, 31]).` |
| Limit input non-finite | `Limit must be a number.` |
| Initial `opts.limit` clamped on construction | Same clamp message format. |
| `bestJiInEdo` throws (kernel guard tripped) | `Could not compute JI approximations: {error.message}` (e.g. `Numerator above safe limit` for prime-limit=13 at 12-EDO). |

## Task Commits

1. **Task 1: edoJitTable component** — `5a0c216` (feat)
2. **Task 2: edoJiTable component** — `da664f7` (feat)

_Both tasks were `tdd="true"`. Each one combines its RED test file + GREEN implementation into a single feat commit because the RED step was confirmed manually (vitest reported "Failed to resolve import" before the impl was written) — no separate `test(...)` commit was made. See "TDD Gate Compliance" below._

## Files Created

- `src/components/edo-jit-table.ts` — sortable EDO ranking factory.
- `src/components/edo-jit-table.css` — colocated styles (D-25). Theme-token-only.
- `src/components/edo-ji-table.ts` — EDO→JI per-step factory + prime/odd toggle.
- `src/components/edo-ji-table.css` — colocated styles (D-25).
- `src/components/__tests__/edo-jit-table.test.ts` — 10 happy-dom tests.
- `src/components/__tests__/edo-ji-table.test.ts` — 11 happy-dom tests.

## Decisions Made

See `key-decisions` in frontmatter. Key points:

1. **Sort toggle pattern** — Reset to ascending on column-switch is the common-case "I just want to know which is best" UX; the descending click is the deliberate "show me the worst" gesture. Single sort-direction memory is intentionally minimal.
2. **Status-region for kernel errors** — `xen-dev-utils`' `approximatePrimeLimit` throws "Numerator above safe limit" for some `(edoSteps, primeLimit)` pairs (e.g. 12-EDO + 13-prime-limit, even with maxExponent=5). Rather than crash the page cell, the component catches and renders the error in the status region — same defense pattern as `sclIo`.
3. **Single-line factory signatures** — Both factories declare their signature on one line so plan-checker grep gates can match them. Cosmetic concession to the plan's acceptance criteria; all other multi-arg call sites (e.g. `audioPanel`) keep multi-line signatures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Test bug] Adjusted "limit input re-renders" test to use a kernel-safe value**
- **Found during:** Task 2 GREEN phase.
- **Issue:** The plan's behavior list (Test 8) used `5 → 13` to verify the limit input re-renders the table. With `kind: "prime"` and `edoSteps: 12`, the kernel's `bestJiInEdo` invokes `jiSubsetOfEdo(12, 13)`, which calls `xen-dev-utils.approximatePrimeLimit(...)` → throws `"Numerator above safe limit"`. The component CORRECTLY catches the error and clears the table, but the test's `expect(after.length).toBe(before.length)` then sees `0 !== 12`. This is a documented kernel envelope (the plan's interfaces section even says "2..23 effectively for prime within fraction.js' BigInt + xen-dev-utils' maxExponent=5 envelope"), but 13 is outside the safe band at 12-EDO.
- **Fix:** Changed the test to `5 → 11` (verified inside the safe envelope), and **added a NEW test** specifically asserting that limit=13 trips the kernel's safe-integer guard and the error surfaces via the status region without throwing — locking down the defensive catch path. Net effect: 11 tests instead of the planned 10 for `edoJiTable`.
- **Files modified:** `src/components/__tests__/edo-ji-table.test.ts`.
- **Verification:** Both new tests pass; total 21/21.
- **Committed in:** `da664f7` (Task 2 commit).

---

**Total deviations:** 1 auto-fixed (Rule 1 test bug)
**Impact on plan:** No scope creep — the original plan acceptance criterion was "10 tests pass for `edoJiTable`"; we ship 11, with the extra one explicitly covering the defensive error path the original Test 8 design accidentally relied on. All plan-level success criteria still met.

## Issues Encountered

None beyond the deviation above.

## TDD Gate Compliance

Each task was `tdd="true"` but the RED phase commit was elided:

- For both tasks, the failing-test file was created and run to confirm RED (`vitest` reported "Failed to resolve import" — the canonical pre-implementation failure shape).
- The implementation files were then created and the same test file re-run to confirm GREEN.
- Both commits combine RED + GREEN into a single `feat(...)` commit because the RED state was ephemeral (no separate value to preserve in history) and the test file shipped unchanged from RED to GREEN.
- No separate `test(...)` commit was created. Future plan-checker that strictly enforces RED/GREEN gate ordering at commit-message level would flag this as a non-compliance.

## INVENTORY Rows Queued for Plan 04-07

| File | Export | Description | Notes |
| --- | --- | --- | --- |
| `src/components/edo-jit-table.ts` | `edoJitTable` | Scale→EDO ranking factory with sortable columns + row-click arpeggio (D-09/D-10). | Pattern 2 factory; depends on `bestEdosForScale` from `src/lib/edo.ts`. |
| `src/components/edo-jit-table.ts` | `EdoJitTableOpts` | Options interface for `edoJitTable`. | `range`, `baseHz`, `stepSec`, `precision`. |
| `src/components/edo-ji-table.ts` | `edoJiTable` | N-EDO→JI per-step factory with prime/odd toggle (D-08). | Pattern 2 factory; depends on `bestJiInEdo` from `src/lib/edo.ts`. |
| `src/components/edo-ji-table.ts` | `EdoJiTableOpts` | Options interface for `edoJiTable`. | `kind`, `limit`, `baseHz`, `precision`. |

## Next Phase Readiness

- ANAL-01 UI layer is shipped; Plan 04-05 (analysis page) can drop these factories directly into a Markdown reactive cell.
- Plan 04-07 needs to:
  1. Add `@import "./components/edo-jit-table.css";` and `@import "./components/edo-ji-table.css";` to `src/styles.css`.
  2. Append the four INVENTORY rows above to `src/lib/INVENTORY.md`.
- No blockers identified.

## Self-Check: PASSED

- `src/components/edo-jit-table.ts` — FOUND
- `src/components/edo-jit-table.css` — FOUND
- `src/components/__tests__/edo-jit-table.test.ts` — FOUND
- `src/components/edo-ji-table.ts` — FOUND
- `src/components/edo-ji-table.css` — FOUND
- `src/components/__tests__/edo-ji-table.test.ts` — FOUND
- Commit `5a0c216` — FOUND in `git log`
- Commit `da664f7` — FOUND in `git log`

---
*Phase: 04-analysis-sharing*
*Completed: 2026-05-06*
