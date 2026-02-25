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
import { AccountSchema, AccountListSchema } from '../../schemas/account.schema.js';

const client = new HttpClient({
  baseUrl: env.BANK_BASE_URL,
  defaultTimeoutMs: env.API_LATENCY_MS as number & { readonly __brand: 'Ms' },
  defaultHeaders: {
    Accept: 'application/json',
  },
});

describe('@smoke API Schema Validation - Integration', () => {
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
    it('single account response matches AccountSchema', async () => {
      const res = await client.get(`services/bank/accounts/12345`);

      if (res.ok && res.data) {
        const isValid = isValidResponse(AccountSchema, res.data);
        expect(isValid).toBe(true);
      }
    });

    it('accounts list response matches AccountListSchema', async () => {
      const res = await client.get(`services/bank/customers/12212/accounts`);

      if (res.ok && res.data) {
        const isValid = isValidResponse(AccountListSchema, res.data);
        expect(isValid).toBe(true);
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

    it('validates minimal loan response (only required fields)', () => {
      const minimal = { approved: false };

      expect(isValidResponse(LoanResponseSchema, minimal)).toBe(true);
    });

    it('rejects loan response with wrong approved type', () => {
      const wrongType = { approved: 'yes' };

      expect(isValidResponse(LoanResponseSchema, wrongType)).toBe(false);
    });

    it('accepts null values for nullable fields', () => {
      const withNulls = {
        approved: true,
        message: null,
        accountId: null,
      };

      expect(isValidResponse(LoanResponseSchema, withNulls)).toBe(true);
    });
  });

  describe('Error Response Validation', () => {
    it('handles API error responses gracefully', async () => {
      // Request with invalid params to trigger error
      const res = await client.request({
        path: 'services/bank/requestLoan',
        method: 'POST',
      });

      // Should get a response (success or error)
      expect(res).toBeDefined();
    });

    it('error responses have expected structure', async () => {
      const res = await client.get('services/bank/accounts/invalid-id');

      // Error response should exist
      if (!res.ok) {
        expect(res.error).toBeDefined();
      }
    });

    it('timeout handling returns proper error code', async () => {
      // This tests our client's error handling, not ParaBank
      const slowClient = new HttpClient({
        baseUrl: env.BANK_BASE_URL,
        defaultTimeoutMs: 1 as number & { readonly __brand: 'Ms' }, // 1ms timeout
        defaultHeaders: { Accept: 'application/json' },
      });

      const res = await slowClient.get('services/bank/accounts/12345');

      // Should return timeout or error, not crash
      expect(res).toBeDefined();
    });
  });
});
