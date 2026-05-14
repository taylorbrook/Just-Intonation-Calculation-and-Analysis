import { describe, it, expect, vi, afterEach } from "vitest";

// Mirrors src/audio/__tests__/synth.test.ts conventions: vitest globals via
// explicit import, vi.stubGlobal for localStorage (so the stub does not leak
// between tests via afterEach -> vi.unstubAllGlobals).
import {
  THEME_PREFS_STORAGE_KEY,
  THEME_PREFS_EVENT,
  THEME_MODES,
  DEFAULT_THEME_PREFS,
  validateMode,
  readThemePrefs,
} from "../theme-prefs.js";

// ────── Constants ────────────────────────────────────────────────────
// Regression guards — these strings are user-facing storage keys; renaming them
// silently breaks persistence for everyone with an existing localStorage entry.

describe("theme-prefs constants", () => {
  it("THEME_PREFS_STORAGE_KEY is the exact namespaced string", () => {
    expect(THEME_PREFS_STORAGE_KEY).toBe("tuning-systems:theme-prefs");
  });

  it("THEME_PREFS_EVENT is the exact namespaced string", () => {
    expect(THEME_PREFS_EVENT).toBe("tuning-systems:theme-prefs-changed");
  });

  it("THEME_MODES deep-equals the tri-state tuple", () => {
    expect([...THEME_MODES]).toEqual(["auto", "light", "dark"]);
  });

  it("DEFAULT_THEME_PREFS deep-equals { mode: 'auto' }", () => {
    expect(DEFAULT_THEME_PREFS).toEqual({ mode: "auto" });
  });
});

// ────── validateMode ─────────────────────────────────────────────────

describe("validateMode", () => {
  it("returns 'auto' verbatim", () => {
    expect(validateMode("auto")).toBe("auto");
  });

  it("returns 'light' verbatim", () => {
    expect(validateMode("light")).toBe("light");
  });

  it("returns 'dark' verbatim", () => {
    expect(validateMode("dark")).toBe("dark");
  });

  it("rejects undefined → 'auto'", () => {
    expect(validateMode(undefined)).toBe("auto");
  });

  it("rejects null → 'auto'", () => {
    expect(validateMode(null)).toBe("auto");
  });

  it("rejects empty string → 'auto'", () => {
    expect(validateMode("")).toBe("auto");
  });

  it("rejects case variants like 'Auto' → 'auto'", () => {
    expect(validateMode("Auto")).toBe("auto");
  });

  it("rejects unknown strings like 'system' → 'auto'", () => {
    expect(validateMode("system")).toBe("auto");
  });

  it("rejects the number 0 → 'auto'", () => {
    expect(validateMode(0)).toBe("auto");
  });

  it("rejects {} → 'auto'", () => {
    expect(validateMode({})).toBe("auto");
  });

  it("rejects [] → 'auto'", () => {
    expect(validateMode([])).toBe("auto");
  });
});

// ────── readThemePrefs ───────────────────────────────────────────────
//
// Defensive across every plausible localStorage failure mode. Always returns
// a valid ThemePrefs — never throws.

describe("readThemePrefs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns DEFAULT_THEME_PREFS when localStorage is undefined", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("returns DEFAULT_THEME_PREFS when getItem returns null", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
    });
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("returns DEFAULT_THEME_PREFS when getItem throws (private browsing)", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => {
        throw new Error("private browsing");
      }),
    });
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("returns DEFAULT_THEME_PREFS when stored value is malformed JSON", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "not json") });
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("returns DEFAULT_THEME_PREFS when parsed JSON is null", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "null") });
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("returns DEFAULT_THEME_PREFS when parsed JSON is a primitive (42)", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "42") });
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("returns DEFAULT_THEME_PREFS when parsed JSON is an array", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "[]") });
    expect(readThemePrefs()).toEqual(DEFAULT_THEME_PREFS);
  });

  it("falls back to 'auto' when mode field is a case-variant ('Auto')", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ mode: "Auto" })),
    });
    expect(readThemePrefs()).toEqual({ mode: "auto" });
  });

  it("falls back to 'auto' when mode field is a number", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ mode: 1 })),
    });
    expect(readThemePrefs()).toEqual({ mode: "auto" });
  });

  it("falls back to 'auto' when mode field is missing", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => JSON.stringify({})) });
    expect(readThemePrefs()).toEqual({ mode: "auto" });
  });

  it("round-trips 'auto'", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ mode: "auto" })),
    });
    expect(readThemePrefs()).toEqual({ mode: "auto" });
  });

  it("round-trips 'light'", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ mode: "light" })),
    });
    expect(readThemePrefs()).toEqual({ mode: "light" });
  });

  it("round-trips 'dark'", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ mode: "dark" })),
    });
    expect(readThemePrefs()).toEqual({ mode: "dark" });
  });
});
