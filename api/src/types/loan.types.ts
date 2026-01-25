/**
 * Loan Request/Response Types
 *
 * Types in, interfaces out helps with strict inputs and api contract returns
 */

// ============================================================================
// INPUT TYPES - Constrain what we send to the API
// ============================================================================

/** Loan amount in dollars - must be positive for valid requests */
type LoanAmount = number;

/** Down payment amount in dollars */
type DownPayment = number;

/** Available funds in the customer's account */
type AvailableFunds = number;

/** Customer identifier */
type CustomerId = number;

/** Account identifier for down payment source */
type FromAccountId = number;

/**
 * Loan request parameters as sent to POST /requestLoan
 */
export type LoanRequestParams = {
  customerId: CustomerId;
  amount: LoanAmount;
  downPayment: DownPayment;
  fromAccountId: FromAccountId;
};

// ============================================================================
// OUTPUT INTERFACES - Define what the API returns
// ============================================================================

/**
 * Loan response from ParaBank API
 *
 * The API returns approval status with optional error messaging.
 * When approved, a new account is created for the loan.
 */
export interface LoanResponse {
  approved: boolean;
  message?: string;
  accountId?: number;
  responseDate?: string;
  loanProviderName?: string;
}

/**
 * Error response structure when API call fails
 */
export interface LoanErrorResponse {
  error: string;
  message: string;
}

// ============================================================================
// DECISION TABLE TEST DATA TYPES
// ============================================================================

/**
 * Decision table rule outcome
 *
 * Maps to ParaBank's loan approval logic:
 * - APPROVED: Both conditions satisfied
 * - DENIED_INSUFFICIENT_DOWN_PAYMENT: downPayment/loanAmount < 0.1
 * - DENIED_INSUFFICIENT_FUNDS: availableFunds < downPayment
 */
export type LoanDecision =
  | 'APPROVED'
  | 'DENIED_INSUFFICIENT_DOWN_PAYMENT'
  | 'DENIED_INSUFFICIENT_FUNDS';

/**
 * Decision table test case structure
 *
 * Combines conditions (inputs) with expected action (outcome).
 * Used for both decision table rules and BVA test cases.
 */
export interface LoanDecisionTestCase {
  /** Unique identifier for traceability */
  id: string;

  /** Readable description */
  description: string;

  /** Test classification tags */
  tags: string[];

  /** Condition: Loan amount requested */
  loanAmount: LoanAmount;

  /** Condition: Down payment offered */
  downPayment: DownPayment;

  /** Condition: Funds available in source account */
  availableFunds: AvailableFunds;

  /** Expected action/outcome */
  expectedDecision: LoanDecision;

  /** Expected error message key (if denied) */
  expectedMessage?: string;
}

/**
 * BVA boundary point type
 *
 * For 3-value BVA: below boundary, at boundary, above boundary
 */
export type BoundaryPoint = 'BELOW' | 'AT' | 'ABOVE';
