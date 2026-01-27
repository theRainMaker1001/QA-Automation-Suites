/**
 * Performance SLA Assertions
 *
 * Wraps async operations with latency checking. Tests fail if
 * response times exceed configured thresholds.
 */

const DEFAULT_LATENCY_MS = 5000;

export interface LatencyResult<T> {
  result: T;
  durationMs: number;
}

/**
 * Execute an async function with latency checking
 *
 * @param name - Operation name (for error messages)
 * @param fn - Async function to execute
 * @param maxMs - Maximum allowed latency in milliseconds
 * @returns Result and duration
 * @throws Error if latency exceeds threshold
 */
export async function withLatencyCheck<T>(
  name: string,
  fn: () => Promise<T>,
  maxMs: number = DEFAULT_LATENCY_MS,
): Promise<LatencyResult<T>> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round(performance.now() - start);

  if (durationMs > maxMs) {
    throw new Error(`SLA Violation: ${name} took ${durationMs}ms (max: ${maxMs}ms)`);
  }

  return { result, durationMs };
}

/**
 * Measure latency without enforcing threshold
 *
 * @param fn - Async function to execute
 * @returns Result and duration
 */
export async function measureLatency<T>(fn: () => Promise<T>): Promise<LatencyResult<T>> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round(performance.now() - start);

  return { result, durationMs };
}
