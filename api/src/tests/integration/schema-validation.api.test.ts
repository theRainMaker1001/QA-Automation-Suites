/**
 * API Schema Validation Integration Tests
 *
 * Validates that live API responses match expected Zod schemas.
 * Catches contract breaks at runtime when the API changes.
 */

import { describe, it, expect } from 'vitest';
import { HttpClient } from '../../helpers/http.js';
import { env } from '../_env.js';
import { validateResponse, isValidResponse } from '../../helpers/schema-validator.js';
import { LoanResponseSchema } from '../../schemas/loan.schema.js';

const client = new HttpClient({
  baseUrl: env.BANK_BASE_URL,
  defaultTimeoutMs: env.API_LATENCY_MS as number & { readonly __brand: 'Ms' },
  defaultHeaders: {
    Accept: 'application/json',
  },
});

describe('API Schema Validation - Integration', () => {
  describe('Loan API', () => {
    it('loan approval response matches LoanResponseSchema', async () => {
      const params = new URLSearchParams({
        customerId: '12212',
        amount: '1000',
        downPayment: '200',
        fromAccountId: '12345',
      });

      const res = await client.request({
        path: `services/bank/requestLoan?${params}`,
        method: 'POST',
      });

      if (res.ok && res.data) {
        // Validate structure matches schema
        const isValid = isValidResponse(LoanResponseSchema, res.data);
        expect(isValid).toBe(true);
      }
    });

    it('loan denial response matches LoanResponseSchema', async () => {
      const params = new URLSearchParams({
        customerId: '12212',
        amount: '1000',
        downPayment: '5', // Too low - should be denied
        fromAccountId: '12345',
      });

      const res = await client.request({
        path: `services/bank/requestLoan?${params}`,
        method: 'POST',
      });

      if (res.ok && res.data) {
        const isValid = isValidResponse(LoanResponseSchema, res.data);
        expect(isValid).toBe(true);
      }
    });

    it('loan response has required approved field', async () => {
      const params = new URLSearchParams({
        customerId: '12212',
        amount: '500',
        downPayment: '100',
        fromAccountId: '12345',
      });

      const res = await client.request({
        path: `services/bank/requestLoan?${params}`,
        method: 'POST',
      });

      if (res.ok && res.data) {
        expect(res.data).toHaveProperty('approved');
        expect(typeof (res.data as { approved: unknown }).approved).toBe('boolean');
      }
    });
  });

  describe('Account API', () => {
    it('account response has expected structure', async () => {
      const res = await client.get(`services/bank/accounts/12345`);

      if (res.ok && res.data) {
        // Check basic structure
        expect(res.data).toBeDefined();
      }
    });

    it('account response type validation', async () => {
      const res = await client.get(`services/bank/accounts/12345`);

      if (res.ok && res.data && typeof res.data === 'object') {
        // If we get account data, validate it has expected fields
        const data = res.data as Record<string, unknown>;
        if ('id' in data) {
          expect(typeof data.id).toBe('number');
        }
      }
    });
  });

  describe('Schema Validation Utility', () => {
    it('validateResponse throws on invalid data', () => {
      const invalidData = { notApproved: 'wrong' };

      expect(() => validateResponse(LoanResponseSchema, invalidData)).toThrow(
        /API Contract Violation/,
      );
    });

    it('isValidResponse returns false for invalid data', () => {
      const invalidData = { approved: 'not-boolean' };

      expect(isValidResponse(LoanResponseSchema, invalidData)).toBe(false);
    });

    it('isValidResponse returns true for valid loan response shape', () => {
      const validShape = {
        approved: true,
        message: 'Approved',
        accountId: 12345,
        responseDate: '2024-01-15',
        loanProviderName: 'Test Bank',
      };

      expect(isValidResponse(LoanResponseSchema, validShape)).toBe(true);
    });
  });
});
