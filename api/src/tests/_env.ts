// api/src/tests/_env.ts
import dotenv from 'dotenv';

// Explicitly load api/.env first (your real config)
dotenv.config({ path: 'api/.env' });

// Also try root .env (harmless if missing)
dotenv.config();

// Provide safe defaults
export const env = {
  BANK_BASE_URL: process.env.BANK_BASE_URL ?? 'https://parabank.parasoft.com/parabank',
  BANK_CUSTOMER_ID: process.env.BANK_CUSTOMER_ID ?? '12212',
  API_LATENCY_MS: Number(process.env.API_LATENCY_MS ?? 5000),
  HEARTBEAT_TIMEOUT_MS: Number(process.env.HEARTBEAT_TIMEOUT_MS ?? 10000),
};

export function ms(n: number | string): number {
  return typeof n === 'string' ? parseInt(n, 10) : n;
}
