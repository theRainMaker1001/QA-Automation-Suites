# 🛠️ Technical Design & Engineering Specifications

This document provides a deep-dive into the architectural patterns, ISTQB methodologies, and engineering logic implemented in the **QA-Automation-Suites** framework.

---

## 🏗️ Architecture & The Test Pyramid
To prevent the "Ice Cream Cone" anti-pattern, this suite is weighted toward fast, reliable unit and integration tests. This ensures maximum ROI, rapid execution, and high stability.

```text
                  / \
                 /   \
                /  E2E  \             👉 Playwright (46 Tests)
               /---------\               User Journeys & A11y
              /           \
             / Integration \          👉 Vitest + Fetch (84 Tests)
            /---------------\            API & Business Rules
           /                 \
          /       Unit        \       👉 Vitest (189 Tests)
         /---------------------\         Isolated Maths & Logic
```

* **E2E (~46 Tests):** High-fidelity user simulation covering smoke, critical, regression, and accessibility scenarios.
* **Integration (84 Tests):** API contract validation via Equivalence Partitioning (20), schema integrity (14), loan Decision Table + BVA (47), and heartbeat monitoring (3).
* **Unit (189 Tests):** Sub-millisecond validation of financial utilities and isolated business logic.

---

## 🧪 Loan Approval Decision Table Testing

> **ISTQB Techniques**: Decision Table Testing + 3-Value Boundary Value Analysis
> **System Under Test**: ParaBank Loan Request API
> **Risk Level**: Critical (Financial transaction logic)

### 1. Executive Summary
This document details the test design for ParaBank's loan approval functionality using **Decision Table Testing** combined with **3-Value Boundary Value Analysis (BVA)**. The loan approval process is critical to any banking system - incorrect approvals risk financial loss; incorrect denials damage customer relationships.

**Coverage achieved**: 34 test cases providing complete combinatorial coverage of business rules plus 5-point boundary testing (-2, -1, 0, +1, +2) at every decision point.

### 2. Decision Table Oracle
The decision table below represents all logical combinations of the two conditions:

```text
┌─────────────────────────────────────────┬───────┬───────┬───────┬───────┐
│                                         │  R1   │  R2   │  R3   │  R4   │
├─────────────────────────────────────────┼───────┼───────┼───────┼───────┤
│ CONDITIONS                              │       │       │       │       │
├─────────────────────────────────────────┼───────┼───────┼───────┼───────┤
│ C1: availableFunds >= downPayment       │   T   │   T   │   F   │   F   │
│ C2: downPayment / loanAmount >= 0.1     │   T   │   F   │   T   │   F   │
├─────────────────────────────────────────┼───────┼───────┼───────┼───────┤
│ ACTIONS                                 │       │       │       │       │
├─────────────────────────────────────────┼───────┼───────┼───────┼───────┤
│ A1: Approve loan                        │   ✓   │       │       │       │
│ A2: Deny - insufficient down payment    │       │   ✓   │       │       │
│ A3: Deny - insufficient funds           │       │       │   ✓   │   ✓   │
└─────────────────────────────────────────┴───────┴───────┴───────┴───────┘
```

**Rule Explanations:**
* **R1:** Customer qualifies on all criteria.
* **R2:** Customer has funds but ratio is too low (< 10%).
* **R3:** Ratio would be OK but customer cannot cover the payment.
* **R4:** Fails both, but funds are checked first (fail-fast).

### 3. Boundary Value Analysis (3-Value BVA)

3-value BVA is more rigorous than 2-value BVA as it may detect defects overlooked by 2-value BVA. For example, if the decision `if (x <= 10) ...` is incorrectly implemented as `if (x == 10) ...`, no test data derived from the 2-value BVA (x=10, x=11) can detect the defect. However, x=9, derived from the 3-value BVA, is likely to detect it.

To ensure absolute rigor for this financial system, we **implement** 3-Value BVA test cases covering the **Invalid Partition (-2, -1)**, the **Boundary (0)**, and the **Valid Partition (+1, +2)**.

#### **Boundary 1: Funds Check**
**Boundary Definition**: `availableFunds = downPayment`

| ID                | Position | Available Funds | Down Payment | Expected    |
| ----------------- | :------: | --------------: | -----------: | ----------- |
| BVA-FUNDS-MINUS-2 |    -2    |         $199.98 |      $200.00 | ❌ Denied   |
| BVA-FUNDS-MINUS-1 |    -1    |         $199.99 |      $200.00 | ❌ Denied   |
| BVA-FUNDS-AT-0    |  **0** |         $200.00 |      $200.00 | ✅ Approved |
| BVA-FUNDS-PLUS-1  |    +1    |         $200.01 |      $200.00 | ✅ Approved |
| BVA-FUNDS-PLUS-2  |    +2    |         $200.02 |      $200.00 | ✅ Approved |

#### **Boundary 2: Down Payment Ratio**
**Boundary Definition**: `downPayment / loanAmount = 0.10 (10%)`
*(For a $1,000 loan, boundary is at $100 down payment)*

