// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import {
  parseIntOrNull,
  parsePositiveInt,
  parseRatio,
  makeIntField,
  makeRatioField,
} from "../generate-fields.js";

/**
 * generate-fields.test.ts — the consolidated generator field helpers (#19).
 *
 * Covers each behavior bullet from the plan, especially the three hardening points
 * folded in while consolidating: parseIntOrNull min-rejection (negatives + below-min),
 * parsePositiveInt strict rejection of "3.5"/"3abc", and parseRatio BigInt-exactness
 * past 2^53. Plus that the field factories apply the right BEM class prefix + min/max
 * attrs and fire onCommit ONLY on a valid parse.
 */

describe("parseIntOrNull", () => {
  it("returns null for empty / whitespace input", () => {
    expect(parseIntOrNull("")).toBeNull();
    expect(parseIntOrNull("   ")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseIntOrNull("abc")).toBeNull();
  });

  it("preserves the legacy lenient parseInt behavior (parseInt-of leading digits)", () => {
    // The historical body is `parseInt(trimmed, 10)` then Number.isInteger — this is
    // lenient by design: "3.5" -> 3, "1e3" -> 1. Consolidation must NOT change this
    // (only parsePositiveInt / the CPS kInput got the strict-parse hardening).
    expect(parseIntOrNull("3.5")).toBe(3);
    expect(parseIntOrNull("1e3")).toBe(1);
  });

  it("returns the integer when no min is passed (no-floor default preserved)", () => {
    expect(parseIntOrNull("12")).toBe(12);
    expect(parseIntOrNull("0")).toBe(0);
    // welltemp relies on negatives passing the no-floor default.
    expect(parseIntOrNull("-5")).toBe(-5);
  });

  it("rejects below-min values when a min is supplied (the hardening)", () => {
    expect(parseIntOrNull("-1", 1)).toBeNull();
    expect(parseIntOrNull("0", 1)).toBeNull();
    expect(parseIntOrNull("1", 1)).toBe(1);
    expect(parseIntOrNull("9", 1)).toBe(9);
  });

  it("honors a non-1 min", () => {
    expect(parseIntOrNull("1", 2)).toBeNull();
    expect(parseIntOrNull("2", 2)).toBe(2);
    // min=0 admits zero but rejects negatives.
    expect(parseIntOrNull("0", 0)).toBe(0);
    expect(parseIntOrNull("-1", 0)).toBeNull();
  });
});

describe("parsePositiveInt", () => {
  it("accepts strictly-positive integers", () => {
    expect(parsePositiveInt("1")).toBe(1);
    expect(parsePositiveInt("12")).toBe(12);
    expect(parsePositiveInt("  7 ")).toBe(7);
  });

  it("rejects 0 (n < 1)", () => {
    expect(parsePositiveInt("0")).toBeNull();
  });

  it("strict-rejects non-integer / non-decimal-digit forms (the CPS hardening)", () => {
    expect(parsePositiveInt("3.5")).toBeNull();
    expect(parsePositiveInt("3abc")).toBeNull();
    expect(parsePositiveInt("1e3")).toBeNull();
    expect(parsePositiveInt("0x4")).toBeNull();
    expect(parsePositiveInt("-2")).toBeNull();
    expect(parsePositiveInt("")).toBeNull();
  });
});

describe("parseRatio", () => {
  it("normalizes valid n/d strings (trim included)", () => {
    expect(parseRatio("3/2")).toBe("3/2");
    expect(parseRatio(" 5/4 ")).toBe("5/4");
  });

  it("rejects degenerate / malformed ratios", () => {
    expect(parseRatio("0/1")).toBeNull();
    expect(parseRatio("1/0")).toBeNull();
    expect(parseRatio("abc")).toBeNull();
    expect(parseRatio("3")).toBeNull();
    expect(parseRatio("3/")).toBeNull();
  });

  it("preserves a numerator/denominator past 2^53 EXACTLY (BigInt, not rounded)", () => {
    // 2^53 + 1 = 9007199254740993 — not representable as a JS Number; Number-backed
    // parsing would round it to 9007199254740992. BigInt preserves it.
    const big = "9007199254740993";
    expect(parseRatio(`${big}/2`)).toBe(`${big}/2`);
    expect(parseRatio(`2/${big}`)).toBe(`2/${big}`);
  });
});

