#!/usr/bin/env node
/**
 * Stakeholder Dashboard Generator
 *
 * Aggregates test results into executive-friendly metrics.
 * Generates both JSON data and styled HTML dashboard.
 *
 * Data sources (all read from reports/):
 *   - unit-summary.json        -> Code Quality lane
 *   - loan-results.json        -> Financial Accuracy lane
 *   - e2e-critical-results.json + e2e-regression-results.json -> User Journey lane
 *   - a11y-results.json        -> WCAG Compliance lane
 *
 * Usage: tsx scripts/generate-stakeholder-dashboard.ts
 */
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LaneMetrics {
  passRate: number;
  totalTests: number;
  passed: number;
  failed: number;
  lastRun: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILING' | 'NO_DATA';
  dataAvailable: boolean;
}

interface E2eMetrics extends LaneMetrics {
  knownDefects: number;
  unexpectedFailures: number;
  skipped: number;
}

interface A11yMetrics extends LaneMetrics {
  wcagCompliance: 'AA' | 'A' | 'NON_COMPLIANT';
  criticalViolations: number;
  seriousViolations: number;
}

interface DashboardData {
  generatedAt: string;
  overallConfidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lanes: {
    unit: LaneMetrics;
    critical: LaneMetrics;
    e2e: E2eMetrics;
    a11y: A11yMetrics;
  };
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readJsonSafe<T>(filePath: string, fallback: T): { data: T; found: boolean } {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`  Not found: ${path.basename(filePath)}`);
      return { data: fallback, found: false };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as T;
    console.log(`  Loaded: ${path.basename(filePath)}`);
    return { data: parsed, found: true };
  } catch (error) {
    console.error(`  Error reading ${path.basename(filePath)}:`, error);
    return { data: fallback, found: false };
  }
}

function calculateStatus(passRate: number, dataAvailable: boolean): LaneMetrics['status'] {
  if (!dataAvailable) return 'NO_DATA';
  if (passRate >= 98) return 'HEALTHY';
  if (passRate >= 90) return 'DEGRADED';
  return 'FAILING';
}

function calculateConfidence(lanes: DashboardData['lanes']): number {
  // Weighted: critical/loans (40%), e2e (25%), unit (20%), a11y (15%)
  const weights = { unit: 0.2, critical: 0.4, e2e: 0.25, a11y: 0.15 };
  let confidence = 0;
  let totalWeight = 0;

  for (const [lane, weight] of Object.entries(weights)) {
    const metrics = lanes[lane as keyof typeof lanes];
    if (metrics.dataAvailable) {
      confidence += metrics.passRate * weight;
      totalWeight += weight;
    }
  }

  // Normalise if some lanes have no data (so available lanes still produce a meaningful score)
  if (totalWeight === 0) return 0;
  return Math.round((confidence / totalWeight) * 10) / 10;
}

function determineRiskLevel(
  confidence: number,
  criticalPassRate: number,
  criticalDataAvailable: boolean,
): DashboardData['riskLevel'] {
  if (!criticalDataAvailable) return 'HIGH';
  if (criticalPassRate < 90 || confidence < 70) return 'CRITICAL';
  if (criticalPassRate < 95 || confidence < 85) return 'HIGH';
  if (criticalPassRate < 98 || confidence < 95) return 'MEDIUM';
  return 'LOW';
}

// ─── Lane Builders ───────────────────────────────────────────────────────────

function buildUnitMetrics(data: any, found: boolean): LaneMetrics {
  const overview = data?.overview || {};
  const passed = overview.passed || 0;
  const total = overview.totalTests || 0;
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  const dataAvailable = found && total > 0;

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: total,
    passed,
    failed: total - passed,
    lastRun: overview.runDate || new Date().toISOString(),
    status: calculateStatus(passRate, dataAvailable),
    dataAvailable,
  };
}

function buildCriticalMetrics(data: any, found: boolean): LaneMetrics {
  const passed = data?.numPassedTests || 0;
  const total = data?.numTotalTests || 0;
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  const dataAvailable = found && total > 0;

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: total,
    passed,
    failed: total - passed,
    lastRun: data?.startTime ? new Date(data.startTime).toISOString() : new Date().toISOString(),
    status: calculateStatus(passRate, dataAvailable),
    dataAvailable,
  };
}

