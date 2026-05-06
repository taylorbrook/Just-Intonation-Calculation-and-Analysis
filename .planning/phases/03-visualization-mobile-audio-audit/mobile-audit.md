# Mobile Audit — Phase 3 (AUDIO-06)

Verification methodology + iOS quirk inventory + accepted residual risk for the
Phase 3 mobile-Safari audio audit (per CONTEXT D-18). The verification target is
**Safari macOS Responsive Design Mode (RDM) — iPhone preset**; physical-device
testing is deferred.

This document is the user-facing checklist for Plan 06's `human-verify`
checkpoint and the long-form record of every Pitfall #5/#7/#8/#9/#11 mitigation
that landed in synth.ts (Plan 03), the viz components (Plans 04/05), and the
dashboard cell wiring (Plan 06).

---

## Section 1 — Verification Methodology

**Target:** Safari macOS Responsive Design Mode (RDM), iPhone 14 (or newer)
preset.

**Setup steps:**

1. From a terminal at the repo root, start the Framework dev server:
   ```bash
   npm run dev
   ```
   Note the localhost URL it prints (typically `http://127.0.0.1:3000/`).
2. Open Safari on macOS.
3. From the menu bar choose **Develop → Enter Responsive Design Mode** (keyboard
   shortcut: ⌘⌥R). If the Develop menu is missing, enable it under
   **Safari → Settings → Advanced → "Show features for web developers"**.
4. In RDM, choose any current **iPhone** preset from the device strip
   (iPhone 14, iPhone 15, iPhone SE — any will exercise the same WebKit
   rendering path).
5. Navigate to the dev server URL (paste it into the RDM URL bar).
6. Walk the smoke-test checklist below. Tick each item that passes.

**Smoke-test checklist (≥10 items):**

- [ ] **Audio panel renders** — interval selector, ▶ Play, ⏵⏵ Arpeggiate, and
      🔇/🔊 Drone toggle all visible below the scale-table.
- [ ] **▶ Play produces sound** — clicking ▶ Play on the audio panel triggers
      audible audio (assuming volume up + silent switch off).
- [ ] **Lattice renders + clickable** — lattice SVG visible below sclIo;
      clicking an in-scale node triggers audible audition (dyad — 1/1 + ratio).
- [ ] **Tonality diamond renders + clickable** — diamond grid visible below
      lattice; clicking an in-scale (filled) cell triggers audible audition.
- [ ] **Pinch-zoom works on lattice + diamond** — two-finger pinch in RDM (use
      ⌥ to simulate two-finger touch) zooms the SVG without scrolling the page.
- [ ] **Keyboard taps audible + visual feedback** — tapping a key produces
      sound; the key visibly darkens (`keyboard__key--active` blue tint) while
      held; pointer-up releases both audio and visual state.
- [ ] **Floating Stop button + Esc work** — start a long arpeggio; the floating
      "Stop all audio (Esc)" button appears in the top-right; clicking it stops
      audio. Press Esc anywhere on the page → audio also stops.
- [ ] **Stop button hides when idle** — after the audio stops, the Stop button
      disappears within ~100ms (the activeVoices polling tick).
- [ ] **`.kbm` import surfaces "Use baseHz instead" toggle** — import any of
      the test fixtures from `src/lib/__tests__/fixtures/kbm/`. The
      "Use baseHz instead of imported .kbm" toggle appears below baseHz.
- [ ] **Toggle ON / OFF affects audition** — with a `.kbm` imported, toggle ON
      → playback uses `baseHz`; toggle OFF → playback uses the kbm-derived
      effective Hz. Confirm by ear (typically a noticeable pitch shift) or by
      checking the scale-table cents column reflects the change.
- [ ] **No horizontal overflow at ≥320px** — switch to RDM's narrowest iPhone
      width; the page must not require horizontal scrolling.
- [ ] **Input taps don't trigger iOS auto-zoom** — tapping into the scale
      textarea or the baseHz number input does NOT zoom the viewport. (The
      global `font-size: 16px` floor in `src/styles.css` is the mitigation.)

For any failing item: file a gap into
`.planning/phases/03-visualization-mobile-audio-audit/03-VERIFICATION.md` (let
`/gsd-verify-work` close gaps).

---

## Section 2 — RDM-Only Limitations (Documented Trade-offs)

RDM emulates iOS WebKit rendering and most touch gestures, but two iOS-specific
audio behaviors **are NOT reproduced** by RDM. These are documented limitations
accepted per D-18.

### 2.1 — iOS Hardware Mute Switch

**Behavior on physical iOS:** the silent switch on the side of an iPhone
silences AudioContext output even when the page UI shows audio playing. The
`Synth.activeVoices` getter will report > 0 and `aria-pressed="true"` will hold
on the keyboard key, but the user hears nothing.

**Mitigation in code (Plan 03 — `src/audio/synth.ts`):**
`navigator.audioSession.type = 'playback'` is set in `ensure()` via the
`setAudioSessionPlayback()` helper. On iOS 16.4+ Safari and macOS 14.4+ Safari,
this opts the AudioContext into the "playback" Audio Session category, which
**bypasses the silent switch**. Feature-detected; no-op on browsers without the
W3C Audio Session API.

**User-visible mitigation (UI-SPEC line 143):** the recommended dashboard
tooltip text on audio buttons: *"If you hear nothing on iPhone, check the
silent switch on the side of your device."* (Tooltip wiring deferred to a
follow-up — the audio-panel's affordance is currently silent on this; surface
the tip in a Phase 4 polish pass.)

