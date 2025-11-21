// e2e/tests/bank/smoke.header.spec.ts
import { test, expect } from '@playwright/test';

test('@bank @smoke homepage shows login box', async ({ page }) => {
  await page.goto('/'); // uses baseURL from e2e/.env
  await expect(page.getByText(/Customer Login/i)).toBeVisible();
});
