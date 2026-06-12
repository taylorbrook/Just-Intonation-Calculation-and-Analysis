/**
 * sonicweave.ts — the single Phase-7 boundary between the SonicWeave DSL and the
 * JI math kernel (GEN-06..GEN-09). Every Phase-7 widget (rank-2, well-temperament,
 * Fokker, free-text) composes a SonicWeave source string and calls this ONE adapter.
 *
 * What it does:
 *   1. Caps input size FIRST (T-07-01): reuse `MAX_SCALE_TEXT_BYTES` (8 KB) from
 *      url.ts — checked BEFORE `evaluateSource`, so an oversized program never
 *      reaches the parser.
 *   2. Evaluates the source via `evaluateSource(src)` (the prelude is included by
 *      default), wrapped in try/catch → structured `{ scale: null, error }`
 *      (D-18 / T-07-04: NEVER throws to the caller).
 *   3. Maps each `.currentScale` Interval to the kernel's BigInt `Interval`,
 *      DISCRIMINATING exact-rational from tempered via the runtime-verified
 *      `iv.value.isFractional()` getter (T-07-03):
 *        - fractional  → R-01 round-trip through the `${n}/${d}` string into a
 *          fresh kernel `Interval` (the SonicWeave `Fraction`/`Interval` object
 *          NEVER crosses the boundary — T-07-02).
 *        - non-fractional (tempered/irrational) → cents-of-record:
 *          `new Interval(centsToRatio(iv.totalCents()))` and set `tempered = true`,
 *          mirroring the Phase-6 `edScale` tempered idiom. No float-derived ratio
 *          is ever presented as exact JI.
 *   4. Guards `out.length === 0` (Pitfall 5) BEFORE `new Scale(out)` (which throws
 *      on empty) → structured error.
 *
 * D-13 unison convention: SonicWeave's `currentScale` omits the implicit 1/1
 * unison (a `rank2`/`cps` scale starts on its first non-unison degree and ends on
 * the period). The kernel convention (parseScala D-13, buildMos, cps) keeps the
 * leading 1/1, so we prepend it when the first interval is not already the unison.
 * This makes the adapter's output FUNGIBLE with `buildMos`/`cps` (exact n/d, length
 * and per-interval `iv.equals()`), which the cross-check tests assert.
 *
 * Why NOT the `value instanceof <TimeReal>` check (blueprint A4): VERIFIED WRONG
 * this phase. A cents-based tempered interval (quarter-comma meantone) carries a
 * `TimeMonzo`, not the real-valued class — yet it is irrational and `.toFraction()`
 * throws on it. `isFractional()` is a documented public boolean on BOTH value
 * classes and is the correct discriminator (07-RESEARCH Pattern 1 + Pitfall).
 *
 * Three-layer purity: pure data — no DOM, no audio. The widgets (Plans 02/03) and
 * the page registration (Plan 04) consume the `{ scale, tempered, error? }` contract.
 * R-01: imports `Interval` (BigInt `Fraction` from fraction.js) — never xen-dev-utils'
 * Number-backed `Fraction`.
 */

// Plan 04 deviation (Rule 3 — blocking issue): import via the `npm:` prefix.
// Observable Framework resolves bare specifiers ("sonic-weave") through Node's
// CJS loader, which enforces the package's "exports" field. sonic-weave@0.14.1
// declares an "exports" map with only `import`/`types` conditions (no `require`
// or unconditional `default`), so Framework's `require.resolve` throws
// ERR_PACKAGE_PATH_NOT_EXPORTED the moment a BUILT page imports a module that
// imports sonic-weave bare. Plans 01–03 never tripped this because no page
// imported the adapter/widgets; Plan 04 is the first page to reach it. Framework's
// documented workaround is the `npm:` prefix (routed through jsDelivr `+esm`),
// matching the existing `npm:sw-synth` / `npm:ji-lattice` treatment. vitest.config.ts
// aliases `npm:sonic-weave` → `sonic-weave` so unit tests still resolve the local install.
import { evaluateSource } from "npm:sonic-weave";
import { Interval } from "./interval.js";
import { Scale } from "./scale.js";
import { centsToRatio } from "./cents.js";
import { MAX_SCALE_TEXT_BYTES } from "./url.js";

/** The unison 1/1 — prepended when SonicWeave's currentScale omits it (D-13). */
const UNISON = new Interval("1/1");

/**
 * The adapter's return contract. Every Phase-7 widget destructures this.
 *   - `scale`    — the kernel Scale, or `null` on any failure (cap, parse, empty).
 *   - `tempered` — `true` if ANY interval was non-fractional (cents-of-record).
 *   - `error`    — present only on failure; a human-readable, non-empty message.
 */
export interface SonicWeaveResult {
  scale: Scale | null;
  tempered: boolean;
  error?: string;
}

/**
 * Evaluate a SonicWeave source string and map its `.currentScale` to a kernel
 * Scale. See the module header for the full contract. Never throws — all failure
 * modes return a structured `{ scale: null, tempered, error }`.
 */
export function scaleFromSonicWeave(src: string): SonicWeaveResult {
  // STEP 1 — input-size cap FIRST (T-07-01), before the parser ever runs.
  if (new TextEncoder().encode(src).length > MAX_SCALE_TEXT_BYTES) {
    return {
      scale: null,
      tempered: false,
      error: "Expression exceeds the 8 KB input cap.",
    };
  }

  // STEP 2 — evaluate; any parse/eval error becomes a structured return (D-18).
  let visitor;
  try {
    visitor = evaluateSource(src);
  } catch (e) {
    return {
      scale: null,
      tempered: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // STEP 3 — map currentScale → kernel Intervals with the isFractional() discriminator.
  const out: Interval[] = [];
  let tempered = false;
  for (const iv of visitor.currentScale) {
    if (iv.value.isFractional()) {
      // Exact rational: R-01 round-trip via the n/d string — the SonicWeave
      // Fraction object NEVER crosses into the kernel (T-07-02).
      const f = iv.toFraction();
      out.push(new Interval(`${String(f.n)}/${String(f.d)}`));
    } else {
      // Tempered/irrational: cents is the source of record (Pitfall #1 / T-07-03).
      // No exact ratio exists; we project cents → ratio for display/audio only.
      tempered = true;
      out.push(new Interval(centsToRatio(iv.totalCents())));
    }
  }

  // STEP 4 — empty-scale guard BEFORE new Scale([]) (which throws — Pitfall 5).
  if (out.length === 0) {
    return { scale: null, tempered, error: "Expression produced an empty scale." };
  }

  // D-13: prepend the kernel-convention unison if SonicWeave omitted it, so the
  // output is fungible with buildMos / cps (exact n/d, length, iv.equals()).
  const first = out[0];
  if (!first || !first.equals(UNISON)) {
    out.unshift(new Interval("1/1"));
  }

  return { scale: new Scale(out), tempered };
}
