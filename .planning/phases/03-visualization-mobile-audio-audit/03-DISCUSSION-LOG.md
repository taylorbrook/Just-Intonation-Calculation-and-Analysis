# Phase 3: Visualization + Mobile Audio Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 3-Visualization + Mobile Audio Audit
**Areas discussed:** Where viz lives, Viz interactivity, .kbm UX surface, Mobile audit scope

---

## Where viz lives

### Q1 — Default page placement of the three viz widgets

| Option | Description | Selected |
|--------|-------------|----------|
| All on dashboard | Add lattice + diamond + keyboard to src/index.md below the audio panel. | ✓ |
| Each on its own page | New theory pages under src/pages/ for each viz. | |
| Keyboard on dashboard, lattice + diamond as theory pages | Hybrid: compact widget inline, deeper viz on dedicated pages. | |

**User's choice:** All on dashboard.
**Notes:** Single dashboard remains the canonical scale-design surface; viz is part of the design feedback loop.

### Q2 — Sizing strategy on the dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Full-bleed each, vertical stack | Each widget at full readable size; user scrolls top-to-bottom. | ✓ |
| Compact-by-default, click-to-expand | Inline previews; expand on demand. | |
| Two-column where space allows | CSS grid pairing lattice + diamond on wide screens. | |

**User's choice:** Full-bleed each, vertical stack.
**Notes:** Simplicity wins; matches existing dashboard rhythm.

### Q3 — Keyboard widget mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Linear-by-degree | N degrees → N adjacent white keys; cents-from-12tet labels above. | ✓ |
| Anchored to MIDI (kbm-derived) | Keys placed per .kbm mapping; gray for untuned. | |
| Both — modal toggle | Linear default; toggle for MIDI-anchored. | |

**User's choice:** Linear-by-degree.
**Notes:** Most useful for design feedback; avoids coupling viz to .kbm semantics.

### Q4 — Viz scope (scale-only vs context)

| Option | Description | Selected |
|--------|-------------|----------|
| Scale-only | Only intervals in the current Scale rendered. | |
| Scale highlighted on full grid | Wider lattice grid / full odd-limit; in-scale highlighted. | |
| Configurable via opts | `opts.showContext: 'none' \| 'neighbors' \| 'full'`; dashboard default = 'neighbors'. | ✓ |

**User's choice:** Configurable via opts.
**Notes:** Both lattice and diamond accept the opt. Default 'neighbors' on dashboard captured in CONTEXT.md D-05.

---

## Viz interactivity

### Q1 — Lattice + diamond interactivity tier

| Option | Description | Selected |
|--------|-------------|----------|
| Static SVG | Read-only; no pan, no zoom, no audio. | |
| Pan/zoom only | D3 zoom on SVG; no audio. | |
| Pan/zoom + click-to-audition | Click a node/cell plays the interval via the page synth. | ✓ |

**User's choice:** Pan/zoom + click-to-audition.

### Q2 — Keyboard click-to-play

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — keys are play buttons | Click key N → audition scale.intervals[N]. | ✓ |
| No — read-only display | Cents labels only; audition via existing audio panel. | |
| Optional via opts.synth | Synth optional; widget renders read-only without it. | |

**User's choice:** Yes — keys are play buttons.

### Q3 — What plays on click

| Option | Description | Selected |
|--------|-------------|----------|
| Just the interval as a single note | Plays baseHz × ratio. | |
| Dyad: 1/1 + the interval (stacked) | Plays both simultaneously — hear the relationship. | |
| Configurable via opts.audition: 'note' \| 'dyad' | Default 'dyad' on dashboard; 'note' for theory pages. | ✓ |

**User's choice:** Configurable via opts.audition.
**Notes:** Default 'dyad' on dashboard per recommendation rationale.

### Q4 — Synth arg required vs optional

| Option | Description | Selected |
|--------|-------------|----------|
| Required — same shape as audioPanel | Signature: `widget(scale, synth, opts?)`. | ✓ |
| Optional — read-only without synth | Pages w/o synth still get viz, just no click-to-play. | |
| Optional with 'No audio' notice | Same as above with a UX hint when synth is absent. | |

**User's choice:** Required — same shape as audioPanel.

---

## .kbm UX surface

### Q1 — Combined vs separate I/O widget

| Option | Description | Selected |
|--------|-------------|----------|
| Extend the existing sclIo widget | One widget handles both formats; auto-detects on import; export shows two buttons. | ✓ |
| Separate sclIo + kbmIo widgets | Two strips, two factories. | |
| Combined + small kbmIo escape hatch | Combined default; separate factory available. | |

**User's choice:** Extend the existing sclIo widget.

### Q2 — Default .kbm field values for export

| Option | Description | Selected |
|--------|-------------|----------|
| 1/1 → A4=baseHz (middle=ref) | middleNote=69, referenceKey=69, referenceHz=baseHz. Matches dashboard playback exactly. | ✓ |
| 1/1 → C4 = baseHz/(A4-ratio) | middleNote=60, referenceKey=69, referenceHz=baseHz=440. Standard piano convention. | |
| Inputs in the widget — user picks | Three small inputs in the export strip. | |

**User's choice:** 1/1 → A4=baseHz (middle=ref).

