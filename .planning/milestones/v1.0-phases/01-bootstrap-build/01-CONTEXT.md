# Phase 1: Bootstrap & Build - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the deployable Observable Framework scaffold — TypeScript with `tsc --noEmit` type-checking, Vitest for unit tests, the xenharmonic-devs npm stack installed and resolving correctly, and a wired GitHub Pages deployment — all the scaffolding required before any kernel code lands in Phase 2.

**In scope:**
- Framework project initialized via `npx @observablehq/framework create`
- TypeScript + `tsc --noEmit` standalone type-check script
- Vitest configured against a stub `src/lib/` module
- xen-dev stack installed: `xen-dev-utils`, `sw-synth`, `ji-lattice`, `sonic-weave`, `fraction.js` v5 (transitive but pinned)
- GitHub Pages deployment wired with auto-deploy on push to `main`
- ESLint 9 (flat config) + `@typescript-eslint` + Prettier configured and gating CI
- Single `index.md` "hello" page that proves the full stack lights up end-to-end

**Out of scope (Phase 2+ work):**
- Any kernel math (`Interval`, `Scale`, monzo, cents) — Phase 2
- Audio playback, Web Audio integration — Phase 2
- The composition page proper — Phase 2
- Any visualization (lattice, diamond, keyboard) — Phase 3
- `temperaments` package install (peer-dep mismatch with `xen-dev-utils@0.13`; revisit when actually needed)
- Custom domain DNS / CNAME wiring — deferred until/if site is shared more widely
- Pre-commit hooks (husky / lefthook / lint-staged) — CI alone is enough at this stage

</domain>

<decisions>
## Implementation Decisions

### Deployment

- **D-01:** Host is **GitHub Pages**. (Cloudflare Pages was the alternative; user picked GitHub for keeping it close to the repo and avoiding a new vendor.)
- **D-02:** Single GitHub Actions workflow runs `npm ci → npm run lint:types → npm run test → npm run build → upload-pages-artifact → deploy-pages` on every push to `main`. Type-check + tests + lint + format-check are deploy gates — a failed gate blocks deploy.
- **D-03:** PRs run the same gates **without** the deploy step (build + upload artifact only on `main`).
- **D-04:** Default `*.github.io/<repo>` URL for v1. No custom domain wiring in Phase 1. (Defer DNS/CNAME until the site is being shared.)
- **D-05:** Framework's `observable deploy` command is **not** used (deprecated since v1.13.3, points at the retired Observable Cloud). Static `observable build` output → `dist/` → uploaded to Pages.

### Repo + Module Layout

- **D-06:** Use Framework's **default layout**. `root` stays at `src/`. Pages and code coexist:
  ```
  src/
    index.md          # landing
    lib/              # pure kernel (Phase 2 fills this)
      INVENTORY.md    # lib surface area, per NOTES-04
      __tests__/      # Vitest co-located with lib
    components/       # DOM factories (Phase 2 fills this)
    data/             # data loaders (*.json.ts → *.json)
  observablehq.config.ts
  package.json
  tsconfig.json
  vitest.config.ts
  eslint.config.js
  .prettierrc
  .github/workflows/deploy.yml
  ```
- **D-07:** Tests live **co-located** under `src/lib/__tests__/`, not at top-level `tests/`. Keeps the kernel and its tests together; Vitest config excludes them from the Framework build via `vitest.config.ts` test glob.
- **D-08:** `src/lib/INVENTORY.md` is created as an empty stub in Phase 1 (per NOTES-04, populated in Phase 2). Establishes the file's existence and location early so Phase 2 doesn't re-decide.
- **D-09:** A stub kernel module (e.g. `src/lib/example.ts` exporting one trivial function) exists in Phase 1 only as a Vitest target so BOOT-03 can be verified. Phase 2 will replace/expand it.

### CI + Lint Scope

