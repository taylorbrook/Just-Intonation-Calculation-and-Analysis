# Phase 4: Analysis & Sharing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 4-Analysis & Sharing
**Areas discussed:** Surface Placement, EDO↔JI design (ANAL-01), MOS approach (ANAL-02), Persistent URLs (ANAL-04), Scale comparison (ANAL-03)

---

## Surface Placement

### Q1: Where should Phase 4's analysis features live?

| Option | Description | Selected |
|--------|-------------|----------|
| All on dashboard | Continue Phase 3's D-01 pattern — EDO map, MOS, compare, URL all on src/index.md. | |
| Dedicated /analysis page | New src/pages/analysis.md hosts EDO + MOS + compare. Persistent URL stays on dashboard too. | ✓ |
| Per-feature pages | Four pages: /edo-map, /mos, /compare, plus URL on dashboard. | |
| Hybrid | URL + compare on dashboard; EDO + MOS get their own theory pages with prose. | |

**User's choice:** Dedicated /analysis page

### Q2: How should /analysis read the scale it analyzes?

| Option | Description | Selected |
|--------|-------------|----------|
| Read from URL hash | Dashboard writes scale to #scale=…; /analysis reads from same hash. | |
| Has its own scale textarea | /analysis has its own seed scale + textarea, independent. | |
| Both — hash takes precedence | Hash if present, otherwise local textarea / seed. | ✓ (Claude recommendation, locked) |

**User's choice:** Asked for recommendation — Claude recommended "Both, hash takes precedence" (rationale: tests share path naturally; page works standalone; matches notebook framing). User locked it.

### Q3: Does /analysis need its own audio?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — own synth cell | Stand up a synth cell on /analysis (same pattern as dashboard). | ✓ |
| No — silent analysis only | Tables, plots, math — no audition. | |
| Yes for MOS + compare; no for EDO map | Mixed. | |

**User's choice:** Yes — own synth cell

### Q4: Should /analysis host ALL three features (EDO map + MOS + compare), or split MOS off?

| Option | Description | Selected |
|--------|-------------|----------|
| All three on /analysis | One page, three sections. | ✓ |
| Split MOS to /mos page | MOS is constructive; /analysis = EDO map + compare. | |
| Split compare to /compare page | Compare needs two scales; different input shape. | |

**User's choice:** All three on /analysis

### Q5: Cross-link pattern — how does the user get from dashboard to /analysis?

| Option | Description | Selected |
|--------|-------------|----------|
| "Analyze this scale →" button on dashboard | Button writes hash + opens /analysis. | ✓ |
| Markdown nav link only | Just `[Analyze →](/analysis)`. | |
| Both — button + nav sidebar | Button + Framework auto-nav. | |

**User's choice:** "Analyze this scale →" button on dashboard

---

## EDO↔JI design (ANAL-01)

### Q1: Both directions or focus on one?

| Option | Description | Selected |
|--------|-------------|----------|
| Both directions | (a) Scale → ranked EDOs. (b) EDO + limit → best JI. | ✓ |
| Scale→EDO only | Just the "best EDO for my JI scale" direction. | |
| EDO→JI only | Just "best JI per step in this EDO". | |

**User's choice:** Both directions

### Q2: Ranking metric for the scale→EDO table?

| Option | Description | Selected |
|--------|-------------|----------|
| Max cents error | Worst-case across degrees. | (folded) |
| RMS cents error | sqrt(mean(squared err)). | (folded) |
| Both columns sortable | Max + RMS as columns. | (subset of selected) |
| Tenney-weighted error | Weight err by 1/log₂(n*d). | (folded) |

**User's choice:** All three sortable (max-err, RMS-err, Tenney-weighted-err) — user expanded scope to include all three options as sortable columns.

