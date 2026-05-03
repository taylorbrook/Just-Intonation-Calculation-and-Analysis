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

*(empty — populated as kernel primitives are added)*
