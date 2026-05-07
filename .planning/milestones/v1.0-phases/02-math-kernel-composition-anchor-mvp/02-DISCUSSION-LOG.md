# Phase 2: Math Kernel + Composition Anchor (MVP) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 2-math-kernel-composition-anchor-mvp
**Areas discussed:** Composition anchor, Dashboard layout, Inline widget API, Scale text-input syntax

---

## Composition Anchor

### Q1: How ready is the in-progress piece to lock down right now?

| Option | Description | Selected |
|--------|-------------|----------|
| Real piece — lock it now (Recommended) | Lock title + scale + base pitch now so COMP-01/02/03 ship against real material | |
| Use a placeholder piece | Phase 2 ships against `src/lib/pieces/sketch.ts` with a generic 7-limit JI scale; real piece swaps in later | |
| Talk through the piece first | Discuss what the piece is about before naming ratios | |
| Other (free-text) | "let's make it general, not about a particular piece" | ✓ |

**User's choice:** Free-text — make it general, not about a particular piece.
**Notes:** Major reframe. Confirmed in plain-text follow-up: drop `src/lib/pieces/<piece>.ts` entirely; the dashboard becomes a generic scale-design surface; COMP-01/02/03 get reinterpreted as "the dashboard is the kernel-completeness proof"; PROJECT.md and REQUIREMENTS.md need a wording update at phase-transition. User confirmed "that's the right read yes."

### Q2: What should the dashboard show on first load (the seed scale)?

| Option | Description | Selected |
|--------|-------------|----------|
| Demo 7-limit JI scale baked in (Recommended) | First load shows 1/1, 9/8, 5/4, 21/16, 3/2, 27/16, 7/4, 2/1; doubles as the COMP-03 CI fixture | ✓ |
| Empty / minimal (1/1 + 2/1) | Near-empty scale and prompt to add intervals | |
| Persisted from last session (URL hash / localStorage) | Reload returns last-edited scale; pulls Phase 4's ANAL-04 forward | |

**User's choice:** Demo 7-limit JI scale baked in.

### Q3: How should the dashboard page be located in the site structure?

| Option | Description | Selected |
|--------|-------------|----------|
| `src/index.md` IS the dashboard (Recommended) | Landing page = dashboard; theory pages at `src/pages/<topic>.md` | ✓ |
| Split: index = orientation, pages/dashboard.md = workspace | Brief landing intro + separate dashboard page | |
| Multi-tab dashboard at root | Dashboard at `src/index.md` with tabbed sub-views | |

**User's choice:** `src/index.md` IS the dashboard.

### Q4: NOTES-05 second theory page — what topic?

| Option | Description | Selected |
|--------|-------------|----------|
| Syntonic comma (81/80) (Recommended) | Self-contained, exercises inline play-interval widgets and KaTeX math | ✓ |
| Monzo / prime-factor representation explainer | Pedagogical page on monzos | |
| Pythagorean comma + 3-limit chain | Walks through stacking 3/2s | |
| You pick | Claude picks based on what best exercises the architecture | |

**User's choice:** Syntonic comma (81/80).

---

## Dashboard Layout

### Q1: What overall layout shape for the dashboard?

| Option | Description | Selected |
|--------|-------------|----------|
| Top-down vertical flow (Recommended) | Reads like a notebook: scale input → table → audio → .scl → notes | ✓ |
| Two-column workspace | Left = input + I/O; right = table + audio | |
| Single-screen with collapsible sections | Scale + table always visible; audio / export collapsible | |

**User's choice:** Top-down vertical flow.

### Q2: Scale table columns — what does each row show?

| Option | Description | Selected |
|--------|-------------|----------|
| Degree \| Ratio \| Cents \| ¢ from 12-TET (Recommended) | Four columns; cents at 0.1¢ default; covers IO-04 directly | ✓ |
| Degree \| Ratio \| Monzo \| Cents \| ¢ from 12-TET | Five columns including monzo array | |
| Degree \| Ratio \| Hz @ baseHz \| Cents \| ¢ from 12-TET | Five columns including absolute frequency | |
| All of: Degree \| Ratio \| Monzo \| Hz \| Cents \| ¢ from 12-TET | Six columns — maximally informative but visually busy | |

**User's choice:** Four-column default.

### Q3: Audio controls — what playback affordances does the dashboard expose, and how?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline ▶ per-row + global Arpeggiate + Drone toggle (Recommended) | Per-row buttons + global controls; mixes table data with audio affordances | |
| Separate audio panel below the table | Discrete panel; intervals via dropdown/stepper; cleaner data/control separation | ✓ |
| Click-row-to-play (no buttons) | Minimal UI; affordance not visible | |

**User's choice:** Separate audio panel below the table. (Explicit deviation from the Recommended option — preference for cleaner separation between data and controls. Honor this downstream.)

### Q4: Reference pitch (baseHz) for audio playback — how is it set on the dashboard?

| Option | Description | Selected |
|--------|-------------|----------|
| Editable input, default C4 = 261.625565 Hz (Recommended) | Composer-friendly C-anchored research convention | |
| Editable input, default A4 = 440 Hz | Universal tuning reference; familiar to non-JI musicians | ✓ |
| Dropdown of named references (C4 / A4 / piece-specific) + custom | Preset menu with custom override | |
| Hardcoded to C4 in v1, no UI control | Fastest to ship; defer the input | |

