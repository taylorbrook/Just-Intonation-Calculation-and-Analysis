import { describe, it, expect } from "vitest";
import {
  NOTE_NAMES,
  A4_MIDI,
  DEFAULT_A4_HZ,
  noteToMidi,
  midiToHz,
  noteToHz,
  formatNoteName,
} from "../pitch.js";
import type { NoteName } from "../pitch.js";

describe("NOTE_NAMES", () => {
  it("has exactly 12 entries in C-first chromatic order", () => {
    expect(NOTE_NAMES.length).toBe(12);
    expect(NOTE_NAMES[0]).toBe("C");
    expect(NOTE_NAMES[9]).toBe("A");
  });

  it("exposes the A4 anchor constants", () => {
    expect(A4_MIDI).toBe(69);
    expect(DEFAULT_A4_HZ).toBe(440);
  });
});

describe("noteToMidi — scientific pitch notation (C4 = 60, A4 = 69)", () => {
  it("maps C4 to 60", () => {
    expect(noteToMidi("C", 4)).toBe(60);
  });

  it("maps A4 to 69", () => {
    expect(noteToMidi("A", 4)).toBe(69);
  });

  it("maps C-1 to 0 (the bottom of the MIDI range)", () => {
    expect(noteToMidi("C", -1)).toBe(0);
  });

  it("maps B4 to 71", () => {
    expect(noteToMidi("B", 4)).toBe(71);
  });

  it("throws RangeError for a name outside NOTE_NAMES", () => {
    expect(() => noteToMidi("H" as NoteName, 4)).toThrow(RangeError);
    expect(() => noteToMidi("Db" as NoteName, 4)).toThrow(RangeError);
  });

  it("throws RangeError for a non-integer or non-finite octave", () => {
    expect(() => noteToMidi("C", 4.5)).toThrow(RangeError);
    expect(() => noteToMidi("C", NaN)).toThrow(RangeError);
    expect(() => noteToMidi("C", Infinity)).toThrow(RangeError);
  });
});

describe("midiToHz — whole-octave offsets stay bit-exact", () => {
  it("midiToHz(69) is exactly 440", () => {
    expect(midiToHz(69)).toBe(440);
  });

  it("midiToHz(57) is exactly 220 (A3)", () => {
    expect(midiToHz(57)).toBe(220);
  });

  it("midiToHz(81) is exactly 880 (A5)", () => {
    expect(midiToHz(81)).toBe(880);
  });

  it("midiToHz(60) is ~261.6255653005986 (C4)", () => {
    expect(midiToHz(60)).toBeCloseTo(261.6255653005986, 12);
  });

  it("honors the a4Hz calibration knob", () => {
    expect(midiToHz(69, 432)).toBe(432);
    expect(midiToHz(57, 432)).toBe(216);
  });

  it("throws RangeError for a zero, negative, or non-finite a4Hz", () => {
    expect(() => midiToHz(69, 0)).toThrow(RangeError);
    expect(() => midiToHz(69, -440)).toThrow(RangeError);
    expect(() => midiToHz(69, NaN)).toThrow(RangeError);
    expect(() => midiToHz(69, Infinity)).toThrow(RangeError);
  });

  it("throws RangeError for a non-finite midi value", () => {
    expect(() => midiToHz(NaN)).toThrow(RangeError);
    expect(() => midiToHz(Infinity)).toThrow(RangeError);
  });
});

describe("noteToHz", () => {
  it("noteToHz('A', 4) is exactly 440 — the shipped-default anchor", () => {
    expect(noteToHz("A", 4)).toBe(440);
  });

  it("composes noteToMidi and midiToHz", () => {
    expect(noteToHz("C", 4)).toBe(midiToHz(noteToMidi("C", 4)));
  });
});

describe("formatNoteName", () => {
  it("formats A4", () => {
    expect(formatNoteName("A", 4)).toBe("A4");
  });

  it("formats a negative octave without a separator", () => {
    expect(formatNoteName("C#", -1)).toBe("C#-1");
  });
});
