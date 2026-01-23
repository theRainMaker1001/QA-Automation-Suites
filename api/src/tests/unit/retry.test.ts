/**
 * Unit tests for retry helper
 * Tests logic in isolation — no network calls
 */

import { describe, it, expect, vi } from 'vitest';
import { withRetry, sleep, DEFAULT_RETRY_CONFIG } from '../../helpers/retry.js';

describe('withRetry', () => {
  describe('successful calls', () => {
    it('returns result on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const { result, attempts } = await withRetry(fn);

      expect(result).toBe('success');
      expect(attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('returns result after retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('first fail'))
        .mockResolvedValue('success');

      const { result, attempts } = await withRetry(fn, { maxAttempts: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('exhausted retries', () => {
    it('throws after all attempts exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(withRetry(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toMatchObject({
        exhausted: true,
        attempts: 3,
      });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('includes the last error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('specific error'));

      await expect(withRetry(fn, { maxAttempts: 2, delayMs: 10 })).rejects.toMatchObject({
        error: expect.objectContaining({ message: 'specific error' }),
      });
    });
  });

  describe('default config', () => {
    it('uses default maxAttempts of 2', () => {
      expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(2);
    });

    it('uses default delayMs of 500', () => {
      expect(DEFAULT_RETRY_CONFIG.delayMs).toBe(500);
    });
  });
});

describe('sleep', () => {
  it('resolves after specified delay', async () => {
    const start = Date.now();

    await sleep(50 as number & { readonly __brand: 'Ms' });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // allow small variance
  });
});
