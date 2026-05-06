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
import { parseScala } from "../../lib/scala.js";
import { makeStubSynth } from "./test-utils.js";

// BL-01 shape: scaleA always leads with 1/1 to match production wiring
// (`new Scale(parseScala(text))` auto-prepends 1/1 per D-13). The presets in
// BUILTIN_B_SCALES also lead with 1/1 since BL-01.
const seedA = (): Scale =>
  new Scale([
    new Interval("1/1"),
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
      new Interval("1/1"),
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

  it("Test 5: pythagorean-7 has 8 intervals (1/1 + 7 pitches) and degree 2 = 9/8 (BL-01 shape)", () => {
    const py = BUILTIN_B_SCALES["pythagorean-7"]!();
    // BL-01: presets lead with 1/1 to match parseScala-built scaleA.
    expect(py.intervals.length).toBe(8);
    expect(py.intervals[0]!.equals(new Interval("1/1"))).toBe(true);
    expect(py.intervals[1]!.equals(new Interval("9/8"))).toBe(true);
  });

  it("Test 6: 5-limit-7 contains 5/4 (BigInt-equal — D-32, NOT cents tolerance)", () => {
    const five = BUILTIN_B_SCALES["5-limit-7"]!();
    const has54 = five.intervals.some((iv) => iv.equals(new Interval("5/4")));
    expect(has54).toBe(true);
  });

  it("Test 7: bohlen-pierce-9 has period 3/1 and 10 intervals (1/1 + 9 pitches; BL-01 shape)", () => {
    const bp = BUILTIN_B_SCALES["bohlen-pierce-9"]!();
    expect(bp.period.equals(new Interval("3/1"))).toBe(true);
    // BL-01: presets lead with 1/1.
    expect(bp.intervals.length).toBe(10);
    expect(bp.intervals[0]!.equals(new Interval("1/1"))).toBe(true);
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

  it("Test 9: alignment table has one tbody row per A-degree (8 rows for the BL-01-shape seed)", () => {
    const el = scaleCompare(seedA(), makeStubSynth());
    const rows = el.querySelectorAll("tbody tr");
    expect(rows.length).toBe(seedA().intervals.length);
    // BL-01: seedA now leads with 1/1, so 8 rows = unison + 7 user pitches.
    expect(rows.length).toBe(8);
  });

  it("Test 9b (BL-01 regression): production scaleA (parseScala) vs preset → unison row Δ¢ = 0 and common-subset includes 1/1", () => {
    // Reproduces the production wiring: `new Scale(parseScala(scaleText))`,
    // which auto-prepends 1/1 per D-13. Before BL-01, the presets did NOT
    // lead with 1/1, so row 1 always reported A° 1 = 1/1 (0¢) aligned to B's
    // nearest non-unison interval (~100-204¢). After BL-01, both sides lead
    // with 1/1 and the unison aligns trivially.
    const seedText = "9/8\n5/4\n21/16\n3/2\n27/16\n7/4\n2/1";
    const scaleA = new Scale(parseScala(seedText));
    expect(scaleA.intervals[0]!.equals(new Interval("1/1"))).toBe(true);

    const el = scaleCompare(scaleA, makeStubSynth(), { defaultPreset: "pythagorean-7" });
    document.body.appendChild(el);
    try {
      // Row 1 = A° 1 = 1/1. With BL-01 fix the preset's first interval is also
      // 1/1 → BigInt-exact match → |Δ¢| = 0.
      const firstRow = el.querySelector("tbody tr");
      expect(firstRow).not.toBeNull();
      const cells = firstRow!.querySelectorAll("td");
      // Columns: A° | A ratio | A ¢ | B ¢ | B ratio | |Δ¢| | Audition.
      // Ratio cells render via Fraction.toFraction(), which emits "1" for 1/1
      // (no explicit denominator — same convention scale-compare uses elsewhere).
      expect(cells[1]!.textContent).toBe("1");
      expect(cells[4]!.textContent).toBe("1");
      // |Δ¢| string with default precision 1 → "0.0".
      expect(cells[5]!.textContent).toBe("0.0");
      // Row should be flagged as exact match.
      expect(firstRow!.classList.contains("scale-compare__row--match")).toBe(true);

      // Common subset must include 1/1. Pythagorean-7 vs the 7-limit JI seed
      // shares 1/1, 9/8, 3/2, 27/16, 2/1 → at least 5 (was 4 before BL-01).
      const summaryText = el.querySelector(".scale-compare__summary")?.textContent ?? "";
      const m = /Common subset:\s*(\d+)/.exec(summaryText);
      const count = m ? parseInt(m[1]!, 10) : 0;
      expect(count).toBeGreaterThanOrEqual(5);
    } finally {
      document.body.removeChild(el);
    }
  });

  it("Test 9c (BL-01 regression): paste handler keeps the leading 1/1 so paste-mode scaleB shape matches scaleA", () => {
    // Construct scaleA via the production path.
    const scaleA = new Scale(parseScala("9/8\n5/4\n3/2\n2/1"));
    const el = scaleCompare(scaleA, makeStubSynth());
    document.body.appendChild(el);
    try {
      // Switch B-source to Paste, paste a sub-scale that shares 1/1 + some pitches.
      const modeSel = el.querySelector(
        "select.scale-compare__b-source-mode",
      ) as HTMLSelectElement;
      modeSel.value = "Paste";
      modeSel.dispatchEvent(new Event("change", { bubbles: true }));
      const paste = el.querySelector(".scale-compare__paste textarea") as HTMLTextAreaElement;
      paste.value = "9/8\n3/2\n2/1";
      paste.dispatchEvent(new Event("input", { bubbles: true }));

      // Row 1 = A° 1 = 1/1. After BL-01, B also leads with 1/1 → exact match.
      // Fraction.toFraction() emits "1" (no explicit denominator) for 1/1.
      const firstRow = el.querySelector("tbody tr");
      const cells = firstRow!.querySelectorAll("td");
      expect(cells[1]!.textContent).toBe("1");
      expect(cells[4]!.textContent).toBe("1");
      expect(cells[5]!.textContent).toBe("0.0");

      // Common subset: 1/1, 9/8, 3/2, 2/1 → at least 4.
      const summaryText = el.querySelector(".scale-compare__summary")?.textContent ?? "";
      const m = /Common subset:\s*(\d+)/.exec(summaryText);
      const count = m ? parseInt(m[1]!, 10) : 0;
      expect(count).toBeGreaterThanOrEqual(4);
    } finally {
      document.body.removeChild(el);
    }
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
