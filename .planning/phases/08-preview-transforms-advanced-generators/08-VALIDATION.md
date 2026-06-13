---
phase: 8
slug: preview-transforms-advanced-generators
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 |
| **Config file** | none at root — Vitest defaults (co-located `__tests__/*.test.ts`) |
| **Quick run command** | `npx vitest run <path/to/file.test.ts>` |
| **Full suite command** | `npm test` (`vitest run`) |
| **Estimated runtime** | ~5–15 seconds (existing 192-test suite + new) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <touched test file>`
- **After every plan wave:** Run `npm test` (full suite — existing 192 tests stay green, anti-regression per PROJECT.md)
- **Before `/gsd:verify-work`:** Full suite green AND `npm run lint:types` clean (Framework does not type-check; strict-TS `noUncheckedIndexedAccess` guards required)
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

> Populated by the planner. Every task's `<acceptance_criteria>` maps to an automated Vitest assertion or a manual-verify row below. Verified anchors from 08-RESEARCH.md seed the kernel-layer rows.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 8-XX-XX | meru | 1 | GEN-10 | — | N/A | unit | `npx vitest run src/lib/__tests__/meru.test.ts` | ❌ W0 | ⬜ pending |
| 8-XX-XX | cs-check | 1 | GEN-10 | — | N/A | unit | `npx vitest run src/lib/__tests__/<cs-helper>.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/meru.test.ts` — Wilson recurrence convergents exact (Fibonacci → `2/1, 3/2, 5/3, 8/5, 13/8`), metallic limit cents (φ ≈ 833.09¢, flagged tempered, never a degree), caps enforced (term count + magnitude → RangeError before enumeration)
- [ ] `src/lib/__tests__/<cs-check>.test.ts` — `isConstantStructure(scale)` returns CS-✓ for `csgs([3/2], 3)` (7-note Pythagorean diatonic) and reports "ambiguous at X" for a non-CS scale
- [ ] Component `__tests__` for `circle-of-pitches.ts`, `scale-transform-strip.ts`, `generate-meru.ts`, `generate-cs.ts` — follow existing component test idiom (jsdom + factory invocation)

*Existing Vitest infrastructure covers the framework; new test files are net-additive (no install needed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shared circle + strip re-render when the active generator's `getScale()` output changes | SURF-04, SURF-05 | First cross-widget shared-preview consumer; Observable reactive-graph wiring (widget-internal edits don't tick the cell) cannot be asserted in jsdom unit tests (08-RESEARCH Open Q1) | In `npm run dev`: switch generator methods + tweak params; confirm the shared circle and transformed table update live and the empty-state shows for octave-only/empty scales |
| Transformed scale (rotate/reduce/dedupe/transpose) is what "Send to…" serializes | SURF-04 | End-to-end URL/store round-trip across the live page | Apply a mode rotation + transpose in the strip, click "Send to…", confirm the serialized payload reflects the transformed scale (not raw generator output) |
| Click-to-audition on circle markers + hover tooltip/highlight | SURF-05 | Web Audio playback + pointer interaction require a real browser | In `npm run dev`: hover a marker (tooltip + highlight), click a marker (hear the pitch via page-owned synth) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (use `vitest run`, never `vitest`)
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
