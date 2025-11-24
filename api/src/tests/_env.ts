import { z } from 'zod';

const EnvSchema = z.object({
  BANK_BASE_URL: z.string().url(),
  BANK_CUSTOMER_ID: z.string().default('12212'),
  API_LATENCY_MS: z.coerce.number().int().positive().default(500),
  HEARTBEAT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
  BANK_BASE_URL: process.env.BANK_BASE_URL,
  BANK_CUSTOMER_ID: process.env.BANK_CUSTOMER_ID,
  API_LATENCY_MS: process.env.API_LATENCY_MS,
  HEARTBEAT_TIMEOUT_MS: process.env.HEARTBEAT_TIMEOUT_MS,
});

// small branded helper
export const ms = (n: number) => n as number & { readonly __brand: 'Ms' };
