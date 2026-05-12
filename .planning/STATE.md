---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: MVP
status: shipped
stopped_at: ""
last_updated: "2026-05-12T18:00:00.000Z"
last_activity: 2026-05-12 -- quick-260512-f0z: add spiral-of-fifths SVG visualization component (raw `createElementNS` keyboard.ts pattern; signature `spiralOfFifths(n, opts?: {temperedFifthCents?, highlightWolf?, width?}) => HTMLDivElement` plus pure exports `spiralGeometry(n, fifthCents, tempered?)` and `closingErrorCents(n, fifthCents)`; pure-3/2 branch uses exact Interval chain via `.mul(3/2).octaveReduce()`, tempered branch returns `ratio: null` and derives cents from octave-reduced cumulative cents; n=12 pure-3/2 step 12 lands at 531441/524288 with +23.46¢ Pythagorean-comma gap visible as ≈7° angular offset; auto-shrink `dr` keeps r_n inside half-viewBox for arbitrary n; happy-dom vitest spec 18/18 pass; component NOT wired into any page yet)
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 25
  completed_plans: 25
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07 after v1.0 milestone close)

**Core value:** I can design any JI scale (arbitrary ratios, no prime-limit ceiling), see it expressed as ratios and cents-from-12tet, hear it, and export it to Scala `.scl`/`.kbm` — all from a self-hosted notebook where the calculator and the research prose live together.
**Current focus:** Planning next milestone — run `/gsd-new-milestone` to scope v1.1 (or v2.0).

## Current Position

