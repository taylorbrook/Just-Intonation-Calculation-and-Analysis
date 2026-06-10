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
| `centsToRatio` | Custom wrapper | One-line delegate to xen-dev-utils' `centsToValue`. Symmetric inverse of `toCents`. Pitfall #1 reminder: display/audio projection only — NEVER use the returned Number as kernel input. Added for `src/pages/meantone.md`, which computes irrational tempered 5ths via `1200*log2(3/2) − (1/n)*1200*log2(81/80)` and needs to round-trip back to Hz for audition. |
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
| `sclIo` (`src/components/scl-io.ts`) | Custom (this repo) | Dashboard-only. Import: hidden file picker → `FileReader` → `parseScl` → `opts.onImport(newScale, description)`. Export: `writeScl` → `Blob` → `URL.createObjectURL` → anchor download. Filename default per D-22 (`scale-{N}-tone-{YYYY-MM-DD}`). Status region uses `role=status aria-live=polite` for parser-error announcements; description rendered via `textContent` (T-02-14 — no innerHTML). **Phase 3 extension (Plan 06):** combined widget per D-11 — file picker now `accept=".scl,.kbm"`; auto-detects format by extension and calls `opts.onImportKbm` for `.kbm`; export row gains a second `Download .kbm` button that writes via `writeKbm(opts.kbmForExport ?? defaultKbmFor(scale, opts.baseHz ?? 440))` (D-12 Pitfall #7-safe defaults). |

## Phase 3 entries

### Phase 3 — kbm I/O entries (Plan 02 / IO-03)

| Symbol | Source | Notes |
|--------|--------|-------|
| `KbmMapping` (interface, `src/lib/kbm.ts`) | Custom (this repo) | Typed mirror of the Scala `.kbm` 7-field header + per-key mapping body. **Three-named-fields discipline (Pitfall #7 / D-10):** `middleNote` (where 1/1 sounds), `referenceKey` (MIDI note for which `referenceHz` is given), and `referenceHz` (Hz of the referenceKey, float per spec) are SEPARATE fields — never collapsed into a single `baseHz`. IO-03. |
| `parseKbm` (`src/lib/kbm.ts`) | Custom (this repo) | Permissive about whitespace/BOM/CRLF; strict about field types via per-field `parseIntStrict` / `parseFloatStrict`. Defense-in-depth: 1MB UTF-8 input cap (T-3-04), `size ≤ 1024` (T-3-05), `formalOctave ≤ 1024` (T-3-06), MIDI 0..127 bounds, `referenceHz > 0`. Mapping entries accept non-negative integers OR `'x'`/`'X'`/blank → `null` (muted). Fails closed with named-field error messages (T-3-23). IO-03 / D-09. |
| `writeKbm` (`src/lib/kbm.ts`) | Custom (this repo) | Round-trip-stable serializer: byte-canonical comment-prefixed layout matches the Plan 01 fixtures (12-tet, mid-60-ref-69, seven-degree, with-muted-keys); 6-decimal `referenceHz` per Scala convention. IO-03 / D-09. |
| `kbmToFrequencies` (`src/lib/kbm.ts`) | Custom (this repo) | Pure derivation `Map<midi, Hz>` for the .kbm-aware audition path (D-24). `refHzAtMiddle = referenceHz × 2^((middleNote − referenceKey)/12)` — fixed 12-TET semitone anchor regardless of the consuming scale's period. Internal `degrees` view auto-prepends 1/1 if scale.intervals[0] is not the unison so hand-constructed scales also work (Scala convention: mapEntry 0 references the implicit unison). S-3 audio-boundary `Number()` coercion. IO-03 / D-24. |
| `defaultKbmFor` (`src/lib/kbm.ts`) | Custom (this repo) | D-12 default factory: `middleNote == referenceKey == 69` (A4), `referenceHz = baseHz`, `formalOctave = scale.intervals.length`, identity keyMap, full MIDI range. Pitfall #7-safe by construction (middle == reference eliminates dual-source-of-truth ambiguity). Used by `sclIo` to synthesize a default export when no explicit `kbmForExport` is provided. IO-03 / D-12. |

### Phase 3 — diamond entries (Plan 02 / VIZ-02)

| Symbol | Source | Notes |
|--------|--------|-------|
| `DiamondCell` (interface, `src/lib/diamond.ts`) | Custom (this repo) | Cell record for the tonality-diamond viz: `{ ratio, numerator, denominator, inScale }`. The `numerator` / `denominator` reflect the OCTAVE-REDUCED ratio's `n` / `d` (not the input `i, j`) so consumers see the labeled form "5/4" for the (i=5, j=1) cell. VIZ-02 / D-22. |
| `enumerateDiamond` (`src/lib/diamond.ts`) | Custom (this repo) | Hand-laid odd-limit enumeration: for each odd pair `(i, j) ∈ [1, oddLimit]²`, octave-reduce `i/j` to `[1, 2)` via `Interval.octaveReduce()` default period 2/1 (octave-bound by definition — NOT scale.period; Bohlen-Pierce still compares against the octave diamond). In-scale check via `Interval.equals` (BigInt Fraction equality, NEVER cents tolerance — Pitfall #1 / Pitfall #6). Defense-in-depth: oddLimit clamped to [1, 1023]. VIZ-02 / D-20. |

### Phase 3 — lattice component entries (Plan 04 / VIZ-01)

| Symbol | Source | Notes |
|--------|--------|-------|
| `lattice` (factory, `src/components/lattice.ts`) | Custom (this repo) — wraps `ji-lattice@0.3.2` + `d3@7.9.0` | DOM factory `(scale, synth, opts?) => HTMLElement` per D-08 / D-09. Composes ji-lattice's `spanLattice()` (coordinate output) with D3 SVG rendering + `d3.zoom()` pan/zoom + click→`synth.playNotes` audition. `spanLattice()` called ONCE per render, never inside the zoom handler (Pitfall #6). Octave-only scales (basis === []) render an empty-state message (Pitfall #11). In-scale nodes carry `lattice-node--axis-{N}` class (D-21). VIZ-01 / D-08. |
| `LatticeOpts` (interface, `src/components/lattice.ts`) | Custom (this repo) | `{ basis?, showContext?='neighbors' (D-05), audition?='dyad' (D-07), baseHz?=440, width?, height? }`. `baseHz` lets the dashboard cell pass its computed `effectiveBaseHz` (Plan 06 wiring; D-13 / D-24). VIZ-01. |
| `deriveLatticeBasis` (`src/components/lattice.ts`) | Custom (this repo) | Auto-derived basis: union of primes appearing with non-zero exponent across any interval, minus prime 2 (D-19). Returns sorted ascending. For `>3` primes, truncates to top-2-by-frequency and `console.warn`s the dropped primes. Exported so Plan 05's tonality-diamond can reuse the same prime-axis inference. VIZ-01 / D-19. |

### Phase 3 — tonality-diamond component entries (Plan 05 / VIZ-02)

| Symbol | Source | Notes |
|--------|--------|-------|
| `tonalityDiamond` (factory, `src/components/tonality-diamond.ts`) | Custom (this repo) — consumes `enumerateDiamond` from `src/lib/diamond.ts` | DOM factory `(scale, synth, opts?) => HTMLElement` per D-08 / D-09. Hand-laid square `(i, j)` grid for odd `i, j ∈ [1, oddLimit]`. SVG `<title>` tooltip shows `"<ratio> | <±cents>¢ | <prime-limit>-limit | <in scale|not in scale>"` (D-22, keyboard-discoverable). Click → `synth.playNotes` (default 'dyad' per D-07). `role="button"` only on in-scale cells; out-of-scale cells stay `role="presentation"` for context. `d3.zoom()` (scaleExtent [0.5, 6]). VIZ-02 / D-08. |
| `DiamondOpts` (interface, `src/components/tonality-diamond.ts`) | Custom (this repo) | `{ oddLimit?, showContext?='neighbors' (D-05), audition?='dyad' (D-07), baseHz?=440, width?, height? }`. VIZ-02. |
| `deriveDiamondOddLimit` (`src/components/tonality-diamond.ts`) | Custom (this repo) | Auto-derive: `max(oddLimit(iv) for iv in scale)` rounded UP to nearest preset of `{7, 9, 11, 13, 15, 21, 31}`. Clamps at 31 if scale exceeds the highest preset (the seed scale's max-odd 27 rounds UP to 31 to preserve 27/16 fidelity rather than silently clamping). VIZ-02 / D-20. |

### Phase 3 — keyboard component entries (Plan 05 / VIZ-03)

| Symbol | Source | Notes |
|--------|--------|-------|
| `keyboard` (factory, `src/components/keyboard.ts`) | Custom (this repo) | DOM factory `(scale, synth, baseHz, opts?) => HTMLElement` per D-08 / D-09. Linear-by-degree mapping (D-03): N scale degrees → N adjacent white keys; period-boundary marker (vertical dashed line) after the last key. `pointerdown` → `synth.playNote` returns a release callback held in closure-local `release`; `pointerup` / `pointerleave` / `pointercancel` ALL invoke release (T-3-19); re-entrant guard `if (release) return` (T-3-20) prevents voice stacking. `aria-pressed` mirrors held state. Enter/Space → fire-and-forget short note (no Enter-up analog). Single-note audition only — does NOT expose `opts.audition` per RESEARCH OQ3. Plain DOM via `createElementNS` (no d3 dependency for a simple key strip). VIZ-03 / D-04. |
| `KeyboardOpts` (interface, `src/components/keyboard.ts`) | Custom (this repo) | `{ precision?=1 (0.1¢ per Pitfall #16), keyWidth?=60 }`. Cents-from-12tet labels formatted with U+2212 minus per UI-SPEC. VIZ-03 / D-23. |

## Phase 4 entries

### Phase 4 — EDO ↔ JI mapping kernel (Plan 04-01 / ANAL-01)

| Symbol | Source | Notes |
|--------|--------|-------|
| `bestEdosForScale` (`src/lib/edo.ts`) | Custom (this repo) | ANAL-01 / D-05/D-06/D-09. Per-EDO max/RMS/Tenney-weighted error rows; consumer re-sorts on column-header click. range.min ≥ 5 (D-07), range.max ≤ 1000 (defense-in-depth — T-04-01). Uses `iv.cents` (display projection — Pitfall #1 acknowledged at the call boundary). |
| `bestJiInEdo` (`src/lib/edo.ts`) | Custom (this repo) — wraps `jiSubsetOfEdo` for the prime-limit branch | ANAL-01 / D-08. Two branches: `kind='prime'` delegates to Phase 2 SCALE-05; `kind='odd'` runs the new oddLimitApproximation search. oddLimit ≤ 31 cap (T-04-02). |
| `oddLimitApproximation` (`src/lib/edo.ts`) | Custom (this repo) | ANAL-01 / D-08. Hand-written enumeration — for each odd `i, j ∈ [1, oddLimit]`, build `i/j`, octave-reduce, track closest-by-cents to the target. ~30 LOC per CONTEXT line 220. |

### Phase 4 — MOS construction kernel (Plan 04-02 / ANAL-02)

| Symbol | Source | Notes |
|--------|--------|-------|
| `buildMos` (`src/lib/mos.ts`) | Custom (this repo) | ANAL-02 / D-11/D-12/D-29. Hand-rolled per D-11 (NOT `moment-of-symmetry` — peer-dep risk against `xen-dev-utils@0.13`; ~80 LOC of standard generator-stacking + period-reduce + sort + dedupe). Period-aware via `Interval.octaveReduce(period)` (Pitfall #13). Period > 1/1 enforced (D-29 + Phase 2 CR-01). |
| `nearestMosSize` (`src/lib/mos.ts`) | Custom (this repo) | ANAL-02 / D-13. Stern-Brocot continued-fraction convergents of `log(generator) / log(period)`. Capped at 16 convergents (sufficient for any practical generator). For (3/2, 2/1) emits the standard sequence 2, 3, 5, 7, 12, 17, 29, 41, 53. |

### Phase 4 — URL hash encode/decode (Plan 04-03 / ANAL-04)

| Symbol | Source | Notes |
|--------|--------|-------|
| `encodeScaleToHash` (`src/lib/url.ts`) | Custom (this repo) | ANAL-04 / D-15/D-16. Base64 URL-safe per RFC 4648 §5 (`+/` → `-_`, no padding). Prepends version byte (URL_HASH_VERSION = 0x01) for forward-compat. RangeError on > 8 KB plaintext (T-04-16 / MAX_SCALE_TEXT_BYTES). |
| `decodeHashToScale` (`src/lib/url.ts`) | Custom (this repo) | ANAL-04 / D-19/D-20. NEVER throws — returns null on any failure (malformed alphabet, bad base64, malformed UTF-8 via `TextDecoder({fatal:true})`, wrong version byte, oversized hash > 16 KB). The page cell surfaces the error in the status region. |
| `URL_HASH_VERSION` (`src/lib/url.ts`) | Custom (this repo) | Forward-compat hook (CONTEXT "deferred" — tiered URL scope is a future expansion). Currently 0x01. |
| `MAX_SCALE_TEXT_BYTES` (`src/lib/url.ts`) | Custom (this repo) | 8192 (8 KB plaintext cap; encoded ≤ ~10.7 KB; decoder cap is 16 KB defense-in-depth — T-04-11). |

### Phase 4 — analysis components (Plans 04-04/05/06)

| Symbol | Source | Notes |
|--------|--------|-------|
| `edoJitTable` (`src/components/edo-jit-table.ts`) | Custom (this repo) | ANAL-01 / D-09/D-10. Sortable scale→EDO table with click-to-arpeggiate-the-scale-in-this-EDO. Three sortable error columns (D-06). Pattern 2 factory `(scale, synth, opts?) => HTMLElement`. |
| `edoJiTable` (`src/components/edo-ji-table.ts`) | Custom (this repo) | ANAL-01 / D-08/D-09. Per-step JI approximation with prime/odd toggle + limit input clamp [1, 31]. Status region surfaces clamp messages (T-04-19). |
| `mosBuilder` (`src/components/mos-builder.ts`) | Custom (this repo) | ANAL-02 / D-11..D-14/D-28/D-29. n/d ratio inputs (D-12 — cents-defined deferred). Snap toggle default ON (D-13). Reuses scaleTable + playScale for output (D-14 — fungible Scale). Degenerate inputs surface in status region (D-29). |
| `scaleCompare` (`src/components/scale-compare.ts`) | Custom (this repo) | ANAL-03 / D-21..D-24/D-27/D-30/D-32/D-33. Three B-sources (preset / paste / .scl). Cents-position alignment (D-23). Common-subset via Interval.equals (BigInt — D-32 / Pitfall #1). Per-row sequential A→B audition (D-30). Observable Plot lollipop (D-24). |
| `BUILTIN_B_SCALES` (`src/components/scale-compare.ts`) | Custom (this repo) | D-27 — six built-ins: 12tet, 19edo, 31edo, pythagorean-7, 5-limit-7, bohlen-pierce-9. Plain `Record<string, () => Scale>`; lazy construction so the dropdown's "12tet" only allocates a Scale on selection. |
| `disposeScaleCompare` (`src/components/scale-compare.ts`) | Custom (this repo) | Phase 3 CR-02 panic-clear discipline carried into Phase 4. Page cells call this in `invalidation.then(...)` to drop pending B-note audition setTimeouts and remove the local Esc keydown listener. |

### Phase 5 — scale generation foundation (Plan 05-01 / SYNC-01..04)

Additive shared-scale store at `src/state/scale-store.ts` — the carve-out twin of
`src/theme/theme-prefs.ts` (it lives under `src/state/`, not `src/lib/`, per D-08).
**One-way data flow:** ONLY the producer (the Generate page, Plan 02) calls
`writeSharedScale`; consumers (Dashboard / Analysis, Plan 03) read at boot and
subscribe to `SCALE_CHANGED_EVENT`. No consumer writes back. Three-layer purity:
the read path is side-effect-free; the only side effects in the module are the
`setItem` persist + `dispatchEvent` broadcast inside `writeSharedScale`.

| Symbol | Source | Notes |
|--------|--------|-------|
| `SCALE_STORAGE_KEY` (`src/state/scale-store.ts`) | Custom (this repo) | D-08. `"tuning-systems:scale"` — namespaced localStorage key, mirrors `tuning-systems:theme-prefs`. Constant-regression-guarded. |
| `SCALE_CHANGED_EVENT` (`src/state/scale-store.ts`) | Custom (this repo) | D-08. `"tuning-systems:scale-changed"` — window CustomEvent name; the SYNC-01/02 live-update channel. Constant-regression-guarded. |
| `readSharedScale` (`src/state/scale-store.ts`) | Custom (this repo) | SYNC-03. Mirrors `readThemePrefs`: globalThis.localStorage guard, JSON.parse, reject array/primitive/non-object, `typeof text !== "string"` → null, 8 KB UTF-8 cap on read → null (T-05-01/02), try/catch → null (T-05-03). Never throws. NO DOM. |
| `writeSharedScale` (`src/state/scale-store.ts`) | Custom (this repo) | SYNC-01/02 write transport. Two best-effort side effects: persist `{text,source?}` JSON (silent on throw) + dispatch CustomEvent on `window`. Per RESEARCH A2 the event fires EVEN WHEN persistence throws (private-browsing live-update). 8 KB cap → silent no-op (no persist, no event — T-05-02). |
| `resolveInitialScaleText` (`src/state/scale-store.ts`) | Custom (this repo) | D-12 / SYNC-04 anchor. `hashDecoded ?? stored?.text ?? seedText`. Empty-store boot (`stored === null`) is byte-identical to v1.0 `hash ?? seed` — the R1 gate (`src/__tests__/scale-store-boot.test.ts`). |
| `MAX_SCALE_TEXT_BYTES` (reused from `src/lib/url.ts`) | Custom (this repo) | D-09. The 8 KB cap is imported, NOT redeclared — single source of truth shared with the `#s=` URL codec. No second serialization. |

## Phase 6 entries

### Phase 6 — CPS kernel (Plan 06-01 / GEN-01)

| Symbol | Source | Notes |
|--------|--------|-------|
| `cps` | Custom (this repo) | Flagship JI structure; hand-rolled over xen-dev-utils' `kCombinations` for transparent BigInt ownership (OQ-4/D-12); SonicWeave's `cps` is the one-line alternative. Dedupe by exact `n/d` (Pitfall #1/#6), never cents. Period param exists per D-07; UI fixes it at 2/1. Subset products are rooted at the smallest product (Wilson construction → tonic 1/1) before octave-reduce. Defense-in-depth: `factors.length ≤ 12` (MAX_FACTORS) and `1 ≤ k ≤ factors.length` throw RangeError BEFORE enumeration (T-06-01, C(12,6)=924 worst case). |
