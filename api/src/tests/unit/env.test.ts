/**
 * Unit tests for environment validation
 * Tests the shared env schema used across test lanes.
 */

import { describe, it, expect } from 'vitest';
import { envSchema } from '../../../../config/env.js';

describe('Environment Validation Schema', () => {
  describe('valid configurations', () => {
    it('parses valid environment with all values', () => {
      const env = envSchema.parse({
        BANK_BASE_URL: 'https://example.com',
        BANK_CUSTOMER_ID: '12345',
        API_LATENCY_MS: '3000',
        HEARTBEAT_TIMEOUT_MS: '60000',
        CI: 'true',
      });

      expect(env.BANK_BASE_URL).toBe('https://example.com');
      expect(env.BANK_CUSTOMER_ID).toBe('12345');
      expect(env.API_LATENCY_MS).toBe(3000);
      expect(env.HEARTBEAT_TIMEOUT_MS).toBe(60000);
      expect(env.CI).toBe(true);
    });

    it('uses defaults when optional vars missing', () => {
      const env = envSchema.parse({});

      expect(env.BANK_BASE_URL).toBe('https://parabank.parasoft.com/parabank');
      expect(env.API_LATENCY_MS).toBe(5000);
      expect(env.HEARTBEAT_TIMEOUT_MS).toBe(30000);
    });

    it('uses default customer ID when not set', () => {
      const env = envSchema.parse({});

      expect(env.BANK_CUSTOMER_ID).toBe('12212');
    });
  });

  describe('URL validation', () => {
    it('accepts valid HTTPS URL', () => {
      const env = envSchema.parse({ BANK_BASE_URL: 'https://api.example.com/v1' });
      expect(env.BANK_BASE_URL).toBe('https://api.example.com/v1');
    });

    it('accepts valid HTTP URL', () => {
      const env = envSchema.parse({ BANK_BASE_URL: 'http://localhost:3000' });
      expect(env.BANK_BASE_URL).toBe('http://localhost:3000');
    });

    it('throws on invalid URL format', () => {
      expect(() => envSchema.parse({ BANK_BASE_URL: 'not-a-url' })).toThrow();
    });

    it('throws on URL without protocol', () => {
      expect(() => envSchema.parse({ BANK_BASE_URL: 'example.com' })).toThrow();
    });
  });

  describe('customer ID validation', () => {
    it('accepts numeric string', () => {
      const env = envSchema.parse({ BANK_CUSTOMER_ID: '12345' });
      expect(env.BANK_CUSTOMER_ID).toBe('12345');
    });

    it('accepts single digit', () => {
      const env = envSchema.parse({ BANK_CUSTOMER_ID: '1' });
      expect(env.BANK_CUSTOMER_ID).toBe('1');
    });

    it('throws on non-numeric string', () => {
      expect(() => envSchema.parse({ BANK_CUSTOMER_ID: 'abc' })).toThrow(/numeric/);
    });

    it('throws on mixed alphanumeric', () => {
      expect(() => envSchema.parse({ BANK_CUSTOMER_ID: '123abc' })).toThrow();
    });

    it('throws on negative number string', () => {
      expect(() => envSchema.parse({ BANK_CUSTOMER_ID: '-123' })).toThrow();
    });
  });

  describe('number coercion', () => {
    it('coerces string numbers to numbers', () => {
      const env = envSchema.parse({ API_LATENCY_MS: '10000' });

      expect(typeof env.API_LATENCY_MS).toBe('number');
      expect(env.API_LATENCY_MS).toBe(10000);
    });

    it('coerces heartbeat timeout', () => {
      const env = envSchema.parse({ HEARTBEAT_TIMEOUT_MS: '45000' });

      expect(typeof env.HEARTBEAT_TIMEOUT_MS).toBe('number');
      expect(env.HEARTBEAT_TIMEOUT_MS).toBe(45000);
    });

    it('throws on non-positive latency', () => {
      expect(() => envSchema.parse({ API_LATENCY_MS: '0' })).toThrow();
    });

    it('throws on negative latency', () => {
      expect(() => envSchema.parse({ API_LATENCY_MS: '-100' })).toThrow();
    });
  });

  describe('CI flag transformation', () => {
    it('transforms "true" string to boolean true', () => {
      const env = envSchema.parse({ CI: 'true' });
      expect(env.CI).toBe(true);
    });

    it('transforms other strings to boolean false', () => {
      const env = envSchema.parse({ CI: 'false' });
      expect(env.CI).toBe(false);
    });

    it('transforms undefined to false', () => {
      const env = envSchema.parse({});
      expect(env.CI).toBe(false);
    });

    it('transforms empty string to false', () => {
      const env = envSchema.parse({ CI: '' });
      expect(env.CI).toBe(false);
    });
  });
});
