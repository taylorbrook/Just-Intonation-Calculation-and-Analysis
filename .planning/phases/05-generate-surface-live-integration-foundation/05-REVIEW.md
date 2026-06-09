---
phase: 05-generate-surface-live-integration-foundation
reviewed: 2026-06-09T06:35:25Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - observablehq.config.ts
  - src/__tests__/scale-store-boot.test.ts
  - src/components/generate.css
  - src/index.md
  - src/lib/INVENTORY.md
  - src/pages/analysis.md
  - src/pages/generate.md
  - src/state/__tests__/scale-store-event.test.ts
  - src/state/__tests__/scale-store.test.ts
  - src/state/scale-store.ts
  - src/styles.css
  - vitest.config.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-06-09T06:35:25Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This phase adds an additive shared-scale store (`src/state/scale-store.ts`),
a new Generate surface (`src/pages/generate.md`), and "live-receive" listener
cells on the Dashboard and Analysis pages. The store module itself is
well-built: defensive `readSharedScale`, a clean pure `resolveInitialScaleText`
precedence helper, a thorough test suite (29 tests, all passing), clean
`tsc --noEmit`, and the threat-model mitigations (shape validation, 8 KB cap on
both read and write, throw-safe try/catch) are all present and tested. The
empty-store boot-equivalence invariant (R1) is genuinely pinned.

The serious problem is architectural, not in the store kernel. The phase is sold
as a "one-way **live** channel" (SYNC-01/02) — an already-open consumer tab is
supposed to update live when Generate broadcasts. But the only cross-page
transport implemented is a `window` `CustomEvent`, which cannot cross tabs and
cannot survive Observable Framework's full-page navigation. The live-receive
listener cells on the Dashboard and Analysis pages are therefore dead code that
can never fire in production. The hand-off still works, but only via the boot
path (localStorage read + `#s=` hash) — the entire "live" half is non-functional.
This is the BLOCKER below; the rest are warnings and quality items.

## Critical Issues

### CR-01: "Live" scale channel never fires — CustomEvent cannot cross tabs or survive navigation

**File:** `src/state/scale-store.ts:140-147`, `src/index.md:108-118`, `src/pages/analysis.md:113-123`

**Issue:** The phase's headline feature — a live channel so an already-open
consumer tab updates when Generate pushes a scale (RESEARCH A2, module docstring
lines 9-16 / 119-121, both `// Phase 5 SYNC-01/02` listener cells) — does not
work in any real scenario:

- **Cross-tab (the stated A2 goal):** `writeSharedScale` broadcasts via
  `window.dispatchEvent(new CustomEvent(SCALE_CHANGED_EVENT, ...))`. A `window`
  CustomEvent is scoped to a single window and never propagates to other
  tabs/windows. The only API that crosses tabs is the `storage` event — and
  nothing in `src/` listens for `storage` (verified: zero matches for
  `"storage"`/`StorageEvent`/`onstorage` outside tests). So a Dashboard open in
  tab A receives nothing when Generate writes in tab B.
- **Same-tab Send-to:** `sendCurrentScaleTo` (`generate.md:342-353`) dispatches
  the event in the Generate window, then immediately calls
  `window.location.assign(...)`. Observable Framework uses full-page navigation
  (no client-side router — confirmed in `framework/dist/client`), so the
  destination page loads fresh and registers its `SCALE_CHANGED_EVENT` listener
  *after* the event already fired in the now-discarded window.

The only `writeSharedScale` caller is `generate.md`; the only
`SCALE_CHANGED_EVENT` listeners are on `index.md` / `analysis.md`. Producer and
consumers are never co-resident in the same live window, so the listener cells
are unreachable code. The hand-off actually succeeds only through the boot path
(`resolveInitialScaleText(hashDecoded, readSharedScale(), seed)` +
`#s=` hash) — which is fine, but it is NOT "live," and the broadcast machinery
plus both listener cells are dead weight that misrepresents what ships.

**Fix:** Either implement a real cross-tab transport or drop the "live" framing
and the dead listener/broadcast code. The minimal real fix is a `storage`-event
bridge on the consumers (this is the canonical cross-tab pattern and is what the
theme-prefs CustomEvent does NOT need, because theme toggling is same-page):