| ID                | Position | Down Payment |   Ratio | Expected    |
| ----------------- | :------: | -----------: | ------: | ----------- |
| BVA-RATIO-MINUS-2 |    -2    |       $99.98 |  9.998% | ❌ Denied   |
| BVA-RATIO-MINUS-1 |    -1    |       $99.99 |  9.999% | ❌ Denied   |
| BVA-RATIO-AT-0    |  **0** |      $100.00 | 10.000% | ✅ Approved |
| BVA-RATIO-PLUS-1  |    +1    |      $100.01 | 10.001% | ✅ Approved |
| BVA-RATIO-PLUS-2  |    +2    |      $100.02 | 10.002% | ✅ Approved |

#### **Test Coverage Visualization**
```text
           LOAN APPROVAL TEST COVERAGE
    ════════════════════════════════════════════

    Decision Table Rules       ██████      4 tests
    Funds Check BVA (-2..+2)   ████████    5 tests
    Ratio Check BVA (-2..+2)   ████████    5 tests
    Loan Amt BVA (-2..+2)      ████████    5 tests
    Down Pmt BVA (-2..+2)      ████████    5 tests
    Combined Boundaries        ████████    5 tests
    ────────────────────────────────────────────
    TOTAL                                 34 tests
```

---

## 🔄 State Transition Testing (Authentication)
The authentication flow is modelled as a finite state machine with three observable states. Each transition is verified by asserting the starting state, triggering the event, and confirming the resulting state via the Page Object Model.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Guest

    Guest --> LoggedIn : E1 Valid Login
    Guest --> LoginError : E2 Invalid Login
    Guest --> LoginError : E3 Empty Submit
    Guest --> Guest : E5 Refresh
    Guest --> Guest : E6 Navigate

    LoginError --> LoginError : E5 Refresh

    LoggedIn --> Guest : E4 Logout
```

---

## 🚀 CI/CD Pipeline Orchestration
The pipeline uses **GitHub Actions** with strict quality gates. This multi-lane approach provides rapid feedback for developers while maintaining full regression confidence.

```mermaid
graph LR
    Local(💻 Local Dev) -->|Husky| Gate1{Lint & Unit}
    Gate1 -->|Pass| Push[🚀 Push Remote]
    Push -->|Trigger| CI[GitHub Actions]

    subgraph "CI Pipeline (ci.yml)"
    direction TB
    CI --> CommitGate["Commit Gate<br/>(Lint + Unit + Loans)"]
    CommitGate -->|Pass| Smoke[Running @smoke]
    Smoke -->|Pass| Critical["Running @critical E2E<br/>(PR + Dispatch Only)"]
    end

    subgraph "Nightly Audit (playwright.yml)"
    direction TB
    Nightly[🕐 2 AM UTC] --> Regression[Running @regression]
    Regression --> A11y[Running @a11y]
    end

    subgraph "Deploy Reports (deploy-reports.yml)"
    direction TB
    Merge[Merge Allure Results] --> Generate[Generate Reports]
    Generate --> Stakeholder[Stakeholder Dashboard]
    Generate --> Allure[Developer Dashboard]
    end

    CommitGate -->|Artifacts| Merge
    Smoke -->|Artifacts| Merge
    Critical -->|Artifacts| Merge
    Regression -->|Artifacts| Merge
    A11y -->|Artifacts| Merge
    Stakeholder -->|Deploy| Pages[GitHub Pages]
    Allure -->|Deploy| Pages

    style Local fill:#f9f9f9,stroke:#333,stroke-width:2px,color:black
    style Critical fill:#ffcccc,stroke:#ff0000,stroke-width:2px,color:black
    style Stakeholder fill:#ccffcc,stroke:#00aa00,stroke-width:2px,color:black
    style Allure fill:#ccffcc,stroke:#00aa00,stroke-width:2px,color:black
```

---

## 🧮 Financial Precision Engineering
Standard JavaScript floating-point arithmetic is unsafe for banking applications due to the way binary fractions are represented.

$$0.1 + 0.2 = 0.30000000000000004$$

Our framework includes a dedicated helper library validated by **62 specific tests** to ensure absolute integrity:
* **Banker's Rounding:** Implemented to reduce statistical bias in interest calculations by rounding to the nearest even number.
* **Integer Math (Cents):** All internal arithmetic is performed in integer space (cents) to avoid precision loss.
* **Zero-Tolerance Validation:** Strict guards against `NaN`, `Infinity`, and invalid currency formats.

---

## ⚙️ Execution & Workflow

### **Environment Setup**
```bash
# Ensure Node.js v24.11.1+ is installed (see .nvmrc)
# Install dependencies and browsers
npm install && npx playwright install
```

### **Test Execution Commands**
```bash
# Quality Gates
npm run lint            # Code style enforcement
npm run typecheck       # TypeScript validation

