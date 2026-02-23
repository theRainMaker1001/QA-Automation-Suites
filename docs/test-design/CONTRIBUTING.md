# Usage & Contributing Guide

This guide covers everything needed to run the test suites locally, interpret the results, and contribute new tests. Whether you are exploring the framework or extending it, start here.

---

## Prerequisites

| Requirement | Details                                                                                         |
| :---------- | :---------------------------------------------------------------------------------------------- |
| **Node.js** | Version `24.11.1` — use `nvm use` if NVM is installed                                           |
| **Java**    | Required only for generating the Allure developer dashboard locally (`npm run report:generate`) |

---

## Quick Start

```bash
npm install && npx playwright install
npm run test:smoke
```

If the smoke tests pass, your environment is ready.

> ⚠️ **Pre-commit hooks are active.** Commits will be blocked if they contain linting errors or CRLF line endings. Run `npm run lint` and `npm run fmt` before committing.

> ⚠️ **Pre-push hooks are also active.** Pushes will be blocked if typecheck, lint, or smoke tests fail. Ensure `npm run typecheck`, `npm run lint`, and `npm run test:smoke` all pass before pushing.

---

## Running the Suites

### By Architectural Layer

| Command                          | Purpose                                                        |
| :------------------------------- | :------------------------------------------------------------- |
| `npm run test:unit`              | Fast logic validation, 189 tests (Vitest)                      |
| `npm run test:api`               | Integration and contract tests (Vitest)                        |
| `npm run test:e2e`               | UI gate on Chromium (excludes `@negative` and `@known-defect`) |
| `npm run test:e2e:matrix`        | Cross-browser matrix (`chromium`, `firefox`, `webkit`)         |
| `npm run test:e2e:known-defects` | Known-defect verification lane (`@known-defect`)               |

### By Business Risk Lane

| Command                          | Purpose                                                         |
| :------------------------------- | :-------------------------------------------------------------- |
| `npm run test:smoke`             | Fast connectivity check (API and E2E)                           |
| `npm run test:critical`          | Core loan logic and auth flows                                  |
| `npm run test:heartbeat`         | API health monitor                                              |
| `npm run test:loans`             | Loan Decision Table: 41 tests (34 core, 1 coverage, 6 negative) |
| `npm run test:regression:matrix` | Cross-browser regression matrix (nightly style)                 |
| `npm run test:a11y`              | Accessibility audit (WCAG 2.1 AA)                               |
| `npm run test:audit`             | Full regression and accessibility                               |

---

## Test Tagging Conventions

Tags control which lane a test runs in. When writing new tests, apply the appropriate tag in the test name or description.

| Tag             | Purpose                  | Runs In                                   |
| :-------------- | :----------------------- | :---------------------------------------- |
| `@smoke`        | Fast connectivity checks | Push and PR                               |
| `@critical`     | Business-critical paths  | Every PR                                  |
| `@regression`   | Full feature coverage    | Nightly                                   |
| `@a11y`         | Accessibility compliance | Nightly                                   |
| `@known-defect` | Known product defects    | Critical lane tracking and dedicated lane |
| `@negative`     | Error handling scenarios | Manual                                    |

---

## Code Quality Standards

Quality is enforced at the developer's desk via **Husky** and **Lint-Staged**. Commits that fail these checks are blocked before they reach the build server.

| Check         | Command             |
| :------------ | :------------------ |
| Linting       | `npm run lint`      |
| Formatting    | `npm run fmt`       |
| Type checking | `npm run typecheck` |

---

## CI/CD Pipeline

Every push and pull request runs the following sequential gates:

```
Commit Gate → Smoke Lane → Critical Lane → Report Deploy
```

| Gate              | Trigger                | What runs                                                           |
| :---------------- | :--------------------- | :------------------------------------------------------------------ |
| Commit Gate       | Every push             | Lint, typecheck, unit tests, loan report generation                 |
| Smoke Lane        | Push and PR            | API and E2E connectivity                                            |
| Critical Lane     | PR and manual dispatch | `@critical` API and E2E validation                                  |
| Nightly Audit     | 2 AM UTC               | `@regression` and `@a11y`                                           |
| Known-defect Lane | Manual                 | Known issues kept visible without blocking unexpected-failure gates |

---

## Reporting

Two dashboards are generated from test data, each targeting a different audience.

- **Stakeholder Dashboard**: Reads `reports/*.json` artefacts and produces an executive summary with confidence scoring, risk level, and known defect tracking. No Java required.
- **Developer Dashboard (Allure)**: Merges all `allure-results/` data with failure categorisation (Known Defects, Unexpected Failures, Infrastructure Issues) and 90-day trend history. Requires Java.

```bash
# Generate the Allure developer dashboard (requires Java)
npm run report:generate
npm run report:open

# Generate the stakeholder dashboard (no Java required)
npm run report:stakeholder
```

**Dashboard totals note:** Stakeholder top-level totals include the a11y lane. Allure may include overlapping lane executions by design for richer diagnostics.

---

## Project Structure

```
api/src/tests/     # Vitest tests (unit, integration, critical)
e2e/tests/         # Playwright specs
scripts/           # Report generation scripts
allure-config/     # Allure categories and metadata
reports/           # JSON test result data (generated)
.github/workflows/ # CI/CD pipelines
```

See [TECHNICAL-DESIGN.md](../TECHNICAL-DESIGN.md) for full architecture documentation.
