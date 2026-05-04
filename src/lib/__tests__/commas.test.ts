import { describe, it, expect } from "vitest";
import { COMMAS, nameForMonzo, commaByName } from "../commas.js";

describe("commas", () => {
  it("nameForMonzo([-4, 4, -1]) === 'syntonic comma' (81/80)", () => {
    expect(nameForMonzo([-4, 4, -1])).toBe("syntonic comma");
  });

  it("nameForMonzo([-15, 8, 1]) === 'schisma' (32805/32768) — distinguished from syntonic by canonical monzo", () => {
    expect(nameForMonzo([-15, 8, 1])).toBe("schisma");
  });

  it("nameForMonzo([-19, 12]) === 'Pythagorean comma'", () => {
    expect(nameForMonzo([-19, 12])).toBe("Pythagorean comma");
  });

  it("nameForMonzo([6, -2, 0, -1]) === 'septimal comma' (64/63)", () => {
    expect(nameForMonzo([6, -2, 0, -1])).toBe("septimal comma");
  });

  it("nameForMonzo([11, -4, -2]) === 'diaschisma' (2048/2025)", () => {
    expect(nameForMonzo([11, -4, -2])).toBe("diaschisma");
  });

  it("nameForMonzo([0, 0]) === undefined (1/1 is not a comma)", () => {
    expect(nameForMonzo([0, 0])).toBeUndefined();
  });

  it("nameForMonzo is length-tolerant (Pitfall #14)", () => {
    expect(nameForMonzo([-4, 4, -1, 0])).toBe("syntonic comma");
  });

  it("commaByName('syntonic comma') has fraction 81/80", () => {
    const entry = commaByName("syntonic comma");
    expect(entry?.fraction.toFraction()).toBe("81/80");
  });

  it("commaByName('schisma') has fraction 32805/32768", () => {
    const entry = commaByName("schisma");
    expect(entry?.fraction.toFraction()).toBe("32805/32768");
  });

  it("commaByName('not a real comma') === undefined", () => {
    expect(commaByName("not a real comma")).toBeUndefined();
  });

  it("COMMAS table has at least 15 entries (D-21 floor)", () => {
    expect(COMMAS.length).toBeGreaterThanOrEqual(15);
  });
});
