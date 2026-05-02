# Feature Research

**Domain:** Just-intonation calculator + tuning-systems research notebook (Observable Framework site)
**Researched:** 2026-05-02
**Confidence:** HIGH (well-established domain with mature reference tools — Scale Workshop, xen-calc, x31eq, Scala — and a stable theoretical literature)

## Framing

This is **not** "build a competitor to Scale Workshop." It's a **personal research notebook** where prose theory and reactive computation share the page, anchored to a specific composition. That framing changes which features matter:

- Features that serve **a single composer reading their own notes** are weighted highest.
- Features that serve **anonymous public users** (sharing, presets, polish, account systems) are deprioritized.
- Features that exist purely to **explain ideas reactively in prose** (small embeddable widgets, math, citations) become first-class — not afterthoughts.
- Features the user explicitly chose against (engraved JI notation, MIDI Tuning Standard, hosted platform) are out.

Two reference shapes inform the design: **calculator tools** (Scale Workshop 3, xen-calc, x31eq) and **scientific-notebook tools** (Observable Framework, Quarto, Distill). The interesting design space is the overlap.

## Feature Landscape

### Table Stakes (Without These, the Tool Isn't Credible to a Microtonal Composer)

#### Ratio / Interval Primitives

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Arbitrary-precision rational arithmetic (BigInt-backed `Fraction`) | No prime-limit ceiling means floats won't do; `81/79` must round-trip exactly | M | Use `fraction.js` BigInt fork or roll own; backbone of everything else |
| Ratio ↔ cents conversion (with arbitrary precision) | Every JI tool does this; floats break for huge ratios | S | `1200 * log2(n/d)` with BigInt-aware log |
| Ratio ↔ monzo (prime-factor vector) | Standard representation for JI; required for lattice + temperament work | M | Needs prime factorization; cap practical input at ~100-prime; use `prime-factorization` lib |
| Cents-from-12tet display | User's explicitly stated v1 output | S | `cents - round(cents/100)*100`; sign-explicit (+/-) |
| Octave reduction (and arbitrary period reduction) | Required for almost any scale-building op | S | `while (r >= 2) r /= 2; while (r < 1) r *= 2` on Fractions |
| Interval multiplication / division (stacking) | Stacking generators, building chord-scales | S | Fraction.mul/div |
| Interval inversion (octave complement) | `4/3` ↔ `3/2`, fundamental operation | S | `2 / r` then octave-reduce |
| Prime-limit & odd-limit calculation | Standard categorization for JI ratios | S | max prime in monzo; max(odd part of n, odd part of d) |
| Tenney height & Benedetti height | Standard complexity metrics | S | `log2(n*d)` and `n*d` on reduced ratio |
| Comma identification (name lookup for famous commas) | Composers recognize syntonic, schisma, septimal, etc. by name | M | Static table of ~50-100 named commas indexed by monzo signature |

