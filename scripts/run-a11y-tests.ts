#!/usr/bin/env node
/**
 * Accessibility Test Runner with Compliance Report Generation
 *
 * Executes WCAG accessibility tests and generates stakeholder/legal compliance reports.
 * Usage: npx ts-node scripts/run-a11y-tests.ts
 *        npm run test:a11y:report
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { generateComplianceReport, type A11yResults } from './generate-a11y-compliance-report.js';

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const JSON_RESULTS_PATH = path.join(REPORTS_DIR, 'a11y-results.json');
const MD_REPORT_PATH = path.join(REPORTS_DIR, 'a11y-compliance-report.md');

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function main(): void {
  console.log('♿ Running Accessibility Tests...\n');

  ensureReportsDir();

  let exitCode = 0;

  try {
    // Run Playwright accessibility tests with both list and Allure reporters
    execSync(
      `npx playwright test -c e2e/playwright.config.ts --grep @a11y --project=chromium --reporter=list --reporter=allure-playwright`,
      { stdio: 'inherit' },
    );
  } catch {
    // Tests failed but we still want to generate report
    exitCode = 1;
  }

  // Generate compliance report
  if (fs.existsSync(JSON_RESULTS_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_RESULTS_PATH, 'utf-8');
      const results: A11yResults = JSON.parse(raw);

      const report = generateComplianceReport(results);
      fs.writeFileSync(MD_REPORT_PATH, report);

      console.log(`\n📄 Compliance report generated: ${MD_REPORT_PATH}`);
    } catch (e) {
      console.error('Failed to generate compliance report:', e);
    }
  } else {
    // Create fallback report
    const fallback = `# Accessibility Compliance Report

> **Generated**: ${new Date().toISOString()}

⚠️ Test execution completed but detailed results unavailable.

Please check test logs for errors.
`;
    fs.writeFileSync(MD_REPORT_PATH, fallback);
    console.log(`\n⚠️ Fallback report generated: ${MD_REPORT_PATH}`);
  }

  process.exit(exitCode);
}

main();
