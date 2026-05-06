// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Plot is bundled by Framework at runtime via npm:@observablehq/plot. Vitest
// does not resolve `npm:` URLs by default; vitest.config.ts aliases the prefix
// to the local @observablehq/plot devDependency. Even so, we stub plot here
// to keep tests fast and decoupled from D3 internals.
vi.mock("npm:@observablehq/plot", () => ({
  plot: () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "plot-stub");
    return svg as unknown as HTMLElement;
  },
  ruleX: () => ({}),
  dot: () => ({}),
}));

import { scaleCompare, BUILTIN_B_SCALES, disposeScaleCompare } from "../scale-compare.js";
import { Scale } from "../../lib/scale.js";
import { Interval } from "../../lib/interval.js";
import { makeStubSynth } from "./test-utils.js";

const seedA = (): Scale =>
  new Scale([
    new Interval("9/8"),
    new Interval("5/4"),
    new Interval("21/16"),
    new Interval("3/2"),
    new Interval("27/16"),
    new Interval("7/4"),
    new Interval("2/1"),
  ]);

const pythagorean7 = (): Scale =>
  new Scale(
    [
      new Interval("9/8"),
      new Interval("81/64"),
      new Interval("4/3"),
      new Interval("3/2"),
      new Interval("27/16"),
      new Interval("243/128"),
      new Interval("2/1"),
    ],
    new Interval("2/1"),
  );

describe("scaleCompare factory shape (Tests 1, 2, 11, 12)", () => {
  it("Test 1: returns an HTMLElement with class 'scale-compare' and h2 'Compare scales'", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("scale-compare");
    expect(el.querySelector("h2")?.textContent).toBe("Compare scales");
  });

  it("Test 2: renders a B-source mode <select> with three options Preset/Paste/Import .scl", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    const modeSelect = el.querySelector<HTMLSelectElement>(
      "select.scale-compare__b-source-mode",
    );
    expect(modeSelect).not.toBeNull();
    const optionTexts = Array.from(modeSelect!.options).map((o) => o.textContent);
    expect(optionTexts).toEqual(["Preset", "Paste", "Import .scl"]);
  });

  it("Test 11: plot host '.scale-compare__plot' is appended and contains the stub SVG", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    const plotHost = el.querySelector(".scale-compare__plot");
    expect(plotHost).not.toBeNull();
    const stubSvg = el.querySelector(".scale-compare__plot svg.plot-stub");
    expect(stubSvg).not.toBeNull();
  });

  it("Test 12: status region with role=status aria-live=polite is present", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    const status = el.querySelector('[role="status"][aria-live="polite"]');
    expect(status).not.toBeNull();
  });
});

describe("BUILTIN_B_SCALES preset list (Tests 3, 4, 5, 6, 7)", () => {
  it("Test 3: exposes exactly the six D-27 keys", () => {
    expect(Object.keys(BUILTIN_B_SCALES).sort()).toEqual([
      "12tet",
      "19edo",
      "31edo",
      "5-limit-7",
      "bohlen-pierce-9",
      "pythagorean-7",
    ]);
  });

  it("Test 4: each BUILTIN_B_SCALES entry returns a valid Scale", () => {
    for (const key of Object.keys(BUILTIN_B_SCALES)) {
      const factory = BUILTIN_B_SCALES[key];
      expect(factory).toBeDefined();
      const scale = factory!();
      expect(scale).toBeInstanceOf(Scale);
      expect(scale.intervals.length).toBeGreaterThan(0);
    }
  });

  it("Test 5: pythagorean-7 has 7 intervals and starts with 9/8 (BigInt-equal)", () => {
    const py = BUILTIN_B_SCALES["pythagorean-7"]!();
    expect(py.intervals.length).toBe(7);
    expect(py.intervals[0]!.equals(new Interval("9/8"))).toBe(true);
  });

  it("Test 6: 5-limit-7 contains 5/4 (BigInt-equal — D-32, NOT cents tolerance)", () => {
    const five = BUILTIN_B_SCALES["5-limit-7"]!();
    const has54 = five.intervals.some((iv) => iv.equals(new Interval("5/4")));
    expect(has54).toBe(true);
  });

  it("Test 7: bohlen-pierce-9 has period 3/1 (BigInt-equal)", () => {
    const bp = BUILTIN_B_SCALES["bohlen-pierce-9"]!();
    expect(bp.period.equals(new Interval("3/1"))).toBe(true);
    expect(bp.intervals.length).toBe(9);
  });
});

