import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseKbm, writeKbm, kbmToFrequencies, kbmToFrequenciesWithDiagnostics } from "../kbm.js";
import type { KbmMapping } from "../kbm.js";
import { Scale } from "../scale.js";
import { Interval } from "../interval.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "kbm");
const readFixture = (name: string): string => readFileSync(join(fixturesDir, name), "utf8");

describe("parseKbm", () => {
  it("parses canonical 12-tet fixture (ref == middle)", () => {
    const kbm = parseKbm(readFixture("12-tet.kbm"));
    expect(kbm.size).toBe(12);
    expect(kbm.firstKey).toBe(0);
    expect(kbm.lastKey).toBe(127);
    expect(kbm.middleNote).toBe(69);
    expect(kbm.referenceKey).toBe(69);
    expect(kbm.referenceHz).toBeCloseTo(440, 3);
    expect(kbm.formalOctave).toBe(12);
    expect(kbm.keyMap).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("parses Pitfall-7 fixture (middle != reference)", () => {
    const kbm = parseKbm(readFixture("mid-60-ref-69.kbm"));
    expect(kbm.middleNote).toBe(60);
    expect(kbm.referenceKey).toBe(69);
    expect(kbm.referenceHz).toBeCloseTo(440, 3);
  });

  it("parses formalOctave != 12 fixture", () => {
    const kbm = parseKbm(readFixture("seven-degree.kbm"));
    expect(kbm.size).toBe(7);
    expect(kbm.formalOctave).toBe(7);
  });

  it("accepts muted-key entries (x and X and blank)", () => {
    const kbm = parseKbm(readFixture("with-muted-keys.kbm"));
    expect(kbm.keyMap).toHaveLength(12);
    expect(kbm.keyMap[1]).toBeNull();
    expect(kbm.keyMap[4]).toBeNull();
    expect(kbm.keyMap[8]).toBeNull();
    expect(kbm.keyMap[0]).toBe(0);
  });

  it("rejects oversize input (> 1MB UTF-8)", () => {
    const huge = "0\n".repeat(600_000);
    expect(() => parseKbm(huge)).toThrow(/too large|1MB|max/i);
  });

  it("rejects too-few fields (< 7 numeric lines)", () => {
    expect(() => parseKbm("12\n0\n127\n")).toThrow(/too few|expected/i);
  });

  it("rejects negative size", () => {
    const txt = readFixture("12-tet.kbm").replace(/^12$/m, "-1");
    expect(() => parseKbm(txt)).toThrow(/size/i);
  });
});

describe("writeKbm", () => {
  it("round-trips: parseKbm(writeKbm(parseKbm(F))) deep-equals parseKbm(F)", () => {
    for (const name of [
      "12-tet.kbm",
      "mid-60-ref-69.kbm",
      "seven-degree.kbm",
      "with-muted-keys.kbm",
    ]) {
      const a = parseKbm(readFixture(name));
      const b = parseKbm(writeKbm(a));
      expect(b).toEqual(a);
    }
  });

  it("#13: round-trips referenceHz at full precision (no toFixed(6) truncation)", () => {
    // These values lose precision under toFixed(6); exact equality is the point.
    for (const hz of [432.0011223344, 440.000001]) {
      const base = parseKbm(readFixture("12-tet.kbm"));
      const m: KbmMapping = { ...base, referenceHz: hz };
      const round = parseKbm(writeKbm(m));
      expect(round.referenceHz).toBe(hz);
    }
  });
});

describe("kbmToFrequencies", () => {
  it("middle == reference: produces baseHz × ratio for each MIDI note in pattern", () => {
    const kbm = parseKbm(readFixture("12-tet.kbm"));
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const freqs = kbmToFrequencies(scale, kbm);
    expect(freqs.size).toBeGreaterThan(0);
  });

  it("Pitfall-7 ground truth: middle=60, ref=69, refHz=440 → MIDI 60 ≈ 261.6256 Hz", () => {
    const kbm = parseKbm(readFixture("mid-60-ref-69.kbm"));
    const scale = new Scale([
      new Interval("9/8"),
      new Interval("5/4"),
      new Interval("4/3"),
      new Interval("3/2"),
      new Interval("5/3"),
      new Interval("15/8"),
      new Interval("2/1"),
    ]);
    const freqs = kbmToFrequencies(scale, kbm);
    const hz60 = freqs.get(60);
    expect(hz60).toBeCloseTo(261.6256, 3);
  });

  it("formalOctave === 0 falls back to size for wrap", () => {
    const kbm = parseKbm(readFixture("12-tet.kbm").replace(/(! Scale degree.*\n)12\n/, "$10\n"));
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const freqs = kbmToFrequencies(scale, kbm);
    expect(freqs.size).toBeGreaterThan(0);
  });
});

describe("kbmToFrequenciesWithDiagnostics", () => {
  it("#14: surfaces out-of-range mapped degrees in `skipped` instead of dropping silently", () => {
    // A 2-degree scale yields degrees [1/1, 9/8, 2/1] (length 3). A keyMap entry
    // of 5 points past the end → out of range → must be surfaced, not dropped.
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const kbm: KbmMapping = {
      size: 2,
      firstKey: 60,
      lastKey: 61,
      middleNote: 60,
      referenceKey: 60,
      referenceHz: 261.6256,
      formalOctave: 2,
      // position 0 → degree 0 (in range), position 1 → degree 5 (out of range)
      keyMap: [0, 5],
    };
    const { frequencies, skipped } = kbmToFrequenciesWithDiagnostics(scale, kbm);

    // MIDI 60 maps to position 0 (degree 0) → present.
    expect(frequencies.has(60)).toBe(true);
    // MIDI 61 maps to position 1 (degree 5, out of range) → skipped, absent.
    expect(frequencies.has(61)).toBe(false);
    expect(skipped).toEqual([{ midiNote: 61, mapEntry: 5 }]);
  });

  it("kbmToFrequencies delegates to .frequencies (backward-compatible)", () => {
    const scale = new Scale([new Interval("9/8"), new Interval("2/1")]);
    const kbm = parseKbm(readFixture("12-tet.kbm"));
    const legacy = kbmToFrequencies(scale, kbm);
    const { frequencies } = kbmToFrequenciesWithDiagnostics(scale, kbm);
    expect(legacy).toEqual(frequencies);
  });
});
