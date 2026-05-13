---
name: 260513-d2e-RESEARCH
description: Per-page claim inventory + Chicago author-date citation pool for the theory-page fact-check task
status: ready-for-planning
---

# Quick Task 260513-d2e — Research

**Researched:** 2026-05-13
**Domain:** Tuning-systems history, historical attribution, JI mathematics, psychoacoustics
**Confidence:** HIGH for citation pool and primary corrections; MEDIUM-HIGH for derivation re-verification (kernel arithmetic in pages is already tested — prose-vs-cells alignment is the audit surface).

## Executive Summary

- **18 pages reviewed** end-to-end (~5,000 lines of Markdown prose + reactive cells).
- **~165 distinct claims inventoried** (the count below sums per-page totals): roughly **108 VERIFIED / CITATION-ONLY**, **9 CORRECTION NEEDED**, **48 already-cited "Further reading" links that need normalization into Chicago entries**, plus a handful of UNVERIFIABLE flags.
- **~48 unique bibliographic entries** in the deduplicated citation pool covering primary historical (Werckmeister 1691, Kirnberger 1779, Salinas 1577, Aron 1523, Zarlino 1558, Vallotti 1779, Partch 1974, Helmholtz 1885, Tartini 1754, Mersenne 1636, Tenney 1983/1988, Doty 2002, Johnston Suite, Gann), modern academic (Benson 2007, Sethares 2005, Blackwood 1985, Lindley 1984, Duffin 2007/2020, Barker 1989, West 1992, Plomp & Levelt 1965, Lehman 2005), xen.wiki pages (16 distinct), Huygens-Fokker (2 entries), Scale Workshop project pages.

**Top 3 corrections required:**

1. **`well-temperament.md` line ~393: "Francesco Vallotti's scheme (composed 1728, published posthumously 1779)".** The "posthumously" claim is wrong — Vallotti died in **1780**, *after* the 1779 publication of *Della scienza teorica e pratica della moderna musica, libro primo* (Padua). The "composed 1728" date is also unsourced and likely apocryphal; safer phrasing is "first appeared in print in 1779." More importantly, modern scholarship (Duffin) demonstrates that there is no clear evidence Vallotti actually proposed the ⅙-PC-on-six-fifths scheme — it was first described in print by **Giuseppe Tartini** in *Trattato di musica secondo la vera scienza dell'armonia* (Padua, 1754). The page already softly admits "technically a slight misattribution" but should cite Duffin and Tartini explicitly.

2. **`schisma.md` line ~150-152, `well-temperament.md` further reading: "Helmholtz / Groven / Garibaldi" schismatic temperament attribution.** "Garibaldi" in the xen-dev community refers to **Eduardo Sábat-Garibaldi** (the dinarra developer, late 20th c.), not Giuseppe Garibaldi or any 19th-century figure — and the temperament family's modern names group Helmholtz (1863, the 1/8-schisma "schismic" recipe), Groven (early-mid 20th c., 36-tone schismic adjusting organ), and Sábat-Garibaldi (1/9-schisma extension). The Xenharmonic Wiki "Garibaldi" page documents this. The page's bare "Garibaldi" should be disambiguated to "Sábat-Garibaldi" with a citation, or the reference removed if precision is not load-bearing.

3. **`well-temperament.md` line ~395-400: "The temperament commonly called 'Vallotti' today is technically a slight misattribution — Vallotti's own scheme is more elaborate".** This is in the right direction but understates the problem: Duffin's "Why I hate Vallotti (or is it Young?)" demonstrates that the modern ⅙-PC-on-six-fifths recipe attributed to Vallotti has no clear documentary basis in Vallotti himself; the closest documentary primary is Tartini 1754. The fix is to cite Duffin and Tartini and re-phrase as "is more properly the **Tartini–Vallotti** scheme, first described in print by Giuseppe Tartini in his 1754 *Trattato di musica* (Padua) and later associated with Vallotti's Paduan circle (Duffin)."

Additional non-blocking nits in the corrections section below.

## Citation Pool (deduplicated, Chicago author-date reference-list format)

> Entries are alphabetized by author surname within each tier. Page numbers are flagged
> with `, [PP]` when the inline citation on the page should cite a specific span and the
> precise location wasn't pinned down here — planner/executor should add `[PP]` when
> dropping the inline citation, leaving it for the SUMMARY.md follow-up if unresolved.

### Primary Historical

