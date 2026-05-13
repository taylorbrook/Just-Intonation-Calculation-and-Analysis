---
quick_id: 260513-91h
slug: consistency-pass-cents-formatting-sectio
date: 2026-05-13
flags: [--validate]
status: in-progress
---

# Consistency pass across 13 theory pages

## Scope (13 pages, in config-toc order)

Excluded: `src/pages/analysis.md` (interactive analysis app), `src/pages/commas.md` (glossary index).

Included:

1. `harmonic-series.md`
2. `monzos.md`
3. `prime-limits.md`
4. `odd-limits.md`
5. `otonality-utonality.md`
6. `syntonic-comma.md`
7. `comma-pump.md`
8. `pythagorean-comma.md`
9. `pythagorean-tuning.md`
10. `meantone.md`
11. `edo-approximation.md`
12. `schisma.md`
13. `septimal-comma.md`

## Three changes

### (a) Cents formatting

Rule (user-confirmed):

- **Tables / table-like cells:** 2 decimals (`701.96¢`, `21.51¢`).
- **Inline prose (default):** 1 decimal (`23.5¢`, `~21.5¢`).
- **Sub-cent meantone-style precision:** 3 decimals where the next decimal is meaningful (e.g. distinguishing 1/4-comma from 1/6-comma fifths: `696.578¢` vs `698.371¢`).
- **Canonical anchors (preserve 3 decimals in prose too):**
  - `701.955¢` — pure 5th (3/2)
  - `386.314¢` — 5-limit major 3rd (5/4)
  - `315.641¢` — 5-limit minor 3rd (6/5)
  - `407.820¢` — Pythagorean major 3rd (81/64)
  - `203.910¢` — 9/8 (Pythagorean / 5-limit M2)
  - `968.826¢` — 7/4 (harmonic 7th)
  - `551.318¢` — 11/8 (undecimal)
  - `21.506¢` — syntonic comma (81/80)
  - `23.460¢` — Pythagorean comma
  - `1.954¢`  — schisma
  - `27.264¢` — septimal comma (64/63)

Round half-to-even when truncating (`27.265¢ → 27.26¢` at 2 decimals; `21.55¢ → 21.6¢` at 1).

**Do not change:** `tex` math expressions (e.g. `\frac{81}{80} \approx 21.5\text{¢}`) — these are author-controlled prose statements where the author already chose precision. Only adjust **free-floating cents numbers in prose and table cells** rendered from code.

### (b) Section ordering — add Prerequisites aside

Target structure for every theory page:

```
# Title
Tagline (one sentence).

```ts
imports
```

```ts
synth cell
```

<aside class="prereq">
<strong>Prerequisites:</strong>
<a href="./xxx">title</a>, <a href="./yyy">title</a>
</aside>

```ts
kernel cell(s)
```

body prose…
```

Per-page prereq mapping (semantic, not config-order):

| Page | Prereqs |
|---|---|
| harmonic-series | _foundation — no aside_ |
| monzos | [the harmonic series](./harmonic-series) |
| prime-limits | [monzos](./monzos), [the harmonic series](./harmonic-series) |
| odd-limits | [prime-limits](./prime-limits) |
| otonality-utonality | [the harmonic series](./harmonic-series), [prime-limits](./prime-limits) |
| syntonic-comma | [prime-limits](./prime-limits) |
| comma-pump | [the syntonic comma](./syntonic-comma) |
| pythagorean-comma | [prime-limits](./prime-limits) |
| pythagorean-tuning | [the Pythagorean comma](./pythagorean-comma) |
| meantone | [the syntonic comma](./syntonic-comma), [Pythagorean tuning](./pythagorean-tuning) |
| edo-approximation | [prime-limits](./prime-limits), [Pythagorean tuning](./pythagorean-tuning) |
| schisma | [the Pythagorean comma](./pythagorean-comma), [the syntonic comma](./syntonic-comma) |
| septimal-comma | [prime-limits](./prime-limits), [the syntonic comma](./syntonic-comma) |

`harmonic-series.md` is the foundation — no aside added. (User instruction was "where missing"; semantically it has no upstream.)

### (c) Interval constructor audit

Grep confirms: all `new Interval(...)` calls across `src/pages/*.md` use string arguments (`new Interval("3/2")`). No float literals or numeric ratio shorthand. **No code changes required** — this becomes a confirmation step recorded in SUMMARY.md.

## CSS rule (one-time)

Add to `src/styles.css` (after the existing helpers, before component imports if they aggregate from the bottom — actually append at end):

```css
/* Theory-page Prerequisites callout.
 * Sits between the synth cell and the first kernel cell. Visually quiet —
 * a left rule and muted text, so it reads as scaffolding, not as a warning. */
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
aside.prereq strong {
  color: var(--theme-foreground);
  margin-right: 4px;
}
aside.prereq a {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--theme-foreground-faint, currentColor);
  text-underline-offset: 2px;
}
aside.prereq a:hover {
  color: var(--theme-foreground);
}
```

## Commit plan

One atomic commit per page using the `260513-91h` prefix:

- `chore(260513-91h): src/styles.css — add aside.prereq theory-page callout style`
- `chore(260513-91h): src/pages/monzos.md — prereq aside + cents formatting`
- … (12 page commits)
- `chore(260513-91h): src/pages/septimal-comma.md — prereq aside + cents formatting`
- `chore(260513-91h): .planning/quick/260513-91h — PLAN + SUMMARY + STATE row`

For `harmonic-series.md`, the commit message notes "cents formatting only — foundation page, no prereq".

## Verification (--validate)

1. Grep `aside class="prereq"` count must equal 12 (all theory pages except harmonic-series).
2. Grep `new Interval(` in src/pages/ — every match's first arg must be a string literal.
3. Spot-check 3 pages render: `pythagorean-tuning`, `meantone`, `schisma`.
4. No content semantic changes — diffs should be cents-precision tweaks + aside insertion + no removed prose.

## What is explicitly NOT touched

- `tex` math expressions (author-controlled prose precision).
- `// inline code comments` cents annotations (e.g. `//  701.955¢` — these are kernel-cell developer notes, not prose).
- `analysis.md`, `commas.md`, dashboard `index.md`.
- Page semantics: no rewordings, no link removals, no example changes.
