---
phase: 04-analysis-sharing
plan: 03
subsystem: sharing
tags: [url-hash, base64, rfc-4648, version-byte, security, anal-04]

# Dependency graph
requires:
  - phase: 02-math-kernel-composition-anchor-mvp
    provides: parseScala (consumed by future Plan 04-07 page cells, not by url.ts itself — url.ts is text-only)
provides:
  - encodeScaleToHash + decodeHashToScale (pure-data URL hash for scale text, ANAL-04)
  - URL_HASH_VERSION = 1 (forward-compat sentinel for future scope expansion)
  - MAX_SCALE_TEXT_BYTES = 8192 (encoder cap, D-15)
  - MAX_HASH_BYTES = 16384 (decoder DoS guard, T-04-11)
affects: [04-analysis-sharing/04-07 (page wiring — reads window.location.hash, writes via history.replaceState), share-link-debugging-prose, future-version-bumps]

# Tech tracking
tech-stack:
  added: []  # zero new npm deps — uses Node 20 / browser globals (TextEncoder, TextDecoder, btoa, atob)
  patterns:
    - "Pure-lib URL codec — no DOM access (D-18). Page cells own window.location and history.replaceState. Mirrors the scala.ts / kbm.ts convention."
    - "Total decoder — every malformed/oversized/wrong-version input returns null instead of throwing (D-20). Caller falls back to seed scale + status-region message."
    - "Version byte prefix (0x01) before base64 — forward-compatible. Older decoders refuse unknown versions, newer decoders branch on the leading byte."

key-files:
  created:
    - src/lib/url.ts
    - src/lib/__tests__/url.test.ts
  modified: []

key-decisions:
  - "MAX_SCALE_TEXT_BYTES = 8192 (8 KB) for the encoder; MAX_HASH_BYTES = 16384 (16 KB) for the decoder — accounts for base64's 4/3 expansion plus a generous headroom margin (T-04-11 / T-04-16)."
  - "URL-safe base64 alphabet per RFC 4648 §5 — `+` → `-`, `/` → `_`, no `=` padding (D-16). Decoder restores padding before atob."
  - "TextDecoder({ fatal: true }) for the UTF-8 decode step — malformed sequences fail closed (return null) rather than producing U+FFFD silently (T-04-12)."
  - "Pre-atob alphabet regex check rejects illegal characters in O(1) before any expensive decoding work — first line of defense against pathological inputs."

patterns-established:
  - "Trust-boundary cap pattern: pre-validation byte-count check + alphabet-allowlist regex + try/catch around the actual codec call. Same shape as parseScl's MAX_INPUT_BYTES guard in scala.ts."
  - "Forward-compat version byte at the head of the encoded buffer (NOT inside a JSON envelope) — keeps the codec text-in/text-out and avoids a structural-parsing surface."

requirements-completed: [ANAL-04]

# Metrics
duration: 4min
completed: 2026-05-06
---

# Phase 04 Plan 03: URL hash encode/decode kernel Summary

**Pure-data base64 URL-safe codec for scale text with version-byte prefix; total decoder fails closed on every malformed/oversized/wrong-version input.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-06T21:14:39Z
- **Completed:** 2026-05-06T21:18:30Z
- **Tasks:** 2 (collapsed into RED + GREEN under TDD)
- **Files created:** 2 (`src/lib/url.ts`, `src/lib/__tests__/url.test.ts`)

## Accomplishments

- `encodeScaleToHash(scaleText: string): string` — UTF-8 + 0x01 version byte → base64 → URL-safe alphabet swap → strip `=` padding. Throws `RangeError` only when plaintext exceeds 8 KB (D-15).
- `decodeHashToScale(hash: string): string | null` — total decoder. Every failure mode (oversize, illegal alphabet, bad base64, wrong version, malformed UTF-8, plaintext over-cap) returns `null`. Never throws.
- Constants exported for downstream sanity checks: `URL_HASH_VERSION = 1`, `MAX_SCALE_TEXT_BYTES = 8192`.
- 14 vitest tests passing (13 plan-spec + 1 fuzz totality test); tsc + ESLint clean for the new files.

## Task Commits

