import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------- Mock sw-synth ----------
//
// We model a single underlying Synth instance that the wrapper constructs.
// `noteOn` returns a fresh `noteOff` mock per call so we can inspect calls.

interface MockVoiceParams {
  type: OscillatorType;
  audioDelay: number;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
}

interface MockSynthInstance {
  maxPolyphony: number;
  voiceParams: MockVoiceParams | undefined;
  noteOn: ReturnType<typeof vi.fn>;
  allNotesOff: ReturnType<typeof vi.fn>;
}

const mockSynthInstance: MockSynthInstance = {
  maxPolyphony: 0,
  voiceParams: undefined,
  noteOn: vi.fn(() => vi.fn()),
  allNotesOff: vi.fn(),
};

const mockSynthCtor = vi.fn(() => mockSynthInstance);

// Mock both the bare specifier (post-vitest-alias) and the npm: form (pre-alias)
// so the mock catches whichever one the resolver resolves first. Plan 07 changed
// synth.ts from `from "sw-synth"` to `from "npm:sw-synth"` to avoid Framework's
// build-time ERR_PACKAGE_PATH_NOT_EXPORTED on sw-synth@0.4.0; the vitest alias in
// vitest.config.ts maps `npm:sw-synth` → `sw-synth`, but vi.mock is hoisted by
// vitest to the top of the file (before any non-vi declarations) so we duplicate
// the inline factory rather than referencing a shared `const`.
vi.mock("sw-synth", () => ({
  Synth: mockSynthCtor,
  defaultParams: (): MockVoiceParams => ({
    type: "sine",
    audioDelay: 0,
    attackTime: 0.01,
    decayTime: 0.05,
    sustainLevel: 0.5,
    releaseTime: 0.5,
  }),
}));
vi.mock("npm:sw-synth", () => ({
  Synth: mockSynthCtor,
  defaultParams: (): MockVoiceParams => ({
    type: "sine",
    audioDelay: 0,
    attackTime: 0.01,
    decayTime: 0.05,
    sustainLevel: 0.5,
    releaseTime: 0.5,
  }),
}));

// ---------- Mock AudioContext (Node has no Web Audio) ----------

