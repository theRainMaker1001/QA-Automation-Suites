/**
 * UNIT TEST REPORTER
 * Transforms Vitest JSON output into developer-readable summary.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface VitestAssertionResult {
  ancestorTitles: string[];
  fullName: string;
  status: 'passed' | 'failed' | 'pending';
  title: string;
  duration: number;
  failureMessages: string[];
}

interface VitestTestResult {
  assertionResults: VitestAssertionResult[];
  startTime: number;
  endTime: number;
  status: string;
  name: string;
}

interface VitestJsonReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  startTime: number;
  success: boolean;
  testResults: VitestTestResult[];
}

interface DevTestResult {
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'pending';
  durationMs: number;
  error?: string;
}

interface DevUnitSummary {
  overview: {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: string;
    totalDurationMs: number;
    runDate: string;
  };
  suites: {
    name: string;
    tests: number;
    passed: number;
    failed: number;
  }[];
  failures: {
    suite: string;
    test: string;
    error: string;
  }[];
  results: DevTestResult[];
}

function transformVitestReport(rawPath: string, outputPath: string): void {
  if (!fs.existsSync(rawPath)) {
    console.log('⚠️  No Vitest JSON report found to transform');
    return;
  }

  const raw: VitestJsonReport = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

  const results: DevTestResult[] = [];
  const suiteMap = new Map<string, { tests: number; passed: number; failed: number }>();
  const failures: { suite: string; test: string; error: string }[] = [];

  for (const file of raw.testResults) {
    for (const assertion of file.assertionResults) {
      const suite = assertion.ancestorTitles.join(' > ') || 'Root';

      results.push({
        suite,
        test: assertion.title,
        status: assertion.status,
        durationMs: Math.round(assertion.duration * 100) / 100,
        error: assertion.failureMessages[0],
      });

      // Track suite stats
      if (!suiteMap.has(suite)) {
        suiteMap.set(suite, { tests: 0, passed: 0, failed: 0 });
      }
      const suiteStats = suiteMap.get(suite)!;
      suiteStats.tests++;
      if (assertion.status === 'passed') suiteStats.passed++;
      if (assertion.status === 'failed') {
        suiteStats.failed++;
        failures.push({
          suite,
          test: assertion.title,
          error: assertion.failureMessages[0] || 'Unknown error',
        });
      }
    }
  }

  const totalDurationMs = raw.testResults.reduce(
    (sum, file) => sum + (file.endTime - file.startTime),
    0,
  );

  const summary: DevUnitSummary = {
    overview: {
      totalTests: raw.numTotalTests,
      passed: raw.numPassedTests,
      failed: raw.numFailedTests,
      passRate:
        raw.numTotalTests > 0
          ? `${((raw.numPassedTests / raw.numTotalTests) * 100).toFixed(1)}%`
          : '0%',
      totalDurationMs: Math.round(totalDurationMs),
      runDate: new Date().toISOString(),
    },
    suites: Array.from(suiteMap.entries()).map(([name, stats]) => ({
      name,
      ...stats,
    })),
    failures,
    results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\n📋 Developer summary written to ${outputPath}`);
}

function generateUnitReport(): void {
  const reportsDir = path.resolve(process.cwd(), 'reports');
  const rawPath = path.join(reportsDir, 'unit-report.json');
  const devPath = path.join(reportsDir, 'unit-summary.json');

  transformVitestReport(rawPath, devPath);
}

export { generateUnitReport, transformVitestReport };
