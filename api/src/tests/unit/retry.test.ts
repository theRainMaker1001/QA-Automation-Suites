/**
 * Unit tests for retry helper
 * Tests logic in isolation - no network calls
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

    it('throws immediately when maxAttempts is 1', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      await expect(withRetry(fn, { maxAttempts: 1, delayMs: 10 })).rejects.toMatchObject({
        exhausted: true,
        attempts: 1,
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('preserves error type through retries', async () => {
      class CustomError extends Error {
        code = 'CUSTOM';
      }
      const fn = vi.fn().mockRejectedValue(new CustomError('custom fail'));

      await expect(withRetry(fn, { maxAttempts: 2, delayMs: 10 })).rejects.toMatchObject({
        error: expect.objectContaining({ code: 'CUSTOM' }),
      });
    });

    it('tracks each failed attempt', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockRejectedValue(new Error('fail 3'));

      await expect(withRetry(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toMatchObject({
        attempts: 3,
      });

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('timing and delays', () => {
    it('waits between retry attempts', async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');

      const start = Date.now();
      await withRetry(fn, { maxAttempts: 2, delayMs: 50 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it('accumulates delay across multiple retries', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const start = Date.now();
      await withRetry(fn, { maxAttempts: 3, delayMs: 30 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(55); // 2 delays of 30ms each
    });
  });

  describe('edge cases', () => {
    it('handles async function that returns undefined', async () => {
      const fn = vi.fn().mockResolvedValue(undefined);

      const { result, attempts } = await withRetry(fn);

      expect(result).toBeUndefined();
      expect(attempts).toBe(1);
    });

    it('handles async function that returns null', async () => {
      const fn = vi.fn().mockResolvedValue(null);

      const { result, attempts } = await withRetry(fn);

      expect(result).toBeNull();
      expect(attempts).toBe(1);
    });

    it('handles async function that returns empty object', async () => {
      const fn = vi.fn().mockResolvedValue({});

      const { result, attempts } = await withRetry(fn);

      expect(result).toEqual({});
      expect(attempts).toBe(1);
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
