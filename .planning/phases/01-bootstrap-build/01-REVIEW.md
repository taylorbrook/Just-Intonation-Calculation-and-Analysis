---
phase: 01-bootstrap-build
reviewed: 2026-05-03T05:48:07Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - .eslintignore
  - .github/workflows/deploy.yml
  - .gitignore
  - .nvmrc
  - .prettierignore
  - .prettierrc
  - README.md
  - eslint.config.js
  - observablehq.config.ts
  - package.json
  - src/index.md
  - src/lib/INVENTORY.md
  - src/lib/__tests__/example.test.ts
  - src/lib/example.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  blocker: 1
  warning: 5
  info: 5
  total: 11
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-03T05:48:07Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 1 bootstrap is mostly clean and conforms to D-02 through D-21. The TypeScript stub (`src/lib/example.ts`) and its colocated Vitest test are correct. `tsconfig.json` enables every D-16 strict flag. `package.json` exact-pins `fraction.js@5.3.4` and `@observablehq/framework@1.13.4` per D-17, omits `mathjs` and `temperaments` per D-21, and the deploy workflow has a defense-in-depth deny-list check.

However, one BLOCKER stands out: a `.eslintignore` file was committed, but ESLint 9 flat config has dropped `.eslintignore` entirely — it is silently ignored. The file is dead weight that will mislead future maintainers into editing it expecting it to take effect. Several WARNING-level items follow, mostly around format-check coverage gaps that will silently let documentation drift escape the CI gates the phase explicitly set up.

## Blocker Issues

### BL-01: `.eslintignore` is silently ignored under ESLint 9 flat config

**File:** `.eslintignore:1-4`
**Issue:** ESLint 9 with flat config (`eslint.config.js`) **does not read `.eslintignore`** — the file format was removed in v9. All ignore patterns must live inside the flat config's `ignores` key. The committed `.eslintignore` does nothing at runtime; whoever next adds an ignore pattern there will silently fail to ignore anything.

The patterns happen to be duplicated inside `eslint.config.js` (lines 13–20), so today nothing breaks. But the file's presence is a trap — it actively misinforms about how lint scoping works in this repo, and a future maintainer editing it (rather than the flat config) will produce CI-passing-but-actually-broken results.

D-12 explicitly chose flat config; `.eslintignore` is a v8-era artifact that should not exist alongside `eslint.config.js`.

**Fix:** Delete `.eslintignore`. The equivalent ignores already live in `eslint.config.js` lines 13–20. If you want a single source of truth, keep them in the flat config only.

```bash
git rm .eslintignore
```

If you want a parallel fence (e.g., to make ignores visible without opening JS), instead move the patterns into a `.gitattributes`-style comment in `eslint.config.js` or document them in CLAUDE.md.

## Warnings

### WR-01: `.prettierignore` excludes ALL markdown — drift in `README.md`, `src/index.md`, and `INVENTORY.md` will not be caught by `format:check`

**File:** `.prettierignore:5`
**Issue:** Line 5 globs `*.md`, which excludes every markdown file in the repo from `prettier --check .`. This means:

- `README.md` (D-20 deliverable) — never format-checked
- `src/index.md` (D-14 deliverable, contains TS code blocks) — never format-checked
- `src/lib/INVENTORY.md` (D-08 deliverable) — never format-checked

D-12 says "Don't lint markdown JS code blocks" — that's about ESLint, not Prettier. Prettier formatting prose markdown (and TS fenced code inside markdown) is a separate concern. Excluding all `.md` from the format gate means the CI gate D-10 (4) is partially defeated for the most-edited file types in a research-notebook project, where markdown is the primary surface.

If the intent was to avoid Prettier reformatting fenced TS/JS inside reactive cells (Framework owns transpilation), the surgical fix is to disable Prettier per code-block via `<!-- prettier-ignore -->`, not to opt out of all markdown.

**Fix:** Remove `*.md` from `.prettierignore`. Then run `npm run format` once to normalize, and verify nothing in `src/index.md`'s fenced TS cells is reformatted in a way that breaks the page. If a specific cell needs to stay verbatim, add `<!-- prettier-ignore -->` immediately above its fence.

```diff
 node_modules/
 dist/
 .observablehq/
 package-lock.json
-*.md
```

### WR-02: Workflow grants `pages: write` and `id-token: write` to the `build` job, which only needs `contents: read`

