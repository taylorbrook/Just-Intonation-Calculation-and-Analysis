/**
 * Cell-owned synth lifecycle wrapper around `sw-synth` (ARCHITECTURE Pattern 4).
 *
 * Lazy AudioContext: the AudioContext is NOT created at module load time and NOT
 * created at `createSynth()` call time — it is created on the first `playNote` /
 * `playArpeggio` / `startDrone` call. This satisfies the browser user-gesture
 * requirement and prevents AudioContext leaks under hot-reload (Pitfall #2).
 *
 * Voice tracking: every `noteOn` returns a `noteOff` callback (sw-synth contract).
 * For one-shot notes we wrap that release in a setTimeout-based timer; for drones
 * we return the release callback to the caller. `activeVoices` is a live counter
 * exposed for tests + dev assertions (Pitfall #2 leak-counter pattern).
 *
 * Dispose is TERMINAL: after `dispose()`, all method calls are no-ops. The cell
 * pattern (`createSynth()` inside its own cell, `invalidation.then(synth.dispose)`)
 * ensures a fresh handle is created on cell re-evaluation.
 *
 * Three-layer discipline: this module MAY import from `sw-synth`; it MUST NOT
 * import from `src/lib/` (math kernel) or `src/components/` (UI). Audio operates
 * on `number` Hz values; ratio→Hz projection happens at the call site.
 */

// `npm:` prefix routes through Framework's jsDelivr resolver, bypassing Node's
// CJS loader. sw-synth@0.4.0 ships `"type": "module"` without an `"exports"`
// field — Node's loader throws ERR_PACKAGE_PATH_NOT_EXPORTED when Framework's
// build resolver tries to require.resolve() it. The vitest config aliases
// `npm:sw-synth` back to the local install so unit tests still resolve.
// (Plan 07 deviation — Rule 3 blocking issue.)
import { Synth as SwSynth, defaultParams, type OscillatorVoiceParams } from "npm:sw-synth";
// QUICK-TUX-01 — shared constants + pure helpers for the site-wide audio toolbar.
// audio-prefs.ts is the ONE allowed shared dependency between src/audio/ and
// src/components/ (impl-note A option b) — it has no runtime side effects.
import {
  AUDIO_PREFS_EVENT,
  ALLOWED_WAVEFORMS,
  readAudioPrefs,
  type AudioPrefs,
} from "./audio-prefs.js";

// ----- Public surface (PATTERNS lines 313-329) -----

export interface SynthHandle {
  /** Play a single note for `dur` seconds. Returns a noteOff callback. */
  playNote(hz: number, dur?: number): () => void;
  /** Play a chord (simultaneous). */
  playNotes(freqs: number[], dur?: number): void;
  /** Play arpeggio with `stepSec` between note onsets. */
  playArpeggio(freqs: number[], stepSec?: number): void;
  /** Start a sustained drone. Returns a stop callback. */
  startDrone(hz: number): () => void;
  /** Stop everything immediately. */
  panic(): void;
  /** Number of currently-playing voices (for dev assertions). */
  readonly activeVoices: number;
  /** Tear down the AudioContext and all voices. Terminal. */
  dispose(): void;
  /**
   * Switch the oscillator waveform on subsequently-triggered voices. QUICK-TUX-01.
   * Rejects anything not in `ALLOWED_WAVEFORMS` (defense in depth — e.g. "custom"
   * is silently dropped with a console.warn). No-op after dispose. Existing held
   * voices keep their old timbre (impl-note E — matches drone-retune behavior).
   */
  setVoiceType(type: OscillatorType): void;
  /**
   * Set the master gain in [0, 1]. QUICK-TUX-01. Non-finite values are rejected
   * with a console.warn; out-of-range values are clamped. Post-ensure calls ramp
   * via `setTargetAtTime(g, currentTime, 0.02)` to avoid clicks; pre-ensure calls
   * stash the value and apply it as the initial `master.gain.value` (no ramp).
   * No-op after dispose.
   */
  setMaster(gain: number): void;
}

