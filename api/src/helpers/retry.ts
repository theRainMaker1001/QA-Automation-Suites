/**
 * RETRY UTILITY
 * Simple retry logic for flaky network calls.
 */

import type { RetryConfig, TimeoutMs } from '../types/inputs.js';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  delayMs: 500,
};

/** Sleep for a given number of milliseconds */
function sleep(ms: TimeoutMs): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with configurable attempts and delay.
 * Returns the result on success, or throws after all attempts exhausted.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<{ result: T; attempts: number }> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < config.maxAttempts) {
        await sleep(config.delayMs);
      }
    }
  }

  throw {
    error: lastError,
    attempts: config.maxAttempts,
    exhausted: true,
  };
}

export { withRetry, sleep, DEFAULT_RETRY_CONFIG };
