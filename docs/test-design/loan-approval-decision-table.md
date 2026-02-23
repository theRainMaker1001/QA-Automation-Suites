# Loan Approval Decision Table Testing

> **ISTQB Techniques**: Decision Table Testing + 3-Value Boundary Value Analysis  
> **System Under Test**: ParaBank Loan Request API  
> **Risk Level**: Critical (Financial transaction logic)

---

## Executive Summary

This document details the test design for ParaBank's loan approval functionality using **Decision Table Testing** combined with **3-Value Boundary Value Analysis (BVA)**. The loan approval process is critical to any banking system - incorrect approvals risk financial loss whereas incorrect denials damage customer relationships.

**Coverage achieved**: 34 test cases providing complete combinatorial coverage of business rules plus 3-Value BVA testing (-2, -1, 0, +1, +2) at every decision point.

---

## 1. System Analysis

### 1.1 API Under Test

```
POST /parabank/services/bank/requestLoan
```

| Parameter       | Type    | Description                         |
| --------------- | ------- | ----------------------------------- |
| `customerId`    | integer | Customer requesting the loan        |
| `amount`        | decimal | Loan amount requested               |
| `downPayment`   | decimal | Initial payment offered             |
| `fromAccountId` | integer | Account for down payment withdrawal |

### 1.2 Business Rules Discovered

Through source code analysis and API testing, two business rules govern loan approval:

```
RULE 1: availableFunds >= downPayment
        "Customer must have sufficient funds to cover the down payment"

RULE 2: downPayment / loanAmount >= 0.1
        "Down payment must be at least 10% of the loan amount"
```

**Rule Evaluation Order**: Rule 1 is evaluated first. If it fails, the API returns immediately without checking Rule 2. This order matters for test design.

### 1.3 Response Structure

```json
{
  "approved": boolean,
  "message": "error.insufficient.funds.for.down.payment" | "error.insufficient.down.payment" | null,
  "accountId": number | null,
  "responseDate": "ISO-8601 timestamp",
  "loanProviderName": "string"
}
```

---

## 2. Decision Table Oracle

### 2.1 Condition-Action Table

The decision table below represents all logical combinations of the two conditions:

```
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

### 2.2 Rule Explanations

| Rule | C1 (Funds) | C2 (Ratio) | Outcome                                | Business Rationale                        |
| :--: | :--------: | :--------: | -------------------------------------- | ----------------------------------------- |
|  R1  |    TRUE    |    TRUE    | **Approved**                           | Customer qualifies on all criteria        |
|  R2  |    TRUE    |   FALSE    | **Denied** - Insufficient down payment | Customer has funds but ratio too low      |
|  R3  |   FALSE    |    TRUE    | **Denied** - Insufficient funds        | Ratio would be OK but can't cover payment |
|  R4  |   FALSE    |   FALSE    | **Denied** - Insufficient funds        | Fails both, but funds checked first       |

> **Note**: R3 and R4 produce the same error message because Rule 1 (funds check) is evaluated first. This is correct behaviour - the system fails fast on the first unmet condition.

### 2.3 Decision Table Test Cases

| ID    | Loan Amount | Down Payment | Available Funds | Ratio | Expected          |
| ----- | ----------: | -----------: | --------------: | ----: | ----------------- |
| DT-R1 |      $1,000 |         $200 |            $500 |   20% | ✅ Approved       |
| DT-R2 |      $1,000 |          $50 |            $500 |    5% | ❌ Denied (ratio) |
| DT-R3 |      $1,000 |         $200 |            $100 |   20% | ❌ Denied (funds) |
| DT-R4 |      $1,000 |          $50 |             $25 |    5% | ❌ Denied (funds) |

---

## 3. Boundary Value Analysis

### 3.1 BVA Strategy: 3-Value Testing

**3-Value BVA** tests:

```
    Invalid Partition    │ Boundary │    Valid Partition
    ─────────────────────┼──────────┼─────────────────────
         -2    -1        │    0     │    +1    +2
