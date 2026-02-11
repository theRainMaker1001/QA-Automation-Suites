#!/usr/bin/env node
/**
 * Loan API Test Runner with Report Generation
 *
 * Executes loan decision table tests and generates a markdown report.
 * Usage: npx ts-node scripts/run-loan-tests.ts
 *        npm run test:loans
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const REPORT_PATH = path.join(REPORTS_DIR, 'loan-api-report.md');
const JSON_REPORT_PATH = path.join(REPORTS_DIR, 'loan-results.json');

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function generateReport(jsonPath: string): string {
  const timestamp = new Date().toISOString();
  let results: any = { testResults: [] };
  let parseError = false;

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    results = JSON.parse(raw);
  } catch (e) {
    parseError = true;
  }

  // Extract test data
  const allTests: Array<{ name: string; status: string; duration: number; error?: string }> = [];

  for (const file of results.testResults || []) {
    for (const suite of file.assertionResults || []) {
      allTests.push({
        name: suite.title || suite.fullName || 'Unknown',
        status: suite.status,
        duration: suite.duration || 0,
        error: suite.failureMessages?.join('\n'),
      });
    }
  }

  const passed = allTests.filter((t) => t.status === 'passed').length;
  const failed = allTests.filter((t) => t.status === 'failed').length;
  const skipped = allTests.filter((t) => t.status === 'skipped' || t.status === 'pending').length;
  const total = allTests.length || (parseError ? 0 : 34); // Expected 34 tests
  const duration =
    results.startTime && results.endTime
      ? ((results.endTime - results.startTime) / 1000).toFixed(2)
      : '?';

  const statusEmoji = failed === 0 ? '✅' : '❌';
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

  let report = `# Loan API Test Report

> **Generated**: ${timestamp}  
> **Status**: ${statusEmoji} ${failed === 0 ? 'ALL TESTS PASSED' : `${failed} FAILED`}

---

## Summary

| Metric | Value |
|--------|------:|
| Total Tests | ${total} |
| ✅ Passed | ${passed} |
| ❌ Failed | ${failed} |
| ⏭️ Skipped | ${skipped} |
| Pass Rate | ${passRate}% |
| Duration | ${duration}s |

---

## Test Technique Coverage

This suite implements **ISTQB Decision Table Testing** combined with **3-Value BVA**:

| Technique | Tests | Description |
|-----------|------:|-------------|
| Decision Table Rules | 4 | All condition combinations (R1-R4) |
| Funds Check BVA | 5 | -2, -1, 0, +1, +2 at boundary |
| Ratio Check BVA | 5 | -2, -1, 0, +1, +2 at 10% threshold |
| Loan Amount BVA | 5 | -2, -1, 0, +1, +2 at zero |
| Down Payment BVA | 5 | -2, -1, 0, +1, +2 at zero |
| Available Funds BVA | 5 | -2, -1, 0, +1, +2 at zero |
| Combined Boundaries | 5 | Critical multi-boundary scenarios |

---

## Detailed Results

`;

  // Group by category
  const categories: Record<string, typeof allTests> = {
    'Decision Table Rules': [],
    'Funds Check BVA (-2 to +2)': [],
    'Ratio Check BVA (-2 to +2)': [],
    'Loan Amount BVA (-2 to +2)': [],
    'Down Payment BVA (-2 to +2)': [],
    'Available Funds BVA (-2 to +2)': [],
    'Combined Boundaries': [],
    Other: [],
  };

  for (const test of allTests) {
    const name = test.name;
    if (name.includes('DT-R')) {
      categories['Decision Table Rules'].push(test);
    } else if (name.includes('BVA-FUNDS')) {
      categories['Funds Check BVA (-2 to +2)'].push(test);
    } else if (name.includes('BVA-RATIO')) {
      categories['Ratio Check BVA (-2 to +2)'].push(test);
    } else if (name.includes('BVA-LOAN')) {
      categories['Loan Amount BVA (-2 to +2)'].push(test);
    } else if (name.includes('BVA-DOWNPMT')) {
      categories['Down Payment BVA (-2 to +2)'].push(test);
    } else if (name.includes('BVA-AVAIL')) {
      categories['Available Funds BVA (-2 to +2)'].push(test);
    } else if (name.includes('BVA-COMBINED')) {
      categories['Combined Boundaries'].push(test);
    } else {
      categories['Other'].push(test);
    }
  }

  for (const [category, tests] of Object.entries(categories)) {
    if (tests.length === 0) continue;

    report += `### ${category}\n\n`;
    report += `| Test ID | Status | Duration |\n`;
    report += `|---------|:------:|---------:|\n`;

    for (const test of tests) {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      report += `| ${test.name} | ${icon} | ${test.duration}ms |\n`;
    }
    report += '\n';
  }

  // Failed test details
  const failedTests = allTests.filter((t) => t.status === 'failed');
  if (failedTests.length > 0) {
    report += `---\n\n## ❌ Failed Test Details\n\n`;
    for (const test of failedTests) {
      report += `### ${test.name}\n\n`;
      report += `\`\`\`\n${test.error || 'No error details'}\n\`\`\`\n\n`;
    }
  }

  report += `---\n\n`;
  report += `📖 **Test Design**: See [loan-approval-decision-table.md](../docs/test-design/loan-approval-decision-table.md)\n`;

  return report;
}

function main(): void {
  console.log('🏦 Running Loan API Decision Table Tests...\n');

  ensureReportsDir();

  let exitCode = 0;

  try {
    // Run vitest with both JSON and Allure reporters
    execSync(
      `npx vitest run api/src/tests/critical/loan-decision-table.test.ts --reporter=json --reporter=allure-vitest/reporter --outputFile=${JSON_REPORT_PATH} --allureResultsDir=allure-results/unit`,
      { stdio: 'inherit' },
    );
  } catch (e) {
    // Tests failed but we still want to generate report
    exitCode = 1;
  }

  // Generate markdown report
  if (fs.existsSync(JSON_REPORT_PATH)) {
    const report = generateReport(JSON_REPORT_PATH);
    fs.writeFileSync(REPORT_PATH, report);
    console.log(`\n📄 Report generated: ${REPORT_PATH}`);
  } else {
    // Fallback report if JSON wasn't created
    const fallback = `# Loan API Test Report\n\n> **Generated**: ${new Date().toISOString()}\n\n⚠️ Test execution completed but detailed results unavailable.\n`;
    fs.writeFileSync(REPORT_PATH, fallback);
  }

  process.exit(exitCode);
}

main();
