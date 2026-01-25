/**
 * Loan Approval Decision Table
 *
 * ISTQB Decision Table Testing combined with 3-Value Boundary Value Analysis
 *
 * ParaBank's loan approval implements two business rules evaluated in sequence:
 *
 *   Rule 1: availableFunds >= downPayment
 *           (Customer must have funds to cover the down payment)
 *
 *   Rule 2: downPayment / loanAmount >= 0.1
 *           (Down payment must be at least 10% of loan amount)
 *
 * Decision Table Structure:
 * ┌─────────────────────────────────┬─────┬─────┬─────┬─────┐
 * │ CONDITIONS                       │ R1  │ R2  │ R3  │ R4  │
 * ├─────────────────────────────────┼─────┼─────┼─────┼─────┤
 * │ C1: availableFunds >= downPmt   │  T  │  T  │  F  │  F  │
 * │ C2: downPmt/loanAmt >= 0.1      │  T  │  F  │  T  │  F  │
 * ├─────────────────────────────────┼─────┼─────┼─────┼─────┤
 * │ ACTIONS                          │     │     │     │     │
 * ├─────────────────────────────────┼─────┼─────┼─────┼─────┤
 * │ A1: Approve loan                │  X  │     │     │     │
 * │ A2: Deny - insufficient down    │     │  X  │     │     │
 * │ A3: Deny - insufficient funds   │     │     │  X  │  X  │
 * └─────────────────────────────────┴─────┴─────┴─────┴─────┘
 *
 * Note: Rule evaluation order matters. R1 (funds check) is evaluated first.
 * If R1 fails, the API returns immediately without checking R2.
 * This means R3 and R4 produce the same action (insufficient funds).
 *
 * 3-Value BVA Applied at Each Boundary:
 * ─────────────────────────────────────────────────────────────────────────
 * 3-value BVA tests FIVE points per boundary: -2, -1, 0 (boundary), +1, +2
 *
 *   Invalid Partition    │ Boundary │    Valid Partition
 *   ─────────────────────┼──────────┼─────────────────────
 *        -2    -1        │    0     │    +1    +2
 *
 * This provides confidence that:
 * - The boundary is at the correct position
 * - Values either side behave as expected
 * - No off-by-one or off-by-two errors exist
 *
 * Boundaries tested:
 * - Boundary 1: availableFunds = downPayment (funds check)
 * - Boundary 2: downPayment = 0.1 * loanAmount (10% ratio check)
 */

import type { LoanDecisionTestCase, LoanDecision, BoundaryPoint } from '../../types/loan.types.js';

// ============================================================================
// BUSINESS RULE CONSTANTS
// ============================================================================

/** Minimum down payment ratio required for loan approval (10%) */
const MIN_DOWN_PAYMENT_RATIO = 0.1;

/** Standard loan amount for baseline tests */
const STANDARD_LOAN_AMOUNT = 1000;

/** Epsilon for boundary calculations - smallest meaningful currency unit */
const BOUNDARY_EPSILON = 0.01;

// ============================================================================
// HELPER FUNCTIONS FOR 3-VALUE BVA
// ============================================================================
// 3-value BVA: test at -2, -1, 0 (boundary), +1, +2 from the boundary

/**
 * Calculate down payment at exact 10% boundary (position 0)
 */
function ratioAtBoundary(loanAmount: number): number {
  return loanAmount * MIN_DOWN_PAYMENT_RATIO;
}

/**
 * Calculate down payment at -1 from boundary (just below 10%)
 */
function ratioMinusOne(loanAmount: number): number {
  return loanAmount * MIN_DOWN_PAYMENT_RATIO - BOUNDARY_EPSILON;
}

/**
 * Calculate down payment at -2 from boundary (two steps below 10%)
 */
function ratioMinusTwo(loanAmount: number): number {
  return loanAmount * MIN_DOWN_PAYMENT_RATIO - 2 * BOUNDARY_EPSILON;
}

/**
 * Calculate down payment at +1 from boundary (just above 10%)
 */
function ratioPlusOne(loanAmount: number): number {
  return loanAmount * MIN_DOWN_PAYMENT_RATIO + BOUNDARY_EPSILON;
}

