> **Note:** *Work in progress while I restructure the existing repo to focus on the fintech quality-engineering suite. I'm preserving useful history and folding it into the new architecture as I go.*

---

# 🏦 QA Automation Suites – FinTech Quality Engineering

*A modular automation & quality-engineering framework for fintech systems.*

### 🛠 Tech Stack

**Playwright • Vitest • TypeScript • Node.js • GitHub Actions CI/CD • ESLint • Prettier • Husky**

[![CI + API Smoke](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![Playwright E2E](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml)
[![API Heartbeat (Daily)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml)

> The primary system under test is **ParaBank**, a banking demo application providing fintech workflows (accounts, transfers, loans, statements, auth).

---

## 🚀 Overview

This suite demonstrates practical quality engineering:

- **E2E & API testing** with Playwright and Vitest
- **ISTQB test-design techniques** applied to real scenarios:
  - ✅ Equivalence Partitioning (Account validation)
  - ✅ 3-Value Boundary Value Analysis (Loan amounts, ratios)
  - ✅ Decision Tables (Loan approval rules - 34 test cases)
- **CI/CD integration** with tagged test lanes (`@smoke`, `@critical`, `@regression`)
- **Daily API heartbeat monitoring** with automated reporting
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
| **Unit** | Vitest | Isolated functions, utilities | — | Push, PR |
| **Integration** | Vitest + HTTP | API contracts, data flow | `@smoke` | Push, PR |
| **E2E** | Playwright | User journeys, UI flows | `@smoke`, `@critical` | Push, PR |
| **Heartbeat** | Vitest | API availability, latency | `@critical` | Daily (06:00 UTC) |

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

## ♿ Accessibility

Basic accessibility coverage using axe-core on key user flows:

- Automated WCAG violation scanning
- Critical path coverage (login, account overview, transfers)

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
- **Daily heartbeat summaries** (API health, latency, critical path validation)
- **Screenshots, videos, traces** on failure (uploaded as CI artifacts)
- **GitHub Actions job summaries** with inline test results

---

## 🧩 Project Structure
```
QA-Automation-Suites/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                      # typecheck + lint + API smoke tests
│     ├─ playwright.yml              # E2E workflow
│     └─ bank-critical-heartbeat.yml # daily API heartbeat + loan tests
├─ .husky/                           # pre-commit / pre-push hooks
├─ reports/                          # test output reports (auto-generated)
│  ├─ loan-api-report.md             # loan test summary
│  ├─ integration-report.md          # integration test summary
│  └─ heartbeat-summary.md           # API health summary
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
│  │     ├─ critical/
│  │     │  ├─ heartbeat.api.test.ts        # @critical daily heartbeat
│  │     │  ├─ loan-decision-table.ts       # loan test data (34 cases)
│  │     │  └─ loan-decision-table.test.ts  # @critical loan approval tests
│  │     └─ integration/
│  │        └─ accounts.api.test.ts  # @smoke integration tests
├─ scripts/
│  └─ run-loan-tests.ts              # loan test runner + report generator
├─ docs/
│  └─ test-design/
│     └─ loan-approval-decision-table.md  # detailed loan test design
├─ config/                           # env/config scaffolding
├─ e2e/
│  ├─ tests/
│  │  └─ bank/
│  │     ├─ smoke.header.spec.ts
│  │     ├─ critical.availability.spec.ts
│  │     └─ critical.login.spec.ts
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

* ⬜ axe-core integration on key screens
* ⬜ Critical path a11y coverage

### 🌍 Environments & CI

* ✅ `.nvmrc` Node version alignment
* ✅ CI static gates before E2E
* ✅ CI runs typecheck, lint, prettier, and `@smoke` API tests on push/PR
* ✅ Daily scheduled `@critical` API heartbeat
* ⬜ Scheduled `@regression` runs

---

## 🔒 Configuration & Environment Consistency

Node version locked via `.nvmrc`, identical local and CI gates (typecheck/lint/format), environment-driven URLs for test configuration.

---

## 💬 Contact

- LinkedIn: https://www.linkedin.com/in/tom-cunningham-5a1869297/
- GitHub: https://github.com/theRainMaker1001

⭐ If you found this repo useful or inspiring, please consider giving it a star! ⭐