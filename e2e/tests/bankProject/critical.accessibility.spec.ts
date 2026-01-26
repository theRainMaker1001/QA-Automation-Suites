/**
 * WCAG Accessibility Audit - Critical Path
 *
 * Uses axe-core to scan WCAG 2.1 AA compliance on key pages.
 * Operates in AUDIT MODE: collects and reports violations without failing tests.
 * This allows continuous monitoring of third-party applications (e.g., ParaBank).
 *
 * Focuses on:
 * - Missing form labels
 * - Keyboard navigation issues
 * - Focus indicators
 * - Screen reader compatibility
 * - Accessible error messages
 *
 * @tags @critical @a11y
 */

import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG rule categories we're auditing
const FORM_LABEL_RULES = ['label', 'label-title-only', 'form-field-multiple-labels'];
const KEYBOARD_RULES = ['tabindex', 'focus-order-semantics', 'scrollable-region-focusable'];
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
      test(`@a11y audit form labels`, async ({ page }) => {
        await page.goto(path);

        const results = await new AxeBuilder({ page }).withRules(FORM_LABEL_RULES).analyze();

        // Store for reporting (audit mode - always passes)
        storeResults(name, page.url(), results);

        const violations = results.violations.filter((v) => FORM_LABEL_RULES.includes(v.id));
        if (violations.length > 0) {
          console.log(`[AUDIT] ${name} - Form label issues: ${violations.length}`);
        }
      });

      test(`@a11y audit keyboard navigation`, async ({ page }) => {
        await page.goto(path);

        const axeResults = await new AxeBuilder({ page }).withRules(KEYBOARD_RULES).analyze();
        storeResults(name, page.url(), axeResults);

        // Also verify Tab key moves focus
        const initialFocus = await page.evaluate(() => document.activeElement?.tagName);
        await page.keyboard.press('Tab');
        const afterTab = await page.evaluate(() => document.activeElement?.tagName);

        const focusMoved = initialFocus !== afterTab || afterTab !== 'BODY';
        const violations = axeResults.violations.filter((v) => KEYBOARD_RULES.includes(v.id));

        if (violations.length > 0 || !focusMoved) {
          console.log(
            `[AUDIT] ${name} - Keyboard issues: ${violations.length}, focus moved: ${focusMoved}`,
          );
        }
      });

      test(`@a11y audit focus indicators`, async ({ page }) => {
        await page.goto(path);

        // Check that focusable elements have visible focus styles
        const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]');

        let missingFocusIndicators = 0;

        for (const el of focusableElements.slice(0, 5)) {
          await el.focus();
          const hasVisibleFocus = await el.evaluate((node) => {
            const styles = window.getComputedStyle(node);
            const outline = styles.outline;
            const boxShadow = styles.boxShadow;
            return (
              (outline && outline !== 'none' && !outline.includes('0px')) ||
              (boxShadow && boxShadow !== 'none')
            );
          });

          if (!hasVisibleFocus) {
            missingFocusIndicators++;
          }
        }

        // Store as a focus indicator finding
        storeResults(name, page.url(), {
          violations:
            missingFocusIndicators > 0
              ? [
                  {
                    id: 'focus-indicator-check',
                    impact: missingFocusIndicators >= 3 ? 'serious' : 'moderate',
                    description: `${missingFocusIndicators} of ${Math.min(5, focusableElements.length)} sampled elements lack visible focus indicators`,
                    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
                    nodes: Array(missingFocusIndicators).fill({ target: ['sampled element'] }),
                  },
                ]
              : [],
          passes:
            focusableElements.length - missingFocusIndicators > 0 ? [{ id: 'focus-check' }] : [],
        });

        if (missingFocusIndicators > 0) {
          console.log(
            `[AUDIT] ${name} - Focus indicator issues: ${missingFocusIndicators} elements`,
          );
        }
      });

      test(`@a11y audit screen reader compatibility`, async ({ page }) => {
        await page.goto(path);

        const results = await new AxeBuilder({ page }).withRules(SCREEN_READER_RULES).analyze();
        storeResults(name, page.url(), results);

        const violations = results.violations.filter((v) => SCREEN_READER_RULES.includes(v.id));
        if (violations.length > 0) {
          console.log(`[AUDIT] ${name} - Screen reader issues: ${violations.length}`);
        }
      });

      test(`@a11y audit error message accessibility`, async ({ page }) => {
        await page.goto(path);

        // Try to trigger form errors if login form exists
        const loginForm = page.locator('form').first();
        const submitBtn = page.locator('input[type="submit"], button[type="submit"]').first();

        if ((await loginForm.count()) > 0 && (await submitBtn.count()) > 0) {
          await submitBtn.click().catch(() => {});
          await page.waitForTimeout(500);
        }

        const results = await new AxeBuilder({ page })
          .withRules([...ERROR_MESSAGE_RULES, 'aria-allowed-attr'])
          .analyze();

        storeResults(name, page.url(), results);

        if (results.violations.length > 0) {
          console.log(`[AUDIT] ${name} - Error message issues: ${results.violations.length}`);
        }
      });
    });
  }

  test('@a11y @critical full WCAG 2.1 AA scan - Homepage', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    storeResults('Full WCAG Scan - Homepage', page.url(), results);

    // Log summary (audit mode - always passes)
    const critical = results.violations.filter((v) => v.impact === 'critical').length;
    const serious = results.violations.filter((v) => v.impact === 'serious').length;
    const moderate = results.violations.filter((v) => v.impact === 'moderate').length;
    const minor = results.violations.filter((v) => v.impact === 'minor').length;

    console.log(
      `[AUDIT] Full WCAG Scan - Critical: ${critical}, Serious: ${serious}, Moderate: ${moderate}, Minor: ${minor}`,
    );
  });
});

// Helper to store results for reporting (accepts axe results or custom audit data)
interface AuditViolation {
  id: string;
  impact?: string | null;
  description: string;
  helpUrl: string;
  nodes: ArrayLike<unknown>;
}

interface AuditResult {
  violations: AuditViolation[];
  passes: ArrayLike<unknown>;
}

function storeResults(pageName: string, url: string, results: AuditResult): void {
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