```

| Position | Description              | Purpose                             |
| :------: | ------------------------ | ----------------------------------- |
|  **-2**  | Two steps below boundary | Confirm invalid partition behaviour |
|  **-1**  | One step below boundary  | Catch off-by-one errors             |
|  **0**   | At boundary (exact)      | Verify boundary position            |
|  **+1**  | One step above boundary  | Catch off-by-one errors             |
|  **+2**  | Two steps above boundary | Confirm valid partition behaviour   |

This is more rigorous than 2-value BVA and is **essential for critical financial logic** where off-by-one or off-by-two errors could result in incorrect approvals or denials worth thousands of pounds.

### 3.2 Boundary 1: Funds Check

**Boundary Definition**: `availableFunds = downPayment`

| ID                | Position | Available Funds | Down Payment | Expected    |
| ----------------- | :------: | --------------: | -----------: | ----------- |
| BVA-FUNDS-MINUS-2 |    -2    |         $199.98 |      $200.00 | ❌ Denied   |
| BVA-FUNDS-MINUS-1 |    -1    |         $199.99 |      $200.00 | ❌ Denied   |
| BVA-FUNDS-AT-0    |  **0**   |         $200.00 |      $200.00 | ✅ Approved |
| BVA-FUNDS-PLUS-1  |    +1    |         $200.01 |      $200.00 | ✅ Approved |
| BVA-FUNDS-PLUS-2  |    +2    |         $200.02 |      $200.00 | ✅ Approved |

> **Risk Mitigated**: Incorrect comparison operator (< vs <=) would cause funds exactly equal to down payment to be incorrectly denied.

### 3.3 Boundary 2: Down Payment Ratio

**Boundary Definition**: `downPayment / loanAmount = 0.10 (10%)`

For a $1,000 loan, boundary is at $100 down payment:

| ID                | Position | Down Payment |   Ratio | Expected    |
| ----------------- | :------: | -----------: | ------: | ----------- |
| BVA-RATIO-MINUS-2 |    -2    |       $99.98 |  9.998% | ❌ Denied   |
| BVA-RATIO-MINUS-1 |    -1    |       $99.99 |  9.999% | ❌ Denied   |
| BVA-RATIO-AT-0    |  **0**   |      $100.00 | 10.000% | ✅ Approved |
| BVA-RATIO-PLUS-1  |    +1    |      $100.01 | 10.001% | ✅ Approved |
| BVA-RATIO-PLUS-2  |    +2    |      $100.02 | 10.002% | ✅ Approved |

> **Risk Mitigated**: Floating-point comparison errors or incorrect threshold value.

### 3.4 Boundary 3: Loan Amount (Zero Boundary)

**Boundary Definition**: `loanAmount = 0` (division by zero risk)

| ID               | Position | Loan Amount | Scenario | Risk                   |
| ---------------- | :------: | ----------: | -------- | ---------------------- |
| BVA-LOAN-MINUS-2 |    -2    |      -$0.02 | Negative | Invalid input handling |
| BVA-LOAN-MINUS-1 |    -1    |      -$0.01 | Negative | Invalid input handling |
| BVA-LOAN-AT-0    |  **0**   |       $0.00 | Zero     | Division by zero       |
| BVA-LOAN-PLUS-1  |    +1    |       $0.01 | Minimum  | Precision loss         |
| BVA-LOAN-PLUS-2  |    +2    |       $0.02 | Small    | Precision loss         |

### 3.5 Boundary 4: Down Payment (Zero Boundary)

**Boundary Definition**: `downPayment = 0`

| ID                  | Position | Down Payment |    Ratio | Expected  |
| ------------------- | :------: | -----------: | -------: | --------- |
| BVA-DOWNPMT-MINUS-2 |    -2    |       -$0.02 | Negative | ❌ Denied |
| BVA-DOWNPMT-MINUS-1 |    -1    |       -$0.01 | Negative | ❌ Denied |
| BVA-DOWNPMT-AT-0    |  **0**   |        $0.00 |       0% | ❌ Denied |
| BVA-DOWNPMT-PLUS-1  |    +1    |        $0.01 |   0.001% | ❌ Denied |
| BVA-DOWNPMT-PLUS-2  |    +2    |        $0.02 |   0.002% | ❌ Denied |

### 3.6 Boundary 5: Available Funds (Zero Boundary)

**Boundary Definition**: `availableFunds = 0`

| ID                | Position | Available Funds | Scenario  | Expected  |
| ----------------- | :------: | --------------: | --------- | --------- |
| BVA-AVAIL-MINUS-2 |    -2    |          -$0.02 | Overdraft | ❌ Denied |
| BVA-AVAIL-MINUS-1 |    -1    |          -$0.01 | Overdraft | ❌ Denied |
| BVA-AVAIL-AT-0    |  **0**   |           $0.00 | Empty     | ❌ Denied |
| BVA-AVAIL-PLUS-1  |    +1    |           $0.01 | Minimal   | ❌ Denied |
| BVA-AVAIL-PLUS-2  |    +2    |           $0.02 | Minimal   | ❌ Denied |

### 3.7 Combined Boundaries (High-Risk Scenarios)

When **both** conditions are near their boundaries simultaneously:

| ID                                 | Position | Down Payment | Available Funds | Expected             |
| ---------------------------------- | -------- | -----------: | --------------: | -------------------- |
| BVA-COMBINED-BOTH-AT-0             | [0,0]    |      $100.00 |         $100.00 | ✅ Approved (barely) |
| BVA-COMBINED-FUNDS-0-RATIO-MINUS-1 | [0,-1]   |       $99.99 |          $99.99 | ❌ Denied (ratio)    |
| BVA-COMBINED-FUNDS-MINUS-1-RATIO-0 | [-1,0]   |      $100.00 |          $99.99 | ❌ Denied (funds)    |
| BVA-COMBINED-BOTH-PLUS-1           | [+1,+1]  |      $100.01 |         $100.02 | ✅ Approved          |
| BVA-COMBINED-BOTH-MINUS-1          | [-1,-1]  |       $99.99 |          $99.98 | ❌ Denied (funds)    |

> **Critical Test**: BVA-COMBINED-BOTH-AT-0 represents the minimum qualifying loan - exactly 10% down payment with exactly enough funds. This is the highest-risk approval scenario.

---

## 4. Test Coverage Summary

### 4.1 Test Case Distribution

| Category                               |  Count | Purpose                              |
| -------------------------------------- | -----: | ------------------------------------ |
| Decision Table Rules                   |      4 | Combinatorial coverage of conditions |
| Funds Boundary (3-Value BVA)           |      5 | -2, -1, 0, +1, +2 at funds check     |
| Ratio Boundary (3-Value BVA)           |      5 | -2, -1, 0, +1, +2 at 10% threshold   |
| Loan Amount Boundary (3-Value BVA)     |      5 | -2, -1, 0, +1, +2 at zero            |
| Down Payment Boundary (3-Value BVA)    |      5 | -2, -1, 0, +1, +2 at zero            |
| Available Funds Boundary (3-Value BVA) |      5 | -2, -1, 0, +1, +2 at zero            |
| Combined Boundaries                    |      5 | Critical multi-boundary scenarios    |
| **Total**                              | **34** |                                      |

### 4.2 Coverage Visualisation

```
                    LOAN APPROVAL TEST COVERAGE
    ═══════════════════════════════════════════════════════════════

    3-VALUE BVA: Tests at -2, -1, 0 (boundary), +1, +2 per boundary

    Decision Table Rules            ████████          4 tests
    Funds Check BVA (-2 to +2)      ██████████        5 tests
    Ratio Check BVA (-2 to +2)      ██████████        5 tests
    Loan Amount BVA (-2 to +2)      ██████████        5 tests
    Down Payment BVA (-2 to +2)     ██████████        5 tests
    Available Funds BVA (-2 to +2)  ██████████        5 tests
    Combined Boundaries             ██████████        5 tests
    ───────────────────────────────────────────────────────────────
    TOTAL                                            34 tests

    ═══════════════════════════════════════════════════════════════
