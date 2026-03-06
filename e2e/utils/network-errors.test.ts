/**
 * Unit tests for isNetworkError
 *
 * Covers every engine-specific error string the function classifies, plus a
 * negative case to confirm non-network errors are not misclassified.
 * Runs under the Vitest unit runner (node environment — no browser required).
 */

import { describe, it, expect } from 'vitest';
import { isNetworkError } from './network-errors.js';

describe('isNetworkError', () => {
  it('returns true for Chromium DNS failure (ERR_NAME_NOT_RESOLVED)', () => {
    expect(isNetworkError(new Error('net::ERR_NAME_NOT_RESOLVED'))).toBe(true);
  });

  it('returns true for Chromium refused connection (ERR_CONNECTION_REFUSED)', () => {
    expect(isNetworkError(new Error('net::ERR_CONNECTION_REFUSED'))).toBe(true);
  });

  it('returns true for Chromium connection timeout (ERR_CONNECTION_TIMED_OUT)', () => {
    expect(isNetworkError(new Error('net::ERR_CONNECTION_TIMED_OUT'))).toBe(true);
  });

  it('returns true for Chromium request timeout (ERR_TIMED_OUT)', () => {
    expect(isNetworkError(new Error('net::ERR_TIMED_OUT'))).toBe(true);
  });

  it('returns true for Firefox DNS failure (NS_ERROR_UNKNOWN_HOST)', () => {
    expect(isNetworkError(new Error('NS_ERROR_UNKNOWN_HOST'))).toBe(true);
  });

  it('returns true for WebKit network failure (WebKitErrorDomain)', () => {
    expect(isNetworkError(new Error('WebKitErrorDomain error -1003'))).toBe(true);
  });

  it('returns true for Chromium connection reset (ERR_CONNECTION_RESET)', () => {
    expect(isNetworkError(new Error('net::ERR_CONNECTION_RESET'))).toBe(true);
  });

  it('returns true for Chromium no network interface (ERR_INTERNET_DISCONNECTED)', () => {
    expect(isNetworkError(new Error('net::ERR_INTERNET_DISCONNECTED'))).toBe(true);
  });

  it('returns true for Node.js DNS lookup failure (ENOTFOUND)', () => {
    expect(isNetworkError(new Error('getaddrinfo ENOTFOUND parabank.parasoft.com'))).toBe(true);
  });

  it('returns false for a non-network error (e.g. Playwright load-state timeout)', () => {
    expect(
      isNetworkError(
        new Error('TimeoutError: Timeout 30000ms exceeded while waiting for load state'),
      ),
    ).toBe(false);
  });
});
