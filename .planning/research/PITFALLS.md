# Pitfalls Research

**Domain:** Observable Framework site combining a JI calculator + tuning-systems research notes — JI math, monzo arithmetic, Web Audio playback of arbitrary frequencies, Scala `.scl`/`.kbm` I/O, and Markdown-with-reactive-cells publishing. Personal research notebook anchored to a specific composition in progress.
**Researched:** 2026-05-02
**Confidence:** HIGH for JI math and Scala-format pitfalls (Huygens-Fokker spec + xenharmonic-devs source as ground truth). HIGH for Web Audio click/pop, autoplay-policy, and `AudioContext` lifecycle (well-documented). HIGH for Observable Framework reactive-cell pitfalls (verified against Framework docs + the project's own ARCHITECTURE.md). MEDIUM for some project-shape pitfalls (judgment calls about a one-person project).

## TL;DR

The five pitfalls most likely to quietly cost weeks on this exact project:

1. **Storing intervals as floating-point cents anywhere except the display layer.** Round-trip is irrecoverable; one stray `Number` argument in the kernel poisons every downstream comma identification. Detect at the type level (forbid `cents: number` in `Interval` constructors except on `fromCents()` which must be flagged as lossy).
2. **`AudioContext` lifecycle leaks during `observable preview` hot-reload.** Edit a cell, get a new context, browser caps you at ~6 contexts, audio dies silently. Fix: factory pattern + `invalidation.then(synth.dispose())` in the synth's owning cell, on every page that has audio. (ARCHITECTURE Pattern 4 already calls this out — must hold the line.)
3. **The composition page and the general toolkit drifting.** Either the composition becomes a hardcoded one-off that abandons the kernel, or the kernel grows speculative features no piece needs. Fix: every kernel feature must have a concrete caller in `src/lib/pieces/<piece>.ts` before merging.
4. **Visualization (lattice / tonality diamond) eating the project before the kernel works.** D3 + lattice rendering is fascinating; it can absorb weeks while `Interval.octaveReduce()` still has bugs. Fix: phase ordering — kernel + tests + audio + Scala I/O ship before any non-trivial viz.
5. **Reinventing what `xen-dev-utils` and `sonic-weave` already do.** Tenney height, monzo factorization, MOS scale construction, comma analysis — all already implemented. Fix: before writing any math primitive, grep the xenharmonic-devs source for it; only wrap (don't reimplement).

The rest of this document covers the full landscape with phase mappings.

---

## Critical Pitfalls

### Pitfall 1: Floating-Point Cents as Interchange Format

**What goes wrong:**
Somewhere in the kernel — a function signature, an internal cache, a serialization step — an interval is represented as a `number` of cents instead of an exact `Fraction` or monzo. Once that happens, any round-trip (cents → ratio → cents) loses the prime structure. `1200 * Math.log2(81/80)` ≈ 21.5063… cents — cannot be exactly inverted to `81/80`. Subsequent monzo computation gives garbage; comma identification returns false negatives ("this isn't 81/80, it's 80.99999/80"); Tenney height computed from float-derived ratios becomes meaningless; `Interval.equals()` between a parsed-from-cents and parsed-from-ratio version of the "same" interval returns `false`.

**Why it happens:**
- "Cents are easier to display" — true, and that's why `cents` belongs in the display layer, not the data layer.
- Web Audio takes `frequency: number` (Hz), so there's a temptation to "just convert to Hz once and forget the ratio." Don't — convert at the audio-call boundary, not before.
- Scala `.scl` files mix cents-rows and ratio-rows; a lazy parser converts cents → ratio via float, losing precision permanently.
- Some "named comma" lookups try to match by cents-within-epsilon; this works until a near-comma (e.g., schisma at 1.95¢ vs syntonic comma at 21.5¢) creates ambiguity at larger epsilons.

**How to avoid:**
- `Interval` class holds `Fraction` (BigInt) as the **single source of truth**. Monzo and cents are *derived* lazily.
- Type-level enforcement: `Interval.fromCents(c: number)` exists but is **explicitly named lossy** in JSDoc and tests; do not call it inside the kernel — only at user-input boundaries (and even then, prefer ratio input).
- Forbid `cents: number` in any function signature inside `src/lib/` other than `fromCents()` and `cents` getter. Add a Vitest test that imports every public lib export and asserts no parameter is named `cents`.
- Comma identification matches by **canonical monzo signature**, not by cents-within-epsilon. The schisma and syntonic comma have different monzos; match those.
- Scala parsing: when a row is `408.0` (cents), store the row as `{kind: "cents", value: 408.0}` and propagate the imprecision flag with the resulting `Interval`. Don't silently round to a fake `Fraction`.

**Warning signs:**
- A function in `src/lib/` takes `cents: number` as a parameter (other than `fromCents`).
- `Interval.equals(a, b)` is implemented as `Math.abs(a.cents - b.cents) < EPSILON`.
- A test like `parseScale("21.50627").intervals[0].fraction.toFraction() === "81/80"` would fail.
- `npm run test` passes but a manual round-trip experiment in a notebook page disagrees with itself.

**Phase to address:**
**Phase 1 (kernel)** — bake into `Interval`'s API design. The cost of fixing this later is rewriting every consumer.

---

### Pitfall 2: `AudioContext` Lifecycle Leaks Under Hot-Reload

**What goes wrong:**
During `observable preview`, edits to a cell trigger re-runs. If a cell creates an `AudioContext` (directly or via `sw-synth`) without registering disposal via `invalidation.then(...)`, the old context never closes. After a few edits the browser hits its hard cap (Chrome: 6 contexts; some other browsers similar) and silently refuses to create more. Audio stops working — **with no error message** — and "fixing it" requires a full page reload. In production, the same bug surfaces on cross-page navigation: navigate away, navigate back, audio is dead.

A subtler variant: `AudioContext` created at module top level (e.g., `export const ctx = new AudioContext()` in `src/audio/synth.ts`). Browsers then put it into `suspended` state because there's been no user gesture; oscillators schedule but no sound comes out.

**Why it happens:**
- Top-level `new AudioContext()` is the most "obvious" thing to write — it works in a static demo.
- Framework's reactivity model isn't always intuitive for stateful resources; developers think "the cell re-runs, so the old context is gone, right?" — no, it's still alive in memory, GC'd whenever the heap feels like it.
- The browser autoplay policy gives no errors, only a `suspended` state — easy to overlook.

**How to avoid:**
- **Factory pattern, not singleton.** `createSynth()` returns a `Synth` object; the `AudioContext` is created lazily inside it on first method call (which will be inside a click handler, so user-gesture is satisfied).
- **Dedicated synth cell per page**, exactly once: `const synth = createSynth(); invalidation.then(() => synth.dispose());`
- The `dispose()` method calls `ctx.close()`, disconnects nodes, nulls references.
- Add a dev-only assertion: synth wrapper increments a global counter on `ensure()` and decrements on `dispose()`; if counter > 1 in dev, log a warning. Catches leaks during preview.
- Never put audio side effects in cell bodies. Always in event handlers (button onClick).

**Warning signs:**
- After 5–10 minutes of `observable preview` editing, audio stops working but the page looks fine.
- Browser DevTools → Console → no errors, but `audioContext.state === "suspended"` or `"closed"`.
- DevTools Memory profiler shows growing AudioContext count.
- A new tab works; the active tab doesn't.

**Phase to address:**
**Phase 1 (audio kernel)** — establish the pattern. Every page added later inherits it. ARCHITECTURE.md Pattern 4 is the playbook; the only failure mode is not following it consistently.

---

### Pitfall 3: Composition Drifts From the General Toolkit

**What goes wrong:**
Two failure modes, both end the project:
- **Drift mode A — toolkit abandons the piece:** The kernel grows speculative features (more comma analysis, more lattice projections, more EDO mappings) because they're interesting research. Meanwhile the composition page hasn't been touched in three weeks; when the composer returns to it, the kernel's API has shifted and the piece is broken.
- **Drift mode B — piece abandons the toolkit:** The composition page has hardcoded ratios inline, copied from an early `Interval` design that's since changed. The piece works, but it's no longer using the kernel — it's a dead-end one-off. The "generalizable toolkit" requirement quietly fails.

**Why it happens:**
- Two equally-weighted modes (composer's tool + theory exploration) compete for attention.
- Theory work is open-ended and intrinsically rewarding; piece work has deadlines.
- The discipline to factor piece-specific code through the kernel is non-trivial and easy to skip "just this once."

**How to avoid:**
- **Composition-as-module enforcement (ARCHITECTURE Pattern 6).** Every ratio used in the composition lives in `src/lib/pieces/<piece>.ts`. The composition page imports from there. No inline ratios anywhere on any page.
- **Every kernel feature must have a concrete caller in the piece module before merging.** If you can't show how the new `temperaments.findMeantone()` function helps the actual piece, it doesn't ship in this milestone — defer it to a future milestone.
- **End-to-end smoke test for the piece:** a Vitest test that imports `src/lib/pieces/<piece>.ts` and asserts `scale.intervals.length === N`, `scale.intervals[0].fraction.toFraction() === "1/1"`, etc. If a kernel refactor breaks this, you find out in CI, not three weeks later.
- **"Composition page first" rule for new features:** when you add `Scale.modeRotate()`, the first place it gets called is on the composition page. If it doesn't help the piece, you have evidence to skip it.

**Warning signs:**
- A merge to the kernel that doesn't change anything in the composition page.
- The composition page has more than zero literal `new Interval("5/4")` constructions outside of imports from the piece module.
- Three or more days where you only worked on theory pages and zero composition pages, or vice versa.
- The "demo the piece end-to-end" exercise breaks because the kernel changed.

**Phase to address:**
**Every phase** — but bake into success criteria from Phase 1. Each phase should land at least one concrete improvement to the composition page; if it doesn't, the phase scope was wrong.

---

### Pitfall 4: Visualization Eats the Project

**What goes wrong:**
Lattice diagrams and tonality diamonds are visually compelling and intrinsically interesting. D3 affords endless polish. You spend two weeks on a force-directed lattice with smooth pan/zoom, hover tooltips, a basis-vector picker, color-by-prime-limit, and SVG-to-PNG export — meanwhile `Interval.octaveReduce()` still misbehaves on negative monzos, the composition page can't audition more than one note, and `.scl` export hasn't been written. The project becomes a beautiful lattice viewer attached to a half-broken kernel.

**Why it happens:**
- Visual progress is dopaminergic; math correctness work is dopaminergic only when you remember why correctness matters.
- D3 has infinite surface area — there's always one more interaction to refine.
- Lattices are a flagship feature in microtonal-tool marketing (Scale Workshop, Sevish demos), so they feel central even when the actual user need is "hear this scale and export `.scl`."

**How to avoid:**
- **Phase ordering hard rule:** kernel + tests + audio playback + Scala I/O ship in Phase 1. Visualization (anything beyond a `<table>`) is Phase 2 at the earliest.
- **Time-box visualization features.** When you start the lattice, declare a time budget (e.g., 3 days for v1 lattice). If you blow past it, ship what you have and move on; iterate later.
- **Use `ji-lattice` for coordinates** instead of writing your own layout algorithm. Don't be the person who reimplements force-directed graph layout for the fourth time.
- **Plot for ratio scatters and bar charts** before reaching for D3. Most visualizations the project needs are not lattices.
- **Acceptance criterion:** the composition page is fully usable (scale display, audio playback, export) before any lattice exists. Lattice is a nice-to-have on top of a working tool.

**Warning signs:**
- More than one full day spent on a visualization without any kernel/audio/Scala-I/O work.
- The lattice has more code than the entire `src/lib/` kernel.
- You catch yourself searching for "D3 force layout examples" when the kernel still has a known bug.

**Phase to address:**
**Phase 1 success criteria must explicitly defer visualization beyond `scale-table.ts`.** Phase 2 introduces the lattice with a time-box.

---

### Pitfall 5: Reinventing What xen-dev-utils / sonic-weave Already Provide

**What goes wrong:**
You write `function tenneyHeight(monzo: bigint[]): number { ... }` from scratch, hit a subtle bug (e.g., negative exponents on prime 2 — Tenney height uses absolute log of the integer denominator), debug for two days, ship something subtly wrong. Meanwhile `xen-dev-utils` has had `tenneyHeight` for years, well-tested, used by Scale Workshop in production. Same story for monzo factorization, prime sieves, MOS construction (`moment-of-symmetry` package), comma analysis (`temperaments` package), and scale parsing primitives.

**Why it happens:**
- The xenharmonic-devs ecosystem has thin documentation; it's not always obvious what's already implemented.
- Writing a 20-line function feels faster than reading another library's API.
- Rationalizing the "I'll just write it myself" decision is easy: "It's just a few lines."

**How to avoid:**
- **Before writing any math primitive: grep `xen-dev-utils` source first.** `node_modules/xen-dev-utils/dist/*.d.ts` is searchable. Also check `sonic-weave`'s exports; many primitives are re-exported.
- **Wrap, don't reimplement.** If `xen-dev-utils` has it, your `src/lib/monzo.ts` re-exports it (possibly with a thin wrapper for `Interval`-ergonomics). Wrapping is fine; reimplementing is not.
- **Document deltas.** When you do write something custom, comment with `// xen-dev-utils equivalent: NONE — custom because [reason]`. Forces the conscious decision.
- **Keep an `INVENTORY.md`** in `src/lib/` that lists which primitives come from where. Update on every PR. Catches duplication.

**Warning signs:**
- You wrote a function called `primeFactorize`, `gcd`, `tenneyHeight`, `oddLimit`, `monzoFromFraction`, `centsFromMonzo`, or similar without checking `xen-dev-utils` first.
- A bug that "should be impossible" turns out to be a real bug, in your custom reimplementation, that the upstream library doesn't have.
- More than ~50 lines of pure number-theory code in `src/lib/` that doesn't reference `xen-dev-utils` or `sonic-weave`.

**Phase to address:**
**Phase 1 (kernel)** — establish the wrap-don't-reimplement discipline at the start. Add `INVENTORY.md` as a kernel deliverable.

---

### Pitfall 6: `.scl` Format Edge Cases (Cents vs. Ratio Detection)

**What goes wrong:**
The Scala `.scl` format's cents-vs-ratio rule is: **a row contains a period (`.`) → it's cents; otherwise it's a ratio.** Naïve parsers miss cases:
- `"100."` (trailing-dot float) is **cents**, not a malformed ratio.
- `".5"` (leading-dot float) is **cents** (0.5¢), not a malformed ratio.
- `"2"` (bare integer) is the ratio `2/1`, NOT 2 cents.
- `"100.0 cents"` — anything after a valid pitch value is ignored (comments allowed).
- `"100,0"` (European decimal comma) — should fail; the spec uses period only.
- The first note `1/1` (or `0.0` cents) is **implicit and not in the file** — your scale has N+1 degrees if you count the implicit unison.
- Negative ratios are illegal (should error).
- Ratios may have only one `/`; `"2/3/4"` is illegal.
- Comment lines start with `!`; the second non-comment line is the description; the third non-comment line is the pitch count. Many parsers miscount because they ignore comments inconsistently.
- Some files have CRLF vs LF line endings, BOMs, or trailing whitespace per row.
- Numerators/denominators must be supported to at least 2^31−1 = 2,147,483,647. With `Fraction` (BigInt) you exceed this — but the spec floor is 32-bit, not 64-bit; don't assume foreign producers wrote arbitrary-precision values.

**Why it happens:**
- "It's a small format, I'll just split lines" — true until you hit the period-detection rule and the implicit-1/1 rule.
- Naïve regex `^\d+\/\d+$` misses bare-integer ratios.
- Forgetting `1/1` is implicit means your scale displays N degrees but the file has N−1 lines.

**How to avoid:**
- **Write to the spec, with cited test fixtures.** Use the official Huygens-Fokker spec as the contract. Build a test corpus from the actual Scala archive (~4000 files); golden-test parse-then-serialize round-trip on a sample of 100+.
- **Detect cents by `value.includes('.')`**, not by `parseFloat` succeeding (every numeric string parses).
- **Parse rows as `{kind: 'ratio' | 'cents', value: ...}` first; convert to `Interval` second.** Keeps the parser simple and the test surface small.
- **Always insert the implicit `1/1`** at scale degree 0 unless the file explicitly starts with it (it shouldn't, per spec — defensive).
- **Reject negative ratios, multi-slash ratios, and pitch-count mismatches** with clear error messages.
- Reference Scale Workshop's parser (MIT-licensed) when in doubt.

**Warning signs:**
- A `.scl` file from the Scala archive imports with N intervals when it should have N+1 (or vice versa).
- A file with `100.` in it parses as the ratio `100/1` (huge interval, no error).
- Round-trip parse → serialize → parse is not idempotent.
- A file with `!` comment lines miscounts pitches.

**Phase to address:**
**Phase 1 (kernel)** — `src/lib/scala.ts` is in the kernel and needs a robust test corpus from day one. Defer KBM I/O if necessary, but `.scl` parse + serialize round-trip must be solid.

---

### Pitfall 7: `.kbm` Reference-Frequency Confusion

**What goes wrong:**
`.kbm` keyboard mapping has three reference parameters that are easy to conflate:
- **Reference key** (MIDI note number, e.g., 69 = A4): which key the reference frequency applies to.
- **Reference frequency** (Hz, e.g., 440.0): the frequency that key sounds at.
- **Middle note / "key for 1/1"** (MIDI note number, e.g., 60 = C4): which key the scale's first degree (1/1) maps to.

The scale's `1/1` is **NOT** automatically the reference frequency. If middle note = 60 and reference = (69, 440), then 1/1 sounds at 440 / (frequency-ratio-of-degree-9). This is correct and intentional — it lets you tune the keyboard to A=440 while still having 1/1 land on C — but it's the source of frequent "why is my C wrong?" bugs.

Other `.kbm` subtleties:
- **Formal octave degree** (the scale degree treated as the period) is independent of the scale's actual period. If you set formal octave = 7 on an 8-degree scale, the keyboard repeats every 7 degrees, not 8.
- **Map size** can be smaller than the number of scale degrees (some degrees unmapped) or larger than (the period repeats within the map).
- **Key range** (first/last MIDI notes to retune) is independent of the map; outside that range, MIDI notes pass through untuned.
- A key mapped to a negative or "x" entry is **muted** — pressing it produces no sound.

The user-side confusion: "Does 1/1 = A4 = 440? = 256? user-set?" — the answer is **always user-set in the `.kbm`**, but 90% of the time the assumption is "1/1 = C4 = 261.63 Hz" which is what most synths default to.

**Why it happens:**
- The three parameters look similar (all are "where does the tuning anchor?") but answer different questions.
- Documentation across synths is inconsistent.
- Developers test with `1/1 → A4 → 440` and never exercise the other case.

**How to avoid:**
- **Make the model explicit.** The `KbmMapping` type has three named fields (`referenceKey`, `referenceHz`, `middleNote`) — never a single `baseHz`.
- **A function `kbmToFrequencies(scale, kbm): Map<midiNote, Hz>`** does the math once; tests cover the three-way case (middle ≠ reference).
- **Include a v1 page** that demonstrates a `.kbm` where 1/1 ≠ reference key, to catch your own bugs.
- **Default carefully.** When the user specifies `baseHz` for a page without a `.kbm`, document explicitly that this means "1/1 sounds at this frequency" — i.e., middle = reference, both at MIDI note `n` (your choice), Hz = `baseHz`.

**Warning signs:**
- Code path that assumes `referenceHz` IS the frequency of `1/1`.
- A test that only covers middle = reference (or only the `1/1 = A4 = 440` case).
- User confusion: "Why is the audio half a step off?" usually means middle/reference are swapped.

**Phase to address:**
**Phase 2 (Scala export)** at earliest, possibly Phase 3 — KBM is more complex than SCL and lower priority. Until then, document the implicit assumption (`1/1 = baseHz` directly) explicitly.

---

### Pitfall 8: Click/Pop on Note Start/Stop

**What goes wrong:**
A bare `OscillatorNode.start()` followed by `.stop()` produces an audible click at both ends — the waveform jumps from zero to full amplitude (and back) instantaneously. For microtonal music where the user is auditioning subtle interval differences, the clicks are louder than the intervals themselves. Worse, fast arpeggios (clicking `playScale` repeatedly) compound clicks into a buzz that masks the actual tuning.

A subtler variant: ADSR envelope where the attack ramp hasn't completed before the release ramp starts (high tempo, short notes). The release jumps from a partial value back down to zero — audible discontinuity.

**Why it happens:**
- Default `OscillatorNode` has no envelope; it's a raw waveform.
- "Just gain.value = 0; gain.value = 1;" is the obvious approach — and it clicks every time.
- `gain.setValueAtTime` doesn't smooth; it jumps. You need `gain.linearRampToValueAtTime` or `gain.setTargetAtTime`.
- Fast notes hit the envelope-overlap edge case.

**How to avoid:**
- **Always envelope the gain.** Minimum: 5–10ms linear attack ramp, 20–50ms release ramp. `sw-synth` handles this internally — use it; don't write raw oscillators.
- **Cancel scheduled values before re-scheduling.** When a note starts during another note's release, `gain.cancelScheduledValues(t); gain.setValueAtTime(currentValue, t); gain.linearRampToValueAtTime(0, t + releaseTime);` — never just overwrite.
- **Keep one voice per note ID**, so re-triggering a note properly releases the previous instance.
- **Test with a short percussive sound** (50ms note) — if it clicks, fix the envelope.
- **Test fast arpeggios** (notes every 100ms) — if it buzzes, the release time is too short or overlap handling is wrong.

**Warning signs:**
- Single isolated note has an audible "tick" at start or end.
- Repeated clicks on the same `playInterval` button cause increasing buzz.
- User reports "audio is glitchy" but spectrogram shows the underlying waveform is correct.

**Phase to address:**
**Phase 1 (audio integration)** — verify `sw-synth`'s default envelopes are gentle enough; if not, override at synth wrapper construction (`src/audio/envelopes.ts`).

---

### Pitfall 9: Polyphony Explosion / Voices Never Released

**What goes wrong:**
A drone-on-1/1 button starts a sustained note; clicking it again starts another voice on top of the first. Click ten times → ten stacked drones, each louder than necessary. Or: a `playScale` arpeggiates 12 notes, none of which are explicitly stopped, and they all sustain past the next user action. CPU climbs, audio distorts (clipping), eventually the browser tab freezes.

A subtler case: `OscillatorNode` instances created but not explicitly `.disconnect()`-ed leak references; with `Infinity` sustain (drone), the GC can't reclaim them.

**Why it happens:**
- `sw-synth` (and Web Audio in general) doesn't auto-cap voices — it spawns whatever you ask for.
- "Toggle drone" UX requires tracking the active voice ID; it's easy to start without tracking.
- Long arpeggios with `noteOn(hz, t, Infinity)` and no corresponding `noteOff` leak forever.

**How to avoid:**
- **Drone toggles are explicit toggles, not "click to start":** `let droneStop: (() => void) | null = null; btn.onclick = () => { if (droneStop) { droneStop(); droneStop = null; } else { droneStop = synth.startDrone(hz); } };`
- **Set a per-page max voice count** in the synth wrapper (e.g., 16); when exceeded, oldest voice is force-stopped (voice stealing).
- **Always pass finite duration** to `noteOn` unless explicitly building a drone; default to 2 seconds.
- **Master-gain limiter:** wire a `DynamicsCompressorNode` between the synth output and `ctx.destination` so accidental over-polyphony is loud-but-not-painful, not clipping.
- **Dev counter:** synth wrapper exposes `synth.activeVoices` for debugging; log if it ever exceeds expected.

**Warning signs:**
- "Stop" button on a drone doesn't actually stop the drone (because each click started a new one).
- After playing the composition page for a few minutes, audio crackles or distorts.
- DevTools Performance tab shows CPU climbing during audio playback.
- `synth.activeVoices` grows monotonically.

**Phase to address:**
**Phase 1 (audio kernel)** — bake voice management into the synth wrapper. Costly to retrofit later because every component has to learn to track voice IDs.

---

### Pitfall 10: Mobile Safari / Cross-Browser Web Audio Quirks

**What goes wrong:**
Page works in desktop Chrome. Open on iPhone Safari: silence, no errors. Specific Safari quirks:
- `AudioContext` must be `resume()`-d **inside the same task as the user gesture**. A gesture handler that does `await someThing(); ctx.resume()` may fail because the gesture token is consumed by the time `ctx.resume()` runs.
- iOS hardware mute switch silences `AudioContext` output even at full volume — the page works but the user hears nothing.
- Older iOS (pre-14.5) used `webkitAudioContext` instead of `AudioContext`. By 2026 this is largely irrelevant, but `sw-synth` and your wrapper should still detect-and-fall-back.
- Background tabs may suspend `AudioContext` aggressively on mobile; resuming on focus requires explicit handling.
- Safari's sample rate may be 48000 even when other browsers report 44100 — frequency calculations in Hz are unaffected (good), but if you ever load samples (`AudioBufferSourceNode`), you must resample.

**Why it happens:**
- Spec compliance varies; Safari is conservative.
- Mobile constraints (battery, attention) trigger more aggressive suspension.
- iOS hardware mute switch behavior is a long-standing complaint with no good workaround.

**How to avoid:**
- **Test on iPhone Safari at the end of every milestone.** Don't defer until launch.
- **Handle `ctx.resume()` synchronously in the click handler.** No `await` between the gesture and the resume.
- **Detect `webkitAudioContext`:** `const Ctx = window.AudioContext || window.webkitAudioContext;`
- **Add a `visibilitychange` listener** to resume the context on tab focus (or pause/dispose on hide).
- **Document the iOS mute-switch behavior** in a help tooltip on audio buttons — "If you hear nothing, check your iPhone's silent switch."

**Warning signs:**
- Works on desktop, silent on iPhone.
- Works in foreground, silent after backgrounding the tab.
- Different intervals sound at slightly different perceived volumes (sample-rate-dependent gain glitches).

**Phase to address:**
**Phase 2** — once the basic audio works in desktop Chrome (Phase 1), explicitly test mobile Safari before declaring audio "done."

---

### Pitfall 11: Reactive Cell Ordering and Stale References

**What goes wrong:**
Observable Framework's reactivity model walks top-level `const`/`let` declarations in a page; when one updates, downstream consumers re-run. Two failure modes:
- **Implicit ordering breakage:** Cell A defines `scale`. Cell B uses `scale`. Move Cell B above Cell A in Markdown — Framework still figures it out (the dependency graph is by name, not file position). But move A to a different page entirely, or rename it, and B silently breaks.
- **Stale references in event handlers:** A button's `onclick` closes over `scale`. The cell re-runs (e.g., user edited the scale text), `scale` is rebound to a new value, but the OLD button still in the DOM has the OLD closure. Click → plays the old scale.
- **Naming collisions:** Top-level `const scale` in two cells (or a cell + an import) — undefined behavior; one wins; downstream cells use the winner.

**Why it happens:**
- Framework's reactivity is implicit (declaration-by-name), not explicit (signals/refs).
- Closures over reactive variables look correct but capture the value at definition time.
- Markdown cell layout doesn't enforce dependency order visually.

**How to avoid:**
- **One declaration per name per page.** Convention: top-level `const`s are unique. Use lowercase descriptive names (`pieceScale`, `editedScale`, `currentScale`) — never one-letter names; never the same name as a kernel export.
- **Components re-render on state change.** Don't keep stale DOM nodes; render fresh inside the cell that depends on the state. `display(playInterval(scale.intervals[2], synth))` works because the cell re-runs and `display` replaces the node.
- **Event handlers in re-rendered components naturally close over the current value** — because the component is re-created. This is the right pattern.
- **Avoid cell-spanning closures.** If a button needs to access `scale`, define the button in the same cell that defines `scale`, not in a different cell.
- **Lint for shadowing:** add an ESLint rule for top-level identifier reuse across all `.md` files (custom plugin or grep).

**Warning signs:**
- A button on the page does the wrong thing after editing an input — but reloading fixes it.
- "It's correct in the cell but the inline interpolation shows the old value" — inline `${expr}` re-runs reactively; if it doesn't, the dependency was named wrong.
- Two pages with the same cell variable name behave inconsistently.

**Phase to address:**
**Phase 1 (page authoring conventions)** — establish naming conventions and "one declaration per name" discipline. Document in a `CONVENTIONS.md` for the project.

---

### Pitfall 12: TypeScript That Doesn't Type-Check (Framework's Transparent Transpile)

**What goes wrong:**
Observable Framework transpiles `.ts` files via esbuild, which **does not type-check**. Code with type errors compiles successfully; the page runs; the bug surfaces later as a runtime exception (or, worse, silently wrong behavior). Example: `monzo: number[]` somewhere, when it should be `bigint[]` — esbuild strips types, runtime mixes Number and BigInt, you get `TypeError: Cannot mix BigInt and other types` deep inside a calculation.

**Why it happens:**
- Speed of iteration; `tsc` is slower than esbuild.
- Easy to forget that "the page renders" isn't the same as "the types check."
- New contributors (or future-you) write `.ts` and assume errors will surface.

**How to avoid:**
- **Run `tsc --noEmit` as a separate script** (`"lint:types": "tsc --noEmit"`) and **in CI on every push**.
- **Pre-commit hook (optional):** run `tsc --noEmit` before allowing commit. Fast enough on a small kernel.
- **Strict TypeScript config:** `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`. Catches the most common bugs.
- **Don't merge anything that fails `tsc --noEmit`.** If CI is red, fix or revert.
- **Document this in README:** "Framework does not type-check. Run `npm run lint:types` before committing."

**Warning signs:**
- A runtime `TypeError` for something the IDE flagged as a type error days ago.
- `npm run lint:types` has never been run.
- IDE shows red squiggles but `observable preview` runs fine.

**Phase to address:**
**Phase 0 (project setup)** — wire up `tsc --noEmit` script + CI before any kernel code is written. Cheap to set up; expensive to retrofit after type-debt accumulates.

---

### Pitfall 13: Octave-Equivalence Handling (When to Reduce, When Not To)

**What goes wrong:**
"Octave-equivalence" means treating intervals 2/1 apart as the same pitch class — a 5/4 and a 5/2 are both "the major third." Many JI operations want octave-reduced intervals; many do not. Confusing the two creates subtle bugs:
- **Always-reducing accidentally:** A scale-builder helper auto-reduces every interval to `[1, 2)`. User passes `2/1` (the period itself); it gets reduced to `1/1` and disappears.
- **Never-reducing accidentally:** Multiplying intervals to chain a generator (e.g., 7 fifths up = `(3/2)^7 = 2187/128`) keeps growing without reduction; the cents value rockets past 5000¢; the user expected a roughly-octave-bounded tritone.
- **Reducing in the wrong direction:** `octaveReduce` should produce a result in `[1, 2)`, but for inverse intervals (`<1`), naïve `n % 2` gives wrong answers; you need `while (frac < 1) frac.mul(2); while (frac >= 2) frac.div(2);`.
- **Period ≠ 2/1:** Bohlen-Pierce uses 3/1 as the period. A reducer hardcoded to 2/1 mangles BP scales.

**Why it happens:**
- The mental model of "pitch class vs pitch" is implicit in human music theory; making it explicit in code requires discipline.
- `Fraction` doesn't have a built-in `octaveReduce`; you write it once and copy-paste subtly different versions.
- Period parameterization is often forgotten until BP or other non-octave scales come up.

**How to avoid:**
- **`Interval.octaveReduce(period: Interval = TWO_ONE): Interval`** — explicit param, default to octave, never hardcoded.
- **`Scale` has a `period: Interval` field** (default `2/1`); all reduction operations use it.
- **Distinguish `reduce()` (in-place mathematical reduction) from `dedupe()` (pitch-class deduplication).** Different operations.
- **Test with non-octave periods.** A Bohlen-Pierce test scale catches hardcoded `2`s.
- **Function naming convention:** functions that reduce say so in their name (`reduceToOctave`, `chainOfFifthsReduced`). Functions that don't reduce explicitly don't (`raiseByGenerator`).

**Warning signs:**
- A test passes for a 7-note JI scale but fails for Bohlen-Pierce.
- `2/1` becomes `1/1` after going through your scale builder.
- Cents values for chained generators exceed 1200¢ silently.
- A scale degree displays as "10/4" instead of "5/2" or "5/4."

**Phase to address:**
**Phase 1 (kernel)** — `Interval.octaveReduce()` and `Scale.reduce()` need test coverage with both 2/1 and non-octave periods.

---

### Pitfall 14: Monzo Edge Cases (Negative Exponents, Prime 2, Length Mismatches)

**What goes wrong:**
A monzo is a vector of prime exponents: `5/4 = [-2, 0, 1]` (i.e., `2^-2 * 3^0 * 5^1`). Failure modes:
- **Length mismatch arithmetic:** Adding `[-2, 0, 1]` (5-limit) and `[1, 0, 0, -1]` (7-limit) — naïve element-wise add truncates to the shorter length. Need to **pad to the longer length** before arithmetic.
- **Prime 2 special-cased wrong:** Tenney height `Σ |e_i| * log2(p_i)` includes prime 2, but when computing odd-limit you exclude prime 2 (because odd-limit ignores octave equivalence). Forgetting this swap gives wrong answers.
- **Negative exponents on non-2 primes:** `4/3 = [2, -1]` — that −1 on prime 3 is correct, but a `Math.log2(prime) * exponent` calculation needs to handle negative exponents; some hand-written sieves silently treat negatives as zero.
- **Inverting a monzo:** `inv()` negates every exponent. Forgetting this gives the wrong octave complement.
- **Monzo from large fractions:** Factorizing `2147483648/2147483647` (large prime denominator) can be slow with naïve trial division. Use `xen-dev-utils` or sieve-based factorization.

**Why it happens:**
- Monzos are dense and the conventions are easy to misread.
- Padding is implicit math, easy to forget in code.
- `xen-dev-utils` handles all this; reimplementing introduces errors.

**How to avoid:**
- **Use `xen-dev-utils` `toMonzo`/`fromMonzo` and arithmetic helpers.** They handle padding and prime 2 correctly.
- **`monzoLengthMatch(a, b): [bigint[], bigint[]]`** as a utility — pads both to the longer length with zeros. Use before any arithmetic.
- **Test with monzos of different lengths.** Specifically: 5-limit ⊕ 7-limit, 3-limit ⊕ 11-limit.
- **Test prime 2 specifically.** Tenney height of `2/1` is `log2(2) = 1`, not zero. Odd-limit of `2/1` is 1, not 2.
- **Test inversion.** `inv(2/1) = 1/2`, monzo `[1] → [-1]`.

**Warning signs:**
- Tenney height of a 5-limit interval differs from the same interval expressed as 7-limit (zero in slot 4) — should be identical.
- Odd-limit returns 2 for the unison.
- `octaveComplement(3/2)` returns something other than `4/3`.
- Monzo factorization of a large prime takes longer than parsing the file.

**Phase to address:**
**Phase 1 (kernel)** — `src/lib/monzo.ts` test coverage. Use `xen-dev-utils` and only wrap; don't reimplement.

---

### Pitfall 15: "Scale" vs "Tuning" vs "Mode" Conflated

**What goes wrong:**
Three concepts that compose differently:
- **Scale:** an ordered set of intervals from `1/1`, e.g., `[1/1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]`. Period-bounded. No frequency.
- **Tuning:** a scale plus a base frequency, e.g., the above scale with `1/1 = 261.625 Hz`. Now each degree has a Hz value.
- **Mode:** a rotation of a scale, e.g., starting from degree 2: `[1/1, 10/9, 32/27, 4/3, 40/27, 5/3, 16/9, 2/1]` (Dorian-like rotation of the major). Reorders intervals; same pitch set but different "1/1."

If you conflate these in the API — e.g., `Scale` carries a `baseHz` field, or `playInterval` takes a `Mode` — every operation has to remember to handle the missing or extra concept. Refactoring is expensive.

**Why it happens:**
- In casual usage these words are used interchangeably ("the major scale," "the C major tuning").
- It's tempting to fold `baseHz` into `Scale` because it's always needed at audio playback.
- Mode rotation is rarely needed early; when it shows up, it doesn't fit the existing types.

**How to avoid:**
- **Keep them separate types from Phase 1.** `Scale` has no Hz. `Tuning = { scale: Scale; baseHz: number; reference: { degree: number; midiNote?: number } }` — explicit binding. `Mode` is a function: `mode(scale: Scale, rotation: number): Scale`.
- **Audio takes a `Tuning`, not a `Scale`.** `playArpeggio(tuning, fromDegree, toDegree)`.
- **The composition module exports a `Tuning`,** not a `Scale` and a stray `baseHz`. Single object.
- **Document the distinction** in the `Interval` JSDoc: "Pure interval; no frequency. For frequency assignment, see `Tuning`."

**Warning signs:**
- A function takes `(scale, baseHz)` as two parameters everywhere.
- `Scale.transpose(by)` does what feels like a mode rotation.
- Mode-related questions show up in user-facing widgets and don't have a place in the kernel.

**Phase to address:**
**Phase 1 (kernel design)** — get the type vocabulary right at the start. Cheaper to design than to refactor.

---

### Pitfall 16: Sub-Cent Precision Confusion

**What goes wrong:**
The just-noticeable difference (JND) for pitch is typically ~6¢ for sustained tones, less in some contexts. Yet:
- The **schisma is 1.95¢** — inaudible in most contexts. If a calculator says "your interval matches the schisma to 0.01¢," that doesn't mean anything perceptually.
- A **sub-cent display** of "408.005¢" implies a precision the user cannot hear.
- Conversely, **rounding too aggressively** ("close enough at 1¢") merges intervals that ARE distinct in some contexts (e.g., the Pythagorean comma, 23.46¢, vs. the syntonic comma, 21.51¢ — only ~2¢ apart but musically distinct).

The pitfall is **mismatching display precision to perceptual relevance** in either direction.

**Why it happens:**
- It's tempting to display all the digits because "more is more accurate."
- It's also tempting to round to integer cents because "humans can't hear the difference."
- Both miss the point: the cents value is a derived display projection, but its precision should communicate something honest about the interval's identity.

**How to avoid:**
- **Display cents to one decimal place (0.1¢) by default.** Enough resolution to distinguish syntonic from Pythagorean comma; not so much it implies false precision.
- **For comma identification, match by exact monzo, not by cents.** The display can show "21.5¢ — syntonic comma" but the identification logic doesn't depend on the float.
- **Document precision conventions** in a `CONVENTIONS.md`: "Cents displayed to 0.1¢; matching is structural, not numerical."
- **Acknowledge audibility.** A help tooltip on cents-deviation columns: "Differences below ~6¢ are typically inaudible in sustained pitches."

**Warning signs:**
- The UI shows "408.005¢."
- Comma identification rounds and gets a false positive (schisma ≈ Pythagorean comma).
- A user asks "is this audible?" and the page can't answer.

**Phase to address:**
**Phase 2 (UI polish)** — once the kernel is correct, the display layer needs to communicate uncertainty honestly.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing scales as `number[]` of cents in a quick page | "I just want to see the chart" | Round-trip loss; cannot derive monzo or comma identification | **Never in `src/lib/`.** Acceptable in a one-off scratch cell that doesn't escape the page. |
| Hardcoding the composition's ratios in a Markdown cell | Fast experimentation | Drift between pages; refactor pain | **Only during exploration**, then immediately refactor to `src/lib/pieces/<piece>.ts` once the scale stabilizes. |
| Writing your own monzo factorization "for fun" | Learning experience | Subtle bugs; reinventing `xen-dev-utils` | Acceptable in a separate research notebook page (as a documented exercise); not in the kernel. |
| Skipping `tsc --noEmit` "because the page renders" | Faster iteration | Type errors surface as runtime bugs days later | **Never long-term.** Acceptable for a 30-minute spike; run before committing. |
| Single shared synth across all pages (top-level singleton) | Less per-page boilerplate | Cross-page lifecycle bugs; AudioContext leaks; impossible to dispose | **Never.** Always factory-per-page. |
| Top-level `new AudioContext()` in a module | "It's just initialization" | Browser autoplay blocks; suspended state; silent failures | **Never.** Always create lazily inside a user-gesture handler. |
| Inline event handlers that close over reactive variables | "It works in this cell" | Stale closures after re-render | Acceptable when the closure variable is itself stable (e.g., `synth`, which lives in its own cell and doesn't depend on the volatile state). |
| Using the latest version of every npm package on every install | Bleeding-edge features | Surprise breakage; peer-dep mismatches | **Pin major versions.** Use `^` for minor/patch. Lock with `package-lock.json`. |
| Letting visualization grow before kernel is solid | Demos look good early | Beautiful broken thing | **Never.** Phase ordering: kernel → audio → I/O → viz. |
| Skipping iPhone Safari testing until "the end" | Faster desktop iteration | Find out audio doesn't work on mobile after months of work | **Never.** Test mobile each milestone. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `xen-dev-utils` | Importing `Fraction` from `fraction.js` directly in some files and via `xen-dev-utils` re-export in others — version drift | Pin `fraction.js` explicitly; import from one place project-wide. |
| `sw-synth` | Treating it as a high-level synth (effects, sequencing); reaching for missing features | `sw-synth` is intentionally minimal. If you need effects, sequencer, transport — switch to or add Tone.js. |
| `temperaments` (last released Mar 2024, depends on older `xen-dev-utils@^0.2.7`) | Installing alongside `xen-dev-utils@0.13` and assuming it works | Pin both packages tightly OR vendor the specific functions you need OR fork. Verify peer-dep alignment before depending on it for a milestone. |
| `ji-lattice` | Rendering its output directly with no styling — looks like a debug graph | `ji-lattice` returns coordinates; you wrap with D3 styling, hover tooltips, zoom/pan. It's a layout library, not a renderer. |
| Scala `.scl` archive (Huygens-Fokker) | Importing the whole archive eagerly into a `FileAttachment` JSON | Build-time loader with chunking by prime-limit OR by name-prefix. Don't ship 4MB on first page load. |
| `@observablehq/plot` | Trying to do interactive lattice / force layout with Plot | Plot is for declarative grammar-of-graphics charts. For lattices, drop down to D3. |
| `@observablehq/framework` deploy command | Using `observable deploy` to push to Observable Cloud | **Deprecated** as of v1.13.3 (Apr 2025). Use `observable build` and host static output (GitHub Pages, S3, Cloudflare Pages). |
| TypeScript imports | Writing `import { Interval } from "./interval"` (no extension) | Framework convention requires `.js` extension even for `.ts` source: `import { Interval } from "./interval.js"`. Transpiler resolves correctly. |
| `FileAttachment` in `src/lib/` | Importing `FileAttachment` into a pure lib module | `FileAttachment` is a Framework runtime concept; only valid in cells. Pass loaded data INTO lib functions; don't load INSIDE them. |
| Web MIDI (future) | Assuming pitch-bend resolution is universal | MTS-ESP and multi-channel pitch-bend have different precision floors per device. If/when MIDI returns to scope, audit per-device. |

## Performance Traps

For a single-user research notebook, "scale" mostly means content scale (more pages, bigger lookups), not user load.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading the entire Scala archive into the browser | Slow first paint on any page | Build-time data loader with per-prime-limit chunking; lazy-load via `FileAttachment` | When archive grows past ~1MB total |
| Recomputing a lattice on every cell re-run | Janky pan/zoom; CPU spikes during edits | Memoize lattice coords; recompute only when `scale` actually changes (not when an unrelated cell updates) | 50+ nodes / 5+ primes |
| Synchronous large-monzo factorization on user input | Input feels laggy | Debounce input; compute in a Web Worker for big factorizations; use `xen-dev-utils` (optimized) | Numerator/denominator > 10⁹ |
| Polyphony unbounded | Audio crackles, browser freezes | Per-page voice cap; voice stealing; finite-duration default | More than ~20 simultaneous voices |
| Cell re-runs cascading through unrelated cells | Edit anything → whole page re-renders | Top-level cells declare narrowly; avoid umbrella cells that import everything | Page has more than ~20 reactive cells |
| Build time growing with data loaders | `npm run build` takes minutes | Loaders cache outputs (Framework supports this); split slow loaders into shards | More than ~10 data loaders, or a loader doing >1s of work |
| KaTeX rendering all math on first paint | Slow page load on heavy theory pages | Lazy-render math inside viewport (intersection observer) OR pre-render at build time | Page has more than ~50 math expressions |

## Security Mistakes

This is a personal static site with no backend, no user input persisted server-side, no authentication. Most web-app security concerns don't apply. The few that do:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Loading user-pasted `.scl` content via `eval` or `Function()` to "parse" it | Code injection if the site is ever shared publicly | Always parse `.scl` as a string, never `eval`. The format is small; a hand-written parser is safer than any clever shortcut. |
| URL hash for scale state, then `eval`ing it | Code injection from a shared link | Encode/decode hash as text; parse with the same parser as `.scl`. Never trust hash content as code. |
| Importing `.scl` files dragged-and-dropped without size limits | Browser tab crash from a malicious or malformed huge file | Cap file size at 1MB; cap pitch count at 1024; reject and message clearly. |
| Embedding a third-party microtonal-tool plugin via `<script src="...">` | Supply-chain attack on your notes | Don't embed third-party scripts. Vendor what you need; depend only on npm packages from the xenharmonic-devs org or other known-good sources. |
| Hosting publicly on a custom domain without subresource integrity | Risk of CDN compromise affecting your readers | Use SRI (`integrity="sha384-..."`) on any externally-hosted CSS/JS (KaTeX CDN, etc.) OR self-host. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sub-cent precision in displayed values ("408.005¢") | Implies false precision; user can't act on it | Display cents to 0.1¢; explain in tooltip that JND is ~6¢. |
| Audio button without obvious "stop all" | User accidentally starts a drone, can't find how to stop it | Page-level "Stop all audio" button; Esc keyboard shortcut; auto-stop on page nav. |
| Comma identification with a wide tolerance ("matches the syntonic to within 5¢") | False positives for near-commas (schisma vs. syntonic) | Match by canonical monzo, not by cents tolerance. Show "exact match" or "no match." |
| `1/1` reference frequency hidden in a config menu | User confused why intervals sound at unexpected pitches | Show the reference frequency prominently on every audio-enabled page. Make it user-adjustable inline. |
| `.scl` export button without preview | User downloads a file, opens in Scala, finds it's wrong | Show the `.scl` text in a `<pre>` block before download; user can verify or copy-paste. |
| Lattice with no legend / axis labels | User sees pretty graph, can't read it | Always label the basis vectors (e.g., "→ +log(3)", "↑ +log(5)"); legend explains color encoding. |
| Cents-from-12tet displayed without sign | User can't tell if their interval is sharp or flat of equal temperament | Always include `+`/`−` sign; consider `±` formatting. |
| Mode rotation without showing the new "1/1" | User doesn't realize the rotation changed which degree is the tonic | Annotate explicitly: "Mode 3 of [scale]: 1/1 was originally 9/8 of the parent." |
| Inline play-buttons that look like ordinary text | User doesn't realize they can interact | Distinct button styling — small, but unmistakably clickable (border, hover state). |
| Audio that starts at a high default volume | User opens page, blasted by drone | Master gain default ≤ 0.2; volume slider visible per page. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **`Interval` class:** Verify monzo round-trip — `fromMonzo(toMonzo(fraction))` returns equal `Fraction` for a sample of complex ratios (`81/79`, `2147483647/2`, etc.).
- [ ] **`Interval.octaveReduce`:** Verify with non-octave period (Bohlen-Pierce, period = `3/1`).
- [ ] **Monzo arithmetic:** Verify mixed-length monzos compose correctly (5-limit ⊕ 11-limit).
- [ ] **`.scl` parser:** Round-trip parse → serialize → parse on 50+ samples from the Huygens-Fokker archive.
- [ ] **`.scl` parser:** Handles `100.` (trailing-dot cents), `.5` (leading-dot cents), `2` (bare integer ratio), comments (`!`), implicit `1/1`.
- [ ] **`.kbm` parser:** Handles `referenceKey ≠ middleNote`; verify a non-trivial mapping where 1/1 ≠ reference frequency.
- [ ] **Comma identification:** Distinguishes schisma (1.95¢) from syntonic comma (21.51¢) — match by monzo, not cents.
- [ ] **Audio: single-note click test:** Play 50ms note in isolation — no audible click at start or end.
- [ ] **Audio: arpeggio click test:** Play 12-note arpeggio at 100ms/note — no buzz, no compounding clicks.
- [ ] **Audio: drone toggle test:** Click drone button 10 times — only one voice ever active; clicking again stops it.
- [ ] **Audio: AudioContext leak test:** Edit a cell 20 times in `observable preview` — `AudioContext` count in DevTools stays at 1.
- [ ] **Audio: page nav cleanup test:** Navigate away from an audio page — `AudioContext` closed, no orphan oscillators.
- [ ] **Audio: mobile Safari test:** Page works on iPhone Safari with sound (not just visually).
- [ ] **Audio: hardware mute switch:** Page documents that iOS mute switch silences audio.
- [ ] **TypeScript: `tsc --noEmit` passes:** Zero errors. Run in CI.
- [ ] **Composition module sanity:** Vitest test asserts piece's scale length, first/last intervals, base Hz.
- [ ] **Composition page end-to-end:** Open page, see scale table, hear an interval, export `.scl`, re-import the export — round-trip works.
- [ ] **Cents display:** Defaults to 0.1¢ precision; tooltip explains JND.
- [ ] **Reference frequency:** Visible on every audio-enabled page; user can change it inline.
- [ ] **Stop-all-audio:** Page-level escape hatch button; Esc key works.
- [ ] **`xen-dev-utils` inventory:** `INVENTORY.md` lists which kernel functions delegate to xen-dev-utils vs. custom — and why.
- [ ] **Build artifact size:** Static site `dist/` under 5MB total.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Floating-point cents leaked into kernel | HIGH | Audit all `lib/` function signatures for `cents: number`; replace with `Interval`. Re-test every comma identification. |
| AudioContext leaks in production | MEDIUM | Add `invalidation` cleanup to every synth-owning cell. Force a full page reload as a temporary workaround. |
| Composition drifted from kernel | HIGH | Inventory all literal `new Interval("...")` in pages; consolidate into `src/lib/pieces/<piece>.ts`. Add CI test asserting no inline ratios in pages. |
| Visualization ate Phase 1 | MEDIUM | Freeze viz at current state; defer further polish to a later phase; ship kernel + audio + I/O. |
| Reinvented `xen-dev-utils` primitive with a bug | LOW | Replace with `xen-dev-utils` import; add `INVENTORY.md` entry. Update tests. |
| `.scl` parser misses an edge case | LOW | Add the failing fixture to the test corpus; fix the parser; re-run round-trip tests on entire archive sample. |
| `.kbm` reference confusion shipped | MEDIUM | Add explicit `KbmMapping` type with three named fields; refactor consumers; add a test exercising middle ≠ reference. |
| Click/pop in audio | LOW | Verify `sw-synth` envelope params; override `attack` / `release` in synth wrapper; re-test. |
| Polyphony explosion | LOW | Add per-page voice cap to synth wrapper; convert `Infinity` durations to bounded; add `synth.activeVoices` debug counter. |
| Mobile Safari audio dead | MEDIUM | Audit gesture handler for synchronous `ctx.resume()`; detect `webkitAudioContext`; add `visibilitychange` resume; test on device. |
| Stale closures in cell event handlers | LOW | Move event-handler-defining code into the same cell as the closed-over state; verify re-renders happen. |
| TypeScript drift (no type-check) | LOW–MEDIUM | Run `tsc --noEmit` once; fix all errors; wire into CI; document in README. Cost depends on accumulated debt. |
| Octave-reduction wrong for non-octave periods | LOW | Add `period: Interval` parameter to `octaveReduce`; default to `2/1`; test with Bohlen-Pierce. |
| Monzo length-mismatch arithmetic bug | LOW | Add padding helper; add tests for mixed-length monzos. |
| Sub-cent precision shipped | LOW | Change formatter to one decimal place; tooltip about JND. |
| Scala `.scl` parsed silently wrong | MEDIUM | Validate against canonical archive; add round-trip CI test on 50+ files. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls. (Phase numbers are conventional placeholders — actual phase numbering is the roadmap's job.)

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Floating-point cents in kernel | **Phase 1 (kernel design)** | `tsc --noEmit` + Vitest test that no `lib/` function takes `cents: number` (other than `fromCents`). |
| AudioContext lifecycle leaks | **Phase 1 (audio kernel)** | Manual test: 20 cell edits in preview, count contexts. |
| Composition drifts from toolkit | **Every phase** | CI test: piece module imports correctly; no inline ratios in pages. |
| Visualization eats project | **Phase 1 ordering** | Phase 1 success criteria explicitly defer lattice/diamond. |
| Reinventing `xen-dev-utils` | **Phase 1** | `INVENTORY.md` exists and is updated per-PR. |
| `.scl` format edge cases | **Phase 1 (Scala I/O)** | Round-trip test on 50+ archive samples. |
| `.kbm` reference confusion | **Phase 2 (Scala export+)** | Explicit `KbmMapping` type; test with middle ≠ reference. |
| Click/pop audio | **Phase 1 (audio)** | 50ms note isolation test; arpeggio test. |
| Polyphony explosion | **Phase 1 (audio)** | `synth.activeVoices` counter; per-page cap. |
| Mobile Safari quirks | **Phase 2 (mobile audit)** | Manual iPhone Safari test at every milestone. |
| Reactive cell ordering / stale closures | **Phase 1 (page conventions)** | `CONVENTIONS.md` + naming discipline. |
| TypeScript not type-checked | **Phase 0 (project setup)** | `tsc --noEmit` in CI from day one. |
| Octave-reduction with non-2 periods | **Phase 1 (kernel)** | Bohlen-Pierce test. |
| Monzo edge cases | **Phase 1 (kernel)** | Mixed-length test; prime 2 test; inversion test. |
| Scale/Tuning/Mode conflation | **Phase 1 (type design)** | Distinct types; `Tuning` not `Scale + baseHz`. |
| Sub-cent display precision | **Phase 2 (UI polish)** | Default 0.1¢; tooltip about JND. |

## Sources

- [Scala scale file (.scl) format spec — Huygens-Fokker](https://www.huygens-fokker.org/scala/scl_format.html) — HIGH (canonical spec)
- [Scala and Custom Tuning Reference — RNBO / Cycling '74](https://rnbo.cycling74.com/learn/scala-and-custom-tuning-reference) — HIGH (.scl + .kbm semantics)
- [Mapping microtonal scales to a MIDI keyboard in Scala — Sevish](https://sevish.com/2017/mapping-microtonal-scales-keyboard-scala/) — MEDIUM (.kbm middle/reference subtleties)
- [Limit (music) — Microtonal Encyclopedia](https://microtonal.miraheze.org/wiki/Limit_(music)) — HIGH (prime/odd/integer limit distinctions)
- [Odd limit — Xenharmonic Wiki](https://en.xen.wiki/w/Odd_limit) — HIGH (odd-limit definition + voicing independence)
- [Comma (music) — Wikipedia](https://en.wikipedia.org/wiki/Comma_(music)) — HIGH (schisma, syntonic, Pythagorean, kleisma)
- [Syntonic comma — Wikipedia](https://en.wikipedia.org/wiki/Syntonic_comma) — HIGH
- [Web Audio API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — HIGH (autoplay, AudioContext lifecycle)
- [Envelope Scheduling Issue — WebAudio/web-audio-api #510](https://github.com/WebAudio/web-audio-api/issues/510) — HIGH (click/pop on overlapping envelopes)
- [Envelopes — Computer Music Primer](https://dobrian.github.io/cmp/topics/building-a-synthesizer-with-web-audio-api/4.envelopes.html) — MEDIUM (ADSR + smoothing)
- [Observable Framework — Reactivity](https://observablehq.com/framework/reactivity) — HIGH (reactive cell semantics)
- [Project STACK.md](.planning/research/STACK.md) — HIGH (xenharmonic-devs ecosystem facts)
- [Project ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) — HIGH (audio lifecycle pattern, kernel boundaries, anti-patterns)
- [Scale Workshop GitHub](https://github.com/xenharmonic-devs/scale-workshop) — HIGH (production reference for the same ecosystem)
- Personal experience / known issues — MEDIUM (project-shape pitfalls; judgment about composition-vs-toolkit drift)

---
*Pitfalls research for: Tuning Systems — Observable Framework site for JI calculator + tuning research notes*
*Researched: 2026-05-02*
