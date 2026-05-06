---
phase: 04-analysis-sharing
plan: 05
subsystem: components
tags: [mos, ui, anal-02, factory-pattern, scale-construction]
requires: [04-02]
provides:
  - "src/components/mos-builder.ts — mosBuilder factory + MosBuilderOpts type"
  - "src/components/mos-builder.css — colocated CSS for the form + status + hosts"
affects:
  - "Plan 04-07: import mosBuilder into /analysis page; @import mos-builder.css from src/styles.css"
tech_stack_added: []
patterns_used:
  - "Pattern 2 component factory: (synth, opts?) => HTMLElement (Phase 2 D-09)"
  - "Closure-local state with rebuild() helper (audio-panel.ts pattern)"
  - "Status region with role=status aria-live=polite (scl-io.ts pattern)"
  - "Defense-in-depth: createElement + textContent only (T-04-22)"
  - "Input clamping at component boundary (T-04-23, T-04-25)"
key_files_created:
  - src/components/mos-builder.ts
  - src/components/mos-builder.css
  - src/components/__tests__/mos-builder.test.ts
key_files_modified: []
decisions:
  - "On D-29 period=1/1 error: PRESERVE the prior valid scaleTable render. Reasoning: the user typed one keystroke that invalidated the period; clearing the table would erase the visual context they need to recover. Status region announces the error; the prior table stays visible until the user restores a valid period. Documented in code comments (rebuild()'s catch block)."
  - "Generator-equals-period edge case: render the kernel's single-pitch Scale (so playScale and scaleTable have meaningful inputs) AND show the explanatory status 'Generator equals period — scale collapses to a single pitch'. This is a conscious override of any prior 'Snapped to…' announcement because the structural collapse is the load-bearing UX signal."
  - "Snap-OFF free-size announcement: ONLY surfaced when the user's size is not already a natural MOS size for the (gen, per) pair. If the user disables snap but happens to pick a natural size, no status text — silence is the correct signal."
  - "n/d/size inputs clamped to >= 1 at the component boundary BEFORE the Interval/buildMos calls. The kernel re-validates with RangeError, but the component's clamp ensures the kernel never sees pathological inputs from raw textbox state."
metrics:
  duration: "4m 16s"
  completed_date: "2026-05-06"
  tests_added: 10
  files_created: 3
  files_modified: 0
---

# Phase 04 Plan 05: MOS construction widget Summary

The MOS construction widget for ANAL-02: ratio-only n/d inputs for generator + period, free-integer size with default-on snap toggle, status region for D-29 degenerate inputs, output reuses existing scaleTable + playScale.

## Final exports

```typescript
// src/components/mos-builder.ts

export interface MosBuilderOpts {
  baseHz?: number;       // default 440 (D-08)
  precision?: number;    // cents decimal places, default 1 (Pitfall #16)
  defaultGenerator?: { n: number; d: number };  // default { n: 3, d: 2 }
  defaultPeriod?: { n: number; d: number };     // default { n: 2, d: 1 }
  defaultSize?: number;                          // default 7 (D-28)
}

export function mosBuilder(synth: SynthHandle, opts?: MosBuilderOpts): HTMLElement;
```

Factory contract: Pattern 2 (Phase 2 D-09). No scale arg — the component owns its scale via the n/d inputs and rebuilds on every change. No module-level state. SynthHandle is injected by the caller, never constructed locally (three-layer discipline).

## Behavior summary

- **Form**: `<input type="number" name="generator-n">` + `/` + `name="generator-d"`, then `Period n/d`, then `Size`, then a `<input type="checkbox">` Snap toggle (default `checked`).
- **Default seed render**: generator 3/2, period 2/1, size 7 → Pythagorean diatonic (8 intervals incl. 2/1).
- **Snap ON, target IS natural MOS size**: silent — status text empty.
- **Snap ON, target NOT natural MOS size**: `Snapped to MOS size N (target M)`.
- **Snap OFF, size IS natural MOS size**: silent.
- **Snap OFF, size NOT natural MOS size**: `Free size N (not a natural MOS)`.
- **D-29 period=1/1**: `MOS period must be > 1/1` via `aria-live=polite`; prior table render preserved.
- **D-29 generator=period**: kernel's single-pitch Scale rendered; status reads `Generator equals period — scale collapses to a single pitch`.
- **Play button**: factored through `playScale(scale, synth, { baseHz })` — no new audio path.

## Decision on Test 8 (D-29 prior-render preservation)

When the user sets period to 1/1 (or any other invalid value), the component:

1. Catches the kernel `RangeError`.
2. Writes the error message to the status region via `textContent`.
3. **Does NOT clear** `tableHost` or `playHost`. The previous valid scale's table + Play button remain visible.

