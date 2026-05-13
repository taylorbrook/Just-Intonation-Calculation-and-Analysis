---
quick_id: 260513-91h
slug: consistency-pass-cents-formatting-sectio
date: 2026-05-13
flags: [--validate]
status: complete
last_source_commit: cd359ba
---

# SUMMARY — Consistency pass across 13 theory pages

Cross-page consistency pass for cents formatting, section ordering (Prerequisites callout), and Interval-constructor audit. 13 theory pages touched (excluding `analysis.md` and `commas.md`), plus one stylesheet change.

## What changed

### (a) Cents formatting

Rule applied:

- **Tables** (`.toFixed(N)` cells, comparison tables, etc.) → **2 decimals**.
- **Inline prose** (default) → **1 decimal**.
- **Sub-cent meantone-style precision** → **3 decimals** (1/4-comma vs 1/6-comma fifths, schismatic 0.244¢ narrowing).
- **Canonical anchors preserved at 3dp in prose:** `701.955¢` (pure 5th), `386.314¢` (5/4), `968.826¢` (7/4), `21.506¢` (syntonic comma), `23.460¢` (Pythagorean comma), `1.954¢` (schisma), `27.264¢` (septimal comma). Per the user's preview pattern (`"the syntonic comma (~21.506¢)"`), prose mentions of these values were upgraded from 1dp/2dp.

Specific upgrades made:

| Page | From → To |
|---|---|
| harmonic-series.md | partials table `.toFixed(1)` → `.toFixed(2)`; literal `+0.0` → `+0.00` reference |
| prime-limits.md | reactive limit-table `.toFixed(1)` → `.toFixed(2)` |
| syntonic-comma.md | `~21.5¢` → `~21.506¢` (prose only — tex left alone) |
| comma-pump.md | 4× `21.5¢` / `~21.5¢` → `21.506¢` / `~21.506¢` (anchor) |
| pythagorean-comma.md | 2× `23.46¢` → `23.460¢` (anchor) |
| pythagorean-tuning.md | `701.96¢` → `701.955¢`, `678.49¢` → `678.495¢`, `~23.5¢` → `~23.460¢` |
| meantone.md | `+23.46¢` → `+23.460¢`, `~21.5¢` → `~21.506¢` |
| edo-approximation.md | 11× sub-cent 2dp → 1dp (`~1.08¢` → `~1.1¢`, `~0.78¢` → `~0.8¢`, etc.) |
| schisma.md | `~23.46¢` / `~21.5¢` / `~1.95¢` → 3dp; `701.71¢ / 701.96¢` → `701.711¢ / 701.955¢`; `0.24¢` → `0.244¢` (2 sites) |
| septimal-comma.md | `~27.26¢` → `~27.264¢` |

Explicitly **not touched** (per PLAN):

- `tex` math expressions (author-controlled prose statements).
- Kernel-cell code comments (e.g. `//  701.955¢` developer notes).
- Plot chart annotation strings (chart self-contained context).
- Bare-integer prose with `~` prefix used as pedagogical approximation (e.g. `~969¢`, `~43¢` — author chose 0dp deliberately).

### (b) Section ordering — Prerequisites aside

Added `<aside class="prereq">…</aside>` between the synth cell and the first kernel cell on **12 pages** (every theory page except `harmonic-series.md`, the foundation — no upstream prereq).

Per-page prereq mapping (semantic, not config-toc order):

| Page | Prereqs |
|---|---|
| harmonic-series | _foundation — no aside_ |
| monzos | the harmonic series |
| prime-limits | monzos, the harmonic series |
| odd-limits | prime-limits |
| otonality-utonality | the harmonic series, prime-limits |
| syntonic-comma | the harmonic series, prime-limits |
| comma-pump | the syntonic comma |
| pythagorean-comma | prime-limits |
| pythagorean-tuning | the Pythagorean comma, the harmonic series |
| meantone | the syntonic comma, Pythagorean tuning |
| edo-approximation | prime-limits, Pythagorean tuning, meantone |
| schisma | the Pythagorean comma, the syntonic comma |
| septimal-comma | prime-limits, the syntonic comma |

### (c) CSS rule

Added a quiet left-rule callout style to `src/styles.css`:

