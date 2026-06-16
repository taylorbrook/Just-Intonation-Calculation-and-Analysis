---
phase: quick-260616-ji8
plan: 01
subsystem: url-share-io
tags: [url-hash, cross-tab-sync, filename-sanitization, transpose, contract-change]
requires: []
provides:
  - "encodeScaleToHash: string -> string | null over-cap contract (never throws)"
  - "module-level UTF8_ENCODER in url.ts + scale-store.ts"
  - "sanitizeFilename for .scl/.kbm download names"
  - "clamped transpose write-back to inputs"
  - "cross-tab storage listener in Dashboard + Analysis cells (#22)"
affects:
  - src/lib/url.ts
  - src/state/scale-store.ts
  - src/components/scl-io.ts
  - src/components/scale-transform-strip.ts
  - src/index.md
  - src/pages/analysis.md
  - src/pages/generate.md
tech-stack:
  added: []
  patterns:
    - "encoder never-throw contract (falsy on cap) matching decoder + writeSharedScale"
    - "native window 'storage' event for cross-tab sync, re-read via validated store helper, invalidation teardown"
key-files:
  created: []
  modified:
    - src/lib/url.ts
    - src/state/scale-store.ts
    - src/components/scl-io.ts
    - src/components/scale-transform-strip.ts
    - src/index.md
    - src/pages/analysis.md
    - src/pages/generate.md
    - src/lib/INVENTORY.md
    - src/__tests__/url-hash-integration.test.ts
    - src/lib/__tests__/url.test.ts
decisions:
  - "url.ts TextEncoder hoist (#2) landed in the Task 1 commit because the new module-level constant block is the same edit region as the string|null return; functionally identical to the plan's Task 2 placement."
metrics:
  duration: ~6min
  completed: 2026-06-16
---

# Phase quick-260616-ji8 Plan 01: Unify over-cap contract + four IO hardening fixes Summary

Tightened `encodeScaleToHash` to a single never-throw contract (`string | null`, falsy on >8 KB) and landed four low-risk hardening fixes across the URL/share/IO surface — module-level `TextEncoder` reuse, download-filename sanitization, transpose write-back, and a native cross-tab `storage` listener — without touching ratio math.

## What was built

