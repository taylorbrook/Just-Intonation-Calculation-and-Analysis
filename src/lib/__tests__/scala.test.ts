/**
 * Vitest coverage for src/lib/scala.ts — parseScala (body), parseScl (file),
 * writeScl (serializer), scalaToCsv (IO-04 clipboard payload). Drives all 21
 * fixtures (16 synthetic F-series + 5 golden) plus error/edge unit tests.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseScala, parseScl, writeScl, scalaToCsv } from "../scala.js";
import { Scale } from "../scale.js";
import { Interval } from "../interval.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const goldenDir = join(fixturesDir, "golden");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}
function readGolden(name: string): string {
  return readFileSync(join(goldenDir, name), "utf8");
}

// ---------------------------------------------------------------------------
// parseScala (body parser, D-12 / D-13 / D-15 / D-19)
// ---------------------------------------------------------------------------

describe("parseScala (body parser, D-12)", () => {
  it("auto-prepends 1/1 (D-13) and parses ratios", () => {
    const out = parseScala("9/8\n5/4\n2/1");
    expect(out).toHaveLength(4);
    expect(out[0]!.equals(new Interval("1/1"))).toBe(true);
    expect(out[1]!.equals(new Interval("9/8"))).toBe(true);
    expect(out[2]!.equals(new Interval("5/4"))).toBe(true);
    expect(out[3]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("skips leading `!` comment lines", () => {
    const out = parseScala("! comment\n9/8\n2/1");
    expect(out).toHaveLength(3);
    expect(out[1]!.fraction.toFraction()).toBe("9/8");
    expect(out[2]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("skips mid-body `!` comment lines", () => {
    const out = parseScala("9/8\n! mid-comment\n2/1");
    expect(out).toHaveLength(3);
    expect(out[1]!.fraction.toFraction()).toBe("9/8");
    expect(out[2]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("parses monzo bra-ket [-2 0 1> as 5/4 (D-15)", () => {
    const out = parseScala("9/8\n[-2 0 1>\n2/1");
    expect(out).toHaveLength(4);
    expect(out[2]!.fraction.toFraction()).toBe("5/4");
  });

  it("parses cents tokens (D-19: `.` triggers cents)", () => {
    const out = parseScala("408.0\n2/1");
    expect(out).toHaveLength(3);
    // Auto-prepended unison
    expect(out[0]!.equals(new Interval("1/1"))).toBe(true);
    // 408.0 cents converted to ratio approximation; .cents should be ~408
    expect(out[1]!.cents).toBeCloseTo(408.0, 2);
    expect(out[2]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("returns just the unison for an empty body", () => {
    const out = parseScala("");
    expect(out).toHaveLength(1);
    expect(out[0]!.equals(new Interval("1/1"))).toBe(true);
  });

  it("returns just the unison for whitespace-only body", () => {
    const out = parseScala("   \n   ");
    expect(out).toHaveLength(1);
    expect(out[0]!.equals(new Interval("1/1"))).toBe(true);
  });

  it("rejects negative ratios (Pitfall #6)", () => {
    expect(() => parseScala("-5/4")).toThrowError(/negative/i);
  });

  it("rejects multi-slash ratios (Pitfall #6)", () => {
    expect(() => parseScala("2/3/4")).toThrowError(/slash|invalid/i);
  });

  it("rejects unrecognized tokens", () => {
    expect(() => parseScala("not_a_token")).toThrowError();
  });

  it("parses bare integers as ratios per F06", () => {
    const out = parseScala("2");
    expect(out).toHaveLength(2);
    expect(out[1]!.fraction.toFraction()).toBe("2");
  });

  it("ignores trailing text after the first whitespace-bounded token (F09)", () => {
    expect(parseScala("  9/8  ")[1]!.fraction.toFraction()).toBe("9/8");
    expect(parseScala("\t9/8\t")[1]!.fraction.toFraction()).toBe("9/8");
    expect(parseScala("9/8 (Pythagorean second)")[1]!.fraction.toFraction()).toBe("9/8");
  });
});

// ---------------------------------------------------------------------------
// degenerate ratio + cents rejection (260615-ipz input-validation hardening)
// ---------------------------------------------------------------------------

describe("degenerate ratio + cents rejection (260615-ipz)", () => {
  // Non-positive ratios must be rejected at the parse boundary so a 0 Hz note
  // (or an opaque fraction.js "Division by Zero" for N/0) never reaches the
  // kernel. The guard runs BEFORE `new Interval`.
  it("rejects the bare zero ratio '0' as non-positive", () => {
    expect(() => parseScala("0")).toThrowError(/positive/i);
  });

  it("rejects '0/1' as non-positive", () => {
    expect(() => parseScala("0/1")).toThrowError(/positive/i);
  });

  it("rejects '5/0' as non-positive (NOT a raw 'Division by Zero')", () => {
    expect(() => parseScala("5/0")).toThrowError(/positive/i);
    expect(() => parseScala("5/0")).not.toThrowError(/division by zero/i);
  });

  it("rejects '0/5' as non-positive", () => {
    expect(() => parseScala("0/5")).toThrowError(/positive/i);
  });

  // |cents| > 1_000_000 fails fast with a clear message instead of blowing up
  // later as a confusing Infinity -> BigInt throw deep in the kernel.
  it("rejects a cents token whose magnitude exceeds 1,000,000 ('2000000.0')", () => {
    expect(() => parseScala("2000000.0")).toThrowError(/cents out of range/i);
  });

  it("rejects a large NEGATIVE cents token symmetrically ('-2000000.0')", () => {
    expect(() => parseScala("-2000000.0")).toThrowError(/cents out of range/i);
  });

  // The bound is inclusive at the cap — reject only when ABS is strictly greater.
  it("accepts a cents token AT the 1,000,000 boundary ('1000000.0')", () => {
    expect(() => parseScala("1000000.0")).not.toThrow();
  });

  // REGRESSION: ordinary in-range cents and ratios still parse unchanged.
  it("still parses an ordinary cents token '408.0'", () => {
    const out = parseScala("408.0");
    expect(out[1]!.cents).toBeCloseTo(408.0, 2);
  });

  it("still parses an ordinary ratio '9/8' and a bare integer '2'", () => {
    expect(parseScala("9/8")[1]!.fraction.toFraction()).toBe("9/8");
    expect(parseScala("2")[1]!.fraction.toFraction()).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// parseScl (full file parser) — drive all 16 F-fixtures
// ---------------------------------------------------------------------------

describe("parseScl (full file)", () => {
  it("F01 simple 7-limit JI: parses 7 pitches plus auto-prepended 1/1; ends in 2/1", () => {
    const { description, intervals } = parseScl(readFixture("F01-simple-7limit.scl"));
    expect(description).toBe("Simple 7-limit JI heptatonic");
    expect(intervals).toHaveLength(8); // 7 pitches + auto-prepended 1/1
    expect(intervals[0]!.equals(new Interval("1/1"))).toBe(true);
    expect(intervals[intervals.length - 1]!.equals(new Interval("2/1"))).toBe(true);
    expect(intervals[1]!.fraction.toFraction()).toBe("9/8");
  });

  it("F02 cents-only 12-TET: parses 12 cents pitches + 1/1", () => {
    const { intervals } = parseScl(readFixture("F02-cents-only.scl"));
    expect(intervals).toHaveLength(13);
    expect(intervals[0]!.equals(new Interval("1/1"))).toBe(true);
    expect(intervals[1]!.cents).toBeCloseTo(100.0, 2);
    expect(intervals[12]!.cents).toBeCloseTo(1200.0, 2);
  });

  it("F03 mixed ratio + cents: parses both row kinds", () => {
    const { intervals } = parseScl(readFixture("F03-mixed-ratio-cents.scl"));
    expect(intervals).toHaveLength(8); // 7 pitches + 1/1
    expect(intervals[1]!.fraction.toFraction()).toBe("9/8");
    expect(intervals[2]!.cents).toBeCloseTo(408.0, 2);
    expect(intervals[3]!.fraction.toFraction()).toBe("4/3");
  });

  it("F04 trailing-dot cents (`408.`): treated as cents, not malformed ratio", () => {
    const { intervals } = parseScl(readFixture("F04-trailing-dot.scl"));
    expect(intervals).toHaveLength(3);
    expect(intervals[1]!.cents).toBeCloseTo(408.0, 2);
  });

  it("F05 leading-dot cents (`.5`): treated as cents (0.5¢)", () => {
    const { intervals } = parseScl(readFixture("F05-leading-dot.scl"));
    expect(intervals).toHaveLength(3);
    expect(intervals[1]!.cents).toBeCloseTo(0.5, 2);
  });

  it("F06 bare integer (`2`): treated as ratio 2/1", () => {
    const { intervals } = parseScl(readFixture("F06-bare-integer.scl"));
    expect(intervals).toHaveLength(2);
    expect(intervals[1]!.fraction.toFraction()).toBe("2");
  });

  it("F07 comments everywhere: skipped during parsing and counting", () => {
    const { description, intervals } = parseScl(readFixture("F07-comments-everywhere.scl"));
    expect(description).toBe("Comments everywhere");
    expect(intervals).toHaveLength(4);
    expect(intervals[1]!.fraction.toFraction()).toBe("5/4");
    expect(intervals[2]!.fraction.toFraction()).toBe("3/2");
    expect(intervals[3]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("F08 Bohlen-Pierce: ends in 3/1 (non-octave period, Pitfall #13)", () => {
    const { intervals } = parseScl(readFixture("F08-bohlen-pierce.scl"));
    expect(intervals).toHaveLength(10); // 9 pitches + 1/1
    expect(intervals[intervals.length - 1]!.equals(new Interval("3/1"))).toBe(true);
  });

  it("F09 whitespace + trailing names: tokens parse cleanly, trailing text ignored", () => {
    const { intervals } = parseScl(readFixture("F09-whitespace-and-trailing-text.scl"));
    expect(intervals).toHaveLength(4);
    expect(intervals[1]!.fraction.toFraction()).toBe("5/4");
    expect(intervals[2]!.fraction.toFraction()).toBe("3/2");
    expect(intervals[3]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("F10 empty description: parses with description === ''", () => {
    const { description, intervals } = parseScl(readFixture("F10-empty-description.scl"));
    expect(description).toBe("");
    expect(intervals).toHaveLength(3);
    expect(intervals[1]!.fraction.toFraction()).toBe("3/2");
    // fraction.js' toFraction() returns "2" (no /1) for whole-number ratios;
    // verify by Fraction equality instead.
    expect(intervals[2]!.equals(new Interval("2/1"))).toBe(true);
  });

  it("F11 mismatched pitch count: throws with mention of count or expected", () => {
    expect(() => parseScl(readFixture("F11-mismatched-pitch-count.scl"))).toThrowError(
      /pitch count|expected 5|count/i,
    );
  });

  it("F12 negative ratio: throws (Pitfall #6)", () => {
    expect(() => parseScl(readFixture("F12-negative-ratio.scl"))).toThrowError(/negative/i);
  });

  it("F13 multi-slash: throws (Pitfall #6)", () => {
    expect(() => parseScl(readFixture("F13-multi-slash.scl"))).toThrowError(/slash|invalid/i);
  });

  it("F14 BigInt boundary 2147483648/2147483647: round-trips exactly through BigInt path (R-01)", () => {
    const { intervals } = parseScl(readFixture("F14-large-numerator.scl"));
    expect(intervals).toHaveLength(2);
    const last = intervals[1]!;
    expect(last.fraction.n).toBe(2147483648n);
    expect(last.fraction.d).toBe(2147483647n);
  });

  it("F15 CRLF line endings: parses identically to F1 after normalization", () => {
    const f1 = parseScl(readFixture("F01-simple-7limit.scl"));
    const f15 = parseScl(readFixture("F15-crlf-line-endings.scl"));
    expect(f15.description).toBe(f1.description);
    expect(f15.intervals).toHaveLength(f1.intervals.length);
    for (let i = 0; i < f1.intervals.length; i++) {
      expect(f15.intervals[i]!.fraction.toFraction()).toBe(f1.intervals[i]!.fraction.toFraction());
    }
  });

  it("F16 BOM-prefixed: BOM stripped, parses identically to F1", () => {
    const f1 = parseScl(readFixture("F01-simple-7limit.scl"));
    const f16 = parseScl(readFixture("F16-bom.scl"));
    expect(f16.description).toBe(f1.description);
    expect(f16.intervals).toHaveLength(f1.intervals.length);
    for (let i = 0; i < f1.intervals.length; i++) {
      expect(f16.intervals[i]!.fraction.toFraction()).toBe(f1.intervals[i]!.fraction.toFraction());
    }
  });

  it("rejects files larger than 1MB (T-02-10 DoS guard)", () => {
    const huge = "x".repeat(1_000_001);
    expect(() => parseScl(huge)).toThrowError(/too large|1 ?MB|size/i);
  });

  // CR-03: a 1 MB UTF-8 byte cap must not be defeated by non-ASCII input.
  // 333_334 CJK chars at 3 UTF-8 bytes each = 1_000_002 bytes, but
  // string.length is only 333_334 — well under the old code-unit cap.
  it("rejects files larger than 1MB by UTF-8 byte count, not code-unit count (CR-03)", () => {
    const cjk = "三".repeat(333_334);
    expect(cjk.length).toBeLessThan(1_000_000);
    expect(() => parseScl(cjk)).toThrowError(/too large|1 ?MB/i);
    expect(() => parseScala(cjk)).toThrowError(/too large|1 ?MB/i);
  });
});

// ---------------------------------------------------------------------------
// writeScl (serializer, D-13 / D-14)
// ---------------------------------------------------------------------------

describe("writeScl (serializer, D-13)", () => {
  it("strips the unison line when serializing (D-13)", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("9/8"), new Interval("2/1")]);
    const out = writeScl(scale, "test scale");
    expect(out).toContain("test scale");
    // Pitch count is 2 (NOT 3 — unison excluded)
    expect(out).toMatch(/^\s*2\s*$/m);
    expect(out).toContain("9/8");
    expect(out).toContain("2/1");
    // The unison must NOT appear as a pitch line. Allow `1/1` only inside descriptions
    // — here the description doesn't contain it, so a strict check is fine.
    const pitchLines = out
      .split("\n")
      .filter(
        (l) =>
          !l.startsWith("!") &&
          !/^\s*\d+\s*$/.test(l) &&
          l.trim() !== "" &&
          l.trim() !== "test scale",
      );
    for (const line of pitchLines) {
      expect(line.trim()).not.toBe("1/1");
    }
  });

  it("uses a default description when none provided", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("3/2"), new Interval("2/1")]);
    const out = writeScl(scale);
    // First non-comment line is the description (may be empty-ish but must exist)
    const lines = out.split("\n").filter((l) => !l.startsWith("!"));
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it("Plan-04 7-limit seed: produces a 7-pitch-count file ending in 2/1", () => {
    const seed = new Scale([
      new Interval("1/1"),
      new Interval("9/8"),
      new Interval("5/4"),
      new Interval("21/16"),
      new Interval("3/2"),
      new Interval("27/16"),
      new Interval("7/4"),
      new Interval("2/1"),
    ]);
    const out = writeScl(seed, "7-limit seed");
    // pitch-count line should read 7 (not 8)
    expect(out).toMatch(/^\s*7\s*$/m);
    // Last non-empty, non-comment line is the period 2/1
    const tail = out
      .trimEnd()
      .split("\n")
      .filter((l) => !l.startsWith("!"))
      .map((l) => l.trim())
      .filter((l) => l !== "")
      .at(-1);
    expect(tail).toBe("2/1");
  });

  it("round-trips: parseScl(writeScl(s)) preserves intervals (allowing for unison omission/insertion)", () => {
    const scale = new Scale([
      new Interval("1/1"),
      new Interval("9/8"),
      new Interval("5/4"),
      new Interval("3/2"),
      new Interval("2/1"),
    ]);
    const text = writeScl(scale, "round-trip test");
    const parsed = parseScl(text);
    expect(parsed.intervals).toHaveLength(scale.intervals.length);
    for (let i = 0; i < scale.intervals.length; i++) {
      expect(parsed.intervals[i]!.equals(scale.intervals[i]!)).toBe(true);
    }
  });

  // CR-02: writeScl must sanitize descriptions so user-typed content can't break
  // the round-trip invariant or shift the .scl line layout.
  it("sanitizes newlines in description (CR-02)", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("2/1")]);
    const out = writeScl(scale, "line1\nline2");
    expect(() => parseScl(out)).not.toThrow();
    expect(parseScl(out).description).toBe("line1 line2");
  });

  it("sanitizes CRLF in description (CR-02)", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("2/1")]);
    const out = writeScl(scale, "a\r\nb");
    expect(parseScl(out).description).toBe("a b");
  });

  it("defangs description starting with ! (CR-02)", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("2/1")]);
    const out = writeScl(scale, "!leading-bang");
    expect(() => parseScl(out)).not.toThrow();
    expect(parseScl(out).description).toBe("!leading-bang");
  });
});

// ---------------------------------------------------------------------------
// Round-trip golden invariant (IO-05)
// ---------------------------------------------------------------------------

describe("round-trip golden (IO-05)", () => {
  const goldens = [
    "partch_43.scl",
    "slendro.scl",
    "young_lm.scl",
    "12-just-chromatic.scl",
    "31edo.scl",
  ];
  for (const name of goldens) {
    it(`round-trips ${name}: parseScl(writeScl(parseScl(F))) ≡ parseScl(F) by Fraction equality`, () => {
      const original = parseScl(readGolden(name));
      const serialized = writeScl(new Scale(original.intervals), original.description);
      const reparsed = parseScl(serialized);
      expect(reparsed.intervals).toHaveLength(original.intervals.length);
      for (let i = 0; i < original.intervals.length; i++) {
        expect(reparsed.intervals[i]!.fraction.equals(original.intervals[i]!.fraction)).toBe(true);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// scalaToCsv (IO-04 clipboard payload, data path only)
// ---------------------------------------------------------------------------

describe("scalaToCsv (IO-04 data path)", () => {
  it("emits a header row and one row per interval", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("3/2"), new Interval("2/1")]);
    const csv = scalaToCsv(scale, 440);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(4); // header + 3 intervals
    expect(lines[0]).toMatch(/Degree/);
    expect(lines[0]).toMatch(/Ratio/);
    expect(lines[0]).toMatch(/Cents/);
    // First interval row contains 1/1 and 0.00 cents
    expect(lines[1]).toContain("1/1");
    expect(lines[1]).toContain("0.00");
    // Second row contains 3/2 and ~701.96
    expect(lines[2]).toContain("3/2");
    expect(lines[2]).toMatch(/701\.96|701\.95/);
  });

  it("produces tab-separated columns", () => {
    const scale = new Scale([new Interval("1/1"), new Interval("2/1")]);
    const csv = scalaToCsv(scale, 440);
    // every row should have the same number of tabs as the header
    const lines = csv.split("\n");
    const headerTabs = (lines[0]!.match(/\t/g) ?? []).length;
    expect(headerTabs).toBeGreaterThan(2);
    for (const line of lines) {
      expect((line.match(/\t/g) ?? []).length).toBe(headerTabs);
    }
  });
});

// ---------------------------------------------------------------------------
// Defense-in-depth: monzo size caps (T-02-11)
// ---------------------------------------------------------------------------

describe("monzo input caps (T-02-11)", () => {
  it("rejects monzo with > 32 components", () => {
    const huge = "[" + Array(40).fill("0").join(" ") + ">";
    expect(() => parseScala(huge)).toThrowError(/monzo|component|out of range|too long/i);
  });

  it("rejects monzo with absurd per-component magnitude", () => {
    expect(() => parseScala("[9999999 0 0>")).toThrowError(/monzo|component|out of range/i);
  });
});
