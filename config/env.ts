/**
 * Environment Configuration with Zod Validation
 *
 * Validates environment variables at startup. Fails fast with clear errors
 * instead of cryptic runtime failures mid-test.
 */

import { z } from 'zod';

const envSchema = z.object({
  // API target URL - defaults to ParaBank demo instance
  BANK_BASE_URL: z.string().url().default('https://parabank.parasoft.com/parabank'),

  // Test customer ID for API tests
  BANK_CUSTOMER_ID: z.string().regex(/^\d+$/, 'Must be numeric').optional(),

  // Performance SLA thresholds
  API_LATENCY_MS: z.coerce.number().positive().default(5000),
  HEARTBEAT_TIMEOUT_MS: z.coerce.number().positive().default(30000),

  // CI detection
  CI: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// Parse and validate - throws immediately if invalid
export const env = envSchema.parse(process.env);

// Export schema for testing
export { envSchema };

// Type inference from schema
export type Env = z.infer<typeof envSchema>;
