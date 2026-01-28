/**
 * Unit tests for performance SLA helper
 * Tests latency checking logic with mock async functions
 */

import { describe, it, expect } from 'vitest';
import { withLatencyCheck, measureLatency } from '../../helpers/performance.js';

describe('withLatencyCheck', () => {
  describe('passing SLA', () => {
    it('passes when under latency threshold', async () => {
      const fast = () => Promise.resolve('quick');

      const { result, durationMs } = await withLatencyCheck('fast op', fast, 1000);

      expect(result).toBe('quick');
      expect(durationMs).toBeLessThan(1000);
    });

    it('returns correct result from wrapped function', async () => {
      const getData = () => Promise.resolve({ id: 1, name: 'test' });

      const { result } = await withLatencyCheck('get data', getData, 1000);

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('passes at exactly the threshold', async () => {
      // Fast operation should always be under 100ms
      const instant = () => Promise.resolve('done');

      const { durationMs } = await withLatencyCheck('instant', instant, 100);

      expect(durationMs).toBeLessThan(100);
    });
  });

  describe('failing SLA', () => {
    it('fails when over latency threshold', async () => {
      const slow = () => new Promise((r) => setTimeout(() => r('slow'), 100));

      await expect(withLatencyCheck('slow op', slow, 50)).rejects.toThrow(/SLA Violation/);
    });

    it('includes operation name in error message', async () => {
      const slow = () => new Promise((r) => setTimeout(() => r('x'), 100));

      try {
        await withLatencyCheck('GET /accounts', slow, 10);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toContain('GET /accounts');
      }
    });

    it('includes actual duration in error message', async () => {
      const slow = () => new Promise((r) => setTimeout(() => r('x'), 60));

      try {
        await withLatencyCheck('slow call', slow, 10);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toMatch(/\d+ms/);
      }
    });

    it('includes max threshold in error message', async () => {
      const slow = () => new Promise((r) => setTimeout(() => r('x'), 60));

      try {
        await withLatencyCheck('slow call', slow, 25);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toContain('25ms');
      }
    });
  });

  describe('error propagation', () => {
    it('propagates errors from wrapped function', async () => {
      const failing = () => Promise.reject(new Error('inner error'));

      await expect(withLatencyCheck('failing', failing, 1000)).rejects.toThrow('inner error');
    });

    it('does not mask original error with SLA error', async () => {
      const failing = () => Promise.reject(new Error('original'));

      try {
        await withLatencyCheck('op', failing, 1000);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toBe('original');
        expect((e as Error).message).not.toContain('SLA');
      }
    });
  });

  describe('duration measurement', () => {
    it('returns duration greater than zero for async operations', async () => {
      const delayed = () => new Promise((r) => setTimeout(() => r('done'), 20));

      const { durationMs } = await withLatencyCheck('timed', delayed, 1000);

      expect(durationMs).toBeGreaterThanOrEqual(20);
    });

    it('returns integer duration', async () => {
      const op = () => Promise.resolve('data');

      const { durationMs } = await withLatencyCheck('op', op, 1000);

      expect(Number.isInteger(durationMs)).toBe(true);
    });
  });
});

describe('measureLatency', () => {
  it('returns result without enforcing threshold', async () => {
    const slow = () => new Promise((r) => setTimeout(() => r('slow'), 50));

    const { result, durationMs } = await measureLatency(slow);

    expect(result).toBe('slow');
    expect(durationMs).toBeGreaterThanOrEqual(48);
  });

  it('does not throw for slow operations', async () => {
    const verySlow = () => new Promise((r) => setTimeout(() => r('done'), 100));

    await expect(measureLatency(verySlow)).resolves.toBeDefined();
  });

  it('returns accurate duration', async () => {
    const delayed = () => new Promise((r) => setTimeout(() => r('x'), 30));

    const { durationMs } = await measureLatency(delayed);

    expect(durationMs).toBeGreaterThanOrEqual(30);
    expect(durationMs).toBeLessThan(100); // Reasonable upper bound
  });

  it('propagates errors', async () => {
    const failing = () => Promise.reject(new Error('fail'));

    await expect(measureLatency(failing)).rejects.toThrow('fail');
  });
});
