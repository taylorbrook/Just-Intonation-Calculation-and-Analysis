---
quick_id: 260513-jir
status: complete
date: 2026-05-13
commit: b469080
---

# Quick Task 260513-jir — Summary

## What changed

- **`src/components/spiral-of-fifths.ts`** — Added `onStepClick?: (step: SpiralStep) => void` to `SpiralOfFifthsOpts`. When supplied, the widget root carries `is-clickable` alongside `spiral-of-fifths-widget`, and each `<g class="spiral-of-fifths__node">` gets a native `addEventListener("click", () => opts.onStepClick!(s))` binding. Loop-local `const s` keeps the closure capture correct.
- **`src/components/spiral-of-fifths.css`** — Appended one new rule: `.spiral-of-fifths-widget.is-clickable svg.viz.spiral-of-fifths .spiral-of-fifths__node { cursor: pointer; }`. No other rules touched.
- **`src/components/__tests__/spiral-of-fifths.test.ts`** — Added a new `describe("spiralOfFifths factory — onStepClick prop")` block with 4 cases: class toggle omitted, class toggle present, click in pure-3/2 branch (k=1 → ratio 3/2, cents +1.9..2.0), click in tempered-700¢ branch (k=1 → ratio null, cumulativeCents 700, centsFrom12tet 0), and a no-op dispatch test confirming clicks without a handler don't throw. Added `vi` to the vitest imports and a type-only `SpiralStep` import.

## Verification

- **TypeScript:** `npx tsc --noEmit` — no errors in any spiral-of-fifths file. Pre-existing errors in unrelated files (`synth.ts`, `lattice.ts`, `scale-compare.ts`) for Observable Framework's `npm:`-prefixed imports were left alone per scope boundary; logged as deferred below.
- **Vitest:** `npx vitest run src/components/__tests__/spiral-of-fifths.test.ts` — **23 tests passed** (19 existing + 4 new). Duration 11 ms.

## Constraints honored

- **Viz-only.** No synth import; no AudioContext touched. Audition wiring belongs at the call site, per the three-layer discipline already documented in the file header (Pitfall #2 / D-08).
- **No D3 dependency.** Click binding uses vanilla `addEventListener` — same style as the rest of the file.
- **BEM class name match.** Cursor rule targets `.spiral-of-fifths__node` (the real class) — not the `.spiral-node` shorthand from the task brief.
- **Backwards-compat.** Omitting `onStepClick` leaves `className === "spiral-of-fifths-widget"` (no `is-clickable`), no listeners attached, and all existing assertions unchanged.

## Deferred items

- **Keyboard accessibility.** Node groups now look clickable but aren't keyboard-focusable. If a call site uses this for audition, it should add focus/keypress wiring or wrap nodes in a `<button>`. Out of scope for this task per `<plan> Constraints`.
- **ARIA role/label.** No `role="button"` or `aria-label`. A future a11y pass can add e.g. `aria-label="Play fifth 3/2, +1.96¢ from 12-TET"` once a real call site is wired and an audition surface exists.
- **Pre-existing tsc errors in unrelated files.** `synth.ts`, `lattice.ts`, and `scale-compare.ts` have `Cannot find module 'npm:...'` errors from Observable Framework's import scheme. Not introduced by this task; not in scope. Flagging here for visibility only.

## Commit

- `b469080` — `feat(spiral-of-fifths): add optional onStepClick prop and is-clickable cursor toggle`

## Tasks completed

1 / 1 (T1 + T2 + T3 bundled into one atomic commit per dispatch instructions)

## Self-Check: PASSED

- File `src/components/spiral-of-fifths.ts` modified — FOUND
- File `src/components/spiral-of-fifths.css` modified — FOUND
- File `src/components/__tests__/spiral-of-fifths.test.ts` modified — FOUND
- Commit `b469080` — FOUND in `git log`
- All 23 vitest assertions passing — VERIFIED
- No new tsc errors in spiral-of-fifths files — VERIFIED