```css
aside.prereq {
  font-family: var(--sans-serif);
  font-size: 14px;
  color: var(--theme-foreground-muted);
  padding: 8px 12px;
  border-left: 3px solid var(--theme-foreground-faint, var(--theme-foreground-muted));
  background: color-mix(in oklab, var(--theme-foreground-muted) 4%, var(--theme-background));
  margin-block: 16px;
  border-radius: 0 4px 4px 0;
}
/* + strong / a / a:hover rules */
```

Visual intent: reads as **scaffolding**, not a warning — left-aligned with the page rhythm, muted enough to skip past once the reader internalises the linkage, prominent enough to spot on first visit.

### (d) Interval constructor audit

`grep -nE 'new Interval\([^"]' src/pages/*.md` returned only `(s)` invocations inside `.map((s) => new Interval(s))` callbacks where `s` is a string from an array literal. **All `new Interval(...)` calls across the 13 pages already use string arguments.** No code changes required — this confirmed the existing BigInt-Fraction discipline (R-01 / Pitfall #1).

## Decisions made during the pass

1. **Canonical-anchor 3dp rule applies only where the value appears as a cited reference.** Bare-integer approximations in prose like "around 700¢" or "~43¢ after cycle 2" are left as integers — author-chosen approximation, not precision loss.
2. **Chart annotations are their own context.** `Plot.text` labels inside chart IIFEs (e.g. `+23.46¢`, `-21.5¢` in comma-pump's drift chart) were left at their existing precision — they're self-contained visual elements, not prose.
3. **Tex math is author-controlled.** `${tex`\approx 21.5\text{¢}`}` and similar are left alone everywhere — the user explicitly said tex is the author's prose statement.
4. **Foundation pages have no prereq aside.** `harmonic-series.md` is the structural root; adding a "Prerequisites: none" aside would be redundant noise.

## Verification

- `grep -c 'aside class="prereq"' src/pages/*.md` → 12 hits (one per page, exactly the 12 expected).
- `npm run build` → clean, all 15 page renders + index, **95 links validated** (the new relative `./xxx` aside links pass Framework's link checker).
- Rendered HTML inspection (`dist/pages/meantone.html`) confirms aside markup survives Framework's transpilation.
- Interval audit: only `(s)` matches, all from `.map((s) => new Interval(s))`.

## Commit list (14 commits)

```
cd359ba chore(260513-91h): src/pages/septimal-comma.md — prereq aside + canonical anchor
499eb8d chore(260513-91h): src/pages/schisma.md — prereq aside + canonical anchors
8a02cbb chore(260513-91h): src/pages/edo-approximation.md — prereq aside + 1dp inline
099369e chore(260513-91h): src/pages/meantone.md — prereq aside + canonical anchors
78549f3 chore(260513-91h): src/pages/pythagorean-tuning.md — prereq aside + canonical anchors
7c9bd3c chore(260513-91h): src/pages/pythagorean-comma.md — prereq aside + canonical anchors
093d360 chore(260513-91h): src/pages/comma-pump.md — prereq aside + canonical anchors
fb603c6 chore(260513-91h): src/pages/syntonic-comma.md — prereq aside + canonical anchor
2e7d901 chore(260513-91h): src/pages/otonality-utonality.md — prereq aside
639d87f chore(260513-91h): src/pages/odd-limits.md — prereq aside (prime-limits)
654a975 chore(260513-91h): src/pages/prime-limits.md — prereq aside + table cents 2dp
286e495 chore(260513-91h): src/pages/monzos.md — prereq aside (harmonic series)
d2a87a2 chore(260513-91h): src/pages/harmonic-series.md — table cents to 2dp
2a922f7 chore(260513-91h): src/styles.css — add aside.prereq theory-page callout style
```

## Out of scope (per user)

- `analysis.md` — interactive analysis app, structurally different.
- `commas.md` — glossary index, structurally different.
- Dashboard `src/index.md`.
- Kernel modules (`src/lib/`, `src/audio/`, `src/components/`).
- Page semantics (rewording, link removal, example changes).

## Open question (none blocking)

The prereq URLs use relative form `./harmonic-series` whereas existing in-prose links use absolute `/pages/harmonic-series`. Both resolve correctly under Framework's router (build pass with 95 links validated), but a future task could normalise to one form for visual consistency.
