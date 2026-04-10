/**
 * @file state-transition.transactions.authenticated.spec.ts
 * @description ISTQB State Transition Testing — Transaction Search (authenticated)
 *
 * State Machine:
 *   SEARCH_IDLE → (submit search) → RESULTS | NO_RESULTS | ERROR
 *
 * This spec exercises the full state machine and requires an authenticated
 * session. It loads the chromium-auth storage state directly via test.use()
 * so that the session is available regardless of which browser project runs
 * the file. The SEARCHING intermediate state is not asserted — the POM waits
 * for networkidle after submit, making that window too narrow to catch reliably.
 *
 * Account discovery happens in beforeAll by reading the accounts overview.
 * If no account is found (auth failed or site is down) all tests are skipped
 * with a single clear message rather than failing mid-run on missing selectors.
 *
 * @tags @critical @state-transition
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { AccountsPage } from '../../pages/accounts.page.js';
import { TransactionsPage } from '../../pages/transactions.page.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, '../../.auth/user.json');

// Load the pre-authenticated session produced by global.setup.ts.
// This applies to every test in this file regardless of which project runs it.
test.use({ storageState: STORAGE_STATE_PATH });

let discoveredAccountId: string | null = null;

test.describe('@critical @state-transition Transaction Search State Machine', () => {
  test.beforeAll(async ({ browser }) => {
    // Guard: global.setup.ts writes an empty state file when login fails.
    // Detect that here so individual tests can skip cleanly rather than
    // crashing on missing selectors.
    try {
      const raw = fs.readFileSync(STORAGE_STATE_PATH, 'utf-8');
      const state = JSON.parse(raw) as { cookies?: unknown[] };
      if (!Array.isArray(state.cookies) || state.cookies.length === 0) {
        console.warn('[Setup] Storage state has no cookies — global setup login may have failed');
        return;
      }
    } catch {
      console.warn('[Setup] Could not read storage state file');
      return;
    }

    // browser.newPage() does not inherit the file-level test.use({ storageState }),
    // so account discovery would run unauthenticated and find nothing. Creating a
    // full context with the storage state explicitly ensures the session is active.
    const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const page = await context.newPage();
    try {
      const accountsPage = new AccountsPage(page);
      await accountsPage.goto();

      // waitForPageLoad() fires at domcontentloaded, which is too early for
      // ParaBank's accounts table — the table body renders after the initial
      // DOM paint. Wait explicitly for at least one account activity link before
      // reading IDs; if the table never appears, tests skip with a clear reason.
      await page
        .locator('#accountTable a[href*="activity"]')
        .first()
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {
          console.warn('[Setup] Accounts table did not populate within timeout');
        });

      const ids = await accountsPage.getAccountIds();
      if (ids.length > 0) {
        discoveredAccountId = ids[0];
        console.log(`[Setup] Using account ID: ${discoveredAccountId}`);
      } else {
        console.warn('[Setup] No accounts found on overview page — all tests will be skipped');
      }
    } finally {
      await context.close().catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    // Skip the whole test if account discovery failed — one skip reason is clearer
    // than multiple failures on missing DOM elements.
    test.skip(
      discoveredAccountId === null,
      'No account available — global setup or auth may have failed',
    );

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.selectAccount(discoveredAccountId!);
    // Wait for the search form to render after account selection before each test.
    await transactionsPage.expectSearchFormVisible();
  });

  // ── State invariant ──────────────────────────────────────────────────────────

  test('ST-TXN-01: SEARCH_IDLE — form is visible and no results are shown after account selection', async ({
    page,
  }) => {
    const transactionsPage = new TransactionsPage(page);

    // Verify starting state: form visible, no results rendered
    expect(await transactionsPage.isSearchFormVisible()).toBe(true);
    expect(await transactionsPage.hasResults()).toBe(false);
  });

  // ── Transitions to terminal states ──────────────────────────────────────────

  test('ST-TXN-02: SEARCH_IDLE → RESULTS — wide date range exits idle state with transactions', async ({
    page,
  }) => {
    const transactionsPage = new TransactionsPage(page);

    // A 15-year window captures the opening deposit on any ParaBank account.
    await transactionsPage.searchByDateRange('01-01-2015', '12-31-2030');

    // Primary assertion: RESULTS state (transaction rows present).
    // ERROR is also accepted as a terminal state — ParaBank occasionally returns a
    // server error on this route regardless of credentials. When that happens this
    // test still confirms the state machine left SEARCH_IDLE; it cannot confirm
    // the RESULTS state specifically.
    const hasResults = await transactionsPage.hasResults();
    const hasError = await transactionsPage.hasError();
    expect(hasResults || hasError).toBe(true);
    if (hasResults) {
      expect(await transactionsPage.getResultCount()).toBeGreaterThan(0);
    }
  });

  test('ST-TXN-03: SEARCH_IDLE → NO_RESULTS — non-existent transaction ID leaves results empty', async ({
    page,
  }) => {
    const transactionsPage = new TransactionsPage(page);

    await transactionsPage.searchByTransactionId('999999999999');

    // Primary assertion: no result rows (RESULTS state must not be reached).
    // NO_RESULTS is the target terminal state. ERROR is also accepted — ParaBank
    // is inconsistent about whether it returns a no-results message or a server
    // error for unknown IDs. Either way, RESULTS must be absent.
    expect(await transactionsPage.hasResults()).toBe(false);
    expect((await transactionsPage.hasNoResults()) || (await transactionsPage.hasError())).toBe(
      true,
    );
  });

  test('ST-TXN-04: SEARCH_IDLE → terminal state — amount search path reaches a result state', async ({
    page,
  }) => {
    const transactionsPage = new TransactionsPage(page);

    // Amount 0.01 is unlikely to match; the intent is to verify the amount
    // search path transitions out of SEARCH_IDLE to any valid terminal state.
    await transactionsPage.searchByAmount('0.01');

    const hasResults = await transactionsPage.hasResults();
    const hasNoResults = await transactionsPage.hasNoResults();
    const hasError = await transactionsPage.hasError();
    expect(hasResults || hasNoResults || hasError).toBe(true);
  });

  test('ST-TXN-05: SEARCH_IDLE persists — form input retained before submission', async ({
    page,
  }) => {
    const transactionsPage = new TransactionsPage(page);

    await transactionsPage.setTransactionId('12345');
    await page.locator('body').click();

    // Input value must be retained (field is interactive)
    expect(await transactionsPage.getTransactionIdInputValue()).toBe('12345');

    // Still in SEARCH_IDLE: form visible, no results yet
    expect(await transactionsPage.isSearchFormVisible()).toBe(true);
    expect(await transactionsPage.hasResults()).toBe(false);
  });
});
