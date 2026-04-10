# Usage and Contributing Guide

This guide explains how to run the suites locally, interpret results, and contribute new tests.

---

## Prerequisites

| Requirement | Details                                                               |
| :---------- | :-------------------------------------------------------------------- |
| Node.js     | Version `24.11.1` (use `nvm use` if available)                        |
| Java        | Required only for local Allure generation (`npm run report:generate`) |
| Docker      | Required only for containerised nightly runs (`npm run docker:run`)   |

---

## Quick Start

```bash
npm install && npx playwright install
npm run test:smoke
```

If smoke passes, your local environment is ready.

---

## Local Quality Gates

### Pre-commit (`.husky/pre-commit`)

Commits are blocked if any of these fail:

- `lint-staged` checks (ESLint and Prettier on staged files)
- CRLF line-ending check on staged files
- Unit tests for staged TypeScript changes (`npm run test:unit --silent`)

### Pre-push (`.husky/pre-push`)

Pushes are blocked if any of these fail:

- `npm run typecheck`
- `npm run lint`
- `npm run test:smoke`

---

## Running the Suites

### By Architectural Layer

| Command                          | Purpose                                                              |
| :------------------------------- | :------------------------------------------------------------------- |
| `npm run test:unit`              | Unit logic and maths tests                                           |
| `npm run test:api`               | Integration plus critical API tests (`vitest.integration.config.ts`) |
| `npm run test:e2e`               | Chromium E2E gate (excludes `@negative` and `@known-defect`)         |
| `npm run test:e2e:all`           | All Playwright projects                                              |
| `npm run test:e2e:matrix`        | Chromium + Firefox + WebKit matrix                                   |
| `npm run test:e2e:state`         | `@state-transition` tests on Chromium                                |
| `npm run test:e2e:known-defects` | Known-defect E2E lane                                                |
| `npm run test:e2e:negative`      | Negative/demo lane                                                   |

### By Business Risk Lane

| Command                          | Purpose                              |
| :------------------------------- | :----------------------------------- |
| `npm run test:smoke`             | Fast API plus UI connectivity checks |
| `npm run test:critical`          | Core API and E2E critical checks     |
| `npm run test:regression`        | Regression lane on `chromium-auth`   |
| `npm run test:regression:matrix` | Cross-browser regression lane        |
| `npm run test:a11y`              | Accessibility audit lane             |
| `npm run test:heartbeat`         | API environment heartbeat checks     |
| `npm run test:loans`             | Loan decision-table report run       |
| `npm run test:audit`             | Regression plus a11y aggregate run   |

Notes:

- `test:regression` uses `chromium-auth` storage state.
- Authentication state-machine tests are a deliberate exception and validate guest/login/logout transitions directly.

---

## Tagging Conventions

| Tag                 | Purpose                       | Typical lane                             |
| :------------------ | :---------------------------- | :--------------------------------------- |
| `@smoke`            | Fast connectivity             | Smoke                                    |
| `@critical`         | High-risk business paths      | Critical                                 |
| `@regression`       | Broader behavioural coverage  | Nightly audit                            |
| `@a11y`             | Accessibility checks          | Nightly audit                            |
| `@state-transition` | Explicit state-machine flows  | Regression or focused state run          |
| `@known-defect`     | Upstream known issue tracking | Critical reporting and known-defect lane |
| `@negative`         | Defensive/error-path checks   | Manual/special runs                      |

---

## Docker (Nightly Lane)

The nightly regression and a11y lanes can be run locally inside the same Playwright Docker image used in CI, reducing browser version and OS differences between environments. Environment consistency requires the Dockerfile image tag to match the installed `@playwright/test` version — run `npm run docker:audit` to verify this before pushing.

### Prerequisites

Docker Desktop (or Docker Engine) must be installed and running.

### Commands

