import { describe, it, expect } from "vitest";
import { Interval } from "../interval.js";
import { buildMos } from "../mos.js";
import { cps } from "../cps.js";
import { MAX_SCALE_TEXT_BYTES } from "../url.js";
import { scaleFromSonicWeave } from "../sonicweave.js";

/**
 * Stringify via n/d directly — fraction.js' Fraction.toFraction() drops "/1"
 * for whole-number ratios (so "2/1" round-trips as "2"). The n/d view is the
 * load-bearing equality surface (mirrors cps.test.ts / mos.test.ts).
 */
function ndStrings(scale: { intervals: readonly Interval[] }): string[] {
  return scale.intervals.map((iv) => `${String(iv.fraction.n)}/${String(iv.fraction.d)}`);
}

function factors(...nums: number[]): Interval[] {
  return nums.map((n) => new Interval(`${String(n)}/1`));
}

describe("scaleFromSonicWeave — the Phase-7 DSL→kernel boundary", () => {
  it("rank2(3/2, 5, 1) ≡ buildMos(3/2, 2/1, 7) by exact BigInt n/d (D-13 unison-prepended)", () => {
    const result = scaleFromSonicWeave("rank2(3/2, 5, 1)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(false);
    expect(result.scale).not.toBeNull();

    const expected = buildMos(new Interval("3/2"), new Interval("2/1"), 7);
    const scale = result.scale!;

    // Same length (8 entries: 1/1 … 2/1).
    expect(scale.intervals.length).toBe(expected.intervals.length);
    // Exact n/d vector — the canonical Pythagorean Ionian.
    expect(ndStrings(scale)).toEqual([
      "1/1",
      "9/8",
      "81/64",
      "4/3",
      "3/2",
      "27/16",
      "243/128",
      "2/1",
    ]);
    // R-01: every returned interval is a kernel Interval; BigInt-level equality
    // against buildMos (Pitfall #1 — never cents tolerance).
    expected.intervals.forEach((ev, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(ev) : false).toBe(true);
    });
  });

  it("cps([1,3,5,7], 2) ≡ kernel cps Hexany by exact BigInt n/d", () => {
    const result = scaleFromSonicWeave("cps([1,3,5,7], 2)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(false);
    expect(result.scale).not.toBeNull();

    const expected = cps(factors(1, 3, 5, 7), 2);
    const scale = result.scale!;

    expect(scale.intervals.length).toBe(expected.intervals.length);
    expect(ndStrings(scale)).toEqual(["1/1", "7/6", "5/4", "35/24", "5/3", "7/4", "2/1"]);
    expected.intervals.forEach((ev, i) => {
      const iv = scale.intervals[i];
      expect(iv ? iv.equals(ev) : false).toBe(true);
    });
  });

  it("quarter-comma meantone rank2(696.578…, 5, 1) is tempered — cents of record, no laundered ratios", () => {
    const result = scaleFromSonicWeave("rank2(696.578428466209, 5, 1)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(true);
    expect(result.scale).not.toBeNull();

    const scale = result.scale!;
    // Unison is prepended (D-13); the seven tempered degrees follow.
    expect(scale.intervals.length).toBe(8);
    const firstCents = scale.intervals[0]?.cents ?? NaN;
    expect(firstCents).toBeCloseTo(0, 3);

    const expectedCents = [193.157, 386.314, 503.422, 696.578, 889.735, 1082.892, 1200.0];
    const degreeCents = scale.intervals.slice(1).map((iv) => iv.cents);
    expect(degreeCents.length).toBe(expectedCents.length);
    expectedCents.forEach((c, i) => {
      expect(degreeCents[i]).toBeCloseTo(c, 2);
    });
  });

  it("malformed source returns { scale: null, error } and does NOT throw", () => {
    let result!: ReturnType<typeof scaleFromSonicWeave>;
    expect(() => {
      result = scaleFromSonicWeave("this is not valid sonicweave {{{");
    }).not.toThrow();
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("valid-but-empty source guards out.length === 0 before new Scale([])", () => {
    // A bare comment evaluates cleanly but produces an empty currentScale.
    const result = scaleFromSonicWeave("// just a comment, empty scale");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("source over MAX_SCALE_TEXT_BYTES returns a structured error before evaluation", () => {
    // Build a valid-looking but oversized source: a long run of comment bytes.
    const oversized = "// " + "x".repeat(MAX_SCALE_TEXT_BYTES + 10);
    expect(new TextEncoder().encode(oversized).length).toBeGreaterThan(MAX_SCALE_TEXT_BYTES);
    const result = scaleFromSonicWeave(oversized);
    expect(result.scale).toBeNull();
    expect(result.tempered).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("R-01: rational intervals are kernel Intervals (BigInt round-trip), not SonicWeave objects", () => {
    const result = scaleFromSonicWeave("rank2(3/2, 5, 1)");
    const scale = result.scale!;
    for (const iv of scale.intervals) {
      expect(iv).toBeInstanceOf(Interval);
      // Each one survives a fresh BigInt round-trip against its own n/d string.
      const nd = `${String(iv.fraction.n)}/${String(iv.fraction.d)}`;
      expect(iv.equals(new Interval(nd))).toBe(true);
    }
  });

  // ── WR-01 / WR-02: fail closed on non-positive intervals ──────────────────────
  // fraction.js v5 keeps n/d non-negative and stores the sign in f.s, so the R-01
  // round-trip used to LAUNDER a negative rational positive (`-3/2` → `3/2`) and
  // accept the zero interval (`0/1` → -Infinity cents). The adapter contract is
  // "all failure modes return a structured error" — these degenerate intervals
  // must be among them (07-REVIEW.md WR-01/WR-02).
  it("WR-01: a negative rational (-3/2) returns { scale: null, error } — no sign laundering", () => {
    const result = scaleFromSonicWeave("-3/2\n2/1");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("WR-02: the zero interval (0/1) returns { scale: null, error } — no -Infinity cents row", () => {
    const result = scaleFromSonicWeave("0/1\n2/1");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  // ── CR-01 (re-review): the STEP 3 mapping loop must never throw ────────────────
  // sonic-weave's Number-backed Fraction throws "Numerator above safe limit" for
  // rationals past 2^53 even though isFractional() is true, and centsToRatio
  // overflows to Infinity for extreme cents (fraction.js then throws converting
  // to BigInt). All three must come back as structured errors (07-REVIEW.md CR-01).
  it("CR-01: a rational past 2^53 (3^45) returns { scale: null, error } — no throw", () => {
    const result = scaleFromSonicWeave("3^45");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("CR-01: Mercator's comma (3^53/2^84) returns { scale: null, error } — no throw", () => {
    const result = scaleFromSonicWeave("3^53/2^84\n2/1");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("CR-01: a non-finite cents projection (1228801.) returns { scale: null, error } — no throw", () => {
    const result = scaleFromSonicWeave("1228801.");
    expect(result.scale).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error && result.error.length).toBeGreaterThan(0);
  });

  it("regression: a positive-rational source still returns a non-null scale with unchanged intervals", () => {
    const result = scaleFromSonicWeave("rank2(3/2, 5, 1)");
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(false);
    expect(result.scale).not.toBeNull();
    expect(ndStrings(result.scale!)).toEqual([
      "1/1",
      "9/8",
      "81/64",
      "4/3",
      "3/2",
      "27/16",
      "243/128",
      "2/1",
    ]);
  });
});

/**
 * Per-preset well-temperament vectors (GEN-07, Plan 07-02 Task 2, Open Question 1 /
 * Assumption A1). Each vector's commaFractions ordering, sign, and the EXPLICIT
 * Pythagorean comma 531441/524288 (D-07, Pitfall 2) are asserted against published
 * per-degree cents + the pure-fifth-count invariant (Pitfall 3 warning sign).
 *
 * SOURCING / CITATIONS — these two presets cross-check EXACTLY (sub-0.01¢) against
 * the repo's own authoritative theory page src/pages/well-temperament.md, which
 * itself cites:
 *   - Vallotti (1779): Wikipedia "Vallotti temperament"; tonalsoft encyclopedia;
 *     well-temperament.md vallottiFifths (six 1/6-Pythagorean-comma fifths + six
 *     pure). Pure-fifth invariant: 6 pure / 6 tempered.
 *   - Werckmeister III (1691): Werckmeister, *Musicalische Temperatur* (1691);
 *     Wikipedia "Werckmeister temperament"; well-temperament.md werckFifths (four
 *     1/4-Pythagorean-comma fifths C-G, G-D, D-A, B-F♯ + eight pure). Pure-fifth
 *     invariant: 8 pure / 4 tempered.
 *   - Cross-reference for the full historical roster: arXiv 1912.10918 "Well
 *     Temperaments based on the Werckmeister Definition".
 *
 * The well-temperament.md chain indexes fifths from C: 0 = C–G, 1 = G–D, 2 = D–A,
 * 3 = A–E, 4 = E–B, 5 = B–F♯, … 11 = F–C. SonicWeave's wellTemperament walks the
 * SAME chain of fifths from the generator (3/2) reference, so the per-fifth fraction
 * list aligns position-for-position with well-temperament.md's fifth arrays.
 */
describe("scaleFromSonicWeave — well-temperament preset vectors (GEN-07 A1 sourcing)", () => {
  const PYTH_COMMA = "531441/524288";

  /** Build a wellTemperament source with the EXPLICIT Pythagorean comma (D-07). */
  function welltempSrc(fractions: string[]): string {
    return `wellTemperament([${fractions.join(", ")}], ${PYTH_COMMA})`;
  }

  it("Vallotti (six 1/6-PC fifths + six pure) → 12 tempered notes; degree cents match the canonical scheme", () => {
    // Six 1/6-Pythagorean-comma fifths on the contiguous chain C-G…B-F♯, six pure.
    const result = scaleFromSonicWeave(
      welltempSrc(["-1/6", "-1/6", "-1/6", "-1/6", "-1/6", "-1/6", "0", "0", "0", "0", "0"]),
    );
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(true);
    expect(result.scale).not.toBeNull();

    const scale = result.scale!;
    // 12-note well-temperament: the adapter prepends the kernel-convention unison
    // (D-13) → 13 intervals (1/1 + 11 chromatic degrees + the 2/1 octave).
    expect(scale.intervals.length).toBe(13);
    expect(scale.intervals[0]?.cents ?? NaN).toBeCloseTo(0, 3); // leading unison.

    // Published Vallotti degree cents above the unison (well-temperament.md
    // vallottiFifths, C-based) — the 12 non-unison degrees.
    const degreeCents = scale.intervals.slice(1).map((iv) => iv.cents);
    const expected = [
      90.225, 196.09, 294.135, 392.18, 498.045, 588.27, 698.045, 792.18, 894.135, 996.09, 1090.225,
      1200.0,
    ];
    expect(degreeCents.length).toBe(expected.length);
    expected.forEach((c, i) => {
      expect(degreeCents[i]).toBeCloseTo(c, 1);
    });
  });

  it("Werckmeister III (four 1/4-PC fifths C-G,G-D,D-A,B-F♯ + eight pure) → 12 tempered notes; canonical degree cents", () => {
    // Four 1/4-Pythagorean-comma fifths at chain positions 0,1,2,5 (C-G, G-D, D-A,
    // B-F♯); the other eight pure (Werckmeister III's 8-pure-fifth invariant).
    const result = scaleFromSonicWeave(
      welltempSrc(["-1/4", "-1/4", "-1/4", "0", "0", "-1/4", "0", "0", "0", "0", "0"]),
    );
    expect(result.error).toBeUndefined();
    expect(result.tempered).toBe(true);
    expect(result.scale).not.toBeNull();

    const scale = result.scale!;
    // 13 intervals = 1/1 + 11 chromatic degrees + the 2/1 octave (D-13 unison).
    expect(scale.intervals.length).toBe(13);
    expect(scale.intervals[0]?.cents ?? NaN).toBeCloseTo(0, 3);

    // Published Werckmeister III degree cents above the unison (well-temperament.md
    // werckFifths) — the 12 non-unison degrees.
    const degreeCents = scale.intervals.slice(1).map((iv) => iv.cents);
    const expected = [
      90.225, 192.18, 294.135, 390.225, 498.045, 588.27, 696.09, 792.18, 888.27, 996.09, 1092.18,
      1200.0,
    ];
    expect(degreeCents.length).toBe(expected.length);
    expected.forEach((c, i) => {
      expect(degreeCents[i]).toBeCloseTo(c, 1);
    });
  });

  it("D-07: passing the syntonic-comma DEFAULT (no explicit comma) yields a DIFFERENT scale (Pitfall 2)", () => {
    // The Pythagorean-comma Vallotti and the (wrong) syntonic-default version must
    // NOT coincide — proving the explicit 531441/524288 argument is load-bearing.
    const pyth = scaleFromSonicWeave(
      `wellTemperament([-1/6, -1/6, -1/6, -1/6, -1/6, -1/6, 0, 0, 0, 0, 0], ${PYTH_COMMA})`,
    );
    const syntonicDefault = scaleFromSonicWeave(
      `wellTemperament([-1/6, -1/6, -1/6, -1/6, -1/6, -1/6, 0, 0, 0, 0, 0])`,
    );
    expect(pyth.scale).not.toBeNull();
    expect(syntonicDefault.scale).not.toBeNull();
    const pythCents = pyth.scale!.intervals.map((iv) => iv.cents);
    const synCents = syntonicDefault.scale!.intervals.map((iv) => iv.cents);
    // At least one non-octave degree differs by more than 0.1¢.
    const maxDelta = Math.max(
      ...pythCents.slice(0, -1).map((c, i) => Math.abs(c - (synCents[i] ?? c))),
    );
    expect(maxDelta).toBeGreaterThan(0.1);
  });
});
