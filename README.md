> **Note:** *Work in progress while I restructure the existing repo to focus on the fintech quality-engineering suite. I'm preserving useful history and folding it into the new architecture as I go.*

---

# 🏦 QA Automation Suites – FinTech Quality Engineering

*A modular automation & quality-engineering framework for fintech systems.*

### 🛠 Tech Stack

**Playwright • TypeScript • Node.js • GitHub Actions CI/CD • ESLint • Prettier • Husky**

[![CI](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![Playwright E2E](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml)
[![Critical Heartbeat](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml)

> The primary system under test is **ParaBank**, a banking demo application providing fintech workflows (accounts, transfers, loans, statements, auth).

---

## 🚀 Overview

This suite demonstrates practical quality engineering:

- **E2E & API testing** with Playwright
- **ISTQB test-design techniques** applied to real scenarios (EP, BVA, Decision Tables)
- **Accessibility checks** using axe-core
- **CI/CD integration** with tagged test lanes (@smoke, @critical, @regression)
- **Strict TypeScript**, linting, and Husky hooks for code quality

---

## 🧠 ISTQB Test-Design Techniques

Applying formal test-design methods to fintech scenarios:

| Technique | Application |
|-----------|-------------|
| **Equivalence Partitioning** | Transfer amounts (valid ranges, invalid inputs, edge cases) |
| **Boundary Value Analysis** | Account limits, minimum/maximum transfer values |
| **Decision Tables** | Loan eligibility rules (income, credit, employment status) |
| **State-Transition** | Login flows, session timeout, account lockout |

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

- Playwright **HTML reports**
- Screenshots, videos, traces on failure (uploaded as CI artifacts)

---

## 🧩 Project Structure

```
QA-Automation-Suites/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                      # static gates + build + API checks
│     ├─ playwright.yml              # E2E workflow
│     └─ bank-critical-heartbeat.yml # continuous heartbeat lane
├─ .husky/                           # pre-commit / pre-push hooks
├─ .reports/                         # test output reports
├─ api/
│  ├─ helpers/                       # HTTP client utilities
│  ├─ data/
│  └─ src/tests/
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
├─ vitest.config.ts                  # API test runner config
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

**Run API tests:**

```bash
npm run test:api
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
* ⬜ Typed request/response interfaces
* ⬜ Loan eligibility API tests

### 🧠 ISTQB Test-Design

* ⬜ EP/BVA: Transfer amount validation tests
* ⬜ Decision Table: Loan eligibility scenarios
* ⬜ State-transition: Login/lockout flows

### ♿ Accessibility

* ⬜ axe-core integration on key screens
* ⬜ Critical path a11y coverage

### 🌍 Environments & CI

* ✅ `.nvmrc` Node version alignment
* ✅ CI static gates before E2E
* ⬜ PR feedback: `@smoke` subset on push
* ⬜ Scheduled `@regression` runs

---

## 🔒 Configuration & Environment Consistency

Node version locked via `.nvmrc`, identical local and CI gates (typecheck/lint/format), environment-driven URLs for test configuration.

---

## 💬 Contact

- LinkedIn: https://www.linkedin.com/in/tom-cunningham-5a1869297/
- GitHub: https://github.com/theRainMaker1001

⭐ If you found this repo useful or inspiring, please consider giving it a star! ⭐