**Older iOS (< 16.4):** documented limitation. The legacy workaround (a hidden
`<audio>` tag continuously playing a silent WAV to "trick" iOS into the media
playback category) was explicitly considered and rejected — modern iOS does not
need it, and shipping a permanent silent audio loop adds battery cost and may
fail App Tracking Transparency / privacy reviews if the page is later wrapped
in a WebView.

### 2.2 — iOS Autoplay-Policy Nuances

**Behavior on physical iOS:** `AudioContext.resume()` MUST be called
synchronously inside a user-gesture handler. Any `await` between the gesture
and the resume call (even an `await` on an unrelated promise) breaks the
gesture chain on iOS, leaving the context in `'suspended'` state.

**RDM behavior:** RDM is more permissive than physical iOS — it accepts async
resume in many cases. This means a resume bug in our code might pass RDM but
fail on a real iPhone. Trust the code path, not the RDM result.

**Mitigation in code (Plan 03 — `src/audio/synth.ts`):** `ensure()` calls
`void ctx.resume()` synchronously when `ctx.state === 'suspended'` — both on
first context creation AND on the already-initialised fast-path. NO `await`
between the user-gesture callback and the resume call. The Plan 03 test
`AUDIO-06 — sync resume on first user-gesture` asserts this contract directly.

**Accepted residual risk per D-18:** because RDM does not faithfully reproduce
the synchronous-resume requirement, a regression here would not be caught by
the smoke-test. Code review of any future change to `ensure()` MUST verify the
synchronous shape.

---

## Section 3 — Phase 3 Code-Level Mitigations

Pitfall-to-code mapping for the five mobile-Safari pitfalls addressed in
Phase 3:

| Pitfall | Mitigation site | Mechanism |
|---------|-----------------|-----------|
| Pitfall #5 (touch-action gesture conflicts) | `src/components/lattice.css`, `tonality-diamond.css` | `touch-action: none` on the SVG so d3-zoom owns pinch (no native double-tap-zoom or page-scroll interception). |
| Pitfall #5 (touch-action keyboard taps) | `src/components/keyboard.css` | `touch-action: manipulation` on each `.keyboard__key` — allows fast taps but blocks the iOS double-tap-zoom delay (~300ms tap-latency). |
| Pitfall #7 (iOS hardware mute) | `src/audio/synth.ts` `setAudioSessionPlayback()` | Feature-detected `navigator.audioSession.type = 'playback'` in `ensure()`. Try/catch swallows assignment failure. |
| Pitfall #8 (autoplay synchronous resume) | `src/audio/synth.ts` `ensure()` | `if (ctx.state === 'suspended') void ctx.resume();` — synchronous, no await. Applied on BOTH first-construction AND already-initialised paths. |
| Pitfall #9 (visibility-driven resume) | `src/audio/synth.ts` `bindVisibilityListener()` | `document.addEventListener('visibilitychange', ...)` bound at-most-once per `createSynth` lifetime; resumes the ctx when the tab returns to `visible`. Removed in `dispose()` BEFORE the rest of teardown so a late-firing event sees `disposed=true` and bails. |
| Pitfall #11 (Esc binding cell ownership) | `src/index.md` synth cell | Esc keydown listener bound in the synth cell (no scale dependency) so it does NOT re-bind on every textarea edit. Cleanup via the consolidated `invalidation.then(...)` block. |

---

## Section 4 — Audio-Layer Fix Inventory (D-15)

D-15 enumerates the four audio-layer fixes that constitute AUDIO-06's
production deliverable. All four are landed and verified in code:

- [x] **Synchronous `ctx.resume()` in user-gesture handler** — landed in
      Plan 03 (`src/audio/synth.ts` `ensure()`); verified by the
      `AUDIO-06 — sync resume on first user-gesture` test.
- [x] **`webkitAudioContext` fallback preserved** — `resolveAudioCtxCtor()` in
      `src/audio/synth.ts` already handled this in Phase 2; Plan 03 verified
      no regression and explicitly documented the preservation in its SUMMARY.
- [x] **`visibilitychange` listener with cleanup** — landed in Plan 03
      (`bindVisibilityListener()` in `src/audio/synth.ts`); cleanup in
      `dispose()` removes the listener BEFORE teardown. Tests assert both
      bind-once (under repeated `ensure()` invocations) and bind-and-remove
      (function reference equality across the lifecycle).
- [x] **Page-level Stop-all + Esc keyboard shortcut** — landed in Plan 06
      (`src/index.md` synth cell binds Esc keydown → `synth.panic()`; floating
      `.stop-all-audio` button cell visible only when `audioActive` Mutable is
      true; click → `synth.panic()`). UI-SPEC-verbatim labels.

---

## Section 5 — Future Work (Deferred)

- **Physical-iPhone verification** — deferred per D-18. The two RDM-only
  limitations in Section 2 are accepted residual risk. A one-off device check
  would catch any regression in the synchronous-resume contract or the
  audioSession fallback path.
- **iOS < 16.4 fallback** — deferred per RESEARCH A5 / Section 2.1. The Audio
  Session API is the modern path; supporting older iOS would require either
  the rejected silent-WAV trick or a feature-detect fallback that gracefully
  degrades to "audio works when silent switch is off." Acceptable for v1.
- **Legacy `<audio>`-tag silent-WAV trick** — explicitly NOT shipping. See
  Section 2.1 rationale.
- **iOS-tooltip wiring on audio-panel buttons** — UI-SPEC line 143 hint copy
  is documented but not yet wired to a `title` / accessible-tooltip on the
  buttons. Phase 4 polish.

---

**Verified by:** {user, after running smoke-test checklist}
**Verification date:** {YYYY-MM-DD}
