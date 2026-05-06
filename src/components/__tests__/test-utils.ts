/**
 * test-utils.ts — shared test helpers for src/components/ DOM smoke tests.
 *
 * makeStubSynth() returns a SynthHandle with every method as vi.fn(). Components
 * use SynthHandle as an interface (D-08); they never construct AudioContexts
 * (Pitfall #2). Tests pass this stub to verify call shape without booting audio.
 */
import { vi } from "vitest";
import type { SynthHandle } from "../../audio/synth.js";

export interface StubSynthHandle extends SynthHandle {
  playNote: ReturnType<typeof vi.fn>;
  playNotes: ReturnType<typeof vi.fn>;
  playArpeggio: ReturnType<typeof vi.fn>;
  startDrone: ReturnType<typeof vi.fn>;
  panic: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

export function makeStubSynth(): StubSynthHandle {
  const playNote = vi.fn(() => () => {});
  const playNotes = vi.fn();
  const playArpeggio = vi.fn();
  const startDrone = vi.fn(() => () => {});
  const panic = vi.fn();
  const dispose = vi.fn();
  return {
    playNote,
    playNotes,
    playArpeggio,
    startDrone,
    panic,
    get activeVoices() {
      return 0;
    },
    dispose,
  };
}