### Task 1 — over-cap contract unification (commit `6d156cc`)
- `src/lib/url.ts`: `encodeScaleToHash` signature changed to `string | null`; the over-cap `throw new RangeError(...)` is replaced with `return null`. In-cap encode path unchanged (version byte, btoa, URL-safe replace). Module doc comment + caps line updated to describe the null contract. (The module-level `UTF8_ENCODER` constant — Task 2(a)'s url.ts hoist — landed here because it shares the same constant block; see Deviations.)
- All four enumerated callers converted from try/catch to a null-check (no `#s=null` ever written):
  - `src/index.md` debounced hash-write cell + "Analyze this scale →" button.
  - `src/pages/analysis.md` debounced hash-write cell.
  - `src/pages/generate.md` `sendCurrentScaleTo` (writeSharedScale still runs first; over-cap shows the cap-error copy + hashless nav).
- `src/lib/INVENTORY.md`: RangeError note → "returns null on > 8 KB plaintext (never throws — matches decoder + writeSharedScale)".
- `src/__tests__/url-hash-integration.test.ts`: added the `returns null on > 8 KB plaintext instead of throwing` assertion; null-guarded the existing round-trip + alphabet assertions (required by the new return type).

### Task 2 — TextEncoder hoist + filename sanitization + transpose write-back (commit `0dc1420`)
- `src/state/scale-store.ts`: module-level `UTF8_ENCODER`; both per-call `new TextEncoder()` sites (read cap + write cap) now reuse it. Each of the two target files (`url.ts`, `scale-store.ts`) declares `new TextEncoder()` exactly once.
- `src/components/scl-io.ts`: new local `sanitizeFilename(name)` — replaces `/` and `\` with `-`, strips C0 control chars + DEL (`/[\x00-\x1f\x7f]/g`), trims, falls back to `"scale"`. Applied in both `.scl` and `.kbm` download handlers for the composed `a.download` name and the status line; `filenameInput.value` is never mutated; extension appended after sanitization.
- `src/components/scale-transform-strip.ts`: `readTranspose` writes the clamped `n`/`d` back to `tnInput`/`tdInput` as integer strings (`String(n)`/`String(d)`) before setting `state.transpose`, so the field can't diverge from state.

### Task 3 — cross-tab storage sync (#22) (commit `7bf3c49`)
- `src/index.md` + `src/pages/analysis.md`: import `SCALE_STORAGE_KEY`; add a reactive cell (immediately after the same-tab CustomEvent cell) with a native `window` `storage` listener. It key-guards on `SCALE_STORAGE_KEY`, re-reads through `readSharedScale()` (validates shape + 8 KB cap + never throws — never parses `e.newValue`), writes ONLY the textarea + dispatches a synthetic `input` event, and tears down via `invalidation.then(removeEventListener)`. No module-top-level side effect. One-way data flow (no feedback loop).

## Deviations from Plan

### Extra caller fixed beyond the four enumerated

**1. [Rule 3 - Blocking] `src/lib/__tests__/url.test.ts` (the fifth caller)**
- **Found during:** Task 1, surfaced by `npm run lint:types` (exactly the safety net the constraints described).
- **Issue:** The url.ts unit test passed `encodeScaleToHash(...)` (now `string | null`) directly into `decodeHashToScale(hash: string)` (5 call sites → TS2345/TS2531), and `Test 8` explicitly asserted the now-removed `throws RangeError` behavior, contradicting the new contract.
- **Fix:** Null-guarded the round-trip/alphabet/`.includes` calls with `?? ""`; rewrote `Test 8` to assert `not.toThrow()` + `toBeNull()`; updated the file's header doc comment from "over-cap throws RangeError" to the null contract.
- **Files modified:** `src/lib/__tests__/url.test.ts` (committed in `6d156cc`).

### Grouping note (not a behavior change)

**2. url.ts `UTF8_ENCODER` hoist (#2) landed in the Task 1 commit, not Task 2.**
- The plan placed the url.ts TextEncoder hoist in Task 2(a). Because the new `string | null` return required editing the exact constant block where the hoisted `UTF8_ENCODER` lives, both changes were made together in `6d156cc`. The scale-store.ts hoist (the other half of 2(a)) is in the Task 2 commit `0dc1420` as planned. Net result is identical to the plan; only the commit boundary differs.

### Authoring hazard handled (no behavior change)

**3. Control-char regex authored via script to avoid a literal-control-char roundtrip.**
- The Edit tool mangled the `sanitizeFilename` control-char class (the typed escapes round-tripped into literal control bytes / a bogus `[^@-^_^?]` class). Rewrote that single line via a Python script to emit the clean ASCII escape `/[\x00-\x1f\x7f]/g`. Verified the file has no BOM and the class is correct (`cat -v`). This mirrors the project's known BOM/glyph-roundtrip caution.

## Verification

| Step | Command | Result |
|------|---------|--------|
| Types | `npm run lint:types` (tsc --noEmit) | PASS (clean) |
| Tests | `npx vitest run` (full suite) | PASS — 752/752 (up from 752; the 2 url test files net the same count after Test 8 rewrite) |
| Build | `npm run build` (observable build) | PASS — 140 links validated, index + analysis compiled |
| Grep gates | UTF8_ENCODER / sanitizeFilename / transpose write-back / storage add+remove | PASS (all present, correct counts) |
| BOM | all 10 touched files | clean (no U+FEFF) |

Ratio math untouched — all edits are string/integer-only.

## Must-haves coverage

- encodeScaleToHash returns null (never throws) over-cap; in-cap returns the URL-safe string — DONE (url.ts + tests).
- All four encode call sites null-guard; no `#s=null` — DONE (index.md ×2, analysis.md, generate.md).
- TextEncoder allocated once per module in url.ts + scale-store.ts — DONE.
- Already-open Dashboard/Analysis tab updates on cross-tab Generate→Send — DONE (storage listener).
- Download filenames stripped of path separators + control chars — DONE (sanitizeFilename).
- Clamped transpose written back to inputs — DONE.

## Known Stubs

None.

## Self-Check: PASSED

Files (modified, exist on disk): all 10 present.
Commits exist: `6d156cc`, `0dc1420`, `7bf3c49` confirmed in `git log`.