1. **Task 1 RED — failing tests for url hash encode/decode** — `76f6e63` (test)
2. **Task 1 GREEN — implement url hash encode/decode kernel** — `feb5230` (feat)

_Note: Task 2 in the plan is the test-writing task. Under TDD execution it collapses into the RED commit (`76f6e63`) above — the same test file satisfies both Task 1's `tdd="true"` requirement and Task 2's deliverable. No separate Task 2 commit needed; all Task 2 acceptance criteria verified against `76f6e63`._

## Sample Round-Trip

Encoded hash for the seed scale text (`9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1`):

```
ATkvOAo1LzQKMjEvMTYKMy8yCjI3LzE2CjcvNAoyLzE
```

- 43 characters, fits comfortably in any URL bar.
- Round-trips exactly (`decodeHashToScale("ATkv...") === seed`).
- First base64 character `A` decodes to `0x01` × 1 = the version byte; the remaining bytes are the literal UTF-8 of the scale text.

Empty-string scale text encodes to `AQ` (just the version byte) and round-trips to `""` — empty plaintext is a legal text per Test 10 (the page renders the seed fallback or the parser errors gracefully; encoder/decoder is text-only).

## Files Created/Modified

- `src/lib/url.ts` — Encoder, decoder, two exported constants. 92 lines including the JSDoc header. No external imports — uses Node 20 / browser globals only.
- `src/lib/__tests__/url.test.ts` — 14 tests; uses the seed scale fixture verbatim from the plan.

## Failure Modes Verified (decoder is total)

| Failure | Test | Result |
|---------|------|--------|
| Empty hash | Test 6 | `null` |
| Oversized hash (>16 KB) | Test 7 | `null` (rejected before atob — T-04-11) |
| Illegal characters (`!!!@@@###`) | Test 5 | `null` (alphabet regex rejects) |
| Wrong version byte (0x00) | Test 4 | `null` |
| Standard `+/=` chars (not URL-safe) | fuzz test | `null` |
| Whitespace, newline, multi-byte unicode in hash | fuzz test | `null` |
| Single base64 char (decodes to <1 byte) | fuzz test | `null` |
| Encoder over-cap (>8 KB plaintext) | Test 8 | `RangeError(/scale text too large/)` |

## Decisions Made

