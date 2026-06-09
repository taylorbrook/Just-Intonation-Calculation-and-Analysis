---
status: partial
phase: 05-generate-surface-live-integration-foundation
source: [05-VERIFICATION.md]
started: 2026-06-09T06:42:57Z
updated: 2026-06-09T06:42:57Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Grouped method picker + reactive preview
expected: Open `/pages/generate` in the dev server, pick "Harmonic segment". Four grouped sections (`<optgroup>`) are visible in the method dropdown with exact family labels; the Preview table re-renders (different pitches) when the segment-size number input changes.
result: [pending]

### 2. Send to Dashboard → navigate + load
expected: Click "Send to Dashboard →" from the Generate page. Browser navigates to the Dashboard; the textarea contains the harmonic-segment scale text and the scale table renders the harmonic-segment pitches (not the default JI heptatonic seed).
result: [pending]

### 3. Send to Analysis → navigate + load
expected: Click "Send to Analysis →" from the Generate page. Browser navigates to Analysis; the scale appears; it persists on manual reload (store survives).
result: [pending]

### 4. Store persistence on plain reload
expected: After sending a scale, reload the Dashboard without a `#s=` hash. The previously-sent generated scale still loads (not the default JI heptatonic) — confirming SYNC-03 store persistence.
result: [pending]

### 5. Empty-store boot equivalence (SYNC-04)
expected: Clear localStorage, then open the Dashboard with no scale ever sent. It loads the default JI heptatonic seed exactly as before Phase 5: `9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1`; no store-override visible.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
