/**
 * Account API Response Schemas
 *
 * Runtime validation for ParaBank account endpoints.
 */

import { z } from 'zod';

/**
 * Single account response schema
 */
export const AccountSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  type: z.string(),
  balance: z.number(),
});

export type Account = z.infer<typeof AccountSchema>;

/**
 * Account list response schema
 */
export const AccountListSchema = z.array(AccountSchema);

export type AccountList = z.infer<typeof AccountListSchema>;

/**
 * Transaction schema
 */
export const TransactionSchema = z.object({
  id: z.number(),
  accountId: z.number(),
  type: z.string(),
  date: z.string(),
  amount: z.number(),
  description: z.string().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Transaction list response schema
 */
export const TransactionListSchema = z.array(TransactionSchema);

export type TransactionList = z.infer<typeof TransactionListSchema>;