**User's choice:** Editable input, default A4 = 440 Hz. (Explicit deviation from the Recommended option.)

---

## Inline Widget API

### Q1: How should widgets embed inline in Markdown prose?

| Option | Description | Selected |
|--------|-------------|----------|
| Plain factory functions: `${playInterval(int, synth)}` (Recommended) | Simplest; ARCHITECTURE.md Pattern 2 default | ✓ |
| Tagged template helpers: `${pi`5/4`}` | Reads more like prose; needs tag layer per widget | |
| Web Components: `<play-interval ratio="5/4">` | Declarative HTML; needs CE registry + global synth access | |
| Convenience wrappers: `${pi('5/4')}` | Page-scoped helpers closing over synth + baseHz | |

**User's choice:** Plain factory functions.

### Q2: What's the v1 widget set?

| Option | Description | Selected |
|--------|-------------|----------|
| playInterval(interval, synth) | ▶ button playing one interval against 1/1 | ✓ |
| playScale(scale, synth) | ▶ button arpeggiating a full scale | ✓ |
| scaleTable(scale, baseHz) | Inline 4-column scale table | ✓ |
| ratioPill(interval) | Tiny inline display of ratio + cents (no audio) | ✓ |

**User's choice:** All four widgets ship in v1.

### Q3: Should the dashboard's scale table be the same `scaleTable` widget used in prose, or a separate dashboard-specific component?

| Option | Description | Selected |
|--------|-------------|----------|
| Same widget — dashboard composes it (Recommended) | One `scaleTable` component used both inline and as the dashboard's main table | ✓ |
| Separate dashboard component | `scale-table.ts` for prose + `dashboard-table.ts` for workspace | |

**User's choice:** Same widget.

---

## Scale Text-Input Syntax

### Q1: What syntax should the dashboard's scale text input accept?

| Option | Description | Selected |
|--------|-------------|----------|
| Scala-body format: one pitch per line (Recommended) | SAME parser as `.scl` import; paste a `.scl` body directly | ✓ |
| Whitespace-separated tokens on one line | Most compact for typing; same token parser | |
| Embedded sonic-weave DSL (`sw` tag) | Most expressive; adds DSL learning curve + runtime dep | |
| JS array of strings: `["1/1", "9/8", ...]` | Edit in code cell; awkward in workspace UI | |

**User's choice:** Scala body format.

### Q2: Implicit `1/1` handling — does the input require `1/1` as the first line, or auto-prepend it?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-prepend 1/1 (Recommended; matches Scala convention) | Kernel prepends the unison; user types only non-unison pitches | ✓ |
| Require explicit 1/1 | More literal; spell out the unison every time | |
| Either accepted (auto-detect) | Most permissive; slight parser ambiguity | |

**User's choice:** Auto-prepend 1/1.

### Q3: Period (last interval) handling — how is the period determined from the input?

| Option | Description | Selected |
|--------|-------------|----------|
| Last line IS the period (Recommended; matches Scala convention) | No separate period field; matches `.scl` semantics directly | ✓ |
| Separate period input | Distinct input (default `2/1`); body lists only intra-period pitches | |
| Auto-detect: last line if > 1, else assume `2/1` | Permissive; adds parser ambiguity | |

**User's choice:** Last line IS the period.

### Q4: Monzo input syntax — is the kernel-level monzo notation accepted in the text input, and in what form?

| Option | Description | Selected |
|--------|-------------|----------|
| Bra-ket: `[-2 0 1>` (Recommended; xen-wiki canonical) | Standard xenharmonic notation; familiar to xen-literate readers | ✓ |
| Comma-separated brackets: `[-2, 0, 1]` | JS-array-flavored | |
| Don't accept monzos in text input | Ratios + cents only; smaller parser surface | |

**User's choice:** Bra-ket notation.

---

## Claude's Discretion

These were not explicitly discussed; sensible defaults captured in CONTEXT.md D-16 through D-24:

- ADSR envelope defaults (D-16)
- Polyphony cap = 16, FIFO eviction (D-17)
- Default note duration / arpeggio step (D-18)
- Cents-vs-ratio detection rule in parser (D-19)
- `.scl` golden-test corpus selection (D-20)
- Named-commas table seed list (D-21)
- `.scl` filename default pattern (D-22)
- KaTeX wiring approach (D-23)
- `Interval` / `Scale` immutability convention (D-24)

Plan-phase should flag any of these for explicit discussion if implementation surfaces a real choice point.

## Deferred Ideas

(See CONTEXT.md `<deferred>` section for the full list with rationale.)

- Per-piece composition modules (descoped from v1 by user reframe)
- Persistent scale state (URL hash / localStorage) — Phase 4 (ANAL-04)
- Custom Web Components for inline widgets
- `sonic-weave` DSL embedded as in-cell scale syntax — v2 (TEMP-07)
- Monzo / Hz columns in the default scale table
- Inline ▶ buttons per scale-table row (explicitly rejected in favor of separate audio panel)
- Reference-pitch presets (named C4 / A4 / piece-specific menu)
- Build-time named-commas data loader (use TS constant until table grows)
- `.kbm` I/O — Phase 3 (IO-03)
- Mobile Safari audio audit — Phase 3 (AUDIO-06)