- Followed the plan's implementation block verbatim — the regex-allowlist + try/catch + cap pattern is unchanged.
- Kept the non-null assertion `buf[i]!` with an inline comment explaining the bounds-check justification (Phase 1 D-16's `noUncheckedIndexedAccess` would otherwise complain).
- Added one extra test (the "fuzz" totality test in the `decodeHashToScale` describe block) to lock in T-04-12's "decoder is total" invariant against pathological inputs the 13 plan-spec tests don't cover (whitespace, multi-byte unicode, control chars, non-URL-safe `+/=`). Test 8 of the plan was satisfied by the explicit RangeError test; this fuzz test asserts the *complementary* "no other input throws" invariant. 14 tests total.

## Deviations from Plan

None — plan executed exactly as written. The fuzz test is an additive belt-and-braces check that strengthens T-04-12's mitigation; not a deviation from the plan's behavior or output spec.

## Issues Encountered

- macOS `grep -E` exit-code interaction in the acceptance-check pipeline returned 1 silently when intermediate counts were 0. Diagnosed by switching to `awk` for the same checks. Functional impact: zero — all acceptance criteria pass when checked individually. Documented for future executors.
- Pre-existing `tsc --noEmit` errors in `src/audio/synth.ts` (`npm:sw-synth` type resolution) and `src/components/lattice.ts` (`npm:ji-lattice` + implicit-any) — out of scope per SCOPE BOUNDARY rule (not introduced by this plan; tracked elsewhere). The new files `src/lib/url.ts` and `src/lib/__tests__/url.test.ts` are tsc-clean.

## Threat Model Coverage

| Threat ID | Mitigation Implemented | Verified By |
|-----------|------------------------|-------------|
| T-04-11 (DoS — oversized decode) | `MAX_HASH_BYTES = 16384` short-circuit before atob | Test 7 |
| T-04-12 (Tampering — malformed bytes) | All failure modes caught → null; `TextDecoder({ fatal: true })` | Tests 4, 5, 6, fuzz |
| T-04-13 (XSS — decoded text in DOM) | url.ts is text-only; no DOM, no innerHTML, no eval. Mitigation lives at Plan 04-07's render boundary. | Test 11 (text-only pass-through), grep-gates on `innerHTML`/`eval`/`document.`/`window.` returning zero matches |
| T-04-14 (Spoofing — unknown version byte) | Strict `buf[0] !== URL_HASH_VERSION` check | Test 4 |
| T-04-15 (Info disclosure — length leak) | Accepted (plaintext is shareable per D-15) | n/a |
| T-04-16 (DoS — oversized encode) | `RangeError` thrown when input > 8 KB | Test 8 |

No threat flags. No new attack surface introduced beyond the documented register.

## INVENTORY rows queued for Plan 04-07 consolidation

| Symbol | Source | Notes |
|--------|--------|-------|
| `encodeScaleToHash` | Custom (this repo) | Pure text-in/text-out. UTF-8 + 0x01 version byte + base64 URL-safe (RFC 4648 §5, no padding). Caps plaintext at 8 KB; over-cap throws `RangeError` (T-04-16). No DOM access (D-18). |
| `decodeHashToScale` | Custom (this repo) | Total decoder — every malformed/oversized/wrong-version input returns null (D-20). 16 KB hash byte cap (T-04-11) + URL-safe alphabet allowlist + `TextDecoder({ fatal: true })` (T-04-12). |
| `URL_HASH_VERSION` (= 1) | Custom (this repo) | Forward-compat sentinel. Future versions add new code paths; older decoders fail closed on unknown bytes (T-04-14). |
| `MAX_SCALE_TEXT_BYTES` (= 8192) | Custom (this repo) | D-15 8 KB cap on shared scale text. Both the encoder pre-check and the decoder defense-in-depth check use this constant. |

## Next Phase Readiness

- Plan 04-07 (dashboard + analysis page wiring) can now consume `encodeScaleToHash` / `decodeHashToScale` directly. The contract: page cells call `decodeHashToScale(window.location.hash.slice(3))` (where `#s=` strips the 3-char prefix) and `history.replaceState(null, '', '#s=' + encodeScaleToHash(scaleText))` on edit (debounced ~300 ms per D-26).
- The page cell MUST handle the `null` return from `decodeHashToScale` by falling back to the seed scale and posting "Couldn't load shared scale: <reason>" to the existing `aria-live=polite` status region (D-20). It MUST also catch the `RangeError` from `encodeScaleToHash` when the scale text exceeds 8 KB and surface the same kind of message.
- The decoded text MUST flow through `parseScala(decoded)` for validation; parser errors get surfaced via the same status region. url.ts itself does no validation — it is text-only.
- DOM-render boundary: textarea sets `.value =` (not `innerHTML`); status region uses `textContent` (not `innerHTML`). Plan 04-07's threat model already mandates a grep gate confirming this (T-04-13 mitigation at the consumer).

## Self-Check: PASSED

- File `src/lib/url.ts` exists.
- File `src/lib/__tests__/url.test.ts` exists.
- Commit `76f6e63` exists in git log (RED — `test(04-03): add failing tests for url hash encode/decode`).
- Commit `feb5230` exists in git log (GREEN — `feat(04-03): implement url hash encode/decode kernel`).
- Vitest: 14/14 tests pass.
- All 4 exports present (`URL_HASH_VERSION`, `MAX_SCALE_TEXT_BYTES`, `encodeScaleToHash`, `decodeHashToScale`).
- `URL_HASH_VERSION = 1` constant present.
- `MAX_SCALE_TEXT_BYTES = 8192` constant present.
- URL-safe `+` → `-` replacement present (`replace(/\+/g, "-")`).
- No DOM access in code (matches in url.ts are docstring comments only — verified by line-number inspection).
- No eval / Function / innerHTML in code (matches in url.ts are docstring comments only — verified by line-number inspection).
- tsc + ESLint clean for the two new files.

---
*Phase: 04-analysis-sharing*
*Completed: 2026-05-06*
