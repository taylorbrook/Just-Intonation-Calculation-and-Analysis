---
phase: 2
slug: math-kernel-composition-anchor-mvp
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm run ci` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm run ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | MATH-01..06 | — | N/A | unit | `npm test -- --run src/lib/__tests__/interval.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | SCALE-01..05 | — | N/A | unit | `npm test -- --run src/lib/__tests__/scale.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 1 | IO-01,02,04,05 | — | N/A | unit + golden | `npm test -- --run src/lib/__tests__/scala.test.ts` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 2 | AUDIO-01..05 | — | N/A | unit (mocked AC) | `npm test -- --run src/audio/__tests__/synth.test.ts` | ❌ W0 | ⬜ pending |
| 2-05-01 | 05 | 2 | NOTES-01..05 | — | N/A | smoke | `npm run build && grep -r ratioPill src/dist` | ❌ W0 | ⬜ pending |
| 2-06-01 | 06 | 3 | COMP-01..03 | — | N/A | integration | `npm test -- --run src/__tests__/dashboard-seed.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> Task IDs are placeholders — will be replaced with planner-produced IDs after PLAN.md generation.

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/interval.test.ts` — Interval ctor, mul/div/inv/octaveReduce, monzo round-trip (MATH-01..05)
- [ ] `src/lib/__tests__/monzo.test.ts` — toMonzo/fromMonzo, primeLimit, oddLimit, tenneyHeight, benedettiHeight (MATH-02, MATH-04, MATH-05)
- [ ] `src/lib/__tests__/cents.test.ts` — cents conversion + signed cents-from-12tet (MATH-03)
- [ ] `src/lib/__tests__/commas.test.ts` — named-comma identification by canonical monzo (MATH-06)
- [ ] `src/lib/__tests__/scale.test.ts` — Scale model, rotate/reduce/dedupe/transpose, period-aware (SCALE-01..05)
- [ ] `src/lib/__tests__/scala.test.ts` — .scl parse + serialize + round-trip on F1..F16 fixtures (IO-01,02,04,05)
- [ ] `src/lib/__tests__/text-input.test.ts` — Scala-body parser (D-12/13/14/15) shared with .scl
- [ ] `src/lib/__tests__/golden/` — ~10–15 Huygens-Fokker .scl fixtures + license note (D-20)
- [ ] `src/audio/__tests__/synth.test.ts` — sw-synth wrapper with mocked AudioContext, voice tracking, dispose, polyphony cap (AUDIO-01..05)
- [ ] `src/__tests__/dashboard-seed.test.ts` — seed scale parses + round-trips through .scl correctly (COMP-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Click-to-play interval audibility, no clicks/pops | AUDIO-02 | Perceptual quality — ADSR envelope artifacts | `npm run dev`, open `/`, click play on 5/4 and 7/4; listen for clicks at note start/end |
| AudioContext leak detection during cell edits | AUDIO-04 | Requires repeated `observable preview` cell edits | `npm run dev`, edit `src/index.md` 10× in 30s; in DevTools console, verify only 1 AudioContext exists |
| Voice orphaning on navigation | AUDIO-04 | Requires page navigation | `npm run dev`, start arpeggio on `/`, navigate to `/pages/syntonic-comma`; verify all voices stop within 1 release window |
| KaTeX rendering on syntonic-comma page | NOTES-03, NOTES-05 | Visual typography check | `npm run dev`, open `/pages/syntonic-comma`; verify `$$\frac{81}{80}$$` and inline math render correctly |
| `.scl` download filename + contents | IO-02, D-22 | File-system interaction | Click "Download .scl" on dashboard with seed scale; verify filename `scale-7-tone-2026-MM-DD.scl` and file opens in Scale Workshop |
| `.scl` re-import round-trip | IO-01, IO-04 | Manual UX flow | Download seed scale, edit dashboard text-input, click "Import .scl", select downloaded file; verify scale equals original (visual diff against table) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
