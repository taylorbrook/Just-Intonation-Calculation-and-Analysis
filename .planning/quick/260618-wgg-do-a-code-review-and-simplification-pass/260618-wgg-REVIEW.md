---
quick_id: 260618-wgg
title: Code review + simplification pass — src/lib math kernel
scope: src/lib (20 modules, ~3,482 LOC)
mode: review-only (no code changes)
date: 2026-06-19
status: complete
---

# Code Review — `src/lib` Math Kernel

**Scope:** the 20 hand-written kernel modules in `src/lib/` (~3,482 LOC), the
correctness-critical core. Deliverable is a **review report only** — no code was
changed. Recommendations below are ranked by leverage; nothing here is applied.

## Overall assessment

The kernel is **in very good shape**: immaculately documented (every module has a
design-intent header citing the decision IDs it implements), uniformly defensive
(every untrusted-input entry point has a fail-closed cap), disciplined about the
BigInt-vs-cents boundary (Pitfall #1 is respected everywhere), and backed by
~9,200 LOC of tests. **No high-severity correctness bugs were found.**

The value of this pass is almost entirely **simplification / DRY**: the same
"build a JI scale" tail — *dedupe by exact ratio → sort by cents → append the
period* — is hand-written **eight times in three different idioms**, and two
text-normalization helpers are copy-pasted verbatim across the two I/O modules.
Consolidating these would remove ~80–120 LOC, delete an O(n²) path, and collapse
three equivalent-but-different dedupe keys into one source of truth.

**Severity legend:** 🟥 correctness · 🟧 simplification (high leverage) · 🟨 consistency / minor · ⬜ doc nit

---

## Top 5 (if you do nothing else)

1. **[S1] Extract the dedupe→sort→append-period tail into one helper** — 8 call sites, 3 idioms, one O(n²) path. *(highest leverage)*
2. **[S2] Move `utf8ByteLength` + `normalizeLines` into `text.ts`** — verbatim duplication; the shared home already exists.
3. **[S3] Export shared `UNISON` / `OCTAVE` `Interval` singletons** — `Interval` is immutable; 6 modules each re-declare them, others allocate inline per-call.
4. **[D1] Delete dead re-exports `monzoAdd` / `monzoSub` / `monzoScale` / `wilsonHeight`** — zero usages anywhere in the repo (not even tests).
5. **[C1] Standardize the "is this above 1/1?" guard** — same check written 4 ways across interval/scale/harmonic/generators.

---

## 🟧 Simplification (high leverage)

### S1 — The dedupe→sort→append-period tail is duplicated 8× in 3 idioms
**Locations (confirmed):**
- `scale.ts:76-92` (`Scale.reduce`) — `.some(equals)` dedupe + sort + append-if-missing
- `scale.ts:99-105` (`Scale.dedupe`) — `.some(equals)` dedupe
- `scale.ts:196-207` (`jiSubsetOfEdo`) — `Set<toFraction()>` + skip-period + unconditional append (no sort)
- `cps.ts:107-123` — `Set<toFraction()>` + sort + unconditional append
- `harmonic.ts:57-77` (`foldToOctave`) — octave-reduce + `Set<toFraction()>` + sort + append-if-missing
- `generators.ts:78-96` (`foldExactSet`) — `Set<toFraction()>` + sort + append-if-missing
- `edo.ts:186-199` (`bestJiInEdo`) — `Set<toFraction()>` + skip-period + unconditional append (no sort)
- `mos.ts:185-204` (`buildMos`) — `Set<`${n}/${d}`>` + sort + append-if-missing

**Three dedupe-key idioms for identical semantics:**
| Idiom | Sites |
|-------|-------|
| `iv.fraction.toFraction()` as Set key | cps, harmonic, generators, scale.jiSubsetOfEdo, edo.bestJiInEdo |
| `` `${String(iv.fraction.n)}/${String(iv.fraction.d)}` `` as Set key | mos.buildMos |
| `arr.some((d) => d.equals(iv))` | scale.reduce, scale.dedupe |

All three are correct (fraction.js normalizes sign+GCD on construction, so both
string forms are canonical and `.equals` agrees), but they are **three spellings
of one concept**, and the `.some(equals)` form is **O(n²)** where the others are O(n).

**Why it matters:** this is the single biggest readability + consistency win in the
kernel. A future contributor adding a new generator has to pick one of three
patterns by reading neighbors. The two `.some(equals)` sites (`Scale.reduce`,
`Scale.dedupe`) also pay an unnecessary O(n²) cost (documented as acceptable in
`scale.ts:14-18`, but free to fix if unified).

**Recommendation (review-only — not applied):**
- Add a canonical key accessor on `Interval`, e.g. a `key` getter returning
  `` `${n}/${d}` `` (defines the dedupe key **once**), and route every Set-based
  dedupe through it.
- Add a small shared helper — `src/lib/scale-ops.ts` (or static methods on `Scale`) —
  e.g. `finalizeScale(intervals, period, { sort = true })` that does
  *dedupe-by-key → optional sort-by-cents → append period if not already last*.
  Replace all 8 sites with it (`Scale.reduce`/`dedupe` included, dropping the O(n²) path).
- Subtlety to preserve: `jiSubsetOfEdo` / `bestJiInEdo` currently rely on
  nearest-ratio insertion order being monotonic (so they skip the sort). A unifying
  helper that *always* sorts is harmless and makes that reliance explicit instead of
  load-bearing-and-undocumented.

---

### S2 — `utf8ByteLength` and `normalizeLines` are duplicated verbatim
**Locations:** `scala.ts:68-71` ≡ `kbm.ts:84-87` (`utf8ByteLength`, identical body
*and* comment); `scala.ts:245-248` ≡ `kbm.ts:94-96` (`normalizeLines`), with the same
`stripBom(text).replace(/\r\n?/g, "\n").split("\n")` expression also **inlined a third
time** in `scala-archive.ts:61`.

**Why it matters:** `text.ts` already exists *expressly* as the shared
text-normalization home (and both modules already import `stripBom` from it). This is
the cleanest possible consolidation — move both helpers there, import them.

**Recommendation:** lift `utf8ByteLength` and `normalizeLines` into `text.ts`; have
`scala.ts`, `kbm.ts`, and `scala-archive.ts` import them. ~15 LOC removed, single
source of truth for the 1 MB cap + CRLF/BOM rule.

---

### S3 — Shared `UNISON` / `OCTAVE` singletons
**Locations:** local re-declarations in `mos.ts:82` (`ONE`), `generators.ts:49-51`
(`OCTAVE`,`UNISON`), `harmonic.ts:50` (`OCTAVE`), `constant-structure.ts:43` (`UNISON`),
`sonicweave.ts:73` (`UNISON`) — **plus** per-call inline allocations in
`interval.ts:131` (`new Interval("2/1")` on *every* `octaveReduce`),
`scale.ts:41` (`new Fraction(1n,1n)` per construct), `cps.ts:60,84`, `scala.ts:154,264`,
`diamond.ts` default.

**Why it matters:** `Interval` is immutable by contract (`readonly fraction`, private
lazy caches) — so a single shared `UNISON`/`OCTAVE` instance is safe to reuse
everywhere, removing both the scatter of local constants and the repeated allocation
in hot paths (`octaveReduce` is called in every generator's inner loop).

**Recommendation:** export `UNISON` and `OCTAVE` singletons from `interval.ts` (or a
tiny `constants.ts`); replace the local consts and inline allocations. Pairs naturally
with C1 below.

---

## 🟨 Consistency

### C1 — The "> 1/1" guard is written 4 ways
**Locations:** `scale.ts:41` (`p.fraction.compare(new Fraction(1n,1n)) <= 0`),
`interval.ts:133` (`p.fraction.compare(one) <= 0`),
`harmonic.ts:165` (`equave.fraction.compare(new Interval("1/1").fraction) <= 0`),
`generators.ts:238` (`equave.fraction.compare(UNISON.fraction) <= 0`).
Same predicate, four spellings, two of which allocate a throwaway `1/1`.

**Recommendation:** a shared predicate — `Interval.prototype.gt(other)` /
`isAboveUnison(iv)` — built on the shared `UNISON` (S3). Centralizes the period > 1/1
contract that `Scale`, `Interval.octaveReduce`, `adoScale`, and `edScale` all enforce.

### C2 — Non-positive-ratio guard is also re-spelled per module
**Locations:** `interval.ts:145` (`f.s < 0n || f.n === 0n`),
`cps.ts:75` (`f.fraction.s < 0n || f.fraction.n === 0n`),
`sonicweave.ts:135` (`f.s < 0n || Number(f.n) === 0`),
`scala.ts:349` (`Number(numStr) <= 0 || Number(denStr) <= 0`).
**Recommendation:** an `isPositive(iv)` predicate on `Interval`. Low priority but it
removes the same fail-closed check from four boundaries.

### C3 — `centsFrom12tet` defined twice
**Locations:** `interval.ts:109-112` (getter) and `cents.ts:18-20` (function) — same
formula `c - Math.round(c/100)*100`. Have the getter delegate to the function (or vice
versa) so the projection lives once.

### C4 — `sonicweave.ts:135` mixes Number and BigInt comparison
`if (f.s < 0n || Number(f.n) === 0)` — the comment (lines 130-135) explains `f.s`/`f.n`
arrive as runtime **Numbers** here, yet the sign test compares to `0n`. It *works*
(JS relational `<` allows mixed number/bigint), but reads as if `f.s` were a BigInt.
`f.s < 0` would be clearer and match the documented reality. ⬜ cosmetic.

---

## ⬜ Dead code / unused surface

### D1 — Dead re-exports in `monzo.ts`
Confirmed via whole-repo grep (excluding the defining file): **zero usages anywhere,
including tests**, for:
- `monzoAdd` (`monzo.ts:34`)
- `monzoSub` (`monzo.ts:35`)
- `monzoScale` (`monzo.ts:36`)
- `wilsonHeight` (re-exported `monzo.ts:28`)

These are boundary re-exports of xen-dev-utils functions that no consumer ever calls.
`INVENTORY.md` lists them as intentional wrappers, but they are unused API surface that
implies usage. **Recommendation:** delete the four (and their INVENTORY rows), or, if
kept deliberately as a "stable boundary," add a one-line note that they're
forward-looking and intentionally unconsumed.

### D2 — `benedettiHeight` implemented but only tested
`monzo.ts:46` — a real custom function (exact BigInt `n*d`) used **only** by
`monzo.test.ts`, no production/component/page consumer. Not dead (it's a documented
kernel primitive others may reach for), but worth knowing it has no live caller today.
⬜ informational, not a recommendation to remove.

### D3 — `fokker.ts` re-declares its own `PRIMES`
`fokker.ts:65` hand-rolls `const PRIMES = [2,3,5,...,37]` while `monzo.ts:29` already
re-exports xen-dev-utils' `PRIMES`. fokker already imports from xen-dev-utils
(`toMonzo`, `integerDet`), so it could import `PRIMES` too. **Recommendation:** reuse the
shared `PRIMES`; removes a hand-maintained list that could silently drift (the local
one stops at 37 — fine today, but a second source of truth).

---

## 🟥 Correctness

No high- or medium-severity correctness bugs found. Two low-severity observations:

### B1 — `bestEdosForScale` counts both endpoints as zero-error degrees
`edo.ts:101` builds `idealCentsList` from **all** intervals including the unison (0¢)
*and* the period (1200¢ for an octave scale). Both are perfect fits at every EDO, so
each contributes 0 to max/RMS and inflates the RMS denominator by 2 "free" points.
This does **not** affect *ranking* (the dilution is identical across all EDOs), so it's
a modeling nuance, not a bug — but the reported RMS/max values are slightly optimistic
versus a body-only error metric. The code comments the unison case (lines 99-100) but
not the period. ⬜ Decide whether endpoints belong in the error population; document
the choice either way.

### B2 — verify the monotonic-insertion-order assumption is intended
`jiSubsetOfEdo` (`scale.ts:196-207`) and `bestJiInEdo`/odd (`edo.ts:186-199`) **skip the
sort**, relying on nearest-ratio results being produced in ascending-cents order. This
holds (nearest-neighbor on a sorted candidate set is monotonic in the query), but it's
an undocumented invariant that differs from every other builder (which sorts). Folding
these into the S1 helper (which always sorts) removes the fragility for free.

---

## ⬜ Doc nits

- **`scale.ts:179-180`** — fallback comment says "*at 50¢ tolerance and
  maxExponent=8*", but the actual `approximatePrimeLimit` call (`scale.ts:168-175`) uses
  **`maxExponent=5`** (line 168 even explains *why* 8 overflows). Stale "8" — should read 5.
- **General:** module headers are excellent but heavy (some 50+ line preambles, e.g.
  `mos.ts:1-77`). Not a problem — flagging only because if S1/S2/S3 land, several of
  these headers' "this module hand-rolls the dedupe/cap idiom" passages can be trimmed
  to point at the shared helper instead of re-describing it.

---

## What was NOT done

Per the chosen deliverable (**review report only**), **no source files were modified**
and **no tests were run** beyond reading. Every item above is a recommendation. A
natural follow-up is a scoped `/gsd-quick` to apply S1–S3 + D1 (the safe, high-confidence
set), each change verified against the existing `src/lib/__tests__` suite.