- **D-10:** CI gates on push/PR (all four):
  - `tsc --noEmit` (BOOT-02 — required)
  - `vitest run` (BOOT-03 — required)
  - `eslint .` (ESLint 9 flat config + `@typescript-eslint`)
  - `prettier --check .`
- **D-11:** **No pre-commit hooks** in Phase 1. CI alone is the gate. Editor format-on-save is the local fast path. Re-evaluate if formatting drift becomes a real problem.
- **D-12:** ESLint flat config uses `@typescript-eslint/recommended-type-checked` as the baseline. Don't lint markdown JS code blocks (Framework transpiles those — linting them fights the runtime). Glob: `src/**/*.{ts,js}` excluding `src/**/*.md`.
- **D-13:** `package.json` scripts:
  - `dev` → `observable preview`
  - `build` → `observable build`
  - `lint:types` → `tsc --noEmit`
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `lint` → `eslint .`
  - `format` → `prettier --write .`
  - `format:check` → `prettier --check .`
  - `ci` → runs lint:types + test + lint + format:check + build (used by Actions and locally)

### Phase 1 "Done" Content

- **D-14:** `npm run dev` at end of Phase 1 shows a single `src/index.md` that imports `Fraction` from `fraction.js` and renders something like `81/79 ≈ 43.21¢`. This single page proves:
  - Framework reactive cells work
  - npm-imported xen-dev stack resolves
  - BigInt-backed v5 `Fraction` is what actually loads (not v4 silently)
  - The TS toolchain is happy
- **D-15:** No skeleton pages for `composition.md` / `theory.md` are pre-created in Phase 1. Phase 2 owns those. Avoids stub content that drifts.

### Claude's Discretion (locking sensible defaults; flag in plan-phase if any need to change)

- **D-16:** **TS strictness:** `tsconfig.json` uses `strict: true` + `noUncheckedIndexedAccess: true` + `noImplicitOverride: true` + `exactOptionalPropertyTypes: true` from day 1. Locking these now is far cheaper than retrofitting after the kernel exists.
- **D-17:** **Package version pinning:** Use caret ranges in `package.json` (npm default) plus `package-lock.json` committed. Pin exact versions only for `@observablehq/framework` and `fraction.js` (the two packages where a silent minor bump is most likely to cause subtle breakage).
- **D-18:** **Node version pin:** `.nvmrc` set to `20` (LTS). `package.json#engines.node` set to `>=20`.
- **D-19:** **`.gitignore`:** `node_modules/`, `dist/`, `.observablehq/cache/`, `*.log`, `.env*`, `.DS_Store`. No `src/.observablehq` ignore — Framework manages that under `.observablehq/` already.
- **D-20:** **`README.md`:** Bare-minimum: project name, one-line description, `npm install && npm run dev` quickstart, link to deployed site, link to `.planning/PROJECT.md`. No CONTRIBUTING.md / CHANGELOG / docs site in Phase 1.
- **D-21:** **No `mathjs` or `temperaments`** installed in Phase 1. Both are deferred per CLAUDE.md guidance. Adding them when actually needed avoids bundle bloat and the `temperaments` peer-dep conflict.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level guidance
- `CLAUDE.md` — Tech stack section is the source of truth for package picks, version compatibility table, "What NOT to use" list, and Observable Framework conventions. Specifically:
  - "Recommended Stack" table — pin versions and roles
  - "Version Compatibility" table — peer-dep concerns, esp. `temperaments` mismatch
  - "Observable Framework Conventions" — `.ts` imports as `.js`, data loader pattern, `import` rules
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list, key decisions table
- `.planning/REQUIREMENTS.md` — BOOT-01 through BOOT-05 are the requirements this phase satisfies; do not over-deliver into MATH/SCALE/IO/AUDIO/NOTES/COMP territory
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 items); they are the verification target

### Framework + stack research
- `.planning/research/STACK.md` — full rationale for every package pick (used by future research/plan)
- `.planning/research/ARCHITECTURE.md` — kernel/components separation guidance (NOTES-04)
- `.planning/research/PITFALLS.md` — known gotchas to avoid in setup
- `.planning/research/FEATURES.md` — feature → package mapping
- `.planning/research/SUMMARY.md` — research overview

