/**
 * @smoke Accounts API Integration Tests
 *
 * Tests the GET /accounts/{id} endpoint using Equivalence Partitioning.
 * Covers valid, invalid, and boundary test cases.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HttpClient } from '../../helpers/http.js';
import { env } from '../_env.js';
import { withRetry } from '../../helpers/retry.js';
import { writeIntegrationReport } from '../../helpers/test-reporter.js';
import { accountTestCases } from '../../../data/equivalence-partitions.js';

import type { AccountResponse, ErrorResponse } from '../../../interfaces/responses.js';
import type { TestResultRecord, TestRunSummary } from '../../../interfaces/responses.js';
import type { AccountTestInput } from '../../types/inputs.js';

// ============================================================================
// Setup
// ============================================================================

const client = new HttpClient({
  baseUrl: env.BANK_BASE_URL,
  defaultTimeoutMs: env.API_LATENCY_MS as number & { readonly __brand: 'Ms' },
  defaultHeaders: {
    Accept: 'application/json',
  },
});

const routes = {
  account: (id: string) => `services/bank/accounts/${id}`,
};

// Result collection for reporting
const results: TestResultRecord[] = [];
let startTime: number;

// ============================================================================
// Test Suite
// ============================================================================

describe('@smoke Accounts API', () => {
  beforeAll(() => {
    startTime = Date.now();
  });

  afterAll(() => {
    const duration = Date.now() - startTime;

    // Categorise results
    const expected: TestResultRecord[] = [];
    const unexpected: TestResultRecord[] = [];
    const timeout: TestResultRecord[] = [];

    for (const r of results) {
      if (r.error?.includes('TIMEOUT') || r.error?.includes('ETIMEDOUT')) {
        timeout.push(r);
      } else if (r.passed) {
        expected.push(r);
      } else {
        unexpected.push(r);
      }
    }

    const summary: TestRunSummary = {
      totalTests: results.length,
      expected,
      unexpected,
      timeout,
      runDate: new Date().toISOString(),
      durationMs: duration,
    };

    writeIntegrationReport(summary);
  });

  // Generate a test for each EP case
  describe.each<AccountTestInput>(accountTestCases)('$description', (testCase) => {
    it(`[${testCase.equivalenceClass}] expects ${testCase.expectedStatus}`, async () => {
      const record: TestResultRecord = {
        testName: `accounts/${testCase.accountId}`,
        description: testCase.description,
        equivalenceClass: testCase.equivalenceClass,
        polarity: testCase.polarity,
        expectedStatus: testCase.expectedStatus,
        actualStatus: 0,
        passed: false,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
      };

      try {
        const { result: res } = await withRetry(async () => {
          return client.get<AccountResponse | ErrorResponse>(routes.account(testCase.accountId));
        });

        record.actualStatus = res.status ?? 0;
        record.latencyMs = res.latencyMs ?? 0;
        record.passed = res.status === testCase.expectedStatus;

        if (!record.passed) {
          record.error = `Expected ${testCase.expectedStatus}, got ${res.status}`;
        }

        results.push(record);

        // Strict assertion: actual must match expected exactly
        expect(res.status).toBe(testCase.expectedStatus);
      } catch (err) {
        record.error = `TIMEOUT: ${err instanceof Error ? err.message : String(err)}`;
        record.passed = false;
        results.push(record);

        throw err;
      }
    });
  });
});
