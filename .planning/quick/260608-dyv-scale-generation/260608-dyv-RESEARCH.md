# Quick Task 260608-dyv: Scale generation feature — Research

**Researched:** 2026-06-08
**Domain:** Microtonal scale-generation algorithms + generator-UI design + additive shared-state integration in an Observable Framework JI notebook
**Confidence:** HIGH (kernel + dependency surface verified by reading installed source and runtime-testing SonicWeave; MEDIUM on a few research-grade methods flagged inline)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Surface — new dedicated tab.** Build `src/pages/generate.md` (nav label "Generate"), added to `observablehq.config.ts` between "Analysis" and "Theory notes". A method picker (dropdown/segmented) selects the generation family; params + live preview table + audition render below; "Send to Dashboard" / "Send to Analysis" actions push the result.
- **Methods — ALL FOUR families in scope.** (1) Regular/equal temperament — EDO, ED-any-interval, rank-2 temperaments, well-temperaments. (2) JI combinatorial — CPS (Hexany/Dekany/Eikosany), Euler-Fokker genera, tonality diamonds, odd/prime-limit lattices. (3) Harmonic & interval divisions — harmonic/subharmonic segments, arithmetic/equal divisions of an arbitrary interval, isoharmonic chords. (4) Advanced/algorithmic — Fokker periodicity blocks, Wilson recurrence/metallic-ratio, Stern-Brocot/Farey subsets, harmonic-entropy-guided.
- **Integration — live shared state.** A generated scale integrates with Dashboard + Analysis via live shared state, NOT just copy/paste. **HARD CONSTRAINT (user regression sensitivity): MUST be additive and MUST NOT destabilize the working Dashboard/Analysis pages.** Mirror the theme-prefs pattern — a small pure state module backed by `localStorage` under a namespaced key broadcasting a `CustomEvent`. Keep the existing `#s=` URL-hash protocol (`src/lib/url.ts`) as the transport/persistence backbone. Existing pages opt IN by listening for the event; their current seed/hash behavior must remain unchanged when the store is empty.

### Claude's Discretion
- Exact v1 method tranche / sequencing within the four families (plan decides, informed by research effort estimates).
- Component decomposition: one generic `generate.md` host + per-method Pattern-2 factory components vs. a single multi-method component.
- Whether each method gets its own kernel module under `src/lib/` (CPS, periodicity blocks, harmonic segments, etc.) — follow `mos.ts` / `diamond.ts` kernel-primitive precedent and three-layer purity discipline.
- Preview/audition affordances (reuse `scaleTable` + `playScale` per `mosBuilder`).

### Deferred Ideas (OUT OF SCOPE)
- This run produces RESEARCH.md + PLAN.md only. **No source edits this run.**
- Staff-engraved JI notation (HEJI2/Sagittal/Johnston) — out of scope per PROJECT.md.
- MIDI Tuning Standard / hardware-synth bridge (TEMP-10) — v2 parked, not this feature.
- Imports beyond Scala formats — out of scope.
</user_constraints>

## Summary

The Tuning Systems kernel already contains roughly **40% of the scale-generation primitives this feature needs** (`buildMos`/`nearestMosSize`, `jiSubsetOfEdo`, `bestJiInEdo`/`oddLimitApproximation`, `enumerateDiamond`, plus `Scale.rotate/reduce/dedupe/transpose` and `Interval` arithmetic). The remaining methods divide cleanly into two buckets: **(a) a handful of small, exact-rational kernel primitives** worth writing by hand following the `mos.ts`/`diamond.ts` precedent (EDO/ED-n, harmonic/subharmonic segments, ADO, isoharmonic, CPS, Euler genus — each S-effort, BigInt-exact); and **(b) the genuinely advanced methods** (rank-2 temperaments, well-temperaments, Fokker periodicity blocks, Wilson recurrence/metallic scales) where two viable paths exist.

The single most important finding: **`sonic-weave@0.14.1` is already a dependency, and its prelude is a complete scale-generation library.** I runtime-verified that `evaluateSource(src).currentScale` produces exact ratios for `cps`, `eulerGenus`, `afdo`, `tet`, `rank2`, `subharmonics`, `parallelotope`, `octaplex`, `wellTemperament`, `csgs`, `gs` — and that each result `Interval` exposes `.toFraction()` (rational methods) or `.totalCents()` (tempered methods), making the R-01 BigInt round-trip identical to the existing `jiSubsetOfEdo` pattern. SonicWeave's `rank2(3/2, 5, 1)` returns `9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1` — byte-for-byte the same as `buildMos`'s hand-traced Pythagorean diatonic. This means the advanced family (rank-2, well-temperament, parallelotope/Fokker blocks) can ship as **thin wrappers over SonicWeave builtins** instead of research-grade hand-rolled kernels, retiring the L-effort risk on the hardest methods.

For the UI, the dominant pattern across Scale Workshop, Leimma, Wilsonic, and x31eq is **method-picker → typed params → live preview + audition**, which is exactly the locked surface. Best-in-class affordances to adopt: a segmented method picker, ratio-`n/d`-pair inputs (already proven in `mosBuilder`), factor-set **chips** for CPS, and — given SonicWeave is free — **an optional "SonicWeave expression" power-user text input** that compiles any expression to a Scale via the same evaluation path, giving the user the entire xenharmonic-devs scale vocabulary for near-zero marginal cost.

