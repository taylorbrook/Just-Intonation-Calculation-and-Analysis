---
phase: 01-bootstrap-build
plan: 04
subsystem: infra
tags: [github-actions, github-pages, ci, deploy, npm-ci, node-20]

requires:
  - phase: 01-bootstrap-build/01
    provides: Framework 1.13.4 scaffold + D-13 npm scripts (lint:types, test, lint, format:check, build) + .nvmrc + D-06 src/ layout
  - phase: 01-bootstrap-build/02
    provides: Strict TypeScript + Vitest + ESLint type-checked + Prettier — four CI gates wired and exiting 0 locally
  - phase: 01-bootstrap-build/03
    provides: xen-dev stack installed + fraction.js@5.3.4 exact-pinned + D-14 hello page that renders 81/79 ≈ 43.28¢ in dist/index.html
provides:
  - Single GitHub Actions workflow at .github/workflows/deploy.yml implementing D-02/D-03/D-05/D-10/D-18/D-21
  - Push-to-main → npm ci → 4 CI gates → deny-list → build → configure-pages → upload-artifact → deploy-pages
  - PR builds run gates + build only (no upload, no deploy) per D-03
  - First-party-only actions (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4)
  - Minimum-needed permissions (contents:read, pages:write, id-token:write) and concurrency:{group:pages, cancel-in-progress:false}
  - In-CI deny-list enforcement for D-21 (temperaments + mathjs absent from package.json)
affects: [02-kernel-mvp, 03-viz, 04-analysis]

tech-stack:
  added:
    - "actions/checkout@v4 (first-party)"
    - "actions/setup-node@v4 with node-version-file: .nvmrc + npm cache"
    - "actions/configure-pages@v5"
    - "actions/upload-pages-artifact@v3"
    - "actions/deploy-pages@v4"
  patterns:
    - "Single-workflow CI+deploy: one .yml runs gates on every push and PR; deploy job is push-to-main-only via if: github.event_name == 'push' && github.ref == 'refs/heads/main'"
    - "First-party-only Pages chain: configure-pages → upload-pages-artifact → deploy-pages (no third-party deploy actions per security_constraints)"
    - "Defense-in-depth deny-list step: same node -e check as Plan 03's local verification, run inside CI so a future PR adding temperaments / mathjs is rejected automatically (D-21)"
    - "Node-version-as-single-source-of-truth: setup-node reads .nvmrc, so bumping Node is a one-file change"

key-files:
  created:
    - /Users/taylorbrook/Dev/Tuning Systems/.github/workflows/deploy.yml
    - /Users/taylorbrook/Dev/Tuning Systems/.planning/phases/01-bootstrap-build/01-04-SUMMARY.md
  modified: []

key-decisions:
  - "Honored D-01: GitHub Pages target (not Cloudflare); single repo, no new vendor"
  - "Honored D-02: Single workflow chains npm ci → lint:types → test → lint → format:check → deny-list → build → configure-pages → upload-pages-artifact → deploy-pages"
  - "Honored D-03: Build job runs on push and PR; configure-pages, upload-artifact, and deploy job all gated on github.event_name == 'push' && github.ref == 'refs/heads/main'"
  - "Honored D-05: No observable deploy invocation anywhere in workflow; static dist/ uploaded via Pages actions"
  - "Honored D-10: All four gates (tsc --noEmit via lint:types, vitest run via test, eslint . via lint, prettier --check . via format:check) appear as separate, individually-attributable steps"
  - "Honored D-18: Node 20 LTS pinned via setup-node's node-version-file: '.nvmrc' (not hardcoded version string)"
  - "Honored D-21: deny-list step inside the build job rejects temperaments / mathjs in package.json (defense-in-depth alongside Plan 03's local check)"
  - "Honored security_constraints: only first-party actions (no peaceiris, no third-party deploy), npm ci instead of npm install, minimum-needed permissions block, concurrency:{group:pages, cancel-in-progress:false} per T-01-17"

patterns-established:
  - "CI-as-only-gate (D-11): no husky / lefthook / lint-staged; the single workflow is the enforcement layer"
  - "Push-to-main-only deploy: the same .yml file serves PR validation and main-branch deployment by gating the publish-side steps with a job-level if:"
  - "First-party Pages action chain: future deploy work (custom domain, preview environments) extends this same chain rather than swapping in alternative actions"

requirements-completed:
  - BOOT-05

duration: ~6min (Task 1 write + commit + checkpoint return; Task 2 = user-side acknowledgment, not Claude-timed)
completed: 2026-05-03
---

# Phase 01 Plan 04: GitHub Pages CI + Deploy Workflow Summary

