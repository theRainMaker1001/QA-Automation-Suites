/**
 * Network error classification for E2E infrastructure.
 *
 * Kept as a pure function (no Playwright imports) so it can be covered by
 * the Vitest unit runner without pulling in browser dependencies.
 */

/**
 * Returns true when the error originates from a network-level failure rather
 * than a page-render or form-visibility problem. Used by page objects to
 * distinguish infrastructure outages from application defects.
 *
 * Covers the engine-specific error strings emitted by Chromium, Firefox, and
 * WebKit when a navigation cannot reach the host at all. Also covers common
 * Node.js DNS and connectivity codes that surface in CI environments.
 */
export function isNetworkError(error: unknown): boolean {
  const msg = String(error);
  return (
    msg.includes('ERR_NAME_NOT_RESOLVED') || // Chromium: DNS failure
    msg.includes('ERR_CONNECTION_REFUSED') || // Chromium: port closed
    msg.includes('ERR_CONNECTION_RESET') || // Chromium: connection reset mid-request
    msg.includes('ERR_CONNECTION_TIMED_OUT') || // Chromium: connection timeout
    msg.includes('ERR_TIMED_OUT') || // Chromium: request timeout
    msg.includes('ERR_INTERNET_DISCONNECTED') || // Chromium: no network interface
    msg.includes('NS_ERROR_UNKNOWN_HOST') || // Firefox: DNS failure
    msg.includes('WebKitErrorDomain') || // WebKit: network-level failure
    msg.includes('ENOTFOUND') // Node.js / underlying DNS lookup failure
  );
}
