// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { monzoBuilder } from "../monzo-builder.js";
import { makeStubSynth } from "./test-utils.js";

describe("monzoBuilder factory", () => {
  it("returns an HTMLElement with class 'monzo-builder'", () => {
    const el = monzoBuilder(makeStubSynth());
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain("monzo-builder");
  });

  it("renders 5 exponent inputs (primes 2/3/5/7/11) all defaulting to 0", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    const e2 = el.querySelector('input[name="exponent-2"]') as HTMLInputElement;
    const e3 = el.querySelector('input[name="exponent-3"]') as HTMLInputElement;
    const e5 = el.querySelector('input[name="exponent-5"]') as HTMLInputElement;
    const e7 = el.querySelector('input[name="exponent-7"]') as HTMLInputElement;
    const e11 = el.querySelector('input[name="exponent-11"]') as HTMLInputElement;
    expect(e2.value).toBe("0");
    expect(e3.value).toBe("0");
    expect(e5.value).toBe("0");
    expect(e7.value).toBe("0");
    expect(e11.value).toBe("0");
    expect(e2.min).toBe("-12");
    expect(e2.max).toBe("12");
  });

  it("renders a ratio input defaulting to '1' (unison)", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    const ratio = el.querySelector('input[name="ratio"]') as HTMLInputElement;
    expect(ratio).not.toBeNull();
    expect(ratio.value).toBe("1");
  });

  it("typing into an exponent input updates the ratio input + bra-ket display", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    const e3 = el.querySelector('input[name="exponent-3"]') as HTMLInputElement;
    const ratio = el.querySelector('input[name="ratio"]') as HTMLInputElement;
    // Set 3-exponent to 1 → ratio = 3/1 = 3
    e3.value = "1";
    e3.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ratio.value).toBe("3");
    const braket = el.querySelector(".monzo-builder__braket code")?.textContent ?? "";
    expect(braket).toBe("[ 0  1  0  0  0 ⟩");
  });

  it("typing '5/4' into the ratio input updates exponents to [-2, 0, 1, 0, 0]", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    const ratio = el.querySelector('input[name="ratio"]') as HTMLInputElement;
    ratio.value = "5/4";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    const e2 = el.querySelector('input[name="exponent-2"]') as HTMLInputElement;
    const e3 = el.querySelector('input[name="exponent-3"]') as HTMLInputElement;
    const e5 = el.querySelector('input[name="exponent-5"]') as HTMLInputElement;
    const e7 = el.querySelector('input[name="exponent-7"]') as HTMLInputElement;
    const e11 = el.querySelector('input[name="exponent-11"]') as HTMLInputElement;
    expect(e2.value).toBe("-2");
    expect(e3.value).toBe("0");
    expect(e5.value).toBe("1");
    expect(e7.value).toBe("0");
    expect(e11.value).toBe("0");
  });

  it("typing '13/12' surfaces a primes-above-11 error and leaves exponents unchanged", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    // Seed a known non-zero state via an exponent input so we can verify it is preserved.
    const e3 = el.querySelector('input[name="exponent-3"]') as HTMLInputElement;
    e3.value = "1";
    e3.dispatchEvent(new Event("input", { bubbles: true }));
    // Now type a 13-prime ratio.
    const ratio = el.querySelector('input[name="ratio"]') as HTMLInputElement;
    ratio.value = "13/12";
    ratio.dispatchEvent(new Event("input", { bubbles: true }));
    const err = el.querySelector('[role="status"]')!;
    expect(err.textContent ?? "").toMatch(/primes above 11/);
    // Exponent state preserved — e3 still 1, others 0.
    expect(e3.value).toBe("1");
    const e5 = el.querySelector('input[name="exponent-5"]') as HTMLInputElement;
    expect(e5.value).toBe("0");
  });

  it("clearing an exponent input (empty string) preserves prior state — does NOT coerce to 0", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    const e3 = el.querySelector('input[name="exponent-3"]') as HTMLInputElement;
    const ratio = el.querySelector('input[name="ratio"]') as HTMLInputElement;
    // Seed e3 = 1
    e3.value = "1";
    e3.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ratio.value).toBe("3");
    // Now clear it — should preserve prior state (ratio still "3").
    e3.value = "";
    e3.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ratio.value).toBe("3");
  });

  it("renders bra-ket as Unicode '[ a  b  c  d  e ⟩' with tabular columns", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    const braket = el.querySelector(".monzo-builder__braket code")?.textContent ?? "";
    expect(braket).toBe("[ 0  0  0  0  0 ⟩");
  });

  it("renders a ratio-pill, a cents readout, and a ▶ play button by default", () => {
    const el = monzoBuilder(makeStubSynth());
    document.body.appendChild(el);
    expect(el.querySelector(".ratio-pill")).not.toBeNull();
    const cents = el.querySelector(".monzo-builder__cents-host span")?.textContent ?? "";
    expect(cents).toMatch(/~0\.00¢/);
    const playBtn = el.querySelector("button.play-btn") as HTMLButtonElement;
    expect(playBtn).not.toBeNull();
    expect(playBtn.textContent).toBe("▶");
  });
});