**Primary recommendation:** Build `generate.md` as a method-picker host over per-method Pattern-2 factory components. Ship a v1 tranche of the S-effort exact-rational generators as hand-rolled kernel primitives (they're tiny and keep BigInt purity self-evident), wrap the hard temperament/lattice methods over SonicWeave, and add a SonicWeave free-text escape hatch. Integrate via a new pure `src/lib/scale-store.ts` (localStorage `tuning-systems:scale` + `CustomEvent`) that sits *beside* the unchanged `#s=` hash transport; existing pages opt in with a single additive event listener.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scale construction math (ratios → Scale) | Kernel (`src/lib/`) | — | Pure, testable without DOM; BigInt source of truth lives here (three-layer purity). |
| SonicWeave expression evaluation | Kernel adapter (`src/lib/sonicweave.ts`) | — | Wraps the `sonic-weave` dependency; returns `Scale`; no DOM/audio. |
| Method widgets (params + render) | Component (`src/components/`) | Kernel (by value) | Pattern-2 DOM factories; import kernel builders + `scaleTable`/`playScale`. |
| Synth ownership / AudioContext | Page (`generate.md`) | — | Pattern 4 / Pitfall #2 — page owns synth, `invalidation.then(dispose)`. |
| Shared "current scale" state | Kernel-adjacent pure module (`src/lib/scale-store.ts`) | Pages (opt-in listeners) | Mirrors `theme-prefs.ts` carve-out: constants + pure validate/read; writes happen at the page boundary. |
| Cross-page deep-link transport | Kernel (`src/lib/url.ts`, unchanged) | Pages | `#s=` hash stays the persistence/share backbone; reused verbatim for "Send to …". |

## Standard Stack

### Core (already installed — no new install required for the recommended path)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sonic-weave` | 0.14.1 (installed) `[VERIFIED: read installed dist + runtime test]` | Complete scale-generation prelude: `cps`, `eulerGenus`, `rank2`, `afdo`, `tet`, `subharmonics`/`toHarmonics`, `parallelotope`/`octaplex`, `wellTemperament`, `csgs`, `gs`. `evaluateSource(src).currentScale → Interval[]` with `.toFraction()`/`.totalCents()`. | Already a dependency; same authors as the rest of the stack; the modern lingua franca for programmatic scale construction. Retires L-effort risk on rank-2/well-temperament/Fokker. |
| `xen-dev-utils` | 0.13.1 (installed; 0.15.0 is latest on npm `[VERIFIED: npm view]`) | `kCombinations`/`combinations` (CPS), `approximateOddLimit`/`approximatePrimeLimit` (JI sets), `getConvergents`/`continuedFraction` (CF — already mirrored in `mos.ts`), and the full lattice toolkit `hnf`/`kernel`/`cokernel`/`solveDiophantine`/`defactoredHnf`/`lenstraLenstraLovasz`/`nearestPlane` (Fokker periodicity blocks). | Shared utility layer; the `basis.ts`/`hnf.ts` submodules are exactly the linear-algebra primitives a hand-rolled Fokker block needs (block size = `det` of the unison-vector matrix). |
| `fraction.js` | 5.3.4 (installed, exact pin, BigInt) | Source-of-truth rational currency for `Interval`. | R-01: the BigInt path. Every generated ratio round-trips through `${n}/${d}` into `Interval`. |

### Supporting (in scope only if the plan chooses the hand-roll path over the SonicWeave wrapper)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `moment-of-symmetry` | 0.10.0 `[ASSUMED]` (xenharmonic-devs github, ~180k weekly downloads, created 2022 — but slopcheck unavailable this session) | Standalone MOS + rank-2 helpers. | **NOT recommended.** D-11 already declined it (peer-dep risk vs `xen-dev-utils@0.13`, and the kernel already hand-rolls `buildMos`). SonicWeave's `mos`/`rank2` cover the same ground using an already-installed dep. Listed only for completeness. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SonicWeave wrappers for rank-2 / well-temperament / Fokker | Hand-rolled kernel primitives (`temper.ts`, `fokker.ts`) | Hand-roll keeps BigInt-purity self-evident and adds no eval surface, but rank-2 with optimal (POTE/TE) tunings and Fokker-block determinant math are L-effort and error-prone. SonicWeave already implements + tests them. Recommend: hand-roll the S-effort exact methods, wrap SonicWeave for the L-effort tempered/lattice ones. |
| `xen-dev-utils.kCombinations` for CPS | SonicWeave `cps(factors, count)` | Both work and both are exact. `kCombinations` keeps CPS as a transparent ~25-LOC kernel primitive (preferred for a flagship JI feature the user understands deeply); SonicWeave `cps` is one line if you'd rather not own it. |
| Upgrading `xen-dev-utils` to 0.15.0 | Stay on 0.13.1 | 0.15.0 is latest but the project pins 0.13.1 and `ji-lattice@0.3.2` peers `^0.12.2`. **Do NOT upgrade as part of this feature** — out of scope, regression risk. All needed APIs (`kCombinations`, `hnf`, `kernel`, approximation fns) exist in 0.13.1 already (verified by reading installed `dist/`). |

**Installation:** None required for the recommended path. Every dependency the plan needs is already installed (`sonic-weave@0.14.1`, `xen-dev-utils@0.13.1`, `fraction.js@5.3.4`). If the plan chooses to hand-roll everything and skip the SonicWeave wrappers, still no install — `xen-dev-utils` covers combinations + lattice algebra.

## Package Legitimacy Audit

> Recommended path installs **zero** new packages. The one candidate (`moment-of-symmetry`) is audited below and **not recommended**.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `moment-of-symmetry` | npm | created 2022-11 (~3.5 yrs) | ~180k/wk `[VERIFIED: npm view]` | github.com/xenharmonic-devs/moment-of-symmetry `[VERIFIED: npm view repository]` | unavailable | **Not installed** — D-11 already declined; SonicWeave covers it with an installed dep. Tagged `[ASSUMED]` because slopcheck could not run this session. |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time. The single audited package is legitimate by independent signals (xenharmonic-devs org, github-sourced, high downloads, 3.5-yr age) but is **not being installed**, so the planner needs no checkpoint. The recommended path adds no packages.*

---

# HALF A — The full menu of scale-generation methods

**Legend for "Exists?":** `KERNEL` = already in this repo's `src/lib/`. `SW` = one-line SonicWeave builtin (verified). `XDU` = xen-dev-utils primitive. `HAND` = small new kernel primitive to write. Effort: **S** ≤ ~40 LOC, **M** ~40–120 LOC, **L** > 120 LOC or research-grade.

## A-0. Master method table

| # | Method | Family | Exists? | Build target | Effort | Exact? |
|---|--------|--------|---------|--------------|--------|--------|
| 1 | EDO (equal divisions of octave) | Regular | partial: `bestJiInEdo` does JI-in-EDO; pure EDO step scale is trivial | `HAND` `edScale()` in `src/lib/equal.ts` **or** `SW tet(n)` | S | tempered (irrational steps — cents are source) |
| 2 | ED-any-interval (ED3 tritave, EDn) | Regular | no | `HAND` `edScale(divisions, equave)` **or** `SW tet(n, equave)` | S | tempered |
| 3 | Rank-2 temperament (gen+period, optimal tunings) | Regular | partial: `buildMos` does pure-ratio rank-2; no tempered generator / POTE | `SW rank2(...)` wrapper (+ optional `POTE`/`TE`/`CTE`) | **M (wrap) / L (hand)** | tempered |
| 4 | Well-temperament (per-fifth tempering) | Regular | no | `SW wellTemperament(commaFractions, comma, ...)` | M (wrap) / L (hand) | tempered |
| 5 | CPS — Hexany / Dekany / Pentadekany / Eikosany (n-choose-k) | JI comb. | no (but `enumerateDiamond` is adjacent) | `HAND cps(factors, k)` via `XDU.kCombinations` **or** `SW cps(factors, k)` | S | **exact** ✓ |
| 6 | Euler-Fokker genus | JI comb. | no | `SW eulerGenus(guide)` **or** `HAND` (divisors of a product) | S | **exact** ✓ |
| 7 | Tonality diamond (as a scale) | JI comb. | `enumerateDiamond` exists (viz); needs a "diamond → Scale" projection | `HAND diamondScale(oddLimit)` reusing `diamond.ts` | S | **exact** ✓ |
| 8 | Odd-limit / prime-limit JI set | JI comb. | partial: `oddLimitApproximation` (closest-to-cents) exists; full *set* enumeration does not | `HAND` enumerate-all-within-limit via `XDU.approximateOddLimit`/`approximatePrimeLimit` | S | **exact** ✓ |
| 9 | Stern-Brocot / Farey JI subset | JI comb. | no | `HAND fareyScale(order)` (Farey sequence in [1,2)) | S | **exact** ✓ |
| 10 | Harmonic / overtone segment (e.g. 8:9:…:16) | Harm. div. | no | `HAND harmonicSegment(lo, hi)` **or** `SW toHarmonics` | S | **exact** ✓ |
| 11 | Subharmonic / undertone segment | Harm. div. | no | `HAND subharmonicSegment(lo, hi)` **or** `SW subharmonics(start,end)` | S | **exact** ✓ |
| 12 | ADO / arithmetic (equal-arithmetic) division of an interval | Harm. div. | no | `HAND adoScale(divisions, equave)` **or** `SW afdo(divisions, equave)` | S | **exact** ✓ |
| 13 | Isoharmonic chord | Harm. div. | no | `HAND isoharmonic(start, diff, count)` | S | **exact** ✓ |
| 14 | Fokker periodicity block | Advanced | no | `SW parallelotope(basis)` / `octaplex(...)` **or** `HAND` via `XDU.hnf`/`kernel`/`det` | **M (wrap) / L (hand)** | **exact** ✓ (rational lattice) |
| 15 | Wilson recurrence / metallic-ratio (Mt. Meru) | Advanced | no | `HAND meruScale(...)` — recurrence → ratios | **M** | mixed (rational convergents OR irrational metallic limit) |
| 16 | Constant-structure generator sequence | Advanced | no | `SW csgs(generators, ordinal)` / `gs(...)` | M (wrap) | depends on generators |
| 17 | Harmonic-entropy-guided selection | Advanced | no — requires `harmonic-entropy` dep | **out of v1** (research-grade; needs new dep) | **L** | n/a |
| 18 | Tetrachordal construction (Chalmers) | Advanced | no | `HAND tetrachord(...)` (genus → 4-note division of 4/3) | **M** | exact or tempered per genus |

## A-1. Regular / equal temperament

**Definition.** Equal temperament divides a chosen *equave* (period) into N logarithmically equal steps; rank-2 temperaments stack a *generator* against a *period* (a 2-parameter family containing meantone, porcupine, etc.); well-temperaments perturb the chain of fifths by unequal comma fractions so every key is usable but each has its own colour.

**Algorithms.**
- **EDO / ED-n** (`#1`,`#2`): step *k* of an N-division of equave *E* has size `(k/N)·1200·log2(E)` cents; the ratio is `E^(k/N)` — **irrational**. Per Pitfall #1, store cents (the display projection) as the carrier and never round-trip through `Interval`'s BigInt fraction as if exact. The existing `Interval` happily holds an irrational-derived ratio via `new Interval(centsToRatio(c))` but that's a float — the kernel convention (see `meantone.md` note in INVENTORY) is to compute tempered pitches in cents and project to Hz for audio. **Build:** `HAND edScale(divisions, equave: Interval): Scale` — but note the output Scale will carry float-derived ratios; mark these scales "tempered" so consumers don't treat them as JI. Alternatively `SW tet(n, equave)` returns the same.
- **Rank-2** (`#3`): `buildMos` already stacks a *rational* generator over a *rational* period (exact). The new capability is **tempered** generators (e.g. a meantone fifth ≈ 696.6¢, not 3/2) and **optimal tunings** (POTE/TE/CTE). This is where SonicWeave earns its keep: `rank2(generator, up, down, period)` plus `POTE`/`TE`/`CTE` tuning riffs. Verified: `rank2(3/2, 5, 1)` ≡ `buildMos(3/2, 2/1, 7)` exactly. For tempered generators the result `Interval`s return cents via `.totalCents()`.
- **Well-temperament** (`#4`): `wellTemperament(commaFractions, comma=81/80, down, generator=3/2, period)` cumulatively bends the fifth by per-step comma fractions. Verified to return tempered (cents) intervals.

**Builds on:** `mos.ts` (`buildMos`/`nearestMosSize`), `edo.ts` (error metrics, `bestJiInEdo`), `Interval.octaveReduce`.

**BigInt-exactness.** EDO/ED-n, tempered rank-2, and well-temperaments are **irrational** — cents is the source of truth; project to Hz at the audio boundary exactly as `meantone.md` already does (`centsToRatio` in `monzo.ts`/INVENTORY note). The *rational* rank-2 case (`buildMos`) stays exact. **Do not** let a tempered scale masquerade as JI in the ratio column — flag it.

**Effort.** EDO/ED-n: **S** (hand) or one SW line. Rank-2 tempered + optimal: **M** as a SonicWeave wrapper, **L** if hand-rolled (POTE solving is linear algebra). Well-temperament: **M** wrap / **L** hand.

**References.** Graham Breed, x31eq temperament finder (regular temperament theory, optimal tunings) `[CITED: x31eq.com]`. Xenharmonic Wiki, "Regular temperament" and "Well temperament" `[CITED: en.xen.wiki]`.

## A-2. JI combinatorial

**Definition.** Build scales from the combinatorics of a small *factor set*. A **Combination Product Set** (CPS) multiplies the factors *k* at a time (n-choose-k) and octave-reduces: 2-of-4 = **Hexany** (6 notes), 2-of-5 = **Dekany**, 3-of-6 = **Eikosany** (20 notes). **Euler-Fokker genus** takes all divisors of a product of small primes (with multiplicity) and octave-reduces. The **tonality diamond** is the cross-product `odd_i / odd_j`. Odd/prime-limit sets enumerate every reduced ratio under a complexity ceiling.

**Algorithms.**
- **CPS** (`#5`): `kCombinations([f1..fn], k)` → for each subset multiply its members → octave-reduce → dedupe → sort. `XDU.kCombinations` is exact (operates on the factor integers). Verified: `SW cps([1,3,5,7], 2)` → `7/6, 5/4, 35/24, 5/3, 7/4, 2/1` (the classic 1-3-5-7 Hexany). **Build:** `HAND cps(factors: Interval[], k): Scale` ≈ 25 LOC over `XDU.kCombinations`, or one SW line. Recommend hand-roll — CPS is a flagship JI structure the user wants to own transparently.
- **Euler-Fokker genus** (`#6`): `SW eulerGenus(45)` → `9/8, 5/4, 45/32, 3/2, 15/8, 2/1` (divisors of 45 = 3²·5, octave-reduced). Hand version: factor the guide tone, enumerate the divisor lattice. **S.**
- **Diamond → Scale** (`#7`): `enumerateDiamond(oddLimit, scale)` already produces the cells; add a thin `diamondScale(oddLimit): Scale` that takes the unique octave-reduced ratios (ignore the `inScale` flag, no scale arg needed) and wraps them. Reuses `diamond.ts` verbatim. **S.**
- **Odd/prime-limit set** (`#8`): enumerate all reduced `i/j` with `oddLimit(i/j) ≤ L` (odd) or `primeLimit ≤ L` (prime). `oddLimitApproximation` is closest-to-cents (single answer); the *set* version drops the cents target and keeps all. `XDU.approximateOddLimit(cents, limit)` returns all odd-limit fractions within 600¢ sorted by closeness — usable, or enumerate directly. **S.**
- **Farey / Stern-Brocot** (`#9`): Farey sequence of order *n* in [1,2) → all `a/b` with `b ≤ n`, reduced. Pure integer enumeration, exact. **S.**

**Builds on:** `diamond.ts` (`enumerateDiamond`, `DiamondCell`), `edo.ts` (`oddLimitApproximation`), `Interval.octaveReduce`, `Scale.dedupe/reduce`.

**BigInt-exactness.** **All of A-2 is exact rational** — CPS, genus, diamond, odd/prime sets, Farey are pure integer/fraction math. This is the family that most rewards hand-rolling: it stays visibly BigInt-pure and there's no float anywhere.

**Effort.** All **S**. CPS and diamond-scale are the highest-value, lowest-cost wins.

**References.** Erv Wilson CPS archive (Hexany/Eikosany, "uncentered" structures) `[CITED: anaphoria.com/wilsoncps.html]`. Tonalsoft encyclopedia, "combination product set" / "hexany" `[CITED: tonalsoft.com]`. Partch, *Genesis of a Music* (tonality diamond). Microtonal wiki, "Hexany" `[CITED: en.xen.wiki]`.

## A-3. Harmonic & interval divisions

**Definition.** Scales drawn directly from the harmonic series or by equal *arithmetic* (not logarithmic) division of an interval. A **harmonic/overtone segment** lists consecutive harmonics over a fundamental (8:9:10:…:16 = a "mode of the harmonic series"). **Subharmonic** segments mirror it (1/8:1/9:… or the reciprocal). **ADO** ("arithmetic division of the octave", a.k.a. AFDO — arithmetic frequency divisions) divides the *frequency* ratio of an equave into equal additive steps, giving an over-tone-like scale. **Isoharmonic** chords have constant *frequency difference* between members.

**Algorithms.**
- **Harmonic segment** (`#10`): for harmonics `lo..hi`, ratio of harmonic *h* is `h/lo`, octave-reduce if desired (or leave unreduced for a literal overtone scale). Exact. **S.**
- **Subharmonic segment** (`#11`): `SW subharmonics(start, end)` — reciprocal of the harmonic segment, `lo/h`. Exact. **S.**
- **ADO / AFDO** (`#12`): divide equave `E` (as frequency ratio `p/q`) into N equal *additive* steps: step *k* = `q + k·(p−q)/N` over `q` → for octave `E=2/1`, ADO-N gives `(N+k)/N` → `SW afdo(6)` → `7/6, 4/3, 3/2, 5/3, 11/6, 2/1`. **Exact rational** when N divides evenly. **S.**
- **Isoharmonic** (`#13`): `start, start+diff, start+2·diff, …` as integer-frequency ratios over the lowest member. Exact. **S.**

**Builds on:** `Interval` construction + `Scale`. Nothing exists yet for this family — all new, all tiny.

**BigInt-exactness.** **All exact rational** — these are the purest JI of any family (literal integer harmonics). Keep numerators/denominators as integers throughout; this is BigInt-trivial.

**Effort.** All **S**. A single `src/lib/harmonic.ts` could host `harmonicSegment`, `subharmonicSegment`, `adoScale`, `isoharmonic` together (~80 LOC total).

**References.** Xenharmonic Wiki, "Harmonic scale", "Arithmetic division of the octave (ADO)", "Otonality and Utonality" `[CITED: en.xen.wiki]`. Partch (Otonality/Utonality).

## A-4. Advanced / algorithmic

**Definition.** Methods with real mathematical depth. **Fokker periodicity blocks**: choose a JI lattice basis and a set of *unison vectors* (commas to vanish); the block is the fundamental domain of the sublattice they define — its size equals `|det|` of the unison-vector matrix. **Wilson recurrence / metallic-ratio (Mt. Meru)**: build scales from linear recurrence sequences (Fibonacci → φ; Pell → silver ratio; etc.); successive ratios converge to a metallic generator. **Constant-structure** scales (`csgs`): generator sequences filtered so every interval class has a unique size. **Harmonic-entropy-guided**: rank candidate intervals by harmonic entropy (concordance) and select.

**Algorithms.**
- **Fokker block** (`#14`): given basis intervals (e.g. `[3/1, 5/1]`) and per-axis extents, `SW parallelotope(basis, ups, downs)` spans the block combinatorially; `octaplex(b0..b3)` is the 4D 20-cell. The hand path uses `XDU.hnf` / `kernel` / `cokernel` / `solveDiophantine` / `defactoredHnf` (all in `xen-dev-utils/dist/basis.js` + `hnf.js`, verified present): build the unison-vector matrix, `det` gives block size, solve for representative pitches. **Exact** (rational lattice). **M** as a SW `parallelotope` wrapper; **L** hand-rolled (the comma-kernel/HNF math is genuinely involved).
- **Wilson Mt. Meru / metallic** (`#15`): pick a recurrence `x_n = a·x_{n-1} + b·x_{n-2}`; the scale uses ratios of successive terms (rational convergents) or the limiting metallic ratio (irrational). Fibonacci → φ ≈ 833.09¢ generator. **M** hand-rolled (the recurrence is trivial; the design choice is which terms become scale degrees). Convergent-ratios are exact; the metallic limit is irrational (cents-source).
- **Constant structure** (`#16`): `SW csgs(generators, ordinal)` / `gs(generators, size)`. **M** wrap.
- **Harmonic-entropy** (`#17`): requires the `harmonic-entropy` npm package (a *new* dependency, parked as TEMP-05). **Out of v1** — research-grade, and the user already parked HE to v2. Flag explicitly.
- **Tetrachordal (Chalmers)** (`#18`): divide the 4/3 fourth into 3 intervals (the tetrachord genus), then tile two tetrachords + a disjunctive tone to fill the octave. Exact for rational genera, tempered for tempered ones. **M** hand-rolled — the data is mostly Chalmers' genus tables.

**Builds on:** `xen-dev-utils` `basis.ts`/`hnf.ts` (Fokker), `Interval`/`Scale`. Note PROJECT.md parks **TEMP-08 (periodicity blocks/Fokker)** and **TEMP-07 (SonicWeave DSL)** as v2 candidates — this feature can deliver early, cheaply, via the SonicWeave wrappers.

**BigInt-exactness.** Fokker blocks and rational Wilson convergents are **exact**. Metallic *limits* and harmonic-entropy scoring are **irrational/float** — cents-source, never JI-laundered. Tetrachords are exact or tempered per genus.

**Effort.** Fokker: **M** (wrap) / **L** (hand). Wilson: **M**. CSGS: **M** (wrap). HE: **L** + new dep → **out of v1**. Tetrachord: **M**.

**References.** Wikipedia + Huygens-Fokker, "Fokker periodicity block" / "Unison Vectors and Periodicity Blocks" (Fokker) `[CITED: huygens-fokker.org/docs/fokkerpb.html]`; Paul Erlich, "A gentle introduction to Fokker periodicity blocks" `[CITED: tonalsoft.com]`. Erv Wilson, "Mt. Meru" / recurrence sequences `[CITED: anaphoria.com]`. John Chalmers, *Divisions of the Tetrachord* (1993) `[CITED]`.

## A-5. Methods the four buckets missed (worth flagging)

- **Modes of an existing scale** — already free via `Scale.rotate(n)`; a "rotate to mode N" control on the preview is a near-zero-cost addition that turns any generated scale into N scales.
- **Scale transforms** — `Scale.transpose`, `reduce`, `dedupe` already exist; surfacing a "reduce / dedupe / transpose by ratio" post-processing strip on the preview is cheap polish that applies to *every* generator's output.
- **Concrete imports of named scales** — SonicWeave can also parse named-scale expressions and the existing `parseScala` handles `.scl` paste; not a "generator" per se but a cheap "load a famous scale" affordance.

---

# HALF B — Interfaces

## B-1. Survey of best-in-class generation UIs

| Tool | Generation surface | Killer interaction | Lesson for this notebook |
|------|--------------------|--------------------|--------------------------|
| **Scale Workshop 3** (xenharmonic-devs) `[CITED: scaleworkshop.lumipakkanen.com]` | A single **SonicWeave editor** drives the whole scale; "New scale" menu offers templated generators (equal temperament, harmonics, subharmonics, rank-2, CPS, Euler genus, MOS) that *insert SonicWeave code*; live pitch table + piano + audio update reactively. | The generator menu is **a code-template inserter**, not a bespoke form per method — every generator is a SonicWeave one-liner the user can then edit by hand. | This is the direct lineage and it validates the locked surface AND the "expose SonicWeave" recommendation: forms for common cases, a code escape hatch for everything. |
| **Leimma / Apotome** (Khyam Allami / Counterpoint) `[CITED: isartsi.org/Leimma]` | A **circular pitch wheel**: the octave is a ring; the user places/drags pitch points, optionally snapping to a harmonic grid; audition is immediate. | **Visual, circular, direct-manipulation** scale design — you *see* the octave as a circle and sculpt it. | A circle-of-pitches preview viz (a ring with the generated degrees marked, cents around the rim) is the single most compelling *preview* affordance to add — far more legible than a table for "shape at a glance." |
| **Wilsonic** (Marcus Hobbs) + Scale Workshop's Wilson modes `[CITED: wilsonic / en.xen.wiki]` | Dedicated builders for CPS (Hexany→Eikosany), Euler genera, Moments of Symmetry, recurrence (Mt. Meru) scales — each with **factor-set / seed inputs** and immediate audition. | **Factor-set inputs as first-class chips** for CPS/genus; preset structure pickers (Hexany / Dekany / Eikosany) that pre-fill *k*. | Use chips for the CPS factor set and a preset selector that sets (n,k); this is the idiomatic CPS UI. |
| **x31eq** (Graham Breed) `[CITED: x31eq.com]` | A **temperament finder**: enter a prime limit + error/complexity bounds → ranked list of temperaments → click one to see its optimal tuning, MOS sizes, mapping. | **Search-then-pick**: you don't specify the generator, you *discover* it from constraints. | A "temperament finder" mode is L-effort and out of v1, but the *ranked-results → click to instantiate* pattern is worth remembering for v2. The existing `bestEdosForScale` table already has this flavor. |
| **Sevish Scale Generator / other web tools** `[CITED: sevish.com]` | Lightweight single-purpose generators (e.g. equal-step, random) with instant `.scl` export. | **One screen, instant export.** | Validates "Send to … / export" as a required terminal action, which the existing `#s=` + `.scl` plumbing already provides. |
| **Scala (the app)** (Manuel Op de Coul) `[CITED: huygens-fokker.org/scala]` | The canonical kitchen-sink: hundreds of CLI commands (`cps`, `euler`, `equaltemp`, `harmonics`, `farey`, `block`/periodicity, recurrence…) each producing a `.scl`. | **Exhaustive command vocabulary** — every method in Half A has a Scala command. | The method *menu* this feature should aspire to == Scala's command list, but exposed as a friendly picker. SonicWeave's prelude is essentially a modern re-implementation of that vocabulary. |

## B-2. Synthesized UI recommendation (the locked surface, made concrete)

**Layout (`src/pages/generate.md`):**

```
┌─ Generate ────────────────────────────────────────────────┐
│  [ Method ▾ ]  ← segmented or <select> grouped by family   │
│     Regular  · JI combinatorial · Harmonic · Advanced · SW │
│                                                            │
│  ┌─ Params (method-specific) ─────────────────────────┐    │
│  │  (ratio n/d pairs · chips · sliders · selects)     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌─ Preview ──────────────────────────────────────────┐    │
│  │  circle-of-pitches viz   +   scaleTable            │    │
│  │  [⏵⏵ Play scale]  [rotate to mode ▾]               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  [ Send to Dashboard → ]   [ Send to Analysis → ]          │
└────────────────────────────────────────────────────────────┘
```

**Method picker.** A grouped `<select>` (or segmented control) with the four families as `<optgroup>`s plus a fifth "SonicWeave expression" option. Selecting a method swaps the params panel and re-renders the preview. One host page; **one Pattern-2 factory component per method** (mirrors `mosBuilder` exactly), chosen by the picker. This keeps each generator small, independently testable, and consistent with the existing component model.

**Param-input idioms (per method):**

| Param shape | Use for | Precedent |
|-------------|---------|-----------|
| Ratio `n/d` pair (two number inputs + `/`) | generator, period, equave, transpose-by | `mosBuilder.makeRatioField` — reuse verbatim |
| Integer slider/number | EDO divisions, ADO divisions, harmonic lo/hi, CPS *k*, odd-limit, Farey order | `Inputs.number` / `mosBuilder` size input |
| **Factor-set chips** | CPS factors, Euler genus prime/multiplicity, Fokker basis | new small chip-input component (add/remove integer chips) |
| Select / preset | CPS preset (Hexany/Dekany/Eikosany sets *k*), tuning (POTE/TE/CTE/pure), genus | `Inputs.select` |
| Generator-by-cents **or** by-ratio toggle | tempered rank-2 / well-temperament | new; ratio path stays exact, cents path is tempered (flag it) |
| Free-text SonicWeave expression | the power-user escape hatch | new `<textarea>` → `evaluateSource` |

**Preview / audition.** Reuse `scaleTable(scale, baseHz, {precision})` and `playScale(scale, synth, {baseHz})` exactly as `mosBuilder` does (D-14 fungibility — any `Scale` renders identically). **Add a circle-of-pitches viz** (the Leimma lesson): an SVG ring with each degree marked at its cents angle, labels around the rim — this is the highest-value new viz and is ~60 LOC of plain SVG (no new dep; the `keyboard.ts` component is the precedent for plain `createElementNS`). The existing `lattice` and `tonalityDiamond` components can also be offered for JI-family results since they already take `(scale, synth, opts)`. A "rotate to mode N" select wires straight to `Scale.rotate`.

**Terminal actions.** "Send to Dashboard →" / "Send to Analysis →" serialize the scale to text and (a) write the shared store (Half C) and (b) optionally deep-link via `#s=` exactly like the dashboard's existing "Analyze this scale →" button. No new transport needed — `encodeScaleToHash` + the store cover it.

## B-3. Should SonicWeave be exposed as a power-user text input? — **YES, strongly.**

**Cost:** ~1 small kernel adapter (`src/lib/sonicweave.ts`, ~30 LOC) wrapping `evaluateSource(src, true).currentScale`, mapping each `Interval` to our `Interval` via `.toFraction()` (rational → `${n}/${d}` BigInt round-trip, R-01) or `.totalCents()` (tempered → cents-source), wrapping in a `Scale`. Plus a `<textarea>` + "Evaluate" button (Pattern-2 component) and a status region for SonicWeave errors. **Verified working** this session.

**Benefit:** The entire xenharmonic-devs scale vocabulary (`cps`, `eulerGenus`, `rank2`, `afdo`, `tet`, `subharmonics`, `parallelotope`, `octaplex`, `wellTemperament`, `csgs`, `gs`, MOS, and arbitrary arithmetic) becomes available *immediately* — every Half-A method gets a fallback even before its dedicated form exists. It also satisfies the parked **TEMP-07 (SonicWeave embedded DSL)** at near-zero cost and gives the user an editable "what code made this scale" view (the Scale Workshop pattern).

**Integration cautions (for the planner):**
1. **R-01 discipline at the boundary.** SonicWeave's `Interval.toFraction()` returns a `fraction.js`/`xen-dev-utils` `Fraction` that is *not* our pinned BigInt one — round-trip through the `${n}/${d}` string into our `Interval` exactly as `jiSubsetOfEdo` does. Never pass SonicWeave's Fraction object straight into our kernel.
2. **Tempered results carry cents, not exact ratios.** `wellTemperament`/tempered `rank2` return intervals where `.toFraction()` throws or is meaningless; detect via `iv.value` real-vs-rational (or try/catch `.toFraction()` and fall back to `.totalCents()` → `centsToRatio` for Hz). Mark these scales "tempered" so the ratio column doesn't lie.
3. **Eval is sandboxed but bounded.** `evaluateSource` is a pure interpreter (no `eval`/`Function` of host JS — it parses its own DSL), but still cap input length and wrap in try/catch returning a status message (mirror the `parseScala` 1 MB cap discipline). It does not touch `window`/DOM.
4. **Prelude start-up cost.** `evaluateSource(src, /*includePrelude=*/true)` loads the full stdlib each call; for a notebook this is fine (sub-100ms), but evaluate on an explicit button press / debounce, not on every keystroke.

---

# HALF C — Integration mechanism (additive live shared state)

## C-1. The design

Mirror `theme-prefs.ts` precisely. Add **one new pure module**, change **zero existing kernel files**, and have each existing page opt in with **one additive event listener**.

**New file: `src/lib/scale-store.ts`** (pure — constants + validate/read; no DOM, no top-level side effects; the carve-out twin of `theme-prefs.ts`):

```ts
export const SCALE_STORAGE_KEY = "tuning-systems:scale";          // namespaced
export const SCALE_CHANGED_EVENT = "tuning-systems:scale-changed"; // CustomEvent name

export interface SharedScale { text: string; source?: string; } // scale TEXT is the currency

export function readSharedScale(): SharedScale | null { /* try/catch localStorage, validate shape, cap length (reuse MAX_SCALE_TEXT_BYTES = 8 KB), return null on any failure */ }
export function writeSharedScale(text: string, source?: string): void { /* try/catch setItem; then window.dispatchEvent(new CustomEvent(SCALE_CHANGED_EVENT, { detail: { text, source } })) */ }
```

**Currency = scale TEXT** (not a `Scale` object), so it is identical to what the textareas already hold and what `#s=` already encodes. The store and the hash speak the same language; "Send to …" writes the store, and any open page updates live.

**Why a store *and* the hash (not just the hash):** the `#s=` hash is per-URL and only refreshes a page on navigation/boot. "Live shared state" means *an already-open* Dashboard tab updates when Generate pushes a scale. `localStorage` + `CustomEvent` is the in-session broadcast bus; the hash remains the deep-link/share/persist transport. They compose: writing the store can *also* update the hash for shareability, but the store is what makes open pages react.

## C-2. How existing pages opt in (additively)

Today (verified in `analysis.md`, lines 55–94 and 130–148; the dashboard `index.md` has the same shape):
1. **Boot:** read `window.location.hash` `#s=` → `decodeHashToScale` → `initialScaleText = decoded ?? seedText`.
2. **Textarea:** `view(Inputs.textarea({ value: initialScaleText }))`.
3. **Write:** debounced 300 ms `history.replaceState(null,"","#s="+encodeScaleToHash(scaleText))`.

**The additive opt-in — one new cell per page, nothing existing touched:**

```ts
// NEW cell — does not alter boot, textarea, or hash-write logic.
{
  const onScale = (e) => {
    const t = e?.detail?.text;
    if (typeof t === "string" && t.length) {
      // push into the SAME textarea the page already owns; its existing
      // debounced hash-write picks the change up unchanged.
      textareaEl.value = t;
      textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  window.addEventListener("tuning-systems:scale-changed", onScale);
  invalidation.then(() => window.removeEventListener("tuning-systems:scale-changed", onScale));
}
```

The listener writes into the *existing* textarea via a synthetic `input` event, so the page's current parse + render + debounced-hash-write all fire through their existing code path. No boot logic, no seed logic, no hash-write logic changes.

## C-3. Precedence at boot (the critical correctness rule)

Order of precedence when a page boots, **chosen so existing behavior is byte-identical when the store is empty:**

1. **`#s=` hash present** → wins (explicit deep-link / share intent). Unchanged from today.
2. **else store non-empty** → seed the textarea from `readSharedScale()` (NEW — but only fires when there's no hash *and* the user has pushed a scale this session).
3. **else seed constant** → unchanged from today.

So the boot read becomes `initialScaleText = hashDecoded ?? readSharedScale()?.text ?? seedText` — a **single additive `??` clause** inserted into the existing expression. When the store is empty (the default, first-ever load, and every load before any "Send to …"), `readSharedScale()` returns `null` and boot is **exactly** today's `hashDecoded ?? seedText`. This is the key to the "must not destabilize" constraint: the new term is inert until the user opts in by generating + sending.

**Live updates (post-boot)** are independent of boot precedence — the `CustomEvent` listener always reflects the latest push regardless of how the page booted. That's the "live" half.

## C-4. Risks to existing behavior and how to neutralize each

| # | Risk | Trigger | Neutralization |
|---|------|---------|----------------|
| R1 | **Boot regression** — store seeds a page that should have shown the seed/hash scale. | Store non-empty on an unrelated load. | Precedence rule (C-3): hash beats store; store only consulted when hash absent. Store empty by default → boot is byte-identical. Add a test asserting empty-store boot == current boot. |
| R2 | **Infinite event loop** — page A's listener updates its textarea → its hash-write fires → (if it also wrote the store) re-broadcasts → page B updates → … | Listener writing back to the store. | The listener **only writes the textarea**, never the store. *Only* explicit "Send to …" buttons write the store. One-way: producer (Generate) writes; consumers (Dashboard/Analysis) read + listen. No write-back. |
| R3 | **Synthetic-input feedback** — dispatching `input` retriggers the page's own handlers unexpectedly. | The synthetic `Event("input")`. | This is exactly what a real keystroke does; the page already debounces hash-writes (300 ms) and re-parses idempotently. Set `value` *before* dispatching so the handler reads the new text. No new code path. |
| R4 | **localStorage throws** (private browsing / disabled storage). | `getItem`/`setItem` in locked-down contexts. | `readSharedScale`/`writeSharedScale` wrap in try/catch and return `null` / no-op — same defense `readThemePrefs` already uses (T-9mn-03). Feature silently degrades to copy/paste + hash. |
| R5 | **Oversized / malformed stored text** reaches a parser. | Tampered localStorage value. | `readSharedScale` caps length at `MAX_SCALE_TEXT_BYTES` (8 KB, reuse `url.ts` constant) and validates shape; pages already wrap `parseScala` in try/catch with a status region. Malformed → null → seed fallback. |
| R6 | **Stale store across sessions** — yesterday's pushed scale overrides today's intended seed. | `localStorage` persists across reloads. | By precedence, a fresh load with no `#s=` *will* prefer the stored scale (intended "remember my last scale" behavior). If the user wants this scoped to a session, use `sessionStorage` instead — **a planner decision**; flag it. The hash always still wins, so sharing is unaffected either way. (Open question OQ-1.) |
| R7 | **Cross-tab vs same-tab events.** `CustomEvent` via `dispatchEvent` only reaches the *same* document; the native `storage` event reaches *other* tabs. | Two tabs open. | For same-page-app live update, same-document `CustomEvent` is correct and matches the theme-prefs precedent. Optionally also listen for the native `storage` event for true cross-tab sync — **additive, optional**; not required by the locked decision. (Open question OQ-2.) |

**Net:** the integration is strictly additive — one new pure module, one new cell per existing page, one `??` clause in each boot expression. When the store is empty (always, until the user generates and sends), every existing page behaves byte-for-byte as it does today. This directly satisfies the user's regression sensitivity.

---

## Recommended v1 method tranche + sequencing

**Tranche 1 — exact-rational quick wins (all S, all hand-rolled, BigInt-pure).** Ship these first; they're tiny, testable, and showcase the JI core the user cares about most:
- CPS (`cps` over `XDU.kCombinations`) with Hexany/Dekany/Eikosany presets — flagship.
- Harmonic + subharmonic segments, ADO, isoharmonic (`src/lib/harmonic.ts`).
- Diamond → Scale (reuse `diamond.ts`), odd/prime-limit set, Farey subset.
- EDO + ED-n (tempered; cents-source, flagged) — small and high-demand.

**Tranche 2 — SonicWeave wrappers for the hard methods (M, low risk).** Add the `src/lib/sonicweave.ts` adapter, then wire:
- Rank-2 tempered + optimal tunings (`rank2` + `POTE`/`TE`/`CTE`).
- Well-temperament (`wellTemperament`).
- Fokker periodicity block (`parallelotope`/`octaplex`) — delivers parked TEMP-08 early.
- Plus the **free-text SonicWeave expression** escape hatch (delivers parked TEMP-07).

**Tranche 3 — research-grade / polish.**
- Wilson recurrence / metallic (`meruScale`, M, hand-rolled).
- Constant-structure (`csgs`/`gs` wrap).
- Circle-of-pitches preview viz (the Leimma lesson) + "rotate to mode" + transform strip.

**Explicitly out of v1:** harmonic-entropy-guided selection (needs the `harmonic-entropy` dep, parked as TEMP-05); tetrachordal Chalmers builder (M, but lower demand — defer).

**Integration (do once, before any "Send to …" works):** add `src/lib/scale-store.ts`; add the additive listener cell + the single `??` boot clause to `index.md` and `analysis.md`; wire "Send to Dashboard/Analysis" buttons on `generate.md` to `writeSharedScale` (+ optional `#s=`). Test empty-store boot equivalence (R1) before anything else.

## Architecture Patterns

### Component pattern (per method) — copy `mosBuilder` verbatim
Pattern-2 factory `(synth, opts) => HTMLElement`, closure-local state, `createElement`+`textContent` XSS discipline, status region (`role=status aria-live=polite`), `replaceChildren` re-render, output via `scaleTable` + `playScale`. The picker in `generate.md` mounts the chosen factory.

### Kernel pattern (per exact method) — copy `buildMos`/`enumerateDiamond`
Pure function `(...params) => Scale`; dedupe by BigInt Fraction equality via a `Set` keyed on `${n}/${d}` (NEVER cents tolerance — Pitfall #1/#6); octave/period-reduce via `Interval.octaveReduce(period)` (Pitfall #13); append period (D-14); defense-in-depth caps on combinatorial sizes (mirror `enumerateDiamond`'s `[1,1023]` and `buildMos`'s `≤1024`). List every new symbol in `INVENTORY.md`.

### SonicWeave adapter pattern (new)
`evaluateSource(src, true).currentScale` → map each `Interval`: try `.toFraction()` → `${n}/${d}` BigInt round-trip (R-01); on failure use `.totalCents()` (tempered, cents-source). Wrap in `Scale`. try/catch → status message. Cap input length.

### Anti-Patterns to Avoid
- **Treating tempered (EDO/rank-2/well-temperament) ratios as exact JI.** Their `Interval.fraction` is float-derived; the ratio column would lie. Flag "tempered" and show cents as primary.
- **Letting the consumer listener write the store** (R2 loop). One-way only.
- **Re-binding the synth/listeners on every input** (Pitfall #11). Bind the page synth + the `scale-changed` listener in dedicated cells with `invalidation.then(cleanup)`.
- **Upgrading `xen-dev-utils` to 0.15.0** as part of this work — out of scope, regression risk; 0.13.1 already has every needed API.
- **Reimplementing what SonicWeave/`xen-dev-utils` already provide** (Pitfall #5 / INVENTORY discipline). Wrap; don't rebuild — except for the small exact-rational methods where transparent kernel ownership is the explicit goal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rank-2 with optimal (POTE/TE/CTE) tunings | A least-squares tuning-map solver | `SW rank2` + `POTE`/`TE`/`CTE` | Linear-algebra-heavy, error-prone, already implemented + tested upstream. |
| Fokker periodicity block | Hand-rolled HNF / comma-kernel solver | `SW parallelotope`/`octaplex` (or `XDU.hnf`/`kernel`/`solveDiophantine` if hand-rolling) | Block math is genuinely L-effort; the lattice algebra exists in installed deps. |
| Harmonic entropy | An HE integrator | `harmonic-entropy` npm (v2, TEMP-05) | New dep + research-grade; out of v1. |
| n-choose-k for CPS | A combinations generator | `XDU.kCombinations` | Tiny but exists, tested; or `SW cps`. |
| Continued-fraction MOS sizes | (already solved) | `mos.ts` `nearestMosSize` (or `XDU.getConvergents`) | Already in the kernel. |

**Key insight:** the small exact-rational generators (A-2, A-3, CPS) are *worth* hand-rolling for transparency and BigInt-purity; the irrational/lattice-heavy ones (A-1 tempered, A-4 Fokker) should wrap SonicWeave to avoid reinventing well-tested, subtle math.

## Common Pitfalls

### Pitfall 1: Tempered ratios laundered as exact JI
**What goes wrong:** an EDO or tempered-rank-2 scale shows fake-precise ratios because `Interval` stores a float-derived fraction.
**How to avoid:** tag scales as "tempered" vs "JI" at generation time; for tempered, cents is the source of truth (project to Hz at audio boundary like `meantone.md`), and the ratio column should say so or be hidden.
**Warning sign:** a "JI" scale whose ratios have absurd numerators/denominators.

### Pitfall 2: Store→textarea→store feedback loop
**What goes wrong:** a consumer page writes back to the store and triggers an infinite broadcast.
**How to avoid:** one-way data flow — only "Send to …" writes the store; listeners only set the textarea.
**Warning sign:** repeated `scale-changed` events / UI thrash.

### Pitfall 3: Boot precedence regression
**What goes wrong:** a stale stored scale overrides the seed/hash on an unrelated page load.
**How to avoid:** `hashDecoded ?? readSharedScale()?.text ?? seedText`; empty store → byte-identical boot. Test it.
**Warning sign:** the dashboard opens to a scale the user didn't deep-link.

### Pitfall 4: SonicWeave Fraction crossing the R-01 boundary
**What goes wrong:** passing SonicWeave's Number-backed `Fraction` straight into the kernel loses BigInt precision.
**How to avoid:** always `${n}/${d}` round-trip into our `Interval` (the `jiSubsetOfEdo` pattern).
**Warning sign:** ESLint R-01 flags, or large-ratio precision loss.

## Code Examples

### SonicWeave → Scale adapter (verified working this session)
```ts
// Source: runtime-tested against sonic-weave@0.14.1 this session.
import { evaluateSource } from "sonic-weave";
import { Interval } from "./interval.js";
import { Scale } from "./scale.js";

export function scaleFromSonicWeave(src: string): Scale {
  const visitor = evaluateSource(src, /*includePrelude=*/ true);
  const out: Interval[] = [];
  for (const iv of visitor.currentScale) {
    try {
      const f = iv.toFraction();          // rational → exact
      out.push(new Interval(`${String(f.n)}/${String(f.d)}`)); // R-01 BigInt round-trip
    } catch {
      // tempered/irrational → cents is the source of truth
      const cents = iv.totalCents();
      out.push(new Interval(/* centsToRatio(cents) — flag scale as tempered */));
    }
  }
  return new Scale(out);
}
// evaluateSource("cps([1,3,5,7], 2)").currentScale → 7/6, 5/4, 35/24, 5/3, 7/4, 2/1  ✓
// evaluateSource("rank2(3/2, 5, 1)")  → 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2/1   ✓ (== buildMos)
```

### CPS kernel primitive (hand-rolled path)
```ts
// Source: pattern derived from xen-dev-utils/dist/combinations.d.ts (kCombinations) + this repo's buildMos.
import { kCombinations } from "xen-dev-utils";
import { Interval } from "./interval.js";
import { Scale } from "./scale.js";

export function cps(factors: Interval[], k: number, period = new Interval("2/1")): Scale {
  const subsets = kCombinations(factors, k);               // n-choose-k, exact
  const products = subsets.map((s) =>
    s.reduce((acc, f) => acc.mul(f), new Interval("1/1")).octaveReduce(period));
  const seen = new Set<string>(); const unique: Interval[] = [];
  for (const iv of products) {
    const key = `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
    if (!seen.has(key)) { seen.add(key); unique.push(iv); }
  }
  unique.sort((a, b) => a.cents - b.cents);
  if (!unique.at(-1)?.equals(period)) unique.push(period);  // D-14
  return new Scale(unique, period);
}
```

### Additive boot precedence (the one-line change per page)
```ts
// BEFORE: const initialScaleText = hashDecoded ?? seedText;
// AFTER  (single additive ?? clause — inert when store empty):
const initialScaleText = hashDecoded ?? readSharedScale()?.text ?? seedText;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-method bespoke C-code / Scala CLI commands | SonicWeave prelude as a single embeddable scale-DSL (`cps`, `rank2`, `parallelotope`, …) | Scale Workshop 3 era (2023→) | The whole generator vocabulary is one already-installed npm dep; forms can be thin. |
| Hand-rolled MOS / combinations math | `xen-dev-utils` primitives (`kCombinations`, `getConvergents`, `hnf`/`kernel` for Fokker) | ongoing | Lattice + combinatorics are off-the-shelf and exact. |
| Table-only scale preview | Circular pitch-wheel direct manipulation (Leimma/Apotome) | 2021→ | A circle viz is the modern "shape at a glance" preview. |

**Deprecated/outdated:**
- `moment-of-symmetry` as a separate dep for this project — superseded for our needs by SonicWeave's `mos`/`rank2` + the existing hand-rolled `buildMos` (D-11 stands).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `moment-of-symmetry@0.10.0` is legitimate/safe | Stack / Audit | Low — not being installed; verified by npm provenance signals; only flagged because slopcheck was unavailable. |
| A2 | SonicWeave `evaluateSource` start-up (prelude) stays sub-100ms in-browser | Half B-3 | Low — measured fast in Node; if slow in-browser, debounce/evaluate-on-demand (already recommended). |
| A3 | `sessionStorage` vs `localStorage` scoping is a free planner choice | Half C R6 / OQ-1 | Low — both work; only affects "remember across reloads" semantics. |
| A4 | Tempered SonicWeave intervals reliably distinguish via `.toFraction()` throwing | Half B-3 / Pitfall 4 | Medium — verify the exact rational-vs-real discriminator (`iv.value instanceof TimeReal`) at implementation time rather than relying on try/catch alone. |

## Open Questions

1. **OQ-1: store persistence scope.** `localStorage` (survives reloads — "remember my last scale") vs `sessionStorage` (per-session). Recommendation: `localStorage` for parity with theme-prefs; revisit if the stale-scale behavior (R6) annoys.
2. **OQ-2: cross-tab sync.** Same-document `CustomEvent` covers the single-tab live-update requirement. Adding a native `storage`-event listener for true cross-tab sync is optional and additive. Recommendation: ship single-tab; add cross-tab only if wanted.
3. **OQ-3: tempered-ratio display.** How to present EDO/rank-2/well-temperament scales whose ratios are float-derived — hide the ratio column, show "≈", or label "tempered"? Recommendation: a "tempered" badge + cents-primary table.
4. **OQ-4: CPS path.** Hand-roll over `XDU.kCombinations` (transparent, owned) vs `SW cps` (one line). Recommendation: hand-roll the flagship CPS; it's ~25 LOC and the user values owning the JI core.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `sonic-weave` | rank-2/well-temperament/Fokker wrappers + free-text input | ✓ | 0.14.1 (installed) | hand-roll over `xen-dev-utils` (higher effort) |
| `xen-dev-utils` | CPS (`kCombinations`), Fokker (`hnf`/`kernel`), approximation | ✓ | 0.13.1 (installed; 0.15.0 latest — do NOT upgrade) | none needed |
| `fraction.js` | BigInt `Interval` currency | ✓ | 5.3.4 (installed, pinned) | none |
| `harmonic-entropy` | HE-guided selection (method #17) | ✗ | — | **Out of v1** (parked TEMP-05) |
| `moment-of-symmetry` | (not recommended) | ✗ | — | SonicWeave `mos`/`rank2` + existing `buildMos` |

**Missing dependencies with no fallback:** none for the v1 tranche.
**Missing dependencies with fallback:** `harmonic-entropy` (out of v1); `moment-of-symmetry` (covered by SonicWeave).

## Validation Architecture

> `workflow.nyquist_validation` not explicitly false → section included. (No `.planning/config.json` read this run; assume enabled per default.)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard; 192 tests passing per PROJECT.md) |
| Config file | project Vitest config (existing) |
| Quick run command | `npx vitest run <file>` (per-module) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| CPS Hexany == canonical 1-3-5-7 set | unit | `npx vitest run src/lib/cps.test.ts` | ❌ Wave 0 |
| Harmonic/subharmonic/ADO/isoharmonic exact ratios | unit | `npx vitest run src/lib/harmonic.test.ts` | ❌ Wave 0 |
| SonicWeave adapter: `rank2(3/2,5,1)` == `buildMos(3/2,2/1,7)` | unit | `npx vitest run src/lib/sonicweave.test.ts` | ❌ Wave 0 |
| `scale-store` read/write/validate + length cap + localStorage-throws | unit | `npx vitest run src/lib/scale-store.test.ts` | ❌ Wave 0 |
| **Boot equivalence: empty store → boot == current boot (R1)** | unit/integration | `npx vitest run src/lib/scale-store.test.ts` | ❌ Wave 0 (critical) |
| Tempered-vs-JI flagging | unit | `npx vitest run src/lib/sonicweave.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <touched module>.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** full suite green + lint (R-01 ESLint must stay green — watch the SonicWeave Fraction boundary) before verify.

### Wave 0 Gaps
- [ ] `src/lib/cps.test.ts` — CPS exactness + presets
- [ ] `src/lib/harmonic.test.ts` — harmonic/subharmonic/ADO/isoharmonic
- [ ] `src/lib/sonicweave.test.ts` — adapter round-trip + tempered flag (cross-check vs `buildMos`)
- [ ] `src/lib/scale-store.test.ts` — store + **boot-equivalence regression test (R1)**
- [ ] Component tests for new Pattern-2 widgets (follow existing `mos-builder` test shape if present)

## Security Domain

> `security_enforcement` not explicitly false → included.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | SonicWeave free-text + factor chips + ratio inputs: length caps (reuse `MAX_SCALE_TEXT_BYTES`), `parseInt`/Fraction validation, try/catch → status region (mirror `parseScala`/`mosBuilder`). |
| V5 Output Encoding (XSS) | yes | All dynamic render via `createElement` + `textContent` (NEVER `innerHTML`) — the repo's standing discipline (T-02-22/23, T-04-13). Applies to scale text from the store and SonicWeave error messages. |
| V6 Cryptography | no | No secrets/crypto in this feature. |
| Tampering (localStorage) | yes | `readSharedScale` validates shape + caps length + try/catch (mirrors theme-prefs T-9mn-01/03); malformed → null → seed fallback. |
| Code injection | yes (eval surface) | SonicWeave `evaluateSource` parses its own DSL — it does NOT `eval`/`Function`-construct host JS and does not touch `window`/DOM. Still: cap input, try/catch, surface errors as text. |

### Known Threat Patterns for {Observable Framework + localStorage + DSL eval}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via scale text / SonicWeave error rendered as HTML | Tampering | `textContent` only at every render boundary (existing repo discipline). |
| localStorage tampering (oversized/malformed shared scale) | Tampering | length cap + shape validation + try/catch in `scale-store`. |
| DoS via huge SonicWeave expression or combinatorial blow-up (large CPS/Fokker) | DoS | Input-length cap; combinatorial size caps mirroring `enumerateDiamond`/`buildMos`; evaluate on button press, not per keystroke. |
| Event-loop / resource exhaustion via store feedback | DoS | One-way data flow (consumers never write store) — Half C R2. |

## Sources

### Primary (HIGH confidence)
- Installed `node_modules/sonic-weave@0.14.1` — `dist/parser/parser.d.ts` (`evaluateSource`), `dist/parser/statement.d.ts` (`currentScale`), `dist/interval.d.ts` (`toFraction`/`totalCents`), `dist/stdlib/prelude.js` (builtin signatures + docstrings). Plus runtime test of `cps`/`eulerGenus`/`afdo`/`rank2`/`wellTemperament`. `[VERIFIED]`
- Installed `node_modules/xen-dev-utils@0.13.1` — `dist/combinations.d.ts` (`kCombinations`), `dist/approximation.d.ts` (`approximateOddLimit`/`getConvergents`/`continuedFraction`), `dist/basis.d.ts` + `dist/hnf.d.ts` (`hnf`/`kernel`/`cokernel`/`solveDiophantine`/`defactoredHnf`/LLL). `[VERIFIED]`
- This repo: `src/lib/{interval,scale,mos,diamond,edo,url,commas}.ts`, `src/lib/INVENTORY.md`, `src/components/mos-builder.ts`, `src/theme/theme-prefs.ts`, `src/pages/analysis.md`, `.planning/PROJECT.md`, CONTEXT.md. `[VERIFIED]`
- `npm view` — `sonic-weave@0.14.1`, `xen-dev-utils@0.15.0` (latest), `moment-of-symmetry@0.10.0` (created 2022-11, xenharmonic-devs github, ~180k wk dl). `[VERIFIED: npm registry]`

### Secondary (MEDIUM confidence)
- Huygens-Fokker, "A.D. Fokker: Unison Vectors and Periodicity Blocks"; Wikipedia "Fokker periodicity block"; Paul Erlich, "A gentle introduction to Fokker periodicity blocks" (tonalsoft). `[CITED]`
- Erv Wilson archives (anaphoria.com) — CPS, Mt. Meru; Tonalsoft encyclopedia (CPS/hexany). `[CITED]`
- Scale Workshop 3, Leimma/Apotome (isartsi.org), Wilsonic, x31eq (Graham Breed), Sevish, Scala (Huygens-Fokker) — UI survey. `[CITED]`

### Tertiary (LOW confidence)
- John Chalmers, *Divisions of the Tetrachord* (1993) — referenced for the tetrachordal method (deferred from v1); not consulted in depth this session. `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack / dependency surface: HIGH — read installed source + runtime-tested SonicWeave.
- Existing-kernel delta (what to build vs reuse): HIGH — read every cited kernel file.
- Integration design (Half C): HIGH — derived from the verified `analysis.md` boot/write code + `theme-prefs.ts` precedent.
- Advanced methods (Fokker hand-roll, Wilson, tetrachord): MEDIUM — algorithms understood and primitives confirmed present, but not implemented this session.
- UI survey specifics: MEDIUM — based on web sources + the Scale Workshop lineage; exact current menus may have shifted.

**Research date:** 2026-06-08
**Valid until:** ~30 days (stable kernel + pinned deps; SonicWeave/xen-dev-utils move but the project pins versions).
