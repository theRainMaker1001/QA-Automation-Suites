/**
 * Login Page Object
 *
 * Encapsulates ParaBank login functionality for state transition testing.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page.js';

export type AuthState = 'GUEST' | 'LOGGING_IN' | 'LOGGED_IN' | 'LOGIN_ERROR' | 'LOGGING_OUT';

export class LoginPage extends BasePage {
  // Locators
  private readonly loginPanel: Locator;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly logoutLink: Locator;
  private readonly welcomeMessage: Locator;
  private readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);

    // Login panel container
    this.loginPanel = page.locator('#loginPanel, #leftPanel');

    // Input fields with fallback selectors
    this.usernameInput = this.loginPanel.locator('input[name="username"], input#username').first();
    this.passwordInput = this.loginPanel.locator('input[name="password"], input#password').first();

    // Submit button
    this.loginButton = this.loginPanel.getByRole('button', { name: /log\s*in/i });

    // Error message
    // ParaBank keeps hidden ".error" elements in authenticated views.
    // Scope to visible errors to avoid false LOGIN_ERROR detection.
    this.errorMessage = page.locator('.error:visible, [class*="error"]:visible');

    // Logged in state indicators
    this.logoutLink = page.getByRole('link', { name: /log\s*out/i });
    this.welcomeMessage = page.locator('#leftPanel').getByText(/welcome/i);

    // Registration link
    this.registerLink = page.getByRole('link', { name: /register/i });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  async goto(): Promise<void> {
    await this.navigate('/');
    await this.waitForPageLoad();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
    await this.waitForPageLoad();
  }

  async clickRegister(): Promise<void> {
    await this.registerLink.click();
  }

  async clearLoginForm(): Promise<void> {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  // ============================================================================
  // State Detection
  // ============================================================================

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.logoutLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async isLoginFormVisible(): Promise<boolean> {
    try {
      await this.usernameInput.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async hasLoginError(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentState(): Promise<AuthState> {
    if (await this.isLoggedIn()) {
      return 'LOGGED_IN';
    }
    if (await this.hasLoginError()) {
      return 'LOGIN_ERROR';
    }
    if (await this.isLoginFormVisible()) {
      return 'GUEST';
    }
    return 'GUEST';
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.logoutLink).toBeVisible();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.logoutLink).not.toBeVisible();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  async getWelcomeText(): Promise<string> {
    return (await this.welcomeMessage.textContent()) ?? '';
  }
}
