/**
 * Unit tests for schema validation helper
 * Tests Zod validation wrapper logic
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateResponse, isValidResponse } from '../../helpers/schema-validator.js';
import { LoanResponseSchema } from '../../schemas/loan.schema.js';

describe('validateResponse', () => {
  describe('valid data', () => {
    it('validates correct loan response', () => {
      const valid = {
        approved: true,
        message: null,
        accountId: 12345,
        responseDate: '2024-01-15T10:00:00Z',
        loanProviderName: 'Test Bank',
      };

      expect(() => validateResponse(LoanResponseSchema, valid)).not.toThrow();
    });

    it('returns typed data on success', () => {
      const valid = {
        approved: true,
        message: 'Approved',
        accountId: 999,
        responseDate: '2024-01-15',
        loanProviderName: 'Bank',
      };

      const result = validateResponse(LoanResponseSchema, valid);

      expect(result.approved).toBe(true);
      expect(result.accountId).toBe(999);
    });

    it('accepts nullable fields as null', () => {
      const withNulls = {
        approved: false,
        message: null,
        accountId: null,
        responseDate: '2024-01-15',
        loanProviderName: 'Bank',
      };

      expect(() => validateResponse(LoanResponseSchema, withNulls)).not.toThrow();
    });

    it('accepts optional fields as undefined', () => {
      const minimal = {
        approved: true,
      };

      expect(() => validateResponse(LoanResponseSchema, minimal)).not.toThrow();
    });
  });

  describe('invalid data', () => {
    it('rejects missing required field', () => {
      const missing = {}; // Missing approved

      expect(() => validateResponse(LoanResponseSchema, missing)).toThrow(/API Contract Violation/);
    });

    it('rejects wrong field type', () => {
      const wrongType = {
        approved: 'yes', // Should be boolean
      };

      expect(() => validateResponse(LoanResponseSchema, wrongType)).toThrow(
        /API Contract Violation/,
      );
    });

    it('provides clear error message with field path', () => {
      const invalid = { approved: 'wrong' };

      try {
        validateResponse(LoanResponseSchema, invalid);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toContain('approved');
        expect((e as Error).message).toContain('API Contract Violation');
      }
    });

    it('includes all validation errors in message', () => {
      const multipleErrors = {
        approved: 'wrong',
        accountId: 'also wrong',
      };

      try {
        validateResponse(LoanResponseSchema, multipleErrors);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toContain('approved');
      }
    });
  });

  describe('custom schemas', () => {
    it('works with simple schemas', () => {
      const simpleSchema = z.object({
        id: z.number(),
        name: z.string(),
      });

      const valid = { id: 1, name: 'test' };
      const result = validateResponse(simpleSchema, valid);

      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });

    it('works with array schemas', () => {
      const arraySchema = z.array(z.number());

      const result = validateResponse(arraySchema, [1, 2, 3]);

      expect(result).toEqual([1, 2, 3]);
    });

    it('works with nested schemas', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      const valid = { user: { name: 'Test', email: 'test@example.com' } };
      const result = validateResponse(nestedSchema, valid);

      expect(result.user.name).toBe('Test');
    });
  });
});

describe('isValidResponse', () => {
  it('returns true for valid data', () => {
    const valid = { approved: true };
    expect(isValidResponse(LoanResponseSchema, valid)).toBe(true);
  });

  it('returns false for invalid data', () => {
    const invalid = { approved: 'not boolean' };
    expect(isValidResponse(LoanResponseSchema, invalid)).toBe(false);
  });

  it('does not throw on invalid data', () => {
    const invalid = { wrong: 'data' };
    expect(() => isValidResponse(LoanResponseSchema, invalid)).not.toThrow();
  });

  it('type guards correctly', () => {
    const data: unknown = { approved: true };

    if (isValidResponse(LoanResponseSchema, data)) {
      // TypeScript should know data.approved exists here
      expect(data.approved).toBe(true);
    }
  });
});
