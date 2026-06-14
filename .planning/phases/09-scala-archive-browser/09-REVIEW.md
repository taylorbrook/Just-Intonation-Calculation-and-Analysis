---
phase: 09-scala-archive-browser
reviewed: 2026-06-14T13:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/scala-archive.ts
  - src/lib/__tests__/scala-archive.test.ts
  - src/data/scala-archive.json.ts
  - src/components/generate-archive.ts
  - src/components/__tests__/generate-archive.test.ts
  - src/pages/generate.md
findings:
  critical: 0
  warning: 5
  info: 2
  total: 7
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-06-14T13:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the Scala Archive Browser phase: the build-time index module (`scala-archive.ts`),
its data loader (`scala-archive.json.ts`), the browser widget (`generate-archive.ts`), both
test suites, and the `generate.md` wiring. All 26 tests pass; `tsc --noEmit` is clean for
these files.

The headline invariants hold **against the currently-vendored 195-file snapshot**: the
data loader does zero network I/O (offline/static constraint satisfied), the widget uses
`createElement`/`textContent` for every dynamic value (no `innerHTML`/`eval` sinks — XSS
surface closed), `buildArchiveIndex` wraps `parseScl` in try/catch so one malformed file is
skipped + warned, and `searchArchive` is capped + stable. I verified empirically that the
build-time `tempered` flag agrees with per-pitch-token cents detection on all 195 files
(0 disagreements), so today's Send-to provenance is correct.

The findings below are about **robustness beyond the current snapshot** — the archive is
described as a vendored snapshot that can be re-vendored/expanded, so latent divergences
matter. The two most important: (1) `isTemperedScl` detects a `.` anywhere on a pitch line
rather than in the first token, so a Scala-legal ratio line with a trailing dotted note
(`9/8  M2 (cf. v1.5)`, an F09 form the kernel parser explicitly supports) would false-flag
the whole scale as tempered and **launder exact JI into cents** on Send-to — the inverse of
the SURF-06 hazard but an equally wrong provenance; and (2) the data loader's `fs` calls are
uncaught, so the "one bad file never crashes the build" design goal does not actually hold
for an unreadable file or a missing directory.

## Warnings

### WR-01: `isTemperedScl` cents-detection diverges from the kernel parser (false-positive on trailing dotted note text)

**File:** `src/lib/scala-archive.ts:64-67`
**Issue:** The function's own docstring (lines 50-52) claims the `.` test is "intentionally
identical to `parsePitchToken`'s cents detection so the build-time flag can never disagree
with the runtime parser." It is not. `parsePitchToken` (`scala.ts:255-260`) takes only the
**first whitespace-bounded token** and tests *that* for `.`:
```ts
const firstWs = trimmed.search(/\s/);
const tok = firstWs === -1 ? trimmed : trimmed.slice(0, firstWs);
if (tok.includes(".")) { /* cents */ }
```
`isTemperedScl` instead tests the **entire line**: `if (line.includes(".")) return true;`.
The kernel deliberately supports trailing text after a pitch token (F09 — `scala.ts:14`,
`5/4   E\\` is valid). A Scala-legal file with `9/8  Major 2nd (cf. v1.5)` parses as exact JI
(token `9/8`) but flags `tempered: true` here. Result: every degree is serialized as cents
(`serializeDegrees`, line 89), and Send-to (`generate.md:465-468`) emits cents-per-line for a
scale that is exact rational — laundering JI as a temperament. Confirmed by direct repro; not
triggered by the current 195-file snapshot (0 such lines today), hence WARNING not BLOCKER —
but it silently mis-classifies the moment such a file is added.
**Fix:** Mirror the kernel's first-token rule instead of scanning the whole line:
```ts
for (const line of pitchLines) {
  if (line === "" || line.startsWith("!")) continue;
  const firstWs = line.search(/\s/);
  const tok = firstWs === -1 ? line : line.slice(0, firstWs);
  if (tok.includes(".")) return true;
}
```
Better still, derive `tempered` from the already-parsed intervals so the build-time flag and
runtime parser cannot diverge by construction (e.g. flag from whether any non-unison interval
came from the cents path), rather than re-scanning the raw text with a second, looser rule.

### WR-02: `isTemperedScl` assumes exactly two header lines, ignoring blank lines that `parseScl` tolerates

**File:** `src/lib/scala-archive.ts:62-63`
**Issue:** `isTemperedScl` does `nonComment.slice(2)` to skip the description + count header,
collecting `nonComment` as *every* non-`!` line including blanks. But `parseScl` builds its
pitch list from `nonComment.slice(2).filter(l => l !== "" && !l.startsWith("!"))` and reads
the **description** from `nonComment[0]` and **count** from `nonComment[1]` — and the count
must satisfy `/^\d+$/` (`scala.ts:108`). If a file has a blank line interleaved among the
first non-comment lines (e.g. a blank line directly under the description, which the spec
permits and `parseScl` accepts as long as the count line still validates), `isTemperedScl`'s
fixed `slice(2)` offset misaligns: it can treat the real count line or a real pitch line as
"header" and silently drop it from the tempered scan, or pull a header value into the scan.
The two functions claim to "mirror" each other (lines 44-48) but use different line discipline.
No such file exists in today's snapshot (0 empty-description files found), so WARNING.
**Fix:** Apply the same blank-line / comment filtering `parseScl` uses *before* taking the
header offset, or — preferred — have `buildArchiveIndex` derive `tempered` from the
`parsed.intervals` it already has rather than re-parsing the raw text a second way. A single
source of truth removes the whole divergence class (WR-01 + WR-02).

