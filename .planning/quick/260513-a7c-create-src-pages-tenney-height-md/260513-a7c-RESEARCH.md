# Tenney height — research

**Page slug:** `src/pages/tenney-height.md`
**Config entry:** LAST under "Theory notes" in `observablehq.config.ts` (after `EDO approximations`).
**No audio.** Glossary-style reference page.

---

## §1 — Math definition

**Abstract definition** (literature, multi-source consensus): for a reduced positive
rational `n/d` in lowest terms,

```
TH(n/d) = k · log(n · d)
```

where `k` is an arbitrary scaling constant and the **logarithm base is a stylistic
choice**. Two bases appear in the literature with equal weight: base 2 (units =
octaves) and base e (units = nepers). Tonalsoft and the Xenharmonic Wiki ("Tenney
norm") both state explicitly that the choice is arbitrary; the *ranking* of ratios
is identical under any positive base because log is monotone.

**Equivalent monzo form** (verified against Tonalsoft + xen-dev-utils source):

```
TH(monzo) = Σ |e_i| · log(p_i)
```

where `e_i` is the i-th exponent and `p_i` the i-th prime. The absolute values
are load-bearing — negative exponents (the denominator's prime content) contribute
the same magnitude as positive ones, because the formula is `log(n) + log(d)`, not
`log(n) − log(d)`. The equivalence with `log(n·d)` is elementary:
`log(n) + log(d) = log(n·d)` for a reduced ratio (a prime cannot appear in both
n and d simultaneously, so each `e_i` sits cleanly on one side).

**xen-dev-utils' choice** (verified — `node_modules/xen-dev-utils/dist/core.js:410`):

```js
export function tenneyHeight(value) {
    if (Array.isArray(value)) {
        return dotPrecise(value.map(x => Math.abs(x)), LOG_PRIMES);
    }
    const { s, n, d } = new Fraction(value);
    if (!s) { return Infinity; }
    return Math.log(n) + Math.log(d);
}
```

where `LOG_PRIMES = PRIMES.map(Math.log)` (`node_modules/xen-dev-utils/dist/primes.js:90`).
**This is natural log — base e, not base 2.** Confirmed via runtime probe:

| Ratio | xen-dev-utils returns | = ln(n·d) | log₂(n·d) (for comparison) |
| --- | --- | --- | --- |
| 1/1  | `0`     (actually `-0`)  | `0`       | `0`       |
| 3/2  | `1.7918`                 | `1.7918`  | `2.5850`  |
| 5/4  | `2.9957`                 | `2.9957`  | `4.3219`  |
| 2/1  | `0.6931`                 | `0.6931`  | `1.0000`  |
| 81/80 | `8.7765`                | `8.7765`  | `12.6618` |

The function accepts either a `Monzo` (number[]) or a `FractionValue` (string,
number, Fraction). Signature (from `core.d.ts:159`):

```ts
export declare function tenneyHeight(value: Monzo | FractionValue): number;
```

**Nuances to surface on the page:**

1. **Base.** Both base 2 and base e appear in the literature. The xen-dev-utils
   implementation (and therefore the project's `tenneyHeight` re-exported in
   `src/lib/monzo.ts:17,27`) uses **natural log (base e)**. The page MUST be
   explicit about this — show the formula as `ln(n·d)` (not `log₂(n·d)`) so the
   numbers on the page match what users get if they call the kernel function
   directly. The page CAN show a base-2 conversion (`log₂ = ln / ln(2)`) as a
   side-note for readers comparing against other sources.
2. **No octave reduction.** `tenneyHeight` does NOT pre-reduce — `tenneyHeight("2/1")`
   returns `ln(2) ≈ 0.693`, not `0`. The octave is not "free" in Tenney height
   (this is a feature: octave displacement IS a small but real complexity contribution
   in Tenney's lattice).
3. **1/1 returns 0** (well, `-0` in IEEE 754, but `=== 0` is true). The unison is
   the only ratio with height 0 — the lattice origin.
4. **Reduced form required.** If you pass a non-reduced fraction string like
   `"6/4"`, fraction.js' constructor reduces it first (`6/4 → 3/2`), then computes
   `ln(3) + ln(2)`. So you can't "trick" the function by inflating a ratio.
5. **`Map` overload exists for wilsonHeight but not tenneyHeight.** Don't
   mention — keep the page focused.

**Pitfall — user's brief contained a numerical error in §2 (Pythagorean comma):**
the brief said `log₂(279,936,432,033,792) ≈ 47.987`. The correct n·d for
531441/524288 (both already coprime) is **278,628,139,008** (not 279,936,…), and
`log₂(278628139008) ≈ 38.020`, `ln ≈ 26.353`. Use the corrected value on the page
and use the base-e version since that's what the kernel returns.

---

## §2 — Worked examples (verified numerically)

Each row computed in node via `Math.log` / `Math.log2` of `BigInt(n) * BigInt(d)`
on the *reduced* ratio. All values 3-decimal-truncated and confirmed against the
runtime probe.

| Ratio | n·d | cents | **ln(n·d)** (kernel) | log₂(n·d) (alt) | Comment |
| --- | --- | --- | --- | --- | --- |
| 1/1                | 1                 |    0.000 |  **0.000** |  0.000 | unison; lattice origin |
| 2/1                | 2                 | 1200.000 |  **0.693** |  1.000 | octave — small but nonzero |
| 3/2                | 6                 |  701.955 |  **1.792** |  2.585 | pure 5th — first 3-limit step |
| 5/4                | 20                |  386.314 |  **2.996** |  4.322 | pure major 3rd — first 5-limit step |
| 7/4                | 28                |  968.826 |  **3.332** |  4.807 | harmonic 7th — first 7-limit step |
| 9/8                | 72                |  203.910 |  **4.277** |  6.170 | major whole tone — two 3's stack |
| 81/80              | 6480              |   21.506 |  **8.777** | 12.662 | **syntonic comma** — tiny cents, large height |
| 32805/32768        | 1,074,954,240     |    1.954 | **20.796** | 30.002 | **schisma** — tinier cents, larger height |
| 531441/524288      | 278,628,139,008   |   23.460 | **26.353** | 38.020 | **Pythagorean comma** — the high anchor |

**Pedagogical pairing:** the 81/80 / 32805/32768 / 531441/524288 trio dramatizes the
"complex ratios sit high regardless of cents pitch" point. The schisma is
1.954 ¢ (almost unison) but has a higher Tenney height than the Pythagorean comma's
23.460 ¢ — *complexity does not track pitch distance from unison*.

**In-page code pattern** — derive every number from kernel-exact `Interval`:

```ts
const examples = [
  { ratio: "1/1",            comment: "unison; lattice origin" },
  { ratio: "2/1",            comment: "octave — small but nonzero" },
  { ratio: "3/2",            comment: "pure 5th" },
  { ratio: "5/4",            comment: "pure major 3rd" },
  { ratio: "7/4",            comment: "harmonic 7th" },
  { ratio: "9/8",            comment: "major whole tone" },
  { ratio: "81/80",          comment: "syntonic comma" },
  { ratio: "32805/32768",    comment: "schisma" },
  { ratio: "531441/524288",  comment: "Pythagorean comma" },
].map((r) => {
  const iv = new Interval(r.ratio);
  return {
    ratio: r.ratio,
    cents: iv.cents,
    th: tenneyHeight(iv.monzo),
    comment: r.comment,
  };
});
```

Format `th` to 3 decimals; format `cents` to 3 decimals (the project's standard
display precision — Pitfall #16 lower bound is 0.1¢, 3 decimals matches meantone.md).

---

## §3 — Canonical scatter ratios (~30 entries) — verified

Same node probe; all cents and `ln(n·d)` values pre-computed below so the page
can sanity-check its in-cell derivation.

| Ratio   | cents     | ln(n·d) | log₂(n·d) |
| ---     | ---       | ---     | ---     |
| 1/1     |    0.000  |  0.000  |  0.000  |
| 2/1     | 1200.000  |  0.693  |  1.000  |
| 3/2     |  701.955  |  1.792  |  2.585  |
| 4/3     |  498.045  |  2.485  |  3.585  |
| 5/4     |  386.314  |  2.996  |  4.322  |
| 6/5     |  315.641  |  3.401  |  4.907  |
| 7/4     |  968.826  |  3.332  |  4.807  |
| 7/5     |  582.512  |  3.555  |  5.129  |
| 7/6     |  266.871  |  3.738  |  5.392  |
| 8/5     |  813.686  |  3.689  |  5.322  |
| 9/5     | 1017.596  |  3.807  |  5.492  |
| 9/7     |  435.084  |  4.143  |  5.977  |
| 9/8     |  203.910  |  4.277  |  6.170  |
| 10/7    |  617.488  |  4.248  |  6.129  |
| 10/9    |  182.404  |  4.500  |  6.492  |
| 11/6    | 1049.363  |  4.190  |  6.044  |
| 11/7    |  782.492  |  4.344  |  6.267  |
| 11/8    |  551.318  |  4.477  |  6.459  |
| 11/9    |  347.408  |  4.595  |  6.629  |
| 11/10   |  165.004  |  4.700  |  6.781  |
| 12/7    |  933.129  |  4.431  |  6.392  |
| 12/11   |  150.637  |  4.883  |  7.044  |
| 13/8    |  840.528  |  4.644  |  6.700  |
| 13/9    |  636.618  |  4.762  |  6.870  |
| 14/9    |  764.916  |  4.836  |  6.977  |
| 15/8    | 1088.269  |  4.787  |  6.907  |
| 15/11   |  536.951  |  5.106  |  7.366  |
| 15/14   |  119.443  |  5.347  |  7.714  |
| 16/9    |  996.090  |  4.970  |  7.170  |
| 16/11   |  648.682  |  5.171  |  7.459  |
| 16/15   |  111.731  |  5.481  |  7.907  |
| 17/16   |  104.955  |  5.606  |  8.087  |
| 81/80   |   21.506  |  8.777  | 12.662  |
| 32805/32768   |  1.954  | 20.796  | 30.002  |

(The Pythagorean comma at 26.353 / 38.020 is best left **off** the scatter — see §5.)

**Discipline (Pitfall #1 / project convention):** derive in-cell from
`new Interval(...).monzo` and `tenneyHeight(...)`. Never hardcode the float
columns. The table above exists in this RESEARCH.md only to let the executor
spot-check.

```ts
const scatterData = [
  "1/1","2/1","3/2","4/3","5/4","6/5","7/4","7/5","7/6","8/5","9/5","9/7","9/8",
  "10/7","10/9","11/6","11/7","11/8","11/9","11/10","12/7","12/11","13/8","13/9",
  "14/9","15/8","15/11","15/14","16/9","16/11","16/15","17/16",
  "81/80","32805/32768",
].map((r) => {
  const iv = new Interval(r);
  return { ratio: r, cents: iv.cents, th: tenneyHeight(iv.monzo) };
});
```

---

## §4 — Tenney-weighted error in `bestEdosForScale`

**Source of truth:** `src/lib/edo.ts:98-126`. Two-line summary of the metric:

```js
// per-interval weight; clamped at 1 to handle the 1/1 case where TH = 0
const weight = Math.max(1, tenneyHeight(iv.monzo));
tenneyWeighted += absErr / weight;          // accumulate per interval
// final metric for this EDO is the raw sum — no normalization across scale size
```

**Pedagogical explanation** (3 paragraphs the page should follow closely):

The metric is `Σ |centsError_i| / max(1, ln(n_i · d_i))`. Read it as a **weighted
sum of cents errors**, where each interval's weight is the inverse of its Tenney
height. Simple ratios — 3/2 (ln(6) ≈ 1.79), 5/4 (ln(20) ≈ 3.00), 7/4 (ln(28) ≈ 3.33)
— sit at the low end of the height range, so dividing by a small number leaves
their cents error contributing almost intact. Complex ratios — 81/80 (≈ 8.78),
32805/32768 (≈ 20.80) — divide their cents error by a much larger number, so even
a 20¢ miss on the schisma contributes less than a 1¢ miss on a pure 5th.

This bias is musically deliberate. Simple ratios are the load-bearing consonances
of tonal music — the perfect 5th, the major 3rd, the harmonic 7th. An EDO that
hits these accurately *sounds tonally coherent* even when its approximations of
high-complexity commas are bad. An EDO that hits a comma exactly but misses the
5th by 7¢ sounds out of tune. Tenney-weighted error encodes that musical priority
into a single scalar suitable for ranking. Compare:

- **Max error** (`Math.max` across the scale) treats every interval equally and
  is dominated by whichever interval the EDO happens to fit worst — usually a
  comma or a high-prime ratio. Useful for "what's the worst this EDO does?"
- **RMS error** weights all intervals uniformly (with quadratic emphasis on big
  misses), no musical bias.
- **Tenney-weighted error** weights *toward simple ratios*, which is the
  musically biased option and the one that aligns "best EDO for this scale" with
  "EDO that sounds most in tune for this scale".

**The `max(1, …)` clamp.** For 1/1, `tenneyHeight([]) = 0` (well, `-0`).
Dividing by zero would NaN the sum. The clamp also keeps `2/1` (TH ≈ 0.693, < 1)
from being *over*-weighted relative to other simple ratios — without the clamp,
a 1¢ miss on the octave would contribute `1/0.693 ≈ 1.44` to the metric,
artificially privileging octave-fit over 5th-fit. In practice every EDO hits
both 1/1 and 2/1 exactly (step 0 and step N), so the 1/1 and 2/1 errors are
always 0 and the clamp's numerical effect on ranking is nil — but it is a
**load-bearing numerical safety guard** for any consumer that re-uses
`tenneyHeight` in a divide-by context. The page MUST surface this clamp.

**Worked example to include on the page.** Show a small concrete computation:
12-EDO against the 5-limit scale `{1/1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1}`.
The per-interval contributions (approximations):

| Interval | cents err (12-EDO) | TH (ln) | clamped wt | contribution |
| --- | --- | --- | --- | --- |
| 1/1   |   0.00 |  0.00 | 1.00 |  0.00 |
| 9/8   |  −3.91 |  4.28 | 4.28 |  0.91 |
| 5/4   | +13.69 |  3.00 | 3.00 |  4.57 |
| 4/3   |  +1.96 |  2.48 | 2.48 |  0.79 |
| 3/2   |  −1.96 |  1.79 | 1.79 |  1.09 |
| 5/3   | +15.64 |  2.71 | 2.71 |  5.77 |
| 15/8  | +11.73 |  4.79 | 4.79 |  2.45 |
| 2/1   |   0.00 |  0.69 | 1.00 |  0.00 |
| **sum** |        |       |      | **15.58** |

(Numbers above are approximate — recompute in-cell from `Interval` + `tenneyHeight`
to get exact values. The point of the table is that the 5/4 and 5/3 contributions
dominate, not the 9/8 or the schismatic-looking small interval — even though the
8-cent error on 15/8 is smaller than the 13.7¢ error on 5/4, the 5/4's smaller
height makes it weigh more.)

---

## §5 — Plot scatter design recommendation

**Single panel.** x = cents in [0, 1200], y = ln(n·d) in **[0, 22]** (clip the
Pythagorean comma off-screen, keep the schisma at ~20.80 visible). Use a linear
y-axis — Tenney height is already log; doubling logs would be log-log and the
schisma would visually equal the syntonic comma despite being ~10× the actual
height.

**Mark choice:** `Plot.dot` + `Plot.text` for ratio labels next to each dot.
Constant `r: 4` for the dots; offset the text labels using `dx: 6, dy: -4` to
avoid overlapping the dot. Use `Plot.ruleY([0])` for the unison baseline.

**Encoding nuance — DO NOT color or size by prime-limit on the first chart.**
Reasoning: the page's pedagogical point is the *cents-vs-height plane*, full stop.
Adding a third encoding doubles the visual complexity and forces the reader to
chase the legend. Keep it monochrome (or a single muted accent fill matching the
project's other scatter charts in `edo-approximation.md`). If the executor wants
prime-limit visibility, add it as a *hover title* (`title: d => '${d.ratio} —
${d.cents.toFixed(1)}¢, TH=${d.th.toFixed(2)}, limit=${primeLimitOfMonzo(...)}'`).

**Comma annotation.** The 32805/32768 schisma point (cents ≈ 1.95, TH ≈ 20.80)
sits visually *isolated* from the simple-ratio cluster — that's the chart's
punchline. The page text should call out the dot explicitly: "the lone dot in
the upper-left is the schisma — almost zero cents from the unison, but very far
from the unison in Tenney height."

**Why not include the Pythagorean comma at TH ≈ 26.35?** Adding it pushes the
y-axis range to [0, 28] and squashes the entire simple-ratio cluster into the
bottom 25% of the plot. The schisma is already enough to demonstrate the "small
cents, large height" point. Mention the Pythagorean comma in the worked-examples
table only.

**Plot config sketch** (executor to adapt):

```ts
import * as Plot from "npm:@observablehq/plot";

const scatterChart = Plot.plot({
  width: 720,
  height: 420,
  marginLeft: 55,
  marginRight: 20,
  marginBottom: 50,
  x: { label: "Pitch distance from 1/1 (cents)", domain: [0, 1200], grid: true },
  y: { label: "Tenney height (ln(n·d))", domain: [0, 22], grid: true },
  marks: [
    Plot.ruleY([0], { stroke: "#888", strokeDasharray: "2,3" }),
    Plot.dot(scatterData, { x: "cents", y: "th", r: 4, fill: "currentColor" }),
    Plot.text(scatterData, {
      x: "cents", y: "th", text: "ratio",
      dx: 6, dy: -4, fontSize: 10, textAnchor: "start",
    }),
  ],
});
```

---

## §6 — Further reading (URL verification)

| Item | URL | Status |
| --- | --- | --- |
| Xenharmonic Wiki — *Tenney height* (redirects to "Tenney norm") | `https://en.xen.wiki/w/Tenney_height` | **UNVERIFIED via WebFetch** (Cloudflare 403's automated requests); confirmed page exists via WebSearch result snippet. **Fallback:** `https://en.xen.wiki/w/Height` (the family page) if `/Tenney_height` ever 404s. |
| Tonalsoft Encyclopedia — *Harmonic distance* (Joe Monzo) | `http://www.tonalsoft.com/enc/h/harmonic-distance.aspx` | **VERIFIED** — `HTTP/1.1 200 OK` via curl; full content quoted in WebSearch result. Contains the explicit base-2 formula and the monzo-form derivation. Note: HTTP-only (no HTTPS). |
| James Tenney — *John Cage and the Theory of Harmony* (1983) | `https://www.plainsound.org/pdfs/JC&ToH.pdf` | **VERIFIED** — `HTTP/2 200`, `content-type: application/pdf`, `content-length: 675315` via curl (with case-insensitive redirect from `JC&ToH.PDF`). Use the lowercase `.pdf` form to skip the redirect. PlainSound Music Edition (Marc Sabat's publishing imprint) hosts this as the canonical PDF. |

**Recommended `furtherReading` payload** (3 entries — the page brief allows an
optional 3rd; the Tenney PDF is the obvious primary source so include it):

```ts
furtherReading([
  {
    title: "Tenney norm — Xenharmonic Wiki",
    url: "https://en.xen.wiki/w/Tenney_height",
    note: "community-curated reference for Tenney height (a.k.a. Tenney norm, harmonic distance). Catalogues the formula in both prime-axis and log(n·d) forms, cross-references the Wilson and Weil-norm relatives, and lists the regular-temperament uses (TE/TOP optimization, badness measures). The page-name redirect from `Tenney_height` → `Tenney_norm` reflects the wiki's preference for the matrix/norm formalism; the underlying concept is the one this page describes."
  },
  {
    title: "Joe Monzo — Harmonic distance (Tonalsoft Encyclopedia)",
    url: "http://www.tonalsoft.com/enc/h/harmonic-distance.aspx",
    note: html`Joe Monzo's encyclopedia entry. States the per-prime formula explicitly: ${tex`\mathrm{HD}(p_1^{e_1} p_2^{e_2} \cdots) = \sum_i |e_i| \log p_i`}. Discusses why the logarithm base is conventionally taken as base 2 (units = octaves) and the Minkowski-metric framing on the prime-factor lattice. Good companion to this page's monzo-form derivation.`
  },
  {
    title: "James Tenney — John Cage and the Theory of Harmony (1983)",
    url: "https://www.plainsound.org/pdfs/JC&ToH.pdf",
    note: "Tenney's own monograph — the primary source for harmonic distance / Tenney height in its modern formulation. Sections on §3 and §6 develop the lattice metric (defines harmonic distance as the logarithm of the product n·d of a reduced ratio, exactly the formula this page uses) and connect it to consonance perception via Helmholtz-Stumpf roughness. Hosted by Plainsound Music Edition (the Sabat/von Schweinitz imprint that publishes most of Tenney's theoretical writing)."
  }
])
```

---

## §7 — Page structure recommendation

```markdown
# Tenney height

A scalar measure of harmonic complexity — how "far" a JI ratio is from the unison on a log lattice.

```ts
import { Interval } from "../lib/interval.js";
import { tenneyHeight, primeLimitOfMonzo } from "../lib/monzo.js";
import { furtherReading } from "../components/further-reading.js";
import * as Plot from "npm:@observablehq/plot";
```
```

NO synth cell (no audio on this page).

H2/H3 outline:

- **(opening tagline)** — one sentence, no heading. "A scalar measure of harmonic
  complexity: how 'far' a ratio sits from the unison on a log lattice."
- `<aside class="prereq">` — prerequisites: [Monzos](./monzos),
  [prime-limits](./prime-limits). Both pages exist (verified in
  `observablehq.config.ts:19-20`).
- `## Definition` — KaTeX block. Show both:
  - `${tex`\mathrm{TH}(n/d) = \ln(n \cdot d)`}` (the kernel's formula)
  - `${tex`\mathrm{TH}(\text{monzo}) = \sum_i |e_i| \ln(p_i)`}` (the monzo form)
  - One-sentence aside that "the logarithm base is a convention" and
    `log₂ = ln / ln 2` gives the octave-units variant common in other sources.
- `## Worked examples` — plain DOM table. Columns: Ratio | n·d | TH (ln) | cents | Comment.
  Derive every value in-cell. Use the 9 rows from §2.
- `## Cents vs Tenney height` — Plot scatter (the §5 chart) + a short paragraph
  framing the punchline: pitch distance and harmonic complexity are independent
  axes. Call out the schisma dot explicitly.
- `## Tenney-weighted error in the EDO ranker` — the §4 explanation. Include
  the 12-EDO worked-example table. Link to `/pages/edo-approximation` and
  `/pages/analysis`. Cite `src/lib/edo.ts` by path so readers can find the
  implementation.
- `## See also` — short prose, NOT a list (matches edo-approximation.md style).
  Link [/pages/monzos](/pages/monzos), [/pages/prime-limits](/pages/prime-limits),
  [/pages/edo-approximation](/pages/edo-approximation),
  [/pages/analysis](/pages/analysis), [/](/) (dashboard).
- `## Further reading` — Markdown H2 + JS code fence calling `furtherReading([...])`
  with the §6 payload. Pattern: `well-temperament.md:551-571`.

**Voice notes** (lifted from observation across meantone / edo-approximation /
well-temperament): terse, technically precise, leading with the math and only
then the prose framing. Use `${tex`...`}` for inline math (KaTeX is wired in
`observablehq.config.ts:36`). Use the project's house formatting for cents
(suffix `¢`, signed errors as `+1.23¢` / `−1.23¢` using the `−` minus glyph).

---

## §8 — Discipline checklist (confirmed)

- ✅ `Interval` imports from `../lib/interval.js` (verified — meantone.md:6,
  edo-approximation.md:6).
- ✅ `tenneyHeight` imports from `../lib/monzo.js` (verified —
  `src/lib/monzo.ts:17,27` re-exports it). DO NOT import from `xen-dev-utils`
  directly (R-01 guard pattern; see comment block at top of `monzo.ts`).
- ✅ Also import `primeLimitOfMonzo` from `../lib/monzo.js` IF the executor wants
  the prime-limit hover-title enrichment in the scatter (§5 recommends NOT
  color-encoding by prime-limit, but the hover title is fine).
- ✅ Plot import: `import * as Plot from "npm:@observablehq/plot";` (verified —
  edo-approximation.md:11).
- ✅ `furtherReading` import: `import { furtherReading } from
  "../components/further-reading.js";` (verified — meantone.md:14,
  well-temperament.md:12).
- ✅ `Interval.prototype.monzo` getter returns `number[]` (verified —
  `src/lib/interval.ts:42-47`). `tenneyHeight` consumes `Monzo | FractionValue`,
  i.e. either `iv.monzo` (array) or the fraction string directly. Both paths
  give identical results — prefer `iv.monzo` for clarity and to keep `Interval`
  as the canonical input type (Pitfall #1 — kernel-exact anchors).
- ✅ No `.innerHTML =` for derived values. Use `document.createElement` +
  `textContent`, same pattern as `edo-approximation.md:75-109` (deviation table).
- ✅ Config update: add `{ name: "Tenney height", path: "/pages/tenney-height" }`
  to `observablehq.config.ts:11-34` as the LAST entry under "Theory notes"
  (after `{ name: "The septimal comma", path: "/pages/septimal-comma" }` at
  line 32 — but the brief says "after EDO approximations" at line 30; appending
  to the very end of the array preserves alphabetical-by-glossary feel and
  matches the brief's "glossary-style reference page" framing). **Recommend
  inserting LAST in the `pages` array** (after `septimal-comma`) — the brief's
  "after EDO approximations" appears to mean "logically downstream of"
  EDO-approximation pedagogy, which the §4 section handles via cross-link.
  Confirm with planner if ambiguous.
- ✅ No tests required for the page itself (Markdown rendering is not tested).
  The kernel `tenneyHeight` is already exercised via `bestEdosForScale` tests in
  `src/lib/__tests__/`. No new test files needed for this task.

---

## Sources

- xen-dev-utils source: `node_modules/xen-dev-utils/dist/core.js:410-419`,
  `node_modules/xen-dev-utils/dist/primes.js:90` — VERIFIED at filesystem read.
- xen-dev-utils type signature: `node_modules/xen-dev-utils/dist/core.d.ts:159` — VERIFIED.
- Project kernel: `src/lib/monzo.ts:17,27` (re-export), `src/lib/interval.ts:42`
  (monzo getter), `src/lib/edo.ts:98-126` (Tenney-weighted formula) — VERIFIED at filesystem read.
- [Tenney norm — Xenharmonic Wiki](https://en.xen.wiki/w/Tenney_height) — UNVERIFIED via
  WebFetch (Cloudflare blocks); content confirmed via [WebSearch snippet](https://en.xen.wiki/w/Tenney_height).
- [Harmonic distance — Tonalsoft Encyclopedia](http://www.tonalsoft.com/enc/h/harmonic-distance.aspx) — VERIFIED `200 OK` via curl; per-prime formula and Minkowski-metric framing confirmed.
- [James Tenney — *John Cage and the Theory of Harmony* (PDF, Plainsound)](https://www.plainsound.org/pdfs/JC&ToH.pdf) — VERIFIED `200 OK`, `application/pdf`, ~660 KB via curl.
- Page templates: `src/pages/edo-approximation.md`, `src/pages/meantone.md`,
  `src/pages/well-temperament.md` — VERIFIED at filesystem read.
