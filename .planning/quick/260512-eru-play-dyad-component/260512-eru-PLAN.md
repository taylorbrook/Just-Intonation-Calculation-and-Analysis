---
phase: quick-260512-eru
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/play-dyad.ts
  - src/components/__tests__/play-dyad.test.ts
autonomous: true
requirements:
  - QUICK-260512-eru
must_haves:
  truths:
    - "src/components/play-dyad.ts exports a named function `playDyad(a: Interval, b: Interval, synth: SynthHandle, opts?: PlayDyadOpts): HTMLButtonElement`"
    - "PlayDyadOpts shape is exactly { baseHz?: number; duration?: number; label?: string }"
    - "Defaults match play-interval.ts: baseHz = 440 (D-08), duration = 1.5 (D-18)"
    - "On click the handler calls synth.playNotes with TWO frequencies simultaneously: [baseHz * Number(a.fraction.valueOf()), baseHz * Number(b.fraction.valueOf())] — single chord call, NOT sequential playNote calls and NOT playArpeggio"
    - "BigInt-Fraction is the source of truth: ratio access goes through `.fraction.toFraction()` and `.fraction.valueOf()`; cents is never used in the kernel-side path (Pitfall #1)"
    - "Button is a real `<button type=\"button\">` with className `play-btn` and a typographic `▶` glyph (mirrors play-interval.ts UI-SPEC)"
    - "When opts.label is provided it is used verbatim as the button textContent (prefixed with `▶ `); when omitted the textContent is just `▶` (matches play-interval's no-label rendering)"
    - "aria-label is always set to a descriptive string built from the two ratios, e.g. `Play 5/4 and 7/4 together`"
    - "Module imports Interval and SynthHandle as TYPES ONLY (`import type`); does NOT import sw-synth directly (owner-allocates pattern); does NOT import any CSS file (CSS ships via per-page style: frontmatter)"
    - "src/components/__tests__/play-dyad.test.ts is a happy-dom vitest spec using makeStubSynth from ./test-utils.js; covers: (1) returns HTMLButtonElement with class 'play-btn' and type='button', (2) default render shows '▶' only, (3) opts.label overrides textContent to '▶ <label>', (4) aria-label contains both ratios, (5) click dispatches a single synth.playNotes call with a two-element [baseHz*a, baseHz*b] array — NOT playNote and NOT playArpeggio, (6) custom baseHz + duration are forwarded correctly"
    - "Both new files type-check under `npm run lint:types` and the new spec passes under `npm test`"
    - "No existing page or component is wired to playDyad — this task ships the component + spec only (wiring is deferred to later tasks)"
  artifacts:
    - path: "src/components/play-dyad.ts"
      provides: "Inline ▶ button factory that auditions two intervals as a simultaneous dyad against a base Hz; mirrors play-interval.ts (factory shape, .play-btn class, ARIA, owner-allocates SynthHandle, BigInt-Fraction-only kernel path) but calls synth.playNotes with TWO frequencies in a single call."
      contains: "playNotes"
    - path: "src/components/__tests__/play-dyad.test.ts"
      provides: "happy-dom vitest spec mirroring keyboard.test.ts / play-interval pattern; verifies class+ARIA, default/labeled rendering, and that click triggers exactly one synth.playNotes call with [baseHz*a, baseHz*b]."
      contains: "playNotes"
  key_links:
    - from: "src/components/play-dyad.ts"
      to: "src/lib/interval.ts (Interval)"
      via: "type-only import"
      pattern: 'import type \{ Interval \} from "../lib/interval.js"'
    - from: "src/components/play-dyad.ts"
      to: "src/audio/synth.ts (SynthHandle)"
      via: "type-only import (owner-allocates — caller passes the SynthHandle)"
      pattern: 'import type \{ SynthHandle \} from "../audio/synth.js"'
    - from: "src/components/__tests__/play-dyad.test.ts"
      to: "src/components/play-dyad.ts (playDyad)"
      via: "value import"
      pattern: 'import \{ playDyad \} from "../play-dyad.js"'
    - from: "src/components/__tests__/play-dyad.test.ts"
      to: "src/components/__tests__/test-utils.ts (makeStubSynth)"
      via: "value import"
      pattern: 'import \{ makeStubSynth \} from "./test-utils.js"'
---

