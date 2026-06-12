# Phase 7: SonicWeave Adapter — Tempered, Lattice & Free-Text - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 7-sonicweave-adapter-tempered-lattice-free-text
**Areas discussed:** Rank-2 widget design, Well-temperament input, Fokker block specification, Free-text escape hatch UX

---

## Rank-2 widget design

| Option | Description | Selected |
|--------|-------------|----------|
| Presets + manual (Recommended) | Preset select (Pythagorean, ¼-comma meantone, porcupine, hanson, magic…) fills generator/period/up-down; everything editable. Mirrors CPS preset precedent. | ✓ |
| Manual only | Just generator/period/up-down fields; user must know their generator values. | |
| You decide | Claude's discretion at planning time. | |

**User's choice:** Presets + manual

| Option | Description | Selected |
|--------|-------------|----------|
| Quarter-comma meantone (Recommended) | Tempered fifth ≈696.6¢, 7 notes — showcases the new tempered capability with badge. | ✓ |
| Pythagorean diatonic (3/2, pure) | Exact JI, matches buildMos cross-check; duplicates the MOS builder. | |
| You decide | Claude picks at planning time. | |

**User's choice:** Quarter-comma meantone default landing

| Option | Description | Selected |
|--------|-------------|----------|
| Tied to presets (Recommended) | POTE/TE/CTE select active with a named preset (preset defines commas); manual entry shows "custom". | ✓ |
| Always visible, pure fallback | Select always shown; optimal options disabled for manual generators. | |
| You decide | Claude resolves within the blueprint's requirement. | |

**User's choice:** Tuning select tied to presets

| Option | Description | Selected |
|--------|-------------|----------|
| Up/down counts (Recommended) | Generators stacked up vs down from 1/1 (SW native rank2 signature; mode control for free). | ✓ |
| Total note count | Single "notes" field like the MOS builder; widget derives up/down. | |
| You decide | Claude picks at planning time. | |

**User's choice:** Up/down generator counts

---

## Well-temperament input

| Option | Description | Selected |
|--------|-------------|----------|
| Presets + custom mode (Recommended) | Preset select fills per-fifth comma fractions; custom mode exposes raw fraction fields. | ✓ |
| Presets only | Named historical temperaments only; custom via free-text hatch. | |
| Raw fields only | Eleven per-fifth comma-fraction inputs, no presets. | |

**User's choice:** Presets + custom mode

| Option | Description | Selected |
|--------|-------------|----------|
| Werckmeister III (Recommended) | The canonical, most-cited well-temperament. | |
| Vallotti | The 18th-century performer's default; six pure + six 1/6-comma fifths. | ✓ |
| You decide | Claude picks at planning time. | |

**User's choice:** Vallotti default landing (declined the recommendation)

| Option | Description | Selected |
|--------|-------------|----------|
| Selectable comma (Recommended) | Pythagorean/syntonic presets + arbitrary n/d field in custom mode. | |
| Fixed per context | Presets carry their historical comma; custom mode fixes Pythagorean. | ✓ |
| You decide | Claude resolves at planning time. | |

**User's choice:** Fixed per context (declined the recommendation)

| Option | Description | Selected |
|--------|-------------|----------|
| Core four (Recommended) | Werckmeister III, Kirnberger III, Vallotti, Young II. | |
| Extended set | Core four plus Neidhardt, Kellner, Lehman "Bach", Young I. | ✓ |
| You decide | Claude picks a defensible roster, core four minimum. | |

**User's choice:** Extended preset set (declined the recommendation)

---

## Fokker block specification

| Option | Description | Selected |
|--------|-------------|----------|
| Basis + extents (Recommended) | Basis chips + per-axis extents — maps onto SW parallelotope, thin wrapper. | |
| Unison vectors (commas) | Classic Fokker formulation; needs HNF/determinant math via xen-dev-utils. | |
| Both modes | Basis+extents primary with comma-entry mode added — most complete, most effort. | ✓ |

**User's choice:** Both modes (declined the recommendation)

| Option | Description | Selected |
|--------|-------------|----------|
| Basis default, commas required (Recommended) | Lands in basis+extents; comma mode is a toggle and MUST ship this phase. | ✓ |
| Basis default, commas stretch | Comma mode can slip to Phase 8 if HNF math drags. | |
| Comma mode default | Classic formulation first; heaviest path first. | |

**User's choice:** Basis default, comma mode required this phase

| Option | Description | Selected |
|--------|-------------|----------|
| Classic 5-limit 12-tone (Recommended) | Commas 81/80 + 128/125 (basis 3×5 region) → 12 notes; canonical example + test vector. | ✓ |
| Small 7-note 5-limit block | 81/80 + 25/24 → 7-note JI "diatonic". | |
| You decide | Claude picks a verifiable canonical block. | |

**User's choice:** Classic 5-limit 12-tone default

| Option | Description | Selected |
|--------|-------------|----------|
| Live note-count readout (Recommended) | "|det| → 12 notes" shown next to inputs; makes comma→cardinality visible. | ✓ |
| Preview table only | Row count tells you; one less moving part. | |
| You decide | Claude resolves at planning time. | |

**User's choice:** Live note-count readout

---

## Free-text escape hatch UX

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-filled working example (Recommended) | Real expression (e.g. cps([1,3,5,7], 2)) evaluated on first render; editing it is the tutorial. | ✓ |
| Placeholder + examples menu | Empty textarea + "insert example" select. | |
| Empty + placeholder only | Bare escape hatch. | |

**User's choice:** Pre-filled working example

| Option | Description | Selected |
|--------|-------------|----------|
| Docs link (Recommended) | External link to SonicWeave docs; further-reading idiom, zero maintenance. | ✓ |
| Inline cheat-sheet | Collapsible builtins reference; must be authored and kept accurate. | |
| No help affordance | Just the textarea. | |

**User's choice:** Docs link

| Option | Description | Selected |
|--------|-------------|----------|
| Raw SonicWeave message (Recommended) | Compiler's own error text verbatim (textContent-safe). | ✓ |
| Friendly prefix + raw detail | Human line + raw message beneath. | |
| You decide | Claude picks at planning time. | |

**User's choice:** Raw SonicWeave message

| Option | Description | Selected |
|--------|-------------|----------|
| Full multi-line program (Recommended) | evaluateSource handles multi-line source; 8KB cap bounds it. | ✓ |
| Single expression only | One-line input. | |
| You decide | Claude resolves at planning time. | |

**User's choice:** Full multi-line programs

---

## Claude's Discretion

- Exact rank-2 preset roster beyond the named examples + per-preset default up/down counts (D-17).
- Adapter error shape, rational-vs-tempered discriminator verification, defense-in-depth caps (D-18).
- Fokker comma-mode input idiom and mode-toggle state preservation (D-19).
- Which SonicWeave docs URL the free-text widget links to (D-20).

## Deferred Ideas

- Inline SonicWeave cheat-sheet / examples menu for the free-text widget.
- Comma select for custom well-temperaments (syntonic/arbitrary) — custom syntonic goes through free-text for now.
- "Show the SonicWeave code behind this widget" (Scale Workshop template-inserter pattern) — v2 bridge.
- Temperament finder (x31eq search-then-pick) — out of v1.1.
