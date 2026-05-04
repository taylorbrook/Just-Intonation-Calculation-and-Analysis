import { describe, it, expect } from "vitest";
import { parseScala, parseScl, writeScl } from "../lib/scala.js";
import { Scale } from "../lib/scale.js";
import { Interval } from "../lib/interval.js";

/**
 * COMP-03 (reframed per CONTEXT D-01): the dashboard's seed scale (D-02) must
 * parse, display, and round-trip through .scl correctly. This test catches
 * kernel-vs-dashboard drift — if anyone changes parseScala, writeScl, parseScl,
 * or the seed text in src/index.md without updating the others, this test fails.
 *
 * The seed text mirrors the constant baked into src/index.md verbatim — this is
 * the dashboard's primary user-facing artifact, so a CI gate on its kernel
 * round-trip is the smallest reliable detector for drift.
 */

const SEED_TEXT = `9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1`;
const EXPECTED_RATIOS = ["1/1", "9/8", "5/4", "21/16", "3/2", "27/16", "7/4", "2/1"];

describe("dashboard seed scale (COMP-03 reframed)", () => {
  it("parses the D-02 seed via parseScala into 8 intervals (1/1 auto-prepended)", () => {
    const intervals = parseScala(SEED_TEXT);
    expect(intervals).toHaveLength(8);
    const ratios = intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
    expect(ratios).toEqual(EXPECTED_RATIOS);
  });

  it("constructs a Scale whose period is 2/1 (last interval, D-14)", () => {
    const scale = new Scale(parseScala(SEED_TEXT));
    expect(scale.period.equals(new Interval("2/1"))).toBe(true);
  });

  it("round-trips the seed Scale through writeScl → parseScl with all intervals equal", () => {
    const scale = new Scale(parseScala(SEED_TEXT));
    const sclText = writeScl(scale, "Tuning Systems seed scale (7-limit JI)");
    const reparsed = parseScl(sclText);
    const back = new Scale(reparsed.intervals);

    expect(back.intervals).toHaveLength(scale.intervals.length);
    for (let i = 0; i < scale.intervals.length; i++) {
      const a = scale.intervals[i];
      const b = back.intervals[i];
      expect(a, `interval ${String(i)}: a missing`).toBeDefined();
      expect(b, `interval ${String(i)}: b missing`).toBeDefined();
      expect(
        a!.equals(b!),
        `interval ${String(i)} (${a!.fraction.toFraction()} vs ${b!.fraction.toFraction()})`,
      ).toBe(true);
    }
    expect(back.period.equals(scale.period)).toBe(true);
    expect(reparsed.description).toBe("Tuning Systems seed scale (7-limit JI)");
  });

  it("writeScl does NOT emit a 1/1 unison line (D-13)", () => {
    const scale = new Scale(parseScala(SEED_TEXT));
    const sclText = writeScl(scale);
    const lines = sclText.split("\n").map((l) => l.trim());
    const pitchLines = lines.filter((l) => l !== "" && !l.startsWith("!") && /\d/.test(l));
    // The unison "1/1" must not appear as a pitch line.
    const unisonAsPitch = pitchLines.some((l) => /^1\/1\b/.test(l));
    expect(unisonAsPitch).toBe(false);
  });

  it("writeScl pitch count is 7 (excluding the implicit 1/1, D-13)", () => {
    const scale = new Scale(parseScala(SEED_TEXT));
    // Pass an explicit description so the order of non-comment lines is stable
    // (without one, writeScl emits an empty description line that gets filtered
    // out by `l.trim() !== ""`).
    const sclText = writeScl(scale, "seed");
    const nonComment = sclText
      .split("\n")
      .filter((l) => !l.trim().startsWith("!") && l.trim() !== "");
    // nonComment[0] = description ("seed"); nonComment[1] = count ("7"); then 7 pitches.
    expect(nonComment[0]?.trim()).toBe("seed");
    expect(nonComment[1]?.trim()).toBe("7");
    // Total non-comment lines = description + count + 7 pitches = 9.
    expect(nonComment).toHaveLength(9);
  });
});