```ts
// On Dashboard / Analysis, replace the dead CustomEvent listener with a
// storage listener that re-reads the validated store. Fires in OTHER tabs only.
{
  const onStorage = (e) => {
    if (e.key !== SCALE_STORAGE_KEY) return;
    const next = readSharedScale();          // re-validates shape + 8 KB cap
    if (next && next.text.length) {
      scaleInput.value = next.text;
      scaleInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  window.addEventListener("storage", onStorage);
  invalidation.then(() => window.removeEventListener("storage", onStorage));
}
```

(Keep the CustomEvent only if a same-page producer is ever added; today it has
none.) If live cross-tab sync is not actually wanted for v1, remove the
`dispatchEvent` half of `writeSharedScale` and both listener cells, and rewrite
the SYNC-01/02 docstrings to describe a boot-time + deep-link hand-off rather
than a live channel.

## Warnings

### WR-01: Shared store silently and permanently overrides the seed; no way back without clearing localStorage

**File:** `src/state/scale-store.ts:62-68`, `src/index.md:82`, `src/pages/analysis.md:75`

**Issue:** `resolveInitialScaleText` is `hashDecoded ?? stored?.text ?? seedText`.
Once any Send-to writes the store, every subsequent *plain* visit (no `#s=`
hash) to the Dashboard or Analysis boots with the stored scale instead of the
built-in seed — indefinitely. There is no `removeItem` / `clearSharedScale`
path anywhere in the codebase (verified), and no UI affordance to reset. A user
who sends one scale then later opens the Dashboard expecting the default JI
heptatonic gets the old generated scale with no indication why, and no in-app
way to get the seed back short of editing the textarea or clearing browser
storage. This is a stale-state / data-stickiness footgun, not just cosmetic.

**Fix:** Decide and document the lifetime. Options: (a) treat the store as a
one-shot hand-off — have the consumer call a new `clearSharedScale()` (a
`localStorage.removeItem(SCALE_STORAGE_KEY)` wrapped in try/catch) immediately
after consuming it at boot; or (b) keep persistence but add a visible "Reset to
default scale" control. At minimum, surface a small status note when the boot
value came from the store rather than the seed so the override is not silent.

### WR-02: Cap-error status message is destroyed by navigation before the user can read it

**File:** `src/pages/generate.md:342-353`

**Issue:** In `sendCurrentScaleTo`, the oversize path does
`showCapError()` then `window.location.assign(target)` (hashless). The
full-page navigation begins immediately, tearing down the page — the
`role="status"` cap-error message the user is meant to read is gone before
`aria-live` can announce it or the user can see it. The "surface the cap-error
copy" behavior (comment lines 311-318, `CAP_ERROR_COPY`, `sendStatus` cell) is
effectively a no-op on the oversize branch. (Compounding: the only functional
method, `harmonic-segment`, is bounded to ≤ 64 pitches and can never exceed
8 KB, so this branch is also currently unreachable — but the logic is wrong for
the moment a larger method is added.)

**Fix:** On the oversize branch, do NOT navigate — show the cap-error and let
the user shrink the scale and retry:

```ts
} catch (err) {
  console.warn("encodeScaleToHash failed:", err);
  showCapError();
  return; // stay on the page so the user can see the error and reduce pitches
}
```

If a hashless fallback navigation is genuinely desired, defer it (e.g. behind a
second explicit user action) so the message is actually readable first.

### WR-03: Store write and hash encode can disagree — store persists a scale the deep link omits

**File:** `src/pages/generate.md:342-353`

**Issue:** `sendCurrentScaleTo` writes the store first
(`writeSharedScale(currentScaleText, SEND_SOURCE)`) and only afterward attempts
`encodeScaleToHash`. Both use the same 8 KB `MAX_SCALE_TEXT_BYTES`, so today
they agree at the boundary. But the ordering bakes in a latent inconsistency: if
the two caps ever diverge (e.g. encoder gains a version-byte overhead, or the
store cap is tuned separately), a scale could be persisted to the store yet fail
to encode — the target then navigates hashless, boots, and the store value
(written moments ago) silently wins via `resolveInitialScaleText`. The user
asked to "send X with a shareable link" and got "X stuck in the store, no link,"
which is a confusing partial success.