```

### 4.3 Risk-Based Test Selection

For **fast-feedback coverage** (essential boundary cases):

| ID                     | Description         | Why Critical          |
| ---------------------- | ------------------- | --------------------- |
| BVA-FUNDS-AT-0         | Funds exactly equal | Boundary precision    |
| BVA-RATIO-AT-0         | Ratio exactly 10%   | Threshold precision   |
| BVA-LOAN-AT-0          | Zero loan amount    | Division by zero risk |
| BVA-DOWNPMT-AT-0       | Zero down payment   | Zero handling         |
| BVA-COMBINED-BOTH-AT-0 | Both at boundary    | Maximum risk approval |

---

## 5. Test Design Rationale

### 5.1 Why Decision Table Testing?

Decision Table Testing is appropriate when:

- ✅ Multiple conditions affect the outcome
- ✅ Conditions interact (funds check before ratio check)
- ✅ Business rules are well-defined
- ✅ Combinatorial coverage is required

For loan approval with 2 conditions, we have 2² = 4 rules to test. This is manageable and provides complete logical coverage.

### 5.2 Why 3-Value BVA?

3-value BVA tests five points per boundary (-2, -1, 0, +1, +2):

| Approach |  Points per Boundary  | When to Use                   |
| -------- | :-------------------: | ----------------------------- |
| 2-value  |   2 (at, one side)    | Lower risk systems            |
| 3-value  | 5 (-2, -1, 0, +1, +2) | **High-risk financial logic** |

For a banking system, the cost of an incorrect approval or denial justifies the additional test cases. Testing at -2 and +2 catches off-by-two errors that simpler approaches would miss.

### 5.3 Test Oracle

The **test oracle** (how we know expected results) derives from:

1. **Source code analysis**: ParaBank's `LoanProcessor.java` contains the exact logic
2. **API documentation**: Response structure and error messages
3. **Business domain knowledge**: Banking industry standards (10% down payment)

---

## 6. Implementation Notes

### 6.1 Test Data Dependencies

ParaBank's loan API uses **account balance** as `availableFunds`. This means:

- Tests require accounts with specific balances
- Account state must be reset between tests
- Or: Mock/stub the account service for unit tests

### 6.2 File Structure

```
api/
├── src/
│   ├── helpers/
│   │   ├── http.ts
│   │   ├── performance.ts
│   │   ├── retry.ts
│   │   ├── schema-validator.ts
│   │   └── test-reporter.ts
│   ├── schemas/
│   │   └── loan.schema.ts
│   ├── tests/
│   │   ├── unit/                           # Fast, isolated tests
│   │   │   ├── env.test.ts
│   │   │   ├── financial-math.test.ts
│   │   │   └── ...
│   │   ├── integration/                    # API contract tests
│   │   │   ├── accounts.api.test.ts
│   │   │   └── schema-validation.api.test.ts
│   │   └── critical/                       # Business logic tests
│   │       ├── heartbeat.api.test.ts
│   │       ├── loan-decision-table.ts      # Test data generator (34 cases)
│   │       └── loan-decision-table.test.ts # Test implementation
│   └── types/
│       └── loan.types.ts