describe("alignment + common-subset (Tests 8, 9)", () => {
  it("Test 8: pythagorean-7 vs 5-limit-7 → common-subset count >= 4 (BigInt equality)", () => {
    // Common ratios: 9/8, 4/3, 3/2, 2/1 → at least 4 exact matches.
    const el = scaleCompare(pythagorean7(), makeStubSynth());
    document.body.appendChild(el);
    try {
      const presetSel = el.querySelector(
        "select.scale-compare__preset",
      ) as HTMLSelectElement;
      presetSel.value = "5-limit-7";
      presetSel.dispatchEvent(new Event("change", { bubbles: true }));
      const summaryText = el.querySelector(".scale-compare__summary")?.textContent ?? "";
      expect(summaryText).toMatch(/Common subset:\s*(\d+)/);
      const m = /Common subset:\s*(\d+)/.exec(summaryText);
      const count = m ? parseInt(m[1]!, 10) : 0;
      expect(count).toBeGreaterThanOrEqual(4);
    } finally {
      document.body.removeChild(el);
    }
  });

  it("Test 9: alignment table has one tbody row per A-degree (7 rows for the seed)", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(seedA().intervals.length);
    expect(rows.length).toBe(7);
  });

  it("Test 9d (BL-02 regression): BigInt-exact match in B wins over an inexact B at the same float-cents", () => {
    // D-32 / Pitfall #1 contract: common-subset is BigInt-rational, NEVER
    // cents-tolerance. The OLD single-pass align() picks cents-nearest then
    // checks `aIv.equals(best)` post-hoc. With strict-< tie-breaking, a
    // non-equal B[0] and an equal B[1] at IDENTICAL float-cents would both
    // report `bestDist === 0`; the loop's `0 < 0` is false, so it keeps B[0]
    // and reports exactMatch=false (the bug).
    //
    // To force two distinct fractions to share an identical float-cents value,
    // exploit BigInt → Number precision loss in Interval.cents (the getter
    // does `1200 * Math.log2(Number(fraction.valueOf()))`). For numerators
    // above 2^53, distinct BigInt values collapse to the same Number, so
    // distinct Fractions yield IDENTICAL float-cents.
    //
    //   A    = (2^53 + 1) / 1
    //   B[0] = (2^53 + 2) / 1   ← NOT BigInt-equal to A; same float-cents.
    //   B[1] = (2^53 + 1) / 1   ← BigInt-equal to A; same float-cents.
    //   period = 2/1            ← B's period (Scale's CR-01 needs > 1/1).
    //
    // OLD: best = B[0]; loop sees d === bestDist === 0 → strict `<` keeps
    //      B[0] → reports B[0] as the match, exactMatch=false. Common-subset
    //      undercount by 1.
    // NEW: Pass-1 BigInt search finds B[1] → exactMatch=true, |Δ¢|=0.
    const big1 = (2n ** 53n + 1n).toString() + "/1";
    const big2 = (2n ** 53n + 2n).toString() + "/1";
    const a = new Interval(big1);
    const b0 = new Interval(big2);
    const b1 = new Interval(big1);
    const period = new Interval("2/1");

    // Sanity guard for the precision-drift premise. Without these properties
    // the test would be exercising an unrelated case.
    expect(a.cents).toBe(b0.cents);
    expect(a.cents).toBe(b1.cents);
    expect(a.equals(b0)).toBe(false);
    expect(a.equals(b1)).toBe(true);

    const scaleA = new Scale([a, period]);
    const customB = new Scale([b0, b1, period]);

    // BUILTIN_B_SCALES is a plain Record (no Object.freeze), so register a
    // temporary preset for the test's lifetime then unregister in `finally`.
    // This is the only public path to inject a hand-crafted scaleB into
    // scaleCompare; the paste/import paths funnel through parseScala which
    // doesn't accept the (2^53 + k)-magnitude numerator we need.
    BUILTIN_B_SCALES["__bl02_test__"] = (): Scale => customB;
    try {
      const el = scaleCompare(scaleA, makeStubSynth(), {
        defaultPreset: "__bl02_test__",
      });
      document.body.appendChild(el);
      try {
        const rows = el.querySelectorAll("tbody tr");
        // Row 1 = A's big1 interval. NEW: aligns to B[1] (BigInt-equal) →
        // exactMatch class set. OLD: aligns to B[0] (non-equal) → no class.
        const row1 = rows[0]!;
        expect(row1.classList.contains("scale-compare__row--match")).toBe(true);

        // Common subset includes both BigInt-equal pairs (a/b1 and the period)
        // → 2. Old algorithm reports 1 (only the period passes the post-hoc
        // `aIv.equals(best)` check).
        const summaryText = el.querySelector(".scale-compare__summary")?.textContent ?? "";
        const m = /Common subset:\s*(\d+)/.exec(summaryText);
        const count = m ? parseInt(m[1]!, 10) : 0;
        expect(count).toBe(2);
      } finally {
        document.body.removeChild(el);
      }
    } finally {
      delete BUILTIN_B_SCALES["__bl02_test__"];
    }
  });
});

