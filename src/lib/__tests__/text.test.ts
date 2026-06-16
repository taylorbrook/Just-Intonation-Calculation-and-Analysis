import { describe, it, expect } from "vitest";
import { stripBom } from "../text.js";

// All inputs use the \uFEFF escape — never a literal BOM character in source.
const BOM = "\uFEFF"; // U+FEFF via escape

describe("stripBom", () => {
  it("removes a single leading BOM", () => {
    expect(stripBom(BOM + "hello")).toBe("hello");
  });

  it("leaves BOM-free text untouched", () => {
    expect(stripBom("hello")).toBe("hello");
    expect(stripBom("")).toBe("");
  });

  it("strips only the first position (internal BOM preserved)", () => {
    const input = "a" + BOM + "b";
    expect(stripBom(input)).toBe(input);
    // A leading BOM is removed but a second, internal BOM survives.
    expect(stripBom(BOM + "a" + BOM + "b")).toBe("a" + BOM + "b");
  });
});
