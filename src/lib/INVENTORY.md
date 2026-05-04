# Kernel Inventory

Each kernel primitive added to `src/lib/` should be listed here with:
- Function/type name
- Source: custom OR delegates to `xen-dev-utils` / `sonic-weave` / `fraction.js`
- Reason (if custom): why we did NOT use the upstream version

Discipline per Pitfall #5 (PITFALLS.md): wrap, don't reimplement. Before writing any
math primitive in `src/lib/`, grep `xen-dev-utils` source first.

## Phase 1 entries

| Symbol | Source | Notes |
|--------|--------|-------|
| `Fraction` | `fraction.js@5.3.4` (exact pin per D-17) | BigInt-backed rational. Used for the D-14 hello page; will be the foundation of `Interval` in Phase 2. Imported directly from `fraction.js`, not via `xen-dev-utils` re-export, so the version pin is unambiguous. |

## Phase 2 entries

| Symbol | Source | Notes |
|--------|--------|-------|
| `Interval` (class) | Custom (this repo) — wraps `fraction.js@5.3.4` | BigInt-backed source of truth; lazy monzo + cents caches. Per R-01: imports `Fraction` from `fraction.js` directly (NEVER xen-dev-utils' Number-backed `Fraction`). Immutable per D-24 — `mul`, `div`, `inv`, `octaveReduce` return NEW instances. `octaveReduce(period?)` is period-aware (Pitfall #13; default 2/1). |
| `toMonzo`, `monzoToBigNumeratorDenominator`, `primeLimit`, `monzosEqual`, `tenneyHeight`, `wilsonHeight`, `PRIMES` | `xen-dev-utils@0.13.1` | Re-exported via `src/lib/monzo.ts`. R-01 reminder: re-exports list does NOT include `Fraction`. `monzosEqual` is length-tolerant (Pitfall #14). |
| `monzoAdd`, `monzoSub`, `monzoScale` | `xen-dev-utils@0.13.1` (renamed re-exports of `add`/`sub`/`scale`) | Renamed at the boundary so we don't shadow the global `add`/`sub` mathematical reading. |
| `benedettiHeight` | Custom (this repo) | xen-dev-utils ships `tenneyHeight` (log(n*d)) + `wilsonHeight` but not Benedetti (= n*d itself). Computed via `monzoToBigNumeratorDenominator` so the BigInt path is honored before the Number coercion at the end. |
| `oddLimit` | Custom (this repo) | Hand-written from monzo: strip factors of 2 from numerator and denominator, take the larger. |
| `toCents`, `centsFrom12tet` | Custom wrapper / Custom | `toCents` delegates to xen-dev-utils' `valueToCents`/`monzoToCents` based on input type. `centsFrom12tet` is a one-line projection. Pitfall #1: both are display-only — never use cents as kernel input. |
| `COMMAS` (table), `nameForMonzo`, `commaByName` | Custom (this repo) | 16 hand-curated, hand-verified entries per D-21 (5-/7-/11-limit + Mercator's). Lookup by canonical monzo via xen-dev-utils' `monzosEqual` (length-tolerant, Pitfall #14). Cents-within-epsilon lookup is FORBIDDEN per Pitfall #1/#6 — distinct commas (e.g. syntonic ~21.5¢ vs schisma ~1.95¢) must not be conflated by float tolerance. `commaByName` round-trips through `monzoToBigNumeratorDenominator` so even Mercator's 25-digit ratio reconstructs exactly. |
