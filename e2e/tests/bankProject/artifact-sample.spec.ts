/**
 * Artifact Upload Sample Tests
 *
 * These tests intentionally fail to demonstrate CI artifact collection.
 * Tagged @negative to run separately and verify artifact upload works.
 *
 * Run with: npm run test:e2e:negative
 *
 * Expected artifacts on failure:
 * - Screenshot at point of failure
 * - Video recording of test execution
 * - Playwright trace file for debugging
 */

import { test, expect } from '@playwright/test';

// Skip these tests in normal runs - only run via test:e2e:negative
test.skip(({ browserName }) => browserName !== 'chromium', 'Artifact demo runs on chromium only');

test.describe('@negative @sample Artifact Upload Verification', () => {
  // Don't retry intentional failures
  test.describe.configure({ retries: 0 });

  test('SAMPLE: intentional assertion failure for artifact demo', async ({ page }) => {
    await page.goto('https://parabank.parasoft.com/parabank/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot before the intentional failure
    await page.screenshot({ path: 'test-results/sample-before-failure.png' });

    // Intentional failure to trigger artifact upload
    expect(
      true,
      'INTENTIONAL FAILURE: This test exists to verify artifact upload on CI failures',
    ).toBe(false);
  });

  test('SAMPLE: element not found for artifact demo', async ({ page }) => {
    await page.goto('https://parabank.parasoft.com/parabank/');
    await page.waitForLoadState('networkidle');

    // Attempt to find element that doesn't exist (with short timeout)
    // This generates a helpful trace showing the failed lookup
    await expect(page.locator('#nonexistent-element-for-artifact-demo')).toBeVisible({
      timeout: 3000,
    });
  });
});
