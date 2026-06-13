/**
 * constant-structure.ts — exact BigInt constant-structure check (GEN-10, D-14/D-20).
 *
 * `isConstantStructure(scale)` returns `{ cs, ambiguousAt? }`. A scale has CONSTANT
 * STRUCTURE iff every distinct interval value subtends a UNIQUE number of scale steps —
 * i.e. you can tell an interval's CLASS (how many steps it spans) purely from its SIZE.
 * This is the D-14 readout source: "✓ constant structure" / "✗ not CS (ambiguous at …)".
 *
 * Why a new kernel helper instead of the SonicWeave builtin (D-20): sonic-weave ships
 * `hasConstantStructure` both as a JS function (tools.js) and as a prelude builtin, but
 * neither is cleanly reachable from our kernel boundary — the `scaleFromSonicWeave`
 * adapter only returns a `Scale`, and the builtin pushes its boolean onto the SonicWeave
 * scale (awkward to read back through the `{ scale, tempered }` contract) AND gives no
 * "ambiguous at X" detail. This ~30-LOC helper ports the SAME subtension-uniqueness
 * algorithm (tools.js `hasConstantStructure`) onto the already-built kernel `Scale`,
 * staying entirely on the exact BigInt path and surfacing the colliding step-counts.
 *
 * EXACTNESS — the whole reason for a kernel helper (Pitfall #1 / #6): all interval
 * comparisons go through `Interval.equals` (BigInt Fraction equality), NEVER the float
 * cents projection within epsilon. A cents-epsilon implementation would wrongly conflate two distinct
 * intervals that happen to land within a fraction of a cent (e.g. 568/505 vs 9/8, ~0.38¢
 * apart) and falsely report non-CS. cents is FORBIDDEN as an input here.
 *
 * Algorithm (port of sonic-weave tools.js `hasConstantStructure`): the kernel `Scale`
 * carries a leading 1/1 and the period last (D-13/D-14); tools.js operates on `degrees`
 * = the intervals WITHOUT the implicit 1/1 but WITH the period at the end. We strip the
 * leading unison, then:
 *   1. Build an EXTENDED scale: each degree plus (period × degree), so wrap-around
 *      spans across the period boundary are measured exactly.
 *   2. Record every interval-from-unison and every step-span `ext[i+j] / ext[i]` with its
 *      step-count (subtension). If any interval value recurs under a DIFFERENT subtension,
 *      the scale is not CS — report the colliding pair as `ambiguousAt`.
 *
 * Pure data — no DOM, no audio (three-layer purity). Consumed by src/components/
 * generate-cs.ts (Plan 03) for the D-14 CS-status readout.
 */

import { Interval } from "./interval.js";
import type { Scale } from "./scale.js";

/** The unison 1/1 — stripped from the leading position to match tools.js `degrees`. */
const UNISON = new Interval("1/1");

/**
 * The two colliding interval classes (step-counts) when a scale is NOT constant
 * structure — the same interval value subtends both `intervalClassA` and
 * `intervalClassB` steps. Rendered by the Plan-03 readout as "ambiguous at A/B".
 */
export interface ConstantStructureResult {
  cs: boolean;
  ambiguousAt?: { intervalClassA: number; intervalClassB: number };
}

/**
 * GEN-10 / D-14 / D-20: does `scale` have constant structure? Exact BigInt
 * subtension-uniqueness counting on the built kernel `Scale` — `Interval.equals`
 * for every comparison (NEVER cents-epsilon).
 *
 * @returns `{ cs: true }` if every interval has a unique subtension; otherwise
 *   `{ cs: false, ambiguousAt: { intervalClassA, intervalClassB } }` naming the two
 *   step-counts that the first colliding interval value spans.
 */
export function isConstantStructure(scale: Scale): ConstantStructureResult {
  // Strip the leading 1/1 (kernel convention D-13) to match tools.js `degrees`:
  // intervals WITHOUT the implicit unison, WITH the period at the end. Equality via
  // Interval.equals (BigInt) — NEVER cents.
  const degrees: Interval[] = [...scale.intervals];
  const first = degrees[0];
  if (first && first.equals(UNISON)) {
    degrees.shift();
  }

  const n = degrees.length;
  if (n === 0) {
    // Trivial scale (only the unison) is vacuously CS.
    return { cs: true };
  }

  const period = degrees[n - 1]!;

  // Extended scale: each degree plus (period × degree) for wrap-around spans.
  const ext: Interval[] = [...degrees];
  for (const d of degrees) {
    ext.push(period.mul(d));
  }

  // [interval value, subtension (step-count)] pairs, compared by exact BigInt equality.
  const subtensions: { interval: Interval; subtension: number }[] = [];

  // Against 1/1: ext[i] is the interval from the unison spanning (i + 1) steps.
  for (let i = 0; i < n; i++) {
    const cur = ext[i]!;
    const prior = subtensions.find((s) => s.interval.equals(cur));
    if (prior) {
      // Same value already recorded under a different subtension → not CS.
      return {
        cs: false,
        ambiguousAt: { intervalClassA: i + 1, intervalClassB: prior.subtension },
      };
    }
    subtensions.push({ interval: cur, subtension: i + 1 });
  }

  // Against each other: ext[i+j] / ext[i] is a span of j steps.
  for (let i = 0; i < n - 1; i++) {
    for (let j = 1; j < n; j++) {
      const width = ext[i + j]!.div(ext[i]!);
      let unique = true;
      for (const { interval, subtension } of subtensions) {
        if (width.equals(interval)) {
          if (subtension !== j) {
            return {
              cs: false,
              ambiguousAt: { intervalClassA: j, intervalClassB: subtension },
            };
          }
          unique = false;
          break;
        }
      }
      if (unique) {
        subtensions.push({ interval: width, subtension: j });
      }
    }
  }

  return { cs: true };
}
