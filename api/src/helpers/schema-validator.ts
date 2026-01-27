/**
 * Schema Validation Helper
 *
 * Wraps Zod validation with clear error messages for API contract violations.
 */

import { z } from 'zod';

/**
 * Validate API response against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Response data to validate
 * @returns Typed, validated data
 * @throws Error with clear message on validation failure
 */
export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.') || 'root'}: ${i.message}`);
    throw new Error(`API Contract Violation:\n${issues.join('\n')}`);
  }

  return result.data;
}

/**
 * Check if data matches schema without throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Response data to validate
 * @returns true if valid, false otherwise
 */
export function isValidResponse<T>(schema: z.ZodSchema<T>, data: unknown): data is T {
  return schema.safeParse(data).success;
}
