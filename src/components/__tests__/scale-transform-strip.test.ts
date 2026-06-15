// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { scaleTransformStrip } from "../scale-transform-strip.js";
import { Interval } from "../../lib/interval.js";
import { Scale } from "../../lib/scale.js";

/** 5-degree JI scale + 2/1 period — 6 intervals total. */
function jiPenta(): Scale {
  const ratios = ["1/1", "9/8", "5/4", "3/2", "5/3", "2/1"];
  return new Scale(ratios.map((r) => new Interval(r)));
}

/** 7-degree JI scale + 2/1 period — 8 intervals total. */
function jiHepta(): Scale {
  const ratios = ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"];
  return new Scale(ratios.map((r) => new Interval(r)));
}

/** Compare two scales interval-wise by exact BigInt equality (NOT cents). */
function scalesEqual(a: Scale, b: Scale): boolean {
  if (a.intervals.length !== b.intervals.length) return false;
  return a.intervals.every((iv, i) => iv.equals(b.intervals[i]!));
}

interface StripElement extends HTMLElement {
  setSource(scale: Scale, tempered: boolean): void;
  getTransformedScale(): Scale | null;
  getTempered(): boolean;
  onChange(cb: (scale: Scale, tempered: boolean) => void): void;
}

function makeStrip(): StripElement {
  return scaleTransformStrip();
}

describe("scaleTransformStrip — factory shape", () => {
  it("returns an HTMLElement exposing setSource/getTransformedScale/getTempered/onChange", () => {
    const el = makeStrip();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(typeof el.setSource).toBe("function");
    expect(typeof el.getTransformedScale).toBe("function");
    expect(typeof el.getTempered).toBe("function");
    expect(typeof el.onChange).toBe("function");
  });
});

describe("scaleTransformStrip — rotate (Test 1)", () => {
  it("selecting Mode N+1 yields source.rotate(N) by iv.equals", () => {
    const el = makeStrip();
    const scale = jiPenta();
    el.setSource(scale, false);
    document.body.appendChild(el);
    const select = el.querySelector<HTMLSelectElement>('select[name="mode"]')!;
    // Mode 3 of 6 → degree 2.
    select.value = "2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    const out = el.getTransformedScale()!;
    expect(scalesEqual(out, scale.rotate(2))).toBe(true);
  });
});

describe("scaleTransformStrip — non-destructive compose (Test 2, D-05)", () => {
  it("re-derives from the ORIGINAL source each render (no accumulation)", () => {
    const el = makeStrip();
    const scale = jiPenta();
    el.setSource(scale, false);
    document.body.appendChild(el);
    const select = el.querySelector<HTMLSelectElement>('select[name="mode"]')!;
    const reduce = el.querySelector<HTMLInputElement>('input[name="reduce"]')!;

    // Apply mode 2 then reduce.
    select.value = "2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    reduce.checked = true;
    reduce.dispatchEvent(new Event("change", { bubbles: true }));
    const composed = el.getTransformedScale()!;
    const expected = scale.rotate(2).reduce();
    expect(scalesEqual(composed, expected)).toBe(true);

    // Toggle reduce off then on again — idempotent re-derivation, not accumulating.
    reduce.checked = false;
    reduce.dispatchEvent(new Event("change", { bubbles: true }));
    expect(scalesEqual(el.getTransformedScale()!, scale.rotate(2))).toBe(true);
    reduce.checked = true;
    reduce.dispatchEvent(new Event("change", { bubbles: true }));
    expect(scalesEqual(el.getTransformedScale()!, expected)).toBe(true);
  });
});

describe("scaleTransformStrip — mode-select rebuild (Test 3, D-07)", () => {
  it("setSource builds N mode options, and rebuilds for a different-length scale", () => {
    const el = makeStrip();
    el.setSource(jiPenta(), false); // 6 intervals
    document.body.appendChild(el);
    let opts = el.querySelectorAll('select[name="mode"] option');
    expect(opts.length).toBe(6);
    expect(opts[0]?.textContent).toBe("Mode 1 of 6");
    expect(opts[5]?.textContent).toBe("Mode 6 of 6");

    el.setSource(jiHepta(), false); // 8 intervals
    opts = el.querySelectorAll('select[name="mode"] option');
    expect(opts.length).toBe(8);
    expect(opts[7]?.textContent).toBe("Mode 8 of 8");
  });
});

