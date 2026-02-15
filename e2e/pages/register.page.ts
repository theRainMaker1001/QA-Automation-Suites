import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';

export class RegisterPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatedPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input[id="customer.firstName"]');
    this.lastNameInput = page.locator('input[id="customer.lastName"]');
    this.streetInput = page.locator('input[id="customer.address.street"]');
    this.cityInput = page.locator('input[id="customer.address.city"]');
    this.stateInput = page.locator('input[id="customer.address.state"]');
    this.zipCodeInput = page.locator('input[id="customer.address.zipCode"]');
    this.ssnInput = page.locator('input[id="customer.ssn"]');
    this.usernameInput = page.locator('input[id="customer.username"]');
    this.passwordInput = page.locator('input[id="customer.password"]');
    this.repeatedPasswordInput = page.locator('input[id="repeatedPassword"]');
    this.registerButton = page.locator('input[value="Register"]');
    this.errorMessages = page.locator('span.error, td.error, .error');
  }

  async goto(): Promise<void> {
    await this.navigate('/register.htm');
    await this.waitForPageLoad();
  }

  async registerNewUser(user: { username: string; password: string }): Promise<void> {
    await this.firstNameInput.fill('Test');
    await this.lastNameInput.fill('User');
    await this.streetInput.fill('123 Logic Lane');
    await this.cityInput.fill('Quality City');
    await this.stateInput.fill('TS');
    await this.zipCodeInput.fill('90210');
    await this.ssnInput.fill('999-99-9999');
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.repeatedPasswordInput.fill(user.password);
    await this.registerButton.click();
  }

  async isRegistrationSuccess(): Promise<boolean> {
    return (
      (await this.page.locator('h1.title').filter({ hasText: 'Welcome' }).isVisible()) ||
      (await this.page.locator('text=created').isVisible())
    );
  }
}
