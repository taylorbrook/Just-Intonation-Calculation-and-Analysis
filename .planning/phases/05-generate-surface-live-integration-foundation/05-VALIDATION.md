---
phase: 5
slug: generate-surface-live-integration-foundation
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-08
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^2.1.9` (`environment: "node"`, `globals: false`; happy-dom opted-in per-file via `// @vitest-environment happy-dom`) |
| **Config file** | `vitest.config.ts` — `test.include` extended in Plan 01 Task 2 to cover `src/state/**/__tests__/**/*.test.ts` |
| **Quick run command** | `npx vitest run <touched module>.test.ts` |
| **Full suite command** | `npm run test` (= `vitest run`) |
| **Estimated runtime** | ~5 s quick; full suite ~10–20 s |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <touched module>.test.ts` (the R1 gate `src/__tests__/scale-store-boot.test.ts` runs on every commit touching `scale-store.ts` or either consumer page).
- **After every plan wave:** Run `npm run test` (full suite) + `npm run lint:types` + `npm run lint` (R-01 green) + `npm run build`.
- **Before `/gsd:verify-work`:** Full suite green (incl. R1 + the unchanged dashboard-seed / url-hash tests) + lint + build.
- **Max feedback latency:** < 5 s (quick); < 30 s (full).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SYNC-04 (R1) | T-05-07 | Empty store ⇒ `resolveInitialScaleText` ≡ `hash ?? seed` (byte-identical boot); RED→GREEN before any consumer edit | unit (node) | `npx vitest run src/__tests__/scale-store-boot.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SYNC-03 | T-05-01 / T-05-02 / T-05-03 | read validates shape + caps 8 KB + try/catch → null; write refuses oversize, silent on throw, fires one CustomEvent | unit (node + happy-dom) | `npx vitest run src/state/__tests__/scale-store.test.ts && npm run lint:types` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | SURF-01 / SURF-02 / SURF-03 | T-05-04 | createElement+textContent / replaceChildren, never innerHTML; page-owned lazy synth | build + manual | `npm run build` ; `npm run dev` → `/pages/generate` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | SYNC-01 / SYNC-02 (producer) | T-05-04 / T-05-02 / T-05-05 | Send-to is the sole store writer; 8 KB RangeError → cap-error + hashless nav | build + manual | `npm run build && npm run lint:types` ; `npm run dev` Send-to walkthrough | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | SYNC-01 / SYNC-04 | T-05-07 / T-05-05 | boot inert when empty (R1 stays green); listener writes textarea only, never the store | unit (node) + build | `npx vitest run src/__tests__/scale-store-boot.test.ts src/__tests__/dashboard-seed.test.ts src/__tests__/url-hash-integration.test.ts && npm run build` | ✅ (R1 from W0) | ⬜ pending |
| 05-03-02 | 03 | 2 | SYNC-02 / SYNC-04 | T-05-07 / T-05-05 / T-05-01 | analysis.md boot inert when empty at its distinct symbol; listener writes textarea only | unit (full) + build | `npx vitest run src/__tests__/scale-store-boot.test.ts && npm run build && npm run lint:types && npm run test` | ✅ (R1 from W0) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/state/scale-store.ts` — the module under test (constants + read/write/validate + `resolveInitialScaleText`) — Plan 01.
- [ ] `src/state/__tests__/scale-store.test.ts` — store read/write/validate/cap/throws (node) + CustomEvent dispatch (happy-dom). Mirrors `theme-prefs.test.ts` branch coverage — Plan 01 Task 2.
- [ ] `src/__tests__/scale-store-boot.test.ts` — **the R1 boot-equivalence gate** (pure, node). RED→GREEN before any Send-to wiring or consumer edit — Plan 01 Task 1.
- [ ] `vitest.config.ts` — extend `test.include` to cover `src/state/**` (else the store test is silently uncollected) — Plan 01 Task 2.
- [ ] No new test framework install needed — Vitest + happy-dom already present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Picker swaps params host; reference-method preview updates as the segment-size param changes | SURF-02 / SURF-03 | DOM-render + reactive-cell behavior in Framework; covered by reused (already-tested) `scaleTable`/`playScale` — page wiring is integration-only | `npm run dev` → `/pages/generate`; pick the harmonic-segment method; change segment size → preview Scale changes; change Reference pitch → table re-renders; pick a `(coming soon)` family → placeholder caption mounts |
| Two-tab live update writes the consumer textarea exactly once with no event thrash (R2 one-way-flow guard) | SYNC-01 / SYNC-02 | Cross-document `CustomEvent` + Framework reactive textarea; single-tab automation does not reproduce the two-surface flow | `npm run dev`; open Generate + Dashboard in two tabs; click `Send to Dashboard →`; confirm the Dashboard textarea updates once (no runaway `scale-changed` events); repeat for Analysis |
| Generate appears in nav + breadcrumb between Analysis and Theory notes | SURF-01 | Rendered nav order is a build/visual check | `npm run build` then `npm run dev`; confirm nav order Analysis → Generate → Theory notes |

*All store/boot/precedence logic (SYNC-03/04 cores) has automated coverage; the above are surface/integration verifications whose underlying primitives are already unit-tested.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (every task has an automated command; SURF surface checks pair build + the already-tested reused components with a documented manual walkthrough)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task runs vitest and/or build + lint:types)
- [x] Wave 0 covers all MISSING references (scale-store.ts, both test files, vitest glob — all Plan 01)
- [x] No watch-mode flags (all commands use `vitest run`, never `--watch`)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-08