/**
 * Calculate down payment at +2 from boundary (two steps above 10%)
 */
function ratioPlusTwo(loanAmount: number): number {
  return loanAmount * MIN_DOWN_PAYMENT_RATIO + 2 * BOUNDARY_EPSILON;
}

// ============================================================================
// DECISION TABLE RULES (Core combinatorial coverage)
// ============================================================================

/**
 * Decision Table Rule Tests
 *
 * These test the four logical combinations of conditions.
 * Each rule uses values clearly within partitions (not on boundaries).
 */
export const decisionTableRules: LoanDecisionTestCase[] = [
  // Rule 1: Both conditions TRUE → APPROVED
  {
    id: 'DT-R1',
    description: 'Rule 1: Sufficient funds AND sufficient down payment ratio → Approved',
    tags: ['@decision-table', '@rule', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200, // 20% ratio - clearly above 10%
    availableFunds: 500, // Clearly above down payment
    expectedDecision: 'APPROVED',
  },

  // Rule 2: Funds OK but ratio insufficient → DENIED (insufficient down payment)
  {
    id: 'DT-R2',
    description: 'Rule 2: Sufficient funds BUT insufficient down payment ratio → Denied',
    tags: ['@decision-table', '@rule', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 50, // 5% ratio - clearly below 10%
    availableFunds: 500, // Clearly above down payment
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Rule 3: Insufficient funds (ratio would be OK) → DENIED (insufficient funds)
  {
    id: 'DT-R3',
    description: 'Rule 3: Insufficient funds BUT sufficient ratio → Denied (funds checked first)',
    tags: ['@decision-table', '@rule', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200, // 20% ratio - would pass R2
    availableFunds: 100, // Below down payment
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Rule 4: Both conditions FALSE → DENIED (insufficient funds - checked first)
  {
    id: 'DT-R4',
    description: 'Rule 4: Insufficient funds AND insufficient ratio → Denied (funds checked first)',
    tags: ['@decision-table', '@rule', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 50, // 5% ratio - would fail R2
    availableFunds: 25, // Below down payment - fails R1 first
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },
];

// ============================================================================
// BOUNDARY 1: AVAILABLE FUNDS vs DOWN PAYMENT (3-Value BVA = 5 points)
// ============================================================================

/**
 * Boundary 1: availableFunds = downPayment
 *
 * 3-Value BVA: -2, -1, 0 (boundary), +1, +2
 * Down payment fixed at $200, ratio kept clearly valid (20%) to isolate this boundary.
 */
export const fundsCheckBoundary: LoanDecisionTestCase[] = [
  // Position -2: availableFunds = downPayment - $0.02
  {
    id: 'BVA-FUNDS-MINUS-2',
    description: 'Funds boundary [-2]: Available funds $0.02 BELOW down payment → Denied',
    tags: ['@bva', '@boundary', '@funds-check', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200,
    availableFunds: 200 - 2 * BOUNDARY_EPSILON, // 199.98
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Position -1: availableFunds = downPayment - $0.01
  {
    id: 'BVA-FUNDS-MINUS-1',
    description: 'Funds boundary [-1]: Available funds $0.01 BELOW down payment → Denied',
    tags: ['@bva', '@boundary', '@funds-check', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200,
    availableFunds: 200 - BOUNDARY_EPSILON, // 199.99
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Position 0: availableFunds === downPayment (BOUNDARY)
  {
    id: 'BVA-FUNDS-AT-0',
    description: 'Funds boundary [0]: Available funds EXACTLY EQUAL to down payment → Approved',
    tags: ['@bva', '@boundary', '@funds-check', '@positive', '@critical'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200,
    availableFunds: 200, // Exactly equal
    expectedDecision: 'APPROVED',
  },

  // Position +1: availableFunds = downPayment + $0.01
  {
    id: 'BVA-FUNDS-PLUS-1',
    description: 'Funds boundary [+1]: Available funds $0.01 ABOVE down payment → Approved',
    tags: ['@bva', '@boundary', '@funds-check', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200,
    availableFunds: 200 + BOUNDARY_EPSILON, // 200.01
    expectedDecision: 'APPROVED',
  },

  // Position +2: availableFunds = downPayment + $0.02
  {
    id: 'BVA-FUNDS-PLUS-2',
    description: 'Funds boundary [+2]: Available funds $0.02 ABOVE down payment → Approved',
    tags: ['@bva', '@boundary', '@funds-check', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 200,
    availableFunds: 200 + 2 * BOUNDARY_EPSILON, // 200.02
    expectedDecision: 'APPROVED',
  },
];

// ============================================================================
// BOUNDARY 2: DOWN PAYMENT RATIO (3-Value BVA = 5 points)
// ============================================================================

/**
 * Boundary 2: downPayment / loanAmount = 0.1 (10%)
 *
 * 3-Value BVA: -2, -1, 0 (boundary), +1, +2
 * For $1000 loan, boundary is at $100 down payment.
 * Available funds kept clearly sufficient to isolate this boundary.
 */
export const ratioCheckBoundary: LoanDecisionTestCase[] = [
  // Position -2: ratio = 10% - $0.02 (9.998%)
  {
    id: 'BVA-RATIO-MINUS-2',
    description: 'Ratio boundary [-2]: Down payment $0.02 BELOW 10% threshold → Denied',
    tags: ['@bva', '@boundary', '@ratio-check', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioMinusTwo(STANDARD_LOAN_AMOUNT), // 99.98
    availableFunds: 500, // Clearly sufficient
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Position -1: ratio = 10% - $0.01 (9.999%)
  {
    id: 'BVA-RATIO-MINUS-1',
    description: 'Ratio boundary [-1]: Down payment $0.01 BELOW 10% threshold → Denied',
    tags: ['@bva', '@boundary', '@ratio-check', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioMinusOne(STANDARD_LOAN_AMOUNT), // 99.99
    availableFunds: 500,
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Position 0: ratio = exactly 10% (BOUNDARY)
  {
    id: 'BVA-RATIO-AT-0',
    description: 'Ratio boundary [0]: Down payment EXACTLY 10% of loan amount → Approved',
    tags: ['@bva', '@boundary', '@ratio-check', '@positive', '@critical'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioAtBoundary(STANDARD_LOAN_AMOUNT), // 100.00
    availableFunds: 500,
    expectedDecision: 'APPROVED',
  },

  // Position +1: ratio = 10% + $0.01 (10.001%)
  {
    id: 'BVA-RATIO-PLUS-1',
    description: 'Ratio boundary [+1]: Down payment $0.01 ABOVE 10% threshold → Approved',
    tags: ['@bva', '@boundary', '@ratio-check', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioPlusOne(STANDARD_LOAN_AMOUNT), // 100.01
    availableFunds: 500,
    expectedDecision: 'APPROVED',
  },

  // Position +2: ratio = 10% + $0.02 (10.002%)
  {
    id: 'BVA-RATIO-PLUS-2',
    description: 'Ratio boundary [+2]: Down payment $0.02 ABOVE 10% threshold → Approved',
    tags: ['@bva', '@boundary', '@ratio-check', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioPlusTwo(STANDARD_LOAN_AMOUNT), // 100.02
    availableFunds: 500,
    expectedDecision: 'APPROVED',
  },
];

// ============================================================================
// LOAN AMOUNT BOUNDARIES (3-Value BVA = 5 points at zero boundary)
// ============================================================================

/**
 * Loan Amount Boundaries
 *
 * 3-Value BVA at the zero/minimum boundary.
 * Boundary: loanAmount = 0 (division by zero risk)
 *
 * For loan amounts, we test: -2, -1, 0, +1, +2 where 0 = $0.00
 * Note: Negative loans are likely invalid but tested for robustness.
 */
export const loanAmountBoundary: LoanDecisionTestCase[] = [
  // Position -2: Negative loan amount
  {
    id: 'BVA-LOAN-MINUS-2',
    description: 'Loan amount boundary [-2]: Negative loan amount (-$0.02) → Edge case',
    tags: ['@bva', '@boundary', '@loan-amount', '@edge-case', '@negative'],
    loanAmount: -2 * BOUNDARY_EPSILON, // -$0.02
    downPayment: 0,
    availableFunds: 100,
    expectedDecision: 'APPROVED', // Verify actual behaviour - may error
  },

  // Position -1: Negative loan amount
  {
    id: 'BVA-LOAN-MINUS-1',
    description: 'Loan amount boundary [-1]: Negative loan amount (-$0.01) → Edge case',
    tags: ['@bva', '@boundary', '@loan-amount', '@edge-case', '@negative'],
    loanAmount: -BOUNDARY_EPSILON, // -$0.01
    downPayment: 0,
    availableFunds: 100,
    expectedDecision: 'APPROVED', // Verify actual behaviour
  },

  // Position 0: Zero loan amount (BOUNDARY - division by zero risk)
  {
    id: 'BVA-LOAN-AT-0',
    description: 'Loan amount boundary [0]: Zero loan amount → Division by zero risk',
    tags: ['@bva', '@boundary', '@loan-amount', '@edge-case', '@critical'],
    loanAmount: 0,
    downPayment: 0,
    availableFunds: 100,
    expectedDecision: 'APPROVED', // Verify actual behaviour - may error
  },

  // Position +1: Minimum positive loan amount
  {
    id: 'BVA-LOAN-PLUS-1',
    description: 'Loan amount boundary [+1]: Minimum positive loan ($0.01)',
    tags: ['@bva', '@boundary', '@loan-amount', '@edge-case'],
    loanAmount: BOUNDARY_EPSILON, // $0.01
    downPayment: BOUNDARY_EPSILON * MIN_DOWN_PAYMENT_RATIO, // $0.001 (10%)
    availableFunds: 1,
    expectedDecision: 'APPROVED',
  },

  // Position +2: Small positive loan amount
  {
    id: 'BVA-LOAN-PLUS-2',
    description: 'Loan amount boundary [+2]: Small positive loan ($0.02)',
    tags: ['@bva', '@boundary', '@loan-amount', '@edge-case'],
    loanAmount: 2 * BOUNDARY_EPSILON, // $0.02
    downPayment: 2 * BOUNDARY_EPSILON * MIN_DOWN_PAYMENT_RATIO, // $0.002 (10%)
    availableFunds: 1,
    expectedDecision: 'APPROVED',
  },
];

// ============================================================================
// DOWN PAYMENT BOUNDARIES (3-Value BVA = 5 points at zero boundary)
// ============================================================================

/**
 * Down Payment Boundaries
 *
 * 3-Value BVA at the zero boundary for down payment.
 * Boundary: downPayment = 0
 */
export const downPaymentBoundary: LoanDecisionTestCase[] = [
  // Position -2: Negative down payment
  {
    id: 'BVA-DOWNPMT-MINUS-2',
    description: 'Down payment boundary [-2]: Negative down payment (-$0.02) → Edge case',
    tags: ['@bva', '@boundary', '@down-payment', '@edge-case', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: -2 * BOUNDARY_EPSILON, // -$0.02
    availableFunds: 500,
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT', // Negative ratio
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Position -1: Negative down payment
  {
    id: 'BVA-DOWNPMT-MINUS-1',
    description: 'Down payment boundary [-1]: Negative down payment (-$0.01) → Edge case',
    tags: ['@bva', '@boundary', '@down-payment', '@edge-case', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: -BOUNDARY_EPSILON, // -$0.01
    availableFunds: 500,
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Position 0: Zero down payment (BOUNDARY)
  {
    id: 'BVA-DOWNPMT-AT-0',
    description: 'Down payment boundary [0]: Zero down payment → Denied (0% < 10%)',
    tags: ['@bva', '@boundary', '@down-payment', '@negative', '@critical'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 0,
    availableFunds: 500,
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Position +1: Minimum positive down payment
  {
    id: 'BVA-DOWNPMT-PLUS-1',
    description: 'Down payment boundary [+1]: Minimum positive ($0.01) → Denied (0.001% < 10%)',
    tags: ['@bva', '@boundary', '@down-payment', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: BOUNDARY_EPSILON, // $0.01 = 0.001% of $1000
    availableFunds: 500,
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Position +2: Small positive down payment
  {
    id: 'BVA-DOWNPMT-PLUS-2',
    description: 'Down payment boundary [+2]: Small positive ($0.02) → Denied (0.002% < 10%)',
    tags: ['@bva', '@boundary', '@down-payment', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 2 * BOUNDARY_EPSILON, // $0.02 = 0.002% of $1000
    availableFunds: 500,
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },
];

// ============================================================================
// AVAILABLE FUNDS BOUNDARIES (3-Value BVA = 5 points at zero boundary)
// ============================================================================

/**
 * Available Funds Boundaries
 *
 * 3-Value BVA at the zero boundary for available funds.
 * Boundary: availableFunds = 0
 */
export const availableFundsBoundary: LoanDecisionTestCase[] = [
  // Position -2: Deeply negative (overdraft)
  {
    id: 'BVA-AVAIL-MINUS-2',
    description: 'Available funds boundary [-2]: Overdraft (-$0.02) → Denied',
    tags: ['@bva', '@boundary', '@available-funds', '@edge-case', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 100, // Valid 10% ratio
    availableFunds: -2 * BOUNDARY_EPSILON, // -$0.02
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Position -1: Slightly negative (overdraft)
  {
    id: 'BVA-AVAIL-MINUS-1',
    description: 'Available funds boundary [-1]: Overdraft (-$0.01) → Denied',
    tags: ['@bva', '@boundary', '@available-funds', '@edge-case', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 100,
    availableFunds: -BOUNDARY_EPSILON, // -$0.01
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Position 0: Zero available funds (BOUNDARY)
  {
    id: 'BVA-AVAIL-AT-0',
    description: 'Available funds boundary [0]: Zero funds → Denied',
    tags: ['@bva', '@boundary', '@available-funds', '@negative', '@critical'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 100,
    availableFunds: 0,
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Position +1: Minimum positive funds
  {
    id: 'BVA-AVAIL-PLUS-1',
    description: 'Available funds boundary [+1]: Minimal funds ($0.01) → Denied (< down payment)',
    tags: ['@bva', '@boundary', '@available-funds', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 100,
    availableFunds: BOUNDARY_EPSILON, // $0.01 < $100 down payment
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Position +2: Small positive funds
  {
    id: 'BVA-AVAIL-PLUS-2',
    description: 'Available funds boundary [+2]: Small funds ($0.02) → Denied (< down payment)',
    tags: ['@bva', '@boundary', '@available-funds', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: 100,
    availableFunds: 2 * BOUNDARY_EPSILON, // $0.02 < $100 down payment
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },
];

// ============================================================================
// COMBINED BOUNDARY TESTS (Both boundaries at critical points - 5 key combos)
// ============================================================================

/**
 * Combined Boundary Tests
 *
 * Tests where BOTH boundaries are at their critical points simultaneously.
 * These are high-risk scenarios for a bank.
 *
 * We test the 5 most critical combinations where both conditions
 * are near their respective boundaries.
 */
export const combinedBoundaryTests: LoanDecisionTestCase[] = [
  // Both at exact boundary - maximum risk approval
  {
    id: 'BVA-COMBINED-BOTH-AT-0',
    description: 'Combined [0,0]: Funds exactly equal AND ratio exactly 10% → Approved (barely)',
    tags: ['@bva', '@combined', '@critical', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioAtBoundary(STANDARD_LOAN_AMOUNT), // 100.00
    availableFunds: ratioAtBoundary(STANDARD_LOAN_AMOUNT), // 100.00
    expectedDecision: 'APPROVED',
  },

  // Funds at boundary, ratio at -1
  {
    id: 'BVA-COMBINED-FUNDS-0-RATIO-MINUS-1',
    description: 'Combined [0,-1]: Funds exactly equal BUT ratio $0.01 below → Denied (ratio)',
    tags: ['@bva', '@combined', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioMinusOne(STANDARD_LOAN_AMOUNT), // 99.99
    availableFunds: ratioMinusOne(STANDARD_LOAN_AMOUNT), // 99.99
    expectedDecision: 'DENIED_INSUFFICIENT_DOWN_PAYMENT',
    expectedMessage: 'error.insufficient.down.payment',
  },

  // Funds at -1, ratio at boundary
  {
    id: 'BVA-COMBINED-FUNDS-MINUS-1-RATIO-0',
    description: 'Combined [-1,0]: Funds $0.01 below BUT ratio exactly 10% → Denied (funds)',
    tags: ['@bva', '@combined', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioAtBoundary(STANDARD_LOAN_AMOUNT), // 100.00
    availableFunds: ratioAtBoundary(STANDARD_LOAN_AMOUNT) - BOUNDARY_EPSILON, // 99.99
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },

  // Both at +1 - safely approved
  {
    id: 'BVA-COMBINED-BOTH-PLUS-1',
    description: 'Combined [+1,+1]: Both $0.01 above boundary → Approved',
    tags: ['@bva', '@combined', '@positive'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioPlusOne(STANDARD_LOAN_AMOUNT), // 100.01
    availableFunds: ratioPlusOne(STANDARD_LOAN_AMOUNT) + BOUNDARY_EPSILON, // 100.02
    expectedDecision: 'APPROVED',
  },

  // Both at -1 - double failure (funds checked first)
  {
    id: 'BVA-COMBINED-BOTH-MINUS-1',
    description: 'Combined [-1,-1]: Both $0.01 below boundary → Denied (funds checked first)',
    tags: ['@bva', '@combined', '@negative'],
    loanAmount: STANDARD_LOAN_AMOUNT,
    downPayment: ratioMinusOne(STANDARD_LOAN_AMOUNT), // 99.99
    availableFunds: ratioMinusOne(STANDARD_LOAN_AMOUNT) - BOUNDARY_EPSILON, // 99.98
    expectedDecision: 'DENIED_INSUFFICIENT_FUNDS',
    expectedMessage: 'error.insufficient.funds.for.down.payment',
  },
];

// ============================================================================
// ALL TEST CASES - Complete Decision Table + BVA Suite
// ============================================================================

/**
 * Complete test suite combining Decision Table rules with 3-Value BVA
 *
 * Total coverage:
 * - 4 Decision Table rules (combinatorial)
 * - 5 Funds boundary tests (3-value BVA: -2, -1, 0, +1, +2)
 * - 5 Ratio boundary tests (3-value BVA: -2, -1, 0, +1, +2)
 * - 5 Loan amount boundary tests (3-value BVA: -2, -1, 0, +1, +2)
 * - 5 Down payment boundary tests (3-value BVA: -2, -1, 0, +1, +2)
 * - 5 Available funds boundary tests (3-value BVA: -2, -1, 0, +1, +2)
 * - 5 Combined boundary tests (critical combinations)
 *
 * TOTAL: 4 + (5 × 5) + 5 = 34 test cases
 */
export const allLoanDecisionTests: LoanDecisionTestCase[] = [
  ...decisionTableRules,
  ...fundsCheckBoundary,
  ...ratioCheckBoundary,
  ...loanAmountBoundary,
  ...downPaymentBoundary,
  ...availableFundsBoundary,
  ...combinedBoundaryTests,
];

// ============================================================================
// TEST CASE LOOKUP & UTILITIES
// ============================================================================

/**
 * Get test cases by tag
 */
export function getTestCasesByTag(tag: string): LoanDecisionTestCase[] {
  return allLoanDecisionTests.filter((tc) => tc.tags.includes(tag));
}

/**
 * Get critical test cases (minimum regression suite)
 */
export function getCriticalTests(): LoanDecisionTestCase[] {
  return getTestCasesByTag('@critical');
}

/**
 * Get decision table rule tests only
 */
export function getDecisionTableTests(): LoanDecisionTestCase[] {
  return getTestCasesByTag('@decision-table');
}

/**
 * Get all BVA tests
 */
export function getBVATests(): LoanDecisionTestCase[] {
  return getTestCasesByTag('@bva');
}

/**
 * Decision outcome to expected message mapping
 */
export const decisionToMessage: Record<LoanDecision, string | undefined> = {
  APPROVED: undefined,
  DENIED_INSUFFICIENT_DOWN_PAYMENT: 'error.insufficient.down.payment',
  DENIED_INSUFFICIENT_FUNDS: 'error.insufficient.funds.for.down.payment',
};
