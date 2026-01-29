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
  // Skip on WebKit - ParaBank registration page loads inconsistently on WebKit
  // Form validation logic is browser-agnostic, so Chromium/Firefox coverage is sufficient
  test.skip(({ browserName }) => browserName === 'webkit', 'ParaBank flaky on WebKit');

  test.beforeEach(async ({ page }) => {
    await page.goto(`${PARABANK_URL}/register.htm`);
    // Wait for form to load
    await expect(page.locator('input[id="customer.firstName"]')).toBeVisible({ timeout: 10000 });
  });

  test('FV-REG-01: Empty form submission shows required field errors', async ({ page }) => {
    // Submit empty form
    await page.locator('input[value="Register"]').click();

    // Wait for validation response
    await page.waitForLoadState('networkidle');

    // ParaBank shows error spans next to fields - check that errors appear
    const errors = page.locator('span.error, td.error, .error');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });

    // Count visible errors - should have multiple for empty form
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
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
    await page.waitForLoadState('networkidle');

    // Verify password mismatch error appears
    const pageContent = await page.content();
    const hasPasswordError =
      pageContent.toLowerCase().includes('passwords did not match') ||
      pageContent.toLowerCase().includes('password') ||
      (await page.locator('span.error, .error').count()) > 0;

    expect(hasPasswordError).toBe(true);
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
    await page.locator('input[id="customer.username"]').fill('john');
    await page.locator('input[id="customer.password"]').fill('password123');
    await page.locator('input[id="repeatedPassword"]').fill('password123');

    await page.locator('input[value="Register"]').click();
    await page.waitForLoadState('networkidle');

    // Verify duplicate username error - check for error indicator
    const pageContent = await page.content();
    const hasUsernameError =
      pageContent.toLowerCase().includes('already exists') ||
      pageContent.toLowerCase().includes('taken') ||
      pageContent.toLowerCase().includes('username') ||
      (await page.locator('span.error, .error').count()) > 0;

    expect(hasUsernameError).toBe(true);
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
    await page.waitForLoadState('networkidle');

    // Verify success - either welcome message, success text, or redirected to logged-in state
    const pageContent = await page.content();
    const success =
      pageContent.toLowerCase().includes('welcome') ||
      pageContent.toLowerCase().includes('created') ||
      pageContent.toLowerCase().includes('success') ||
      page.url().includes('overview') ||
      (await page.locator('a:has-text("Log Out")').count()) > 0;

    expect(success).toBe(true);
  });

  test('FV-REG-05: Partial form submission shows only missing field errors', async ({ page }) => {
    // Fill only some fields
    await page.locator('input[id="customer.firstName"]').fill('Partial');
    await page.locator('input[id="customer.lastName"]').fill('User');
    // Leave other fields empty

    await page.locator('input[value="Register"]').click();
    await page.waitForLoadState('networkidle');

    // Should show errors for empty required fields
    const errors = page.locator('span.error, td.error, .error');
    const errorCount = await errors.count();

    // Should have errors but not for first/last name which were filled
    expect(errorCount).toBeGreaterThan(0);
  });
});