- Aron, Pietro. 1523. *Toscanello in musica*. Venice: Bernardino e Matteo de' Vitali. (Multiple reprints 1525–1562. First text to describe quarter-comma meantone, advising that major thirds be tuned "sonorous and just, as united as possible.")
- Helmholtz, Hermann von. 1885. *On the Sensations of Tone as a Physiological Basis for the Theory of Music*. Translated and edited by Alexander J. Ellis. 2nd English ed. London: Longmans, Green, and Co. (Translation of *Die Lehre von den Tonempfindungen als physiologische Grundlage für die Theorie der Musik*, 4th ed., Braunschweig: Vieweg, 1877.)
- Johnston, Ben. 1977. *Suite for Microtonal Piano*. Score and recording: New World Records 80637 (Phillip Bush, piano; reissue New World 1995). [Used to anchor the comma-pump page's compositional example; the score itself documents Johnston's syntonic-comma arrow notation.]
- Kirnberger, Johann Philipp. 1779. *Die Kunst des reinen Satzes in der Musik, aus sicheren Grundsätzen hergeleitet und mit deutlichen Beyspielen erläutert*. Vol. 2, pt. 3. Berlin and Königsberg: G. J. Decker and G. L. Hartung. (The third temperament — "Kirnberger III" — is described in this final installment of the multi-volume treatise begun 1771; the III/II numbering is editorial/retrospective.)
- Mersenne, Marin. 1636. *Harmonie universelle, contenant la théorie et la pratique de la musique*. Paris: Sebastien Cramoisy. (Cited where the broader history of Pythagorean / meantone practice in early 17th-c. Europe is invoked.)
- Partch, Harry. 1974. *Genesis of a Music: An Account of a Creative Work, Its Roots, and Its Fulfillments*. 2nd ed., enlarged. New York: Da Capo Press. (1st ed. University of Wisconsin Press, 1949.)
- Rameau, Jean-Philippe. 1722. *Traité de l'harmonie réduite à ses principes naturels*. Paris: Ballard. [Held in reserve — only invoked on `harmonic-series.md` if the executor adds an aside on the historical adoption of the harmonic series as the basis of harmony.]
- Salinas, Francisco de. 1577. *De musica libri septem*. Salamanca: Matthias Gastius. (Discusses 1/3-, 1/4-, and 2/7-comma meantone tunings; chs. 23–28 are the meantone material. The 1/3-comma description is the canonical primary attribution.)
- Tartini, Giuseppe. 1754. *Trattato di musica secondo la vera scienza dell'armonia*. Padua: Stamperia del Seminario. (First documented appearance in print of the ⅙-Pythagorean-comma-on-six-fifths recipe now commonly labelled "Vallotti.")
- Tenney, James. 1983. "John Cage and the Theory of Harmony." *Soundings* 13: 55–83. (Also reprinted in *Musicworks* 27 [Spring 1984] and in Tenney, *From Scratch: Writings in Music Theory*, ed. Larry Polansky et al., Urbana: University of Illinois Press, 2015, ch. 12. The primary source for harmonic distance / Tenney height: §3 and §6 define harmonic distance as `log(n·d)` of a reduced ratio.)
- Vallotti, Francesco Antonio. 1779. *Della scienza teorica e pratica della moderna musica, libro primo*. Padua: Nella stamperia del Seminario, appresso Giovanni Manfrè. (The first and only volume published in Vallotti's lifetime; planned vols. 2–4 remained in manuscript until 1950. Vallotti d. 10 January 1780, the year *after* publication — the page's "published posthumously" claim is incorrect.)
- Werckmeister, Andreas. 1691. *Musicalische Temperatur, oder deutlicher und warer mathematischer Unterricht, wie man durch Anweisung des Monochordi ein Clavier… wol temperirt stimmen könne*. Quedlinburg: Theodor Philipp Calvisius. (The "Correct temperament no. 1" recipe — modernly "Werckmeister III" — narrows C–G, G–D, D–A, and B–F♯ by ¼ Pythagorean comma. The III/IV/V numbering is the modern monochord-label convention: Werckmeister's monochords I and II label just intonation and ¼-comma meantone respectively; his "good temperaments" begin at monochord III.)
- Young, Thomas. 1800. "Outlines of Experiments and Inquiries Respecting Sound and Light." *Philosophical Transactions of the Royal Society of London* 90: 106–150. (Letter dated 9 July 1799; read 16 January 1800. Describes the temperament now called "Young's temperament," structurally similar to the modern "Vallotti" recipe but rotated one step around the circle of fifths.)
- Zarlino, Gioseffo. 1558. *Le istitutioni harmoniche*. Venice: [author]. (Repr. 1561, 1562 from the same blocks. Part II, chs. 42–43 describe 2/7-comma meantone — the first published recipe with arithmetic exactitude.)

### Modern Academic

- Barker, Andrew. 1989. *Greek Musical Writings, Vol. II: Harmonic and Acoustic Theory*. Cambridge Readings in the Literature of Music. Cambridge: Cambridge University Press. (Source for Archytas of Tarentum's three tetrachords — enharmonic, chromatic, diatonic — and the historical entry of prime 7 into Greek music theory in the 4th century BCE. Already cited inline on `septimal-comma.md`; normalize to Chicago format.)
- Benson, Dave. 2007. *Music: A Mathematical Offering*. Cambridge: Cambridge University Press. (Reserve citation for the math-heavy pages — `monzos.md`, `tenney-height.md`, `prime-limits.md` — when the reader wants a modern academic single-volume reference for JI math.)
- Blackwood, Easley. 1985. *The Structure of Recognizable Diatonic Tunings*. Princeton, NJ: Princeton University Press. (Already cited inline on `meantone.md` "Further reading"; normalize to Chicago format. Canonical modern text on the 1/n-comma meantone continuum.)
- Doty, David B. 2002. *The Just Intonation Primer: An Introduction to the Theory and Practice of Just Intonation*. 3rd ed. San Francisco: Just Intonation Network. (Already cited inline on `monzos.md`; normalize.)
- Duffin, Ross W. 2007. *How Equal Temperament Ruined Harmony (And Why You Should Care)*. New York: W. W. Norton. (Modern accessible account of the meantone-vs-equal-temperament historical arc; corroborates the historical narrative in `meantone.md`, `well-temperament.md`, and `edo-approximation.md`.)
- Duffin, Ross W. 2020. "Why I Hate Vallotti (or Is It Young?), pts. 2.1 and 3.1." *Faculty Blog*, Case Western Reserve University, October 2020. https://casfaculty.case.edu/ross-duffin/why-i-hate-vallotti-or-is-it-young-2-1/. (Accessed 2026-05-13. The canonical modern scholarly source documenting that the temperament commonly called "Vallotti" today has no clear documentary basis in Vallotti himself; cites Tartini 1754 as the earliest print appearance of the recipe.)
- Lehman, Bradley. 2005. "Bach's Extraordinary Temperament: Our Rosetta Stone, pts. 1 and 2." *Early Music* 33 (1): 3–23; 33 (2): 211–231. (And companion site https://www.larips.com/, accessed 2026-05-13. Already cited inline on `well-temperament.md`; the *Early Music* citation is the peer-reviewed primary; the site is the accessible supplement.)
- Lindley, Mark. 1984. *Lutes, Viols and Temperaments*. Cambridge: Cambridge University Press. (Already cited inline on `well-temperament.md`; normalize. Standard scholarly reference on Renaissance / early Baroque temperament practice.)
- Plomp, Reinier, and Willem J. M. Levelt. 1965. "Tonal Consonance and Critical Bandwidth." *Journal of the Acoustical Society of America* 38 (4): 548–560. https://doi.org/10.1121/1.1909741. (Foundational psychoacoustic study of consonance vs critical bandwidth — used on `harmonic-series.md` to ground claims about why simple integer ratios sound smooth.)
- Sethares, William A. 2005. *Tuning, Timbre, Spectrum, Scale*. 2nd ed. London: Springer-Verlag. (Modern academic reference for the timbre-tuning relationship and the Plomp-Levelt-derived dissonance curves; useful citation for `harmonic-series.md` and as backup for the consonance claims throughout the comma pages.)
- Tenney, James. 1988. *A History of "Consonance" and "Dissonance"*. New York: Excelsior. (Tenney's broader historical treatment, complementing the 1983 Cage essay; useful as a secondary citation for the harmonic-distance concept on `tenney-height.md`.)
- West, Martin L. 1992. *Ancient Greek Music*. Oxford: Oxford University Press / Clarendon. (Standard modern reference on Greek music theory including the pre-Pythagorean lineage of tuning practice; supports the "Pythagorean tuning predates Pythagoras" correction on `pythagorean-tuning.md`.)

### Xenharmonic Wiki (Accessed 2026-05-13)

- Xenharmonic Wiki. n.d. "5-limit." Accessed 2026-05-13. https://en.xen.wiki/w/5-limit. *[Only invoke if the executor wants a back-up for the 5-limit-JI characterization on `prime-limits.md`.]*
- Xenharmonic Wiki. n.d. "11-limit." Accessed 2026-05-13. https://en.xen.wiki/w/11-limit.
- Xenharmonic Wiki. n.d. "53edo." Accessed 2026-05-13. https://en.xen.wiki/w/53edo.
- Xenharmonic Wiki. n.d. "64/63." Accessed 2026-05-13. https://en.xen.wiki/w/64/63. [Already linked on `septimal-comma.md`.]
- Xenharmonic Wiki. n.d. "81/80." Accessed 2026-05-13. https://en.xen.wiki/w/81/80. [Already linked on `syntonic-comma.md`.]
- Xenharmonic Wiki. n.d. "Archytas clan." Accessed 2026-05-13. https://en.xen.wiki/w/Archytas_clan. [Already linked on `septimal-comma.md`.]
- Xenharmonic Wiki. n.d. "Comma." Accessed 2026-05-13. https://en.xen.wiki/w/Comma. [Already linked on `commas.md`.]
- Xenharmonic Wiki. n.d. "Comma pump." Accessed 2026-05-13. https://en.xen.wiki/w/Comma_pump. [Already linked on `comma-pump.md`.]
- Xenharmonic Wiki. n.d. "EDO." Accessed 2026-05-13. https://en.xen.wiki/w/EDO.
- Xenharmonic Wiki. n.d. "Garibaldi." Accessed 2026-05-13. https://en.xen.wiki/w/Garibaldi. (Documents that the temperament name honors Eduardo Sábat-Garibaldi's 1/9-schisma dinarra — *not* Giuseppe Garibaldi or any 19th-century figure.)
- Xenharmonic Wiki. n.d. "Harmonic series." Accessed 2026-05-13. https://en.xen.wiki/w/Harmonic_series. [Already linked on `harmonic-series.md`.]
- Xenharmonic Wiki. n.d. "Meantone family." Accessed 2026-05-13. https://en.xen.wiki/w/Meantone_family. [Already linked on `meantone.md`.]
- Xenharmonic Wiki. n.d. "Mercator's comma." Accessed 2026-05-13. https://en.xen.wiki/w/Mercator's_comma.
- Xenharmonic Wiki. n.d. "Monzo." Accessed 2026-05-13. https://en.xen.wiki/w/Monzo. (Documents the term's coinage by Gene Ward Smith in July 2003 in honor of Joe Monzo.) [Already linked on `monzos.md`.]
- Xenharmonic Wiki. n.d. "Odd limit." Accessed 2026-05-13. https://en.xen.wiki/w/Odd_limit. [Already linked on `odd-limits.md`.]
- Xenharmonic Wiki. n.d. "Otonality and utonality." Accessed 2026-05-13. https://en.xen.wiki/w/Otonality_and_utonality. [Already linked on `otonality-utonality.md`.]
- Xenharmonic Wiki. n.d. "Prime limit." Accessed 2026-05-13. https://en.xen.wiki/w/Prime_limit. [Already linked on `prime-limits.md`.]
- Xenharmonic Wiki. n.d. "Pythagorean comma." Accessed 2026-05-13. https://en.xen.wiki/w/Pythagorean_comma.
- Xenharmonic Wiki. n.d. "Pythagorean tuning." Accessed 2026-05-13. https://en.xen.wiki/w/Pythagorean_tuning. [Already linked.]
- Xenharmonic Wiki. n.d. "Schisma." Accessed 2026-05-13. https://en.xen.wiki/w/Schisma. [Already linked.]
- Xenharmonic Wiki. n.d. "Tenney height." Accessed 2026-05-13. https://en.xen.wiki/w/Tenney_height. [Already linked.]
- Xenharmonic Wiki. n.d. "Well temperament." Accessed 2026-05-13. https://en.xen.wiki/w/Well_temperament. [Already linked.]

### Huygens-Fokker Foundation

- Huygens-Fokker Foundation. n.d. "Scala scale file format." Accessed 2026-05-13. https://www.huygens-fokker.org/scala/scl_format.html. [Already linked on `scale-workshop-interop.md`.]
- Huygens-Fokker Foundation. n.d. "List of intervals." Accessed 2026-05-13. https://www.huygens-fokker.org/docs/intervals.html. (Comma table — authoritative cross-reference for every named comma's ratio and cents value.)

### Project / Community Resources

- xenharmonic-devs. n.d. "Scale Workshop." GitHub repository. Accessed 2026-05-13. https://github.com/xenharmonic-devs/scale-workshop. [Already linked on `scale-workshop-interop.md`.]
- Scale Workshop. n.d. Online application. Accessed 2026-05-13. https://scaleworkshop.plainsound.org/. [Already linked.]
- Gann, Kyle. n.d. "Just Intonation Explained." Accessed 2026-05-13. https://www.kylegann.com/tuning.html. [Already linked on `harmonic-series.md`.]
- Gann, Kyle. n.d. "La Monte Young's *The Well-Tuned Piano*." Accessed 2026-05-13. https://www.kylegann.com/wtp.html. [Already linked on `otonality-utonality.md`.]

## Per-Page Analysis

> Each per-page table has columns: **#** (claim index for cross-reference), **Claim** (verbatim or close-paraphrase from page), **Type** (HIST = historical/attributional, NUM = numerical/computational, DEF = definitional/theoretical, DERIV = mathematical derivation in prose), **Status** (✓ VERIFIED, ✗ CORRECTION NEEDED, ◯ CITATION ONLY, ? UNVERIFIABLE), **Recommended citation** (Chicago short-form: surname year[, page]), **Notes**.

---

### `syntonic-comma.md`

**Summary:** Defines the syntonic comma `81/80 ≈ 21.5¢` as the gap between the 5-limit major third `5/4` and the Pythagorean major third `81/64`. Audio demo with beat-rate calculation at A=440. Shows the monzo `[-4, 4, -1]`. Lists temperaments that vanish it.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| S1 | "81/80 — the gap between Pythagorean and 5-limit major thirds" | DEF | ✓ | Helmholtz 1885, 432; Partch 1974, 86 | Define-the-thing claim. Helmholtz Pt. III §XV defines the comma; Partch ch. 6 covers it explicitly. |
| S2 | "syntonic comma is 81/80 ≈ 21.5¢" | NUM | ✓ | Huygens-Fokker, "List of intervals"; Xen Wiki, "81/80" | Computed: 1200·log₂(81/80) = 21.50629... ¢. Page rounds correctly. |
| S3 | "differ by exactly one syntonic comma: (81/64)/(5/4) = 81/80" | DERIV | ✓ | — | Re-verified: (81·4)/(64·5) = 324/320 = 81/80. ✓ |
| S4 | "5/4 sounds 'soft' or 'smooth'... the prime 5 enters the chord" | DEF | ◯ | Helmholtz 1885, 184–194; Sethares 2005, §3.3 | Psychoacoustic claim. Cite the consonance/critical-bandwidth literature. |
| S5 | "Beat frequency at A = 440 Hz: 6.875 Hz... ~21.506¢" | NUM | ✓ | — | Re-verified: 440·5/4 = 550; 440·81/64 = 556.875; difference 6.875 Hz. ✓ The page already computes this in-cell — it's kernel-derived. |
| S6 | Monzo `[-4, 4, -1]` = 2⁻⁴ · 3⁴ · 5⁻¹ | DERIV | ✓ | Xen Wiki, "Monzo" | 81/80 = 3⁴/(2⁴·5) ✓ |
| S7 | "Tempered out by. Meantone in all common variants... 12-EDO, 19-EDO, 31-EDO, 53-EDO." | DEF | ◯ | Xen Wiki, "Meantone family"; Blackwood 1985, §3 | Standard temperament-family claim; cite the family overview. |

**Page-level citations needed:** ~4 inline (S1 Helmholtz + Partch, S4 Helmholtz/Sethares, S7 Blackwood/Xen Wiki). Add **`## Sources`** section with: Helmholtz 1885, Partch 1974, Sethares 2005, Blackwood 1985, Xen Wiki "81/80" + "Meantone family" + "Monzo", Huygens-Fokker "List of intervals."

---

### `pythagorean-comma.md`

**Summary:** Defines `531441/524288 ≈ 23.46¢` as the gap between twelve pure fifths and seven octaves. Spiral-of-fifths viz + cumulative-drift chart. Monzo `[-19, 12]`. Temperaments that vanish it.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| PC1 | "531441/524288 — the gap that prevents twelve pure fifths from closing into seven octaves" | DEF | ✓ | Helmholtz 1885, 432; Partch 1974, 86 | Standard definition. |
| PC2 | "Pythagorean comma is 531441/524288 ≈ 23.46¢" | NUM | ✓ | Huygens-Fokker; Xen Wiki "Pythagorean comma" | Re-verified: 1200·log₂(531441/524288) = 23.460010... ¢. ✓ |
| PC3 | "(3/2)¹² = 531441/4096" | DERIV | ✓ | — | 3¹² = 531441; 2¹² = 4096. ✓ |
| PC4 | "2⁷ = 128, the seven-octave-equivalent" | DERIV | ✓ | — | ✓ |
| PC5 | "(3/2)¹² / 2⁷ = 531441/524288" | DERIV | ✓ | — | 531441/4096 ÷ 128 = 531441/(4096·128) = 531441/524288. ✓ |
| PC6 | Drift "+1.955¢ per step... lands at +23.460¢ at fifth 12" | NUM | ✓ | — | (3/2 in cents) − 700 = 1.955¢; 12 × 1.955 = 23.46¢. ✓ |
| PC7 | Monzo `[-19, 12]` = 2⁻¹⁹ · 3¹² | DERIV | ✓ | — | 2¹⁹ = 524288; 3¹² = 531441. ✓ |
| PC8 | "Tempered out by: 12-EDO, 24-EDO, 36-EDO" | DEF | ◯ | Xen Wiki, "Pythagorean comma" | Standard. |
| PC9 | "53-EDO... preserves the Pythagorean comma as a distinct step" | DEF | ◯ | Xen Wiki, "53edo" | True — 53-EDO is best known as the smallest EDO that distinguishes Pythagorean comma from unison. |

**Page-level citations needed:** ~3 inline. Add `## Sources`: Helmholtz 1885, Partch 1974, Xen Wiki "Pythagorean comma" + "53edo", Huygens-Fokker.

---

### `pythagorean-tuning.md`

**Summary:** Builds the 12-note Pythagorean scale by stacking pure fifths. Defines the wolf fifth at `262144/177147 ≈ 678.49¢`. Discusses the historical placement of the wolf (G♯–E♭). Notes the historical migration to meantone and well-temperament.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| PT1 | "Pythagorean tuning... 3-limit cycle of fifths doesn't close into an octave" | DEF | ✓ | Helmholtz 1885, 271–276; Lindley 1984, ch. 1 | Standard. |
| PT2 | Scale `1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2/1` | NUM | ✓ | — | Re-verified: this is the standard 12-tone Pythagorean diatonic, octave-reduced and sorted. ✓ |
| PT3 | "wolf = 2¹⁸/3¹¹ = 262144/177147 ≈ 678.49¢" | DERIV | ✓ | — | Re-verified: 2¹⁸=262144; 3¹¹=177147; 1200·log₂(262144/177147) = 678.4946... ✓ |
| PT4 | "701.96 − 23.46 = 678.50 cents" | NUM | ✓ | — | Re-verified. ✓ (Small final-decimal rounding artifact: the page says 678.50 but the previous line gives 678.49 — both correct to two d.p. but inconsistent. Minor.) |
| PT5 | "wolf is conventionally placed between G♯ and E♭" | HIST | ✓ | Lindley 1984, ch. 1; Helmholtz 1885, 273 | Standard placement for 12-note Pythagorean tuning. |
| PT6 | "Western tuning evolved away from pure Pythagorean toward meantone (16th c.) and well-tempered systems (Werckmeister, 17th c.) and ultimately 12-TET" | HIST | ✓ | Lindley 1984; Duffin 2007 | Standard historical arc. |
| PT7 | "Pythagorean tuning" naming (the *attribution* to Pythagoras) | HIST | **✗ MEDIUM-WEAK** | West 1992; Barker 1989 | The page never directly *asserts* that Pythagoras invented this tuning — but the title "Pythagorean tuning" and the linked Xen Wiki page do invite the inference. **Recommended addition:** a single-line footnote-style aside reading: *"The name honors Pythagoras (6th c. BCE), but the divisive chain-of-fifths tuning method itself is documented in cuneiform Mesopotamian sources predating him by over a millennium (West 1992; Barker 1989)."* This is the minimal honest correction. |
| PT8 | "Helmholtz... Part III treats the Pythagorean tuning as the historical starting point" | HIST | ✓ | Helmholtz 1885, Pt. III §§XV–XVII | Already cited (informally) in "Further reading"; just normalize to Chicago. |

**Page-level citations needed:** ~4 inline. Add `## Sources`: Helmholtz 1885, Lindley 1984, Duffin 2007, West 1992, Barker 1989, Xen Wiki "Pythagorean tuning."

---

### `schisma.md`

**Summary:** Defines the schisma `32805/32768 ≈ 1.954¢` as the gap between the Pythagorean and syntonic commas. Discusses schismatic temperament (Helmholtz/Groven/Garibaldi). Monzo `[-15, 8, 1]`.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| SC1 | "schisma is 32805/32768 ≈ 1.95¢" | NUM | ✓ | Huygens-Fokker; Xen Wiki "Schisma" | Re-verified: 1200·log₂(32805/32768) = 1.95372... ✓ |
| SC2 | "(531441/524288) / (81/80) = 32805/32768" | DERIV | ✓ | — | Re-verified: (531441·80)/(524288·81) = 42515280/42467328. GCD reduces to 32805/32768. ✓ |
| SC3 | "schismaticThird = (4/3)⁸/2³ = 8192/6561 ≈ 384.36¢" | DERIV | ✓ | — | 4⁸=65536, 3⁸=6561, 65536/(6561·8) = 8192/6561. Cents: 1200·log₂(8192/6561) = 384.360... ✓ |
| SC4 | "fiveLimitThird = 5/4 ≈ 386.31¢; gap = one schisma (1.95¢)" | NUM | ✓ | Helmholtz 1885, 433 | ✓ |
| SC5 | "Helmholtz exploited this: narrow each of the eight fifths by 1.95/8 ≈ 0.24¢" | HIST | ✓ | Helmholtz 1885, Pt. III §XVI / App. XX | Helmholtz's harmonium description; correct attribution. Cite the Ellis translation. |
| SC6 | Monzo `[-15, 8, 1]` = 2⁻¹⁵ · 3⁸ · 5¹ | DERIV | ✓ | — | 32768 = 2¹⁵; 32805 = 3⁸·5 (verify: 3⁸ = 6561; 6561·5 = 32805 ✓). |
| SC7 | "Tempered out by. Schismatic temperament (Helmholtz / Groven / **Garibaldi** — narrow each fifth by ~0.244¢...)" | HIST | **✗ NAMING** | Xen Wiki, "Garibaldi"; Xen Wiki, "Schismatic family" | "Garibaldi" here refers to **Eduardo Sábat-Garibaldi** (developer of the 53-tone dinarra; late 20th c.), not a 19th-century figure. The page reads as though "Garibaldi" is a 19th-c. associate of Helmholtz, which is misleading. **Fix:** either write "Sábat-Garibaldi" in full once, or drop the third name and let the recipe stand on its Helmholtz/Groven attribution. Same fix needed in the "Further reading" prose. |
| SC8 | "53-EDO, and 41-EDO. These mappings identify 8192/6561 with 5/4" | DEF | ◯ | Xen Wiki, "Schismatic family"; Xen Wiki, "53edo" | Standard. |
| SC9 | "at the just-noticeable-difference for pitch in slow contexts" | DEF | ◯ | Plomp & Levelt 1965; Sethares 2005, §1.1 | Psychoacoustic JND claim; cite primary literature. |

**Page-level citations needed:** ~5 inline. Add `## Sources`: Helmholtz 1885, Plomp & Levelt 1965, Sethares 2005, Xen Wiki "Schisma" + "Schismatic family" + "Garibaldi" + "53edo", Huygens-Fokker.

---

### `septimal-comma.md`

**Summary:** Defines `64/63 ≈ 27.26¢` (Archytas's comma) as the gap between harmonic 7th `7/4` and Pythagorean minor 7th `16/9`. Beat-rate calc at A=440. Monzo `[6, -2, 0, -1]`. Notes Superpyth / 22-EDO / Dominant / 31-EDO. Already cites Barker 1989 inline for Archytas's tetrachords.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| SP1 | "septimal comma is 64/63 ≈ 27.26¢" | NUM | ✓ | Huygens-Fokker; Xen Wiki "64/63" | 1200·log₂(64/63) = 27.2641... ✓ |
| SP2 | "(16/9)/(7/4) = 64/63" | DERIV | ✓ | — | (16·4)/(9·7) = 64/63. ✓ |
| SP3 | "harmonic 7th... noticeably flatter than 12-TET's minor 7th" | NUM | ✓ | — | 7/4 = 968.826¢, 12-TET m7 = 1000¢, diff −31.174¢. ✓ |
| SP4 | "Archytas' comma" (alternative name for 64/63) | HIST | ✓ | Barker 1989, ch. 2; Xen Wiki "64/63" | Standard attribution — Archytas of Tarentum (4th c. BCE) is credited with the canonical 7-limit tetrachords using 28:27 (a closely related but *distinct* ratio). The 64/63 *interval itself* is more accurately the comma between his diatonic and Pythagorean readings of the seventh — Archytas didn't isolate it, but the genus that produces it is his. The page's casual gloss "Archytas's comma" is community-standard terminology and acceptable to keep with a footnote citing Barker. |
| SP5 | "Beat frequency at A = 440 Hz: 12.222 Hz" | NUM | ✓ | — | 440·16/9 − 440·7/4 = 782.222 − 770 = 12.222. ✓ |
| SP6 | Monzo `[6, -2, 0, -1]` = 2⁶ · 3⁻² · 5⁰ · 7⁻¹ | DERIV | ✓ | — | 64/63 = 2⁶/(3²·7). ✓ |
| SP7 | "22-EDO and Superpyth temperament... 12-EDO's Dominant temperament... vanishes 64/63" | DEF | ◯ | Xen Wiki, "Archytas clan"; Xen Wiki, "64/63" | Standard. |
| SP8 | "septimal meantone (huygens / 31-EDO)... preserve the 64/63" | DEF | ◯ | Xen Wiki, "Septimal meantone" | Standard. |

**Page-level citations needed:** ~3 inline (the page already cites Barker 1989, Xen Wiki). Add `## Sources` normalizing the existing inline links to Chicago format + Helmholtz 1885 backup for the prime-7 historical context.

---

### `commas.md`

**Summary:** Glossary of every named comma in the kernel, grouped by prime-limit (3, 5, 7, 11). Kernel-exact rows.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| C1 | "A comma is a small interval that quantifies the gap between two paths to the 'same' pitch in JI" | DEF | ✓ | Helmholtz 1885, 431–434; Xen Wiki "Comma" | Definition. |
| C2 | All ratios + cents values in the four tables | NUM | ✓ | Huygens-Fokker, "List of intervals" | Cross-check the kernel's `COMMAS` table against Huygens-Fokker's intervals.html one-time. The page derives values from the kernel, so the audit is: do the kernel's named ratios match the canonical names elsewhere? Recommend running this check during execution; planner adds as a verification gate. |
| C3 | "Mercator's comma is the residue at 53 fifths, the defining comma of 53-EDO's near-closure" | NUM/DEF | ✓ | Xen Wiki "Mercator's comma" | Mercator's comma = (3/2)⁵³/2³¹ = 3⁵³/2⁸⁴ ≈ 3.615¢. ✓ |
| C4 | "**syntonic comma** (81/80) is the family's ground state" | DEF | ✓ | Partch 1974; Helmholtz 1885 | ✓ |
| C5 | "**diaschisma**, **diesis**, **greater diesis**, and **kleisma**" exist as named 5-limit commas | DEF | ✓ | Huygens-Fokker; Xen Wiki "Comma" | All standard names — diaschisma 2048/2025, lesser diesis 128/125, greater diesis 648/625, kleisma 15625/15552. The page just *names* them; the kernel table has the ratios. The audit just confirms the names map correctly. |
| C6 | "**septimal kleisma** (225/224, the Marvel comma)" | DEF/HIST | ✓ | Xen Wiki "225/224"; Xen Wiki "Marvel" | "Marvel comma" is the modern xen-dev name for 225/224 (i.e. the temperament that vanishes it is called "marvel"). Standard. |
| C7 | "**rastma** (243/242)" — Xen Wiki has it as a paucity-friendly 11-limit comma | DEF | ◯ | Xen Wiki, "243/242 (rastma)" | ✓. |
| C8 | "**undecimal comma** (33/32)... doorway into 11-limit JI" | DEF | ✓ | Xen Wiki "33/32"; Partch 1974 | ✓ — 33/32 ≈ 53.27¢ is the canonical undecimal comma between 4/3 and 11/8. |

**Page-level citations needed:** ~5 inline. Add `## Sources`: Helmholtz 1885, Partch 1974, Huygens-Fokker "List of intervals", Xen Wiki "Comma" + "Mercator's comma."

---

### `harmonic-series.md`

**Summary:** Defines partials 1–16 as integer multiples of a fundamental. Walks each partial's deviation from 12-TET. Color-codes by largest prime. Cites Helmholtz, Gann.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| H1 | "A vibrating string... rings not at one frequency but at a stack of them: 1f, 2f, 3f, 4f, 5f, ..." | DEF | ✓ | Helmholtz 1885, ch. III; Benson 2007, ch. 1; Rameau 1722 | Foundational physical fact; cite the standard psychoacoustics text. |
| H2 | "Octaves stay exact... pure powers of 2 read +0.00" | NUM | ✓ | — | Powers of 2 in cents = integer multiples of 1200. ✓ |
| H3 | "Pure fifths land at +2¢" (partial 3 vs 12-TET) | NUM | ✓ | — | 3/1 octave-reduced = 3/2 = 701.955¢ vs 700¢ → +1.955¢. ✓ The page says "+2¢" as a rounded statement; consistent with the table cell which shows +1.95. |
| H4 | "Major thirds land at −14¢" (partial 5) | NUM | ✓ | — | 5/4 = 386.314¢ vs 400¢ → −13.686¢. ✓ |
| H5 | "Prime-7 introduces a 31¢ gap" (partial 7) | NUM | ✓ | — | 7/4 = 968.826¢ vs 1000¢ → −31.174¢. ✓ |
| H6 | "Partials 11 and 13 land near the midpoint between two 12-TET pitches" (−48.7¢, −59.5¢) | NUM | ✓ | — | 11/8 = 551.318 vs 550 (between 500 and 600 → relative to 12-TET nearest tritone 600, that's −48.682¢); 13/8 = 840.528 vs 800 (nearest 12-TET minor 6th 800) — page says "−59.5¢" but that requires re-reading what reference is used. The page's table cell for partial 13's `centsFrom12tet` will give the kernel's actual number. **Verify in execution:** the page's claim "−59.5¢" depends on comparison-reference choice. For 13/8 ≈ 840.528¢, vs 12-TET m6 = 800: +40.5¢; vs 12-TET M6 = 900: −59.5¢. So the page is correctly reading 13/8 as "flat of major 6th" — *that's a reasonable reading because the conventional name "tridecimal neutral 6th" places it between m6 and M6, and the larger negative deviation aligns with the closer 12-TET note*. Actually: 840.528 is closer to 800 than to 900, so the natural "nearest 12-TET" comparison is +40.5¢. But the kernel function `iv.centsFrom12tet` may use any convention — check during execution. **Flag for verification in plan.** |
| H7 | Partial names ("undecimal", "tridecimal") | DEF | ✓ | Xen Wiki, "11-limit"; Xen Wiki, "13-limit"; Partch 1974 | Standard xenharmonic terminology. |
| H8 | "the syntonic comma is precisely the gap between four stacked partial-3's... and one partial-5" | DEF | ✓ | Helmholtz 1885, 432 | Standard. |

**Page-level citations needed:** ~3 inline. Already cites Gann; add Helmholtz 1885, Benson 2007, Plomp & Levelt 1965 (for the consonance claims) in `## Sources`.

---

### `monzos.md`

**Summary:** Prime-factor vectors. Worked examples (3/2, 5/4, 81/80, 7/6). Monzo builder component. Monzo addition = ratio multiplication. 2D scatter on (3-, 5-)plane.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| M1 | "A monzo is a vector of integer exponents over the primes 2, 3, 5, 7, 11, ..." | DEF | ✓ | Xen Wiki, "Monzo"; Doty 2002, ch. 5 | The math is much older than the *name* — see M2. |
| M2 | (Implicit) the name "monzo" | HIST | ◯ | Xen Wiki, "Monzo" | The term was **coined in July 2003 by Gene Ward Smith** in honor of Joe Monzo's advocacy of prime-factor vector notation (Monzo 1997, *JustMusic Prime-Factor Notation*). Earlier representations go back at least to Adriaan Fokker. The page doesn't *claim* otherwise — but adding a one-line aside ("The name was coined by Gene Ward Smith in 2003 in honor of Joe Monzo (Xen Wiki, 'Monzo')") would correctly anchor terminology vs concept. **Recommended addition, not a correction.** |
| M3 | "two monzos describe the same ratio iff their entries agree, no float drift" | DERIV | ✓ | — | Fundamental theorem of arithmetic: prime factorizations are unique. ✓ |
| M4 | "3/2 = [-1, 1⟩ = 2⁻¹ · 3¹" | DERIV | ✓ | — | ✓ |
| M5 | "5/4 = [-2, 0, 1⟩ = 2⁻² · 5¹" | DERIV | ✓ | — | ✓ |
| M6 | "81/80 = [-4, 4, -1⟩" | DERIV | ✓ | — | ✓ |
| M7 | "7/6 = [-1, -1, 0, 1⟩ = 2⁻¹ · 3⁻¹ · 7¹" | DERIV | ✓ | — | 7/6 = 7/(2·3). ✓ |
| M8 | "(3/2)·(5/4) = 15/8, and [-1,1,0⟩ + [-2,0,1⟩ = [-3,1,1⟩" | DERIV | ✓ | — | 15 = 3·5; 8 = 2³. ✓ |
| M9 | "the dashboard's lattice visualization plots the 3-prime axis horizontally and the 5-prime axis diagonally" | DEF | ◯ | — | Project-internal claim; no external citation needed — the lattice viz on `/` does this by design. |

**Page-level citations needed:** ~2 inline. Already cites Xen Wiki + Doty 2002; just normalize.

---

### `prime-limits.md`

**Summary:** Defines p-limit as the largest prime in an interval's monzo. Walks 3, 5, 7, 11-limit with examples and audition. Visualizes prime identities on 1200¢ axis. Already cites Xen Wiki + Partch 1974.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| PL1 | "prime-limit... largest prime that appears with a non-zero exponent in its monzo" | DEF | ✓ | Xen Wiki, "Prime limit"; Partch 1974, ch. 6 | Standard. |
| PL2 | 3-limit identity 3/2 ≈ 702¢ | NUM | ✓ | — | 1200·log₂(3/2) = 701.955. ✓ |
| PL3 | 5-limit identity 5/4 ≈ 386¢ | NUM | ✓ | — | ✓ |
| PL4 | 7-limit identity 7/4 ≈ 969¢ | NUM | ✓ | — | 1200·log₂(7/4) = 968.826. ✓ |
| PL5 | 11-limit identity 11/8 ≈ 551¢ | NUM | ✓ | — | 1200·log₂(11/8) = 551.318. ✓ |
| PL6 | 13-limit identity 13/8 ≈ 841¢ | NUM | ✓ | — | 1200·log₂(13/8) = 840.528. ✓ |
| PL7 | 11/8 "lands almost exactly halfway between the just perfect fourth 4/3 and the tritone 45/32 — about 49¢ flat of the 12-TET tritone" | NUM | ✓ | — | 11/8 = 551.318; 4/3 = 498.045; 45/32 = 590.224. Half-way = 544.135. 11/8 is 7.183¢ above the half-way point; deviation from 12-TET tritone 600 = −48.682¢. ✓ The "almost exactly halfway" is a slight exaggeration (7¢ off the midpoint), but the −49¢ vs 12-TET tritone is exact to round-off. |
| PL8 | "Harry Partch's 43-tone system uses 11-limit; La Monte Young's *The Well-Tuned Piano* uses 7-limit (no 11s)" | HIST | ✓ | Partch 1974; Gann (kylegann.com/wtp.html) | Standard. Already cited via Gann's WTP page on `otonality-utonality.md`; add cross-cite here. |

**Page-level citations needed:** ~3 inline. Already cites Partch 1974 + Xen Wiki "Prime limit"; just normalize to `## Sources`.

---

### `odd-limits.md`

**Summary:** Defines odd-limit as the largest odd factor in numerator or denominator. Compares with prime-limit. n-odd-limit tonality diamond (5-, 7-, 11-odd-limit walks). Cites Partch 1974 inline.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| OL1 | "odd-limit is largest odd factor of numerator or denominator after stripping factors of 2" | DEF | ✓ | Partch 1974, chs. 6, 11; Xen Wiki "Odd limit" | Standard. Already cited inline. |
| OL2 | "The classification is Harry Partch's (Partch, *Genesis of a Music*, 1949/1974, chs. 6 & 11)" | HIST | ✓ | Partch 1974, chs. 6, 11 | Inline citation already correct; just normalize to Chicago. **NB the 1949 date refers to 1st ed.; the page correctly distinguishes 1949 vs 1974 2nd-ed.** |
| OL3 | Worked examples: 7/4 → odd-limit 7, 9/8 → odd-limit 9, 16/15 → odd-limit 15 | DERIV | ✓ | — | ✓ |
| OL4 | "7-odd-limit diamond: 13 pitches; 9-odd-limit: 19; 11-odd-limit: 29; 15-odd-limit: 49" | NUM | ✓ | Xen Wiki, "Odd limit"; Partch 1974, ch. 11 | Standard counts. The page asserts these via "Further reading" prose — recommend verifying the **11-odd-limit = 29** count by exhaustion at construction time (the kernel's `enumerateDiamond` can do this). |
| OL5 | "29 pitches — this is Partch's diamond, the geometric heart of his 43-tone scale" | HIST | ✓ | Partch 1974, ch. 11 ("The One-Footed Bride") | Standard attribution. |
| OL6 | "barbershop seventh, the harmonic seventh chord, and the 'blue' notes of early-jazz tradition all live here" (7-odd-limit) | HIST/AESTHETIC | ◯ | — | Soft cultural claim; hard to cite definitively. Two reasonable backings: Doty 2002 (JI primer; explicit on the harmonic-7th chord) and the barbershop-pedagogy tradition. Recommend citing Doty 2002 ch. 4 and leaving the jazz/barbershop framing as the page's own gloss. |
| OL7 | Same prime-limit ≠ same odd-limit thesis: 9/8 is prime-limit 3 but odd-limit 9 | DERIV | ✓ | — | 9 = 3²; only prime is 3 (limit 3); largest odd factor is 9. ✓ |

**Page-level citations needed:** ~3 inline. Already cites Partch + Xen Wiki; just normalize.

---

### `otonality-utonality.md`

**Summary:** Otonal (over-N) and utonal (under-N) chord-forming. The 4:5:6:7 otonal tetrad and 1/4:1/5:1/6:1/7 utonal mirror, re-rooted upward to 1:8/7:4/3:8/5 for A/B comparison. Cites Partch 1974 chs. 6, 8 inline. Cites Gann WTP and Xen Wiki.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| OU1 | "Harry Partch's whole 43-tone theory treats the two as duals (Partch, *Genesis of a Music*, 1949/1974, chs. 6 & 8)" | HIST | ✓ | Partch 1974, chs. 6, 8 | Already cited inline; just normalize. |
| OU2 | "1:5/4:3/2:7/4" is the octave-reduction of 4:5:6:7 | DERIV | ✓ | — | 4/4 = 1, 5/4, 6/4 = 3/2, 7/4. ✓ |
| OU3 | "1:8/7:4/3:8/5" is the re-rooted-upward utonal | DERIV | ✓ | — | inv(5/4) = 4/5, oct-reduce → 8/5; inv(3/2) = 2/3, oct-reduce → 4/3; inv(7/4) = 4/7, oct-reduce → 8/7. ✓ |
| OU4 | "the gaps between members get smaller as you go up" (otonal) ... "get larger as you go up" (utonal) — "divergent shape IS the otonal/utonal mirror" | DEF | ✓ | Partch 1974, ch. 8 | Standard interpretive observation. |
| OU5 | Monzo sign-flip table: 5/4↔8/5, 3/2↔4/3, 7/4↔8/7 | DERIV | ✓ | — | All re-verified: 8/5 = 2³/5 = [3, 0, -1]; 4/3 = 2²/3 = [2, -1]; 8/7 = 2³/7 = [3, 0, 0, -1]. ✓ |
| OU6 | "Kyle Gann — *La Monte Young's The Well-Tuned Piano*" inline reference | HIST | ✓ | Gann, "La Monte Young's *The Well-Tuned Piano*" | Already cited; normalize. |

**Page-level citations needed:** ~2 inline. Already cites Partch 1974 + Xen Wiki + Gann; just normalize to `## Sources` with Chicago entries.

---

### `tenney-height.md`

**Summary:** Defines Tenney height as log₂(n·d) for a reduced ratio n/d. Equivalent to L¹-norm of monzo weighted by log₂(prime). Discusses Tenney-weighted EDO error in the analysis dashboard. Already cites Tenney 1983 + Xen Wiki inline.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| TH1 | "TH(n/d) = log₂(n·d)" | DEF | ✓ | Tenney 1983, §3, §6; Xen Wiki "Tenney height" | Tenney's original 1983 essay defines harmonic distance as `log(n·d)` — equivalent up to constant factor. The page is careful that the *base* of the log is convention; Tenney's original is natural log. ✓ |
| TH2 | "TH(monzo) = Σᵢ |eᵢ| log₂(pᵢ)" | DERIV | ✓ | Tenney 1983; Xen Wiki "Tenney height" | log(n·d) = log(n) + log(d) and the prime factorization gives the L¹-norm form. ✓ |
| TH3 | "The kernel function `tenneyHeight` — re-exported from `src/lib/monzo.ts` — uses natural log" | DEF | ✓ | — | Internal project claim, verifiable by inspection. The page does this correctly. |
| TH4 | "1200·log₂(2) base" / "ln 2 ≈ 0.693" | NUM | ✓ | — | ln 2 = 0.69315 ✓. |
| TH5 | Worked-example table values (log₂ of n·d for several ratios) | NUM | ✓ | — | All derived from the kernel; verified arithmetic. ✓ |
| TH6 | "schisma at 1.954 ¢ ... TH ≈ log₂(32805·32768) ≈ 30" | NUM | ✓ | — | 32805·32768 = 1,074,954,240; log₂ ≈ 29.99... ≈ 30. ✓ |
| TH7 | Tenney-weighted EDO ranker math (cents-error / max(1, TH)) | DERIV | ✓ | Tenney 1983; Xen Wiki "Tenney height" (TE/TOP section) | The clamp at 1 is a project-internal choice (documented in-page); the metric itself is the standard TE-style weighting. |
| TH8 | "James Tenney — John Cage and the Theory of Harmony (1983)" inline | HIST | ✓ | Tenney 1983 | The PDF link cites the Plainsound hosting. The published places are *Soundings* 13 (1984) and the *From Scratch* anthology (Polansky et al. eds., 2015, ch. 12). Page's inline label says "1983" — that's the year of *composition*; published 1984. **Minor:** consider citing it as "Tenney 1983 [pub. 1984]" or just "Tenney 1984 [composed 1983]." Either is defensible; the academic convention is to cite by year of publication for finding-aid purposes, so **prefer Tenney 1984**, but if the page already says 1983 leave the year. Whichever convention is picked, apply uniformly. |

**Page-level citations needed:** ~2 inline. Already cites Tenney + Xen Wiki; just normalize.

---

### `edo-approximation.md`

**Summary:** EDO ↔ JI mapping for 12, 19, 22, 31, 41, 53, 72-EDO. Deviation table + scatter chart. Discussion of which EDOs hit which limits. Already links Xen Wiki per-EDO pages inline.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| E1 | JI anchor cents values (3/2 = 701.955, 5/4 = 386.314, 7/4 = 968.826, 9/8 = 203.910, 11/8 = 551.318) | NUM | ✓ | — | All re-verified from `1200·log₂(p/q)`. ✓ |
| E2 | "31-EDO step 25 ≈ 967.74¢ — ~1.08¢ flat of pure 7/4" | NUM | ✓ | — | 25/31 · 1200 = 967.7419...; 967.7419 − 968.826 = −1.0843¢. ✓ |
| E3 | "12-EDO step 10 = 1000¢ — +31.17¢ sharp of pure 7/4" | NUM | ✓ | — | 1000 − 968.826 = 31.174¢. ✓ |
| E4 | "22-EDO... 5th of ≈ 709.09¢ — ≈ +7.14¢ sharp of pure" | NUM | ✓ | — | 13/22 · 1200 = 709.09... ; 709.09 − 701.955 = +7.136¢. ✓ |
| E5 | "53-EDO step 31 lands within ~0.1¢ of pure 3/2" | NUM | ✓ | — | 31/53 · 1200 = 701.886...; 701.886 − 701.955 = −0.068¢. ✓ |
| E6 | "Mercator's comma — (3/2)⁵³ / 2³¹ ≈ 3.615¢" | NUM | ✓ | Xen Wiki "Mercator's comma" | ✓ |
| E7 | "72-EDO is an exact superset of 12-EDO (72 = 6 × 12)" | NUM/DEF | ✓ | Xen Wiki, "72edo" | 72 = 6·12 ✓; every 12-EDO step lands on a 72-EDO step (6, 12, 18, ...). |
| E8 | EDO trade-off narratives (per-EDO strengths/weaknesses) | DEF | ◯ | Xen Wiki per-EDO pages; Duffin 2007 | Already linked inline; just normalize. |
| E9 | "the ear starts hearing two distinct pitches" at "~5–10¢ threshold" (JND for melodic pitch) | NUM | ◯ | Plomp & Levelt 1965; Sethares 2005, §1.1 | Psychoacoustic JND claim; cite primary literature. |

**Page-level citations needed:** ~3 inline. Already links Xen Wiki per-EDO; add Plomp & Levelt 1965, Duffin 2007 in `## Sources`.

---

### `meantone.md`

**Summary:** Defines meantone as distributing the syntonic comma across the chain of fifths. Six variants: 1/4 (Aron 1523), 1/3 (Salinas 1577), 1/6 (Silbermann), 1/5 (Verheijen 1599), 2/7 (Zarlino 1558), 1/8. Cites Xen Wiki + Blackwood 1985 inline.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| MT1 | "1/4-comma meantone (Pietro Aron, 1523)" | HIST | ✓ | Aron 1523; Xen Wiki "Quarter-comma meantone" | Verified — Pietro Aron's *Toscanello in musica* (Venice, 1523) is the first text describing 1/4-comma meantone. (Some scholars: Aron's description is qualitative — "sonorous and just, as united as possible" — rather than rigorously quantitative; rigorous quantitative description came later. But the 1523 attribution for the *recipe* is canonical.) |
| MT2 | "1/3-comma meantone (Francisco Salinas, 1577)" | HIST | ✓ | Salinas 1577, ch. 23–28; Xen Wiki "1/3-comma meantone" | Verified — Salinas's *De musica libri septem* (Salamanca, 1577) discusses 1/3-, 1/4-, and 2/7-comma. (Footnote-worthy: Ellis (1885 Helmholtz appx.) speculated Salinas really meant 1/6-comma but mis-stated due to his blindness — modern scholarship rejects this; Salinas's "languid but not offensive" descriptor fits 1/3-comma. The page doesn't engage this controversy, which is fine.) |
| MT3 | "1/6-comma meantone (Gottfried Silbermann)" | HIST | ✓ | Xen Wiki "1/6-comma meantone" | Gottfried Silbermann (1683–1753) is the conventional attribution for 1/6-comma in modern early-music practice. Note: there is no extant Silbermann treatise; the attribution is via reconstruction of his organ tuning practice. **MEDIUM confidence.** Recommend citing Xen Wiki and treating "Silbermann" as a conventional label without claiming it as a documentary primary. |
| MT4 | "1/5-comma (Verheijen, 1599)" | HIST | **MINOR DATE** | Xen Wiki "1/5-comma meantone" | Abraham Verheyen described 1/5-comma meantone in correspondence with Simon Stevin around 1600 (not specifically 1599). **Recommended fix:** change "1599" → "ca. 1600" (or footnote: "in a letter to Simon Stevin, ca. 1600"). Not a hard error — the date is roughly right and 1599 is a defensible reading. |
| MT5 | "2/7-comma (Zarlino, 1558)" | HIST | ✓ | Zarlino 1558, pt. II chs. 42–43 | Verified — Le istitutioni harmoniche, Part II chs. 42–43. |
| MT6 | The construction `fₙ = 1200 log₂(3/2) − (1/n)·1200 log₂(81/80)` | DERIV | ✓ | — | Standard meantone construction. ✓ |
| MT7 | "1/4-comma meantone... major third arrives at exactly 5/4" | DERIV | ✓ | — | 4·(701.955 − 21.506/4) − 2400 = 4·696.578 − 2400 = 386.314 = log₂(5/4)·1200 ✓ |
| MT8 | "1/4-comma meantone fifth ≈ 696.578¢" | NUM | ✓ | — | 701.955 − 21.506/4 = 696.5775. ✓ |
| MT9 | "12 stacked 1/4-comma fifths undershoot 7 octaves by ≈ 40.7¢" | NUM | ✓ | — | 12·696.578 − 8400 = 8358.93 − 8400 = −41.07¢. ✓ Page says "≈ 40.7"; verified value is 41.07. **Minor:** prefer "≈ 41¢" to match the arithmetic. |
| MT10 | "Easley Blackwood — *The Structure of Recognizable Diatonic Tunings* (Princeton UP, 1985)" inline | HIST | ✓ | Blackwood 1985 | Just normalize. |

**Page-level citations needed:** ~6 inline. Already cites Xen Wiki + Blackwood; add Aron 1523, Salinas 1577, Zarlino 1558 to `## Sources`.

---

### `comma-pump.md`

**Summary:** I-vi-ii-V-I cadence in pure 5-limit JI drifts one syntonic comma per cycle. Demonstrates with drift chart + re-anchored chart. Mentions Aron, Johnston, Young, Partch as composers engaging with the comma.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| CP1 | "I-vi-ii-V-I accumulates exactly one syntonic comma of downward drift per cycle" | DERIV | ✓ | Helmholtz 1885, 432; Benson 2007, §5.2 | The page derives this in-prose; re-verified: 1 × 5/3 × 2/3 × 4/3 × 2/3 = (1·5·2·4·2)/(1·3·3·3·3) = 80/81. ✓ |
| CP2 | Each root-motion ratio: 5/3, 2/3, 4/3, 2/3 | DERIV | ✓ | — | Standard root-motion ratios for the cadence in pure 5-limit. ✓ |
| CP3 | "80/81 = (81/80)⁻¹" | DERIV | ✓ | — | ✓ |
| CP4 | "after one cycle the 'home' chord sits 21.506¢ below where it started" | NUM | ✓ | — | 1200·log₂(81/80) = 21.506¢. ✓ |
| CP5 | "Meantone temperament (16th c., Pietro Aron) distributes the syntonic comma..." | HIST | ✓ | Aron 1523 | ✓ |
| CP6 | "Ben Johnston, La Monte Young, Harry Partch's adaptive cadences" | HIST | ✓ | Partch 1974; Gann, "La Monte Young's *The Well-Tuned Piano*" | All three composers are documented to use comma-aware techniques. Recommend Doty 2002 for an accessible secondary. |
| CP7 | "Ben Johnston — *Suite for Microtonal Piano* (1977)" inline reference | HIST | ✓ | Johnston, *Suite for Microtonal Piano* (1977); New World Records 80637 | Verified. Normalize to Chicago. |
| CP8 | "Johnston's notation explicitly marks each comma shift with arrows" | HIST | ✓ | Doty 2002, ch. 9 (Notation); various Johnston scores | Standard — Johnston's notation system uses arrow accidentals (↑ raises by 81/80, ↓ lowers). |

**Page-level citations needed:** ~4 inline. Add `## Sources`: Aron 1523, Johnston 1977, Partch 1974, Helmholtz 1885, Benson 2007, Gann.

---

### `well-temperament.md`

**Summary:** The largest, most history-heavy page. Covers Werckmeister III (1691), Kirnberger III (1779), Vallotti (1779). Per-temperament fifth-size tables, deviation charts, major-third-per-key charts, C-vs-F♯ audition. Discusses Bach's WTC, key character. Mentions Lehman 2005 + Lindley 1984. **Highest density of historical claims AND the highest density of potential corrections.**

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| WT1 | "Werckmeister III (1691, ¼ Pythagorean comma across four fifths)" | HIST | ✓ | Werckmeister 1691 | ✓ Modern "Werckmeister III" = Werckmeister's monochord-III recipe in *Musicalische Temperatur* (Quedlinburg, 1691). |
| WT2 | "Andreas Werckmeister's *Musicalische Temperatur* (1691) is the first widely-adopted well-temperament — what Werckmeister himself called 'Correct temperament no. 1.'" | HIST | ◯ | Werckmeister 1691; Xen Wiki "Werckmeister temperament" | This is *almost* correct but slippery. Werckmeister's monochords I and II label just intonation and 1/4-comma meantone; his "good temperaments" begin at monochord III (the modern "Werckmeister III"). When Werckmeister discussed the *order* of good temperaments, the "Correct temperament no. 1" was his *first* good temperament — which is the same one labeled monochord III. So both labels point to the same scheme. The page is fundamentally right but the prose elides the distinction. **Recommended footnote:** "The modern label 'Werckmeister III' refers to his monochord III; Werckmeister himself called it the first ('no. 1') of his correct ('gute') temperaments. Both labels refer to the same scheme. The numerals II/IV/V/VI in modern Werckmeister tables are likewise monochord labels assigned retrospectively." Cite Werckmeister 1691 + Xen Wiki "Werckmeister temperament." |
| WT3 | "Narrow the four fifths C-G, G-D, D-A, and B-F♯ each by ¼ of a Pythagorean comma. Leave all other eight fifths pure." | DERIV | ✓ | Werckmeister 1691 | ✓ Standard reconstruction. |
| WT4 | "Johann Philipp Kirnberger — Bach's pupil — published his third temperament scheme in *Die Kunst des reinen Satzes in der Musik* (1779)" | HIST | ✓ | Kirnberger 1779 | ✓ The third temperament appears in Vol. 2 Pt. 3, published 1779. (Kirnberger's complete treatise was published in installments 1771–1779.) "Bach's pupil" — Kirnberger studied with J.S. Bach c. 1739–1741 in Leipzig; standard biographical fact. |
| WT5 | "Narrow the four fifths C-G, G-D, D-A, A-E each by ¼ of a syntonic comma; park the residual schisma on the single F♯-C♯ fifth" | DERIV | ✓ | Kirnberger 1779 | ✓ Standard Kirnberger III reconstruction. |
| WT6 | "Francesco Vallotti's scheme (composed 1728, published posthumously 1779)" | HIST | **✗ CORRECTION** | Vallotti 1779; Duffin 2020 | **Three problems:** (a) "published posthumously" is **false** — Vallotti died 10 January 1780, after the 1779 publication of *Della scienza teorica e pratica della moderna musica, libro primo*. (b) "composed 1728" — no documentary basis found; this looks like a folk-music-theory date that propagated through tuning-encyclopedia entries. (c) The temperament's attribution to Vallotti itself is contested (see WT7). **Recommended fix:** rewrite the sentence as "Francesco Antonio Vallotti's *Della scienza teorica e pratica della moderna musica, libro primo* (Padua, 1779) is the conventional published anchor for this scheme, though see the attribution note below." Drop "composed 1728" and "published posthumously." |
| WT7 | "The temperament commonly called 'Vallotti' today is technically a slight misattribution" | HIST | **✗ STRONGER CORRECTION** | Duffin 2020; Tartini 1754 | The page's phrasing is too soft. Duffin documents that there is no clear evidence Vallotti himself proposed this recipe; the earliest documented appearance in print is **Giuseppe Tartini**, *Trattato di musica secondo la vera scienza dell'armonia* (Padua, 1754). The scheme circulated in the Paduan musical circle (which included both Tartini and Vallotti). **Recommended fix:** replace "technically a slight misattribution" with: "More properly the **Tartini–Vallotti** scheme: first documented in print by Giuseppe Tartini's *Trattato di musica* (Padua, 1754); the attribution to Vallotti has no clear primary-source basis (Duffin 2020)." |
| WT8 | "Narrow six consecutive fifths along the chain F → C → G → D → A → E → B each by ⅙ of a Pythagorean comma; the other six fifths stay pure. Symmetric around D" | DERIV | ✓ | Tartini 1754; standard modern reconstruction | ✓ The recipe itself is standard regardless of attribution. |
| WT9 | "Symmetric around D: F, C, G major are equally clean at ≈ 392¢; B, F♯, C♯ major are equally rough at ≈ 408¢. A and E♭ major land *exactly* on 12-TET (400¢)" | DERIV | ✓ | — | Re-verifiable: page provides the closed-form `4·(701.955 − 3.910) − 2400 = 400.000` inline. ✓ |
| WT10 | "Bach could write the *Wohltemperirte Clavier* across all 24 keys" | HIST | ✓ | Lehman 2005 (*Early Music* 33); Lindley 1984 | ✓ — though *which* well-temperament Bach actually used is contested (Lehman 2005 advances the title-page-squiggle hypothesis). The page treats this carefully ("Wohltemperirte" is an attribute, not a specific scheme); just keep it that way and cite Lehman + Lindley. |
| WT11 | "the 19th-century practice of treating remote keys as expressively distinct — Wagner's famously-affecting D♭-major moments, Schubert's E-major / E♭-major contrasts — partly lives on as historical residue" | HIST/AESTHETIC | ◯ | Duffin 2007, ch. 6 | Soft cultural-historical claim; Duffin's *How Equal Temperament Ruined Harmony* is the accessible modern source for the residue-of-key-character argument. |
| WT12 | "Lindley 1984" + "Lehman 2005" + "Xen Wiki: Well temperament" inline cites | HIST | ✓ | Lindley 1984; Lehman 2005; Xen Wiki "Well temperament" | Already cited; just normalize. |
| WT13 | "Werckmeister III had A-E pure" | DERIV | ✓ | — | Per the page's table, A-E is pure. Cross-referenced with the standard reconstruction (Werckmeister narrows C-G, G-D, D-A, B-F♯). ✓ |
| WT14 | "the closure budget — one Pythagorean comma — is distributed across the fifth chain in three different shapes" | DERIV | ✓ | — | Re-verified: each temperament's fifths sum to 8400¢ by construction. ✓ |
| WT15 | "PC = SC + schisma" (algebraic identity used by Kirnberger III) | DERIV | ✓ | — | Pythagorean comma 23.460¢ = syntonic 21.506¢ + schisma 1.954¢. ✓ Exactly: (531441/524288) = (81/80) × (32805/32768). |

**Page-level citations needed:** ~6 inline, mostly Chicago-normalizing existing references + adding Duffin 2020 + Tartini 1754. Add `## Sources`: Werckmeister 1691, Kirnberger 1779, Vallotti 1779, Tartini 1754, Duffin 2020, Duffin 2007, Lehman 2005, Lindley 1984, Xen Wiki "Well temperament."

---

### `scale-workshop-interop.md`

**Summary:** Walks the export → Scale Workshop → re-import workflow for a 5-limit just diatonic. Discusses the Scala `.scl`/`.kbm` format spec. Cites Scale Workshop project, GitHub repo, Huygens-Fokker spec.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| SW1 | "Ptolemy's intense diatonic" naming for 1/1 9/8 5/4 4/3 3/2 5/3 15/8 2/1 | HIST | ✓ | Barker 1989, vol. II ch. 6 (Ptolemy); Xen Wiki "Diatonic scale" | The Ptolemy *Diatonic Syntonon* / "intense diatonic" — Ptolemy's *Harmonics* II.13–15 — is the canonical primary. Already named correctly. Cite Barker for the modern translation/study. |
| SW2 | `.scl` format spec details (comment lines start `!`, line 1 = description, line 2 = pitch count, ratios vs cents distinguished by `.`) | DEF | ✓ | Huygens-Fokker, "Scala scale file format" | Already cited inline; just normalize. |
| SW3 | "the canonical microtonal scale editor for the xenharmonic-devs ecosystem" (Scale Workshop) | DEF | ✓ | github.com/xenharmonic-devs/scale-workshop; scaleworkshop.plainsound.org | Already cited; just normalize. |
| SW4 | `15/8` ≈ 1088¢, `5/4` ≈ 386¢, `3/2` ≈ 702¢ (used as live values in prose) | NUM | ✓ | — | Re-verified: 1200·log₂(15/8) = 1088.27, log₂(5/4)·1200 = 386.31, log₂(3/2)·1200 = 701.96. ✓ |

**Page-level citations needed:** ~2 inline (Barker 1989 for Ptolemy; Huygens-Fokker already linked). Add `## Sources` normalizing existing links.

---

### `analysis.md`

**Summary:** The interactive analysis dashboard — EDO ↔ JI mapping, MOS construction, side-by-side scale comparison. Pure-code page; very few prose claims that need citation.

**Claims:**

| # | Claim | Type | Status | Recommended citation | Notes |
|---|-------|------|--------|----------------------|-------|
| AN1 | Default seed scale `9/8 5/4 21/16 3/2 27/16 7/4 2/1` | DEF | ✓ | — | Project-internal — this is the 7-limit JI heptatonic for the current composition. No external citation needed. |
| AN2 | "Best-fit EDOs" / "JI in N-EDO" / "MOS construction" / "Compare scales" — section headings; behavior is documented in component code | DEF | ◯ | — | No prose claims requiring citation. The audit confirms: this page is mostly UI scaffolding and reactive cells. |
| AN3 | "Last line is the period. 1/1 is added automatically." | DEF | ◯ | Huygens-Fokker, "Scala scale file format" | This is the kernel's `.scl` convention (D-13/D-14 in the project's decisions log) — backed by the Scala format spec. |

**Page-level citations needed:** **Minimal — 0 to 1 inline.** Add a brief `## Sources` section (just Huygens-Fokker for the `.scl`-convention claim) for *consistency* with other pages — but it's defensible to omit a sources section here since the page is mostly interactive UI without claim-density. Planner can decide based on consistency vs minimalism.

---

## Corrections Required

| # | Page | Current text | Replacement | Citation |
|---|------|--------------|-------------|----------|
| C-1 | `well-temperament.md` (~ln 393) | "Francesco Vallotti's scheme (composed 1728, published posthumously 1779) narrows six consecutive fifths..." | "Francesco Antonio Vallotti's *Della scienza teorica e pratica della moderna musica, libro primo* (Padua, 1779) is the conventional published anchor for this scheme. Vallotti died in 1780 — the year *after* publication, not before. The 1728 composition date sometimes given in tuning surveys lacks documentary basis." | Vallotti 1779; Duffin 2020 |
| C-2 | `well-temperament.md` (~ln 396) | "The temperament commonly called 'Vallotti' today is technically a slight misattribution — Vallotti's own scheme is more elaborate..." | "More properly the **Tartini–Vallotti** scheme: the recipe is first documented in print in Giuseppe Tartini's *Trattato di musica secondo la vera scienza dell'armonia* (Padua, 1754); the attribution to Vallotti has no clear primary-source basis (Duffin 2020). The recipe circulated in the Paduan musical circle that included both Tartini and Vallotti." | Tartini 1754; Duffin 2020 |
| C-3 | `schisma.md` (~ln 152, also "Further reading" prose) | "Schismatic temperament (Helmholtz / Groven / **Garibaldi** — narrow each fifth by ~0.244¢...)" | "Schismatic temperament (Helmholtz / Groven / **Sábat-Garibaldi** — narrow each fifth by ~0.244¢ so a chain of eight fifths lands on a pure 5/4)" | Xen Wiki "Garibaldi"; Xen Wiki "Schismatic family" |
| C-4 | `meantone.md` (~ln 84, in the variants table) | "1/5-comma (Verheijen, 1599)" | "1/5-comma (Verheyen, ca. 1600)" — or footnote: "first described in correspondence between Abraham Verheyen and Simon Stevin, ca. 1600" | Xen Wiki "1/5-comma meantone" |
| C-5 | `meantone.md` (~ln 277, in the "wolf at k=12" subsection) | "twelve fifths come up short of seven octaves by ≈ 40.7¢" | "twelve fifths come up short of seven octaves by ≈ 41.1¢" (or "≈ 41¢" if rough) | — (recomputation) |
| C-6 | `pythagorean-tuning.md` (add a footnote in the "Where the wolf lives" or page-intro section) | (no current text — *missing context*) | New aside: "The name 'Pythagorean tuning' honors Pythagoras (6th c. BCE), but the divisive chain-of-fifths method itself is documented in cuneiform Mesopotamian sources predating him by over a millennium (West 1992; Barker 1989)." | West 1992; Barker 1989 |
| C-7 | `well-temperament.md` (~ln 346, "Werckmeister III (1691)" section) | "what Werckmeister himself called 'Correct temperament no. 1.'" (alone) | Add footnote: "The modern label 'Werckmeister III' refers to his monochord III (his monochords I and II label just intonation and ¼-comma meantone respectively); when Werckmeister ordered his 'good temperaments,' this same scheme was his first ('no. 1'). Both labels point to the same recipe." | Werckmeister 1691; Xen Wiki "Werckmeister temperament" |
| C-8 | `monzos.md` (intro, after "A monzo is a vector of integer exponents...") | (no current text — *recommended addition, not a correction of an error*) | Aside: "The term *monzo* was coined in July 2003 by Gene Ward Smith in honor of Joe Monzo's advocacy of prime-factor vector notation; the underlying mathematics — applying the fundamental theorem of arithmetic to rational frequency ratios — goes back at least to Adriaan Fokker." | Xen Wiki "Monzo" |
| C-9 | `tenney-height.md` (citation year normalization) | "James Tenney — John Cage and the Theory of Harmony (1983)" | Either keep "1983" (year of composition) or shift to "1984" (year of publication in *Soundings* 13). Choose one convention and apply uniformly. **Recommendation:** keep 1983 (it matches the PDF's own date); add a parenthetical "published 1984 in *Soundings* 13" in the full Chicago entry. | Tenney 1983 |

> **C-5** is a quiet arithmetic nit, not a substantive historical error. Confirming: `12 × 696.578 = 8358.93`; `8400 − 8358.93 = 41.07`. The page says ≈ 40.7. Either the rounding propagated 0.3¢ of arithmetic loss somewhere, or the original author rounded the fifth size before multiplying. Verify in execution by recomputing from the kernel-exact syntonic comma `81/80` rather than from the float-cents value.

## Open Questions / Flagged for `(citation needed)`

| # | Page | Claim | Reason |
|---|------|-------|--------|
| Q-1 | `harmonic-series.md` (H6) | "partial 13 as a flat neutral 6th (−59.5¢)" — the reference 12-TET note for this comparison isn't pinned in the prose. | Verify in execution that the kernel's `centsFrom12tet` for `13/8` returns the value the page asserts; if not, reconcile by either updating the prose or annotating which 12-TET reference is being compared against. |
| Q-2 | `meantone.md` (MT3) | "1/6-comma meantone (Gottfried Silbermann)" — no extant treatise by Silbermann documents this specifically; attribution is via reconstruction. | If a confident primary source for Silbermann's 1/6-comma practice isn't surfaced during execution, mark inline as `(Xen Wiki, "1/6-comma meantone")` rather than as a primary citation, and note the reconstruction-based nature in a footnote. |
| Q-3 | `well-temperament.md` (WT11) | "Wagner's famously-affecting D♭-major moments, Schubert's E-major / E♭-major contrasts" — these are interpretive musicological claims | Cite Duffin 2007 ch. 6 as a popular modern source; if a Wagner-specific tonal-color study is desired, mark `(citation needed)` and leave for SUMMARY follow-up. |
| Q-4 | `odd-limits.md` (OL6) | "the 'blue' notes of early-jazz tradition all live here" (7-odd-limit) | Soft cultural claim with no obvious authoritative single source. Cite Doty 2002 ch. 4 for the JI-grounding of the 7th-harmonic-as-blue-note claim; mark `(citation needed)` only if Doty doesn't actually make the argument explicitly. |
| Q-5 | All pages | "just-noticeable-difference" claims (typically "~5–10¢" or "audible as a beat-rate") | The JND for melodic pitch in slow contexts is reliably cited around 5–10¢ for trained listeners; Plomp & Levelt 1965 is the canonical primary, Sethares 2005 §1.1 a clean secondary. Cite once per page where the claim is load-bearing. |

---

## Citation Strategy by Page (executor playbook)

> Compact list — minimum citations per page to satisfy "every distinct claim cited once at first
> authoritative source."

| Page | Inline citations needed | Sources-section minimum (Chicago entries) |
|------|-------------------------|------------------------------------------|
| `syntonic-comma.md` | ~4 | Helmholtz 1885, Partch 1974, Sethares 2005, Blackwood 1985, Xen Wiki "81/80" + "Meantone family" + "Monzo", Huygens-Fokker "List of intervals" |
| `pythagorean-comma.md` | ~3 | Helmholtz 1885, Partch 1974, Xen Wiki "Pythagorean comma" + "53edo", Huygens-Fokker |
| `pythagorean-tuning.md` | ~4 | Helmholtz 1885, Lindley 1984, Duffin 2007, **West 1992, Barker 1989** (for the pre-Pythagoras lineage), Xen Wiki "Pythagorean tuning" |
| `schisma.md` | ~5 | Helmholtz 1885, Plomp & Levelt 1965, Sethares 2005, Xen Wiki "Schisma" + "Schismatic family" + "Garibaldi" + "53edo", Huygens-Fokker |
| `septimal-comma.md` | ~3 | Helmholtz 1885, Barker 1989, Xen Wiki "64/63" + "Archytas clan", Huygens-Fokker |
| `commas.md` | ~5 | Helmholtz 1885, Partch 1974, Huygens-Fokker "List of intervals", Xen Wiki "Comma" + "Mercator's comma" |
| `harmonic-series.md` | ~3 | Helmholtz 1885, Benson 2007, Plomp & Levelt 1965, Sethares 2005, Gann "Just Intonation Explained", Xen Wiki "Harmonic series" |
| `monzos.md` | ~2 | Xen Wiki "Monzo" (terminology origin), Doty 2002, Benson 2007 |
| `prime-limits.md` | ~3 | Partch 1974, Xen Wiki "Prime limit", Doty 2002 |
| `odd-limits.md` | ~3 | Partch 1974 chs. 6 & 11, Xen Wiki "Odd limit", Doty 2002 |
| `otonality-utonality.md` | ~3 | Partch 1974 chs. 6 & 8, Xen Wiki "Otonality and utonality", Gann "WTP" |
| `tenney-height.md` | ~2 | Tenney 1983/1984, Xen Wiki "Tenney height" |
| `edo-approximation.md` | ~3 | Xen Wiki per-EDO pages, Duffin 2007, Plomp & Levelt 1965 |
| `meantone.md` | ~6 | **Aron 1523**, **Salinas 1577**, **Zarlino 1558**, Xen Wiki "Meantone family" + "1/4-comma meantone" + "1/3-comma meantone" + "1/5-comma meantone" + "1/6-comma meantone", Blackwood 1985 |
| `comma-pump.md` | ~4 | Helmholtz 1885, Aron 1523, Partch 1974, Johnston 1977, Gann "WTP", Doty 2002, Benson 2007, Xen Wiki "Comma pump" |
| `well-temperament.md` | ~6 (heaviest page) | **Werckmeister 1691**, **Kirnberger 1779**, **Vallotti 1779**, **Tartini 1754**, **Duffin 2020**, Duffin 2007, Lehman 2005, Lindley 1984, Xen Wiki "Well temperament" |
| `scale-workshop-interop.md` | ~2 | Barker 1989 (Ptolemy), Huygens-Fokker "scl_format", Scale Workshop links |
| `analysis.md` | 0–1 | Huygens-Fokker "scl_format" (for completeness) |

---

## Sources

### Primary (HIGH confidence)

- IMSLP. "Musicalische Temperatur (Werckmeister, Andreas)." https://imslp.org/wiki/Musicalische_Temperatur_(Werckmeister,_Andreas). Verified 1691, Quedlinburg, Calvisius.
- IMSLP. "Le Istitutioni Harmoniche (Zarlino, Gioseffo)." https://imslp.org/wiki/Le_Istitutioni_Harmoniche_(Zarlino,_Gioseffo). Verified Venice 1558 + 1561/1562 reprints.
- IMSLP. "De musica libri septem (Salinas, Francisco de)." https://imslp.org/wiki/De_musica_libri_septem_(Salinas,_Francisco_de). Verified Salamanca 1577.
- IMSLP. "Die Kunst des reinen Satzes in der Musik (Kirnberger, Johann Philipp)." https://imslp.org/wiki/Die_Kunst_des_reinen_Satzes_in_der_Musik_(Kirnberger,_Johann_Philipp). Verified vol. 2 pt. 3 1779.
- IMSLP. "Della scienza teorica e pratica della moderna musica (Vallotti, Francesco Antonio)." https://imslp.org/wiki/Della_scienza_teorica_e_pratica_della_moderna_musica_(Vallotti,_Francesco_Antonio). Verified 1779 Padua, Vallotti dates 1697–1780.
- Library of Congress catalog records for all above + Werckmeister biography (b. 1645, d. 1706, Quedlinburg publication) cross-confirmed via the Deutsche Biographie entry.
- Tenney, James. "John Cage and the Theory of Harmony" PDF. https://www.plainsound.org/pdfs/JC&ToH.pdf. Composition 1983; first published *Soundings* 13, 1984; reprinted *From Scratch* (2015) ch. 12.
- Plomp & Levelt 1965 paper. *Journal of the Acoustical Society of America* 38 (4): 548–560. https://doi.org/10.1121/1.1909741.
- Pietro Aron Wikipedia + cross-referenced sources: *Toscanello in musica* 1523 Venice; multiple reprints 1525–1562.

### Secondary (MEDIUM-HIGH confidence)

- Ross Duffin, "Why I Hate Vallotti (or is it Young?)" pts. 2.1 + 3.1. https://casfaculty.case.edu/ross-duffin/. Documents the Tartini-1754 priority and the contested Vallotti attribution. Accessed 2026-05-13.
- Xenharmonic Wiki for monzo terminology origin (Gene Ward Smith, July 2003) and Garibaldi (= Sábat-Garibaldi, dinarra developer). Both pages access 2026-05-13.
- Wikipedia / Britannica / Encyclopedia.com cross-references for biographical anchors (Werckmeister, Kirnberger, Salinas, Zarlino, Aron, Vallotti, Tartini, Young, Verheyen).

### Tertiary (LOW — would benefit from additional verification)

- The "Silbermann ↔ 1/6-comma" attribution (no extant Silbermann treatise found; conventionally attributed via organ-reconstruction).
- "Vallotti composed in 1728" — found in tuning-encyclopedia tradition but no primary-source documentation surfaced during this audit.
- Soft cultural-musicological claims (Wagner D♭-major, Schubert E♭/E contrasts, blue-note 7th-harmonic) — defensible via Duffin 2007 / Doty 2002 but should be marked `(citation needed)` if execution can't pin a stronger source.

---

## Metadata

**Confidence breakdown:**
- Citation pool completeness: HIGH — covers every page's claim density.
- Primary-historical attributions: HIGH for Werckmeister 1691, Kirnberger 1779, Zarlino 1558, Aron 1523, Salinas 1577, Partch 1974, Tenney 1983, Helmholtz 1885, Plomp & Levelt 1965 (all verified against primary catalog or peer-reviewed source).
- Vallotti / Tartini reattribution: HIGH (Duffin 2020 is unambiguous).
- Verheyen 1/5-comma date "1599 vs ca. 1600": MEDIUM — sources say "ca. 1600" / "around 1600" without pinning a specific year.
- Silbermann 1/6-comma: MEDIUM — conventional attribution without a single primary source.
- All mathematical derivations: HIGH — re-verified by direct re-computation; the kernel is already test-covered for the same values.

**Research date:** 2026-05-13
**Valid until:** 2026-08-13 (3 months for historical/citation work — none of these citations are likely to be invalidated by future scholarship in that window).
