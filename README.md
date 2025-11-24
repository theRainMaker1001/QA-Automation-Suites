> **Note:** _Work in progress while I restructure the existing repo to focus on the fintech quality-engineering suite. I'm preserving useful history and folding it into the new architecture as I go._

---

<h1 align="center" style="color:#00ff7f; font-weight:800;">
🏦 QA Automation Suites – <span style="color:#22c55e;">FinTech Quality Engineering 🏦</span>
</h1>

<p align="center">
  <em>A modular, multi-layer automation & quality-engineering framework for modern fintech systems.</em>
</p>

### 🛠 **Tech Stack Highlights (Quick Scan)**

**Playwright • TypeScript (strict) • Node.js • Tool-Agnostic API Layer • Docker • GitHub Actions CI/CD • ESLint • Prettier • Husky • axe-core (a11y) • Performance Budgets • Risk-Based Testing • Algorithmic Oracles • ISTQB Test Design**

[![CI](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![Playwright E2E](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml)
[![Bank Critical Smoke](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-smoke.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-smoke.yml)

> The primary case-study system under test is the **ParaBank** banking demo application, providing realistic fintech workflows (accounts, transfers, loans, statements, auth). ParaBank is the flagship project, but much of the repo structure is domain agonstic and could be useful in a variety of contexts.

---

## 🚀 Overview

This suite demonstrates **enterprise-grade quality engineering**, not just UI tests:

- Clean, maintainable, **scalable architecture**
- **UI & API** validation with **multi-layer oracles** (UI → API → DB → Algorithms)
- **ISTQB-aligned test-design** (EP/BVA, Decision Tables, State Models, Pairwise, Exploratory)
- **Accessibility** and **performance** baked into daily runs (axe, keyboard, focus, contrast, SLA budgets)
- **Risk-based strategy** and **tagged lanes** for smart CI
- **Deterministic local** testing (Docker) vs **public** instance for resilience checks
- **Strict TypeScript**, linting, Husky hooks, **CI parity**, and Node version lock for reproducibility
- **Traceability & reporting** for developers, teams, and stakeholders

---

## 🧱 Architecture

| Runner & Gates →                                                                                          | Shared Test Layers →                                                                                                                                                                      | Systems Under Test →                                                                                                     | Reporting & Observability                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Playwright (UI)**<br>**Node + TypeScript (strict)**<br>Husky / ESLint / Prettier<br>GitHub Actions (CI) | **UI flows** (pages/fixtures)<br>**Tool-agnostic API client** (fetch/RequestInit)<br>**Algorithmic oracles** (sort, search, BFS, greedy, decision tables)<br>**a11y & performance hooks** | **Local (Docker):** App UI • App API • **DB** (_DB assertions enabled_)<br>**Public:** App UI • App API (_no DB access_) | HTML report • Traces • Screenshots • Videos<br>a11y & performance summaries<br>Risk/tag analytics • Failure classification |

**Flow:** `Runner & Gates` → `Shared Test Layers` → `SUT (Local/Public)` → `Reporting`

_Note: Database assertions are available in **Local (Docker)** only; Public runs validate **UI/API** behaviour under real-world conditions._

### Architectural principles

- **Tool-agnostic API layer**: custom `fetch`/`RequestInit` HTTP client, **not tied to Playwright**. Reused in PW, BDD, Node scripts, perf, and seeders.
- **Oracles-first verification**: correctness checked against algorithms, business rules, API truth, and DB state.
- **Multi-environment strategy**: deterministic **Docker** vs real-world **public** ParaBank for robustness.
- **Risk-driven execution**: tags orchestrate PR smoke, continuous heartbeat, and scheduled regression.
- **Strict engineering discipline**: TS strict, ESLint, Prettier, Husky, `.nvmrc`, CI mirrors local.
- **Extensible by design**: new fintech features integrate without core refactors.

---

## 🧠 ISTQB-Aligned Test-Design Techniques

- **Equivalence Partitioning & Boundary Values**: numeric inputs (transfers, loan amounts, limits).
- **Decision Tables**: **loan eligibility rules** and complex multi-criteria decisions.
- **State-Transition**: login, invalid attempts, lockout behaviours, session resets.
- **Pairwise/Combinatorial**: account creation and multi-field scenarios.
- **Exploratory Charters**: a11y tours, error-state discovery, UI ambiguity.
- **Traceability Matrix**: Requirements → Conditions → Cases → Automation → Results.

---

## 🤖 Algorithmic Oracles

| Algorithm                      | Usage                                      |
| ------------------------------ | ------------------------------------------ |
| **Quicksort / Mergesort**      | Oracle for correct transaction sorting     |
| **Binary Search**              | Fast lookup oracle for statements          |
| **BFS (Breadth-First Search)** | Validates multi-hop transfer/routing logic |
| **Greedy Scheduling**          | Bill-pay prioritisation choices            |
| **Decision Table Engine**      | Loan eligibility oracle                    |

---

## ♿ Accessibility (a11y)

- **axe-core** automated audits
- **Keyboard navigation** checks
- **Focus management** and error-focus handling
- **Contrast ratio** checks
- **Landmark/semantics** sanity checks

---

## ⚡ Performance (lightweight but meaningful)

- API response-time logging
- Navigation/page-load timing
- **Micro-load** (parallel API calls for resilience)
- SLA budgets (e.g., 500–800ms, configurable)
- Performance logs exported as CI artifacts

---

## 🌍 Environments

### Local (Docker) ParaBank

Deterministic data, DB assertions, repeatable state, perf baselines → ideal for regression and algorithmic verification.

### Public ParaBank

Real-world volatility, shared data, network variance → ideal for resilience, drift detection, and external dependencies.

**Why both?** Stability + determinism (local) paired with realism + variability (public).

---

## 🧰 Tool-Agnostic API Client

A custom TypeScript HTTP wrapper (fetch/`RequestInit`) provides **shared API power** across runners:

- Playwright tests reuse it for setup/oracles
- BDD can call it in steps
- Perf/seed scripts reuse the same client
- CI heartbeat can run without launching a browser

This avoids Playwright’s `APIRequestContext` lock-in

---

## 🔧 Engineering Quality Gates

- **TypeScript (strict)**
- **ESLint (flat v9)** + **Prettier**
- **Husky hooks**
  - `pre-commit`: typecheck, lint, format
  - `pre-push`: smoke checks, tag enforcement, schema/oracle checks

- **CI parity**: local gates mirror CI
- **Node version pinned** via `.nvmrc`

---

## 📊 Reporting & Observability

- Playwright **HTML reports**, screenshots, videos, traces (uploaded in CI)
- **Performance snapshots** (API + nav timing, budgets)
- **Accessibility** summaries (axe output, keyboard/focus/contrast)
- **Failure classification** (infra vs server vs UI)
- Planned: executive **PDF summaries**, optional **Allure** integration

---

## 🏦 FinTech Case Study: ParaBank (flagship)

ParaBank provides realistic fintech flows (accounts, transfers, statements, loans, auth) with **UI + API + DB** surfaces.

**Continuous `@critical` heartbeat** classifies failures:
`NETWORK_DOWN`, `SERVER_5XX`, `APP_BROKEN_UI`.

---

## 🧩 Project Structure

```bash
QA-Automation-Suites/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                      # static gates + build + API checks
│     ├─ playwright.yml              # E2E workflow
│     └─ bank-critical-smoke.yml     # continuous heartbeat lane
├─ .husky/                           # pre-commit / pre-push hooks
├─ api/
│  ├─ helpers/                       # standalone HTTP client (tool-agnostic)
│  ├─ data/
│  └─ src/tests/
├─ config/                           # env/config scaffolding (api/bdd/playwright/testdata)
├─ e2e/
│  ├─ tests/
│  │  └─ bank/
│  │     ├─ smoke.header.spec.ts
│  │     ├─ critical.availability.spec.ts
│  │     └─ critical.login.spec.ts
│  ├─ fixtures/
│  ├─ pages/
│  ├─ utils/
│  └─ playwright.config.ts
├─ .gitattributes
├─ .gitignore
├─ .nvmrc
├─ .prettierrc
├─ eslint.config.js
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ README.md
```

---

## 🧰 Tech Stack

| Category     | Tools & Notes                                        |
| ------------ | ---------------------------------------------------- |
| UI           | Playwright                                           |
| API          | **Tool-agnostic TS HTTP client** (fetch/RequestInit) |
| a11y         | axe-core, keyboard/focus utilities                   |
| Performance  | timing, budgets, micro-load                          |
| Test Design  | ISTQB technique library                              |
| Code Quality | ESLint, Prettier, Husky                              |
| CI/CD        | GitHub Actions                                       |
| Environment  | Docker + Public ParaBank                             |

---

## 🛠 Getting Started

```bash
nvm use
npm install
npx playwright install
```

**Run E2E smoke:**

```bash
cd e2e
npx playwright test --grep @smoke
```

**Local ParaBank (deterministic):**

```bash
docker-compose up --build
# then set
BANK_BASE_URL=http://localhost:8080/parabank
```

---

## 📚 Docs (to be added as we migrate)

- `docs/risk-catalog.md`
- `docs/decision-tables-loans.md`
- `docs/ep-bva-template.md`
- `docs/algorithmic-oracles.md`
- `docs/architecture.md`
- `docs/environment-strategy.md`
- `docs/coverage-map.md`

---

## 🗺️ Milestones & Roadmap

> **The below are subject to change as new features are added.**

### 🧱 Foundation & Repo Hygiene

- ✅ TypeScript + Playwright base scaffold
- ✅ ESLint, Prettier, **Husky** pre-commit hooks
- ✅ GitHub Actions CI/CD (static gates + tests)
- ✅ API suite scaffold + healthcheck in CI
- ⬜ BDD suite scaffold (Cucumber)
- ⬜ Enhanced HTML/Allure reporting (optional integration)

### 🎭 Playwright Lanes & Features

- ✅ Env-specific baseURL via `.env` (public or Docker)
- ✅ Tags & lanes: `@smoke` (PR), `@critical` (heartbeat), `@regression` (scheduled)
- ✅ Artifacts on failure (traces, screenshots, videos in CI)
- ⬜ Page Object Model baseline (`e2e/pages/`, components)
- ⬜ Cross-browser matrix (Chromium/Firefox/WebKit) on nightly
- ⬜ Auth/session fixtures (storage state reuse)
- ⬜ Parallelisation & sharding in CI
- ⬜ Network stubbing/mocking for deterministic interactions

### 🔐 Tool-Agnostic API Layer

- ✅ Standalone fetch-based client (not tied to Playwright)
- ⬜ Typed request/response interfaces
- ⬜ Retry/timeout & SLA budget helpers
- ⬜ Contract/schema checks

### 🧠 ISTQB Test-Design Library

- ⬜ EP/BVA examples with data-driven inputs
- ⬜ Decision Table for loan rules
- ⬜ State-transition for auth/session flows
- ⬜ Pairwise/combinatorial suites
- ⬜ Traceability matrix generator (Req → Case → Test)

### ♿ Accessibility (a11y)

- ⬜ axe-core integration on key screens
- ⬜ Keyboard navigation coverage
- ⬜ Focus management checks after validation/errors
- ⬜ Contrast ratio validations

### ⚡ Performance

- ⬜ API response timing logs
- ⬜ Navigation & page-load metrics
- ⬜ Micro-load parallel API calls for resilience
- ⬜ SLA budgets enforced in CI

### 📊 Reporting & Observability

- ⬜ Performance & a11y outputs in `/reports`
- ⬜ Risk distribution & failure classification
- ⬜ Executive PDF summary (stakeholder-friendly)
- ⬜ Trend charts (pass/fail, flake, latency)

### 🌍 Environments & CI

- ✅ `.nvmrc` Node version alignment (local == CI)
- ✅ CI static gates before E2E
- ⬜ PR fast feedback: run `@smoke` subset + changed-area tests
- ⬜ Nightly: `@regression` across browsers with artifacts

---

## 🔒 Configuration & Environment Consistency

This repo applies configuration management and stable test environments: Node version locked via `.nvmrc`, identical local and CI gates (typecheck/lint/format), environment-driven URLs, deterministic Docker runs for ParaBank.

---

## 💬 Contact

- LinkedIn: [https://www.linkedin.com/in/tom-cunningham-5a1869297/](https://www.linkedin.com/in/tom-cunningham-5a1869297/)
- GitHub: [https://github.com/theRainMaker1001](https://github.com/theRainMaker1001)

⭐ If you found this repo useful or inspiring, please consider giving it a star! ⭐

---