export interface CreateSynthOpts {
  master?: number;
  maxPolyphony?: number;
  voiceParams?: Partial<OscillatorVoiceParams>;
}

// ----- Constants -----

const DEFAULT_NOTE_DUR = 1.5; // D-18
const DEFAULT_ARP_STEP = 0.45; // D-18
const ARP_NOTE_RATIO = 0.95; // D-18: noteLen = stepSec * 0.95

// Defense-in-depth bounds (threat model — T-02-17, T-02-18, T-02-19).
const MIN_HZ = 20;
const MAX_HZ = 20_000;
const MIN_POLYPHONY = 1;
const MAX_POLYPHONY = 64;
const MAX_ARPEGGIO_LEN = 256;

// D-16 ADSR defaults — no clicks/pops.
const D16_ATTACK = 0.005;
const D16_DECAY = 0.03;
const D16_SUSTAIN = 0.7;
const D16_RELEASE = 0.15;

const isPlayableHz = (hz: number): boolean => Number.isFinite(hz) && hz >= MIN_HZ && hz <= MAX_HZ;

const clampPolyphony = (n: number): number => {
  if (!Number.isFinite(n)) return 16;
  return Math.min(MAX_POLYPHONY, Math.max(MIN_POLYPHONY, Math.floor(n)));
};

// AUDIO-06 / Pitfall #7 — Audio Session API for iOS hardware-mute bypass.
// Safari 16.4+ on iOS/macOS; Chrome/Firefox have no support (feature-detected).
type WithAudioSession = Navigator & {
  audioSession?: {
    type: "auto" | "playback" | "transient" | "transient-solo" | "ambient" | "play-and-record";
  };
};

// Resolve the AudioContext constructor at call time.
// In production: `window.AudioContext` (or `webkitAudioContext` for older Safari).
// In tests: globalThis.window is mocked with an `AudioContext` constructor stub.
type AnyCtxCtor = new (options?: AudioContextOptions) => AudioContext;

const resolveAudioCtxCtor = (): AnyCtxCtor | null => {
  const win = (
    globalThis as unknown as {
      window?: {
        AudioContext?: AnyCtxCtor;
        webkitAudioContext?: AnyCtxCtor;
      };
    }
  ).window;
  if (win?.AudioContext) return win.AudioContext;
  if (win?.webkitAudioContext) return win.webkitAudioContext;
  const direct = (globalThis as unknown as { AudioContext?: AnyCtxCtor }).AudioContext;
  return direct ?? null;
};