describe("scaleTransformStrip — reset (Test 4, D-08)", () => {
  it("Reset returns to identity (mode 1, no reduce/dedupe/transpose) === raw source", () => {
    const el = makeStrip();
    const scale = jiPenta();
    el.setSource(scale, false);
    document.body.appendChild(el);
    const select = el.querySelector<HTMLSelectElement>('select[name="mode"]')!;
    const reduce = el.querySelector<HTMLInputElement>('input[name="reduce"]')!;
    select.value = "3";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    reduce.checked = true;
    reduce.dispatchEvent(new Event("change", { bubbles: true }));
    expect(scalesEqual(el.getTransformedScale()!, scale)).toBe(false);

    const resetBtn = el.querySelector<HTMLButtonElement>('button[name="reset"]')!;
    resetBtn.click();
    expect(scalesEqual(el.getTransformedScale()!, scale)).toBe(true);
    expect(select.value).toBe("0");
    expect(reduce.checked).toBe(false);
  });
});

describe("scaleTransformStrip — tempered survival (Test 5, D-18)", () => {
  it("getTempered() stays true through rotate + reduce + transpose", () => {
    const el = makeStrip();
    const scale = jiHepta();
    el.setSource(scale, true);
    document.body.appendChild(el);
    expect(el.getTempered()).toBe(true);

    const select = el.querySelector<HTMLSelectElement>('select[name="mode"]')!;
    select.value = "2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.getTempered()).toBe(true);

    const reduce = el.querySelector<HTMLInputElement>('input[name="reduce"]')!;
    reduce.checked = true;
    reduce.dispatchEvent(new Event("change", { bubbles: true }));
    expect(el.getTempered()).toBe(true);

    const tn = el.querySelector<HTMLInputElement>('input[name="transpose-n"]')!;
    const td = el.querySelector<HTMLInputElement>('input[name="transpose-d"]')!;
    tn.value = "3";
    td.value = "2";
    tn.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.getTempered()).toBe(true);
  });

  it("a non-tempered source keeps getTempered() false", () => {
    const el = makeStrip();
    el.setSource(jiPenta(), false);
    expect(el.getTempered()).toBe(false);
  });
});

describe("scaleTransformStrip — onChange (Test 6)", () => {
  it("fires cb(transformedScale, tempered) on every control change", () => {
    const el = makeStrip();
    const cb = vi.fn<(s: Scale, t: boolean) => void>();
    el.onChange(cb);
    const scale = jiPenta();
    el.setSource(scale, true);
    document.body.appendChild(el);
    // setSource itself re-derives + fires once.
    expect(cb).toHaveBeenCalled();
    const firstCall = cb.mock.calls.at(-1)!;
    expect(firstCall[1]).toBe(true); // tempered flag carried

    cb.mockClear();
    const select = el.querySelector<HTMLSelectElement>('select[name="mode"]')!;
    select.value = "1";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(cb).toHaveBeenCalledTimes(1);
    const [outScale, outTempered] = cb.mock.calls[0]!;
    expect(scalesEqual(outScale, scale.rotate(1))).toBe(true);
    expect(outTempered).toBe(true);
  });
});

describe("scaleTransformStrip — transpose ratio field (D-18)", () => {
  it("transpose 3/2 multiplies every interval through", () => {
    const el = makeStrip();
    const scale = jiPenta();
    el.setSource(scale, false);
    document.body.appendChild(el);
    const tn = el.querySelector<HTMLInputElement>('input[name="transpose-n"]')!;
    const td = el.querySelector<HTMLInputElement>('input[name="transpose-d"]')!;
    tn.value = "3";
    td.value = "2";
    tn.dispatchEvent(new Event("input", { bubbles: true }));
    const out = el.getTransformedScale()!;
    expect(scalesEqual(out, scale.transpose(new Interval("3/2")))).toBe(true);
  });

  it("transpose 1/1 is identity (null transpose)", () => {
    const el = makeStrip();
    const scale = jiPenta();
    el.setSource(scale, false);
    document.body.appendChild(el);
    const tn = el.querySelector<HTMLInputElement>('input[name="transpose-n"]')!;
    tn.value = "1";
    tn.dispatchEvent(new Event("input", { bubbles: true }));
    expect(scalesEqual(el.getTransformedScale()!, scale)).toBe(true);
  });
});