interface MockGainNode {
  gain: { value: number };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

const mockGainNode: MockGainNode = {
  gain: { value: 0 },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockAudioContext = {
  createGain: vi.fn(() => mockGainNode),
  destination: {} as AudioDestinationNode,
  close: vi.fn(() => Promise.resolve()),
  currentTime: 0,
  latencyHint: "interactive" as AudioContextLatencyCategory,
};

const mockCtxCtor = vi.fn(() => mockAudioContext);

// Install on globalThis.window so the lookup `window.AudioContext` resolves.
(globalThis as unknown as { window: { AudioContext: typeof AudioContext } }).window = {
  AudioContext: mockCtxCtor as unknown as typeof AudioContext,
};

// Now import the module under test (after mocks installed).
const { createSynth } = await import("../synth.js");

beforeEach(() => {
  mockCtxCtor.mockClear();
  mockSynthCtor.mockClear();
  mockSynthInstance.noteOn.mockClear();
  mockSynthInstance.noteOn.mockImplementation(() => vi.fn());
  mockSynthInstance.allNotesOff.mockClear();
  mockSynthInstance.maxPolyphony = 0;
  mockSynthInstance.voiceParams = undefined;
  mockGainNode.connect.mockClear();
  mockGainNode.disconnect.mockClear();
  mockGainNode.gain.value = 0;
  mockAudioContext.close.mockClear();
});

// =============================================================
// AUDIO-01 — Lazy AudioContext / Pitfall #2
// =============================================================
describe("createSynth — lazy AudioContext (AUDIO-01 / Pitfall #2)", () => {
  it("does not create AudioContext until first method call", () => {
    const synth = createSynth();
    expect(mockCtxCtor).not.toHaveBeenCalled();
    expect(mockSynthCtor).not.toHaveBeenCalled();
    synth.dispose();
  });

  it("creates AudioContext exactly once across multiple playNote calls", () => {
    const synth = createSynth();
    synth.playNote(440, 0.1);
    synth.playNote(660, 0.1);
    expect(mockCtxCtor).toHaveBeenCalledTimes(1);
    synth.dispose();
  });
});

// =============================================================
// AUDIO-02 — ADSR defaults (D-16)
// =============================================================
describe("createSynth — ADSR defaults (D-16 / AUDIO-02)", () => {
  it("sets D-16 ADSR values", () => {
    const synth = createSynth();
    synth.playNote(440, 0.1);
    expect(mockSynthInstance.voiceParams).toBeDefined();
    expect(mockSynthInstance.voiceParams!.attackTime).toBe(0.005);
    expect(mockSynthInstance.voiceParams!.decayTime).toBe(0.03);
    expect(mockSynthInstance.voiceParams!.sustainLevel).toBe(0.7);
    expect(mockSynthInstance.voiceParams!.releaseTime).toBe(0.15);
    synth.dispose();
  });

  it("respects partial voiceParams override (attackTime only)", () => {
    const synth = createSynth({ voiceParams: { attackTime: 0.02 } });
    synth.playNote(440, 0.1);
    expect(mockSynthInstance.voiceParams!.attackTime).toBe(0.02);
    expect(mockSynthInstance.voiceParams!.decayTime).toBe(0.03);
    expect(mockSynthInstance.voiceParams!.sustainLevel).toBe(0.7);
    expect(mockSynthInstance.voiceParams!.releaseTime).toBe(0.15);
    synth.dispose();
  });
});

// =============================================================
// AUDIO-05 — Polyphony cap (D-17)
// =============================================================
describe("createSynth — polyphony cap (D-17 / AUDIO-05)", () => {
  it("defaults maxPolyphony to 16", () => {
    const synth = createSynth();
    synth.playNote(440, 0.1);
    expect(mockSynthInstance.maxPolyphony).toBe(16);
    synth.dispose();
  });

  it("respects custom maxPolyphony", () => {
    const synth = createSynth({ maxPolyphony: 8 });
    synth.playNote(440, 0.1);
    expect(mockSynthInstance.maxPolyphony).toBe(8);
    synth.dispose();
  });

  it("clamps absurd maxPolyphony values to a sane upper bound (T-02-19)", () => {
    const synth = createSynth({ maxPolyphony: 1_000_000 });
    synth.playNote(440, 0.1);
    expect(mockSynthInstance.maxPolyphony).toBeLessThanOrEqual(64);
    synth.dispose();
  });

  it("clamps absurdly low maxPolyphony to at least 1", () => {
    const synth = createSynth({ maxPolyphony: 0 });
    synth.playNote(440, 0.1);
    expect(mockSynthInstance.maxPolyphony).toBeGreaterThanOrEqual(1);
    synth.dispose();
  });
});

// =============================================================
// Voice tracking + activeVoices counter (AUDIO-05)
// =============================================================
describe("createSynth — voice tracking (AUDIO-05)", () => {
  it("playNote returns a callable noteOff", () => {
    const synth = createSynth();
    const off = synth.playNote(440, 1.0);
    expect(typeof off).toBe("function");
    synth.dispose();
  });

  it("activeVoices increments on play and decrements when timer fires", () => {
    vi.useFakeTimers();
    const synth = createSynth();
    synth.playNote(440, 1.0);
    expect(synth.activeVoices).toBe(1);
    synth.playNote(660, 1.0);
    expect(synth.activeVoices).toBe(2);
    vi.advanceTimersByTime(1500);
    expect(synth.activeVoices).toBe(0);
    vi.useRealTimers();
    synth.dispose();
  });

  it("calling the returned noteOff invokes underlying noteOff and decrements activeVoices", () => {
    const releaseSpy = vi.fn();
    mockSynthInstance.noteOn.mockImplementationOnce(() => releaseSpy);
    const synth = createSynth();
    const off = synth.playNote(440, 100); // long timer
    expect(synth.activeVoices).toBe(1);
    off();
    expect(releaseSpy).toHaveBeenCalledTimes(1);
    expect(synth.activeVoices).toBe(0);
    synth.dispose();
  });

  it("panic clears activeVoices and invokes underlying allNotesOff", () => {
    const synth = createSynth();
    synth.playNote(440, 5.0);
    synth.playNote(660, 5.0);
    synth.panic();
    expect(synth.activeVoices).toBe(0);
    expect(mockSynthInstance.allNotesOff).toHaveBeenCalledTimes(1);
    synth.dispose();
  });
});

// =============================================================
// AUDIO-03 — playArpeggio
// =============================================================
describe("createSynth — playArpeggio (AUDIO-03)", () => {
  it("schedules notes at stepSec intervals", () => {
    vi.useFakeTimers();
    const synth = createSynth();
    synth.playArpeggio([440, 550, 660], 0.5);
    expect(mockSynthInstance.noteOn).toHaveBeenCalledTimes(1); // first immediate
    vi.advanceTimersByTime(500);
    expect(mockSynthInstance.noteOn).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(500);
    expect(mockSynthInstance.noteOn).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
    synth.dispose();
  });

  it("uses the default arp step of 0.45s when omitted (D-18)", () => {
    vi.useFakeTimers();
    const synth = createSynth();
    synth.playArpeggio([440, 550]);
    expect(mockSynthInstance.noteOn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(449);
    expect(mockSynthInstance.noteOn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2);
    expect(mockSynthInstance.noteOn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    synth.dispose();
  });

  it("truncates arpeggios longer than the safety cap (T-02-18)", () => {
    vi.useFakeTimers();
    const synth = createSynth();
    const huge = new Array(10_000).fill(440) as number[];
    synth.playArpeggio(huge, 0.001);
    // Advance long enough for any reasonable cap (256 * 1ms = 256ms)
    vi.advanceTimersByTime(10_000);
    expect(mockSynthInstance.noteOn.mock.calls.length).toBeLessThanOrEqual(256);
    vi.useRealTimers();
    synth.dispose();
  });
});

// =============================================================
// AUDIO-04 — startDrone
// =============================================================
describe("createSynth — startDrone (AUDIO-04)", () => {
  it("returns a stop function that decrements activeVoices and calls noteOff", () => {
    const releaseSpy = vi.fn();
    mockSynthInstance.noteOn.mockImplementationOnce(() => releaseSpy);
    const synth = createSynth();
    const stop = synth.startDrone(440);
    expect(synth.activeVoices).toBe(1);
    stop();
    expect(releaseSpy).toHaveBeenCalledTimes(1);
    expect(synth.activeVoices).toBe(0);
    synth.dispose();
  });

  it("calling stop() twice is idempotent (does not double-decrement)", () => {
    const synth = createSynth();
    const stop = synth.startDrone(440);
    expect(synth.activeVoices).toBe(1);
    stop();
    stop();
    expect(synth.activeVoices).toBe(0);
    synth.dispose();
  });
});

// =============================================================
// Dispose (AUDIO-01)
// =============================================================
describe("createSynth — dispose (AUDIO-01)", () => {
  it("closes AudioContext, disconnects master gain, and stops voices", () => {
    const synth = createSynth();
    synth.playNote(440, 0.1);
    synth.dispose();
    expect(mockSynthInstance.allNotesOff).toHaveBeenCalled();
    expect(mockGainNode.disconnect).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it("post-dispose method calls are no-ops (do not create a new AudioContext)", () => {
    const synth = createSynth();
    synth.playNote(440, 0.1);
    synth.dispose();
    const before = mockCtxCtor.mock.calls.length;
    synth.playNote(440, 0.1);
    synth.playArpeggio([440, 550]);
    synth.startDrone(440);
    expect(mockCtxCtor.mock.calls.length).toBe(before);
  });

  it("calling dispose() twice is idempotent", () => {
    const synth = createSynth();
    synth.playNote(440, 0.1);
    synth.dispose();
    expect(() => {
      synth.dispose();
    }).not.toThrow();
  });
});

// =============================================================
// Defense-in-depth — Hz clamps (T-02-17)
// =============================================================
describe("createSynth — Hz clamps (T-02-17)", () => {
  it("rejects NaN frequencies (no noteOn call, no voice counted)", () => {
    const synth = createSynth();
    synth.playNote(NaN, 1.0);
    expect(mockSynthInstance.noteOn).not.toHaveBeenCalled();
    expect(synth.activeVoices).toBe(0);
    synth.dispose();
  });

  it("rejects Infinity frequencies", () => {
    const synth = createSynth();
    synth.playNote(Infinity, 1.0);
    expect(mockSynthInstance.noteOn).not.toHaveBeenCalled();
    expect(synth.activeVoices).toBe(0);
    synth.dispose();
  });

  it("rejects sub-audible (< 20 Hz) and super-audible (> 20000 Hz) frequencies", () => {
    const synth = createSynth();
    synth.playNote(10, 1.0);
    synth.playNote(40_000, 1.0);
    expect(mockSynthInstance.noteOn).not.toHaveBeenCalled();
    synth.dispose();
  });

  it("rejects bad Hz in startDrone too", () => {
    const synth = createSynth();
    const stop = synth.startDrone(NaN);
    expect(mockSynthInstance.noteOn).not.toHaveBeenCalled();
    expect(synth.activeVoices).toBe(0);
    expect(typeof stop).toBe("function");
    stop(); // should not throw
    synth.dispose();
  });
});
