---
quick_id: 260512-aph
slug: add-prime-limits-theory-page
date: 2026-05-12
status: complete
commit: fb5a736
---

# Summary — add prime-limits theory page

## What changed

- **New page** `src/pages/prime-limits.md` introducing prime-limit
  classification as *the largest prime that appears with non-zero exponent
  in the ratio's monzo*. Walks 3-limit (just fifth `3/2`, Pythagorean major
  second `9/8`) → 5-limit (just major triad `4:5:6` audtioned member by
  member as `1/1`, `5/4`, `3/2`) → 7-limit (harmonic seventh `7/4`) →
  11-limit (undecimal semi-augmented fourth `11/8`) with `playInterval` at
  every rung. Each section calls out the worked monzo so the reader sees
  *which prime exponent forced the bump up*.
- **Sidebar registration** in `observablehq.config.ts` — *Prime-limits*
  inserted immediately after *Monzos* in **Theory notes**. Keeps the group
  pedagogically ordered (foundations → notation → prime-limits →
  otonality/utonality → commas).
- **`src/pages/harmonic-series.md`** — removed the
  `*(forward link: page lands in a later quick task; the harmonic series
  is the prerequisite.)*` parenthetical from the *Prime-limits* bullet in
  the "Why this is the ground floor" section. The forward-link is now to
  a real page, so the placeholder no longer applies.

## Walkthrough notes

- Definition opens with the rule and a single ${tex`\text{p-limit}(\cdot)`}
  KaTeX block so the reader has the closed-form before any examples.
- Each prime-limit section reuses the same shape: defining prose, worked
  monzo, play button(s). The monzos are written out explicitly with the
  primes called out (e.g. ${tex`2^{-2} \cdot 5^{1}`}), reinforcing the
  Monzos page's notation rather than just gesturing at it.
- The "Limits in the kernel" section quotes `src/lib/commas.ts`'s existing
  `// 5-limit / // 7-limit / // 11-limit` section comments — surfaces
  that the page's classification is already load-bearing in the kernel,
  not just a teaching abstraction.

## Files touched

| File | Change |
|------|--------|
| `src/pages/prime-limits.md` | created (160 lines) |
| `observablehq.config.ts` | +1 line (sidebar entry) |
| `src/pages/harmonic-series.md` | -2 lines (parenthetical removed) |

## Acceptance

- [x] `npm run lint:types` passes — no TS errors in the new fenced cells.
- [x] Page registered in the sidebar after *Monzos*, before *Otonality &
      utonality*.
- [x] One `playInterval` button at every prime-limit step (3 → 5 → 7 →
      11): `3/2`, `9/8`, `1/1`, `5/4`, `3/2` again, `7/4`, `11/8`.
- [x] References `commas.ts`'s 5-/7-/11-limit grouping with an inline
      quote of the section-comment headers.
- [x] Cross-links: `/pages/harmonic-series`, `/pages/odd-limits` (forward
      link, still TBD), `/pages/septimal-comma`, `/pages/monzos`,
      `/pages/syntonic-comma`.

## Gaps surfaced (not blocking)

- `/pages/odd-limits` still does not exist. The new page forward-links to
  it using the same pattern as `otonality-utonality.md:196` and
  `harmonic-series.md`. When the odd-limits page lands in a follow-up
  quick task, that page should *also* gain a back-link from prime-limits
  in the "See also" section (currently the forward-link prose is correct
  and just becomes a live cross-reference at that point — no rewrite
  needed here).

## Out of scope

- 13-limit / 17-limit walk-through — mentioned only in passing ("and so
  on"). The user asked for 3/5/7/11 and the four-rung ladder is the
  natural pedagogical stopping point.
- Tempering / regular-mapping — prime-limit is the *no-tempering* layer.
- 4:5:6 simultaneous-chord button — `/pages/otonality-utonality` already
  demonstrates that pattern for `4:5:6:7`. The prime-limits page sticks
  to per-rung dyads (which is what the user asked for: "playInterval at
  each step").

## Commit

`fb5a736` — feat(quick-260512-aph): add prime-limits theory page
