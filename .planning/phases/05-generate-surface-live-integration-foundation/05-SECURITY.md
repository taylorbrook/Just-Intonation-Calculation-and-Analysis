---
phase: 05
slug: generate-surface-live-integration-foundation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-09
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> Register authored at plan time (all 3 PLANs carried `<threat_model>` blocks). Mitigations verified against shipped code on 2026-06-09 — no fresh STRIDE scan required.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| localStorage → app (boot read) | Untrusted persisted JSON (`tuning-systems:scale`) crosses into the app at boot; may be tampered, malformed, oversized, or absent. | Scale text string (`{text, source}`) |
| producer → store (write) | The Generate page's two Send-to buttons are the ONLY writers; `writeSharedScale` enforces shape validation + 8 KB cap. | Scale text string |
| page → URL hash (navigate) | `encodeScaleToHash` (unchanged `url.ts`) version-bytes + caps the payload; RangeError on oversize → hashless navigation. | Encoded scale hash |
| user param input → Scale construction | Segment-size is a bounded integer param producing exact `Fraction`s via the kernel. No string-injection surface. | Bounded integer |
| store → consumer (boot read) | `readSharedScale()` returns validated `{text}` or `null`; `resolveInitialScaleText` keeps it inert when empty. | Scale text string |
| scale-changed event → textarea | Pushed text reaches the existing textarea via a synthetic `input` event; the page's unchanged `parseScala` is the second hardened try/catch boundary. | Scale text string |
| consumer → store | NONE — consumers never write (one-way data flow; hard R2 guard). | — |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-05-01 | Tampering | `readSharedScale` parsing `localStorage["tuning-systems:scale"]` | mitigate | Shape validation (`typeof text === "string"`, reject array/primitive/non-object), `JSON.parse` in try/catch → `null`. **Verified:** `src/state/scale-store.ts:84-104`. | closed |
| T-05-02 | Denial of Service | Oversized stored/sent scale text | mitigate | 8 KB cap (`MAX_SCALE_TEXT_BYTES`, UTF-8 byte length) on BOTH read and write; oversize → `null` read / silent no-op write; `encodeScaleToHash` RangeError → hashless nav. **Verified:** `scale-store.ts:97,127`; shared source `lib/url.ts`. | closed |
| T-05-03 | Information disclosure | `localStorage` throws in private browsing / disabled storage | mitigate | All read/write wrapped in try/catch → `null` / silent no-op; never throws, never crashes boot. **Verified:** `scale-store.ts:84,103,133,141,145`. | closed |
| T-05-04 | Tampering (XSS) | Dynamic render on generate.md + pushed scale text on consumers | mitigate | `createElement`+`textContent`+`replaceChildren` only; scale text rendered solely via the already-audited `scaleTable` / textarea `.value`. **Verified:** zero `.innerHTML=` assignments in `generate.md`, `index.md`, `analysis.md`. | closed |
| T-05-05 | DoS / Tampering (one-way flow, R2 feedback loop) | Send-to buttons writing the store; consumer listeners | mitigate | Send-to buttons are the SOLE store writers; consumer listeners write ONLY the textarea, never the store. **Verified:** `writeSharedScale(` callsite count == 1 (`generate.md:343`); zero writer calls / `setItem` on the scale key in any consumer page. | closed |
| T-05-06 | Repudiation / Integrity | Reference-method numeric param | accept | Bounded integer param producing exact `Fraction`s; no untrusted string reaches the kernel. Low-value, client-side only. | closed |
| T-05-07 | Tampering (regression / boot drift) | Boot precedence on both consumer pages | mitigate | Single `resolveInitialScaleText` helper; R1 boot-equivalence gate. **Verified:** `scale-store-boot.test.ts` + `dashboard-seed.test.ts` GREEN (34/34 store/boot tests pass, 2026-06-09). | closed |
| T-05-SC | Tampering (supply chain) | npm/pip/cargo installs | accept | Phase 5 installs ZERO packages (RESEARCH Package Legitimacy Audit: N/A). No new dependency surface. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-05-A | T-05-06 | Reference-method param is a bounded integer producing exact `Fraction`s; no string-injection path to the kernel. Client-side only, no persistence of attacker-controlled data. | Taylor Brook | 2026-06-09 |
| R-05-B | T-05-SC | Phase 5 adds zero dependencies — no new supply-chain surface to audit. | Taylor Brook | 2026-06-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Observations (out of Phase 5 scope)

- `src/pages/harmonic-series.md:195` uses `thead.innerHTML =` with a **static literal header string** (no scale/user data). This is a pre-existing Phase 3 file, outside the Phase 5 threat surface. Not an open threat; noted for a future general XSS-hygiene sweep if desired.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-09 | 8 | 8 | 0 | /gsd:secure-phase (orchestrator code-verification) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-09