<objective>
Build a new component `src/components/play-dyad.ts` that plays two intervals SIMULTANEOUSLY against a base Hz — the dyad analogue of `playInterval`. Signature: `playDyad(a: Interval, b: Interval, synth: SynthHandle, opts?: { baseHz?: number; duration?: number; label?: string }): HTMLButtonElement`. The click handler calls `synth.playNotes([baseHz * Number(a.fraction.valueOf()), baseHz * Number(b.fraction.valueOf())], duration)` — a single chord call, not sequential. Mirror play-interval.ts exactly for structure, ARIA, `.play-btn` class, and owner-allocates synth ownership. Keep BigInt-Fraction as the source of truth on the kernel side: never round-trip through cents. Add a vitest spec under `src/components/__tests__/play-dyad.test.ts` modeled on keyboard.test.ts (the closest existing analog — there is no play-interval.test.ts yet). Do NOT wire the component into any page; that is deferred.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/components/play-interval.ts
@src/components/__tests__/keyboard.test.ts
@src/components/__tests__/test-utils.ts
@src/lib/interval.ts
@src/audio/synth.ts

<interfaces>
<!-- Use these directly — no codebase exploration needed. -->

From src/lib/interval.ts:
```typescript
export class Interval {
  readonly fraction: Fraction;          // BigInt-backed (R-01)
  // .fraction.toFraction() -> "5/4"
  // .fraction.valueOf()    -> number coercion (audio boundary only)
}
```

From src/audio/synth.ts:
```typescript
export interface SynthHandle {
  playNote(hz: number, dur?: number): () => void;
  playNotes(freqs: number[], dur?: number): void;     // <-- chord; use this
  playArpeggio(freqs: number[], stepSec?: number): void;
  startDrone(hz: number): () => void;
  panic(): void;
  readonly activeVoices: number;
  dispose(): void;
}
```

From src/components/__tests__/test-utils.ts:
```typescript
export interface StubSynthHandle extends SynthHandle {
  playNote: ReturnType<typeof vi.fn>;
  playNotes: ReturnType<typeof vi.fn>;
  // ...all methods are vi.fn()
}
export function makeStubSynth(): StubSynthHandle;
```

<reference_implementation>
src/components/play-interval.ts is the canonical sibling. Mirror it line-for-line for the doc-comment shape (ARCHITECTURE pattern 2, three-layer discipline note, UI-SPEC note about typographic ▶), the type-only imports, the constants, and the click-handler shape — then change exactly:

1. Signature accepts TWO intervals `a, b: Interval` (positional) instead of one.
2. `PlayDyadOpts.label` is `string | undefined` (not `boolean`). When set, render `▶ ${label}`; when unset, render `▶` (no auto-generated `Play 5/4 + 7/4` label — keep the no-label path identical to play-interval's).
3. aria-label is `Play ${a.fraction.toFraction()} and ${b.fraction.toFraction()} together`.
4. Click handler:
   ```typescript
   synth.playNotes(
     [baseHz * Number(a.fraction.valueOf()), baseHz * Number(b.fraction.valueOf())],
     dur,
   );
   ```
   Single call. Two frequencies. NOT playArpeggio.
</reference_implementation>

<spec_coverage>
Mirror keyboard.test.ts structure (`// @vitest-environment happy-dom`, vitest `describe/it/expect`, makeStubSynth). Six tests:

1. Returns HTMLButtonElement with `className === "play-btn"` and `type === "button"`.
2. Default render: `textContent === "▶"`.
3. Labeled render: `playDyad(a, b, synth, { label: "5:4:7" })` → `textContent === "▶ 5:4:7"`.
4. aria-label contains both ratios — assert with regex matching both `5/4` and `7/4`.
5. Click → exactly one `synth.playNotes` call. Args: `[[expected_a_hz, expected_b_hz], expected_dur]`. Assert `synth.playNote` and `synth.playArpeggio` were NOT called. Use intervals `5/4` and `7/4`, baseHz `440`. Expected freqs: `440 * 5/4 = 550`, `440 * 7/4 = 770`.
6. Custom baseHz + duration are forwarded: `playDyad(a, b, synth, { baseHz: 220, duration: 2.0 })`, click, assert `playNotes` was called with `[[275, 385], 2.0]`.
</spec_coverage>

</context>

<verification>
After implementation, run:
- `npm run lint:types` — must exit 0
- `npx vitest run src/components/__tests__/play-dyad.test.ts` — all 6 tests pass
- No edits to any file other than the two listed in `files_modified`. No page wiring. No CSS file. No additions to `src/components/play-interval.ts`.
</verification>
</content>
</invoke>