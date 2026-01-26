#!/usr/bin/env node
/**
 * Unit Test Runner with Report Generation
 *
 * Executes unit tests and generates developer-friendly reports.
 * Usage: npx ts-node scripts/run-unit-tests.ts
 *        npm run test:unit:report
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const JSON_REPORT_PATH = path.join(REPORTS_DIR, 'unit-results.json');
const MD_REPORT_PATH = path.join(REPORTS_DIR, 'unit-summary.md');
const SUMMARY_JSON_PATH = path.join(REPORTS_DIR, 'unit-summary.json');

interface VitestResult {
  title: string;
  fullName: string;
  ancestorTitles: string[];
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
  failureMessages?: string[];
}

interface VitestFile {
  name: string;
  assertionResults: VitestResult[];
}

interface VitestReport {
  testResults: VitestFile[];
  startTime?: number;
  success?: boolean;
}

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function parseErrorCode(message: string): string {
  // Extract meaningful error codes from failure messages
  if (message.includes('AssertionError')) return 'ASSERT_FAIL';
  if (message.includes('TypeError')) return 'TYPE_ERROR';
  if (message.includes('ReferenceError')) return 'REF_ERROR';
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('Expected')) return 'EXPECT_MISMATCH';
  if (message.includes('not defined')) return 'UNDEFINED';
  if (message.includes('Cannot find')) return 'NOT_FOUND';
  return 'UNKNOWN';
}

function truncateMessage(message: string, maxLength: number = 200): string {
  const cleaned = message.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '...';
}

interface ParsedTest {
  suite: string;
  test: string;
  status: string;
  durationMs: number;
  error?: string;
  errorCode?: string;
}

interface SuiteSummary {
  name: string;
  tests: number;
  passed: number;
  failed: number;
}

function generateReport(jsonPath: string): { markdown: string; summary: object } {
  const timestamp = new Date().toISOString();
  let results: VitestReport = { testResults: [] };
  let parseError = false;

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    results = JSON.parse(raw);
  } catch {
    parseError = true;
  }

  // Extract all tests
  const allTests: ParsedTest[] = [];
  const suiteMap = new Map<string, SuiteSummary>();

  for (const file of results.testResults || []) {
    // Extract suite name from file path
    const fileName = path.basename(file.name, '.test.ts');

    for (const test of file.assertionResults || []) {
      // Use ancestorTitles to build suite name (e.g., ["HttpClient", "URL building"])
      const ancestors = test.ancestorTitles || [];
      const suiteName = ancestors.length > 0 ? `${fileName} > ${ancestors.join(' > ')}` : fileName;
      const testName = test.title || 'Unknown';

      const parsed: ParsedTest = {
        suite: suiteName,
        test: testName,
        status: test.status,
        durationMs: test.duration || 0,
      };

      if (test.failureMessages && test.failureMessages.length > 0) {
        const errorMsg = test.failureMessages.join('\n');
        parsed.error = truncateMessage(errorMsg);
        parsed.errorCode = parseErrorCode(errorMsg);
      }

      allTests.push(parsed);

      // Update suite summary
      if (!suiteMap.has(suiteName)) {
        suiteMap.set(suiteName, { name: suiteName, tests: 0, passed: 0, failed: 0 });
      }
      const suite = suiteMap.get(suiteName)!;
      suite.tests++;
      if (test.status === 'passed') suite.passed++;
      if (test.status === 'failed') suite.failed++;
    }
  }

  const suites = Array.from(suiteMap.values());
  const passed = allTests.filter((t) => t.status === 'passed').length;
  const failed = allTests.filter((t) => t.status === 'failed').length;
  const skipped = allTests.filter((t) => t.status === 'skipped' || t.status === 'pending').length;
  const total = allTests.length;
  const totalDuration = allTests.reduce((sum, t) => sum + t.durationMs, 0);
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  const statusEmoji = failed === 0 ? '✅' : '❌';
  const statusText = failed === 0 ? 'ALL TESTS PASSED' : `${failed} FAILED`;

  // Generate markdown report
  let md = `# Unit Test Report

> **Generated**: ${timestamp}
> **Status**: ${statusEmoji} ${statusText}

---

## Overview

| Metric | Value |
|--------|------:|
| Total Tests | ${total} |
| ✅ Passed | ${passed} |
| ❌ Failed | ${failed} |
| ⏭️ Skipped | ${skipped} |
| Pass Rate | ${passRate}% |
| Total Duration | ${totalDuration.toFixed(2)}ms |

---

## Suite Breakdown

| Suite | Tests | Passed | Failed | Status |
|-------|------:|-------:|-------:|:------:|
`;

  for (const suite of suites) {
    const icon = suite.failed === 0 ? '✅' : '❌';
    md += `| ${suite.name} | ${suite.tests} | ${suite.passed} | ${suite.failed} | ${icon} |\n`;
  }

  md += '\n---\n\n';

  // Failed tests section with error codes
  const failedTests = allTests.filter((t) => t.status === 'failed');
  if (failedTests.length > 0) {
    md += `## ❌ Failed Tests — Debug Reference

| Test | Error Code | Message |
|------|:----------:|---------|
`;
    for (const test of failedTests) {
      md += `| ${test.suite} > ${test.test} | \`${test.errorCode}\` | ${test.error || 'No details'} |\n`;
    }

    md += `
### Error Code Reference

| Code | Meaning | Typical Fix |
|------|---------|-------------|
| \`ASSERT_FAIL\` | Assertion did not match | Check expected vs actual values |
| \`EXPECT_MISMATCH\` | Expected value differs | Verify test data and logic |
| \`TYPE_ERROR\` | Type mismatch at runtime | Check function signatures and inputs |
| \`REF_ERROR\` | Variable not in scope | Check imports and variable names |
| \`TIMEOUT\` | Test exceeded time limit | Check async logic or increase timeout |
| \`NOT_FOUND\` | Module/file not found | Check import paths and file existence |
| \`UNDEFINED\` | Undefined reference | Check for missing properties or args |
| \`UNKNOWN\` | Unclassified error | Read full stack trace in CI logs |

---

`;
  }

  // All test results
  md += `## All Test Results

`;

  // Group by suite for display
  for (const suite of suites) {
    const suiteTests = allTests.filter((t) => t.suite === suite.name);
    md += `### ${suite.name}\n\n`;
    md += `| Test | Status | Duration |\n`;
    md += `|------|:------:|---------:|\n`;

    for (const test of suiteTests) {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      md += `| ${test.test} | ${icon} | ${test.durationMs.toFixed(2)}ms |\n`;
    }
    md += '\n';
  }

  md += `---

*Generated by QA-Automation-Suites unit test runner*
`;

  // Generate JSON summary
  const summary = {
    overview: {
      totalTests: total,
      passed,
      failed,
      skipped,
      passRate: `${passRate}%`,
      totalDurationMs: Math.round(totalDuration * 100) / 100,
      runDate: timestamp,
    },
    suites: suites.map((s) => ({
      name: s.name,
      tests: s.tests,
      passed: s.passed,
      failed: s.failed,
    })),
    failures: failedTests.map((t) => ({
      suite: t.suite,
      test: t.test,
      errorCode: t.errorCode,
      message: t.error,
    })),
    results: allTests.map((t) => ({
      suite: t.suite,
      test: t.test,
      status: t.status,
      durationMs: Math.round(t.durationMs * 100) / 100,
    })),
  };

  return { markdown: md, summary };
}

function main(): void {
  console.log('🧪 Running Unit Tests...\n');

  ensureReportsDir();

  let exitCode = 0;

  try {
    // Run vitest with JSON reporter for unit tests
    execSync(
      `npx vitest run --config vitest.unit.config.ts --reporter=json --outputFile=${JSON_REPORT_PATH}`,
      { stdio: 'inherit' },
    );
  } catch {
    // Tests failed but we still want to generate report
    exitCode = 1;
  }

  // Generate reports
  if (fs.existsSync(JSON_REPORT_PATH)) {
    const { markdown, summary } = generateReport(JSON_REPORT_PATH);

    fs.writeFileSync(MD_REPORT_PATH, markdown);
    fs.writeFileSync(SUMMARY_JSON_PATH, JSON.stringify(summary, null, 2));

    console.log(`\n📄 Reports generated:`);
    console.log(`   - ${MD_REPORT_PATH}`);
    console.log(`   - ${SUMMARY_JSON_PATH}`);
  } else {
    // Fallback report if JSON wasn't created
    const fallback = `# Unit Test Report\n\n> **Generated**: ${new Date().toISOString()}\n\n⚠️ Test execution completed but detailed results unavailable.\n`;
    fs.writeFileSync(MD_REPORT_PATH, fallback);
    console.log(`\n⚠️ Fallback report generated: ${MD_REPORT_PATH}`);
  }

  process.exit(exitCode);
}

main();
