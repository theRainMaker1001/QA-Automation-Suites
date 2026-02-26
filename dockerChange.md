# Docker Change Audit Plan

Last updated: 2026-02-26  
Owner: Final auditor (Codex)  
Scope: Audit Claude's delivery for containerised nightly E2E regression execution and related reporting/docs updates.

## Audit Goal
Confirm the repo now supports stable, repeatable Docker-based nightly regression E2E runs using Playwright's maintained image, with correct report output paths, local verification commands, and documentation updates aligned to project style and `PHILOSOPHY.md`.

## Completion Rule
This change is accepted only when all P0 checks pass, and no P1 check remains unresolved.

## P0 Checks (Must Pass)

### 1. Dockerised nightly regression lane exists and is runnable
- [ ] A Dockerfile or Compose service exists for the E2E nightly regression lane.
- [ ] Container run command is documented and executable locally.
- [ ] Environment variables required by Playwright/tests are defined and injected correctly.
- [ ] Run is repeatable across two consecutive executions without manual repair.
- [ ] Runtime does not depend on host-installed browsers.

Evidence:
- Files: `Dockerfile*`, `docker-compose*.yml` (if used), scripts under `scripts/`.
- Commands: local run commands in README/docs and package scripts.

Pass criteria:
- Two back-to-back runs complete from clean state (excluding known defects tagged `@known-defect`).

### 2. Playwright official image is used (optimised base)
- [ ] Docker config uses Microsoft Playwright image (for example `mcr.microsoft.com/playwright/...`).
- [ ] Browsers are not reinstalled unnecessarily during normal test runs.
- [ ] Build context and layers are optimised (dependency cache and small invalidation surface).

Evidence:
- Dockerfile `FROM` line.
- Build logs showing no redundant browser bootstrap each run.

Pass criteria:
- Base image is Playwright-maintained and regression run uses it successfully.

### 3. Report artefacts are generated in correct directories
- [ ] Regression run produces expected report outputs.
- [ ] Output paths are consistent between local scripts, Docker commands, and CI docs.
- [ ] No report path mismatch remains (missing/empty directories addressed).

Evidence:
- Playwright/reporter configuration.
- Any report generation scripts.
- Folder checks after run (for example `playwright-report/`, `test-results/`, lane-specific output folders).

Pass criteria:
- After Docker run, expected directories exist and contain fresh artefacts.

### 4. Local pre-push verification and docker audit note exists
- [ ] Local commands exist to validate Docker lane before push.
- [ ] A git-ignored audit note file is generated/updated by command (for example `dockerAudit.md`).
- [ ] `.gitignore` includes the docker audit note filename.
- [ ] Audit note records timestamp, command executed, and pass/fail summary.

Evidence:
- Package scripts or shell scripts for local Docker verification.
- `.gitignore` entry.
- Generated local audit markdown output.

Pass criteria:
- Running the local audit command produces/updates ignored audit markdown with current run evidence.

### 5. Documentation updates are complete and style-aligned
- [ ] Root README updated with Docker regression workflow and benefits.
- [ ] `docs/TECHNICAL-DESIGN.md` updated for architecture/process changes.
- [ ] `docs/test-design/CONTRIBUTING.md` updated with contributor run instructions.
- [ ] Any impacted test-design markdown docs updated where execution/report flow changed.
- [ ] Wording follows British English and existing document tone.

Evidence:
- Diffs in:
  - `README.md`
  - `docs/TECHNICAL-DESIGN.md`
  - `docs/test-design/CONTRIBUTING.md`
  - other affected docs under `docs/test-design/`

Pass criteria:
- Docs are internally consistent, accurate, and runnable without hidden assumptions.

## P1 Checks (Strongly Recommended)
- [ ] CI workflow references the same Docker command path as local docs.
- [ ] Clear separation between known defects and unexpected failures remains intact in reporting.
- [ ] Cleanup strategy exists for stale Docker artefacts and old reports.
- [ ] Troubleshooting section added for common Docker execution failures.

## Audit Execution Steps
1. Confirm changed files are scoped to Docker run path, reports, scripts, and docs.
2. Inspect Docker config for Playwright base image and environment setup.
3. Run local Docker regression command twice.
4. Validate report directories and file freshness timestamps.
5. Run local docker audit command and confirm `dockerAudit.md` is generated and ignored.
6. Verify docs accuracy against actual commands and paths.
7. Record verdict against each checklist item.

## Auditor Verdict Template

Use this after Claude completes implementation:

```md
# Docker Change Audit Verdict

Date: YYYY-MM-DD  
Auditor: <name>

## P0 Status
- 1. Dockerised nightly regression lane: PASS/FAIL
- 2. Playwright official image usage: PASS/FAIL
- 3. Report path correctness: PASS/FAIL
- 4. Local audit command + ignored dockerAudit.md: PASS/FAIL
- 5. Documentation completeness and style: PASS/FAIL

## P1 Notes
- <item>: PASS/FAIL/NA

## Findings
1. <finding>
2. <finding>

## Final Decision
- ACCEPTED / CHANGES REQUIRED
```

## Non-Negotiable Failure Conditions
- Uses non-Playwright base image without explicit technical justification.
- Docker run works only once and fails on immediate repeat.
- Reports are still written to inconsistent or undocumented paths.
- Local docker audit file is tracked by git or not automatically generated.
- Docs claim commands/paths that do not work as written.

---

## Audit Run (2026-02-26)

### P0 Outcome
- 1. Dockerised nightly regression lane: PASS
- 2. Playwright official image usage: PASS
- 3. Report path correctness: PASS
- 4. Local audit command plus ignored `dockerAudit.md`: PASS
- 5. Documentation completeness and style: PASS

### Evidence Summary
- Fresh clean build completed: `docker compose build --pull --no-cache nightly`.
- Two consecutive nightly executions completed: `npm run docker:run` twice.
- Nightly outputs present in `reports/`: `e2e-results.json`, `e2e-regression-results.json`, `a11y-results.json`, `a11y-compliance-report.md`.
- Allure E2E output present in `allure-results/e2e/`.
- `npm run docker:audit` passed and regenerated `dockerAudit.md`.
- `dockerAudit.md`, `PHILOSOPHY.md`, `AGENTS.md`, and `CLAUDE.md` confirmed git-ignored; `README.md` and `docs/TECHNICAL-DESIGN.md` confirmed trackable.

### P1 Outcome
- CI workflow path consistency with Docker runtime: PASS
- Known-defect separation from unexpected failures: PASS (unchanged behaviour)
- Cleanup strategy for stale Docker artefacts: PASS (CI cache rotation, `docker compose run --rm`, deterministic report overwrites)
- Troubleshooting section: PASS (version-parity guidance plus `npm run docker:audit` diagnostics documented)

### Final Decision
- ACCEPTED
