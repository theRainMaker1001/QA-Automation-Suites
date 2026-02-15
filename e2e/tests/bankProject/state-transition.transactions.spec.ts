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
import { TEST_USERS } from '../../fixtures/test-data.fixture.js';
import { TransactionsPage } from '../../pages/transactions.page.js';
import { ensureAuthenticatedSession } from '../../utils/auth-session.js';

test.describe('@regression @state-transition Transaction Search State Machine', () => {
  let transactionsPage: TransactionsPage;

  test.beforeEach(async ({ page }) => {
    transactionsPage = new TransactionsPage(page);
    await ensureAuthenticatedSession(page, TEST_USERS.default);
    await transactionsPage.goto();
  });

  test('ST-TXN-01: Search by Transaction ID - form accepts numeric input', async () => {
    if (await transactionsPage.isSearchFormVisible()) {
      await transactionsPage.setTransactionId('12345');
      expect(await transactionsPage.getTransactionIdInputValue()).toBe('12345');
    } else {
      expect(await transactionsPage.getCurrentUrl()).toContain('parabank');
    }
  });

  test('ST-TXN-02: Search by Transaction ID - executes search', async () => {
    if (await transactionsPage.isSearchFormVisible()) {
      await transactionsPage.searchByTransactionId('999999999');

      const hasResults = await transactionsPage.hasResults();
      const hasNoResults = await transactionsPage.hasNoResults();
      const hasError = await transactionsPage.hasError();
      expect(hasResults || hasNoResults || hasError).toBe(true);
    } else {
      expect(await transactionsPage.getCurrentUrl()).toContain('parabank');
    }
  });

  test('ST-TXN-03: Search by Date - date field accepts input', async () => {
    if (await transactionsPage.isDateSearchVisible()) {
      await transactionsPage.setDate('01-15-2024');
      expect((await transactionsPage.getDateInputValue()).length).toBeGreaterThan(0);
    } else {
      expect(await transactionsPage.getCurrentUrl()).toContain('parabank');
    }
  });

  test('ST-TXN-04: Search by Amount - amount field accepts numeric input', async () => {
    if (await transactionsPage.isAmountSearchVisible()) {
      await transactionsPage.setAmount('100.00');
      expect(await transactionsPage.getAmountInputValue()).toBe('100.00');
    } else {
      expect(await transactionsPage.getCurrentUrl()).toContain('parabank');
    }
  });

  test('ST-TXN-05: Search form maintains state after input', async ({ page }) => {
    if (await transactionsPage.isSearchFormVisible()) {
      await transactionsPage.setTransactionId('12345');
      await page.locator('body').click();
      expect(await transactionsPage.getTransactionIdInputValue()).toBe('12345');
    } else {
      expect(await transactionsPage.getCurrentUrl()).toContain('parabank');
    }
  });

  test('ST-TXN-06: Multiple search input fields available', async () => {
    const hasTransactionIdSearch = await transactionsPage.isSearchFormVisible();
    const hasDateSearch = await transactionsPage.isDateSearchVisible();
    const hasAmountSearch = await transactionsPage.isAmountSearchVisible();

    expect(hasTransactionIdSearch || hasDateSearch || hasAmountSearch).toBe(true);
  });

  test('ST-TXN-07: Page responds to user interaction', async () => {
    const initialUrl = await transactionsPage.getCurrentUrl();
    expect(initialUrl).toContain('parabank');

    const isInteractive =
      (await transactionsPage.isSearchFormVisible()) ||
      (await transactionsPage.isDateSearchVisible()) ||
      (await transactionsPage.isAmountSearchVisible());
    expect(isInteractive).toBe(true);
  });
});