### External (read on demand during planning, not preloaded)
- Observable Framework docs: https://observablehq.com/framework/getting-started — install + scaffold flow
- Observable Framework deploying docs: https://observablehq.com/framework/deploying — static-host targets, GitHub Pages workflow recipe
- Observable Framework JavaScript docs: https://observablehq.com/framework/javascript — TS/.ts file rules, `.js` import extension requirement
- `fraction.js` v5 README on GitHub — confirm BigInt-backed numerator/denominator API
- `xen-dev-utils` npm page — verify `Fraction` re-export from `fraction.js`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **None.** Empty repo. Project root contains only `CLAUDE.md` and `.planning/`. Phase 1 is greenfield setup — no patterns to inherit from prior code.

### Established Patterns
- **From CLAUDE.md (project-level lock-ins, treat as established before any code exists):**
  - Import `.ts` modules using the `.js` extension (`import { x } from './lib/foo.js'`) — Framework runtime requirement
  - Data loaders: `foo.json.ts` produces a build-time `foo.json`; access via `FileAttachment`
  - Don't construct `AudioContext` at module top-level (Phase 2+ rule, but worth noting in Phase 1 README/CLAUDE-level docs)
  - Reactive cells use Observable's reactivity — top-level `const` declarations are visible cross-cell
- **None of these are testable in Phase 1** (no kernel code yet) but they constrain the directory structure being set up.

### Integration Points
- **GitHub Actions ↔ GitHub Pages:** Phase 1's deploy workflow is the only integration point with external infra. Uses GitHub's first-party `actions/upload-pages-artifact` and `actions/deploy-pages` actions — no third-party dependencies in the workflow.
- **`tsc --noEmit` ↔ Framework build:** Two separate compilers — Framework uses esbuild (no type-check), `tsc` is enforcement-only. They must agree on `tsconfig.json` paths but produce no overlapping output.
- **Vitest ↔ Framework build:** Vitest globs MUST exclude markdown pages and the Framework `dist/` directory. Configure once; downstream phases inherit.

</code_context>

<specifics>
## Specific Ideas

- The "hello" index page at end of Phase 1 should compute `81/79` (the user's running JI example) as `Fraction('81/79')` and display the cents value. This is symbolic — proves the BigInt math kernel resolves through Framework end-to-end without writing any project kernel code.
- ESLint's `@typescript-eslint/recommended-type-checked` baseline (not just `recommended`) — type-aware linting catches more, paid for by slightly slower CI. Worth it given strict TS settings.
- Use **GitHub's official Pages workflow pattern** (`actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`), not any third-party action. Lower supply-chain surface.

</specifics>

<deferred>
## Deferred Ideas

- **Custom domain wiring** — DNS / CNAME / HTTPS cert. Defer until the site is being shared more publicly. Owner: a future dedicated phase or a roadmap backlog item.
- **`temperaments` package** — peer-dep mismatch with current `xen-dev-utils@0.13.x`; not needed in Phase 1 or Phase 2. Revisit when Phase 4 (analysis) needs regular-temperament features. May require pinning, vendoring, or forking at that point.
- **Pre-commit hooks (husky / lefthook / lint-staged)** — explicitly deferred. Re-evaluate if format/lint drift becomes a real annoyance after a few weeks of use.
- **CONTRIBUTING.md / CHANGELOG.md / docs site** — out of scope for personal-research framing. Add only if collaboration emerges.
- **Per-PR preview deploys** — would require a Pages-compatible preview action (no first-party support like Vercel/Cloudflare). Not worth the complexity for a personal site.
- **Bundle-size budget / Lighthouse CI** — premature optimization. Revisit if the site gets heavy.

</deferred>

---

*Phase: 1-Bootstrap & Build*
*Context gathered: 2026-05-02*
