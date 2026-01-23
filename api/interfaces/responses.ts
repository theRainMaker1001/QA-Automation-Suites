/**
 * RESPONSE INTERFACES - 'Interfaces Out'
 * Contracts for API responses - used for shape checking.
 * Convention: Interfaces define what comes OUT of the system under test.
 */

// ============================================================================
// Account responses
// ============================================================================

/** Single account from GET /accounts/{id} */
interface AccountResponse {
  id: number;
  customerId: number;
  type: 'CHECKING' | 'SAVINGS' | 'LOAN';
  balance: number;
}

/** Array of accounts from GET /customers/{id}/accounts */
interface AccountsListResponse extends Array<AccountResponse> {}

// ============================================================================
// Customer responses
// ============================================================================

interface AddressResponse {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/** Customer from GET /customers/{id} */
interface CustomerResponse {
  id: number;
  firstName: string;
  lastName: string;
  address: AddressResponse;
  phoneNumber: string;
  ssn: string;
}

// ============================================================================
// Transaction responses
// ============================================================================

interface TransactionResponse {
  id: number;
  accountId: number;
  type: 'Credit' | 'Debit';
  date: string;
  amount: number;
  description: string;
}

interface TransactionsListResponse extends Array<TransactionResponse> {}

// ============================================================================
// Error responses
// ============================================================================

/** Standard ParaBank error shape */
interface ErrorResponse {
  code: string;
  message: string;
}

// ============================================================================
// Test result tracking (for reporting)
// ============================================================================

interface TestResultRecord {
  testName: string;
  description: string;
  equivalenceClass: string;
  polarity: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  latencyMs: number;
  error?: string;
  timestamp: string;
}

interface TestRunSummary {
  totalTests: number;
  expected: TestResultRecord[]; // Passed as expected (valid pass OR invalid correctly rejected)
  unexpected: TestResultRecord[]; // Did not behave as expected
  timeout: TestResultRecord[]; // Network/timeout issues
  runDate: string;
  durationMs: number;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  AccountResponse,
  AccountsListResponse,
  CustomerResponse,
  AddressResponse,
  TransactionResponse,
  TransactionsListResponse,
  ErrorResponse,
  TestResultRecord,
  TestRunSummary,
};