e2e/
├── tests/
│   └── bankProject/
│       ├── smoke.header.spec.ts            # @smoke
│       ├── critical.login.spec.ts          # @critical
│       ├── critical.accessibility.spec.ts  # @a11y
│       └── ...
├── pages/                                  # Page Object Model
├── fixtures/
├── global.setup.ts                         # Auth session setup
└── playwright.config.ts

scripts/
├── run-loan-tests.ts                       # Loan test runner + report
├── run-unit-tests.ts                       # Unit test runner
├── run-a11y-tests.ts                       # Accessibility report
├── generate-stakeholder-dashboard.ts       # Executive dashboard
├── preserve-allure-history.ts              # Trend tracking
└── ...                                     # Additional utility scripts

config/
├── env.ts                                  # Zod-validated environment
└── tooling-summary.ts

reports/                                    # Generated reports (not checked in)
├── loan-results.json                       # Loan test data for stakeholder dashboard
├── unit-summary.json                       # Unit test data for stakeholder dashboard
├── a11y-results.json                       # A11y data for stakeholder dashboard
├── loan-api-report.md                      # Human-readable loan test report
├── a11y-compliance-report.md              # Human-readable accessibility report
└── ...                                     # Additional report artefacts

allure-results/                             # Test results (per lane)
├── unit/
├── integration/
└── e2e/

.github/workflows/
├── ci.yml                                  # Testing lanes orchestration
├── playwright.yml                          # E2E test lanes
└── deploy-reports.yml                      # Report generation & GitHub Pages
```

### 6.3 Running the Tests

```bash
# Run all loan decision table tests (41 tests)
npm run test:loans:only

