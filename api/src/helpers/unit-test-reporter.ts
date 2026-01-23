/**
 * UNIT TEST REPORTER
 * Generates technical summary for unit test runs.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface UnitTestResult {
  testName: string;
  suite: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

interface UnitTestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: string;
  durationMs: number;
  results: UnitTestResult[];
  runDate: string;
}

function writeUnitReport(summary: UnitTestSummary): void {
  const reportsDir = path.resolve(process.cwd(), '.reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'unit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log(`\n📋 Unit test report written to ${reportPath}`);
}

export { writeUnitReport };
export type { UnitTestResult, UnitTestSummary };
