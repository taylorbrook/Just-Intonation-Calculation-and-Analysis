---
phase: 7
slug: sonicweave-adapter-tempered-lattice-free-text
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | existing project vitest setup (`vitest.config.ts`; `src/lib/__tests__`, `src/components/__tests__`) |
| **Quick run command** | `npx vitest run <changed test file>` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed test file>`
- **After every plan wave:** Run `npx vitest run` + `npx tsc --noEmit` + ESLint (R-01)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Plan 01 — adapter + fokker (TDD feature) | 07-01 | 1 | GEN-06, GEN-07, GEN-08, GEN-09 | T-07-01..05 | 8 KB cap before eval; R-01 `${n}/${d}` round-trip; `isFractional()` discriminator (no laundered JI); structured `{scale,error}` on throw/empty; Fokker non-square/over-cap → RangeError | unit (TDD) | `npx vitest run src/lib/__tests__/sonicweave.test.ts src/lib/__tests__/fokker.test.ts` | ✅ created by this task | ⬜ pending |
| Plan 02 Task 1 — generate-rank2 (TDD) | 07-02 | 2 | GEN-06 | T-07-06, T-07-07 | tempered table via `textContent`, no laundered JI; up/down bounds clamp before compose; error → status region, prior preview preserved | component (TDD) | `npx vitest run src/components/__tests__/generate-rank2.test.ts` | ✅ created by this task | ⬜ pending |
| Plan 02 Task 2 — generate-welltemp + preset vectors (TDD) | 07-02 | 2 | GEN-07 | T-07-08, T-07-09 | explicit Pythagorean comma `531441/524288` (no silent syntonic mis-temper); per-preset vectors cited + asserted; error → status region | component + unit (TDD) | `npx vitest run src/components/__tests__/generate-welltemp.test.ts src/lib/__tests__/sonicweave.test.ts` | ✅ created by this task (component test) / appended (sonicweave.test.ts) | ⬜ pending |
| Plan 03 Task 1 — generate-fokker (TDD) | 07-03 | 2 | GEN-08 | T-07-13 | basis/extents/comma-count caps before enumerate; non-square comma → caught RangeError, readout message, no crash; exact-JI table | component (TDD) | `npx vitest run src/components/__tests__/generate-fokker.test.ts` | ✅ created by this task | ⬜ pending |
| Plan 03 Task 2 — generate-sonicweave (TDD) | 07-03 | 2 | GEN-09 | T-07-10, T-07-11, T-07-12, T-07-14 | evaluate-on-click only (never per keystroke); raw error verbatim via `textContent`, prior preview preserved; docs `<a rel="noopener noreferrer">` | component (TDD) | `npx vitest run src/components/__tests__/generate-sonicweave.test.ts` | ✅ created by this task | ⬜ pending |
| Plan 04 Task 1 — register widgets in generate.md + CSS imports | 07-04 | 3 | GEN-06, GEN-07, GEN-08, GEN-09 | T-07-15, T-07-16, T-07-18 | `isTempered()` gates cents-vs-ratio serialization (no laundering); strictly additive (empty-store boot equivalence, SYNC-04) | build + full suite | `npm run build && npx tsc --noEmit && npm run lint && npx vitest run` | ➕ edits existing `generate.md` / `styles.css` | ⬜ pending |
| Plan 04 Task 2 — live-verify the four widgets | 07-04 | 3 | GEN-06, GEN-07, GEN-08, GEN-09 | T-07-18 | live page render/audition/Send-to + no-scale-sent boot regression check | manual (human-verify) | see Manual-Only Verifications below | n/a (checkpoint) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**No Wave 0 tasks needed.** The existing Vitest + happy-dom infrastructure (`vitest.config.ts`, `src/lib/__tests__`, `src/components/__tests__`) covers every phase requirement — no framework install and no scaffolding step is required.

All test files in this phase are created (or appended) by their owning plan's tasks in their own wave, NOT in Wave 0:

- `src/lib/__tests__/sonicweave.test.ts` and `src/lib/__tests__/fokker.test.ts` — created by **Plan 01** (Wave 1, TDD). The well-temperament per-preset vectors are appended to `sonicweave.test.ts` by **Plan 02 Task 2** (Wave 2).
- `src/components/__tests__/generate-rank2.test.ts` — created by **Plan 02 Task 1** (Wave 2).
- `src/components/__tests__/generate-welltemp.test.ts` — created by **Plan 02 Task 2** (Wave 2).
- `src/components/__tests__/generate-fokker.test.ts` — created by **Plan 03 Task 1** (Wave 2).
- `src/components/__tests__/generate-sonicweave.test.ts` — created by **Plan 03 Task 2** (Wave 2).

Because each test file is authored by the same task that implements its target (TDD: RED test → GREEN implementation), there is no false dependency on a test file existing before its owning plan runs.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Widget rendering / preview preservation on error | GEN-09 | Visual + interaction in Observable Framework page | Load /generate, pick SonicWeave widget, enter malformed input, confirm prior preview intact + error in status region |
| Live picker registration: five optgroups, four new methods mount/audition/Send-to | GEN-06..09 | Live Observable Framework page is the one surface not coverable by happy-dom component tests | Plan 04 Task 2 checkpoint `<how-to-verify>` steps 1–8 (run `npm run dev`, exercise each widget, verify Send-to serialization, confirm no-scale-sent boot regression) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (Plan 04 Task 2 is the lone manual checkpoint, paired with the automated Plan 04 Task 1)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (no Wave 0 tasks needed; existing infra suffices; all test files owned by their plan's tasks)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