# Run with markdown report generation
npm run test:loans

# Run via critical lane (includes heartbeat + loans)
npm run test:critical

# Run specific boundary category using test name pattern
npx vitest run api/src/tests/critical/loan-decision-table.test.ts --testNamePattern "BVA: Ratio"

# Run decision table rules only
npx vitest run api/src/tests/critical/loan-decision-table.test.ts --testNamePattern "Decision Table"
```

### 6.4 Vitest Configuration

The loan tests use `vitest.integration.config.ts`:

```typescript
{
  include: ['api/src/tests/integration/**/*.test.ts', 'api/src/tests/critical/**/*.test.ts'],
  testTimeout: 30000,
  reporters: ['verbose', ['allure-vitest', { resultsDir: './allure-results/integration' }]]
}
```

---

## 7. CI/CD Integration

### 7.1 Testing Lane Strategy

The loan approval tests are part of the **critical lane** in the risk-based testing pipeline:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  COMMIT GATE    │────▶│   SMOKE LANE    │────▶│  CRITICAL LANE  │
│  (Every Push)   │     │(Push/PR/Dispatch)│    │  (PR/Dispatch)  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • Type check    │     │ • API @smoke    │     │ • API @critical │
│ • Lint + Format │     │ • E2E @smoke    │     │ • E2E @critical │
│ • Unit tests    │     │                 │     │                 │
│ • Loan report   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 7.2 GitHub Actions Workflows

| Workflow             | Trigger                               | Loan Tests Run?                                           |
| -------------------- | ------------------------------------- | --------------------------------------------------------- |
| `ci.yml`             | Push to `main`, PR, workflow dispatch | ✅ Commit gate (every push) + Critical lane (PR/dispatch) |
| `playwright.yml`     | Nightly schedule, workflow dispatch   | ❌ E2E only                                               |
| `deploy-reports.yml` | On workflow completion                | ✅ For reporting                                          |

### 7.3 Environment Variables

```yaml
env:
  BANK_BASE_URL: https://parabank.parasoft.com/parabank
  BANK_CUSTOMER_ID: '12345'
  API_LATENCY_MS: 5000 # SLA threshold
```

---

## 8. Report Generation

### 8.1 Loan Test Report

The `scripts/run-loan-tests.ts` script generates a detailed markdown report:

```bash
npm run test:loans
# Output: reports/loan-api-report.md
```

**Report Contents**:

- Summary table (total, passed, failed, pass rate, duration)
- Test technique breakdown (Decision Table vs BVA categories)
- Results grouped by boundary type
- Failed test details with error messages

### 8.2 Allure Integration

Test results are published to Allure for trend tracking:

```
allure-results/
├── integration/          # Loan tests land here (via moveAllureResults)
└── ...

# Generated report
allure-report/
└── index.html            # Interactive dashboard
```

### 8.3 Stakeholder Dashboard

Executive-level metrics are aggregated via `scripts/generate-stakeholder-dashboard.ts`:

- **Confidence Score**: Weighted average (critical/loans 40%, e2e 25%, unit 20%, a11y 15%)
- **Risk Level**: LOW | MEDIUM | HIGH | CRITICAL
- **Lane Health**: Per-lane pass/fail indicators
- **Totals policy**: Stakeholder top-level totals include the WCAG/a11y lane. This is intentionally more redundant than strict lane-isolation arithmetic.
- **Allure policy**: Developer dashboard may include overlapping executions across lanes by design for richer debugging context.

Access the dashboards:

- **Developer View**: `/allure/` - Full Allure report with test details
- **Stakeholder View**: `/stakeholder/` - Executive summary

---

## 9. References

- **ISTQB Foundation Level Syllabus v4.0**
- **ParaBank Source Code** - `com.parasoft.parabank.domain.logic.impl.LoanProcessor`
- **ParaBank API Documentation** - Swagger UI at `/parabank/api-docs/index.html`
- **Project Repository** - Test implementation in `api/src/tests/critical/loan-decision-table.test.ts`
- **CI/CD Configuration** - `.github/workflows/ci.yml` (critical lane)

---
