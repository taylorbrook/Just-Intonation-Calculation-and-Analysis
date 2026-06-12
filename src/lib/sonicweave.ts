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

// Plan 04 resolution (Rule 3 — blocking issue): import bare `sonic-weave` so
// Observable Framework serves the REAL local build from `/_node/sonic-weave...`
// (the same path that resolves `xen-dev-utils`/`fraction.js`).
//
// Why NOT `npm:sonic-weave`: Framework routes the `npm:` prefix through
// jsDelivr's `+esm` bundle, and jsDelivr CANNOT bundle sonic-weave@0.14.1 —
// `/_npm/sonic-weave@0.14.1/_esm.js` is a stub that only `throw`s
// "Failed to bundle using Rollup v2.79.2…". No exports exist, so every widget
// cell died with `does not provide an export named 'evaluateSource'`. This is an
// upstream jsDelivr/Rollup failure, not fixable from our side — the `npm:` path
// is off the table for this package.
//
// Why bare `sonic-weave` needs a patch: sonic-weave@0.14.1's "exports" map
// declares ONLY `types` + `import` for every subpath (no `require`, no
// `default`). Framework 1.13.4's node-import resolver follows a CJS-style
// resolve that requires a `require` or `default` condition, so it threw
// ERR_PACKAGE_PATH_NOT_EXPORTED on the bare specifier. We patch the package's
// `.` export to add a `default` condition (pointing at the same `./dist/index.js`
// as `import`) via patch-package (see patches/ + the `postinstall` script). With
// that condition present, Framework resolves the bare import and serves
// `/_node/sonic-weave@0.14.1/index.js` — the real, complete build.
import { evaluateSource } from "sonic-weave";
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
      // WR-01 / WR-02: the SonicWeave fraction keeps n/d non-negative and stores
      // the sign in f.s (-1 negative | 0 zero | 1 positive). The n/d round-trip
      // would otherwise LAUNDER a negative rational positive (`-3/2` → `3/2`) and
      // admit the zero interval (`0/1` → -Infinity cents). Fail closed, like
      // parseScala (Pitfall #6). Also neutralizes WR-06 (custom negative rank-2
      // generator). NOTE: f.s / f.n arrive as runtime Numbers here (NOT BigInts
      // as the blueprint assumed), so the zero test goes through Number(f.n) — a
      // strict `f.n === 0n` would silently miss the zero interval (number !== bigint).
      if (f.s < 0n || Number(f.n) === 0) {
        return { scale: null, tempered, error: "Scale contains a non-positive interval." };
      }
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
