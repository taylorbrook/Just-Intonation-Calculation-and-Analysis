import { describe, it, expect } from "vitest";
import { add } from "../example.js";

describe("example stub kernel", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("handles negative numbers", () => {
    expect(add(-1, 1)).toBe(0);
  });
});
