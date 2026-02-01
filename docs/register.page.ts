import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the ParaBank Registration Page.
 * Encapsulates locators and interactions for user registration.
 */
export class RegisterPage {
  readonly page: Page;
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
    this.page = page;
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

  /**
   * Navigates to the ParaBank registration page.
   */
  async goto() {
    await this.page.goto('https://parabank.parasoft.com/parabank/register.htm');
  }

  /**
   * Completes the registration form with standard test data and provided credentials.
   * @param user - Object containing the username and password to register.
   */
  async registerNewUser(user: { username: string; password: string }) {
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

  /**
   * Verifies if the registration was successful by checking for the welcome message.
   * Handles strict mode violations by targeting specific heading elements.
   * @returns {Promise<boolean>} True if registration succeeded, false otherwise.
   */
  async isRegistrationSuccess() {
    return (
      (await this.page.locator('h1.title').filter({ hasText: 'Welcome' }).isVisible()) ||
      (await this.page.locator('text=created').isVisible())
    );
  }
}