#### Scale Building

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Build scale from list of ratios (one per line) | Lowest-friction input; matches Scala `.scl` mental model | S | Parse `n/d`, cents, monzo notation in one cell |
| Sort + dedupe + octave-reduce a scale | Almost always needed after building | S | Pure transform on Fraction[] |
| Mode rotation (modes of a scale) | Standard scale operation; needed for chord construction | S | Cyclic rotation of step-sizes |
| Chord-scale generation (build scale from a chord's harmonic identities) | Composer workflow: pick a chord, derive the scale around it | M | Otonality/utonality from a generating chord |
| Generator/period scale construction (MOS) | Bedrock of regular-temperament scales; builds diatonic, mavila, porcupine, etc. | M | Iterate generator stacking, period-reduce, sort, detect 2-step-size property |
| JI subset that approximates an EDO | Composer wants "the JI ratios closest to 31edo's pitch classes" | M | For each EDO step, find best rational approx within prime-limit bound |
| Scale concatenation / cross-set | Combine scales (sum, difference, product) | S | Set ops on Fraction[] |
| Scale transposition | Re-base scale on different 1/1 | S | Multiply all by ratio |

#### I/O

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scala `.scl` export | The lingua franca; user's stated v1 output | S | ~30 lines of string formatting |
| Scala `.kbm` export | Pairs with `.scl` for keyboard mapping into DAWs/synths | S | ~50 lines; needs reference note + frequency UI |
| Scala `.scl` import | Round-trip with the de facto standard archive (4000+ scales) | S | Trivial parser; comments start with `!` |
| Copy-to-clipboard for cents / ratios / monzo | Fast moves between cell output and external notes | S | `navigator.clipboard.writeText` |
| Plain-text scale list (paste-in / paste-out) | Lowest-friction sharing | S | Same parser as scale-building |
| Downloadable export per page (research note → its scale) | Notebook-specific; each prose page should produce a `.scl` for the scale it discusses | S | Framework `FileAttachment` + blob download |

#### Audio

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Click-to-play single interval | Most basic audition; "is this what I think it is?" | S | Two oscillators, ADSR envelope, ~2 sec |
| Scale audition (arpeggio up/down) | Hear the scale linearly | S | Sequence note triggers with timer |
| Scale audition (held chord) | Hear scale as simultaneity | S | Stack oscillators at scale frequencies |
| Drone + interval over drone | Tune-by-ear workflow; interval against fixed root | S | Sustained low oscillator + clickable second pitch |
| Pluggable timbre (sine, triangle, saw, simple FM) | Sine is too sterile for evaluating consonance | S | Web Audio oscillator types + a couple FM presets |
| Master volume + safety-clamp | Don't blast headphones; standard | S | GainNode + max envelope |

#### Notebook Surface (Research-Notes Side-by-Side)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Markdown prose with embedded reactive JS cells | Core promise of Observable Framework; whole reason for tool choice | S | Built into Framework |
| Math typesetting (KaTeX or MathJax) | Tuning theory is half-equations; `\frac{81}{80}` everywhere | S | Framework supports KaTeX via `tex` tagged template |
| Cross-references between pages | Navigate "see lattice page" from "comma page" | S | Markdown links + Framework's nav sidebar |
| Code-cell visibility toggle | Sometimes show the math, sometimes hide it | S | Framework `echo`/code-folding |
| Per-page sidenav / TOC | Navigate long theory pages | S | Framework auto-TOC from headings |
| Static-site build, git-versioned source | User's stated constraint | S | Native to Framework |

### Differentiators (What Would Make THIS Notebook Better Than Scale Workshop / xen-calc / x31eq)

The competing tools are calculators with sidebars. They don't have **prose**. The differentiator is the **integration of theory writing and reactive computation**, anchored to a real composition. Features below maximize that distinction.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Composition-anchored "this piece" page** | Single dashboard page for the in-progress piece: scale, chord-set, audio, export, all live, all derived from one canonical definition | M | The piece's pitch material as a typed module imported across pages; one source of truth |
| **Reusable JS module of tuning primitives** (not glue code per cell) | Cells stay tiny and prose-readable because `Fraction`, `Monzo`, `Scale`, `cents()` etc. live in `src/lib/` | M | Composability is the multiplier; xen-calc/Scale Workshop hide their internals |
| **Inline reactive widgets in prose** (small embeddable cells: ratio displays, mini-keyboards, audio buttons) | Prose can say "the syntonic comma 81/80 [▶] sounds like this against 1/1" — the play button is inline, not in a sidebar | M | Custom Framework components; ~6-10 small reusable widgets |
| **Lattice with arbitrary basis selection** (pick which primes to project to 2D/3D, color by complexity) | Most lattice tools are fixed to 5-limit (3,5) or 7-limit (3,5,7); user wants arbitrary primes | M | SVG/Canvas with prime-axis dropdowns; D3 or Plot for layout |
| **Tonality diamond for arbitrary odd-limit** (not just Partch's 11) | Diamonds for 7, 9, 11, 13, 15, 21, 31, 81-limit on demand | S | Generative grid, no hardcoding |
| **Ratio-to-comma decomposition** ("what is `81/80` in terms of named commas?") | Reverse direction of comma identification; helps interpret unfamiliar ratios | M | Linear combination over a basis of known commas |
| **EDO ↔ JI mapping table** (for any EDO, show best JI approximations per step within configurable prime/odd limits) | Matches a composer-needs-this-now workflow; every microtonalist asks this | M | Sweep + sort by Tenney height; render as Plot table |
| **Temperament browser** (paste a comma list, get the regular temperament: mappings, error, complexity, generator) | x31eq does this server-side; doing it client-side in cells means it's *embeddable in prose* | L | Hardest piece of math; lean on existing JS lib if available, otherwise port a subset |
| **Scale-on-keyboard visualization** (where do the scale's pitches land on a 12-key piano? On an isomorphic keyboard?) | Mental bridge from JI ratios to muscle memory | M | SVG keyboard with cents-offset labels and color heatmap |
| **Per-page scale export button** | Each theory page can have its own downloadable `.scl` — the page IS the documentation for the scale | S | Generic component reading the page's local scale variable |
| **Plomp-Levelt dissonance curve plot** (against a configurable timbre) | Standard but rare; great teaching/research artifact; sits beautifully next to prose | M | Sethares-style algorithm; ~50 lines; Observable Plot for output |
| **Citations / bibliography support** | Quarto-style `[@partch1974]` rendered with a Refs page; user is doing research, not just calculating | M | Light: a `references.bib`-equivalent JSON + custom Markdown directive |
| **Persistent URLs for scales** (deep-link to a specific scale state) | Share the page that *describes* the scale, not just the scale | S | Encode scale to URL query string; component initializes from URL |
| **Comparison cell** (two scales side-by-side: cents, common subset, common-tone count, max deviation) | Composer workflow: "is this new scale better than the previous one for this passage?" | M | Pure data transform + Plot table |
| **History / version log per scale** (since pages are git-tracked, surface git history of a scale's source page) | Markdown + git already gives you this; just expose the git log per page | S | Optional Framework plugin or simple `git log` build-time inject |

### Anti-Features (Explicitly Do NOT Build)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Engraved JI staff notation (HEJI2 / Sagittal / Johnston)** | "It's a microtonal tool, shouldn't it engrave?" | Massive font/library/rendering commitment (Verovio + custom SMuFL fonts + accidental layout); each notation system is a research project of its own; user explicitly rejected for v1 | Ratio + cent-deviation display only; if engraving ever needed, do it in Lilypond outside the notebook |
| **MIDI input / hardware-controller surface** | "Let me play scales from my MIDI keyboard" | Web MIDI permissions, device enumeration, latency tuning, retuning per-note logic — full-time problem; Scale Workshop already does it well; not a research-notebook concern | Audition via click-to-play and arpeggio buttons; for MIDI use, export `.scl`/`.kbm` to a real synth |
| **MIDI Tuning Standard / SysEx output** | "Send tuning to my hardware synth" | Niche, requires Web MIDI + bytewise SysEx packaging + per-vendor quirks; out of scope per PROJECT.md | `.scl`/`.kbm` covers ~all software synths; user can use Scala-the-app for MTS if needed |
| **Full DAW / sequencer / multi-track playback** | "Let me write the whole piece in here" | The piece belongs in the user's actual DAW; this is for *designing the tuning material*, not arranging | Audition phrases via small ad-hoc sequences; commit musical decisions to the DAW |
| **Public-facing user accounts / saved-scale cloud** | "Other people should save and share" | This is a personal notebook; git is the storage layer; accounts mean a backend, auth, hosting commitment | Scales are git-versioned source files; sharing = sharing the URL of the page that defines the scale |
| **Real-time collaborative editing** | "Multiple people in one notebook" | Massive infra; Observable.com platform exists for this and was explicitly rejected | Git PRs are the collaboration model |
| **Generic "be Scale Workshop in Observable"** (1:1 feature parity) | "If we're rebuilding the calculator, do everything they do" | Wastes effort on features the user doesn't use; misses the prose-integration differentiator entirely; PROJECT.md explicitly disclaims being a competitor | Ship what the *piece* and the *research notes* need; skip the rest |
| **Imports beyond Scala** (`.tun`, `.mnlgtuns`, Pianoteq, etc.) | "More import formats = more compatibility" | Diminishing returns; Scala is universal; each format is parser maintenance | Scala only; if a one-off format is needed, write a one-off converter outside the notebook |
| **Notation-language DSL** (a la SonicWeave) | "We need a tuning DSL" | SonicWeave already exists and is excellent at this; competing means months of language design and tooling | If a DSL becomes necessary later, **embed SonicWeave** as a library — don't reinvent |
| **Fancy account-driven theme/preset system** | "Make it look polished" | Personal notebook needs to read well; doesn't need themes / presets / settings panes | Use Observable Framework's default theme; one CSS pass for typography |
| **Live audio effects chain (reverb, EQ, filters, etc.)** | "Make audition sound nicer" | Distracts from the *tuning* signal; muddies the consonance/dissonance impression that's the entire point | Dry oscillator + simple ADSR + optional gentle low-pass; nothing more |
| **Real-time animated lattice traversal during playback** | "Show the lattice light up as the scale plays!" | Eye candy; cost of writing it is high; no research value; user is the audience | Static lattice with click-to-highlight is enough |

## Feature Dependencies

```
Arbitrary-precision Fraction
  └──required by──> Ratio↔cents, Monzo, Octave-reduce, Interval ops
                        └──required by──> Scale building, Comma ID, Lattice
                                              └──required by──> Tonality diamond, MOS, EDO mapping
                                                                    └──required by──> Temperament browser
                                                                                          └──required by──> Comparison cell

Reusable JS module (src/lib/)
  └──required by──> Inline reactive widgets, Composition-anchored page
                        └──enhances──> Per-page scale export, Persistent URLs

Markdown + reactive cells (Framework baseline)
  └──required by──> Math typesetting, Cross-references, Citations
                        └──enhances──> Inline reactive widgets

Web Audio (oscillator + envelope)
  └──required by──> Click-to-play, Arpeggio, Drone
                        └──enhances──> Inline play widgets, Composition page

Scala .scl/.kbm export
  └──required by──> Per-page scale export button
                        └──enhances──> Composition-anchored page

EDO↔JI mapping
  └──conflicts──> Engraved JI notation (different mental model; we deliberately stay in ratio-land)

Temperament browser
  └──conflicts──> "ship a small notebook" goal — heavyweight, defer
```

### Dependency Notes

- **Fraction is the single root.** Get the rational-arithmetic primitive solid (BigInt-backed, exact `log2`-via-cents through a known-good algorithm) before anything else; everything downstream depends on it.
- **Reusable JS module before any "second" page.** It's tempting to write everything inline in cells. The differentiator (composition-anchored notebook) requires shared primitives. Build `src/lib/` early or you'll hate refactoring later.
- **Inline reactive widgets enhance prose, but require Framework component patterns.** Plan one widget (the play-interval button) as the first prototype; once that pattern works, the others fall out cheaply.
- **Temperament browser is a mountain.** It's the most "research-grade" feature on the list and the slowest to build. It's a great differentiator but a poor v1 commitment — defer to v1.x.
- **Engraved notation conflicts with the entire architecture.** Not just "don't build it" — the cents-deviation paradigm and the engraved-staff paradigm pull the data model in incompatible directions. Staying ratio-native keeps everything else simple.

## MVP Definition

The MVP is **the in-progress composition's page, end-to-end, with the primitives behind it general enough to support a second page.**

### Launch With (v1)

- [ ] Arbitrary-precision Fraction primitive (BigInt) — root of everything
- [ ] Monzo (prime-factor vector) representation + arithmetic
- [ ] Ratio ↔ cents ↔ monzo conversions
- [ ] Cents-from-12tet display (signed) — user's stated v1 output
- [ ] Octave reduction, interval mul/div/inversion, prime-limit, odd-limit
- [ ] Tenney height + Benedetti height
- [ ] Build scale from text input (ratios / cents / monzos), sort, dedupe, octave-reduce
- [ ] Mode rotation
- [ ] Scala `.scl` export — user's stated v1 output
- [ ] Scala `.kbm` export — pairs with `.scl`
- [ ] Scala `.scl` import (round-trip)
- [ ] Click-to-play interval, arpeggio scale audition, drone + interval (Web Audio) — user's stated v1 output
- [ ] Pluggable basic timbre (sine + saw + one FM preset)
- [ ] Markdown + reactive cells working (Observable Framework baseline)
- [ ] KaTeX math typesetting
- [ ] Reusable `src/lib/` module with the primitives above
- [ ] One inline play-interval widget pattern, used at least twice in prose
- [ ] **Composition page** — single page that fully covers the in-progress piece's tuning material (scale, audition, `.scl` export)
- [ ] At least one **other** theory page that uses the same primitives — proves generality
- [ ] Static-site build deployable to a self-hosted location

### Add After Validation (v1.x)

- [ ] Lattice visualization (2D, configurable basis)
- [ ] Tonality diamond (configurable odd-limit)
- [ ] Comma identification by monzo lookup (named-commas table)
- [ ] EDO ↔ JI mapping table
- [ ] MOS / generator-period scale construction
- [ ] Comparison cell (two scales side-by-side)
- [ ] Per-page scale export button as a generic component
- [ ] Persistent URLs for scales (URL-encoded state)
- [ ] Scale-on-keyboard visualization
- [ ] Citations / bibliography (lightweight)
- [ ] Plomp-Levelt dissonance curve

### Future Consideration (v2+)

- [ ] Temperament browser (regular-temperament: mappings, error, complexity from comma list)
- [ ] Ratio-to-comma decomposition (linear combination over comma basis)
- [ ] Periodicity blocks (Fokker)
- [ ] Harmonic entropy plot
- [ ] 3D lattice projection
- [ ] Embedding SonicWeave as an in-cell DSL (only if the simpler primitives prove insufficient)
- [ ] Git history per scale page (build-time injection)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Arbitrary-precision Fraction | HIGH | LOW | P1 |
| Ratio↔cents↔monzo | HIGH | LOW | P1 |
| Cents-from-12tet | HIGH | LOW | P1 |
| Octave reduction & interval ops | HIGH | LOW | P1 |
| Tenney/Benedetti height | MEDIUM | LOW | P1 |
| Build scale from text, mode rotate | HIGH | LOW | P1 |
| `.scl` / `.kbm` export | HIGH | LOW | P1 |
| `.scl` import | MEDIUM | LOW | P1 |
| Click-to-play / arpeggio / drone | HIGH | LOW | P1 |
| Markdown + reactive cells (Framework) | HIGH | LOW (built in) | P1 |
| KaTeX math | HIGH | LOW | P1 |
| Reusable `src/lib/` primitives module | HIGH | MEDIUM | P1 |
| Inline reactive widgets in prose | HIGH | MEDIUM | P1 |
| Composition page | HIGH | MEDIUM | P1 |
| Lattice visualization (configurable basis) | HIGH | MEDIUM | P2 |
| Tonality diamond | MEDIUM | LOW | P2 |
| Comma identification (lookup) | MEDIUM | LOW | P2 |
| EDO↔JI mapping table | HIGH | MEDIUM | P2 |
| MOS / generator-period scales | HIGH | MEDIUM | P2 |
| Comparison cell | MEDIUM | MEDIUM | P2 |
| Per-page scale export component | MEDIUM | LOW | P2 |
| Persistent URLs for scales | MEDIUM | LOW | P2 |
| Scale-on-keyboard | MEDIUM | MEDIUM | P2 |
| Citations / bibliography | MEDIUM | MEDIUM | P2 |
| Plomp-Levelt dissonance curve | MEDIUM | MEDIUM | P2 |
| Temperament browser | HIGH | HIGH | P3 |
| Ratio-to-comma decomposition | MEDIUM | MEDIUM | P3 |
| Periodicity blocks | LOW | HIGH | P3 |
| Harmonic entropy plot | LOW | MEDIUM | P3 |
| 3D lattice | LOW | MEDIUM | P3 |
| SonicWeave embedding | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1 launch (composition page end-to-end + reusable primitives)
- P2: Add once v1 is shipped and validated
- P3: Defer until clear research demand

## Competitor Feature Analysis

| Feature | Scale Workshop 3 | xen-calc | x31eq | Our Approach |
|---------|------------------|----------|-------|--------------|
| Ratio / cents / monzo arithmetic | Yes (SonicWeave DSL) | Yes (microtonal-utils lib) | Limited (calculator surface) | Yes — own typed `src/lib/` module, BigInt Fractions, Framework-cell-friendly API |
| Scale building (modes, MOS, EDO subsets) | Yes, extensive | Limited | EDO/temperament focused | Targeted: piece needs it, then generalize; SonicWeave-style DSL out of scope |
| Lattice / tonality diamond | Limited (visualizer recently added) | No | No | Yes — configurable prime basis, the differentiator |
| Comma identification | Partial | Yes (FJS notation) | Implicit via temperament | Lookup table v1.x; decomposition v2 |
| Temperament browser | Some (tempering ops) | Limited | **Yes — gold standard** | Defer to v2; don't compete |
| Audio playback | Yes (synth + MIDI + virtual keys) | Yes (basic) | No | Yes — in-prose widgets, no MIDI surface |
| `.scl` / `.kbm` export | Yes (+ many other formats) | No | Some | Yes — Scala-only; one format done well |
| Engraved JI staff notation | No | Partial (FJS text symbols) | No | **Explicitly no** — out of scope |
| Prose / research-notes integration | **No** (it's a calculator UI) | **No** | **No** | **Yes — this is the differentiator** |
| Math typesetting (KaTeX/MathJax) | No | No | No | Yes — first-class |
| Citations / bibliography | No | No | No | Yes (v1.x) — Quarto-inspired |
| Inline reactive widgets in prose | No (no prose) | No (no prose) | No | Yes — first-class, several reusable components |
| Self-hosted, git-versioned source | Open source repo, but app-shaped | Open source repo, but app-shaped | Server-rendered Python | Yes — Framework static site, every page is a Markdown file |
| MIDI input / output | Yes | No | No | **Explicitly no** — out of scope |

**Key insight:** the calculator tools (Scale Workshop, xen-calc) and the temperament-research tools (x31eq) are all *single-surface apps*. None of them treat the **theory writing** as a peer to the **computation**. Quarto and Distill nail the prose surface but have no tuning-aware widgets. Observable Framework is the only environment where the two genuinely meet, and no microtonal notebook of this shape currently exists. That's the differentiator.

## Sources

- [Scale Workshop (xenharmonic-devs)](https://github.com/xenharmonic-devs/scale-workshop) — current, maintained successor to SeanArchibald/scale-workshop; SonicWeave-based, multi-format export, MIDI + audio
- [Scale Workshop README (main)](https://github.com/xenharmonic-devs/scale-workshop/blob/main/README.md) — feature list verified
- [SonicWeave DSL](https://github.com/xenharmonic-devs/sonic-weave) — the DSL behind Scale Workshop 3
- [Scale Workshop 3 (live)](https://scaleworkshop.plainsound.org/?version=3.1.0)
- [Scale Workshop User Guide (legacy)](https://seanarchibald.github.io/scale-workshop/guide.htm) — older but features cleanly enumerated
- [xen-calc](https://github.com/m-yac/xen-calc) and [xen-calc About page](https://www.yacavone.net/xen-calc/about.html) — feature parity reference
- [microtonal-utils](https://github.com/m-yac/microtonal-utils) — JS library; BigInt-style precision pattern
- [x31eq Temperament Finder](https://x31eq.com/temper/) and [Regular Temperament Finder](https://x31eq.com/temper-pyscript/pregular.html)
- [Scala home page](https://www.huygens-fokker.org/scala/) and [.scl format spec](https://www.huygens-fokker.org/scala/scl_format.html)
- [Tonality diamond — Wikipedia](https://en.wikipedia.org/wiki/Tonality_diamond) and [Partch 43-tone lattice (Tonalsoft)](http://www.tonalsoft.com/monzo/partch/scale/partch43-lattice.aspx)
- [Tenney height — Xen Wiki](https://en.xen.wiki/w/Tenney_height) and [Benedetti height — Xen Wiki](https://en.xen.wiki/w/Benedetti_height)
- [Monzo — Tonalsoft Encyclopaedia](http://www.tonalsoft.com/enc/m/monzo.aspx)
- [MOS scale — Xen Wiki](https://en.xen.wiki/w/MOS_scale) and [Wilson MOS intro](https://www.anaphoria.com/wilsonintroMOS.html)
- [Fokker periodicity blocks — Wikipedia](https://en.wikipedia.org/wiki/Fokker_periodicity_blocks) and [Erlich gentle intro](http://www.tonalsoft.com/enc/f/fokker-gentle-1.aspx)
- [Comma (music) — Wikipedia](https://en.wikipedia.org/wiki/Comma_(music)) and [Syntonic comma — Wikipedia](https://en.wikipedia.org/wiki/Syntonic_comma)
- [Sethares — Relating Tuning and Timbre](https://sethares.engr.wisc.edu/consemi.html) — Plomp-Levelt implementation reference
- [Harmonic entropy — Tonalsoft](http://www.tonalsoft.com/enc/h/harmonic-entropy.aspx)
- [Observable Framework documentation (intro)](https://courses.cs.washington.edu/courses/csep590a/25wi/readings/framework/introduction.html)
- [Observable Framework — Simon Willison overview](https://simonwillison.net/2024/Mar/3/interesting-ideas-in-observable-framework/)
- [Quarto cross-references](https://quarto.org/docs/authoring/cross-references.html) — pattern reference for citations + xref
- [Tone.js](https://tonejs.github.io/) — possible audio library if Web Audio primitives prove too low-level
- [Useful Tools — Xenharmonic Wiki](https://en.xen.wiki/w/Useful_Tools) — landscape of microtonal software

---
*Feature research for: JI calculator + tuning-systems research notebook (Observable Framework)*
*Researched: 2026-05-02*