**Single GitHub Actions workflow at `.github/workflows/deploy.yml` chains `npm ci → lint:types → test → lint → format:check → D-21 deny-list → build → configure-pages → upload-pages-artifact → deploy-pages` on push to main; PRs run gates + build with the publish steps skipped per D-03; uses only first-party `actions/*` (checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4) with minimum-needed permissions (contents:read, pages:write, id-token:write) and `concurrency:{group:pages, cancel-in-progress:false}`.**

## Performance

- **Duration:** ~6 min Claude time (Task 1 file write + commit + checkpoint return); Task 2 was user-side and not Claude-timed
- **Started:** 2026-05-03T01:50:00Z (approx — first read after Plan 03 SUMMARY landed)
- **Task 1 committed:** 2026-05-03T01:52:46Z (commit 05415a1, per `git log` author date)
- **User approval:** "approved" (received after this continuation agent was spawned)
- **Tasks:** 2 (Task 1 = write workflow; Task 2 = checkpoint:human-action — user configured Pages source + accepted deploy)
- **Files created:** 1 (`.github/workflows/deploy.yml`, 87 lines per `git show --stat`)

## Accomplishments

- **Single CI+deploy workflow live:** `.github/workflows/deploy.yml` implements the D-02 step order verbatim: checkout → setup-node 20 from `.nvmrc` (with npm cache) → `npm ci` → four gates → D-21 deny-list → `npm run build` → configure-pages → upload-pages-artifact → deploy-pages.
- **D-03 gate honored:** Three checkpoints in the workflow restrict publish-side work to push-to-main:
  1. `Configure Pages` step — gated `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`
  2. `Upload Pages artifact` step — same gate
  3. `deploy` job (top-level) — same gate, `needs: build`
  PRs therefore execute checkout + setup-node + npm ci + the four gates + deny-list + `npm run build`, then stop. No artifact uploaded, no deploy job runs.
- **D-05 honored:** Workflow contains no `observable deploy` invocation. Static `dist/` (produced by `npm run build`) is uploaded via `actions/upload-pages-artifact@v3` and served via `actions/deploy-pages@v4` — the GitHub-canonical recipe.
- **All four D-10 gates as separate steps:** Each gate is a distinct named step (`Type-check (D-10 gate 1)`, `Unit tests (D-10 gate 2)`, `Lint (D-10 gate 3)`, `Format check (D-10 gate 4)`) so failures are individually attributable in the Actions UI rather than buried inside a single `npm run ci` invocation.
- **D-18 honored:** `actions/setup-node@v4` is configured with `node-version-file: ".nvmrc"`, so the Node version pin lives in exactly one file (`.nvmrc` = `20`) and the workflow stays in lockstep automatically.
- **D-21 deny-list enforced in CI:** A `Phase 1 deny-list check (D-21)` step runs the same `node -e` check as Plan 03's local verification — fails the build if `temperaments` or `mathjs` appear in `package.json` dependencies or devDependencies. Defense-in-depth.
- **Security baseline (security_constraints):** Only first-party `actions/*` (no `peaceiris/*` or other third-party deploy actions); `npm ci` (NOT `npm install`); minimum-needed `permissions:` block (`contents: read`, `pages: write`, `id-token: write`); `concurrency: { group: pages, cancel-in-progress: false }` per T-01-17 so an in-flight deploy completes rather than getting cancelled mid-flight.
- **BOOT-05 satisfied** — deployment target wired. The workflow file is in place, syntactically/semantically valid, and the user has accepted it (Task 2 checkpoint resolved with "approved").

## Task Commits

Each task was committed atomically:

1. **Task 1: Write `.github/workflows/deploy.yml`** — `05415a1` (feat)
2. **Task 2: Configure Pages source + verify first deploy** — no Claude commit; user-side manual configuration acknowledged via "approved" resume signal

_Plan metadata commit: appended via `final_commit` step containing this SUMMARY + STATE / ROADMAP / REQUIREMENTS updates._

## Files Created/Modified

### Created

- `/Users/taylorbrook/Dev/Tuning Systems/.github/workflows/deploy.yml` — 87 lines. Single CI+deploy workflow per D-02/D-03/D-05/D-10/D-18/D-21 plus security_constraints. Two jobs (`build`, `deploy`); `deploy` is `needs: build` and gated on push-to-main only.
- `/Users/taylorbrook/Dev/Tuning Systems/.planning/phases/01-bootstrap-build/01-04-SUMMARY.md` — this file.

### Modified

- None. The workflow is a brand-new file in a brand-new `.github/workflows/` directory.

## Static Acceptance Verification (re-run by continuation agent)

All Task 1 acceptance criteria from the plan re-verified at SUMMARY-write time:

| Check | Result |
| ----- | ------ |
| `.github/workflows/deploy.yml` exists | ✓ |
| `npm run lint:types` step present | ✓ (line 46) |
| `npm run test` step present | ✓ (line 49) |
| `npm run lint` step present | ✓ (line 52) |
| `npm run format:check` step present | ✓ (line 55) |
| `npm ci` present, `npm install` absent | ✓ (line 43, no `npm install` matches) |
| `actions/configure-pages` present | ✓ (`@v5`) |
| `actions/upload-pages-artifact` present | ✓ (`@v3`) |
| `actions/deploy-pages` present | ✓ (`@v4`) |
| `observable deploy` absent (D-05) | ✓ (zero matches) |
| `peaceiris` absent (no third-party deploy) | ✓ (zero matches) |
| Deploy gated `github.event_name == 'push' && github.ref == 'refs/heads/main'` | ✓ (3 occurrences: configure-pages step, upload-artifact step, deploy job) |
| `node-version-file` present (D-18) | ✓ (`.nvmrc`) |
| `temperaments` deny-list term present (D-21) | ✓ |
| `mathjs` deny-list term present (D-21) | ✓ |
| `pages: write` permission | ✓ |
| `id-token: write` permission | ✓ |
| `contents: read` permission | ✓ |

## Decisions Made

1. **Reworded the D-05 header comment to avoid the literal substring `observable deploy`** — see Deviations from Plan. The intent of D-05 (workflow does NOT invoke the deprecated `observable deploy` command) is preserved; only the comment-header phrasing changed from referencing the literal command name to "the deprecated Observable Cloud deploy command; ship via Pages actions".
2. **Treated Task 2 as user-acknowledged, not Claude-verified** — the user's resume signal was "approved" without an explicit deployed URL. The SUMMARY records what is verifiable (the workflow file's structural correctness and the user's acceptance) and does not fabricate a live-deploy URL or workflow run number. Plan-output spec asked for these but they require GitHub-side observation that the user did not relay back. Future SUMMARY-amend (e.g., `docs(01-04): record live deploy URL`) is the right way to add them if desired.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reworded the D-05 comment-header line to satisfy the plan's own deny-grep**

