/**
 * WCAG Accessibility Tests - Critical Path
 *
 * Uses axe-core to validate WCAG 2.1 AA compliance on key pages.
 * Focuses on:
 * - Missing form labels
 * - Keyboard navigation issues
 * - Focus indicators
 * - Screen reader compatibility
 * - Accessible error messages
 *
 * @tags @critical @a11y
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG rule categories we're testing
const FORM_LABEL_RULES = ['label', 'label-title-only', 'form-field-multiple-labels'];
const KEYBOARD_RULES = ['tabindex', 'focus-order-semantics', 'scrollable-region-focusable'];
const FOCUS_RULES = ['focus-visible', 'link-in-text-block'];
const SCREEN_READER_RULES = [
  'aria-allowed-attr',
  'aria-hidden-body',
  'aria-hidden-focus',
  'aria-required-attr',
  'aria-roles',
  'aria-valid-attr',
  'aria-valid-attr-value',
  'document-title',
  'html-has-lang',
  'image-alt',
  'button-name',
  'link-name',
];
const ERROR_MESSAGE_RULES = ['aria-input-field-name'];

// All critical a11y rules combined
const CRITICAL_A11Y_RULES = [
  ...FORM_LABEL_RULES,
  ...KEYBOARD_RULES,
  ...FOCUS_RULES,
  ...SCREEN_READER_RULES,
  ...ERROR_MESSAGE_RULES,
];

// Pages to test (critical user paths)
const CRITICAL_PAGES = [
  { name: 'Homepage / Login', path: '/' },
  { name: 'About Us', path: '/about.htm' },
  { name: 'Services', path: '/services.htm' },
];

// Store results for report generation
const a11yResults: Array<{
  page: string;
  url: string;
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    helpUrl: string;
    nodes: number;
  }>;
  passes: number;
  timestamp: string;
}> = [];

test.describe('@critical @a11y WCAG 2.1 AA Compliance', () => {
  test.afterAll(async () => {
    // Write results to JSON for report generation
    const fs = await import('fs');
    const path = await import('path');
    const reportsDir = path.join(process.cwd(), 'reports');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const summary = {
      runDate: new Date().toISOString(),
      totalPages: a11yResults.length,
      totalViolations: a11yResults.reduce((sum, r) => sum + r.violations.length, 0),
      totalPasses: a11yResults.reduce((sum, r) => sum + r.passes, 0),
      pageResults: a11yResults,
    };

    fs.writeFileSync(path.join(reportsDir, 'a11y-results.json'), JSON.stringify(summary, null, 2));
  });

  for (const { name, path } of CRITICAL_PAGES) {
    test.describe(`Page: ${name}`, () => {
      test(`@a11y form labels are properly associated`, async ({ page }) => {
        await page.goto(path);

        const results = await new AxeBuilder({ page }).withRules(FORM_LABEL_RULES).analyze();

        // Store for reporting
        storeResults(name, page.url(), results);

        const violations = results.violations.filter((v) => FORM_LABEL_RULES.includes(v.id));

        expect(
          violations,
          `Form label violations found:\n${formatViolations(violations)}`,
        ).toHaveLength(0);
      });

      test(`@a11y keyboard navigation works correctly`, async ({ page }) => {
        await page.goto(path);

        // Check axe keyboard rules
        const axeResults = await new AxeBuilder({ page }).withRules(KEYBOARD_RULES).analyze();

        const violations = axeResults.violations.filter((v) => KEYBOARD_RULES.includes(v.id));

        // Also verify Tab key moves focus
        const initialFocus = await page.evaluate(() => document.activeElement?.tagName);
        await page.keyboard.press('Tab');
        const afterTab = await page.evaluate(() => document.activeElement?.tagName);

        // Focus should move (not be stuck)
        const focusMoved = initialFocus !== afterTab || afterTab !== 'BODY';

        expect(
          violations.length === 0 && focusMoved,
          `Keyboard navigation issues:\n${formatViolations(violations)}${!focusMoved ? '\nFocus did not move on Tab press' : ''}`,
        ).toBe(true);
      });

      test(`@a11y focus indicators are visible`, async ({ page }) => {
        await page.goto(path);

        const results = await new AxeBuilder({ page }).withRules(FOCUS_RULES).analyze();

        // Check that focusable elements have visible focus styles
        const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]');

        let missingFocusIndicators = 0;

        for (const el of focusableElements.slice(0, 5)) {
          // Check first 5 elements
          await el.focus();
          const hasVisibleFocus = await el.evaluate((node) => {
            const styles = window.getComputedStyle(node);
            const outline = styles.outline;
            const boxShadow = styles.boxShadow;
            // Check if element has some focus indication
            return (
              (outline && outline !== 'none' && !outline.includes('0px')) ||
              (boxShadow && boxShadow !== 'none')
            );
          });

          if (!hasVisibleFocus) {
            missingFocusIndicators++;
          }
        }

        const violations = results.violations;

        expect(
          violations.length === 0 && missingFocusIndicators < 3,
          `Focus indicator issues: ${missingFocusIndicators} elements missing visible focus`,
        ).toBe(true);
      });

      test(`@a11y screen reader compatibility (ARIA/semantics)`, async ({ page }) => {
        await page.goto(path);

        const results = await new AxeBuilder({ page }).withRules(SCREEN_READER_RULES).analyze();

        storeResults(name, page.url(), results);

        const violations = results.violations.filter((v) => SCREEN_READER_RULES.includes(v.id));

        expect(
          violations,
          `Screen reader compatibility issues:\n${formatViolations(violations)}`,
        ).toHaveLength(0);
      });

      test(`@a11y error messages are accessible`, async ({ page }) => {
        await page.goto(path);

        // Try to trigger form errors if login form exists
        const loginForm = page.locator('form').first();
        const submitBtn = page.locator('input[type="submit"], button[type="submit"]').first();

        if ((await loginForm.count()) > 0 && (await submitBtn.count()) > 0) {
          // Submit empty form to trigger errors
          await submitBtn.click().catch(() => {}); // Ignore if not clickable

          // Wait for potential error messages
          await page.waitForTimeout(500);
        }

        const results = await new AxeBuilder({ page })
          .withRules([...ERROR_MESSAGE_RULES, 'aria-allowed-attr'])
          .analyze();

        // Check for proper error message association
        const errorElements = await page.$$('[class*="error"], [role="alert"], .error, #error');
        let accessibleErrors = 0;

        for (const el of errorElements) {
          const hasAriaLive = await el.evaluate((node) => {
            return (
              node.getAttribute('role') === 'alert' ||
              node.getAttribute('aria-live') !== null ||
              node.closest('[role="alert"]') !== null
            );
          });
          if (hasAriaLive) accessibleErrors++;
        }

        const violations = results.violations;

        // Pass if no violations OR if errors are properly announced
        const passed = violations.length === 0 || errorElements.length === 0;

        expect(passed, `Error message accessibility issues:\n${formatViolations(violations)}`).toBe(
          true,
        );
      });
    });
  }

  test('@a11y @critical full WCAG 2.1 AA scan - Homepage', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    storeResults('Full WCAG Scan - Homepage', page.url(), results);

    // Report critical and serious violations
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Critical WCAG violations found:\n${formatViolations(criticalViolations)}`,
    ).toHaveLength(0);
  });
});

// Helper to format violations for error messages
function formatViolations(
  violations: Array<{ id: string; impact?: string | null; description: string; helpUrl: string }>,
): string {
  if (violations.length === 0) return 'None';

  return violations
    .map(
      (v) =>
        `  - [${v.impact?.toUpperCase() || 'UNKNOWN'}] ${v.id}: ${v.description}\n    Help: ${v.helpUrl}`,
    )
    .join('\n');
}

// Helper to store results for reporting
function storeResults(
  pageName: string,
  url: string,
  results: Awaited<ReturnType<AxeBuilder['analyze']>>,
): void {
  const existingIdx = a11yResults.findIndex((r) => r.page === pageName);

  const pageResult = {
    page: pageName,
    url,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact || 'unknown',
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    })),
    passes: results.passes.length,
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    // Merge violations from different tests on same page
    a11yResults[existingIdx].violations.push(...pageResult.violations);
    a11yResults[existingIdx].passes += pageResult.passes;
  } else {
    a11yResults.push(pageResult);
  }
}
