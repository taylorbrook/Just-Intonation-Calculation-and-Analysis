import { describe, it, expect, vi, afterEach } from "vitest";

// Mirrors src/theme/__tests__/theme-prefs.test.ts conventions: vitest globals
// via explicit import, vi.stubGlobal for localStorage so the stub does not leak
// between tests (afterEach -> vi.unstubAllGlobals). Node env (no DOM) — the
// CustomEvent broadcast is covered separately in scale-store-event.test.ts
// (happy-dom), because the environment directive is file-scoped in Vitest.
import {
  SCALE_STORAGE_KEY,
  SCALE_CHANGED_EVENT,
  readSharedScale,
  writeSharedScale,
} from "../scale-store.js";
import { MAX_SCALE_TEXT_BYTES } from "../../lib/url.js";

// ────── Constants ────────────────────────────────────────────────────
// Regression guards — these strings are user-facing storage / event keys;
// renaming them silently breaks persistence + the live channel for everyone
// with an existing localStorage entry or a registered listener.

describe("scale-store constants", () => {
  it("SCALE_STORAGE_KEY is the exact namespaced string", () => {
    expect(SCALE_STORAGE_KEY).toBe("tuning-systems:scale");
  });

  it("SCALE_CHANGED_EVENT is the exact namespaced string", () => {
    expect(SCALE_CHANGED_EVENT).toBe("tuning-systems:scale-changed");
  });
});

// ────── readSharedScale ──────────────────────────────────────────────
//
// Defensive across every plausible localStorage failure mode + every malformed
// shape. Always returns a valid SharedScale or null — never throws.

describe("readSharedScale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when localStorage is undefined", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when getItem returns null (absent key)", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => null) });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when getItem throws (private browsing)", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => {
        throw new Error("private browsing");
      }),
    });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when stored value is malformed JSON", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "not json") });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when parsed JSON is the primitive null", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "null") });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when parsed JSON is a primitive (42)", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "42") });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when parsed JSON is an array", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "[]") });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when text field is not a string", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ text: 123 })),
    });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when text field is missing", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ source: "generate" })),
    });
    expect(readSharedScale()).toBeNull();
  });

  it("returns null when text exceeds the 8 KB UTF-8 cap (oversized read)", () => {
    const oversized = "x".repeat(MAX_SCALE_TEXT_BYTES + 1);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ text: oversized })),
    });
    expect(readSharedScale()).toBeNull();
  });

  it("round-trips { text, source } from a valid stored entry", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ text: "9/8\n2/1", source: "generate" })),
    });
    expect(readSharedScale()).toEqual({ text: "9/8\n2/1", source: "generate" });
  });

  it("reads a valid entry with no source field (source optional)", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ text: "5/4\n2/1" })),
    });
    expect(readSharedScale()).toEqual({ text: "5/4\n2/1" });
  });
});

// ────── writeSharedScale (persistence path, node env) ─────────────────
//
// The CustomEvent broadcast is asserted in scale-store-event.test.ts (happy-dom).
// Here we exercise only the persistence side effects + caps + throw-safety in a
// DOM-less env, where `typeof window === "undefined"` so no event fires.

describe("writeSharedScale persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists { text, source } as JSON under SCALE_STORAGE_KEY", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    writeSharedScale("9/8\n2/1", "generate");
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith(
      SCALE_STORAGE_KEY,
      JSON.stringify({ text: "9/8\n2/1", source: "generate" }),
    );
  });

  it("persists with no source when source is omitted", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    writeSharedScale("5/4\n2/1");
    expect(setItem).toHaveBeenCalledWith(SCALE_STORAGE_KEY, JSON.stringify({ text: "5/4\n2/1" }));
  });

  it("is a silent no-op (does not persist) when text exceeds the 8 KB cap", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    const oversized = "x".repeat(MAX_SCALE_TEXT_BYTES + 1);
    expect(() => writeSharedScale(oversized, "generate")).not.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("never throws when setItem throws (private browsing)", () => {
    vi.stubGlobal("localStorage", {
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
    });
    expect(() => writeSharedScale("9/8\n2/1", "generate")).not.toThrow();
  });

  it("never throws when localStorage is undefined", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(() => writeSharedScale("9/8\n2/1", "generate")).not.toThrow();
  });
});
