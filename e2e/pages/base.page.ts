/**
 * Base Page Object
 *
 * Common functionality shared across all page objects.
 */

import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BANK_BASE_URL ?? 'https://parabank.parasoft.com/parabank';
  }

  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  protected getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1],
  ): Locator {
    return this.page.getByRole(role, options);
  }

  protected getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
