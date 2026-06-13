# Phase 8: Preview, Transforms & Advanced Generators - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 8-preview-transforms-advanced-generators
**Areas discussed:** Circle-of-pitches design, Transform strip behavior, Wilson / metallic widget, Constant-structure widget

---

## Circle-of-pitches design

### Rim labels
| Option | Description | Selected |
|--------|-------------|----------|
| Match the table convention | JI shows ratios, tempered shows cents only — Phase-6 D-01 discipline; circle reinforces the badge | ✓ |
| Degree numbers only | Minimal rim: 0..N−1 indices; pitch info lives in the table | |
| Ratios + cents always | Both on every label regardless of family; shows float-derived ratios for tempered (conflicts with no-laundering rule) | |

### Reference grid
| Option | Description | Selected |
|--------|-------------|----------|
| 12-EDO tick marks | Faint ticks every 100¢ around the rim | ✓ |
| No grid — clean circle | Just markers and rim labels | |
| Toggleable grid | Checkbox to show/hide ticks | |

### Placement
| Option | Description | Selected |
|--------|-------------|----------|
| Shared preview area | One circle instance fed by active widget's getScale() | ✓ |
| Inside each widget | Each generator mounts its own circle (~10 mount points) | |
| You decide | Planner picks from cell structure | |

### Hover/highlight
| Option | Description | Selected |
|--------|-------------|----------|
| Hover tooltip + marker highlight | Full pitch info on hover; matches lattice idiom; click auditions | ✓ |
| Click-only, no hover | Markers respond to click only | |
| Hover auditions too | Hovering plays a preview note | |

**User's choice:** Match table convention · 12-EDO ticks · shared preview · hover tooltip + click audition
**Notes:** Reinforces the tempered/exact distinction (Success Criterion 4) on the viz surface, not just the table.

---

## Transform strip behavior

### Destructiveness
| Option | Description | Selected |
|--------|-------------|----------|
| Non-destructive overlay | Settings re-derive from generator's current output every render; survive param tweaks; easy reset | ✓ |
| Apply-button bakes it in | Each transform replaces the scale; applications stack | |
| You decide | Planner picks from getScale() contract | |

### Display of transformed result
| Option | Description | Selected |
|--------|-------------|----------|
| Shared preview shows transformed | Widget table keeps raw output; shared preview (strip + circle + transformed table) shows Send-to payload | ✓ |
| Transform in place | Strip re-renders the widget's own table (breaks Pattern-2 encapsulation) | |
| Circle only | Transforms update only circle + Send-to; no second table | |

### Rotate-to-mode control
| Option | Description | Selected |
|--------|-------------|----------|
| Select listing all modes | `<select>` Mode 1 of N … Mode N of N, rebuilt on scale change | ✓ |
| Stepper (◀ mode ▶) | Prev/next with Mode k/N readout | |
| Number input | Plain degree field 0..N−1 | |

### Reset + persistence
| Option | Description | Selected |
|--------|-------------|----------|
| Reset button + clear on method switch | Returns to identity; strip resets when generator method changes | ✓ |
| Reset button, persist across methods | Keeps settings across method switch (risks stale carryover) | |
| No reset — identity defaults visible | Per-control defaults, no one-click reset | |

**User's choice:** Non-destructive overlay · transformed result in shared preview · mode select · reset + clear on method switch
**Notes:** Transforms scoped to the scale being shaped; the transformed scale (not the raw output) is what Send-to serializes.

---

## Wilson / metallic widget

### Convergents vs metallic limit
| Option | Description | Selected |
|--------|-------------|----------|
| Convergent scale + limit readout | Exact-rational convergents are the scale; metallic limit a tempered readout beside it | ✓ |
| Mode toggle: convergents / limit-stack | Two sub-modes incl. a stacked-limit tempered scale | |
| Limit as final degree | Mixes exact convergents + irrational limit in one table (cuts against no-laundering) | |

### Presets
| Option | Description | Selected |
|--------|-------------|----------|
| Metallic family + Meru seeds | Golden/silver/bronze + Wilson Meru seed variants (citable) | ✓ |
| Metallic means only | Golden/silver/bronze; seeds fixed | |
| No presets — raw fields | Just seeds/coefficients/count | |

### Editable params
| Option | Description | Selected |
|--------|-------------|----------|
| Seeds + coefficients + count | x₀,x₁ + a,b + term count, with caps | ✓ |
| Preset + count only | Seeds/coefficients hidden | |
| You decide | Planner picks from meru.ts signature | |

### Default landing
| Option | Description | Selected |
|--------|-------------|----------|
| Fibonacci / golden, ~7 convergents | a=1,b=1, seeds 1,1; φ≈833.09¢ limit readout | ✓ |
| Silver mean | a=2,b=1, Pell convergents | |
| You decide | Planner picks within Fibonacci spirit | |

**User's choice:** Exact convergent scale + tempered limit readout · metallic family + Meru seed presets · seeds/coefficients/count editable · Fibonacci/golden default
**Notes:** Exact stays exact; the irrational metallic limit is contextual, never a scale degree.

---

## Constant-structure widget

### Input shape
| Option | Description | Selected |
|--------|-------------|----------|
| Generator chips + ordinal field | Chip input + ordinal → csgs(generators, ordinal); no SW syntax exposed | ✓ |
| Presets + chips | Adds a preset select of canonical CS scales | |
| You decide | Planner picks from csgs/gs signature | |

### CS-status reporting
| Option | Description | Selected |
|--------|-------------|----------|
| Show CS status readout | ✓ constant structure / ✗ ambiguous at … — mirrors Fokker readout (Phase-7 D-12) | ✓ |
| No status — just the scale | Trust the builder, render like any scale | |
| You decide | Planner decides if CS check is cheap | |

### Default landing
| Option | Description | Selected |
|--------|-------------|----------|
| Pythagorean-style CS diatonic | csgs([3/2], 7), 7-note, exact-rational, recognizable | ✓ |
| Multi-generator CS example | 2+ generators over a more complex lattice | |
| You decide | Planner picks a small canonical CS scale | |

### SonicWeave error handling
| Option | Description | Selected |
|--------|-------------|----------|
| Status region + preserve prior preview | Phase-7 D-15 free-text rule; consistent across SW-backed widgets | ✓ |
| Disable Send-to on error | Adds greyed-out Send-to until valid | |
| You decide | Align with rank-2/Fokker widgets | |

**User's choice:** Generator chips + ordinal · CS-status readout · Pythagorean CS diatonic default · status-region errors preserving prior preview
**Notes:** CS sub-task depends on Phase 7's `scaleFromSonicWeave` (complete — no gating). Exposing the CS property is the pedagogical point.

---

## Claude's Discretion

- Circle-viz internals: marker/tick styling + tokens (match 05-UI-SPEC), tonic emphasis, dense-scale label thinning, tooltip layout, empty-state copy (D-17).
- Strip transpose input shape (`makeRatioField` n/d) and tempered-scale rendering through transforms (D-18).
- `meru.ts` signature, full preset roster, term-count/magnitude caps, convergent octave-reduction (D-19).
- CS-status check implementation (reuse vs new helper; "ambiguous at X" phrasing) (D-20).
- Component decomposition + picker "Advanced" optgroup registration (D-21).

## Deferred Ideas

- Scala archive browser (LIB-01..03) — Phase 9.
- Toggleable 12-EDO grid on the circle — v2 refinement.
- Metallic-limit-stack tempered scale mode — possible future sub-mode.
- Named canonical CS presets roster — deferred (niche).
- "Show the SonicWeave code behind this widget" template-inserter — v2 bridge (carried from Phase 7).