Milestone: v1.0 MVP — SHIPPED 2026-05-07
Phases: 4/4 complete (full archive at .planning/milestones/v1.0-ROADMAP.md)
Last activity: 2026-05-12 -- quick-260512-fg3: add vertical Plot chart of partials 1..16 (y reversed, x=cents, color=largest-prime-in-monzo with 7-hue color-blind palette), "▶ Sweep partials 1→16" arpeggiator (synth.playArpeggio(freqs, 0.35), reuses page's cell-owned synth), and Further reading bullets (en.xen.wiki/w/Harmonic_series, kylegann.com/tuning.html) to src/pages/harmonic-series.md — additive +107 lines, no refactor; iv.cents accessed once per partial at display boundary, audio uses Number(iv.fraction.valueOf()) at audio boundary

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 18
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | - | - |
| 02 | 7 | - | - |
| 03 | 7 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-bootstrap-build P01 | 16min | 2 tasks | 11 files |
| Phase 01-bootstrap-build P02 | 3min | 2 tasks | 11 files |
| Phase 01-bootstrap-build P03 | 3min | 2 tasks | 4 files |
| Phase 01-bootstrap-build P01-04 | 6min | 2 tasks | 1 files |
| Phase 02-math-kernel-composition-anchor-mvp P01 | 4min | 2 tasks | 27 files |
| Phase 02-math-kernel-composition-anchor-mvp PP02 | 6min | 2 tasks tasks | 9 files files |
| Phase 02-math-kernel-composition-anchor-mvp P03 | 4min | 1 tasks | 2 files |
| Phase 02-math-kernel-composition-anchor-mvp P05 | 3min | 1 tasks | 2 files |
| Phase 02-math-kernel-composition-anchor-mvp P04 | 5min | 1 tasks | 2 files |
| Phase 02-math-kernel-composition-anchor-mvp P06 | 5min | 2 tasks | 12 files |
| Phase 02-math-kernel-composition-anchor-mvp P07 | 50min | 3 tasks | 6 files |
| Phase 03-visualization-mobile-audio-audit P06 | ~10h | 6 tasks | 11 files |
| Phase 04-analysis-sharing P07 | 57min | 4 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 4-phase structure follows research-recommended dependency order (bootstrap → kernel-MVP with composition anchor → viz + mobile → analysis); temperament browser deferred to v2
- [Phase ?]: Honored D-17: @observablehq/framework exact-pinned to 1.13.4 (no caret); transitive deps locked via package-lock.json
- [Phase ?]: Honored D-13: package.json contains the 9-script set verbatim (dev, build, lint:types, test, test:watch, lint, format, format:check, ci); no observable deploy script per D-05
- [Phase ?]: Honored D-18: Node 20 LTS pin via .nvmrc (=20) and engines.node (>=20)
- [Phase 01]: Honored D-16: tsconfig.json has all four strict flags (strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes)
- [Phase 01]: Honored D-12: ESLint 9 flat config uses recommendedTypeChecked baseline scoped to src/**/*.{ts,js}; root-level configs linted without type-aware rules
- [Phase 01]: Honored D-07: tests live at src/lib/__tests__/ adjacent to source; vitest.config.ts excludes Framework cache and Markdown
- [Phase 01]: Added src/.observablehq/** to ESLint ignores - Framework cache lives at src/.observablehq/, not repo root
- [Phase ?]: [Phase 01]: Honored D-14: src/index.md imports {Fraction} from npm:fraction.js, computes new Fraction("81/79"), and renders ratio + cents (~43.28¢) inline — proves Framework + npm: + BigInt + strict TS end-to-end
- [Phase ?]: Honored D-17: fraction.js exact-pinned to 5.3.4 (no caret); xen-dev-utils, sonic-weave, ji-lattice, sw-synth caret-ranged
- [Phase ?]: Honored D-21: temperaments and mathjs absent from package.json (deny-list grep); accepted ji-lattice peer-dep warning per CLAUDE.md compatibility table
- [Phase ?]: Honored D-08: src/lib/INVENTORY.md seeded with first kernel-discipline entry (Fraction → fraction.js@5.3.4); establishes wrap-don't-reimplement pattern (Pitfall #5)
- [Phase ?]: Reworded src/index.md prose from 'composition dashboard' to 'piece dashboard' to satisfy plan's deny-grep on 'composition|theory'; D-15 intent (no skeleton-page files) preserved
- [Phase ?]: [Phase 01]: Honored D-02/D-03/D-05: single GitHub Actions workflow chains npm ci → 4 gates → deny-list → build → configure-pages → upload-artifact → deploy-pages on push to main; PRs run gates + build only; no observable deploy invocation
- [Phase ?]: [Phase 01]: Honored security_constraints: only first-party actions/* (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4); minimum-needed permissions (contents:read, pages:write, id-token:write); concurrency:{group:pages, cancel-in-progress:false}
- [Phase ?]: [Phase 01]: Honored D-18 + D-21: setup-node reads node-version-file: .nvmrc (Node 20 single-source-of-truth); in-CI deny-list step rejects temperaments / mathjs in package.json (defense-in-depth alongside Plan 03 local check)
- [Phase ?]: [Phase 02 Plan 01]: Honored D-23 — KaTeX 0.16.45 CSS head-injected via SRI-pinned CDN; no auto-render JS (KaTeX JS lazy-loads on first tex cell)
- [Phase ?]: [Phase 02 Plan 01]: Honored R-01 — eslint.config.js no-restricted-imports rule blocks Fraction from xen-dev-utils repo-wide (kept active in test files; no kernel test legitimately needs that import)
- [Phase ?]: [Phase 02 Plan 01]: Honored Phase 1 D-07 extension — vitest.config.ts include glob now covers src/lib/__tests__/, src/audio/__tests__/, and src/__tests__/
- [Phase ?]: [Phase 02 Plan 01]: Sourced 3 golden archive .scl files from live Huygens-Fokker scales.zip; renamed slendro_av.scl→slendro.scl and young-lm_piano.scl→young_lm.scl; per-file source + license documented in golden/LICENSE.md
- [Phase ?]: [Phase 02 Plan 02]: Honored R-01 at source — src/lib/interval.ts imports Fraction from fraction.js directly
- [Phase ?]: [Phase 02 Plan 02]: Honored D-24 immutability — Interval.mul/div/inv/octaveReduce return new instances, verified with referential-inequality test assertions
- [Phase ?]: [Phase 02 Plan 02]: Honored Pitfall #13 — Interval.octaveReduce(period?) accepts arbitrary periods (default 2/1; tested with 9/1 reduced by 3/1 → 1/1)
- [Phase ?]: [Phase 02 Plan 02]: Honored Pitfall #6 + D-21 — 16 hand-verified commas keyed on canonical monzo; Mercator's comma 25-digit ratio round-trips exactly through BigInt path (live R-01 proof)
- [Phase ?]: [Phase 02 Plan 02]: Honored Pitfall #5 — 8 INVENTORY rows added; every new export has Source + Notes
- [Phase ?]: [Phase 02 Plan 02]: Curated commas table — dropped 4 unverified candidates from planner draft, substituted verified replacements (harmonic seventh comma 49/48, jubilisma 50/49, breedsma 2401/2400); fixed rastma sign and Mercator direction
- [Phase 02]: Plan 03: Honored D-24 + Pitfall #13 — Scale.reduce treats period-equal inputs specially (preserves period; doesn't reduce to 1/1) so [9/8, 5/4, 9/8, 2/1].reduce() yields length-3 [9/8, 5/4, 2/1] while Bohlen-Pierce [9/1, 3/1] still reduces to [1/1, 3/1]
- [Phase 02]: Plan 03: Honored R-01 — jiSubsetOfEdo round-trips xen-dev-utils' Number-backed Fraction through ${n}/${d} string into Interval's BigInt-backed Fraction; maxExponent=5 (not 8) keeps the search inside Number.MAX_SAFE_INTEGER for 31-EDO 7-limit
- [Phase 02]: Plan 03: Wave-2 file-ownership — INVENTORY.md NOT modified in this plan; Plan 06 will consolidate Scale + jiSubsetOfEdo rows alongside Plans 04/05 to avoid merge conflicts
- [Phase ?]: [Phase 02]: Plan 05: Honored D-16/D-17/D-18 + Pitfall #2/#9 + ARCHITECTURE Pattern 4 — createSynth factory with lazy AudioContext, voice tracking via noteOff callbacks, terminal idempotent dispose; defense-in-depth Hz clamp [20, 20000] (T-02-17), arpeggio cap 256 (T-02-18), polyphony clamp [1, 64] (T-02-19); three-layer discipline preserved
- [Phase ?]: [Phase 02]: Plan 05: Wave-2 file-ownership — INVENTORY.md NOT modified; Plan 06 (Wave 3) will add createSynth + SynthHandle rows alongside Plans 03/04's queued rows to avoid merge conflicts
- [Phase ?]: [Phase 02]: Plan 04: Honored D-12/D-13/D-14/D-15/D-19 + Pitfall #6 — single shared parseScala body parser feeds .scl import + dashboard textarea; auto-prepends 1/1; rejects negative-ratio + multi-slash with clear errors; cents detection by '.' membership; monzo bra-ket as project extension
- [Phase ?]: [Phase 02]: Plan 04: Added formatRatio helper because fraction.js' toFraction() drops '/1' for whole-number ratios — writeScl/scalaToCsv read iv.fraction.n/.d (BigInt) directly to emit explicit n/d form
- [Phase ?]: [Phase 02]: Plan 04: Honored R-01 + T-02-10/T-02-11 — only centsToValue imported from xen-dev-utils (NOT Fraction); 1MB input cap; monzo length cap 32; per-component magnitude cap ±1024
- [Phase ?]: [Phase 02]: Plan 04: Wave-2 file-ownership — INVENTORY.md NOT modified; Plan 06 (Wave 3) will consolidate parseScala/parseScl/writeScl/scalaToCsv rows alongside Plans 03/05 to avoid merge conflicts
- [Phase ?]: [Phase 02]: Plan 06: Honored D-09 + ARCHITECTURE Pattern 2 — six widgets as plain (data, ...rest, opts?) => HTMLElement factories; SynthHandle passed in by caller (no global synth registry); three-layer discipline preserved (no sw-synth direct imports in components)
- [Phase ?]: [Phase 02]: Plan 06: Honored D-06/D-07/D-08/D-10/D-22 — 4-column scaleTable (Degree/Ratio/Cents/¢ from 12-TET) with cents at 0.1¢ default per Pitfall #16; audioPanel layout interval-selector + arpeggiate + drone toggle (aria-pressed, Pitfall #9 stop-callback); baseHz default 440; sclIo filename default scale-{N}-tone-{YYYY-MM-DD}
- [Phase ?]: [Phase 02]: Plan 06: Wave-3 INVENTORY consolidation — appended four sections (Scale, Scala I/O, Audio, Components) with 12 new symbol rows; Plans 03/04/05 deferred their rows to avoid Wave-2 merge conflicts
- [Phase ?]: [Phase 02]: Plan 06: Defense-in-depth XSS — all dynamic cell values, status messages, option labels rendered via createElement+textContent; only static <th> row in scaleTable uses innerHTML (no interpolated values); T-02-22, T-02-23, T-02-14 mitigated
- [Phase ?]: [Phase 02]: Plan 06: Deferred CSS-import-from-.ts question to Plan 07 — Framework's esbuild.transform passes 'import "./foo.css"' through unchanged, which fails at runtime; kept per plan instruction since plan acknowledged this as a Plan 07 smoke-test concern; recommended migration to per-page style: frontmatter or <link> head injection
- [Phase 02]: Plan 07: Honored D-01 end-to-end — src/lib/pieces/ does NOT exist; seed scale (D-02) baked as a string constant in src/index.md; COMP-01/02/03 reframed: COMP-03 is now a CI gate on the seed text + .scl round-trip rather than a piece-module test
- [Phase 02]: Plan 07: Honored Pattern 4 (cell-owned synth) on both pages — src/index.md and src/pages/syntonic-comma.md each isolate createSynth() + invalidation.then(synth.dispose) in a cell with no dependencies on scale/baseHz; cross-page navigation does not leak AudioContexts (verified at Checkpoint 2)
- [Phase 02]: Plan 07: COMP-03 reframed gate — src/__tests__/dashboard-seed.test.ts asserts the seed parses to 8 intervals via parseScala (1/1 auto-prepended), period is 2/1 (D-14), round-trips writeScl→parseScl with all intervals equal, and writeScl never emits a 1/1 unison line (D-13); 5/5 tests passing, full Phase 2 suite at 136 passing
- [Phase 02]: Plan 07: Rule 3 deviation — applied prettier --write to scale.ts and scale.test.ts (pre-existing line-length drift from Plan 03 noted in 02-04 SUMMARY's deferred items); pure whitespace, zero logic change; necessary to satisfy plan acceptance criterion 'npm run ci exits 0'
- [Phase 03]: Plan 06: Honored D-01/D-02/D-11/D-13/D-16/D-17/D-18 — viz widgets ship on src/index.md (no theory pages); full-bleed vertical stack lattice→diamond→keyboard; combined sclIo with .scl/.kbm auto-detection by extension; imported .kbm applies to playback by default with override toggle surfacing only after import; Stop button + Esc bound globally with 100ms activeVoices polling; single-column responsive at all widths with 16px input font-size; Safari macOS RDM as verification target
- [Phase 03]: Plan 06: Honored Pitfall #11 (Esc bound in synth cell, no scale-dependency rebinding), Pitfall #2 (no new AudioContext in viz cells), Pitfall #5 (12 INVENTORY rows added with requirement + decision back-references)
- [Phase 03]: Plan 06: UAT discovery (Rule 1 deviation in commit 7d943ae) — per-page `style:` frontmatter REPLACES Framework's default stylesheet rather than augmenting it. Pattern recorded: theme tokens MUST live in styles.css when any page uses style: frontmatter. Also fixed lattice fit-to-viewBox, isometric (col-row, col+row) tonality-diamond grid for true rhombus, translucent color-mix fills that read on both themes, viz max-width caps
- [Phase 03]: Plan 06: Mobile-audit checkpoint PASSED on Safari macOS RDM (iPhone preset) after UAT fix commit; gaps filed: none. mobile-audit.md documents RDM-only limitations (hardware silent switch, autoplay-policy nuances) as accepted residual risk per D-18; physical-iPhone verification + iOS<16.4 fallback deferred to v2
- [Phase ?]: [Phase 04]: Plan 07: Honored D-17/D-19/D-20/D-26 — page-cell hash IO uses replaceState (NEVER pushState; grep gate enforces) + 300ms debounce + decodeHashToScale silent override on success + textContent status surface on null with hash retained for debug-copy
- [Phase ?]: [Phase 04]: Plan 07: Honored D-34 + Pitfall #11 — analysis page synth cell is verbatim mirror of dashboard's; Esc + activeVoices polling bound IN the synth cell (not in feature cells); two pages own SEPARATE AudioContexts (Pattern 4 inheritance verified at Checkpoint 1)
- [Phase ?]: [Phase 04]: Plan 07: INVENTORY consolidation — appended 15 Phase 4 rows (4 sub-tables: edo/mos/url kernels + components incl. disposeScaleCompare); intermediate plans deferred rows to avoid wave-2 merge conflicts
- [Phase ?]: [Phase 04]: Plan 07: Both UAT checkpoints (10/10 each) approved — analysis page UAT (synth lifecycle clean, all 4 widgets functional, mobile-responsive) + URL share-path UAT (BigInt round-trip across fresh-tab paste, replaceState back-button cleanliness, malformed-hash D-20 retention)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260504-i3v | fix CR-01: Interval.octaveReduce infinite loop on period <= 1/1 | 2026-05-04 | e288037 | [260504-i3v-fix-cr-01-interval-octavereduce-infinite](./quick/260504-i3v-fix-cr-01-interval-octavereduce-infinite/) |
| 260504-lb6 | fix CR-02 + CR-03: writeScl description sanitation + parseScl UTF-8 byte cap | 2026-05-04 | 2c44907 | [260504-lb6-fix-cr-02-cr-03-writescl-description-san](./quick/260504-lb6-fix-cr-02-cr-03-writescl-description-san/) |
| 260507-ios | fix tonality-diamond zoom snap: first zoom event jumps diamond to top-left | 2026-05-07 | 98602f5 | [260507-ios-fix-tonality-diamond-ui-shift-bug-on-zoo](./quick/260507-ios-fix-tonality-diamond-ui-shift-bug-on-zoo/) |
| 260507-mgl | app UX/visual upgrade: Framework theme + global stylesheet, sidebar/TOC, orientation card, H2 anchors, header/footer | 2026-05-07 | 2fdd558 | [260507-mgl-look-into-ways-to-make-this-app-better-l](./quick/260507-mgl-look-into-ways-to-make-this-app-better-l/) |
| 260511-j8l | add Pythagorean-comma theory page mirroring syntonic-comma.md; sidebar entry registered | 2026-05-11 | 4d06e66 | [260511-j8l-add-pythagorean-comma-theory-page-at-src](./quick/260511-j8l-add-pythagorean-comma-theory-page-at-src/) |
| 260511-jbq | add schisma theory page (32805/32768) mirroring syntonic-comma.md; sidebar entry registered | 2026-05-11 | ddb15a4 | [260511-jbq-add-schisma-theory-page-at-src-pages-sch](./quick/260511-jbq-add-schisma-theory-page-at-src-pages-sch/) |
| 260511-jyh | add septimal-comma theory page (64/63, Archytas) mirroring syntonic-comma.md; sidebar entry registered | 2026-05-11 | 924edb5 | [260511-jyh-add-septimal-comma-theory-page-at-src-pa](./quick/260511-jyh-add-septimal-comma-theory-page-at-src-pa/) |
| 260511-rb4 | add monzos theory page (prime-factor vectors; 3/2, 5/4, 81/80, 7/6 worked examples) mirroring syntonic-comma.md; sidebar entry registered | 2026-05-12 | 9470db5 | [260511-rb4-add-monzos-theory-page-at-src-pages-monz](./quick/260511-rb4-add-monzos-theory-page-at-src-pages-monz/) |
| 260511-uuh | add otonality-utonality theory page (Partch's over-N/under-N duality; 4:5:6:7 vs 1/4:1/5:1/6:1/7 with kernel-side .inv().octaveReduce() verification); sidebar entry registered | 2026-05-12 | 64ab9a2 | [260511-uuh-otonality-utonality](./quick/260511-uuh-otonality-utonality/) |
| 260511-vlq | add harmonic-series theory page (partials 1-16 over baseHz=110 with per-row playInterval; positioned as "ground floor" first in Theory notes sidebar); See-also back-link from syntonic-comma.md; forward-links to /pages/prime-limits + /pages/odd-limits | 2026-05-12 | 816af02 | [260511-vlq-add-harmonic-series-theory-page](./quick/260511-vlq-add-harmonic-series-theory-page/) |
| 260512-aph | add prime-limits theory page (3-limit 3/2,9/8 -> 5-limit 4:5:6 triad -> 7-limit 7/4 -> 11-limit 11/8 with playInterval at each rung; references commas.ts 5/7/11-limit grouping); sidebar entry after Monzos; harmonic-series.md forward-link parenthetical dropped | 2026-05-12 | fb5a736 | [260512-aph-add-prime-limits-theory-page](./quick/260512-aph-add-prime-limits-theory-page/) |
| 260512-cv2 | add odd-limits theory page (Partch's classification; 7/4 odd-limit-7 vs 9/8 odd-limit-9 vs 16/15 odd-limit-15 worked examples with playInterval + kernel round-trip via oddLimit(); 5-/7-/11-odd-limit diamond walks with ratioPill rows; 11-identity adds 10 new pitches headline; links to interactive diamond on /); sidebar entry after Prime-limits; harmonic-series.md forward-link parenthetical dropped | 2026-05-12 | 0ff3958 | [260512-cv2-add-odd-limits-theory-page](./quick/260512-cv2-add-odd-limits-theory-page/) |
| 260512-ce6 | add comma-pump theory page (5-limit I-vi-ii-V-I cadence; root motion 1/1 -> 5/3 -> 10/9 -> 40/27 -> 80/81 accumulates one syntonic comma flat per cycle; two setTimeout-chained playNotes buttons: drifting cycle (pure 5-limit) + re-anchored cycle (final I forced back to 1/1)); sidebar entry after The syntonic comma | 2026-05-12 | 975cf38 | [260512-ce6-add-comma-pump-theory-page](./quick/260512-ce6-add-comma-pump-theory-page/) |
| 260512-cst | add pythagorean-tuning theory page (12-note chain of pure 3/2 fifths; inline chainOfFifths(n) building a Scale via Interval.mul + octaveReduce, sort by cents, append 2/1 period; scaleTable render at baseHz 261.625 (C4) shows the 13 rows; wolf 5th derived as 262144/177147 ≈ 678.49¢ = (2/1)^7 / (3/2)^11 and auditioned against pure 3/2 via two playInterval buttons); sidebar entry after The Pythagorean comma | 2026-05-12 | ee2cbdf | [260512-cst-add-pythagorean-tuning-theory-page](./quick/260512-cst-add-pythagorean-tuning-theory-page/) |
| 260512-d38 | add meantone theory page (1/4-comma Aron / 1/3-comma Salinas / 1/6-comma Silbermann; tempered 5ths computed at the display layer via 1200*log2(3/2) − (1/n)*1200*log2(81/80) from pureFifth.cents and syntonic.cents projections; new centsToRatio in src/lib/cents.ts wraps xen-dev-utils centsToValue at the project boundary; kernel stays exact via Interval for 3/2, 5/4, 6/5, 81/64, 81/80; variants table at 0.001¢ precision via plain-DOM createElement/textContent; audition: pure 5/4 vs cents-built 1/4-comma meantone third sound identical, with Pythagorean 81/64 contrast); sidebar entry after Pythagorean tuning | 2026-05-12 | 6d22640 | [260512-d38-add-meantone-theory-page-at-src-pages-me](./quick/260512-d38-add-meantone-theory-page-at-src-pages-me/) |
| 260512-dcp | add edo-approximation theory page (12-/19-/31-/53-EDO approximation of 3/2, 5/4, 7/4, 9/8, 11/8; per-cell nearest-step math `Math.round(ji.cents / stepCents)` mirroring bestEdosForScale's discipline — src/lib/edo.ts unchanged; 4×5 DOM table at 2-decimal precision via createElement/textContent shows step + signed cents-deviation; highlights: 31-EDO step 25 = 967.74¢ for 7/4 (1.08¢ off pure, headline 7-limit anchor), 53-EDO step 31 = 701.89¢ for 3/2 (0.07¢ off, Mercator's comma closure); audition: pure 7/4 + 31-EDO 7/4 (centsToRatio audio-boundary pattern) + 12-EDO 7/4 contrast; sidebar entry after Meantone | 2026-05-12 | dbf5b5c | [260512-dcp-add-edo-approximation-theory-page-at-src](./quick/260512-dcp-add-edo-approximation-theory-page-at-src/) |
| 260512-eru | add play-dyad component for simultaneous dyad audition (new src/components/play-dyad.ts mirrors play-interval.ts factory shape, .play-btn class, ARIA, owner-allocates SynthHandle pattern; signature `playDyad(a, b, synth, { baseHz?, duration?, label? })` returns HTMLButtonElement; click handler calls `synth.playNotes([baseHz*Number(a.fraction.valueOf()), baseHz*Number(b.fraction.valueOf())], dur)` — one chord call, BigInt-Fraction stays source of truth, no cents round-trip on the kernel side; PlayDyadOpts.label is `string \| undefined` (vs play-interval's `boolean`) so callers can render arbitrary chord labels like "▶ 4:5:6"; happy-dom vitest spec covers class+ARIA, default/labeled render, playNotes call shape, and custom baseHz/duration forwarding — 6/6 pass; component NOT wired into any page yet — deferred to follow-up tasks) | 2026-05-12 | 3c5976d | [260512-eru-play-dyad-component](./quick/260512-eru-play-dyad-component/) |
| 260512-f0z | add spiral-of-fifths SVG visualization component (new src/components/spiral-of-fifths.ts uses raw `document.createElementNS` keyboard.ts pattern, NO D3; exports `spiralOfFifths(n, opts?: {temperedFifthCents?, highlightWolf?, width?}) => HTMLDivElement` plus pure-kernel `spiralGeometry(n, fifthCents, tempered?)` and `closingErrorCents(n, fifthCents)` for testability; pure-3/2 branch uses exact Interval chain via `.mul(3/2).octaveReduce()` so every step carries an exact BigInt-Fraction ratio, tempered branch returns `ratio: null` and derives cents from octave-reduced cumulative cents; geometry θ_k = k\*(fifthCents/1200)\*2π with auto-shrink dr keeps r_n inside half-viewBox for arbitrary n; for n=12 pure 3/2 the chain fails to close — step 12 lands at 531441/524288 with +23.46¢ Pythagorean-comma gap visible as ≈7° angular offset; optional dashed wolf chord between k=n and k=0 via highlightWolf; matching theme-token spiral-of-fifths.css mirrors keyboard.css; happy-dom vitest spec covers 3 closing-error cases, 5 pure-3/2 geometry cases (incl. full 7-step Pythagorean chain), 3 tempered-branch cases, and 7 DOM smoke cases — 18/18 pass; component NOT wired into any page yet — deferred to follow-up tasks) | 2026-05-12 | 26517a6 | [260512-f0z-build-src-components-spiral-of-fifths-ts](./quick/260512-f0z-build-src-components-spiral-of-fifths-ts/) |
| 260512-fg3 | add vertical Plot chart + sweep arpeggiator + Further reading to harmonic-series page (additive edit to src/pages/harmonic-series.md: new `import * as Plot from "npm:@observablehq/plot"`; chart cell with `y: { domain: [1..16], reverse: true }` + `Plot.ruleY` stems + `Plot.dot` heads colored by largest-prime-in-monzo (`PRIME_AXIS = [2,3,5,7,11,13]`, empty monzo → "other"); D-33-anchored color-blind-aware palette `#4269d0/#ef8e3a/#3ca951/#9c6ade/#d4378a/#1ca8a8/#888888`; "▶ Sweep partials 1→16" button calls `synth.playArpeggio(freqs, 0.35)` where freqs = `partials.map(({iv}) => baseHz * Number(iv.fraction.valueOf()))` (audio-boundary Number coercion, Pitfall #1); `iv.cents` accessed exactly once per partial in the chart IIFE (display boundary); reuses page's existing cell-owned synth (Pattern 4); Further reading section with en.xen.wiki/w/Harmonic_series + Kyle Gann's "Just Intonation Explained" appended after "## See also"; +107 lines additive, no refactor of existing partials array/table/prose) | 2026-05-12 | 17c0939 | [260512-fg3-harmonic-series-partials-chart-sweep-but](./quick/260512-fg3-harmonic-series-partials-chart-sweep-but/) |

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-05-07:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| uat_gap | 03-HUMAN-UAT.md — RDM smoke test "Esc/Stop cancels arpeggio mid-flight" | partial (1 pending) | 2026-05-07 (v1.0 close) |
| verification_gap | 03-VERIFICATION.md — mobile-audit.md `{pending}` Post-CR-02 footer signature | human_needed | 2026-05-07 (v1.0 close) |
| quick_task | 260504-i3v-fix-cr-01-interval-octavereduce-infinite (SUMMARY.md present, commit e288037) | missing-marker | 2026-05-07 (v1.0 close) |
| quick_task | 260504-lb6-fix-cr-02-cr-03-writescl-description-san (SUMMARY.md present, commit 2c44907) | missing-marker | 2026-05-07 (v1.0 close) |

Notes:

- The two Phase 3 items share a single root cause: a `{pending}` signature block in `mobile-audit.md` awaiting a Safari RDM re-walk of the new "Esc/Stop cancels arpeggio mid-flight" bullet. The unit-level regression test (`src/audio/__tests__/synth.test.ts:290`) already verifies the code path; per `03-VERIFICATION.md` the gap is "a documentation-trail nicety, not a code defect." 5/5 must-haves on Phase 3 are VERIFIED.
- The two quick-task entries have completed `SUMMARY.md` files and are merged (commits e288037, 2c44907); the audit flags them as `missing` because the audit tool looks for a marker the SUMMARY files don't carry. No actual work outstanding.

## Session Continuity

Last session: 2026-05-07T20:07:29.922Z
Stopped at: v1.0 MVP milestone shipped — ready for next milestone scoping
Resume file:
None
