# 👷 Contributing to QA-Automation-Suites

## ⚡ Quick Start

1. **Node Version**: Ensure you are using `v24.11.1` (run `nvm use`).
2. **Install**: `npm install && npx playwright install`.
3. **Verify**: Run `npm run test:smoke` to ensure your environment is ready.

## 🧹 Code Quality Standards

We use **Husky** and **Lint-Staged** to enforce quality before commits.

- **Linting**: `npm run lint` (ESLint)
- **Formatting**: `npm run fmt` (Prettier)
- **Type Checking**: `npm run typecheck` (TypeScript)

> ⚠️ **Note**: Commits will be blocked if they contain linting errors or CRLF line endings.

## 🧪 Running Tests

### By Architectural Layer

| Command             | Purpose                                    |
| :------------------ | :----------------------------------------- |
| `npm run test:unit` | Fast logic validation - 189 tests (Vitest) |
| `npm run test:api`  | Integration/Contract tests (Vitest)        |
| `npm run test:e2e`  | UI User Journeys (Playwright)              |

### By Business Risk (Lanes)

| Command                  | Purpose                             |
| :----------------------- | :---------------------------------- |
| `npm run test:smoke`     | Fast connectivity check (API + E2E) |
| `npm run test:critical`  | Core loan logic + auth flows        |
| `npm run test:heartbeat` | API health monitor                  |
| `npm run test:loans`     | Loan Decision Table - 41 tests      |
| `npm run test:a11y`      | Accessibility audit (WCAG 2.1 AA)   |
| `npm run test:audit`     | Full Regression + Accessibility     |

## 🏷️ Test Tagging Conventions

When writing new tests, use these tags in test names/descriptions:

| Tag           | Purpose                  | Runs In   |
| :------------ | :----------------------- | :-------- |
| `@smoke`      | Fast connectivity checks | Push & PR |
| `@critical`   | Business-critical paths  | Every PR  |
| `@regression` | Full feature coverage    | Nightly   |
| `@a11y`       | Accessibility compliance | Nightly   |
| `@negative`   | Error handling scenarios | Manual    |

## 🔄 CI/CD Pipeline

Pull requests trigger the following sequential gates:

```
Commit Gate → Smoke Lane → Critical Lane → Report Deploy
```

- **Commit Gate**: Lint, typecheck, unit tests, loan report generation (every push)
- **Smoke Lane**: API + E2E connectivity (Push & PR)
- **Critical Lane**: @critical API + E2E validation (PR + dispatch only)
- **Nightly Audit**: @regression + @a11y at 2 AM UTC

## 📊 Reporting

Two dashboards are generated from test data, each targeting a different audience:

- **Stakeholder Dashboard**: Reads `reports/*.json` artefacts (unit-summary, loan-results, e2e-critical/regression-results, a11y-results) and produces a single-page executive summary with confidence scoring, risk level, and known defect tracking.
- **Developer Dashboard (Allure)**: Merges all `allure-results/` data with `allure-config/categories.json` for failure categorisation (Known Defects, Unexpected Failures, Infrastructure Issues) and 90-day trend history.

```bash
# Generate Allure Report (requires Java)
npm run report:generate
npm run report:open

# Generate Stakeholder Dashboard (no Java)
npm run report:stakeholder
```

## 📁 Project Structure

```
api/src/tests/     # Vitest tests (unit, integration, critical)
e2e/tests/         # Playwright specs
scripts/           # Report generation scripts
allure-config/     # Allure categories and metadata
reports/           # JSON test result data (generated)
.github/workflows/ # CI/CD pipelines
```

See [TECHNICAL-DESIGN.MD](../TECHNICAL-DESIGN.MD) for detailed architecture documentation.
