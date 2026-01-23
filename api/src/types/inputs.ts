/**
 * INPUT TYPES - 'Types In'
 * Readable shapes for test data and request parameters.
 * Convention: Types define what goes INTO the system under test.
 */

// ============================================================================
// Primitives with semantic meaning
// ============================================================================

/** Customer ID as string for URL path params */
type CustomerId = string;

/** Account ID as string for URL path params */
type AccountId = string;

/** Milliseconds for timeout/latency budgets */
type TimeoutMs = number;

/** HTTP status code */
type HttpStatusCode = number;

// ============================================================================
// Equivalence Partitioning
// ============================================================================

/** Test polarity: Which behaviours are we testing? */
type TestPolarity = 'positive' | 'negative';

/** Expected validity: should this input be accepted or rejected? */
type ExpectedValidity = 'valid' | 'invalid';

/** EP class for categorising test data */
type EquivalenceClass =
  | 'valid-existing'
  | 'valid-format'
  | 'invalid-format'
  | 'invalid-nonexistent'
  | 'boundary-zero'
  | 'boundary-negative'
  | 'boundary-max'
  | 'boundary-empty';

// ============================================================================
// Test case input shapes
// ============================================================================

/** Single test case input for accounts endpoint */
type AccountTestInput = {
  description: string;
  accountId: AccountId;
  polarity: TestPolarity;
  expectedValidity: ExpectedValidity;
  equivalenceClass: EquivalenceClass;
  expectedStatus: HttpStatusCode;
};

/** Single test case input for customers endpoint */
type CustomerTestInput = {
  description: string;
  customerId: CustomerId;
  polarity: TestPolarity;
  expectedValidity: ExpectedValidity;
  equivalenceClass: EquivalenceClass;
  expectedStatus: HttpStatusCode;
};

/** Configuration for retry behaviour */
type RetryConfig = {
  maxAttempts: number;
  delayMs: TimeoutMs;
};

// ============================================================================
// Exports
// ============================================================================

export type {
  CustomerId,
  AccountId,
  TimeoutMs,
  HttpStatusCode,
  TestPolarity,
  ExpectedValidity,
  EquivalenceClass,
  AccountTestInput,
  CustomerTestInput,
  RetryConfig,
};
