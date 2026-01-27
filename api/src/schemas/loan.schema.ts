/**
 * Loan API Response Schemas
 *
 * Runtime validation for API contract enforcement.
 * TypeScript types check at compile time; Zod schemas catch
 * contract breaks when the API actually changes.
 */

import { z } from 'zod';

/**
 * Loan response schema - validates API response structure
 */
export const LoanResponseSchema = z.object({
  approved: z.boolean(),
  message: z.string().nullable().optional(),
  accountId: z.number().nullable().optional(),
  responseDate: z.string().optional(),
  loanProviderName: z.string().optional(),
});

export type LoanResponse = z.infer<typeof LoanResponseSchema>;

/**
 * Loan error response schema
 */
export const LoanErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type LoanErrorResponse = z.infer<typeof LoanErrorResponseSchema>;