# Running by Business Risk (Lanes)
npm run test:smoke      # Fast connectivity check (API + E2E)
npm run test:critical   # Core loan and transaction logic
npm run test:regression # Full Feature Parity (Nightly)
npm run test:a11y       # Accessibility Audit (Nightly)
npm run test:heartbeat  # API Health Monitor
npm run test:audit      # Run Regression + A11y (Full Audit)
npm run test:loans      # Run Loan Decision Table scenarios (47 tests)

# Running by Architectural Layer
npm run test:unit       # 189 tests (Logic & Math)
npm run test:api        # 84 tests (Contract & Integration)
npm run test:e2e        # ~46 tests (Full User Journeys)
```

### **Reporting**
```bash
# Generate and view Allure Dashboard locally
npm run report:generate
npm run report:open

# Generate Stakeholder Dashboard
npm run report:stakeholder
```

---

## 📊 Dual Dashboard Architecture

The reporting system provides two audience-specific views. Each test lane feeds JSON data into both dashboards via CI artefacts, with zero overlap between lanes.

```text
┌─────────────────────────────────────────────────────────────────┐
│                     TEST EXECUTION                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Vitest  │  │  Vitest  │  │Playwright│  │Playwright│        │
│  │   Unit   │  │   Loans  │  │   E2E    │  │   A11y   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       ▼             ▼             ▼             ▼               │
│  unit-summary  loan-results  e2e-critical   a11y-results       │
│    .json         .json       -results.json    .json            │
│                              e2e-regression                    │
│                              -results.json                     │
│       │             │             │             │               │
│       └──────┬──────┴──────┬──────┴──────┬──────┘               │
│              │             │             │                      │
│              ▼             ▼             ▼                      │
│      ┌───────────────────────────────────────────┐              │
│      │        CI ARTEFACTS (per workflow)         │              │
│      │   unit-reports / reports-critical /        │              │
│      │   reports-nightly / allure-results-*       │              │
│      └───────────────────┬───────────────────────┘              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
┌─────────────────────┐        ┌─────────────────────┐
│  ALLURE GENERATOR   │        │ STAKEHOLDER SCRIPT  │
│   (allure-cli)      │        │ (TypeScript)        │
│                     │        │                     │
│ + categories.json   │        │ Reads all 4 JSON    │
│ + environment.props │        │ files, merges E2E   │
└──────────┬──────────┘        └──────────┬──────────┘
           │                               │
           ▼                               ▼
┌─────────────────────┐        ┌─────────────────────┐
│ DEVELOPER DASHBOARD │        │STAKEHOLDER DASHBOARD│
│  /allure/           │        │  /stakeholder/      │
│                     │        │                     │
│ • Full test details │        │ • Confidence score  │
│ • History & trends  │        │ • Risk level badge  │
│ • Video/screenshots │        │ • Known defects     │
│ • Failure categories│        │ • Lane summaries    │
│ • Environment info  │        │ • WCAG compliance   │
└─────────────────────┘        └─────────────────────┘
```

### Stakeholder Dashboard Lanes

The stakeholder dashboard presents four non-overlapping quality lanes:

| Lane | Source Data | What It Shows |
|------|-----------|---------------|
| **Code Quality** | `unit-summary.json` (189 unit tests) | Pass rate for isolated logic and financial maths |
| **Financial Accuracy** | `loan-results.json` (47 loan tests) | Decision table + BVA coverage of loan approval rules (34 core scenarios + 6 critical path + 1 coverage + 6 negative) |
| **User Journey Coverage** | `e2e-critical-results.json` + `e2e-regression-results.json` | Known defects (amber), unexpected failures (red), skipped (grey). Critical = 31 tests (chromium), regression = 12 tests (3 browsers) |
| **WCAG Compliance** | `a11y-results.json` | Violation count and AA/A/Non-Compliant badge |

E2E metrics distinguish between outcomes using Playwright's `test.status` and `results[0].status`:
- **Known defect**: `test.fail()` tests that failed as expected (tracked, not alarming)
- **Unexpected failure**: Tests expected to pass that failed (requires investigation)
- **Skipped**: Conditionally skipped tests (e.g. auth-dependent)

### Dashboard Features Comparison

| Feature | Developer Dashboard (Allure) | Stakeholder Dashboard |
|---------|--------------------|-----------------------|
| Audience | QA Engineers, Developers | PMs, Leadership |
| Detail Level | Full test execution data | Aggregated metrics |
| History | 90-day trend analysis | Current run summary |
| Failures | Stack traces, screenshots, video | Known defects vs unexpected breakdown |
| Categories | Known Defects, Unexpected, Infrastructure | N/A (aggregated into lane status) |
| WCAG | Individual violations listed | Compliance badge (AA/A/NC) |
| Risk | Per-test severity labels | Overall confidence score + risk level |
| Data Source | Allure result XML/JSON | Report JSON artefacts (4 files) |

### Report Generation Commands

```bash
# Generate Allure report (requires Java)
npm run report:generate

# Generate Stakeholder dashboard (no Java required)
npm run report:stakeholder

# Open Allure report in browser
npm run report:open

# Serve Allure from results (live reload)
npm run report:serve
```