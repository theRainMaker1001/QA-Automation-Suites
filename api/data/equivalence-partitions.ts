/**
 * EQUIVALENCE PARTITION TEST DATA
 * Organised by endpoint, each set covers valid/invalid and boundary cases.
 */

import type { AccountTestInput, CustomerTestInput } from '../src/types/inputs.js';

// ============================================================================
// Known good data from ParaBank public instance
// ============================================================================

const KNOWN_CUSTOMER_ID = '12212'; // John Smith - stable test account
const KNOWN_ACCOUNT_ID = '13344'; // Checking account for customer 12212

// ============================================================================
// Accounts endpoint: GET /accounts/{id}
// ============================================================================

const accountTestCases: AccountTestInput[] = [
  // --- POSITIVE / VALID ---
  {
    description: 'Valid existing account ID returns account details',
    accountId: KNOWN_ACCOUNT_ID,
    polarity: 'positive',
    expectedValidity: 'valid',
    equivalenceClass: 'valid-existing',
    expectedStatus: 200,
  },

  // --- NEGATIVE / VALID (correctly rejected) ---
  {
    description: 'Non-existent account ID returns 404',
    accountId: '99999999',
    polarity: 'negative',
    expectedValidity: 'valid',
    equivalenceClass: 'invalid-nonexistent',
    expectedStatus: 404,
  },

  // --- NEGATIVE / INVALID (malformed input) ---
  {
    description: 'Alphabetic account ID returns 400',
    accountId: 'abc',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'invalid-format',
    expectedStatus: 400,
  },
  {
    description: 'Empty account ID returns 404 (no route match)',
    accountId: '',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'boundary-empty',
    expectedStatus: 404,
  },
  {
    description: 'Negative account ID returns 400 or 404',
    accountId: '-1',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'boundary-negative',
    expectedStatus: 400, // May also be 404 depending on API behaviour
  },
  {
    description: 'Zero account ID returns 404',
    accountId: '0',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'boundary-zero',
    expectedStatus: 404,
  },
  {
    description: 'Very large account ID returns 404',
    accountId: '999999999999999',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'boundary-max',
    expectedStatus: 404,
  },
  {
    description: 'Special characters in account ID returns 400',
    accountId: '123!@#',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'invalid-format',
    expectedStatus: 400,
  },
];

// ============================================================================
// Customers endpoint: GET /customers/{id}
// ============================================================================

const customerTestCases: CustomerTestInput[] = [
  // --- POSITIVE / VALID ---
  {
    description: 'Valid existing customer ID returns customer details',
    customerId: KNOWN_CUSTOMER_ID,
    polarity: 'positive',
    expectedValidity: 'valid',
    equivalenceClass: 'valid-existing',
    expectedStatus: 200,
  },

  // --- NEGATIVE / VALID (correctly rejected) ---
  {
    description: 'Non-existent customer ID returns 404',
    customerId: '99999999',
    polarity: 'negative',
    expectedValidity: 'valid',
    equivalenceClass: 'invalid-nonexistent',
    expectedStatus: 404,
  },

  // --- NEGATIVE / INVALID (malformed input) ---
  {
    description: 'Alphabetic customer ID returns 400',
    customerId: 'notanumber',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'invalid-format',
    expectedStatus: 400,
  },
  {
    description: 'Negative customer ID returns 400 or 404',
    customerId: '-5',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'boundary-negative',
    expectedStatus: 400,
  },
  {
    description: 'Zero customer ID returns 404',
    customerId: '0',
    polarity: 'negative',
    expectedValidity: 'invalid',
    equivalenceClass: 'boundary-zero',
    expectedStatus: 404,
  },
];

// ============================================================================
// Exports
// ============================================================================

export { accountTestCases, customerTestCases, KNOWN_CUSTOMER_ID, KNOWN_ACCOUNT_ID };
