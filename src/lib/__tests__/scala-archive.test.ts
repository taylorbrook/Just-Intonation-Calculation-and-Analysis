/**
 * Vitest coverage for src/lib/scala-archive.ts — the build-time-pure archive
 * index module (D-A3..D-A5). Covers:
 *   - isTemperedScl (D-A4 / SURF-06): F01 false, F02 + F03 true
 *   - buildArchiveIndex: entry shape, pitchCount, degrees round-trip, malformed-skip
 *   - searchArchive: case-insensitive name+filename filter, cap, stable order
 *
 * Default `node` env (pure logic, no DOM). Tempered-flag cases load the existing
 * F01/F02/F03 fixtures; buildArchiveIndex + searchArchive use small in-memory
 * `{ filename, text }` arrays so the tests don't depend on the vendored snapshot.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type ArchiveEntry,
  DEFAULT_SEARCH_CAP,
  isTemperedScl,
  buildArchiveIndex,
  searchArchive,
} from "../scala-archive.js";
import { parseScala } from "../scala.js";
import { Scale } from "../scale.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

// ---------------------------------------------------------------------------
// isTemperedScl (D-A4 / SURF-06)
// ---------------------------------------------------------------------------

describe("isTemperedScl (D-A4 cents-marker detection)", () => {
  it("F01 simple 7-limit (all ratios) → false", () => {
    expect(isTemperedScl(readFixture("F01-simple-7limit.scl"))).toBe(false);
  });

  it("F02 cents-only 12-TET → true", () => {
    expect(isTemperedScl(readFixture("F02-cents-only.scl"))).toBe(true);
  });

  it("F03 mixed ratio + cents → true (any cents line is enough)", () => {
    expect(isTemperedScl(readFixture("F03-mixed-ratio-cents.scl"))).toBe(true);
  });

  it("ignores `.` in the description / comment lines (only pitch lines count)", () => {
    // A `.` in the description (line 1) or a comment must NOT flip the flag.
    const text = "A scale, version 1.5\n 2\n 9/8\n 2/1";
    expect(isTemperedScl(text)).toBe(false);
  });

  it("treats a leading-dot cents pitch (`.5`) as tempered", () => {
    const text = "leading dot\n 2\n .5\n 2/1";
    expect(isTemperedScl(text)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildArchiveIndex (entry shape + degrees round-trip + malformed-skip)
// ---------------------------------------------------------------------------

describe("buildArchiveIndex (D-A3 shape, T-09-01 skip)", () => {
  it("produces one entry per valid file with the D-A3 shape", () => {
    const entries = buildArchiveIndex([
      { filename: "F01.scl", text: readFixture("F01-simple-7limit.scl") },
    ]);
    expect(entries).toHaveLength(1);
    const e = entries[0]!;
    expect(e.filename).toBe("F01.scl");
    expect(e.name).toBe("Simple 7-limit JI heptatonic");
    // pitchCount excludes the implicit 1/1 → 7 declared pitches.
    expect(e.pitchCount).toBe(7);
    expect(e.tempered).toBe(false);
    expect(Array.isArray(e.degrees)).toBe(true);
  });

  it("pitchCount === parseScala(degrees).length - 1 (excludes implicit 1/1)", () => {
    const entries = buildArchiveIndex([
      { filename: "F01.scl", text: readFixture("F01-simple-7limit.scl") },
    ]);
    const e = entries[0]!;
    const reconstructed = parseScala(e.degrees.join("\n")); // re-prepends 1/1
    expect(reconstructed).toHaveLength(e.pitchCount + 1);
  });

  it("exact-JI degrees serialize as n/d (leading 1/1 dropped, 2/1 not '2')", () => {
    const entries = buildArchiveIndex([
      { filename: "F01.scl", text: readFixture("F01-simple-7limit.scl") },
    ]);
    const e = entries[0]!;
    expect(e.degrees[0]).toBe("9/8");
    expect(e.degrees).not.toContain("1/1"); // unison dropped
    expect(e.degrees.at(-1)).toBe("2/1"); // explicit denominator
  });

  it("tempered degrees serialize as cents strings (carry a `.`)", () => {
    const entries = buildArchiveIndex([
      { filename: "F02.scl", text: readFixture("F02-cents-only.scl") },
    ]);
    const e = entries[0]!;
    expect(e.tempered).toBe(true);
    expect(e.degrees).toHaveLength(12);
    for (const d of e.degrees) expect(d).toContain(".");
    expect(Number(e.degrees[0])).toBeCloseTo(100.0, 2);
    expect(Number(e.degrees.at(-1))).toBeCloseTo(1200.0, 2);
  });

  it("degrees round-trip: new Scale(parseScala(degrees)) has the same length", () => {
    const entries = buildArchiveIndex([
      { filename: "F01.scl", text: readFixture("F01-simple-7limit.scl") },
      { filename: "F02.scl", text: readFixture("F02-cents-only.scl") },
      { filename: "F03.scl", text: readFixture("F03-mixed-ratio-cents.scl") },
    ]);
    for (const e of entries) {
      const scale = new Scale(parseScala(e.degrees.join("\n")));
      // parseScala re-prepends 1/1 → length is pitchCount + 1.
      expect(scale.intervals).toHaveLength(e.pitchCount + 1);
    }
  });

  it("skips a malformed .scl (does not throw) and keeps the valid entries", () => {
    const entries = buildArchiveIndex([
      { filename: "good.scl", text: readFixture("F01-simple-7limit.scl") },
      // pitch-count mismatch: header says 5 but only 2 pitch lines → parseScl throws.
      { filename: "bad.scl", text: "broken\n 5\n 9/8\n 2/1" },
      { filename: "good2.scl", text: readFixture("F02-cents-only.scl") },
    ]);
    expect(entries.map((e) => e.filename)).toEqual(["good.scl", "good2.scl"]);
  });
});

// ---------------------------------------------------------------------------
// searchArchive (filter + cap + stable order)
// ---------------------------------------------------------------------------

describe("searchArchive (filter + cap, stable order)", () => {
  const sample: ArchiveEntry[] = [
    {
      filename: "partch_43.scl",
      name: "Partch 43-tone",
      pitchCount: 43,
      tempered: false,
      degrees: [],
    },
    {
      filename: "slendro.scl",
      name: "Javanese slendro",
      pitchCount: 5,
      tempered: true,
      degrees: [],
    },
    {
      filename: "werck3.scl",
      name: "Werckmeister III",
      pitchCount: 12,
      tempered: true,
      degrees: [],
    },
    {
      filename: "partch_other.scl",
      name: "Another Partch idea",
      pitchCount: 11,
      tempered: false,
      degrees: [],
    },
  ];

  it("matches case-insensitively over name", () => {
    const out = searchArchive(sample, "WERCKMEISTER", 50);
    expect(out.map((e) => e.filename)).toEqual(["werck3.scl"]);
  });

  it("matches over filename too", () => {
    const out = searchArchive(sample, "partch", 50);
    expect(out.map((e) => e.filename)).toEqual(["partch_43.scl", "partch_other.scl"]);
  });

  it("returns the first `cap` entries for a blank term, in input order", () => {
    const out = searchArchive(sample, "", 2);
    expect(out).toHaveLength(2);
    expect(out.map((e) => e.filename)).toEqual(["partch_43.scl", "slendro.scl"]);
  });

  it("never returns more than `cap` entries", () => {
    const out = searchArchive(sample, "", 3);
    expect(out.length).toBeLessThanOrEqual(3);
    expect(out).toHaveLength(3);
  });

  it("caps a matching-term result too (stable order preserved)", () => {
    const out = searchArchive(sample, "partch", 1);
    expect(out).toHaveLength(1);
    expect(out[0]!.filename).toBe("partch_43.scl");
  });

  it("returns [] for a term that matches nothing", () => {
    expect(searchArchive(sample, "zzz-nope", 50)).toEqual([]);
  });

  it("exposes a sane DEFAULT_SEARCH_CAP", () => {
    expect(DEFAULT_SEARCH_CAP).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULT_SEARCH_CAP)).toBe(true);
  });
});