```bash
# Build the image (once — cached on subsequent runs unless Dockerfile or
# package-lock.json changes)
npm run docker:build

# Run the full nightly sequence: unit → API → loans → regression matrix → a11y → compliance report
# Outputs land in ./reports, ./allure-results/e2e, ./allure-results/unit, and
# ./allure-results/integration on the host
npm run docker:run

# Build, run environment checks, and write a local dockerAudit.md summary
npm run docker:audit
```

### Output Locations

After `npm run docker:run`, the following files are available on the host:

| Path                                  | Contents                                              |
| :------------------------------------ | :---------------------------------------------------- |
| `reports/e2e-results.json`            | Raw Playwright JSON from the last test run            |
| `reports/e2e-regression-results.json` | Regression results preserved before a11y run          |
| `reports/a11y-results.json`           | A11y test output (written by the a11y spec)           |
| `reports/a11y-compliance-report.md`   | Generated WCAG compliance report                      |
| `reports/unit-summary.json`           | Unit test summary for stakeholder dashboard           |
| `reports/loan-results.json`           | Loan decision table results                           |
| `allure-results/e2e/`                 | Allure XML/JSON for E2E results (developer dashboard) |
| `allure-results/unit/`                | Allure XML/JSON for unit test results                 |
| `allure-results/integration/`         | Allure XML/JSON for API integration test results      |
| `e2e/playwright-report/`              | Playwright HTML report                                |
| `e2e/test-results/`                   | Failure artefacts (screenshots, traces, videos)       |

Notes:

- `dockerAudit.md` is git-ignored and local only.
- The Docker image includes Chromium, Firefox, and WebKit; no separate browser installation is required.
- The nightly sequence inside Docker mirrors `playwright.yml → nightly-audit` exactly.

---

## CI and Workflow Overview

### `ci.yml` (push, pull_request, workflow_dispatch)

Pipeline order:

```text
commit-gate -> smoke-lane -> critical-lane
```

- `commit-gate`: typecheck, lint, prettier check, tag validation, unit tests
- `smoke-lane`: `@smoke` API and E2E checks
- `critical-lane`: `@critical` API and E2E checks, then `verify:e2e:critical`

### `playwright.yml` (scheduled nightly + workflow_dispatch)

- Smoke lane (manual dispatch path)
- Critical lane (manual dispatch path)
- Nightly audit: unit tests → API integration tests → loan decision table → `@critical` E2E (produces `e2e-critical-results.json`) → `@regression` matrix → `@a11y` (always runs, even after regression failure)

Known-defect behaviour:

- `verify:e2e:critical` allows expected known defects and fails only on unexpected failures.

---

## Reporting

| Command                      | Output                                    |
| :--------------------------- | :---------------------------------------- |
| `npm run report:generate`    | Local Allure developer report             |
| `npm run report:open`        | Opens local Allure report                 |
| `npm run report:stakeholder` | Generates stakeholder dashboard JSON/HTML |

Dashboard behaviour:

- Stakeholder dashboard uses lane summaries and confidence scoring.
- Allure dashboard includes detailed execution evidence and trends.
- Known defects are tracked explicitly, not hidden.

---

## Contribution Standards

- Follow Page Object Model for E2E tests.
- Keep raw `page` operations restricted to explicit exception cases (a11y audit and security bypass checks).
- Use British English in authored docs/comments.
- Keep documentation in sync with behaviour/workflow changes in the same change set.

---

## Project Structure

```text
api/src/tests/              Vitest tests (unit, integration, critical)
e2e/tests/                  Playwright specs
e2e/pages/                  Page objects
e2e/utils/                  Shared E2E infrastructure helpers
                              Pure utilities (no Playwright imports) are unit-tested
                              under Vitest; see vitest.unit.config.ts for the
                              explicit inclusion list.
scripts/                    Test runners and report generators
docs/test-design/           Design and contribution documentation
.github/workflows/          CI/CD workflows
reports/                    Generated report artefacts
```

See [TECHNICAL-DESIGN.md](../TECHNICAL-DESIGN.md) for architecture detail.
