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
  private readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Account selector (required before searching)
    this.accountSelect = page.locator('#accountId, select[id*="account"]');

    // Search by Transaction ID
    this.transactionIdInput = page
      .locator(
        'input[id="criteria.transactionId"], input[name*="transactionId"], input#transactionId',
      )
      .first();
    this.findByIdButton = page
      .locator('button[id*="transactionId"], #findById input[type="submit"]')
      .first();

    // Search by Date
    this.dateInput = page.locator('input[id="criteria.onDate"], input[name*="onDate"]').first();
    this.findByDateButton = page
      .locator('button[id*="Date"]:not([id*="Range"]), #findByDate input[type="submit"]')
      .first();

    // Search by Date Range
    this.fromDateInput = page
      .locator('input[id="criteria.fromDate"], input[name*="fromDate"]')
      .first();
    this.toDateInput = page.locator('input[id="criteria.toDate"], input[name*="toDate"]').first();
    this.findByDateRangeButton = page
      .locator('button[id*="DateRange"], #findByDateRange input[type="submit"]')
      .first();

    // Search by Amount
    this.amountInput = page
      .locator('input[id="criteria.amount"], input[name*="amount"], input#amount')
      .first();
    this.findByAmountButton = page
      .locator('button[id*="amount"], #findByAmount input[type="submit"]')
      .first();

    // Results
    this.resultsTable = page.locator('#transactionTable, table[id*="transaction"]');
    this.resultRows = this.resultsTable.locator('tbody tr');
    this.errorMessage = page.locator('.error, [class*="error"]');
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
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async hasNoResults(): Promise<boolean> {
    try {
      await this.noResultsMessage.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
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

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
