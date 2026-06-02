/**
 * @file state-transition.transactions.spec.ts
 * @description Access control check - /findtrans.htm is a protected route.
 *
 * Unauthenticated visits must not expose the transaction search form.
 * Runs cross-browser as part of @regression to catch any accidental
 * removal of the authentication gate on this route.
 *
 * The full state-machine tests (SEARCH_IDLE → RESULTS / NO_RESULTS / ERROR)
 * live in state-transition.transactions.authenticated.spec.ts and require
 * an active session via chromium-auth storage state.
 *
 * @tags @regression
 */

import { test, expect } from '@playwright/test';

test.describe('@regression Transaction Search - Access Control', () => {
  test('unauthenticated visit to /findtrans.htm does not expose the search form', async ({
    page,
  }) => {
    const baseUrl = process.env.BANK_BASE_URL ?? 'https://parabank.parasoft.com/parabank';

    await page.goto(`${baseUrl}/findtrans.htm`);
    await page.waitForLoadState('domcontentloaded');

    // The search form requires authentication - it must not be rendered for a guest.
    const searchFormVisible = await page
      .locator('input#transactionId, input[id="criteria.transactionId"]')
      .isVisible()
      .catch(() => false);

    expect(searchFormVisible).toBe(false);

    // Page must remain on the parabank domain (redirect to login or error, not external).
    expect(page.url()).toContain('parabank');
  });
});
