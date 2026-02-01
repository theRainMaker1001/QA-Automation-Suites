/**
 * Accounts Page Object
 *
 * Encapsulates ParaBank accounts overview functionality.
 * Provides methods for viewing account balances and navigating to account details.
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';

export class AccountsPage extends BasePage {
  // Locators
  private readonly accountsTable: Locator;
  private readonly accountRows: Locator;
  private readonly totalBalance: Locator;
  private readonly accountLinks: Locator;

  constructor(page: Page) {
    super(page);

    this.accountsTable = page.locator('#accountTable, table[id*="account"]');
    this.accountRows = this.accountsTable.locator('tbody tr');
    this.totalBalance = page.locator('#accountTable tfoot td, .total, [id*="total"]');
    this.accountLinks = this.accountsTable.locator('a[href*="activity"]');
  }

  // ============================================================================
  // Actions
  // ============================================================================

  async goto(): Promise<void> {
    await this.navigate('/overview.htm');
    await this.waitForPageLoad();
  }

  async clickAccount(index: number): Promise<void> {
    await this.accountLinks.nth(index).click();
    await this.waitForPageLoad();
  }

  async clickAccountById(accountId: string): Promise<void> {
    await this.page.locator(`a[href*="${accountId}"]`).click();
    await this.waitForPageLoad();
  }

  // ============================================================================
  // State Detection
  // ============================================================================

  async isAccountsTableVisible(): Promise<boolean> {
    try {
      await this.accountsTable.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async hasAccounts(): Promise<boolean> {
    const count = await this.accountRows.count();
    return count > 0;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  async getAccountCount(): Promise<number> {
    return this.accountLinks.count();
  }

  async getAccountIds(): Promise<string[]> {
    const links = await this.accountLinks.all();
    const ids: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      const match = href?.match(/id=(\d+)/);
      if (match) {
        ids.push(match[1]);
      }
    }
    return ids;
  }

  async getTotalBalanceText(): Promise<string> {
    return (await this.totalBalance.first().textContent()) ?? '';
  }

  async getAccountBalance(index: number): Promise<string> {
    const row = this.accountRows.nth(index);
    const balanceCell = row.locator('td').last();
    return (await balanceCell.textContent()) ?? '';
  }
}
