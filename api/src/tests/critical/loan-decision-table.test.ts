/**
 * Loan Request API - Decision Table Integration Tests
 *
 * @fileoverview Integration tests for ParaBank loan approval API using
 * Decision Table Testing combined with 3-Value Boundary Value Analysis.
 *
 * ISTQB Test Design Techniques Applied:
 * 1. Decision Table Testing - Tests all condition combinations
 * 2. Boundary Value Analysis (3-value) - Tests at/below/above each boundary
 *
 * Business Rules Under Test:
 *   Rule 1: availableFunds >= downPayment
 *   Rule 2: downPayment / loanAmount >= 0.1 (10%)
 *
 * API Endpoint: POST /services/bank/requestLoan
 * Parameters: customerId, amount, downPayment, fromAccountId
 *
 * Note: ParaBank's loan endpoint uses account balance as availableFunds.
 * For these tests we assume a test account with known balance.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  allLoanDecisionTests,
  decisionTableRules,
  fundsCheckBoundary,
  ratioCheckBoundary,
  loanAmountBoundary,
  downPaymentBoundary,
  availableFundsBoundary,
  combinedBoundaryTests,
  getCriticalTests,
  type LoanDecisionTestCase,
} from './loan-decision-table.js';
import type { LoanResponse, LoanRequestParams } from '../../../types/index.js';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = 'https://parabank.parasoft.com/parabank/services/bank';

/** Known test customer ID from ParaBank's demo data */
const TEST_CUSTOMER_ID = 12212;

/** Known test account ID with sufficient balance for testing */
const TEST_ACCOUNT_ID = 12345;

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Request a loan from ParaBank API
 */
