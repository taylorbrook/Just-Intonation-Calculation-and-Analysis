---
phase: 3
slug: visualization-mobile-audio-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-05
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npm run typecheck && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run` (scoped to changed files preferred — `npm run test -- --run path/to/test`)
- **After every plan wave:** Run `npm run test -- --run && npm run typecheck && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

> Filled by planner from RESEARCH.md "Validation Architecture" section.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _planner fills this_ | _NN_ | _W_ | _REQ-XX_ | _T-3-XX / —_ | _expected behavior_ | unit/integration/manual | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install --save d3@7.9.0 @types/d3` — d3 not currently installed (research finding)
- [ ] `tests/lib/kbm.test.ts` — round-trip property tests for `.kbm` parser/serializer (IO-03)
- [ ] `tests/lib/lattice.test.ts` — coordinate stability + prime basis projection tests (VIZ-01)
- [ ] `tests/lib/diamond.test.ts` — odd-limit enumeration property tests (VIZ-02)
- [ ] `tests/components/keyboard.test.ts` — pitch-to-key mapping tests (VIZ-03)
- [ ] iOS Safari manual-test checklist file (AUDIO-06)

*Existing infrastructure (vitest, eslint, tsc) carries forward from Phase 1/2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile Safari audio actually produces sound with hardware mute switch ON | AUDIO-06 | Cannot script the iOS hardware mute switch | 1. Open site on iPhone Safari (iOS 16.4+). 2. Flip hardware mute ON. 3. Tap play button. 4. Verify audio is audible. 5. Repeat with mute OFF. |
| Pan/zoom feels right on touch devices | VIZ-01 | UX feel cannot be unit-tested | Open lattice on iPad/iPhone; pinch-zoom and two-finger-pan; verify no jank, no scroll-hijack outside the SVG region. |
| Keyboard tap-to-audition latency under 100ms | VIZ-03 | Subjective | Tap multiple keys in succession; ensure no perceptible lag. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (d3 install + new test files)
- [ ] No watch-mode flags (use `--run` always)
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