/**
 * Parses a single Playwright JSON report and extracts test outcome counts.
 * Distinguishes between:
 *   - normal passes (status=expected, result=passed)
 *   - known defects (status=expected, result=failed - test.fail() behaving as expected)
 *   - unexpected failures (status=unexpected - real bugs)
 *   - skipped (status=skipped - test.skip() conditional)
 */
function countPlaywrightTests(data: any): {
  passed: number;
  knownDefects: number;
  unexpectedFailures: number;
  skipped: number;
  lastRun: string;
} {
  let passed = 0;
  let knownDefects = 0;
  let unexpectedFailures = 0;
  let skipped = 0;

  if (!data?.suites) {
    return { passed, knownDefects, unexpectedFailures, skipped, lastRun: new Date().toISOString() };
  }

  function walkSuites(suites: any[]): void {
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of spec.tests || []) {
            const outcome = test.status; // expected | unexpected | skipped | flaky
            const resultStatus = test.results?.[0]?.status; // passed | failed | timedOut | skipped

            if (outcome === 'skipped') {
              skipped++;
            } else if (outcome === 'unexpected') {
              unexpectedFailures++;
            } else if (outcome === 'expected' && resultStatus === 'failed') {
              // test.fail() that correctly failed - a tracked known defect
              knownDefects++;
            } else {
              // expected + passed, or flaky (passed on retry)
              passed++;
            }
          }
        }
      }
      if (suite.suites) {
        walkSuites(suite.suites);
      }
    }
  }

  walkSuites(data.suites);

  return {
    passed,
    knownDefects,
    unexpectedFailures,
    skipped,
    lastRun: data.stats?.startTime || new Date().toISOString(),
  };
}

function buildE2eMetrics(
  criticalData: any,
  criticalFound: boolean,
  regressionData: any,
  regressionFound: boolean,
): E2eMetrics {
  const critical = countPlaywrightTests(criticalData);
  const regression = countPlaywrightTests(regressionData);

  const passed = critical.passed + regression.passed;
  const knownDefects = critical.knownDefects + regression.knownDefects;
  const unexpectedFailures = critical.unexpectedFailures + regression.unexpectedFailures;
  const skipped = critical.skipped + regression.skipped;

  // For pass rate: known defects count as "handled" (not failures), unexpected failures are real
  const total = passed + knownDefects + unexpectedFailures;
  const passRate = total > 0 ? ((passed + knownDefects) / total) * 100 : 0;
  const dataAvailable = (criticalFound || regressionFound) && total > 0;

  const lastRun =
    criticalFound && regressionFound
      ? new Date(
          Math.max(new Date(critical.lastRun).getTime(), new Date(regression.lastRun).getTime()),
        ).toISOString()
      : criticalFound
        ? critical.lastRun
        : regression.lastRun;

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: total,
    passed,
    failed: unexpectedFailures,
    knownDefects,
    unexpectedFailures,
    skipped,
    lastRun,
    status: calculateStatus(passRate, dataAvailable),
    dataAvailable,
  };
}

function buildA11yMetrics(data: any, found: boolean): A11yMetrics {
  const totalViolations = data?.totalViolations || 0;
  const totalPasses = data?.totalPasses || 0;
  const total = totalViolations + totalPasses;
  const passRate = total > 0 ? (totalPasses / total) * 100 : 0;
  const dataAvailable = found && total > 0;

  let criticalViolations = 0;
  let seriousViolations = 0;

  if (data?.pageResults) {
    for (const page of data.pageResults) {
      for (const violation of page.violations || []) {
        if (violation.impact === 'critical') criticalViolations++;
        if (violation.impact === 'serious') seriousViolations++;
      }
    }
  }

  let wcagCompliance: A11yMetrics['wcagCompliance'] = 'NON_COMPLIANT';
  if (dataAvailable && criticalViolations === 0 && seriousViolations === 0) {
    wcagCompliance = 'AA';
  } else if (dataAvailable && criticalViolations === 0) {
    wcagCompliance = 'A';
  }

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: data?.totalPages || 0,
    passed: totalPasses,
    failed: totalViolations,
    lastRun: data?.runDate || new Date().toISOString(),
    status: dataAvailable
      ? criticalViolations === 0
        ? seriousViolations === 0
          ? 'HEALTHY'
          : 'DEGRADED'
        : 'FAILING'
      : 'NO_DATA',
    dataAvailable,
    wcagCompliance,
    criticalViolations,
    seriousViolations,
  };
}