- **Found during:** Task 1, immediately before commit (running the plan's verification grep `! grep -q 'observable deploy' .github/workflows/deploy.yml`).
- **Issue:** Plan's `<action>` body specified the verbatim YAML comment `D-05: NOT using \`observable deploy\` (deprecated); deploy via Pages actions`. The same task's `<verify><automated>` then asserts `! grep -q 'observable deploy' .github/workflows/deploy.yml` — i.e., the literal substring `observable deploy` MUST be absent from the file. The plan's own example body contradicts its own deny-grep; the comment-header line and the deny assertion cannot both be honored verbatim.
- **Fix:** Reworded the D-05 comment from `D-05: NOT using \`observable deploy\` (deprecated); deploy via Pages actions` to `D-05: NOT using the deprecated Observable Cloud deploy command; ship via Pages actions`. The plan's INTENT (workflow does not invoke the deprecated `observable deploy` command anywhere it would actually execute) is fully preserved — there is no `run: observable deploy` step, no `npm run deploy` script call, and no third-party Pages action that wraps it. Only the documentation phrasing changed. Both the action-prose intent and the verification grep now pass.
- **Files modified:** `/Users/taylorbrook/Dev/Tuning Systems/.github/workflows/deploy.yml` (1 line, in the comment header at the top of the file)
- **Verification:** `grep -c 'observable deploy' .github/workflows/deploy.yml` outputs `0`; the workflow's runtime semantics are unchanged.
- **Committed in:** `05415a1` (the rewording landed before the first commit so the plan's verbatim form never appeared on disk).

---

**Total deviations:** 1 auto-fixed (Rule 1 — plan internal contradiction, identical pattern to Plan 03's "composition" deny-grep deviation).
**Impact on plan:** Zero scope change. The fix is a one-line comment edit with no effect on the workflow's runtime behavior or the actions it invokes. Worth flagging for future plan-writers: when a plan's `<action>` body specifies verbatim text and the plan's own `<verify>` block contains a substring deny-grep, ensure the verbatim text does not contain the denied substring. (This is the second occurrence of this pattern across Phase 1; the first was in Plan 03 with `composition`.)

## Issues Encountered

- **Plan internal contradiction (D-05 example vs. D-05 deny-grep):** Documented above as the sole deviation. Easy fix; flagged for future plans.
- **Live deploy not directly observed by Claude:** The user responded "approved" without relaying the deployed URL or first-run timestamp. The plan's `<output>` block requested these as SUMMARY content; they are honestly omitted here rather than fabricated. If the user wants them recorded, a one-line follow-up amend can be added (`docs(01-04): record live deploy URL <url> and first-run number <N>`).
- **`.eslintignore` deprecation warning carries forward from Plan 02** — pre-existing; out of scope for this plan. Not addressed; documented in Plan 02's SUMMARY.

## User Setup Required

**Completed.** Task 2 was a `checkpoint:human-action` requiring the user to:

1. Set the GitHub repo's Pages source to "GitHub Actions" (Settings → Pages → Build and deployment → Source).
2. Push to the `main` branch (or wait for the existing main commit to trigger the workflow).
3. Confirm the deployed site renders the D-14 hello page (`81/79 ≈ 43.28¢` and `bigint, bigint`).

The user's resume signal was "approved" — interpreted as the workflow being accepted. The optional smoke test (open a throwaway PR, verify gates run + deploy is skipped per D-03) was not relayed and is not required for plan closure.

If at any point the live URL or first-run details want to be archived in this SUMMARY, the right pattern is a one-line amend commit (`docs(01-04): record live deploy URL`) rather than reopening the plan.

## Threat Flags

None — no new security-relevant surface introduced beyond what the plan's threat register already covers (T-01-13 through T-01-19, all `mitigate`-disposed and all honored by the committed workflow). Specifically:

- T-01-13 (non-deterministic install): mitigated by `npm ci`.
- T-01-14 (third-party action with malicious code): mitigated — only first-party `actions/*` used.
- T-01-15 (secret-in-logs): accepted — Phase 1 has no third-party secrets; `GITHUB_TOKEN` is auto-masked.
- T-01-16 (excess permissions): mitigated — `permissions:` scoped to `contents: read, pages: write, id-token: write`.
- T-01-17 (concurrent-deploy DoS): mitigated — `concurrency: { group: pages, cancel-in-progress: false }`.
- T-01-18 (forked-PR elevated permissions): mitigated — deploy job gated on push-to-main; PRs only run gates + build.
- T-01-19 (forbidden packages slipping in): mitigated — D-21 deny-list step inside the workflow.

## TDD Gate Compliance

This plan is `type: execute` (not `type: tdd`), so RED/GREEN/REFACTOR gate enforcement does not apply. The workflow itself runs `npm run test` (vitest) as one of the four CI gates, which exercises the Plan 02 `example.test.ts` (2 passing tests) on every push and PR — the test infrastructure carries forward unchanged.

## Next Plan Readiness

- **Phase 1 is complete.** All five BOOT-* requirements are satisfied:
  - BOOT-01 ✓ (Plan 01 — Framework scaffold + deployable build)
  - BOOT-02 ✓ (Plan 02 — `tsc --noEmit` running)
  - BOOT-03 ✓ (Plan 02 — Vitest configured)
  - BOOT-04 ✓ (Plan 03 — xenharmonic-devs stack installed + fraction.js v5 BigInt resolves)
  - BOOT-05 ✓ (this plan — GitHub Pages deployment target wired and accepted)
- **Phase 2 (Math Kernel + Composition Anchor MVP) is unblocked.** The CI pipeline now enforces all four gates on every PR and every push, and the live site at `https://<user>.github.io/<repo>/` automatically reflects every successful main-branch build. Phase 2 plans can rely on:
  - The four CI gates as a regression net (any kernel change that breaks types, tests, lint, or format will block the deploy).
  - The D-21 deny-list as a guard against accidentally pulling in `temperaments` or `mathjs` while building the kernel.
  - The single-workflow pattern — Phase 2 does NOT need to add a separate CI workflow; new tests, new lint rules, and new build artifacts just slot into the existing chain.

## Self-Check: PASSED

All claimed files and commits verified to exist on disk and in git history:

- `/Users/taylorbrook/Dev/Tuning Systems/.github/workflows/deploy.yml` — exists, 87 lines.
- `/Users/taylorbrook/Dev/Tuning Systems/.planning/phases/01-bootstrap-build/01-04-SUMMARY.md` — this file.
- Commit `05415a1` (Task 1, feat) present in `git log` with the expected message and `1 file changed, 87 insertions(+)` stat.
- All static acceptance checks from the plan's `<verify><automated>` block pass — see the table under "Static Acceptance Verification" above.
- `.github/workflows/deploy.yml` contains zero matches for `observable deploy`, zero matches for `npm install` (only `npm ci`), zero matches for `peaceiris`.
- D-21 deny-list step references both `temperaments` and `mathjs` literally (one line, both names in the same `node -e` array).
- Three push-to-main gates present (configure-pages step, upload-artifact step, deploy job) — D-03 honored.

---
*Phase: 01-bootstrap-build*
*Plan: 04*
*Completed: 2026-05-03*
