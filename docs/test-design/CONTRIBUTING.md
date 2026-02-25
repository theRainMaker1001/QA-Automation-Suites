# Usage and Contributing Guide

This guide explains how to run the suites locally, interpret results, and contribute new tests.

---

## Prerequisites

| Requirement | Details                                                               |
| :---------- | :-------------------------------------------------------------------- |
| Node.js     | Version `24.11.1` (use `nvm use` if available)                        |
| Java        | Required only for local Allure generation (`npm run report:generate`) |

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
- Nightly audit: `@regression` matrix then `@a11y`

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
scripts/                    Test runners and report generators
docs/test-design/           Design and contribution documentation
.github/workflows/          CI/CD workflows
reports/                    Generated report artefacts
```

See [TECHNICAL-DESIGN.md](../TECHNICAL-DESIGN.md) for architecture detail.
