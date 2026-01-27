/**
 * @file form-validation.registration.spec.ts
 * @description ISTQB State Transition Testing - Form Validation
 *
 * Tests ParaBank registration form validation behavior.
 * Covers required fields, password matching, and duplicate username handling.
 *
 * @tags @regression
 */

import { test, expect } from '@playwright/test';

const PARABANK_URL = 'https://parabank.parasoft.com/parabank';

test.describe('@regression Form Validation: Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${PARABANK_URL}/register.htm`);
  });

  test('FV-REG-01: Empty form submission shows all required field errors', async ({ page }) => {
    // Submit empty form
    await page.locator('input[value="Register"]').click();

    // Verify all required field error messages appear
    const errorMessages = page.locator('.error, span.error');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });

    // Check for specific required field errors
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/first name.*required/i);
    expect(pageContent).toMatch(/last name.*required/i);
    expect(pageContent).toMatch(/address.*required/i);
    expect(pageContent).toMatch(/city.*required/i);
    expect(pageContent).toMatch(/state.*required/i);
    expect(pageContent).toMatch(/zip.*required/i);
    expect(pageContent).toMatch(/ssn.*required/i);
    expect(pageContent).toMatch(/username.*required/i);
    expect(pageContent).toMatch(/password.*required/i);
  });

  test('FV-REG-02: Password mismatch shows specific error', async ({ page }) => {
    // Fill all fields with mismatched passwords
    await page.locator('input[id="customer.firstName"]').fill('Test');
    await page.locator('input[id="customer.lastName"]').fill('User');
    await page.locator('input[id="customer.address.street"]').fill('123 Test St');
    await page.locator('input[id="customer.address.city"]').fill('TestCity');
    await page.locator('input[id="customer.address.state"]').fill('TS');
    await page.locator('input[id="customer.address.zipCode"]').fill('12345');
    await page.locator('input[id="customer.ssn"]').fill('123-45-6789');
    await page.locator('input[id="customer.username"]').fill(`testuser_${Date.now()}`);
    await page.locator('input[id="customer.password"]').fill('password123');
    await page.locator('input[id="repeatedPassword"]').fill('differentpassword');

    await page.locator('input[value="Register"]').click();

    // Verify password mismatch error
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/passwords did not match/i);
  });

  test('FV-REG-03: Duplicate username shows already exists error', async ({ page }) => {
    // Use known existing username (john is a common test user in ParaBank)
    await page.locator('input[id="customer.firstName"]').fill('Test');
    await page.locator('input[id="customer.lastName"]').fill('User');
    await page.locator('input[id="customer.address.street"]').fill('123 Test St');
    await page.locator('input[id="customer.address.city"]').fill('TestCity');
    await page.locator('input[id="customer.address.state"]').fill('TS');
    await page.locator('input[id="customer.address.zipCode"]').fill('12345');
    await page.locator('input[id="customer.ssn"]').fill('123-45-6789');
    await page.locator('input[id="customer.username"]').fill('john'); // Existing user
    await page.locator('input[id="customer.password"]').fill('password123');
    await page.locator('input[id="repeatedPassword"]').fill('password123');

    await page.locator('input[value="Register"]').click();

    // Verify duplicate username error
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/username.*already exists|username.*taken/i);
  });

  test('FV-REG-04: Valid registration creates account successfully', async ({ page }) => {
    const uniqueUsername = `qatest_${Date.now()}`;

    // Fill all fields correctly
    await page.locator('input[id="customer.firstName"]').fill('QA');
    await page.locator('input[id="customer.lastName"]').fill('Tester');
    await page.locator('input[id="customer.address.street"]').fill('456 Automation Ave');
    await page.locator('input[id="customer.address.city"]').fill('TestVille');
    await page.locator('input[id="customer.address.state"]').fill('QA');
    await page.locator('input[id="customer.address.zipCode"]').fill('99999');
    await page.locator('input[id="customer.ssn"]').fill('999-99-9999');
    await page.locator('input[id="customer.username"]').fill(uniqueUsername);
    await page.locator('input[id="customer.password"]').fill('securepass123');
    await page.locator('input[id="repeatedPassword"]').fill('securepass123');

    await page.locator('input[value="Register"]').click();

    // Verify success - welcome message or account overview
    await expect(page.getByText(/welcome|account.*created|successfully/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('FV-REG-05: Partial form submission shows only missing field errors', async ({ page }) => {
    // Fill only some fields
    await page.locator('input[id="customer.firstName"]').fill('Partial');
    await page.locator('input[id="customer.lastName"]').fill('User');
    // Leave address, city, state, zip, ssn, username, password empty

    await page.locator('input[value="Register"]').click();

    const pageContent = await page.textContent('body');

    // Should NOT show errors for filled fields
    expect(pageContent).not.toMatch(/first name.*required/i);
    expect(pageContent).not.toMatch(/last name.*required/i);

    // Should show errors for empty fields
    expect(pageContent).toMatch(/address.*required/i);
    expect(pageContent).toMatch(/city.*required/i);
    expect(pageContent).toMatch(/username.*required/i);
    expect(pageContent).toMatch(/password.*required/i);
  });
});
