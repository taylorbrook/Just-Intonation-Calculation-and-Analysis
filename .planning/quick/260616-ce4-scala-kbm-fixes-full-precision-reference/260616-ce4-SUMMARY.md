---
phase: quick-260616-ce4
plan: 01
subsystem: scala-kbm-kernel
tags: [kbm, precision, diagnostics, hygiene, refactor]
requires:
  - src/lib/interval.js
  - src/lib/scale.js
provides:
  - "kbmToFrequenciesWithDiagnostics (surfaced out-of-range skips)"
  - "full-precision referenceHz serialization in writeKbm"
  - "src/lib/text.ts stripBom shared helper"
affects:
  - src/lib/kbm.ts
  - src/lib/scala.ts
  - src/lib/scala-archive.ts
tech-stack:
  added: []
  patterns:
    - "diagnostics-returning sibling fn keeps legacy Map<number,number> signature intact"
    - "String() (shortest round-trippable) for float serialization instead of toFixed(N)"
    - "single shared stripBom helper; \\uFEFF escape only, never literal BOM"
key-files:
  created:
    - src/lib/text.ts
    - src/lib/__tests__/text.test.ts
  modified:
    - src/lib/kbm.ts
    - src/lib/scala.ts
    - src/lib/scala-archive.ts
    - src/lib/__tests__/kbm.test.ts
decisions:
  - "writeKbm: String(referenceHz) over toFixed(6) — exact round-trip; parseFloatStrict already accepts [eE] exponents"
  - "#14 surfaced via NEW kbmToFrequenciesWithDiagnostics; kbmToFrequencies delegates to .frequencies so src/index.md:204 is untouched"
  - "stripBom lives in new src/lib/text.ts (no util.ts/strings.ts existed); all 3 sites import it"
metrics:
  duration: ~5min
  completed: 2026-06-16
---

# Phase quick-260616-ce4: Scala .kbm precision/diagnostic fixes + BOM helper Summary

Three .kbm-kernel fixes: full-precision `referenceHz` round-trip (#13), out-of-range mapped degrees surfaced via a backward-compatible diagnostics channel (#14), and collapsing three BOM-strip copies into one shared `stripBom` helper (removing two literal-BOM source hygiene violations).

## What Shipped

### Task 1 — #13 full-precision referenceHz + #14 surfaced skips (`8b891c2`)
- **#13:** `writeKbm` now serializes `kbm.referenceHz` via `String()` (shortest round-trippable form) instead of `.toFixed(6)`, so high-precision references round-trip exactly through `parseKbm`. Safe because `parseFloatStrict`'s regex accepts `[eE]` exponents. Doc comment updated — the old "6-decimal float is the Scala convention" sentence is gone.
- **#14:** New `kbmToFrequenciesWithDiagnostics(scale, kbm)` returns `{ frequencies, skipped }`, where an out-of-range mapped degree (`degrees[mapEntry] === undefined`) is pushed onto `skipped` as `{ midiNote, mapEntry }` instead of being silently dropped. The legacy `kbmToFrequencies(scale, kbm): Map<number, number>` now delegates to `.frequencies` — signature and contract unchanged, so `src/index.md:204` keeps type-checking.
- Tests: exact `toBe` round-trip for `432.0011223344` and `440.000001`; surfaced-skip assertion (note absent from `frequencies`, present in `skipped`); legacy-vs-diagnostics equivalence.

### Task 2 — shared `stripBom` helper + dedupe (`0e46e88`, `35bdde1`)
- New `src/lib/text.ts` exports `stripBom(text) → text.replace(/^\uFEFF/, "")`, using the `\uFEFF` escape only.
- Rewired all three call sites onto it: `kbm.ts` normalizeLines, `scala.ts` normalizeLines, `scala-archive.ts` isTemperedScl. The latter two previously embedded **literal BOM characters** — both hygiene violations are now gone.
- Pure refactor, byte-identical behavior. Tests cover leading-BOM removal, BOM-free passthrough, and first-position-only stripping.

## Verification

- `npx vitest run` → **729 passed (51 files)** — was 723; +6 new (#13, #14 ×2, stripBom ×3).
- `npx tsc --noEmit` → clean (proves the unchanged `kbmToFrequencies` signature still compiles `src/index.md`).
- `npx prettier --check` on all six touched files → clean.
- Manual grep gate: zero literal BOM characters remain in `src/lib` (only the `\uFEFF` escape).

## Module Discipline Honored

- No `!` non-null assertions (D-16) added.
- No `Fraction` import in `kbm.ts` (R-01).
- `referenceHz` stays a float at the audio-tier boundary (S-3 / Pitfall #1) — not converted to Fraction/BigInt.

## Deviations from Plan

**Tooling note (not a behavior deviation):** `src/lib/text.ts` and `src/lib/__tests__/text.test.ts`, plus the literal-BOM removals in `scala.ts`/`scala-archive.ts`, were authored via a small `node` script rather than the editor tool, because the editor round-trips the `\uFEFF` escape into a literal BOM character — which is exactly the hygiene violation this task removes. Final source contains only the `\uFEFF` escape (verified by grep). No scope or behavior change.

Otherwise: plan executed exactly as written.

## Self-Check: PASSED
- src/lib/text.ts — FOUND
- src/lib/__tests__/text.test.ts — FOUND
- kbmToFrequenciesWithDiagnostics in kbm.ts — FOUND
- Commit 8b891c2 — FOUND
- Commit 0e46e88 — FOUND
- Commit 35bdde1 — FOUND
