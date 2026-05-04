---
id: 260504-lb6
description: "fix CR-02 + CR-03: writeScl description sanitation + parseScl byte-size cap"
date: 2026-05-04
status: complete
commits:
  - 9b764d7  # fix(quick-260504-lb6): sanitize writeScl description (CR-02)
  - 2c44907  # fix(quick-260504-lb6): count UTF-8 bytes at parseScl/parseScala cap (CR-03)
files_changed:
  - src/lib/scala.ts
  - src/lib/__tests__/scala.test.ts
tests:
  total: 144
  passed: 144
  new: 4
---

# Quick Task 260504-lb6 — Summary

## What changed

Closes **CR-02** and **CR-03** from `.planning/phases/02-math-kernel-composition-anchor-mvp/02-REVIEW.md` — both kernel-boundary defects in the .scl I/O path.

### CR-02 — writeScl description sanitation (commit 9b764d7)

`writeScl(scale, description)` previously emitted the description string raw, breaking the round-trip invariant `parseScl(writeScl(s, d)) ≡ {intervals, d}` whenever `d` contained:

- **`\n` / `\r\n`** — shifted every subsequent line by one; `parseScl` read the next line as the count and threw `invalid pitch count "..."`.
- **A leading `!`** — silently swallowed by `parseScl`'s comment filter; the count line then became the description and the first pitch became the count.

Both reachable from user input (dashboard textarea, re-imported descriptions).

**Fix:** new private `sanitizeDescription(d)`:
- Returns `""` for `undefined`/empty.
- Collapses `[\r\n]+` runs to a single space and trims.
- Prefixes a single space when the result starts with `!` (the parser `.trim()`s the description line, so the leading space round-trips away).

`writeScl` calls `sanitizeDescription(description)` instead of `description ?? ""`.

### CR-03 — UTF-8 byte cap at the trust boundary (commit 2c44907)

The 1 MB DoS cap was documented in bytes but compared `string.length` (UTF-16 code units). A 3 MB UTF-8 file made of 3-byte CJK chars (`'三'.repeat(1_000_000)`) slipped past with `length === 1_000_000`. The trust-boundary docstring frames this as security-relevant.

**Fix:** new private `utf8ByteLength(s)`:
- Cheap upper bound: `s.length * 3 ≤ MAX_INPUT_BYTES` → return `s.length * 3` directly. Every UTF-16 code unit costs at most 3 UTF-8 bytes (BMP code points are 1–3 bytes; a surrogate pair = 2 code units = 4 UTF-8 bytes = 2 bytes/unit).
- Otherwise fall back to `new TextEncoder().encode(s).byteLength` for the exact value.

The fast path keeps the common case (small scales, tens of bytes) allocation-free. Both `parseScala` and `parseScl` now call `utf8ByteLength(input)` instead of `input.length`. Error messages updated: dropped the misleading `${body.length} bytes` interpolation, kept "max 1MB UTF-8".

### New tests (4 total)

- `writeScl sanitizes newlines in description` — `"line1\nline2"` → round-trips as `"line1 line2"`.
- `writeScl sanitizes CRLF in description` — `"a\r\nb"` → round-trips as `"a b"`.
- `writeScl defangs description starting with !` — `"!leading-bang"` → round-trips as `"!leading-bang"`.
- `parseScl/parseScala reject files larger than 1MB by UTF-8 byte count, not code-unit count` — 333,334 CJK chars (≈1,000,002 bytes) throw `/too large|1 ?MB/i`; previously `length=333,334` slipped past.

Existing 1 MB ASCII rejection test (`"x".repeat(1_000_001)`) still passes — ASCII bytes = code units.

## Verification

- `npx vitest run` — **144/144 passing** (was 140 + 4 new).
- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/scala.ts src/lib/__tests__/scala.test.ts` — clean.
- Round-trip golden suite (`F01..F16`) untouched and green.

## must_haves traceability

| must_have                                                                                          | evidence                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `writeScl(scale, desc)` round-trips through `parseScl` when desc contains newlines or leading `!`  | `scala.ts:135-153` (sanitizeDescription); 3 new tests at `scala.test.ts:312-327` |
| `parseScala` / `parseScl` reject inputs whose UTF-8 byte length exceeds 1 MB                       | `scala.ts:46-60` (utf8ByteLength) + call sites at `scala.ts:67`, `scala.ts:94` |
| Existing 1 MB ASCII rejection test still passes                                                    | `scala.test.ts:230-232` unchanged, vitest run green                       |
| `src/lib/scala.ts` has sanitizeDescription wired into writeScl                                     | commit 9b764d7                                                            |
| `src/lib/scala.ts` measures UTF-8 byte length at the trust boundary                                | commit 2c44907                                                            |
| `scala.test.ts` covers newline + leading-! description sanitation                                  | commit 9b764d7                                                            |
| `scala.test.ts` covers UTF-8 byte-cap mismatch (length-OK, bytes-over)                             | commit 2c44907                                                            |

## Notes

- R-01 honored: `scala.ts` does not import `Fraction` from `xen-dev-utils`.
- T-02-10/T-02-11 caps unchanged (1 MB, 32 monzo components, ±1024 magnitude). Only the *measurement* of the 1 MB cap changed.
- Sanitation is byte-conservative for legitimate descriptions: `"5/4 just major third"` round-trips byte-identical. Only `\r`/`\n` and a literal leading `!` are touched.
- All 3 critical issues from `02-REVIEW.md` are now closed (CR-01 in quick-260504-i3v; CR-02 + CR-03 here). Warnings (WR-01..WR-N) and the `Phase 2 Code Review` scoreboard remain — those are non-blocking and can be triaged before or after Phase 3 starts.
