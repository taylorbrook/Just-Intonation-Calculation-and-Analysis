---
status: complete
phase: 06-exact-rational-ji-harmonic-generators
source: [06-VERIFICATION.md]
started: 2026-06-10T10:20:00Z
updated: 2026-06-15T03:42:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Per-method render + audition
expected: Pick each method (CPS → Hexany, Harmonic segment, ADO, JI-set → Diamond, EDO 12, ED-n 13-ED3) from the Generate page. For each, the table renders and the Play button auditions the scale — rows appear, ⏵⏵ Play triggers audio, no JS console errors.
result: pass

### 2. SURF-06 visible tempered distinction (EDO)
expected: On the EDO method (12-EDO), the table shows only Degree / Cents / ¢-from-12tet columns (no Ratio column) and the "tempered" badge appears above the table.
result: pass

### 3. Send-to round-trip (Dashboard + Analysis)
expected: Send to Dashboard and Send to Analysis from CPS (Hexany), Harmonic, JI-set (Diamond), and EDO. Each target page loads the sent scale — ratios for JI methods, cents-defined scale for EDO (no spurious ratios on the EDO round-trip).
result: pass

### 4. D-08 anti-regression (default landing)
expected: The Generate page first load matches Phase-5 boot behavior — picker shows "— pick a method —"; selecting the harmonic group shows the harmonic 8..16 table immediately (harmonic-segment as default landing).
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