// ─── HTML Generator ──────────────────────────────────────────────────────────

function generateHTML(data: DashboardData): string {
  const riskColors = { LOW: '#22c55e', MEDIUM: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' };
  const statusColors = {
    HEALTHY: '#22c55e',
    DEGRADED: '#eab308',
    FAILING: '#ef4444',
    NO_DATA: '#8b949e',
  };
  const wcagColors = { AA: '#22c55e', A: '#eab308', NON_COMPLIANT: '#ef4444' };

  const e2e = data.lanes.e2e as E2eMetrics;

  function noDataOverlay(available: boolean): string {
    if (available) return '';
    return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(13,17,23,0.85);border-radius:12px;z-index:1;"><span style="color:#8b949e;font-size:0.95rem;">Awaiting first run</span></div>`;
  }

  function statValue(value: string | number, available: boolean, color?: string): string {
    const display = available ? String(value) : '-';
    const style = color ? ` style="color: ${color}"` : '';
    return `<div class="stat-value"${style}>${display}</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Stakeholder Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      padding: 2rem;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #f0f6fc; margin-bottom: 0.5rem; font-size: 2rem; }
    .subtitle { color: #8b949e; margin-bottom: 2rem; }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
    }

    .confidence-card { text-align: center; padding: 2rem; }
    .confidence-value { font-size: 4rem; font-weight: bold; color: #58a6ff; }
    .confidence-label { color: #8b949e; font-size: 0.9rem; }

    .risk-card { text-align: center; padding: 2rem; }
    .risk-badge {
      display: inline-block;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: bold;
      font-size: 1.5rem;
      color: #fff;
      background: ${riskColors[data.riskLevel]};
    }
    .risk-label { color: #8b949e; margin-top: 1rem; font-size: 0.9rem; }

    .lane-card h3 {
      color: #f0f6fc;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
    .lane-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #f0f6fc; }
    .stat-label { font-size: 0.8rem; color: #8b949e; }

    .defect-row {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid #30363d;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
      text-align: center;
    }
    .defect-value { font-size: 1.1rem; font-weight: bold; }
    .defect-label { font-size: 0.7rem; color: #8b949e; }

    .wcag-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.9rem;
      color: #fff;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .summary-value { font-size: 2rem; font-weight: bold; }
    .summary-label { color: #8b949e; font-size: 0.8rem; }

    .footer {
      text-align: center;
      color: #8b949e;
      font-size: 0.8rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #30363d;
    }
    .footer a { color: #58a6ff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>QA Automation Suite</h1>
    <p class="subtitle">Stakeholder Dashboard - Generated ${new Date(data.generatedAt).toLocaleString()}</p>

    <!-- Summary Row -->
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-value" style="color: #58a6ff">${data.summary.totalTests}</div>
        <div class="summary-label">Total Tests</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" style="color: #22c55e">${data.summary.totalPassed}</div>
        <div class="summary-label">Passed</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" style="color: ${data.summary.totalFailed > 0 ? '#ef4444' : '#22c55e'}">${data.summary.totalFailed}</div>
        <div class="summary-label">Failed</div>
      </div>
    </div>

    <!-- Confidence & Risk -->
    <div class="metrics-row">
      <div class="card confidence-card">
        <div class="confidence-value">${data.overallConfidence}%</div>
        <div class="confidence-label">Overall Confidence Score</div>
      </div>
      <div class="card risk-card">
        <div class="risk-badge">${data.riskLevel} RISK</div>
        <div class="risk-label">Current Risk Assessment</div>
      </div>
    </div>

    <!-- Lane Cards -->
    <div class="metrics-row">
      <!-- Code Quality (Unit Tests) -->
      <div class="card lane-card">
        ${noDataOverlay(data.lanes.unit.dataAvailable)}
        <h3>
          Code Quality
          <span class="status-dot" style="background: ${statusColors[data.lanes.unit.status]}"></span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            ${statValue(data.lanes.unit.passRate + '%', data.lanes.unit.dataAvailable)}
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.unit.totalTests, data.lanes.unit.dataAvailable)}
            <div class="stat-label">Unit Tests</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.unit.passed, data.lanes.unit.dataAvailable, '#22c55e')}
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.unit.failed, data.lanes.unit.dataAvailable, data.lanes.unit.failed > 0 ? '#ef4444' : '#22c55e')}
            <div class="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <!-- Financial Accuracy (Loan Decision Table) -->
      <div class="card lane-card">
        ${noDataOverlay(data.lanes.critical.dataAvailable)}
        <h3>
          Financial Accuracy
          <span class="status-dot" style="background: ${statusColors[data.lanes.critical.status]}"></span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            ${statValue(data.lanes.critical.passRate + '%', data.lanes.critical.dataAvailable)}
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.critical.totalTests, data.lanes.critical.dataAvailable)}
            <div class="stat-label">Decision Table Tests</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.critical.passed, data.lanes.critical.dataAvailable, '#22c55e')}
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.critical.failed, data.lanes.critical.dataAvailable, data.lanes.critical.failed > 0 ? '#ef4444' : '#22c55e')}
            <div class="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <!-- User Journey Coverage (E2E Browser Tests) -->
      <div class="card lane-card">
        ${noDataOverlay(e2e.dataAvailable)}
        <h3>
          User Journey Coverage
          <span class="status-dot" style="background: ${statusColors[e2e.status]}"></span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            ${statValue(e2e.passRate + '%', e2e.dataAvailable)}
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            ${statValue(e2e.totalTests, e2e.dataAvailable)}
            <div class="stat-label">E2E Tests</div>
          </div>
          <div class="stat-item">
            ${statValue(e2e.passed, e2e.dataAvailable, '#22c55e')}
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-item">
            ${statValue(e2e.unexpectedFailures, e2e.dataAvailable, e2e.unexpectedFailures > 0 ? '#ef4444' : '#22c55e')}
            <div class="stat-label">Unexpected Failures</div>
          </div>
        </div>
        <div class="defect-row">
          <div>
            <div class="defect-value" style="color: #eab308">${e2e.dataAvailable ? e2e.knownDefects : '-'}</div>
            <div class="defect-label">Known Defects</div>
          </div>
          <div>
            <div class="defect-value" style="color: ${e2e.unexpectedFailures > 0 ? '#ef4444' : '#22c55e'}">${e2e.dataAvailable ? e2e.unexpectedFailures : '-'}</div>
            <div class="defect-label">Action Required</div>
          </div>
          <div>
            <div class="defect-value" style="color: #8b949e">${e2e.dataAvailable ? e2e.skipped : '-'}</div>
            <div class="defect-label">Skipped</div>
          </div>
        </div>
      </div>

      <!-- WCAG Compliance (Accessibility) -->
      <div class="card lane-card">
        ${noDataOverlay(data.lanes.a11y.dataAvailable)}
        <h3>
          WCAG Compliance
          <span class="wcag-badge" style="background: ${data.lanes.a11y.dataAvailable ? wcagColors[data.lanes.a11y.wcagCompliance] : '#8b949e'}">${data.lanes.a11y.dataAvailable ? data.lanes.a11y.wcagCompliance : 'N/A'}</span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            ${statValue(data.lanes.a11y.passRate + '%', data.lanes.a11y.dataAvailable)}
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.a11y.totalTests, data.lanes.a11y.dataAvailable)}
            <div class="stat-label">Pages Scanned</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.a11y.criticalViolations, data.lanes.a11y.dataAvailable, data.lanes.a11y.criticalViolations > 0 ? '#ef4444' : '#22c55e')}
            <div class="stat-label">Critical Issues</div>
          </div>
          <div class="stat-item">
            ${statValue(data.lanes.a11y.seriousViolations, data.lanes.a11y.dataAvailable, data.lanes.a11y.seriousViolations > 0 ? '#eab308' : '#22c55e')}
            <div class="stat-label">Serious Issues</div>
          </div>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <a href="../a11y-compliance-report.html" style="color: #58a6ff; font-size: 0.85rem;">View Full WCAG Compliance Report</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>QA Automation Suite | <a href="../allure/">View Detailed Developer Report (Allure)</a> | <a href="../">Dashboard Hub</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function generateDashboard(): void {
  console.log('Stakeholder Dashboard Generator');
  console.log('================================');

  const reportsDir = path.join(process.cwd(), 'reports');

  console.log('\nReading data sources:');
  const unitSummary = readJsonSafe(path.join(reportsDir, 'unit-summary.json'), { overview: {} });
  const loanResults = readJsonSafe(path.join(reportsDir, 'loan-results.json'), {});
  const e2eCritical = readJsonSafe(path.join(reportsDir, 'e2e-critical-results.json'), {});
  const e2eRegression = readJsonSafe(path.join(reportsDir, 'e2e-regression-results.json'), {});
  const a11yResults = readJsonSafe(path.join(reportsDir, 'a11y-results.json'), {});

  // Build lane metrics
  const lanes: DashboardData['lanes'] = {
    unit: buildUnitMetrics(unitSummary.data, unitSummary.found),
    critical: buildCriticalMetrics(loanResults.data, loanResults.found),
    e2e: buildE2eMetrics(
      e2eCritical.data,
      e2eCritical.found,
      e2eRegression.data,
      e2eRegression.found,
    ),
    a11y: buildA11yMetrics(a11yResults.data, a11yResults.found),
  };

  // Calculate overall metrics
  const overallConfidence = calculateConfidence(lanes);
  const riskLevel = determineRiskLevel(
    overallConfidence,
    lanes.critical.passRate,
    lanes.critical.dataAvailable,
  );

  // Build dashboard data
  const dashboard: DashboardData = {
    generatedAt: new Date().toISOString(),
    overallConfidence,
    riskLevel,
    lanes,
    summary: {
      totalTests: lanes.unit.totalTests + lanes.critical.totalTests + lanes.e2e.totalTests,
      totalPassed: lanes.unit.passed + lanes.critical.passed + lanes.e2e.passed,
      totalFailed: lanes.unit.failed + lanes.critical.failed + lanes.e2e.failed,
    },
  };

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write JSON
  const jsonPath = path.join(reportsDir, 'stakeholder-dashboard.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dashboard, null, 2));
  console.log(`\nJSON written: ${jsonPath}`);

  // Write HTML
  const htmlPath = path.join(reportsDir, 'stakeholder-dashboard.html');
  fs.writeFileSync(htmlPath, generateHTML(dashboard));
  console.log(`HTML written: ${htmlPath}`);

  // Summary
  console.log('\nDashboard Summary:');
  console.log(`  Confidence: ${dashboard.overallConfidence}%`);
  console.log(`  Risk Level: ${dashboard.riskLevel}`);
  console.log(
    `  Code Quality: ${lanes.unit.passed}/${lanes.unit.totalTests} (${lanes.unit.passRate}%)${lanes.unit.dataAvailable ? '' : ' [no data]'}`,
  );
  console.log(
    `  Financial Accuracy: ${lanes.critical.passed}/${lanes.critical.totalTests} (${lanes.critical.passRate}%)${lanes.critical.dataAvailable ? '' : ' [no data]'}`,
  );
  console.log(
    `  User Journeys: ${lanes.e2e.passed}/${lanes.e2e.totalTests} (${lanes.e2e.passRate}%) | ${(lanes.e2e as E2eMetrics).knownDefects} known defects | ${(lanes.e2e as E2eMetrics).unexpectedFailures} unexpected${lanes.e2e.dataAvailable ? '' : ' [no data]'}`,
  );
  console.log(
    `  WCAG: ${lanes.a11y.wcagCompliance} compliance${lanes.a11y.dataAvailable ? '' : ' [no data]'}`,
  );
}

// Run
generateDashboard();