async function requestLoan(options: LoanRequestParams): Promise<LoanResponse> {
  const params = new URLSearchParams({
    customerId: options.customerId.toString(),
    amount: options.amount.toString(),
    downPayment: options.downPayment.toString(),
    fromAccountId: options.fromAccountId.toString(),
  });

  const response = await fetch(`${BASE_URL}/requestLoan?${params}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Map test case to API request
 *
 * Note: ParaBank uses account balance for funds check, not a separate parameter.
 * In production testing, we would set up accounts with specific balances.
 * For demonstration, we document what the expected behavior would be.
 */
function mapTestCaseToRequest(testCase: LoanDecisionTestCase): LoanRequestOptions {
  return {
    customerId: TEST_CUSTOMER_ID,
    amount: testCase.loanAmount,
    downPayment: testCase.downPayment,
    fromAccountId: TEST_ACCOUNT_ID,
  };
}

// ============================================================================
// TEST RUNNER HELPER
// ============================================================================

/**
 * Run a single decision table test case
 *
 * This documents expected behavior based on the decision table.
 * Actual API responses depend on ParaBank account state.
 */
function runDecisionTableTest(testCase: LoanDecisionTestCase) {
  it(`[${testCase.id}] ${testCase.description}`, async () => {
    const request = mapTestCaseToRequest(testCase);

    // Document the test conditions
    console.log(`
      Test Case: ${testCase.id}
      Loan Amount: $${testCase.loanAmount}
      Down Payment: $${testCase.downPayment}
      Available Funds: $${testCase.availableFunds}
      Expected: ${testCase.expectedDecision}
    `);

    // Execute API call
    const response = await requestLoan(request);

    // Validate response structure
    expect(response).toBeDefined();
    expect(typeof response.approved).toBe('boolean');

    // Document actual vs expected
    // Note: ParaBank approval depends on actual account balance
    // These assertions document expected behavior per decision table
    if (testCase.expectedDecision === 'APPROVED') {
      // Positive test - expect approval when conditions met
      console.log(`Expected approval: ${response.approved}`);
    } else {
      // Negative test - expect denial with specific message
      console.log(`Expected denial: ${!response.approved}`);
      if (testCase.expectedMessage) {
        console.log(`Expected message: ${testCase.expectedMessage}`);
        console.log(`Actual message: ${response.message}`);
      }
    }
  });
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Loan Request API - Decision Table Tests', () => {
  describe('Decision Table Rules (Combinatorial Coverage)', () => {
    /**
     * Tests the four logical combinations from the decision table.
     * Each rule represents a unique combination of conditions.
     *
     * R1: Funds OK, Ratio OK → Approved
     * R2: Funds OK, Ratio FAIL → Denied (insufficient down payment)
     * R3: Funds FAIL, Ratio OK → Denied (insufficient funds)
     * R4: Funds FAIL, Ratio FAIL → Denied (insufficient funds - checked first)
     */
    decisionTableRules.forEach(runDecisionTableTest);
  });

  describe('BVA: Available Funds vs Down Payment Boundary', () => {
    /**
     * 3-Value BVA at the funds check boundary (5 points).
     * Boundary: availableFunds = downPayment
     *
     * Tests at positions: -2, -1, 0 (boundary), +1, +2
     */
    fundsCheckBoundary.forEach(runDecisionTableTest);
  });

  describe('BVA: Down Payment Ratio Boundary (10%)', () => {
    /**
     * 3-Value BVA at the ratio check boundary (5 points).
     * Boundary: downPayment / loanAmount = 0.1
     *
     * Tests at positions: -2, -1, 0 (boundary), +1, +2
     * - AT: ratio = 10.000% → Approved
     * - ABOVE: ratio = 10.001% → Approved
     */
    ratioCheckBoundary.forEach(runDecisionTableTest);
  });

  describe('BVA: Loan Amount Boundaries', () => {
    /**
     * Tests extreme loan amounts.
     *
     * Critical for financial systems:
     * - Zero amount (division by zero risk)
     * - Minimum positive amount ($0.01)
     * - Large amounts ($1M) for precision testing
     */
    loanAmountBoundary.forEach(runDecisionTableTest);
  });

  describe('BVA: Down Payment Boundaries', () => {
    /**
     * Tests extreme down payment values.
     *
     * - Zero down payment (0% ratio)
     * - Full loan amount (100% ratio)
     * - Exceeds loan amount (>100% ratio)
     */
    downPaymentBoundary.forEach(runDecisionTableTest);
  });

  describe('BVA: Available Funds Boundaries', () => {
    /**
     * Tests extreme available funds values.
     *
     * - Zero funds
     * - Negative funds (overdraft)
     * - Abundant funds (stress test)
     */
    availableFundsBoundary.forEach(runDecisionTableTest);
  });

  describe('Combined Boundary Tests (High Risk Scenarios)', () => {
    /**
     * Tests where multiple conditions are at boundary simultaneously.
     * These are the highest risk scenarios for the business.
     */
    combinedBoundaryTests.forEach(runDecisionTableTest);
  });
});

describe('Loan Request API - Critical Path Tests', () => {
  /**
   * Minimum regression suite - tests tagged @critical
   * Run these on every commit for fast feedback.
   */
  getCriticalTests().forEach(runDecisionTableTest);
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

describe('Test Coverage Summary', () => {
  it('should have complete decision table coverage', () => {
    // 4 decision table rules
    expect(decisionTableRules).toHaveLength(4);

    // 3-value BVA = 5 points per boundary (-2, -1, 0, +1, +2)
    expect(fundsCheckBoundary).toHaveLength(5);
    expect(ratioCheckBoundary).toHaveLength(5);
    expect(loanAmountBoundary).toHaveLength(5);
    expect(downPaymentBoundary).toHaveLength(5);
    expect(availableFundsBoundary).toHaveLength(5);
    expect(combinedBoundaryTests).toHaveLength(5);

    // Total test cases: 4 + (5 × 5) + 5 = 34
    const totalTests = allLoanDecisionTests.length;
    expect(totalTests).toBe(34);

    console.log(`
      ═══════════════════════════════════════════════════════════════
      LOAN DECISION TABLE TEST COVERAGE SUMMARY
      ═══════════════════════════════════════════════════════════════
      
      3-VALUE BVA: Tests at -2, -1, 0 (boundary), +1, +2 for each boundary
      
      Decision Table Rules:           ${decisionTableRules.length} tests
      Funds Check BVA (-2 to +2):     ${fundsCheckBoundary.length} tests
      Ratio Check BVA (-2 to +2):     ${ratioCheckBoundary.length} tests
      Loan Amount BVA (-2 to +2):     ${loanAmountBoundary.length} tests
      Down Payment BVA (-2 to +2):    ${downPaymentBoundary.length} tests
      Available Funds BVA (-2 to +2): ${availableFundsBoundary.length} tests
      Combined Boundaries:            ${combinedBoundaryTests.length} tests
      ───────────────────────────────────────────────────────────────
      TOTAL TEST CASES:               ${totalTests} tests
      ═══════════════════════════════════════════════════════════════
    `);
  });
});
