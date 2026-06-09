// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";

// The CustomEvent broadcast half of the scale-store spec. Lives in its own file
// because the environment directive is file-scoped in Vitest — the read/write
// validation lives in scale-store.test.ts (node env). Mirrors the CustomEvent
// idiom in src/theme/__tests__/theme-prefs.test.ts / RESEARCH Pattern 1.
import { writeSharedScale, SCALE_CHANGED_EVENT } from "../scale-store.js";

describe("writeSharedScale CustomEvent broadcast (SYNC-01/02 transport)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dispatches exactly one CustomEvent with detail deep-equal { text, source }", () => {
    const handler = vi.fn();
    window.addEventListener(SCALE_CHANGED_EVENT, handler);
    writeSharedScale("9/8\n2/1", "placeholder");
    expect(handler).toHaveBeenCalledTimes(1);
    const ev = handler.mock.calls[0]![0] as CustomEvent<{ text: string; source?: string }>;
    expect(ev.detail).toEqual({ text: "9/8\n2/1", source: "placeholder" });
    window.removeEventListener(SCALE_CHANGED_EVENT, handler);
  });

  it("dispatches with detail { text } when source is omitted", () => {
    const handler = vi.fn();
    window.addEventListener(SCALE_CHANGED_EVENT, handler);
    writeSharedScale("5/4\n2/1");
    expect(handler).toHaveBeenCalledTimes(1);
    const ev = handler.mock.calls[0]![0] as CustomEvent<{ text: string; source?: string }>;
    expect(ev.detail).toEqual({ text: "5/4\n2/1" });
    window.removeEventListener(SCALE_CHANGED_EVENT, handler);
  });

  it("fires the event even when persistence throws (live-update is best-effort, RESEARCH A2)", () => {
    // setItem throws (private browsing) — the broadcast must still fire so an
    // already-open consumer tab updates live regardless of persistence.
    vi.stubGlobal("localStorage", {
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
    });
    const handler = vi.fn();
    window.addEventListener(SCALE_CHANGED_EVENT, handler);
    expect(() => writeSharedScale("9/8\n2/1", "generate")).not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
    const ev = handler.mock.calls[0]![0] as CustomEvent<{ text: string; source?: string }>;
    expect(ev.detail).toEqual({ text: "9/8\n2/1", source: "generate" });
    window.removeEventListener(SCALE_CHANGED_EVENT, handler);
  });

  it("does NOT fire the event when text exceeds the 8 KB cap (silent no-op)", () => {
    const handler = vi.fn();
    window.addEventListener(SCALE_CHANGED_EVENT, handler);
    const oversized = "x".repeat(8192 + 1);
    expect(() => writeSharedScale(oversized, "generate")).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener(SCALE_CHANGED_EVENT, handler);
  });
});
