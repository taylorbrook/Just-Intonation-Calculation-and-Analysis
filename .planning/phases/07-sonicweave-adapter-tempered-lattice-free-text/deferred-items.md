# Deferred Items — Phase 07

Out-of-scope discoveries logged during execution (not fixed; outside the current task's changes).

## Pre-existing lint/tsc failures (npm: import resolution)

**Discovered:** Plan 07-02 execution (verification step).

`npm run lint` and `npx tsc --noEmit` report errors in pre-existing files that this
plan never touched:

- `src/audio/synth.ts` — `Cannot find module 'npm:sw-synth'`
- `src/components/lattice.ts` — `Cannot find module 'npm:ji-lattice'` + implicit-any
- `src/components/scale-compare.ts` — `Cannot find module 'npm:@observablehq/plot'`
- `src/pages/well-temperament.md` (and other markdown pages) — unsafe-member-access
  on the unresolved `Plot` global inside fenced reactive cells.

These stem from Observable Framework's `npm:` import specifier convention, which the
standalone ESLint/tsc context cannot resolve (Framework resolves them at build time).
They are NOT introduced by Plan 07-02 — `git diff` confirms none of these files were
modified by this plan. The new Plan 07-02 files (`generate-rank2.ts`,
`generate-welltemp.ts`, and their tests) are lint-clean and tsc-clean.

**Disposition:** Out of scope for Plan 07-02 (SCOPE BOUNDARY — pre-existing, unrelated
files). Should be addressed project-wide (e.g. an ESLint/tsc `npm:`-specifier shim or
ignore rule) as a separate maintenance task, not inside a feature plan.

## Well-temperament roster omissions (A1 sourcing)

**Discovered:** Plan 07-02 Task 2.

The D-08 roster lists eight presets (Werckmeister III, Kirnberger III, Vallotti,
Young II, Neidhardt, Kellner, Lehman "Bach", Young I). Only **Vallotti** and
**Werckmeister III** could be verified EXACTLY against the repo's own authoritative
`src/pages/well-temperament.md` (sub-0.01¢ on every degree) this phase. The others
were omitted per the plan's explicit directive ("prefer a smaller verified roster
over an unverified guess; do NOT ship a plausible-but-wrong vector"):

- **Kirnberger III** — a MIXED scheme (four 1/4-syntonic-comma fifths + one schisma
  residue). It is not expressible with a single Pythagorean-comma `wellTemperament`
  call; it needs either a two-comma formulation or the free-text escape hatch (GEN-09,
  Plan 03).
- **Young I/II, Neidhardt, Kellner, Lehman "Bach"** — candidate commaFraction vectors
  did not reproduce the published per-degree cents under the prelude's chain-ordering
  convention within the verification window (e.g. a Kellner candidate landed ~5¢ off
  the published scheme). Their exact chain offsets need dedicated per-preset sourcing.

**Disposition:** Custom mode (11 editable per-fifth fraction fields) already covers all
of these — a user can dial in any historical scheme. A future plan can promote
individually-verified vectors into named presets once each is cross-checked against
published degree cents. Documented in 07-02-SUMMARY.md "Known Stubs / Omissions".
