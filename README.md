> **Note:** *Work in progress while I restructure the existing repo to focus on the fintech quality-engineering suite. I'm preserving useful history and folding it into the new architecture as I go.*

---

# 🏦 QA Automation Suites – FinTech Quality Engineering

*A modular automation & quality-engineering framework for fintech systems.*

### 🛠 Tech Stack

**Playwright • Vitest • TypeScript • Node.js • GitHub Actions CI/CD • ESLint • Prettier • Husky**

[![Code Quality & Unit Tests](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![End-to-End Tests](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml)
[![Critical Function Healthcheck](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml)

> The primary system under test is **ParaBank**, a banking demo application providing fintech workflows (accounts, transfers, loans, statements, auth).

---

## 🚀 Overview

This suite demonstrates practical quality engineering:

- **E2E & API testing** with Playwright and Vitest
- **ISTQB test-design techniques** applied to real scenarios:
  - ✅ Equivalence Partitioning (Account validation)
  - ✅ 3-Value Boundary Value Analysis (Loan amounts, ratios)
  - ✅ Decision Tables (Loan approval rules - 34 test cases)
- **WCAG 2.1 AA accessibility auditing** with axe-core and compliance reporting
- **CI/CD integration** with tagged test lanes (`@smoke`, `@critical`, `@regression`, `@a11y`)
- **Daily critical function healthcheck** with automated reporting
- **50 unit tests** covering HTTP client, retry logic, and report generators
- **Strict TypeScript**, linting, and Husky hooks for code quality
- **Automated report generation** (markdown + JSON) with GitHub Actions integration

---

---

## 🔺 Test Levels & Automation Pyramid (ISTQB)
```
                        /\
                       /  \
                      / E2E \              ← Playwright (UI flows)
                     /------\                Few, slow, high confidence
                    /        \
                   /Integration\           ← Vitest + HTTP (API contracts)
                  /--------------\           Moderate, fast, contract validation
                 /                \
                /       Unit       \       ← Vitest (isolated logic)
               /--------------------\        Many, fastest, granular coverage
```

| Layer | Tool | Focus | Tags | Trigger |
|-------|------|-------|------|---------|
| **Unit** | Vitest | Isolated functions, utilities (50 tests) | — | Push, PR |
| **Integration** | Vitest + HTTP | API contracts, data flow | `@smoke` | Push, PR |
| **E2E** | Playwright | User journeys, UI flows | `@smoke`, `@critical` | Push, PR |
| **Accessibility** | Playwright + axe-core | WCAG 2.1 AA compliance | `@a11y` | Push, Daily |
| **Healthcheck** | Vitest + Playwright | API availability, loan tests, a11y audit | `@critical` | Daily (06:00 UTC) |

> **ISTQB principle:** More tests at the base (fast, cheap, stable), fewer at the top (slow, expensive, brittle). Each layer catches different defect types.

## 🧠 ISTQB Test-Design Techniques

Applying formal test-design methods to fintech scenarios:

| Technique | Application | Implementation |
|-----------|-------------|----------------|
| **Equivalence Partitioning** | Account ID validation (valid, invalid, boundary cases) | ✅ Accounts API test suite |
| **Boundary Value Analysis (3-Value)** | Loan amounts, down payments, ratio thresholds | ✅ 34 test cases with -2, -1, 0, +1, +2 |
| **Decision Tables** | Loan approval rules (funds check, down payment ratio) | ✅ 4 combinatorial rules + BVA |
| **State-Transition** | Login flows, session timeout, account lockout | _Planned_ |

### 📋 Loan Approval Decision Table (Simplified)

ParaBank loan approval evaluates two conditions **in sequence**:

| Rule | C1: Funds ≥ Down Payment | C2: Down Payment ≥ 10% | Decision |
|------|:------------------------:|:----------------------:|----------|
| **R1** | ✅ TRUE | ✅ TRUE | **APPROVED** |
| **R2** | ✅ TRUE | ❌ FALSE | **DENIED** (insufficient ratio) |
| **R3** | ❌ FALSE | ✅ TRUE | **DENIED** (insufficient funds) |
| **R4** | ❌ FALSE | ❌ FALSE | **DENIED** (insufficient funds) |

> **Note:** R1 (funds check) is evaluated first. If it fails, R2 is never checked—both R3 and R4 return the same denial.

**Test Coverage:**
- ✅ 4 Decision Table Rules (combinatorial coverage)
- ✅ 30 Boundary Value Analysis tests (3-value BVA at 6 boundaries)
- ✅ 34 total test cases with automated reporting

📖 **Detailed Documentation:** [Loan Approval Decision Table](docs/test-design/loan-approval-decision-table.md)

---

## ♿ Accessibility Compliance Testing

Comprehensive WCAG 2.1 Level AA accessibility auditing using axe-core integrated with Playwright.

### Audit Coverage

| Category | Rules Tested | Focus |
|----------|--------------|-------|
| **Form Labels** | `label`, `label-title-only`, `form-field-multiple-labels` | Input/label association |
| **Keyboard Navigation** | `tabindex`, `focus-order-semantics`, `scrollable-region-focusable` | Tab order, focus management |
| **Focus Indicators** | Visual focus state detection | Visible focus styles |
| **Screen Reader** | 12 ARIA rules including `html-has-lang`, `image-alt`, `link-name` | Assistive technology support |
| **Error Messages** | `aria-input-field-name`, `aria-allowed-attr` | Accessible form validation |

### Pages Audited

- Homepage / Login
- About Us
- Services
- Full WCAG 2.1 AA scan (Homepage)

### Compliance Reporting

Generates stakeholder-ready compliance reports with:

- **Executive summary** with compliance status (Compliant, Partial, Non-Compliant)
- **Violation breakdown** by category and impact severity
- **Legal compliance reference** (WCAG 2.1 AA, Section 508, EN 301 549, ADA Title III)
- **Remediation recommendations** with axe-core documentation links
- **Risk assessment** for critical and serious violations

### Audit Mode

Tests operate in **audit mode**: they collect and report violations without failing the build. This approach is ideal for:

- Monitoring third-party applications (like ParaBank)
- Tracking accessibility improvements over time
- Generating compliance documentation for stakeholders
- Identifying issues without blocking deployments

**Run accessibility audit:**
```bash
npm run test:a11y:report
```

Reports generated:
- `reports/a11y-results.json` - Machine-readable audit data
- `reports/a11y-compliance-report.md` - Stakeholder compliance report

---

## 🔧 Engineering Quality Gates

- **TypeScript (strict)**
- **ESLint (flat v9)** + **Prettier**
- **Husky hooks**
  - `pre-commit`: typecheck, lint, format
  - `pre-push`: smoke checks
- **CI parity**: local gates mirror CI
- **Node version pinned** via `.nvmrc`

---

## 📊 Reporting

- **Playwright HTML reports** (E2E test results with traces)
- **API integration reports** (technical + stakeholder summaries in markdown)
- **Loan decision table reports** (34 test cases, grouped by technique, pass/fail breakdown)
- **Unit test reports** (50 tests with error codes for debugging)
- **Accessibility compliance reports** (WCAG 2.1 AA audit with legal compliance reference)
- **Daily healthcheck summaries** (API health, loan tests, accessibility audit)
- **Screenshots, videos, traces** on failure (uploaded as CI artifacts)
- **GitHub Actions job summaries** with inline test results

---

## 🧩 Project Structure
```
QA-Automation-Suites/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                      # Code Quality & Unit Tests
│     ├─ playwright.yml              # End-to-End Tests
│     └─ bank-critical-heartbeat.yml # Critical Function Healthcheck (daily)
├─ .husky/                           # pre-commit / pre-push hooks
├─ reports/                          # test output reports (auto-generated)
│  ├─ loan-api-report.md             # loan test summary
│  ├─ integration-report.md          # integration test summary
│  ├─ heartbeat-summary.md           # API health summary
│  ├─ unit-summary.json              # unit test results
│  ├─ a11y-results.json              # accessibility audit data
│  └─ a11y-compliance-report.md      # WCAG compliance report
├─ api/
│  ├─ data/
│  │  └─ equivalence-partitions.ts   # EP test data sets
│  ├─ interfaces/
│  │  └─ responses.ts                # API response contracts (interfaces out)
│  ├─ src/
│  │  ├─ helpers/
│  │  │  ├─ http.ts                  # HTTP client
│  │  │  ├─ retry.ts                 # retry utility
│  │  │  └─ test-reporter.ts         # integration report generator
│  │  ├─ types/
│  │  │  ├─ index.ts                 # type aggregation
│  │  │  ├─ loan.types.ts            # loan API types
│  │  │  └─ inputs.ts                # test input shapes (types in)
│  │  └─ tests/
│  │     ├─ unit/
│  │     │  ├─ http.test.ts          # HTTP client tests (16 tests)
│  │     │  ├─ retry.test.ts         # retry utility tests (7 tests)
│  │     │  └─ test-reporter.test.ts # report generator tests (27 tests)
│  │     ├─ critical/
│  │     │  ├─ heartbeat.api.test.ts        # @critical daily heartbeat
│  │     │  ├─ loan-decision-table.ts       # loan test data (34 cases)
│  │     │  └─ loan-decision-table.test.ts  # @critical loan approval tests
│  │     └─ integration/
│  │        └─ accounts.api.test.ts  # @smoke integration tests
├─ scripts/
│  ├─ run-loan-tests.ts              # loan test runner + report generator
│  ├─ run-unit-tests.ts              # unit test runner + report generator
│  └─ run-a11y-tests.ts              # accessibility test runner + compliance report
├─ docs/
│  └─ test-design/
│     └─ loan-approval-decision-table.md  # detailed loan test design
├─ config/                           # env/config scaffolding
├─ e2e/
│  ├─ tests/
│  │  ├─ bankProject/
│  │  │  ├─ smoke.header.spec.ts
│  │  │  ├─ critical.availability.spec.ts
│  │  │  ├─ critical.login.spec.ts
│  │  │  └─ critical.accessibility.spec.ts  # @a11y WCAG 2.1 AA audit
│  │  └─ index.ts
│  ├─ fixtures/
│  ├─ pages/
│  └─ utils/
├─ .nvmrc
├─ .npmrc
├─ .prettierrc
├─ .prettierignore
├─ eslint.config.js
├─ package.json
├─ tsconfig.json
├─ vitest.unit.config.ts             # unit test config (5s timeout)
├─ vitest.integration.config.ts      # integration + critical tests (30s timeout)
├─ vitest.critical.config.ts         # critical tests only
└─ README.md
```

---

## 🧰 Tech Stack

| Category | Tools |
|----------|-------|
| UI Testing | Playwright |
| API Testing | Vitest + fetch-based HTTP client |
| Accessibility | axe-core |
| Code Quality | ESLint, Prettier, Husky |
| CI/CD | GitHub Actions |

---

## 🛠 Getting Started
```bash
nvm use
npm install
npx playwright install
```

**Run E2E smoke:**
```bash
npx playwright test --grep @smoke
```

**Run all API tests:**
```bash
npm run test:api
```

**Run API smoke tests only (integration):**
```bash
npm run test:api:smoke
```

**Run API critical tests only (heartbeat):**
```bash
npm run test:api:critical
```

**Run loan decision table tests (with report generation):**
```bash
npm run test:loans
```

**Run accessibility audit (with compliance report):**
```bash
npm run test:a11y:report
```

**Run unit tests (with developer report):**
```bash
npm run test:unit:report
```

---

## 🗺️ Roadmap

> *Subject to change as the project evolves.*

### 🧱 Foundation & Repo Hygiene

* ✅ TypeScript + Playwright base scaffold
* ✅ ESLint, Prettier, Husky pre-commit hooks
* ✅ GitHub Actions CI/CD (static gates + tests)
* ✅ API suite scaffold + healthcheck in CI

### 🎭 Playwright E2E

* ✅ Env-specific baseURL via `.env`
* ⬜ Tags & lanes: `@smoke`, `@critical`, `@regression`
* ⬜ Artifacts on failure (traces, screenshots, videos)
* ⬜ Page Object Model for bank pages
* ⬜ Auth/session fixtures (storage state reuse)

### 🔐 API Layer

* ✅ Standalone fetch-based client
* ✅ Typed request/response interfaces (types in, interfaces out)
* ✅ Loan eligibility API tests (34 test cases)
* ✅ Automated report generation (markdown + JSON)

### 🧠 ISTQB Test-Design

* ✅ Test Levels: Pyramid structure (Unit, Integration, E2E, Heartbeat)
* ✅ Equivalence Partitioning: Account ID validation tests
* ✅ Boundary Value Analysis (3-Value): Loan amounts, down payments, ratios (30 BVA tests)
* ✅ Decision Table: Loan approval rules (4 combinatorial scenarios + 34 total tests)
* State-transition: Login/lockout flows _(planned)_

### ♿ Accessibility

* ✅ axe-core + Playwright integration (WCAG 2.1 AA)
* ✅ Critical path a11y audit (Homepage, About, Services)
* ✅ Compliance reporting (stakeholder + legal documentation)
* ✅ Audit mode (monitor without blocking deployments)

### 🌍 Environments & CI

* ✅ `.nvmrc` Node version alignment
* ✅ CI static gates before E2E
* ✅ CI runs typecheck, lint, prettier, unit tests, and `@smoke` API tests on push/PR
* ✅ Daily scheduled Critical Function Healthcheck (API, loans, accessibility)
* ⬜ Scheduled `@regression` runs

---

## 🔒 Configuration & Environment Consistency

Node version locked via `.nvmrc`, identical local and CI gates (typecheck/lint/format), environment-driven URLs for test configuration.

---

## 💬 Contact

- LinkedIn: https://www.linkedin.com/in/tom-cunningham-5a1869297/
- GitHub: https://github.com/theRainMaker1001

⭐ If you found this repo useful or inspiring, please consider giving it a star! ⭐