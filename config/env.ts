/**
 * Environment Configuration with Zod Validation
 *
 * Validates environment variables at startup. Fails fast with clear errors
 * instead of cryptic runtime failures mid-test.
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  // API target URL - defaults to ParaBank demo instance
  BANK_BASE_URL: z.string().url().default('https://parabank.parasoft.com/parabank'),

  // Test customer ID for API tests
  BANK_CUSTOMER_ID: z.string().regex(/^\d+$/, 'Must be numeric').default('12212'),

  // Performance SLA thresholds
  API_LATENCY_MS: z.coerce.number().positive().default(5000),
  HEARTBEAT_TIMEOUT_MS: z.coerce.number().positive().default(30000),

  // CI detection
  CI: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// Load local env files once before parsing.
function loadEnvFiles(): void {
  const apiEnvPath = path.join(process.cwd(), 'api', '.env');
  if (fs.existsSync(apiEnvPath)) {
    dotenv.config({ path: apiEnvPath });
  }
  dotenv.config();
}

// Parse and validate - throws immediately if invalid.
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}

loadEnvFiles();

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;

// Export schema for testing
export { envSchema };