describe("makeIntField", () => {
  it("builds div.{prefix}__field with a label span and a number input carrying min/max", () => {
    const el = makeIntField("generate-ed", "Divisions", "ed-divisions", 12, () => {}, {
      min: "1",
      max: "1000",
    });
    expect(el.className).toBe("generate-ed__field");
    const lbl = el.querySelector(".generate-ed__field-label") as HTMLElement;
    expect(lbl).not.toBeNull();
    expect(lbl.textContent).toBe("Divisions");
    const input = el.querySelector("input") as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.name).toBe("ed-divisions");
    expect(input.step).toBe("1");
    expect(input.min).toBe("1");
    expect(input.max).toBe("1000");
    expect(input.value).toBe("12");
    expect(input.getAttribute("aria-label")).toBe("Divisions");
  });

  it("uses the supplied classPrefix verbatim (no normalization)", () => {
    const el = makeIntField("generate-fokker", "Up", "fokker-up-0", 3, () => {}, { min: "0" });
    expect(el.className).toBe("generate-fokker__field");
    expect((el.querySelector("span") as HTMLElement).className).toBe(
      "generate-fokker__field-label",
    );
  });

  it("fires onInput + onCommit on a valid parse", () => {
    let committedTo: number | null = null;
    let commits = 0;
    const el = makeIntField(
      "generate-ed",
      "Divisions",
      "ed-divisions",
      12,
      (n) => {
        committedTo = n;
      },
      { min: "1" },
      {
        onCommit: () => {
          commits += 1;
        },
      },
    );
    const input = el.querySelector("input") as HTMLInputElement;
    input.value = "19";
    input.dispatchEvent(new Event("input"));
    expect(committedTo).toBe(19);
    expect(commits).toBe(1);
  });

  it("does NOT fire onInput/onCommit on a below-min parse (the hardening)", () => {
    let called = false;
    let commits = 0;
    const el = makeIntField(
      "generate-ji-set",
      "Odd limit",
      "ji-set-limit",
      9,
      () => {
        called = true;
      },
      { min: "1" },
      {
        onCommit: () => {
          commits += 1;
        },
      },
    );
    const input = el.querySelector("input") as HTMLInputElement;
    input.value = "-3";
    input.dispatchEvent(new Event("input"));
    expect(called).toBe(false);
    expect(commits).toBe(0);
  });

  it("does NOT fire on an empty / non-numeric edit", () => {
    let commits = 0;
    const el = makeIntField(
      "generate-ed",
      "Divisions",
      "ed-divisions",
      12,
      () => {},
      {},
      {
        onCommit: () => {
          commits += 1;
        },
      },
    );
    const input = el.querySelector("input") as HTMLInputElement;
    input.value = "";
    input.dispatchEvent(new Event("input"));
    input.value = "abc";
    input.dispatchEvent(new Event("input"));
    expect(commits).toBe(0);
  });

  it("clampReflect snaps the visible value to [min..max] after commit (fokker)", () => {
    const el = makeIntField(
      "generate-fokker",
      "Up (prime 3)",
      "fokker-up-0",
      3,
      () => {},
      { min: "0", max: "24" },
      { clampReflect: true },
    );
    const input = el.querySelector("input") as HTMLInputElement;
    input.value = "99";
    input.dispatchEvent(new Event("input"));
    // 99 is above the field's max (which is also >= min), so it parses, commits,
    // and the visible value snaps to 24.
    expect(input.value).toBe("24");
  });

  it("without clampReflect the visible value is left as typed", () => {
    const el = makeIntField("generate-ed", "Divisions", "ed-divisions", 12, () => {}, {
      min: "1",
      max: "1000",
    });
    const input = el.querySelector("input") as HTMLInputElement;
    input.value = "19";
    input.dispatchEvent(new Event("input"));
    expect(input.value).toBe("19");
  });
});

describe("makeRatioField", () => {
  it("builds the n / slash / d structure with own names + aria-labels", () => {
    const el = makeRatioField(
      "generate-harmonic",
      "Equave",
      "ado-equave-n",
      "ado-equave-d",
      2,
      1,
      () => {},
    );
    expect(el.className).toBe("generate-harmonic__field");
    const nInput = el.querySelector('input[name="ado-equave-n"]') as HTMLInputElement;
    const dInput = el.querySelector('input[name="ado-equave-d"]') as HTMLInputElement;
    const slash = el.querySelector(".generate-harmonic__slash") as HTMLElement;
    expect(nInput.value).toBe("2");
    expect(nInput.min).toBe("1");
    expect(nInput.getAttribute("aria-label")).toBe("Equave numerator");
    expect(dInput.value).toBe("1");
    expect(dInput.min).toBe("1");
    expect(dInput.getAttribute("aria-label")).toBe("Equave denominator");
    expect(slash.textContent).toBe("/");
  });

  it("fires onChange + onCommit when both inputs are valid (min 1)", () => {
    let got: [number, number] | null = null;
    let commits = 0;
    const el = makeRatioField(
      "generate-ed",
      "Equave",
      "ed-equave-n",
      "ed-equave-d",
      3,
      1,
      (n, d) => {
        got = [n, d];
      },
      {
        onCommit: () => {
          commits += 1;
        },
      },
    );
    const nInput = el.querySelector('input[name="ed-equave-n"]') as HTMLInputElement;
    nInput.value = "5";
    nInput.dispatchEvent(new Event("input"));
    expect(got).toEqual([5, 1]);
    expect(commits).toBe(1);
  });

  it("bails (no onChange/onCommit) when either input is below min 1", () => {
    let called = false;
    let commits = 0;
    const el = makeRatioField(
      "generate-ed",
      "Equave",
      "ed-equave-n",
      "ed-equave-d",
      3,
      1,
      () => {
        called = true;
      },
      {
        onCommit: () => {
          commits += 1;
        },
      },
    );
    const dInput = el.querySelector('input[name="ed-equave-d"]') as HTMLInputElement;
    dInput.value = "0";
    dInput.dispatchEvent(new Event("input"));
    expect(called).toBe(false);
    expect(commits).toBe(0);
  });
});