describe("CR-02 panic-clear discipline (Tests 10, 13)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("Test 10a: per-row '▶ A vs B' fires A immediately and B after auditionGapMs (no Esc)", () => {
    const synth = makeStubSynth();
    const el = scaleCompare(seedA(), synth);
    document.body.appendChild(el);
    try {
      const auditBtn = el.querySelector(
        "tbody tr button.scale-compare__audition",
      ) as HTMLButtonElement;
      expect(auditBtn).not.toBeNull();
      auditBtn.click();
      // A note synchronous.
      expect(synth.playNote).toHaveBeenCalledTimes(1);
      // Advance past the 600ms gap → B note fires.
      vi.advanceTimersByTime(700);
      expect(synth.playNote).toHaveBeenCalledTimes(2);
    } finally {
      document.body.removeChild(el);
    }
  });

  it("Test 10b: Esc keydown BEFORE the gap clears the pending B-note (CR-02 regression)", () => {
    const synth = makeStubSynth();
    const el = scaleCompare(seedA(), synth);
    document.body.appendChild(el);
    try {
      const auditBtn = el.querySelector(
        "tbody tr button.scale-compare__audition",
      ) as HTMLButtonElement;
      auditBtn.click();
      // A fires; B is queued.
      expect(synth.playNote).toHaveBeenCalledTimes(1);
      // Press Esc — local keydown listener calls clearPendingAuditions.
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      // Even after the gap, B does NOT fire.
      vi.advanceTimersByTime(700);
      expect(synth.playNote).toHaveBeenCalledTimes(1);
    } finally {
      document.body.removeChild(el);
    }
  });

  it("Test 13: disposeScaleCompare(el) clears pending B-notes AND removes Esc listener", () => {
    const synth = makeStubSynth();
    const el = scaleCompare(seedA(), synth);
    document.body.appendChild(el);
    try {
      const auditBtn = el.querySelector(
        "tbody tr button.scale-compare__audition",
      ) as HTMLButtonElement;
      auditBtn.click();
      expect(synth.playNote).toHaveBeenCalledTimes(1); // A note synchronous.
      // Tear down BEFORE the 600ms gap fires — pending B must be cleared.
      disposeScaleCompare(el);
      vi.advanceTimersByTime(700);
      expect(synth.playNote).toHaveBeenCalledTimes(1); // B was cleared.
      // After dispose, dispatching Esc must not throw (listener was removed).
      expect(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      }).not.toThrow();
    } finally {
      document.body.removeChild(el);
    }
  });
});
