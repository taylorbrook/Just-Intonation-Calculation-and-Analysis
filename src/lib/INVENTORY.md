# Kernel Inventory

Each kernel primitive added to `src/lib/` should be listed here with:
- Function/type name
- Source: custom OR delegates to `xen-dev-utils` / `sonic-weave` / `fraction.js`
- Reason (if custom): why we did NOT use the upstream version

Discipline per Pitfall #5 (PITFALLS.md): wrap, don't reimplement. Before writing any
math primitive in `src/lib/`, grep `xen-dev-utils` source first.

## Phase 1 entries

| Symbol | Source | Notes |
|--------|--------|-------|
| `Fraction` | `fraction.js@5.3.4` (exact pin per D-17) | BigInt-backed rational. Used for the D-14 hello page; will be the foundation of `Interval` in Phase 2. Imported directly from `fraction.js`, not via `xen-dev-utils` re-export, so the version pin is unambiguous. |

## Phase 2 entries

| Symbol | Source | Notes |
|--------|--------|-------|
| `Interval` (class) | Custom (this repo) — wraps `fraction.js@5.3.4` | BigInt-backed source of truth; lazy monzo + cents caches. Per R-01: imports `Fraction` from `fraction.js` directly (NEVER xen-dev-utils' Number-backed `Fraction`). Immutable per D-24 — `mul`, `div`, `inv`, `octaveReduce` return NEW instances. `octaveReduce(period?)` is period-aware (Pitfall #13; default 2/1). |
| `toMonzo`, `monzoToBigNumeratorDenominator`, `primeLimit`, `monzosEqual`, `tenneyHeight`, `wilsonHeight`, `PRIMES` | `xen-dev-utils@0.13.1` | Re-exported via `src/lib/monzo.ts`. R-01 reminder: re-exports list does NOT include `Fraction`. `monzosEqual` is length-tolerant (Pitfall #14). |
| `monzoAdd`, `monzoSub`, `monzoScale` | `xen-dev-utils@0.13.1` (renamed re-exports of `add`/`sub`/`scale`) | Renamed at the boundary so we don't shadow the global `add`/`sub` mathematical reading. |
| `benedettiHeight` | Custom (this repo) | xen-dev-utils ships `tenneyHeight` (log(n*d)) + `wilsonHeight` but not Benedetti (= n*d itself). Computed via `monzoToBigNumeratorDenominator` so the BigInt path is honored before the Number coercion at the end. |
| `oddLimit` | Custom (this repo) | Hand-written from monzo: strip factors of 2 from numerator and denominator, take the larger. |
| `toCents`, `centsFrom12tet` | Custom wrapper / Custom | `toCents` delegates to xen-dev-utils' `valueToCents`/`monzoToCents` based on input type. `centsFrom12tet` is a one-line projection. Pitfall #1: both are display-only — never use cents as kernel input. |
| `COMMAS` (table), `nameForMonzo`, `commaByName` | Custom (this repo) | 16 hand-curated, hand-verified entries per D-21 (5-/7-/11-limit + Mercator's). Lookup by canonical monzo via xen-dev-utils' `monzosEqual` (length-tolerant, Pitfall #14). Cents-within-epsilon lookup is FORBIDDEN per Pitfall #1/#6 — distinct commas (e.g. syntonic ~21.5¢ vs schisma ~1.95¢) must not be conflated by float tolerance. `commaByName` round-trips through `monzoToBigNumeratorDenominator` so even Mercator's 25-digit ratio reconstructs exactly. |

## Phase 2 — Scale entries (added by Plan 06 on behalf of Plan 03)

| Symbol | Source | Notes |
|--------|--------|-------|
| `Scale` (class) | Custom (this repo) | Composes `Interval[]` per ARCHITECTURE Pattern 1. Immutable per D-24 — `rotate`, `reduce`, `dedupe`, `transpose` return new instances. Period stored explicitly (D-14 default = last interval). Period-aware `reduce()` per Pitfall #13 — period-equal inputs preserved as the period (information-preserving), Bohlen-Pierce 9/1 still reduces to 1/1 because 9/1 ≠ period 3/1. |
| `jiSubsetOfEdo` | Custom (this repo) — wraps `xen-dev-utils.approximatePrimeLimit` | SCALE-05. xen-dev-utils returns Number-backed Fraction; we round-trip via `${n}/${d}` string into Interval's BigInt-backed Fraction (R-01). `maxExponent=5` (not 8) keeps the search inside Number.MAX_SAFE_INTEGER for 31-EDO 7-limit. |

## Phase 2 — Scala I/O entries (added by Plan 06 on behalf of Plan 04)

| Symbol | Source | Notes |
|--------|--------|-------|
| `parseScala` (body parser, D-12) | Custom (this repo) | Auto-prepends 1/1 per D-13. Shared with the dashboard text-input (Plan 07). Comments (`!`) skipped; cents-detection via `.` per D-19; monzo bra-ket `[a b c>` per D-15. 1MB input cap (T-02-10); monzo length cap 32, magnitude cap ±1024 (T-02-11). |
| `parseScl` (full file, IO-01) | Custom (this repo) | Strips BOM (U+FEFF), normalizes CRLF→LF, validates pitch count. Errors clearly on negative-ratio (Pitfall #6), multi-slash, and count mismatch (F11, F12, F13). 1MB input cap. |
| `writeScl` (serializer, IO-02, D-13) | Custom (this repo) | Does NOT emit the unison line per D-13. Last interval is the period per D-14. Uses `formatRatio` (reads `.fraction.n` / `.fraction.d` BigInts) so whole-number ratios serialize as `2/1` not `2` — fraction.js' `toFraction()` drops `/1`. Round-trip equivalence is via `Fraction.equals`, NOT byte-equality (cents-source pitches re-emit as best-effort ratios). |
| `scalaToCsv` (IO-04 helper) | Custom (this repo) | TSV payload for the scaleTable copy-to-clipboard button (Plan 06). Lives in `src/lib/` so it is testable without a DOM. |

## Phase 2 — Audio entries (added by Plan 06 on behalf of Plan 05)

| Symbol | Source | Notes |
|--------|--------|-------|
| `createSynth` (factory in `src/audio/synth.ts`) | Custom (this repo) — wraps `sw-synth@0.4.0` | Lifecycle wrapper: lazy AudioContext (Pitfall #2 — never at module load, never at `createSynth()` call; only on first method call), voice tracking via noteOff callbacks (Pitfall #9), polyphony cap (D-17 = 16, FIFO via `sw-synth.maxPolyphony`, clamped to [1, 64] for T-02-19), ADSR overrides (D-16: attack 0.005s / decay 0.030s / sustain 0.7 / release 0.150s). Hz clamped to [20, 20000] (T-02-17); arpeggio length capped at 256 (T-02-18). Dispose is TERMINAL — post-dispose calls are no-ops. Three-layer discipline: imports from `sw-synth`; MUST NOT import from `src/lib/` or `src/components/`. |
| `SynthHandle` (interface) | Custom (this repo) | Public audio surface for `src/components/` and pages. Methods: `playNote`, `playNotes`, `playArpeggio`, `startDrone`, `panic`, `activeVoices` (read-only getter), `dispose`. Components and pages depend on this interface, NOT on sw-synth's `Synth` class directly (D-09 owner-allocates). |

## Phase 2 — Components entries

Note: components live in `src/components/` (not `src/lib/`), but they are listed here for discoverability — INVENTORY.md is the project's one-stop index for "what is wired up where." Per UI-SPEC + D-09, every component is a plain DOM factory `(data, ...rest, opts?) => HTMLElement` with no module-level state and no global synth registry; the SynthHandle is always passed in by the caller.

| Symbol | Source | Notes |
|--------|--------|-------|
| `playInterval` (`src/components/play-interval.ts`) | Custom (this repo) | Inline ▶ button for theory pages (NOTES-03). Plays `[baseHz, baseHz × interval]` for 1.5s (D-18). D-07: NOT used in dashboard — audioPanel replaces it there. baseHz default 440 (D-08). |
| `playScale` (`src/components/play-scale.ts`) | Custom (this repo) | Inline ⏵⏵ Play scale button. Arpeggiates `scale.intervals` at stepSec 0.45s (D-18). |
| `scaleTable` (`src/components/scale-table.ts`) | Custom (this repo) | 4-column table per D-06 (Degree / Ratio / Cents / ¢ from 12-TET). Cents at 0.1¢ default per Pitfall #16 (`opts.precision` overrides). Optional copy button → `scalaToCsv` via `navigator.clipboard.writeText` (IO-04). Cell values rendered via `createElement` + `textContent` — never `innerHTML` for dynamic content (T-02-22, T-02-23). |
| `ratioPill` (`src/components/ratio-pill.ts`) | Custom (this repo) | Inline `<code>n/d</code> <small>(~cents¢)</small>` pill for prose. Unicode rendering, NOT KaTeX (RESEARCH O-01 / D-10 — KaTeX reserved for true math). |
| `audioPanel` (`src/components/audio-panel.ts`) | Custom (this repo) | Dashboard-only (D-07/D-10). Three rows: interval-selector + ▶ Play, ⏵⏵ Arpeggiate, 🔇/🔊 Drone toggle. Drone toggle holds the stop callback returned by `synth.startDrone` (Pitfall #9). Drone state announced via `aria-pressed` + icon swap + visible text (color-independent — UI-SPEC accessibility). |
| `sclIo` (`src/components/scl-io.ts`) | Custom (this repo) | Dashboard-only. Import: hidden file picker → `FileReader` → `parseScl` → `opts.onImport(newScale, description)`. Export: `writeScl` → `Blob` → `URL.createObjectURL` → anchor download. Filename default per D-22 (`scale-{N}-tone-{YYYY-MM-DD}`). Status region uses `role=status aria-live=polite` for parser-error announcements; description rendered via `textContent` (T-02-14 — no innerHTML). |