export function createSynth(opts: CreateSynthOpts = {}): SynthHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let synth: SwSynth | null = null;
  let activeVoices = 0;
  let disposed = false;
  let arpeggioTruncationWarned = false;
  // AUDIO-06 / Pitfall #9 — visibilitychange listener handle, bound at most once
  // per createSynth lifetime by `bindVisibilityListener`, removed by `dispose`.
  let onVisibility: (() => void) | null = null;
  // QUICK-TUX-01 — site-wide audio-prefs subscription. Listener handle is bound
  // ONCE at construction (end of createSynth, after `handle` is built) and removed
  // in dispose(). Mirrors Pitfall #11 listener-leak shape.
  let onPrefsChange: ((e: Event) => void) | null = null;
  // QUICK-TUX-01 — read persisted prefs at construction (D-2). Falls back to
  // defaults if localStorage is missing / unparseable / has out-of-range fields.
  const initialPrefs: AudioPrefs = readAudioPrefs();
  // QUICK-TUX-01 — pending state for setVoiceType / setMaster calls that arrive
  // BEFORE the lazy `ensure()` has constructed `ctx`/`synth`/`master`. The first
  // ensure() flushes these into the live nodes; subsequent calls land directly
  // on the live nodes (with `setTargetAtTime` ramp for master.gain).
  let pendingVoiceType: OscillatorType | null = null;
  let pendingMaster: number | null = null;
  // CR-02 fix: track per-note arpeggio setTimeout handles so panic() and
  // dispose() can cancel pending notes. Without this, Esc / Stop has no
  // effect on a running arpeggio — the queued notes continue to fire on
  // cadence even after allNotesOff() silenced the currently-sounding voice.
  // Set growth is bounded by the existing MAX_ARPEGGIO_LEN=256 cap.
  const arpTimers = new Set<ReturnType<typeof setTimeout>>();

  /**
   * AUDIO-06 / Pitfall #7 — feature-detected iOS Audio Session "playback" type.
   * Bypasses the hardware silent switch on iOS 16.4+ Safari. No-op on browsers
   * without `navigator.audioSession`. The single insertion point for any
   * `audioSession` reference in this module.
   */
  const setAudioSessionPlayback = (): void => {
    const nav = (globalThis as unknown as { navigator?: WithAudioSession }).navigator;
    if (nav?.audioSession) {
      try {
        nav.audioSession.type = "playback";
      } catch {
        // swallow — could be read-only or unsupported in some implementation; non-fatal
      }
    }
  };

  /**
   * AUDIO-06 / Pitfall #9 — bind a `visibilitychange` listener that resumes the
   * AudioContext when the tab regains focus. Idempotent (binds at most once per
   * createSynth lifetime). Cleaned up in `dispose()`.
   *
   * The listener captures `ctx` lexically and uses the LATEST reference at fire
   * time, not at bind time — so even if `ensure()` re-runs, the same listener
   * remains valid.
   */
  const bindVisibilityListener = (): void => {
    if (onVisibility) return; // bind at most once per createSynth lifetime
    const doc = (globalThis as unknown as { document?: Document }).document;
    if (!doc) return; // node test env without DOM — no-op
    onVisibility = (): void => {
      if (disposed || !ctx) return;
      if (doc.visibilityState === "visible" && ctx.state === "suspended") {
        void ctx.resume();
      }
    };
    doc.addEventListener("visibilitychange", onVisibility);
  };

  /**
   * Lazy AudioContext + Synth construction.
   * Returns true if synth+ctx are ready, false otherwise (disposed, or no Web Audio
   * available in this environment).
   */
  const ensure = (): boolean => {
    if (disposed) return false;
    if (ctx && synth) {
      // Already initialised — but the context may have been suspended (e.g.
      // tab backgrounded). Resume synchronously here so the user-gesture frame
      // is preserved (Pitfall #8). Fire-and-forget; do NOT await.
      if (ctx.state === "suspended") void ctx.resume();
      return true;
    }
    const Ctx = resolveAudioCtxCtor();
    if (!Ctx) return false;
    ctx = new Ctx({ latencyHint: "interactive" });
    // AUDIO-06 / Pitfall #7 — iOS 16.4+ hardware-mute-switch bypass.
    setAudioSessionPlayback();
    // AUDIO-06 / Pitfall #8 — synchronous fire-and-forget resume so the FIRST
    // user-gesture invocation unlocks the context. NO await between gesture
    // and this call.
    if (ctx.state === "suspended") void ctx.resume();
    master = ctx.createGain();
    // QUICK-TUX-01 — initial master gain prefers explicit opts → persisted pref
    // → 0.2 default. opts.master wins if the caller is supplying their own.
    master.gain.value = opts.master ?? initialPrefs.volume;
    master.connect(ctx.destination);
    synth = new SwSynth(ctx, master);
    synth.maxPolyphony = clampPolyphony(opts.maxPolyphony ?? 16);
    synth.voiceParams = {
      ...defaultParams(),
      attackTime: D16_ATTACK,
      decayTime: D16_DECAY,
      sustainLevel: D16_SUSTAIN,
      releaseTime: D16_RELEASE,
      ...opts.voiceParams,
      // QUICK-TUX-01 — waveform from opts wins, else persisted pref, else
      // defaultParams() default. The spread of opts.voiceParams above may have
      // set .type, so we honor that first; only fall back to initialPrefs.waveform
      // when opts.voiceParams did not provide a type.
      type: opts.voiceParams?.type ?? initialPrefs.waveform,
    };
    // QUICK-TUX-01 — flush pending setVoiceType / setMaster calls that arrived
    // before ensure() constructed the live nodes. Pre-ensure setMaster uses
    // direct .value assignment (not ramp) per impl-note E — the AudioContext
    // is brand-new and there are no held voices to click against.
    if (pendingMaster !== null) {
      master.gain.value = pendingMaster;
      pendingMaster = null;
    }
    if (pendingVoiceType !== null) {
      synth.voiceParams = {
        ...synth.voiceParams,
        type: pendingVoiceType,
      } as OscillatorVoiceParams;
      pendingVoiceType = null;
    }
    // AUDIO-06 / Pitfall #9 — bind visibilitychange AFTER ctx is ready so the
    // listener can safely read ctx.state when it fires.
    bindVisibilityListener();
    return true;
  };

  /**
   * Internal one-shot note. Returns a release callback that cancels the
   * pending timer and triggers the underlying noteOff. Idempotent.
   */
  const playNoteImpl = (hz: number, dur: number): (() => void) => {
    if (!isPlayableHz(hz)) return () => {};
    if (!ensure() || !synth) return () => {};
    const off = synth.noteOn(hz, 0.7);
    activeVoices++;
    let released = false;
    const release = (): void => {
      if (released) return;
      released = true;
      off();
      activeVoices = Math.max(0, activeVoices - 1);
    };
    const timer: ReturnType<typeof setTimeout> = setTimeout(release, dur * 1000);
    return () => {
      clearTimeout(timer);
      release();
    };
  };

  const handle: SynthHandle = {
    playNote(hz, dur = DEFAULT_NOTE_DUR) {
      if (disposed) return () => {};
      return playNoteImpl(hz, dur);
    },

    playNotes(freqs, dur = DEFAULT_NOTE_DUR) {
      if (disposed) return;
      if (!ensure()) return;
      for (const hz of freqs) playNoteImpl(hz, dur);
    },

    playArpeggio(freqs, stepSec = DEFAULT_ARP_STEP) {
      if (disposed) return;
      if (!ensure()) return;
      let scheduled = freqs;
      if (scheduled.length > MAX_ARPEGGIO_LEN) {
        scheduled = scheduled.slice(0, MAX_ARPEGGIO_LEN);
        if (!arpeggioTruncationWarned) {
          arpeggioTruncationWarned = true;
          console.warn(
            `[audio/synth] arpeggio truncated to ${MAX_ARPEGGIO_LEN} notes ` +
              `(input length ${freqs.length}); subsequent oversize calls will not warn again.`,
          );
        }
      }
      const noteLen = stepSec * ARP_NOTE_RATIO;
      scheduled.forEach((hz, i) => {
        if (i === 0) {
          playNoteImpl(hz, noteLen);
        } else {
          // CR-02 fix: capture the timer handle, register it in arpTimers
          // so panic() / dispose() can cancel; self-remove on fire so the
          // Set does not retain handles for already-fired notes.
          const t: ReturnType<typeof setTimeout> = setTimeout(
            () => {
              arpTimers.delete(t);
              playNoteImpl(hz, noteLen);
            },
            i * stepSec * 1000,
          );
          arpTimers.add(t);
        }
      });
    },

    startDrone(hz) {
      if (disposed) return () => {};
      if (!isPlayableHz(hz)) return () => {};
      if (!ensure() || !synth) return () => {};
      const off = synth.noteOn(hz, 0.5);
      activeVoices++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        off();
        activeVoices = Math.max(0, activeVoices - 1);
      };
    },

    panic() {
      if (disposed) return;
      // CR-02 fix: cancel pending arpeggio notes BEFORE silencing the
      // currently-sounding voice. Otherwise Esc / Stop only kills the
      // active note while queued setTimeout calls keep firing.
      for (const t of arpTimers) clearTimeout(t);
      arpTimers.clear();
      if (synth) synth.allNotesOff();
      activeVoices = 0;
    },

    get activeVoices() {
      return activeVoices;
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      // CR-02 fix: clear pending arpeggio timers so closures (each capturing
      // hz, noteLen, ctx, synth, etc.) do not stay alive in the timer queue
      // after dispose. Prevents up to ~115s of held closures for a 256-note
      // arpeggio at 0.45s/step. T-3-10 leak shape on the audio side.
      for (const t of arpTimers) clearTimeout(t);
      arpTimers.clear();
      // AUDIO-06 / Pitfall #9 — remove the visibilitychange listener BEFORE the
      // teardown so a late-firing event cannot reference `ctx` while we're
      // tearing down. Idempotent via the null-check + null-assignment.
      if (onVisibility) {
        const doc = (globalThis as unknown as { document?: Document }).document;
        doc?.removeEventListener("visibilitychange", onVisibility);
        onVisibility = null;
      }
      // QUICK-TUX-01 / T-tux-04 — remove the audio-prefs window listener with
      // the SAME function reference passed to addEventListener. Otherwise
      // removeEventListener silently does nothing and the listener leaks across
      // hot-reload.
      if (onPrefsChange) {
        const win = (globalThis as unknown as { window?: Window }).window;
        win?.removeEventListener(AUDIO_PREFS_EVENT, onPrefsChange);
        onPrefsChange = null;
      }
      try {
        synth?.allNotesOff();
      } catch {
        /* swallow — dispose is terminal */
      }
      try {
        master?.disconnect();
      } catch {
        /* swallow */
      }
      ctx?.close().catch(() => {});
      ctx = null;
      master = null;
      synth = null;
      activeVoices = 0;
    },

    setVoiceType(type) {
      if (disposed) return;
      // T-tux-06 — allowlist re-validation prevents "custom" from being
      // smuggled past the toolbar (which only emits the four basic shapes).
      if (!(ALLOWED_WAVEFORMS as readonly string[]).includes(type)) {
        console.warn("[audio/synth] rejected non-allowlisted waveform:", type);
        return;
      }
      if (synth) {
        // Existing held voices keep their old timbre (impl-note E — acceptable;
        // matches drone-retune behavior). Only subsequently-triggered voices
        // pick up the new type. Cast is required because tsc's
        // exactOptionalPropertyTypes treats the spread as having all-optional
        // fields, but OscillatorVoiceParams.audioDelay is required — the source
        // object always carries it via defaultParams() in ensure().
        synth.voiceParams = {
          ...synth.voiceParams,
          type,
        } as OscillatorVoiceParams;
      } else {
        pendingVoiceType = type;
      }
    },

    setMaster(gain) {
      if (disposed) return;
      // T-tux-07 — reject NaN / Infinity / non-numeric.
      if (!Number.isFinite(gain)) {
        console.warn("[audio/synth] rejected non-finite master gain:", gain);
        return;
      }
      const g = Math.min(1, Math.max(0, gain));
      if (master && ctx) {
        // Ramp via setTargetAtTime to avoid clicks (impl-note E).
        master.gain.setTargetAtTime(g, ctx.currentTime, 0.02);
      } else {
        pendingMaster = g;
      }
    },
  };

  // QUICK-TUX-01 — register the audio-prefs CustomEvent listener AFTER `handle`
  // is built (the handler delegates to handle.setVoiceType / handle.setMaster
  // for defense-in-depth allowlist + clamp). Use globalThis.window defensively
  // so jsdom / Node test environments resolve the same way the browser does.
  const win = (
    globalThis as unknown as {
      window?: {
        addEventListener?: (
          type: string,
          listener: (e: Event) => void,
          options?: AddEventListenerOptions,
        ) => void;
      };
    }
  ).window;
  if (win?.addEventListener) {
    onPrefsChange = (e: Event): void => {
      const detail = (e as CustomEvent<Partial<AudioPrefs>>).detail;
      if (!detail || typeof detail !== "object") return;
      // setVoiceType / setMaster do their own allowlist + finite check —
      // we forward optimistically. The forwarded calls are silently no-op'd
      // for invalid input (with a console.warn) so the handler stays trivial.
      if (typeof detail.waveform === "string") {
        handle.setVoiceType(detail.waveform as OscillatorType);
      }
      if (typeof detail.volume === "number") {
        handle.setMaster(detail.volume);
      }
    };
    win.addEventListener(AUDIO_PREFS_EVENT, onPrefsChange);
  }

  return handle;
}
