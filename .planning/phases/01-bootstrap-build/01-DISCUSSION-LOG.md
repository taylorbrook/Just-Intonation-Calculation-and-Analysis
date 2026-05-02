# Phase 1: Bootstrap & Build - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 1-Bootstrap & Build
**Areas discussed:** Deployment target, Repo + module layout, CI + lint scope, Phase 1 'done' content

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Deployment target | Which host gets wired (Cloudflare Pages, GitHub Pages, Vercel, Netlify) | ✓ |
| Repo + module layout | Default Framework `src/` vs customized `pages/`+`src/` split | ✓ |
| CI + lint scope | tsc + vitest + ESLint + Prettier — and pre-commit hooks or not | ✓ |
| Phase 1 'done' content | What `npm run dev` shows when phase is complete | ✓ |

**User's choice:** All four areas — full discussion.

---

## Deployment Target — Host

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Pages (Recommended) | Free tier, fast CDN, simple GitHub integration, zero-config for Framework static output | |
| GitHub Pages | Closest to git; ships via Actions yaml; no new vendor | ✓ |
| Vercel | Polished UX, preview deploys, but new vendor + bandwidth caps | |
| Netlify | Mature host, similar profile to Cloudflare Pages | |

**User's choice:** GitHub Pages.
**Notes:** Picked over recommended Cloudflare Pages — staying close to the repo and avoiding a new vendor relationship were the deciding factors.

---

## Deployment Target — CI Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Build + deploy on push to main (Recommended) | Single workflow runs gates then deploys on every main push | ✓ |
| Manual deploy via workflow_dispatch | Build runs on push, deploy only on manual trigger | |
| Tag-triggered deploy | Deploy only on git tag, treats site as release artifact | |

**User's choice:** Build + deploy on push to main.

---

## Deployment Target — Domain

| Option | Description | Selected |
|--------|-------------|----------|
| Default *.github.io URL for now (Recommended) | Skip DNS/CNAME work in Phase 1 | ✓ |
| Wire a custom domain in Phase 1 | Configure CNAME / DNS / HTTPS now | |

**User's choice:** Default *.github.io URL.
**Notes:** Custom domain noted as a deferred idea.

---

## Repo + Module Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Framework default: src/ for pages + code (Recommended) | Pages in src/*.md, kernel in src/lib/, components in src/components/, tests co-located | ✓ |
| Customized: pages/ vs src/ split | Framework root: "pages"; code under src/; markdown imports via ../src/lib/foo.js | |
| Top-level tests/ directory | Recommended layout but tests at tests/lib/* instead of src/lib/__tests__/ | |

**User's choice:** Framework default with co-located tests.
**Notes:** Tests co-located under `src/lib/__tests__/`. INVENTORY.md created as empty stub in Phase 1.

---

## CI + Lint Scope — CI Gates

| Option | Description | Selected |
|--------|-------------|----------|
| tsc --noEmit (type-check) | BOOT-02 requirement, non-negotiable | ✓ |
| vitest run (unit tests) | BOOT-03 requirement, non-negotiable | ✓ |
| ESLint 9 (flat) + @typescript-eslint | Type-aware linting baseline | ✓ |
| Prettier --check | Format gate on CI | ✓ |

**User's choice:** All four gates.

---

## CI + Lint Scope — Pre-commit Hooks

| Option | Description | Selected |
|--------|-------------|----------|
| CI gates only (Recommended) | No local hooks; trust editor format-on-save and CI | ✓ |
| husky + lint-staged | Pre-commit prettier+eslint; pre-push tsc+vitest | |
| Lefthook (Go-based) | Same idea, faster, no node-modules dep for the hook | |

**User's choice:** CI gates only.

---

## Phase 1 'Done' Content

| Option | Description | Selected |
|--------|-------------|----------|
| Single 'hello' index page proving build works (Recommended) | index.md with reactive cell importing Fraction from fraction.js, computing 81/79 ≈ 43.21¢ | ✓ |
| Skeleton: index + composition + theory placeholders | Three pages with one-line stubs each | |
| Empty stub — just enough to build | Bare `# Tuning Systems` and nothing else | |

**User's choice:** Single 'hello' page demonstrating end-to-end stack resolution.
**Notes:** Symbolic example uses `81/79` — same JI ratio that motivated the BigInt-Fraction requirement. Proves Framework reactivity + npm xen-dev resolution + BigInt fractions all light up without writing any project kernel code.

---

## Wrap-up

| Option | Description | Selected |
|--------|-------------|----------|
| Write CONTEXT.md (Recommended) | Decisions captured; proceed | ✓ |
| Discuss something else | Open another gray area | |

**User's choice:** Write CONTEXT.md.

---

## Claude's Discretion

These weren't asked but were locked as sensible defaults — flagged in CONTEXT.md so they can be overridden during planning if needed:

- **TS strictness:** `strict: true` + `noUncheckedIndexedAccess` + `noImplicitOverride` + `exactOptionalPropertyTypes` from day 1.
- **Package version pinning:** Caret ranges + committed lockfile; exact pins for `@observablehq/framework` and `fraction.js`.
- **Node version pin:** `.nvmrc` = `20`; `package.json#engines.node` = `>=20`.
- **`.gitignore`:** standard Node + Framework set.
- **`README.md`:** minimum (name, one-liner, quickstart, deploy link).
- **No `mathjs` or `temperaments`** in Phase 1 (deferred per CLAUDE.md).
- **ESLint baseline:** `@typescript-eslint/recommended-type-checked` + don't lint markdown JS code blocks.

## Deferred Ideas

- Custom domain wiring (DNS / CNAME / HTTPS cert)
- `temperaments` package install (peer-dep mismatch; revisit at Phase 4)
- Pre-commit hooks (re-evaluate if drift becomes a problem)
- CONTRIBUTING.md / CHANGELOG.md / docs site
- Per-PR preview deploys
- Bundle-size budget / Lighthouse CI