### Q3: EDO search range?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 5–72 (curated) | Hardcoded sweep range. | |
| User-specified (input + slider) | User sets max EDO. | ✓ (input only, no slider — user's annotation) |
| Top-N by error budget | Sweep wide, filter by err threshold. | |

**User's choice:** User-specified via number input (no slider)

### Q4: EDO→JI direction — input + output?

| Option | Description | Selected |
|--------|-------------|----------|
| EDO + prime-limit → best JI per step | Extends jiSubsetOfEdo. | |
| EDO + odd-limit → best JI per step | Odd-limit instead. | |
| Both — toggle prime-limit / odd-limit | User picks. | ✓ |

**User's choice:** Both — toggle prime-limit / odd-limit (notes: odd-limit search needs new ~30 LOC routine)

### Q5: Output format for EDO↔JI tables?

| Option | Description | Selected |
|--------|-------------|----------|
| Sortable tables only | HTML tables. | |
| Tables + cents-error scatter plot | Table + Plot scatter (x=EDO, y=max-err). | ✓ |
| Tables + per-row strip | Per-row inline cents-deviation sparkline. | |

**User's choice:** Tables + cents-error scatter plot

### Q6: How does audition work in EDO↔JI surfaces?

| Option | Description | Selected |
|--------|-------------|----------|
| Click EDO row → play scale-mapped-to-EDO | Row arpeggiates user's scale at EDO's nearest steps. | ✓ |
| Per-cell click — single note | Cell-level granularity. | |
| Both — row arpeggio + cell single-note | Mixed UX. | |

**User's choice:** Click EDO row → play scale-mapped-to-EDO

---

## MOS approach (ANAL-02)

### Q1: Use moment-of-symmetry@0.10.0 package, or hand-roll?

| Option | Description | Selected |
|--------|-------------|----------|
| Install moment-of-symmetry | Same xen-dev author; v0.10.0 current. | |
| Hand-roll in src/lib/mos.ts | ~80–120 LOC; full control; no peer-dep risk. | ✓ |
| Install + wrap thinly | Use upstream primitives behind project-shaped API. | |

**User's choice:** Hand-roll in src/lib/mos.ts

### Q2: Generator/period input shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Same parser as scale text (ratio \| cents \| monzo) | Reuse parseScala body parser. | |
| Two ratio-only number inputs (n, d) | Numerator + denominator inputs. | ✓ |
| Single text input with ratio \| cents \| monzo | parseScala on one pitch. | |

**User's choice:** Two ratio-only number inputs (n, d). Trade-off flagged: cents-defined generators (e.g., meantone ~701.955¢) lost; user must hand-compute the ratio. Deferred.

### Q3: How does the user pick the scale size?

| Option | Description | Selected |
|--------|-------------|----------|
| Number input (size N) | Free integer input. | |
| Dropdown of MOS sizes | Only valid MOS sizes selectable. | |
| Number input + "snap to nearest MOS" toggle | Free input + snap checkbox. | ✓ (Claude recommendation, locked) |

**User's choice:** Asked for recommendation — Claude recommended "Number input + snap toggle (default ON)" (rationale: notebook is research-y, sometimes you want non-MOS; but MOS-snap IS the feature; default snap=ON; uncheck for "show me whatever I typed"). User locked it.

### Q4: What does the MOS widget produce?

| Option | Description | Selected |
|--------|-------------|----------|
| Scale instance + scaleTable + audio | Build Scale, render scaleTable, Play button. | ✓ |
| Scale + step-pattern visualization | Above + L/s pattern strip. | |
| Full MOS preview (Scale + L/s + brightness + modes) | Above + brightness + mode picker. | |

**User's choice:** Scale instance + scaleTable + audio

---

## Persistent URLs (ANAL-04)

### Q1: URL scope — what state gets encoded in the hash?

| Option | Description | Selected |
|--------|-------------|----------|
| Scale text only | Just the scale lines. | ✓ |
| Scale text + baseHz | Scale + reference Hz. | |
| Full dashboard state | Scale + baseHz + kbm + viz opts. | |
| Tiered: scale-only by default, full on demand | Two share buttons. | |

**User's choice:** Scale text only

### Q2: Encoding format inside the hash?

| Option | Description | Selected |
|--------|-------------|----------|
| URL-encoded raw scale text | `#scale=9%2F8%0A...`. | |
| Base64 + URL-safe | `#s=ICVuZTUuLi4=`. | ✓ |
| sonic-weave string | Scale Workshop's hash format. | |
| URL-encoded raw + LZ-compressed for >threshold | Auto-pick. | |

**User's choice:** Base64 + URL-safe

### Q3: When does the URL update?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-update on every scale edit | Debounced ~300ms, replaceState. | ✓ |
| Explicit Share button | "Copy share link" button. | |
| Both — auto-update + explicit Copy button | replaceState + clipboard copy. | |

**User's choice:** Auto-update on every scale edit

### Q4: Where does the URL serializer live?

| Option | Description | Selected |
|--------|-------------|----------|
| src/lib/url.ts (pure, testable) | Pure encode/decode. Caller owns window.location. | ✓ |
| src/components/url-share.ts (DOM-coupled) | Component owns encoding + DOM. | |
| Split: lib/url.ts + components/url-share.ts | Pure lib + thin component. | |

**User's choice:** src/lib/url.ts (pure, testable). Note: since auto-update has no Copy button, no separate component needed; page cells own window.location.

### Q5: Receive-side behavior on load with `#s=...`?

| Option | Description | Selected |
|--------|-------------|----------|
| Hash overrides seed silently | Decode + use as initial; no banner. | ✓ |
| Banner: "Loaded shared scale — [reset to seed]" | Visible provenance + reset link. | |
| Hash ignored if textarea has been edited | Defensive race handling. | |

**User's choice:** Hash overrides seed silently

### Q6: Invalid / malformed hash?

| Option | Description | Selected |
|--------|-------------|----------|
| Silently fall back to seed scale | Decode error → default loads, hash cleared. | |
| Show parse error in status region (sclIo-style) | aria-live=polite error + hash NOT cleared. | ✓ |
| Clear hash + load seed + log to console only | Clean page, console-only error. | |

**User's choice:** Show parse error in status region (sclIo-style)

---

## Scale comparison (ANAL-03)

### Q1: How many scales does compare hold at once?

| Option | Description | Selected |
|--------|-------------|----------|
| Two (A vs B) | Fixed A/B. | ✓ |
| Up to N (variable) | Add/remove columns. | |
| Two main + a "reference scale" picker | A vs B compared; baseline (12tet by default) for cents-deviation column. | |

**User's choice:** Two (A vs B)

### Q2: Where does "scale B" come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Second textarea on /analysis | Type B inline. | |
| Paste / .scl import for B | Drop-in reference. | |
| Built-in seed picker + textarea | Dropdown + ad-hoc input. | |
| All three: dropdown + textarea + .scl import | Preset, ad-hoc, archive. | ✓ |

**User's choice:** All three: dropdown + textarea + .scl import

### Q3: When sizes differ, alignment strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| By cents-position (nearest match) | Each A degree paired with nearest-cents B degree. | ✓ |
| By degree index | Pad shorter; pair by index. | |
| Both, switchable | Toggle. | |

**User's choice:** By cents-position (nearest match)

### Q4: Comparison output — what gets rendered?

| Option | Description | Selected |
|--------|-------------|----------|
| Cents-diff table only | HTML table + summary stats. | |
| Table + parallel bar chart | Lollipop on shared cents axis. | |
| Table + audio side-by-side | Per-row "play A then B". | |
| All three | Table + lollipop + per-row audition. | ✓ |

**User's choice:** All three (table + lollipop + per-row audition)

---

## Claude's Discretion

Decisions where the user said "you decide" or where the planner has flexibility (logged in CONTEXT.md as D-25..D-34):

- **Default EDO upper-bound input value** (recommend 72; planner may pick 100)
- **Default debounce window for hash auto-update** (300ms)
- **Built-in scale-B seed list contents** (recommend 12tet, 19edo, 31edo, Pythagorean diatonic, 5-limit JI, Bohlen-Pierce)
- **MOS default seed values** (generator 3/2, period 2/1, size 7 — Pythagorean diatonic)
- **MOS degenerate-input error UX** (RangeError + status-region message)
- **Per-row A/B audition default** (sequential — A then B with brief gap)
- **Scatter plot orientation** (horizontal: x=EDO, y=max-err)
- **Common-subset threshold** (exact equality via Interval.equals — never cents tolerance, Pitfall #1)
- **Plot color encoding for compare** (color-blind-safe palette TBD)
- **`/analysis` synth cell mirrors the dashboard's** Esc + Stop pattern (Phase 3 D-15/D-16)

Two questions during the discussion explicitly asked for Claude's recommendation:
1. **/analysis scale-ref behavior** — recommended "Both, hash takes precedence." User locked.
2. **MOS size picker** — recommended "Number input + snap toggle (default ON)." User locked.

## Deferred Ideas

(Captured from the discussion; not in scope for Phase 4. See CONTEXT.md `<deferred>` for the full list.)

- Cents-defined generator input for MOS (D-12 chose ratio-only n/d)
- Full MOS preview (L/s pattern strip, brightness ranking, mode-rotation picker)
- N-way scale comparison
- Per-cell single-note audition on EDO tables
- Per-row cents-deviation strip on EDO tables
- "Send MOS / EDO-mapped scale → dashboard" reverse link
- Sonic-weave URL hash format (cross-tool URL roundtrip with Scale Workshop)
- Tiered URL scope ("Share full state" with baseHz + kbm + viz opts)
- "Reset to seed" banner on hash-loaded /analysis
- Per-edit pushState for scale-history back-button semantics
- Mode rotation picker / auto-named modes for MOS
- Ratio-to-comma decomposition (TEMP-02, v2)
- Plomp-Levelt dissonance curve (TEMP-03, v2)
- Harmonic entropy (TEMP-05, v2)
- 3D lattice (TEMP-06, v2)
- Embedded SonicWeave DSL (TEMP-07, v2)
