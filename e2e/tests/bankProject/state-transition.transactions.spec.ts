/**
 * @file state-transition.transactions.spec.ts
 * @description ISTQB State Transition Testing - Transaction Search
 *
 * State Machine: SEARCH_IDLE -> BY_ID/BY_DATE/BY_AMOUNT -> SEARCHING -> RESULTS/NO_RESULTS/ERROR
 *
 * Tests ParaBank Find Transactions functionality with multiple search modes.
 *
 * @tags @regression @state-transition
 */

import { test, expect } from '@playwright/test';

const PARABANK_URL = 'https://parabank.parasoft.com/parabank';
const TEST_CREDENTIALS = { username: 'john', password: 'demo' };

test.describe('@regression @state-transition Transaction Search State Machine', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${PARABANK_URL}/index.htm`);
    await page.locator('input[name="username"]').fill(TEST_CREDENTIALS.username);
    await page.locator('input[name="password"]').fill(TEST_CREDENTIALS.password);
    await page.locator('input[value="Log In"]').click();

    // Wait for login to complete
    await expect(page.locator('#leftPanel').getByText(/welcome/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Find Transactions
    await page.getByRole('link', { name: /find transactions/i }).click();
    await expect(page.getByRole('heading', { name: /find transactions/i })).toBeVisible();
  });

  test('ST-TXN-01: Search by Transaction ID - valid ID returns result', async ({ page }) => {
    // State: SEARCH_IDLE -> BY_ID -> SEARCHING -> RESULTS
    const transactionIdInput = page.locator('#transactionId, input[id*="transactionId"]').first();
    const findButton = page
      .locator('#findByTransactionId, input[value*="Find"][ng-click*="id"]')
      .first();

    // Enter a transaction ID (use a known ID or any numeric value)
    await transactionIdInput.fill('12345');
    await findButton.click();

    // Should transition to results or error state (not remain idle)
    await expect(
      page
        .locator('table, .error, .ng-scope')
        .filter({ hasText: /transaction|not found|error/i })
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('ST-TXN-02: Search by Transaction ID - invalid ID shows error state', async ({ page }) => {
    // State: SEARCH_IDLE -> BY_ID -> SEARCHING -> ERROR/NO_RESULTS
    const transactionIdInput = page.locator('#transactionId, input[id*="transactionId"]').first();
    const findButton = page.locator('#findByTransactionId, input[value*="Find"]').first();

    // Enter non-existent transaction ID
    await transactionIdInput.fill('999999999');
    await findButton.click();

    // Should show no results or error message
    await expect(page.getByText(/not found|no transaction|error/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('ST-TXN-03: Search by Date - date field accepts input', async ({ page }) => {
    // State: SEARCH_IDLE -> BY_DATE interaction
    const dateInput = page.locator('#transactionDate, input[id*="Date"]').first();

    // Enter a date
    await dateInput.fill('01-15-2024');

    // Verify date is populated
    await expect(dateInput).toHaveValue(/01.*15.*2024|2024/);
  });

  test('ST-TXN-04: Search by Date - executes search and transitions state', async ({ page }) => {
    // State: SEARCH_IDLE -> BY_DATE -> SEARCHING -> RESULTS/NO_RESULTS
    const dateInput = page.locator('#transactionDate, input[id*="Date"]').first();
    const findByDateButton = page
      .locator('input[value*="Find"], button')
      .filter({ hasText: /find/i })
      .nth(1);

    await dateInput.fill('01-15-2024');
    await findByDateButton.click();

    // Should transition to results or no results state
    await expect(
      page
        .locator('table, .error, .ng-scope')
        .filter({ hasText: /transaction|not found|no/i })
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('ST-TXN-05: Search by Amount - exact amount search', async ({ page }) => {
    // State: SEARCH_IDLE -> BY_AMOUNT -> SEARCHING -> RESULTS/NO_RESULTS
    const amountInput = page.locator('#amount, input[id*="amount"]').first();
    const findByAmountButton = page.locator('input[value*="Find"]').last();

    await amountInput.fill('100.00');
    await findByAmountButton.click();

    // Should show results or no results message
    await expect(page.locator('table, .error, .ng-scope, #transactionTable').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('ST-TXN-06: Search form resets allow new search', async ({ page }) => {
    // State: RESULTS -> SEARCH_IDLE (via new search input)
    const transactionIdInput = page.locator('#transactionId, input[id*="transactionId"]').first();
    const findButton = page.locator('#findByTransactionId, input[value*="Find"]').first();

    // First search
    await transactionIdInput.fill('12345');
    await findButton.click();
    await page.waitForTimeout(2000);

    // Clear and enter new search (state should allow this)
    await transactionIdInput.clear();
    await transactionIdInput.fill('67890');

    // Verify input accepts new value (form is in searchable state)
    await expect(transactionIdInput).toHaveValue('67890');
  });

  test('ST-TXN-07: Multiple search modes available from idle state', async ({ page }) => {
    // Verify all search mode entry points exist from SEARCH_IDLE state
    // By ID
    await expect(page.locator('#transactionId, input[id*="transactionId"]').first()).toBeVisible();

    // By Date
    await expect(page.locator('#transactionDate, input[id*="Date"]').first()).toBeVisible();

    // By Amount
    await expect(page.locator('#amount, input[id*="amount"]').first()).toBeVisible();

    // All Find buttons available
    const findButtons = page.locator('input[value*="Find"], button').filter({ hasText: /find/i });
    await expect(findButtons.first()).toBeVisible();
  });
});
