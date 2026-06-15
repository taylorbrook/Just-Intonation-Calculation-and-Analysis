---
status: complete
phase: 09-scala-archive-browser
source: [09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md]
started: 2026-06-15T02:28:28Z
updated: 2026-06-15T02:36:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Open the Scala-archive browser
expected: On the Generate page, pick "Scala archive" from the method picker. The browser mounts — a search box, a capped list of archive scales (≤50 selectable rows showing name + "N notes"), and a "showing X of Y" caption where Y reflects the full 195-entry archive (truncated to 50). "Loading archive…" may flash briefly before the list appears.
result: pass

### 2. Search narrows the list
expected: Type a query into the search box (e.g. a known scale name fragment). After a brief (~150 ms) debounce the list re-filters to matching entries and the "showing X of Y" caption updates. A non-matching query yields 0 results (caption shows 0 of 0). Clearing the box restores the capped full list.
result: pass

### 3. Load + audition a JI (exact-ratio) scale
expected: Select an exact-ratio scale row. The preview shows a Ratio-column table (Degree / Ratio / Cents / ¢-from-12tet) with NO "tempered" badge. ⏵⏵ Play arpeggiates the selected scale audibly, no JS console errors.
result: pass

### 4. Load + audition a tempered scale
expected: Select a tempered (cents-defined) scale row. The preview shows a cents-only table (Degree / Cents / ¢-from-12tet — no Ratio column) and a "tempered" badge above the table. ⏵⏵ Play arpeggiates the scale audibly.
result: pass

### 5. Send tempered scale to Dashboard — cents preserved (SURF-06)
expected: With a tempered scale loaded, use Send to Dashboard. The Dashboard opens live (via #s= in the URL) and the scale renders as CENTS — it is NOT laundered into ratios.
result: pass

### 6. Send JI scale to Analysis — ratios
expected: With an exact-ratio scale loaded, use Send to Analysis. The Analysis page opens live (via #s=) and the scale renders as ratios.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