### WR-03: Data loader's `readFileSync` is uncaught — defeats the "one bad file never crashes the build" goal

**File:** `src/data/scala-archive.json.ts:21-27`
**Issue:** The phase's stated resilience goal (T-09-01, `scala-archive.ts:96-97`) is that one
bad vendored file must never fail the whole build — and `buildArchiveIndex` correctly wraps
`parseScl` in try/catch for that reason. But the file **reading** happens in the loader,
outside that guard:
```ts
.map((filename) => ({ filename, text: readFileSync(join(archiveDir, filename), "utf8") }));
```
A single unreadable file (permission error, non-UTF-8 bytes that throw on decode, a file
deleted between `readdirSync` and `readFileSync`) throws `ENOENT`/`EACCES`/decode error here,
which propagates out of the data loader and **fails the entire static build** — exactly the
failure mode the try/catch inside `buildArchiveIndex` was written to prevent. The guard is in
the wrong layer to meet the goal. Confirmed `readFileSync` throws uncaught for a missing path.
**Fix:** Wrap the per-file read (and ideally keep the parse-skip semantics symmetric):
```ts
const files = readdirSync(archiveDir)
  .filter((name) => name.endsWith(".scl"))
  .sort()
  .flatMap((filename) => {
    try {
      return [{ filename, text: readFileSync(join(archiveDir, filename), "utf8") }];
    } catch (err) {
      console.warn(`scala-archive loader: skipping ${filename} — ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  });
```

### WR-04: Data loader's `readdirSync` is uncaught — a missing/renamed archive directory crashes the whole site build

**File:** `src/data/scala-archive.json.ts:19-21`
**Issue:** `readdirSync(archiveDir)` runs unguarded at module top level. If
`src/data/scala-archive/` is absent, renamed, or not yet vendored (e.g. a fresh checkout
before the snapshot is pulled, or a path typo), this throws `ENOENT` and aborts the entire
`observable build` with a raw stack trace, taking down every page — not just the archive
widget. Given the snapshot is a separately-vendored asset, an empty/missing directory is a
realistic state.
**Fix:** Guard directory access and emit an empty index (the widget already handles an empty
list — `generate-archive.ts:214-216` shows "No archive scales available."):
```ts
let names: string[] = [];
try {
  names = readdirSync(archiveDir).filter((n) => n.endsWith(".scl")).sort();
} catch (err) {
  console.warn(`scala-archive loader: archive dir unavailable — ${err instanceof Error ? err.message : String(err)}`);
}
```
Emitting `[]` keeps the build green and degrades the widget gracefully instead of breaking
the whole site.

### WR-05: Stale selection after search — table/play/getScale persist while the highlighted row is destroyed

**File:** `src/components/generate-archive.ts:209-220` (interaction with `selectEntry`, 229-260)
**Issue:** After the user selects an entry, `selectEntry` sets `currentScale`/`currentTempered`,
renders the table + Play into `tableHost`/`playHost`, and marks the row `aria-selected="true"`.
If the user then types in the search box, `renderList` runs `list.replaceChildren(...)`,
discarding the old `<li>`s (including the highlighted one) and building fresh rows — but it
does **not** touch `currentScale`, `currentTempered`, `tableHost`, or `playHost`. Outcome:
the loaded table and ⏵⏵ Play remain for the previously-selected scale, `getScale()` /
`isTempered()` still return it (so Send-to serializes it), yet **no row in the visible list is
marked selected** — and if the search term excludes that entry, the table shows a scale the
list no longer offers. This is a soft state inconsistency: the affordance (highlight) and the
state (scale/table) disagree. Non-crashing, so WARNING. (For contrast, `aria-selected` is an
accessibility contract — a listbox should always reflect which option is current.)
**Fix:** On re-render, reconcile the selection: if the currently-selected entry is still in
`matches`, re-apply `aria-selected="true"` + the `--selected` class to its new row; if it is
no longer present, clear it (and decide deliberately whether to also clear the preview). At
minimum, re-mark the surviving row so the highlight tracks the live `currentScale`.

## Info

### IN-01: `fullMatchCount` duplicates `searchArchive`'s predicate (caption can drift)

**File:** `src/components/generate-archive.ts:157-166` vs `src/lib/scala-archive.ts:132-142`
**Issue:** `fullMatchCount` re-implements the exact match predicate from `searchArchive`
(`term.trim().toLowerCase()`, `${name}\n${filename}`.toLowerCase(), `.includes(needle)`).
Two copies of the same logic means the "Showing X of Y" caption silently lies if either side
is later changed (e.g. someone adds a description field to the search haystack in one place).
**Fix:** Export an uncapped count helper (or a `cap: Infinity` call) from `scala-archive.ts`
and have `fullMatchCount` delegate to it, so the cap and the total derive from one predicate.

### IN-02: Search debounce timer has no teardown

**File:** `src/components/generate-archive.ts:263-270`
**Issue:** `debounceTimer` is cleared on each new keystroke but never on teardown. In
Observable the widget element persists across picker swaps (it's detached, not destroyed), so
this is low-impact today, but a pending `setTimeout` can still fire `renderList` against a
detached element after the last keystroke. No precedent for timer teardown exists in the sibling
widgets (`generate-cs.ts` has no debounce), so this is informational, not a regression.
**Fix:** If/when the widget gains an explicit dispose path, `clearTimeout(debounceTimer)` there;
otherwise leave a brief note that the dangling timer is intentional/benign under Framework's
persist-on-swap model.

---

_Reviewed: 2026-06-14T13:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
