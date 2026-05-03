# Tuning Systems

A research notebook + JI calculator built on Observable Framework.

## Bootstrap proof

The page below is intentionally trivial — it exists only to confirm that the
full Phase 1 stack is wired up end-to-end:

- Observable Framework reactive cells work
- `npm:` imports resolve through the build
- `fraction.js` v5 (BigInt-backed) is what actually loads, not v4
- TypeScript strict mode (`strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `exactOptionalPropertyTypes`) accepts the code
- `npm run dev`, `npm run build`, and the four CI gates all pass

Phase 2 will replace this page with the real piece dashboard and
layer in the math kernel proper.

```ts
import {Fraction} from "npm:fraction.js";

// 81/79 — the project's running JI demo ratio.
// Stored as an exact BigInt-backed Fraction (Pitfall #1: Fraction is the source
// of truth; cents is a *display projection only*, derived lazily and never
// re-parsed back into ratios).
const ratio = new Fraction("81/79");

// Numerator / denominator are BigInts in fraction.js v5. If we accidentally
// loaded v4, both would be Numbers and these assertions would still pass —
// but a far-larger ratio (e.g., 2147483648/2147483647) would lose precision.
// The pin in package.json (D-17) is what protects us; this is just a sanity
// print so the user can confirm visually.
const numType = typeof ratio.n;
const denType = typeof ratio.d;

// Cents is a display projection — float math is fine here, NEVER as input
// to a kernel function (Phase 2 rule: no `cents: number` parameter in src/lib/
// other than `Interval.fromCents()` which is explicitly lossy).
const cents = 1200 * Math.log2(Number(ratio.valueOf()));
const centsStr = cents.toFixed(2);
```

The ratio is **${ratio.toFraction()}** ≈ **${centsStr}¢**.

Internal types: numerator is a `${numType}`, denominator is a `${denType}` — both should read `bigint` (proves fraction.js v5).

```ts
display(`${ratio.toFraction()} ≈ ${centsStr}¢ (numerator: ${numType}, denominator: ${denType})`);
```