### Q3 — Where parseKbm/writeKbm live

| Option | Description | Selected |
|--------|-------------|----------|
| Extend src/lib/scala.ts | Single-file boundary for all Scala-format I/O. | |
| New src/lib/kbm.ts module | Sibling module; single-responsibility per file. | ✓ |
| src/lib/io/{scala,kbm}.ts subfolder | Group all I/O modules under src/lib/io/. | |

**User's choice:** New src/lib/kbm.ts module.

### Q4 — .kbm import behavior on the dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Parse-only — just verify it round-trips | .kbm imported, status shown; playback unchanged. | |
| Apply to playback — audio respects the kbm | .kbm wires kbm-derived 1/1 Hz into the synth path. | |
| Apply with override toggle | Default applies; "Use baseHz instead" toggle restores baseHz. | ✓ |

**User's choice:** Apply with override toggle.
**Notes:** Phase 3 must wire kbm-aware effective-ref-Hz through every audition path (audioPanel + click-to-play in lattice/diamond/keyboard).

---

## Mobile audit scope

### Q1 — Audit width

| Option | Description | Selected |
|--------|-------------|----------|
| Verify-only | Test + document; no code changes. | |
| Verify + audio-layer fixes | Verify + synchronous resume + webkitAudioContext + visibilitychange + Stop-all + Esc. | |
| Verify + audio-layer fixes + responsive UX pass | Above + viewport, touch targets, narrow-screen layout, fonts, no horizontal scroll. | ✓ |

**User's choice:** Verify + audio-layer fixes + responsive UX pass.

### Q2 — Verification methodology

| Option | Description | Selected |
|--------|-------------|----------|
| Physical iPhone smoke test, manual | Real-device testing of every audio path. | |
| Safari macOS Responsive Design Mode | RDM iPhone simulation. | ✓ |
| Both — RDM for layout, physical for audio | Two-pass verification. | |

**User's choice:** Safari macOS Responsive Design Mode.
**Notes:** Documented limitation captured in CONTEXT.md D-18: RDM does NOT reproduce iOS autoplay-policy nuances or hardware mute switch. Quirks documented in `mobile-audit.md`; not verified by RDM.

### Q3 — Stop-all-audio UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inside the audio panel, plus Esc key | Stop button in audioPanel; Esc keydown listener. | |
| Floating top-right button + Esc | Persistent fixed button; Esc support. | ✓ |
| Esc-only, no button | Keyboard shortcut only. | |

**User's choice:** Floating top-right button + Esc.
**Notes:** Visibility tied to `synth.activeVoices > 0` per CONTEXT.md D-16 to avoid always-on chrome.

### Q4 — Responsive layout strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single-column, full-width everywhere | All controls + viz to viewport edge with padding; no horizontal scroll; font-size ≥ 16px on inputs. | ✓ |
| Single-column with max-width on text, full-width on viz | Mixed metaphor; capped text width, edge-to-edge viz. | |
| Define a ~720px breakpoint | Explicit media-query split. | |

**User's choice:** Single-column, full-width everywhere.
**Notes:** Matches the "full-bleed vertical stack" choice already made.

---

## Claude's Discretion

Defaults captured in CONTEXT.md D-19..D-25. Plan-phase should flag if any need to change:

- **D-19:** Default lattice basis = scale's primes minus prime 2 (auto-derived).
- **D-20:** Default tonality-diamond odd-limit = ceil(max scale oddLimit), rounded UP to nearest of {7,9,11,13,15,21,31}.
- **D-21:** Lattice node visual: filled in-scale, outlined neighbors; ratio inside, signed cents below; prime-axis color.
- **D-22:** Diamond cell visual: filled in-scale, outlined out-of-scale; D3 `<title>` tooltip for accessibility.
- **D-23:** Keyboard widget visual: white-key strip; signed cents-from-12tet above each key; depressed-key feedback on play.
- **D-24:** kbm-aware effective ref Hz computed in dashboard cell (not in synth.ts); `kbmToFrequencies(scale, kbm)` lives in `src/lib/kbm.ts`.
- **D-25:** Component CSS colocated per existing convention (`src/components/lattice.css` etc.).

## Deferred Ideas

Captured in full detail in CONTEXT.md `<deferred>` section. Highlights:

- Theory pages dedicated to each viz (deferred — all on dashboard for now).
- Anchored-to-MIDI keyboard view (deferred — linear-by-degree only).
- Compact / collapsible viz on dashboard (deferred — full-bleed wins).
- Static SVG / pan-zoom-only viz modes (deferred — full interactivity in v1).
- Modal toggle for note/dyad audition mode (deferred — opts default sticks).
- Forced kbm-applies-to-playback without override (softened — toggle present).
- Always-visible Stop button (deferred — visibility tied to active voices).
- Defined breakpoint media queries (deferred — single-column, full-width).
- Physical iPhone testing (deferred — Safari RDM only by user choice; quirks documented).
- 3D lattice (Three.js) — v2+.
- harmonic-entropy / temperaments — still deferred.
- Persistent scale state (URL hash / localStorage) — Phase 4 (ANAL-04).
- EDO ↔ JI / MOS / scale comparison — Phase 4 (ANAL-01..03).
- Per-key MIDI input — out of scope per PROJECT.md.
