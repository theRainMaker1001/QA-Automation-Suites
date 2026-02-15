/**
 * Transactions Page Object
 *
 * Encapsulates ParaBank Find Transactions functionality.
 * Supports search by transaction ID, date, date range, and amount.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export type SearchMode = 'BY_ID' | 'BY_DATE' | 'BY_DATE_RANGE' | 'BY_AMOUNT';

export class TransactionsPage extends BasePage {
  // Account selector
  private readonly accountSelect: Locator;

  // Search by Transaction ID
  private readonly transactionIdInput: Locator;
  private readonly findByIdButton: Locator;

  // Search by Date
  private readonly dateInput: Locator;
  private readonly findByDateButton: Locator;

  // Search by Date Range
  private readonly fromDateInput: Locator;
  private readonly toDateInput: Locator;
  private readonly findByDateRangeButton: Locator;

  // Search by Amount
  private readonly amountInput: Locator;
  private readonly findByAmountButton: Locator;

  // Results
  private readonly resultsTable: Locator;
  private readonly resultRows: Locator;
  private readonly errorMessage: Locator;
  private readonly genericErrorHeading: Locator;
  private readonly genericErrorText: Locator;
  private readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Account selector (required before searching)
    this.accountSelect = page.locator('#accountId, select[id*="account"]');

    // Search by Transaction ID
    this.transactionIdInput = page
      .locator(
        'input#transactionId, input[id="criteria.transactionId"], input[name*="transactionId"]',
      )
      .first();
    this.findByIdButton = page
      .locator('#findById, button#findById, #findById input[type="submit"]')
      .first();

    // Search by Date
    this.dateInput = page
      .locator('input#transactionDate, input[id="criteria.onDate"], input[name*="onDate"]')
      .first();
    this.findByDateButton = page
      .locator('#findByDate, button#findByDate, #findByDate input[type="submit"]')
      .first();

    // Search by Date Range
    this.fromDateInput = page
      .locator('input#fromDate, input[id="criteria.fromDate"], input[name*="fromDate"]')
      .first();
    this.toDateInput = page
      .locator('input#toDate, input[id="criteria.toDate"], input[name*="toDate"]')
      .first();
    this.findByDateRangeButton = page
      .locator('#findByDateRange, button#findByDateRange, #findByDateRange input[type="submit"]')
      .first();

    // Search by Amount
    this.amountInput = page
      .locator('input[id="criteria.amount"], input[name*="amount"], input#amount')
      .first();
    this.findByAmountButton = page
      .locator('#findByAmount, button#findByAmount, #findByAmount input[type="submit"]')
      .first();

    // Results
    this.resultsTable = page.locator('#transactionTable, table[id*="transaction"]');
    this.resultRows = this.resultsTable.locator('tbody tr');
    this.errorMessage = page.locator('.error, [class*="error"]');
    this.genericErrorHeading = page.getByRole('heading', { name: /error!?/i });
    this.genericErrorText = page.getByText(/an internal error has occurred/i);
    this.noResultsMessage = page.locator('text=No transactions found, p:has-text("No")');
  }

  // ============================================================================
  // Actions
  // ============================================================================

  async goto(): Promise<void> {
    await this.navigate('/findtrans.htm');
    await this.waitForPageLoad();
  }

  async selectAccount(accountId: string): Promise<void> {
    await this.accountSelect.selectOption(accountId);
  }

  async searchByTransactionId(transactionId: string): Promise<void> {
    await this.transactionIdInput.fill(transactionId);
    await this.findByIdButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchByDate(date: string): Promise<void> {
    await this.dateInput.fill(date);
    await this.findByDateButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchByDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.fromDateInput.fill(fromDate);
    await this.toDateInput.fill(toDate);
    await this.findByDateRangeButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchByAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
    await this.findByAmountButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clearTransactionIdInput(): Promise<void> {
    await this.transactionIdInput.clear();
  }

  async setTransactionId(transactionId: string): Promise<void> {
    await this.transactionIdInput.fill(transactionId);
  }

  async setDate(date: string): Promise<void> {
    await this.dateInput.fill(date);
  }

  async setAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
  }

  async submitTransactionIdSearch(): Promise<void> {
    await this.findByIdButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ============================================================================
  // State Detection
  // ============================================================================

  async isSearchFormVisible(): Promise<boolean> {
    try {
      await this.transactionIdInput.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async hasResults(): Promise<boolean> {
    const count = await this.resultRows.count();
    return count > 0;
  }

  async hasError(): Promise<boolean> {
    if (
      await this.errorMessage
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return true;
    }
    if ((await this.genericErrorHeading.count()) > 0) {
      return true;
    }
    return (await this.genericErrorText.count()) > 0;
  }

  async hasNoResults(): Promise<boolean> {
    try {
      await this.noResultsMessage.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async isDateSearchVisible(): Promise<boolean> {
    try {
      await this.dateInput.waitFor({ state: 'visible', timeout: 1500 });
      return true;
    } catch {
      return false;
    }
  }

  async isAmountSearchVisible(): Promise<boolean> {
    try {
      await this.amountInput.waitFor({ state: 'visible', timeout: 1500 });
      return true;
    } catch {
      return false;
    }
  }

  async isAnySearchInputVisible(): Promise<boolean> {
    return (
      (await this.isSearchFormVisible()) ||
      (await this.isDateSearchVisible()) ||
      (await this.isAmountSearchVisible())
    );
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  async expectSearchFormVisible(): Promise<void> {
    await expect(this.transactionIdInput).toBeVisible();
  }

  async expectResultsVisible(): Promise<void> {
    await expect(this.resultsTable).toBeVisible();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  async getResultCount(): Promise<number> {
    return this.resultRows.count();
  }

  async getTransactionIdInputValue(): Promise<string> {
    return this.transactionIdInput.inputValue();
  }

  async getDateInputValue(): Promise<string> {
    return this.dateInput.inputValue();
  }

  async getAmountInputValue(): Promise<string> {
    return this.amountInput.inputValue();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
