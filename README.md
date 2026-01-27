# QA Automation Suites - FinTech Quality Engineering

*A modular automation & quality-engineering framework for fintech systems.*

**Playwright | Vitest | TypeScript | Node.js | GitHub Actions CI/CD | ESLint | Prettier | Husky**

[![Testing Lanes](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![E2E Testing Lanes](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml)
[![Critical Healthcheck](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml/badge.svg?branch=main)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-heartbeat.yml)

> The primary system under test is **ParaBank**, a banking demo application providing fintech workflows (accounts, transfers, loans, statements, auth).

---

## Overview

This suite demonstrates practical quality engineering with a **risk-based testing approach**:

| Metric | Count |
|--------|-------|
| **Unit Tests** | 189 |
| **Integration Tests** | 84 |
| **E2E Tests** | 20+ |
| **Total Coverage** | 290+ test cases |

### Key Features

- **Risk-Based Testing Lanes** with 5-tag taxonomy (`@smoke`, `@critical`, `@regression`, `@a11y`, `@heartbeat`)
- **ISTQB Test-Design Techniques**: Decision Tables, BVA, Equivalence Partitioning, State Transition
- **WCAG 2.1 AA Accessibility Auditing** with axe-core compliance reporting
- **Financial Math Precision Tests** for JavaScript floating-point risks
- **CI/CD Pipeline** with staged gates (Commit Gate -> Smoke Lane -> Critical Lane -> Nightly Audit)
- **Auth Optimization** with Playwright storage state for faster test execution

---

## Risk-Based Testing Lanes

```
+-----------------------------------------------------------------------------+
|                        FINTECH TESTING ORCHESTRATION                        |
+-----------------------------------------------------------------------------+
|                                                                             |
|   LOCAL (pre-push)          CI PIPELINE                    SCHEDULED       |
|   +-------------+     +---------------------+        +-----------------+   |
|   |  Zero Gate  |---->|    Commit Gate      |        |  Nightly Audit  |   |
|   | lint-staged |     |  lint + typecheck   |        |  @regression    |   |
|   |   husky     |     |  189 unit tests     |        |  @a11y          |   |
|   +-------------+     +----------+----------+        |  all browsers   |   |
|                                  |                    +-----------------+   |
|                                  v                                          |
|                       +---------------------+                               |
|                       |    Smoke Lane       |  PR Only                      |
|                       |  @smoke API + E2E   |<---------                     |
|                       |  "Is bank open?"    |                               |
|                       +----------+----------+                               |
|                                  |                                          |
|                                  v                                          |
|                       +---------------------+                               |
|                       |   Critical Lane     |  PR Only                      |
|                       |  @critical tests    |<---------                     |
|                       |  Decision Tables    |                               |
|                       |  "Can we move $?"   |                               |
|                       +---------------------+                               |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### 5-Tag Taxonomy

| Tag | Purpose | Trigger | Speed |
|-----|---------|---------|-------|
| `@smoke` | Connectivity checks - "Is the bank open?" | Every PR | Fast (< 30s) |
| `@critical` | Business logic - Decision tables, auth, transactions | Every PR | Medium (< 2min) |
| `@regression` | Full coverage - All user journeys | Nightly | Slow (< 10min) |
| `@a11y` | WCAG 2.1 AA accessibility audit | Nightly | Medium |
| `@heartbeat` | API health monitoring | Daily 06:00 UTC | Fast |

### CI Pipeline Jobs

| Gate | Runs On | Tests | Blocks Merge |
|------|---------|-------|--------------|
| **Commit Gate** | Push, PR | Lint, Typecheck, 189 Unit Tests | Yes |
| **Smoke Lane** | PR only | @smoke API + E2E (Chromium) | Yes |
| **Critical Lane** | PR only | @critical Decision Tables, Auth | Yes |
| **Nightly Audit** | Scheduled 02:00 UTC | @regression + @a11y (all browsers) | No |

---

## Test Pyramid (ISTQB)

```
                        /\
                       /  \
                      / E2E \              <- Playwright (UI flows, state machines)
                     /------\                20+ tests, slow, high confidence
                    /        \
                   /Integration\           <- Vitest + HTTP (API contracts)
                  /--------------\           84 tests, medium speed
                 /                \
                /       Unit       \       <- Vitest (isolated logic)
               /--------------------\        189 tests, fastest, granular
```

| Layer | Tool | Tests | Focus |
|-------|------|-------|-------|
| **Unit** | Vitest | 189 | Financial math, HTTP client, retry logic, validation |
| **Integration** | Vitest + HTTP | 84 | API contracts, schema validation, error handling |
| **E2E** | Playwright | 20+ | User journeys, state transitions, form validation |

---

## ISTQB Test-Design Techniques

| Technique | Application | Implementation |
|-----------|-------------|----------------|
| **Decision Tables** | Loan approval rules (funds + ratio checks) | 47 test cases with combinatorial coverage |
| **Boundary Value Analysis** | Loan amounts, down payments, thresholds | 3-value BVA at 6 boundaries |
| **Equivalence Partitioning** | Account ID validation (valid/invalid/edge) | 20+ test cases |
| **State Transition** | Auth flow (login -> session -> logout -> lockout) | 7 state machine tests |

### Loan Approval Decision Table

| Rule | Funds >= Down Payment | Down Payment >= 10% | Decision |
|------|:---------------------:|:-------------------:|----------|
| R1 | Yes | Yes | **APPROVED** |
| R2 | Yes | No | **DENIED** (ratio) |
| R3 | No | Yes | **DENIED** (funds) |
| R4 | No | No | **DENIED** (funds) |

### State Transition: Authentication Flow

```
+---------+    login     +------------+   timeout    +---------+
|  Guest  |------------->| Logged In  |------------->| Expired |
+---------+              +------------+              +---------+
     ^                        |                           |
     |                        | logout                    |
     |                        v                           |
     |                   +---------+                      |
     +-------------------|  Guest  |<---------------------+
                         +---------+
```

---

## Financial Math & Precision Testing

JavaScript floating-point arithmetic is unreliable for financial calculations:

```javascript
0.1 + 0.2 = 0.30000000000000004  // Unacceptable in banking
```

Our **62 financial math tests** validate:

| Category | Tests | Coverage |
|----------|-------|----------|
| Currency Conversion | 8 | `toCents()`, `toDollars()`, safe arithmetic |
| Rounding Logic | 12 | Round Half Up, Banker's Rounding (bias reduction) |
| Interest Calculations | 14 | Simple interest, compound interest, edge cases |
| Fee Calculations | 12 | Percentage fees, safety guards (reject NaN, Infinity) |
| Dust Handling | 10 | Sub-cent fractions, currency conversion remainder |
| Edge Cases | 6 | Min/max values, boundary conditions |

---

## Accessibility Compliance Testing

Comprehensive WCAG 2.1 Level AA auditing using axe-core integrated with Playwright.

### Audit Coverage

| Category | Rules | Focus |
|----------|-------|-------|
| **Form Labels** | 3 | Input/label association |
| **Keyboard Navigation** | 3 | Tab order, focus management |
| **Screen Reader** | 12 | ARIA rules, alt text, landmarks |
| **Error Messages** | 2 | Accessible form validation |

### Compliance Reporting

- **Executive summary** with compliance status
- **Violation breakdown** by severity (Critical, Serious, Moderate, Minor)
- **Legal reference** (WCAG 2.1 AA, Section 508, ADA Title III)
- **Remediation recommendations** with axe-core links

**Run accessibility audit:**
```bash
npm run test:a11y
```

---

## Reports

**[View Latest Test Reports ->](https://therainmaker1001.github.io/QA-Automation-Suites/)**

| Report | Description |
|--------|-------------|
| [Loan Decision Table](https://therainmaker1001.github.io/QA-Automation-Suites/loan-api-report.html) | 47 test cases with BVA coverage |
| [Accessibility Compliance](https://therainmaker1001.github.io/QA-Automation-Suites/a11y-compliance-report.html) | WCAG 2.1 AA audit |
| [Unit Test Summary](https://therainmaker1001.github.io/QA-Automation-Suites/unit-summary.html) | 189 unit tests |
| [API Heartbeat](https://therainmaker1001.github.io/QA-Automation-Suites/heartbeat-summary.html) | Daily health check |

---

## Project Structure

```
QA-Automation-Suites/
+-- .github/workflows/
|   +-- ci.yml                          # Testing Lanes (Commit Gate -> Smoke -> Critical)
|   +-- playwright.yml                  # E2E Testing Lanes (Smoke, Critical, Nightly)
|   +-- bank-critical-heartbeat.yml     # Daily @heartbeat (06:00 UTC)
|   +-- deploy-reports.yml              # GitHub Pages deployment
+-- .husky/
|   +-- pre-commit                      # lint-staged (Zero Gate)
|   +-- pre-push                        # @smoke tests
+-- api/
|   +-- src/
|       +-- helpers/
|       |   +-- http.ts                 # HTTP client with latency tracking
|       |   +-- retry.ts                # Retry utility with backoff
|       |   +-- test-reporter.ts        # Report generators
|       +-- types/
|       |   +-- loan.types.ts           # Loan API types
|       |   +-- inputs.ts               # Test input shapes
|       +-- tests/
|           +-- unit/
|           |   +-- financial-math.test.ts  # 62 precision tests
|           |   +-- http.test.ts            # HTTP client tests
|           |   +-- retry.test.ts           # Retry logic tests
|           |   +-- env.test.ts             # Environment validation
|           |   +-- performance.test.ts     # SLA assertions
|           |   +-- schema-validator.test.ts
|           +-- critical/
|           |   +-- heartbeat.api.test.ts       # @heartbeat daily health
|           |   +-- loan-decision-table.ts      # Test data (47 cases)
|           |   +-- loan-decision-table.test.ts # @critical loan tests
|           +-- integration/
|               +-- accounts.api.test.ts        # @smoke EP tests
|               +-- schema-validation.api.test.ts
+-- e2e/
|   +-- tests/bankProject/
|   |   +-- smoke.header.spec.ts            # @smoke connectivity
|   |   +-- critical.login.spec.ts          # @critical auth
|   |   +-- critical.accessibility.spec.ts  # @a11y WCAG audit
|   |   +-- state-transition.auth.spec.ts   # Auth state machine (7 tests)
|   |   +-- state-transition.transactions.spec.ts  # Transaction states
|   |   +-- form-validation.registration.spec.ts   # Registration BVA
|   +-- fixtures/
|   |   +-- auth.fixture.ts             # Pre-authenticated context
|   |   +-- test-data.fixture.ts        # Centralized test data
|   +-- pages/                          # Page Object Model
|   +-- global.setup.ts                 # Storage state generation
|   +-- playwright.config.ts            # Lane-based projects
+-- reports/                            # Generated test reports
+-- docs/
|   +-- test-design/
|       +-- loan-approval-decision-table.md
+-- vitest.unit.config.ts               # Unit tests (5s timeout)
+-- vitest.integration.config.ts        # Integration tests (30s timeout)
+-- package.json
+-- README.md
```

---

## Getting Started

```bash
# Setup
nvm use
npm install
npx playwright install

# Run by lane
npm run test:smoke        # @smoke API + E2E
npm run test:critical     # @critical Decision Tables + Auth
npm run test:regression   # @regression full coverage
npm run test:a11y         # @a11y accessibility audit
npm run test:heartbeat    # @heartbeat API health

# Run by layer
npm run test:unit         # 189 unit tests
npm run test:api          # Integration tests
npm run test:e2e          # All E2E tests

# Quality gates
npm run typecheck         # TypeScript validation
npm run lint              # ESLint
npm run fmt               # Prettier format
```

---

## Tech Stack

| Category | Tools |
|----------|-------|
| UI Testing | Playwright |
| API Testing | Vitest + fetch-based HTTP client |
| Unit Testing | Vitest |
| Accessibility | axe-core |
| Schema Validation | Zod |
| Code Quality | ESLint, Prettier, Husky, lint-staged |
| CI/CD | GitHub Actions |

---

## Engineering Quality Gates

- **TypeScript (strict mode)** - Full type safety
- **ESLint (flat config v9)** + **Prettier** - Consistent code style
- **Husky hooks** - Pre-commit lint-staged, pre-push smoke tests
- **CI parity** - Local gates mirror CI exactly
- **Node version pinned** via `.nvmrc`

---

## Contact

- LinkedIn: [Tom Cunningham](https://www.linkedin.com/in/tom-cunningham-5a1869297/)
- GitHub: [theRainMaker1001](https://github.com/theRainMaker1001)

---

If you found this repo useful, please consider giving it a star!