Rationale: the user typed one digit; instantly losing the entire 8-row Pythagorean diatonic table breaks visual continuity and forces them to mentally reconstruct what they were looking at. The error is announced (screen-readers see it via `aria-live=polite`), and the moment they restore a valid period, `rebuild()` replaces the host contents with the new render. This matches the spirit of the plan's note "decide: per acceptance criterion, prior scale is preserved so user doesn't lose render context".

## Test coverage (10 happy-dom tests)

| # | Test | Verifies |
|---|------|----------|
| 1 | Returns HTMLElement, class `mos-builder`, h2 "MOS construction" | Factory shape |
| 2 | 5 number inputs with defaults 3, 2, 2, 1, 7 | D-28 default seed |
| 3 | Snap is checkbox with `checked === true` | D-13 default ON |
| 4 | Default render shows 8 tbody rows | Pythagorean diatonic on first paint |
| 5 | Size 12 → 13 tbody rows | Snap ON re-renders chromatic |
| 6 | Size 6 → status matches `/Snapped to MOS size (5\|7)/` + 6 or 8 rows | Snap announce |
| 7 | Snap OFF + size 6 → status `/Free size 6/` + non-zero rows | Free-size announce |
| 8 | Period n=1 → status `/period must be > 1\/1/` + tbody preserved at 8 rows | D-29 period=1/1 |
| 9 | Click Play → `synth.playArpeggio` called once with `freqs.length === 8` | Audio wiring |
| 10 | Factory takes `(synth)` and `(synth, opts?)` with override behaviour | API surface |

Suite: `npx vitest run src/components/__tests__/mos-builder.test.ts` → 10/10 pass.
Full project suite: 227/227 pass across 17 files.

## Verification gate results

| Gate | Result |
|------|--------|
| `npx vitest run src/components/__tests__/mos-builder.test.ts` | 10 passed |
| `npx eslint src/components/mos-builder.ts` | 0 errors |
| `grep 'innerHTML.*\$\{' src/components/mos-builder.ts` | 0 matches (XSS guard) |
| `grep 'createSynth\|new AudioContext' src/components/mos-builder.ts` | 0 matches (three-layer) |
| `role="status" + aria-live="polite"` | both set via `setAttribute` |
| Reuses scaleTable + playScale | 10 references (imports + calls) |
| Default seed `{ n: 3, d: 2 }` | 2 matches (gen + period structure) |
| `npx tsc --noEmit` | Pre-existing errors in synth.ts/lattice.ts (`npm:` imports — Framework runtime convention, not type-checked); zero new errors from mos-builder.ts |

## Threat model — disposition follow-through

| Threat ID | Mitigation in shipped code |
|-----------|---------------------------|
| T-04-22 (XSS via err.message) | All status writes via `status.textContent = msg` — no `innerHTML` interpolation anywhere in the file. Confirmed by grep gate. |
| T-04-23 (DoS via large size) | `clampPositiveInt(value, MAX_SIZE=1024)` runs before every `buildMos` call. Kernel re-rejects via `RangeError`. |
| T-04-24 (DoS via rapid typing) | Accepted — no debounce in v1. CONTEXT D-26 establishes 300ms as the canonical debounce window if perceptible lag emerges in practice. |
| T-04-25 (Tampering via n=0/d=0) | `clampPositiveInt` floors at 1. Even if a user pastes "0" or "-3", the input value is clamped to "1" before the Interval constructor runs. |

## Deviations from plan

None — plan executed as written. The form structure was refactored once during implementation (initial draft used nested `<label>` elements which is invalid HTML; final form uses flat `<div class="mos-builder__field">` cells with explicit `<span class="mos-builder__field-label">` text and per-input `aria-label` attributes for screen-reader semantics). This is a fidelity improvement, not a deviation from any documented requirement.

## INVENTORY rows queued for Plan 04-07

```
| mosBuilder         | function | src/components/mos-builder.ts | MOS construction widget — n/d ratio inputs + size + snap toggle + scaleTable + Play. |
| MosBuilderOpts     | type     | src/components/mos-builder.ts | Options for mosBuilder factory (baseHz, precision, defaultGenerator, defaultPeriod, defaultSize). |
```

## Self-Check: PASSED

Files verified to exist:
- FOUND: src/components/mos-builder.ts
- FOUND: src/components/mos-builder.css
- FOUND: src/components/__tests__/mos-builder.test.ts

Commits verified in git log:
- FOUND: a414aa7 test(04-05): add failing tests for mosBuilder component
- FOUND: e6af054 feat(04-05): implement mosBuilder MOS construction widget
