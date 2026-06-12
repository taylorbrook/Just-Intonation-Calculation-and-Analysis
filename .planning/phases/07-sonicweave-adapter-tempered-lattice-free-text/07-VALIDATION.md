---
phase: 7
slug: sonicweave-adapter-tempered-lattice-free-text
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | existing project vitest setup (src/lib/__tests__, src/components/__tests__) |
| **Quick run command** | `npx vitest run <changed test file>` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed test file>`
- **After every plan wave:** Run `npx vitest run` + `npx tsc --noEmit` + ESLint (R-01)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | | | GEN-06..09 | | | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/sonicweave.test.ts` — adapter cross-check vectors (rank2 ≡ buildMos, cps ≡ Hexany, isFractional discriminator, R-01 round-trip, input cap)
- [ ] Per-preset well-temperament test vectors (pure-fifth count + degree cents per D-08 roster)
- [ ] Fokker cardinality vector: |det(81/80, 128/125)| = 12, block renders 12 exact rational notes

*Existing vitest infrastructure covers all phase requirements — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Widget rendering / preview preservation on error | GEN-09 | Visual + interaction in Observable Framework page | Load /generate, pick SonicWeave widget, enter malformed input, confirm prior preview intact + error in status region |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
