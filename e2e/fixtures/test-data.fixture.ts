/**
 * Test Data Fixture
 *
 * Centralized test data for ParaBank E2E tests.
 * Keeps credentials and test values in one place.
 */

export const TEST_USERS = {
  default: {
    username: 'john',
    password: 'demo',
  },
  invalid: {
    username: 'invaliduser',
    password: 'wrongpassword',
  },
} as const;

export const TEST_ACCOUNTS = {
  // Known account IDs from ParaBank demo data
  validAccountId: 13344,
  invalidAccountId: 999999999,
} as const;

export const TEST_TRANSACTIONS = {
  validTransactionId: 12345,
  invalidTransactionId: 999999999,
} as const;

export const PARABANK_URLS = {
  base: 'https://parabank.parasoft.com/parabank',
  home: 'https://parabank.parasoft.com/parabank/index.htm',
  register: 'https://parabank.parasoft.com/parabank/register.htm',
  overview: 'https://parabank.parasoft.com/parabank/overview.htm',
  findTransactions: 'https://parabank.parasoft.com/parabank/findtrans.htm',
  openAccount: 'https://parabank.parasoft.com/parabank/openaccount.htm',
  transfer: 'https://parabank.parasoft.com/parabank/transfer.htm',
  billPay: 'https://parabank.parasoft.com/parabank/billpay.htm',
  requestLoan: 'https://parabank.parasoft.com/parabank/requestloan.htm',
} as const;

/**
 * Generate unique username for registration tests
 */
export function generateUniqueUsername(prefix = 'qatest'): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * Generate test SSN (format: XXX-XX-XXXX)
 */
export function generateTestSSN(): string {
  const random = () => Math.floor(Math.random() * 10);
  return `${random()}${random()}${random()}-${random()}${random()}-${random()}${random()}${random()}${random()}`;
}