**File:** `.github/workflows/deploy.yml:17-20`
**Issue:** Permissions are declared at workflow level, so the `build` job inherits `pages: write` and `id-token: write` even though only the `deploy` job needs them. Per GitHub's first-party Pages recipe (and the principle of least privilege), `pages: write` and `id-token: write` should be scoped to the `deploy` job only. A compromised dependency in `npm ci` during build would otherwise have token-mint capability it doesn't need.

This isn't a critical security hole on a personal project, but it weakens the supply-chain posture the workflow is otherwise careful about (e.g., pinning to GitHub-first-party actions only).

**Fix:** Move `pages: write` and `id-token: write` into the `deploy` job, leave `contents: read` at workflow level.

```yaml
permissions:
  contents: read

jobs:
  build:
    name: Build and run gates
    runs-on: ubuntu-latest
    # build needs no extra perms
    steps: ...

  deploy:
    name: Deploy to GitHub Pages
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    permissions:
      pages: write
      id-token: write
    runs-on: ubuntu-latest
    ...
```

### WR-03: Pages artifact is uploaded by the `build` job but `deploy` job does not re-checkout — fragile coupling, and PR runs needlessly produce upload steps

**File:** `.github/workflows/deploy.yml:69-87`
**Issue:** The split between "build uploads artifact" and "deploy consumes artifact" is correct in pattern, but two coupling risks exist:

1. The `if:` condition guarding `Configure Pages` and `Upload Pages artifact` (lines 66, 70) is duplicated and must stay in lock-step with the `deploy` job's `if:` (line 78). If one is edited and the other not, you get either a wasted artifact upload on PRs (forbidden by D-03) or a deploy with no artifact. A single workflow-level guard or a job-level `if:` on `build` for those steps would be more robust.

2. `actions/configure-pages@v5` runs in `build` but its outputs are not consumed in `deploy` — the `deploy-pages@v4` action picks up the artifact by name. If `configure-pages` is meant to be in `deploy` (which is the official pattern), put it there.

This is not a correctness bug today, but it's a structural fragility worth fixing before more workflow logic accretes.

**Fix:** Move `Configure Pages` to the `deploy` job. Keep `Upload Pages artifact` in `build` (it produces the artifact that `deploy-pages` consumes), but factor the `if:` into a single workflow-level expression or a job-output. Reference: GitHub's official "Publishing with a custom GitHub Actions workflow" example puts `configure-pages` in the deploy job.

### WR-04: Inline deny-list `node -e` script does not match the spirit of D-21 — only checks two packages by name, missing `fractional`, `BigRational.js`, `tonal`, `tonaljs`, `tune.js`

**File:** `.github/workflows/deploy.yml:57-60`
**Issue:** D-21 (and CLAUDE.md "What NOT to Use") forbids more than just `mathjs` and `temperaments`:

- `fractional` (Number-backed, silently lossy)
- `BigRational.js` (unmaintained)
- `tonal.js` / `tonaljs` (wrong domain)
- `tune.js`, `monochord-core`, `mosfez-synth`, `microtonal` (unmaintained 2017–2022 packages)

The current check at line 60 only catches `temperaments` and `mathjs`. Any of the other forbidden packages can be `npm install`-ed without the deny-list firing. For a "defense-in-depth" gate, this is meaningfully under-defending.

Also: the script does not check transitive deps via `package-lock.json`, only direct deps. A package depending on `mathjs` would slip through. (That may be intentional — direct-only is the pragmatic line — but it should be a documented choice.)

**Fix:** Expand the forbidden list and consider both direct and transitive deps. A more robust check:

```yaml
- name: Phase 1 deny-list check (D-21)
  run: |
    node -e "
      const lock = require('./package-lock.json');
      const forbidden = ['mathjs','temperaments','fractional','tonal','@tonaljs/tonal','tune.js','monochord-core','mosfez-synth','microtonal','BigRational.js'];
      const found = forbidden.filter(p => lock.packages?.['node_modules/' + p]);
      if (found.length) { console.error('FORBIDDEN deps present:', found.join(', ')); process.exit(1); }
    "
```

(Adjust the lockfile lookup if your npm version uses a different schema.)

### WR-05: `eslint.config.js` ignores `dist/**` and `.observablehq/**` but not `src/lib/INVENTORY.md` directly — and the file pattern is broader than needed

**File:** `eslint.config.js:13-20`
**Issue:** Two related issues:

1. The ignore `src/**/*.md` (line 18) is correct for the goal (don't lint markdown), but the type-checked rules block at line 22–25 only matches `src/**/*.ts` and `src/**/*.js` anyway, so the markdown ignore is redundant defense. Not wrong, but worth knowing.

2. ESLint 9 flat config does NOT automatically respect `.gitignore` (unlike v8 with default settings). So the `dist/**` and `.observablehq/**` ignores in `eslint.config.js` are load-bearing. Good. But `node_modules/**` is also ESLint's default ignore in v9 — that line is technically redundant (kept for explicitness, which is fine).

3. **The actual issue:** `parserOptions.project: "./tsconfig.json"` (line 30) on `src/**/*.{ts,js}` — but `tsconfig.json` only includes `src/**/*.ts` (no `.js`). If a `.js` file ever lands in `src/`, ESLint's type-aware rules will fail with "ESLint was configured to run on file but the file does not match your project". This is a latent trip-wire for Phase 2 if any `.js` reactive-component file is added.

**Fix:** Either set `allowJs: true` in `tsconfig.json` and add `src/**/*.js` to `include`, or restrict the type-checked block to `.ts` only:

```diff
-    files: ["src/**/*.ts", "src/**/*.js"],
+    files: ["src/**/*.ts"],
```

Given that Phase 2 will likely use `.ts` for kernel and components, restricting to `.ts` is the cheaper fix.

## Info

### IN-01: `src/index.md` — `Number(ratio.valueOf())` is redundant; `valueOf()` already returns a number

**File:** `src/index.md:40`
**Issue:** `fraction.js` v5's `valueOf()` returns a JS `number` (the float approximation), not a BigInt. Wrapping it in `Number(...)` is a no-op. Cosmetic.

**Fix:**
```ts
const cents = 1200 * Math.log2(ratio.valueOf());
```

If the goal was defensive (in case a future fraction.js change returns BigInt), add a comment instead.

### IN-02: `src/index.md` displays the same content twice (inline interpolation + `display()` cell)

**File:** `src/index.md:44, 49`
**Issue:** Line 44 renders `**${ratio.toFraction()}** ≈ **${centsStr}¢**` via Markdown interpolation, then line 49's `display(...)` cell renders essentially the same string a second time. Either is sufficient as a BOOT-04 proof. Pick one.

**Fix:** Drop the second `ts` block and let the markdown inline interpolation be the visible proof, or keep the `display()` and remove line 44's interpolation. Recommendation: keep the interpolation (more idiomatic for Framework prose) and delete the trailing `display()` block.

### IN-03: `vitest.config.ts` — `environment: "node"` is correct for Phase 1 but will need `jsdom` for any DOM-touching kernel test in Phase 2

**File:** `vitest.config.ts:7`
**Issue:** Phase 2 will likely add tests for components that touch the DOM (e.g., DOM factories per D-06 layout). Forewarning, not a defect.

**Fix:** No change in Phase 1. When Phase 2 needs it, switch to `environment: "jsdom"` and add `jsdom` as a devDependency, or use Vitest's per-file `// @vitest-environment jsdom` pragma to avoid blanket-loading jsdom for kernel-only tests.

### IN-04: `tsconfig.json` does not include `eslint.config.js`

**File:** `tsconfig.json:24`
**Issue:** `include` lists `vitest.config.ts` and `observablehq.config.ts` but not `eslint.config.js`. Since `eslint.config.js` is JS, it would need `allowJs: true` to be type-checked. Currently `tsc --noEmit` does not check it. Acceptable — JS configs are typically not type-checked — but worth noting that the type-check gate has a small blind spot at the repo root.

**Fix:** No action required. If you want type-aware checks for `eslint.config.js`, add JSDoc `@type` annotations and `// @ts-check` at the top, or convert it to `eslint.config.ts` (typescript-eslint supports this).

### IN-05: D-context says expected demo output is `81/79 ≈ 43.21¢`; actual computed value is `43.28¢`

**File:** `src/index.md:40-44` (cross-reference: `.planning/phases/01-bootstrap-build/01-CONTEXT.md:87`)
**Issue:** The CONTEXT doc says "renders something like `81/79 ≈ 43.21¢`" but `1200 * log2(81/79) ≈ 43.279¢`, which formats to `43.28¢` at 2 decimals. The page renders the correct value reactively — this is a doc/code mismatch in the CONTEXT, not a code bug. Flagging only because future eyes may diff against the CONTEXT and wonder.

**Fix:** No action needed in the source files under review. If you want consistency, update CONTEXT-D-14 to say `43.28¢`.

---

_Reviewed: 2026-05-03T05:48:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