**Fix:** Encode first, then write the store only if encoding succeeds, so the
two side effects are atomic-by-success:

```ts
function sendCurrentScaleTo(target) {
  let hash;
  try {
    hash = "#s=" + encodeScaleToHash(currentScaleText);
  } catch (err) {
    console.warn("encodeScaleToHash failed:", err);
    showCapError();
    return;
  }
  writeSharedScale(currentScaleText, SEND_SOURCE);
  clearSendStatus();
  window.location.assign(target + hash);
}
```

### WR-04: Live-receive handler accepts any string length; relies on a producer-side cap it does not re-check

**File:** `src/index.md:109-114`, `src/pages/analysis.md:114-119`

**Issue:** The `onScale` handler reads `e?.detail?.text` and, on
`typeof t === "string" && t.length`, writes it straight into the textarea and
dispatches `input`. It does not re-validate the 8 KB cap or shape — it trusts
that `writeSharedScale` already capped the payload. That coupling holds today,
but the handler is wired to a public `window` event name
(`SCALE_CHANGED_EVENT`) that any script on the page can dispatch with an
arbitrary `detail`. An oversized or hostile `detail.text` would be injected into
the textarea (then parsed/encoded downstream) without passing the store's
validation gate. Even setting aside CR-01 (the handler currently never fires),
the validation asymmetry is a defense-in-depth gap relative to the read path,
which DOES re-cap on read (`scale-store.ts:97`).

**Fix:** Route the live path through the same validation as the boot path.
Prefer re-reading the validated store (see CR-01 fix) rather than trusting the
event detail; if you must consume `detail`, enforce the cap explicitly:

```ts
const onScale = (e) => {
  const t = e?.detail?.text;
  if (typeof t !== "string" || !t.length) return;
  if (new TextEncoder().encode(t).length > MAX_SCALE_TEXT_BYTES) return;
  scaleInput.value = t;
  scaleInput.dispatchEvent(new Event("input", { bubbles: true }));
};
```

## Info

### IN-01: Empty reactive cell containing only orphaned comments

**File:** `src/pages/generate.md:173-176`

**Issue:** A `ts` cell holds nothing but two comment lines ("Helper line under
the params host …") and produces no output. The work it describes
(`previewHelper`) is actually implemented in the separate cell at lines 180-188,
below the `## Preview` heading. The empty cell is dead scaffolding left behind
when the helper was relocated.

**Fix:** Delete the empty cell (lines 173-176). Move its descriptive comment
into the `previewHelper` cell if the note is worth keeping.

### IN-02: "Last line is the period" helper is placed under "Preview" but describes the params/output above the heading

**File:** `src/pages/generate.md:178-188`

**Issue:** The `previewHelper` ("Last line is the period. 1/1 is added
automatically.") renders directly under the `## Preview` heading, and it renders
unconditionally — including while the empty-state ("No scale yet. Pick a method
to generate one.") is shown, where the "last line is the period" hint is
meaningless. The helper semantically belongs with the generated scale table, not
as a standing caption under the section header.

**Fix:** Render `previewHelper` inside the success branch of the preview-host
swap (alongside `scaleTable`), so it appears only when an actual scale is shown.

### IN-03: Stale design comment in styles.css claims a `theme` frontmatter the pages no longer carry

**File:** `src/styles.css:12-15`

**Issue:** The header comment states "The dashboard (src/index.md) overrides
with `theme: [air, near-midnight, wide]`," but `src/index.md` (and
`analysis.md` / `generate.md`) have no YAML frontmatter at all (verified). The
comment describes a configuration that does not exist, which will mislead the
next reader about where theme/width is set. Pre-existing, but adjacent to this
phase's `@import "./components/generate.css";` addition on line 35.

**Fix:** Update or delete the stale paragraph in the styles.css header comment
to reflect that no page-level `theme:` frontmatter is used and width comes from
the global config.

---

_Reviewed: 2026-06-09T06:35:25Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
