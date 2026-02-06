#!/usr/bin/env node
/**
 * Stakeholder Dashboard Generator
 *
 * Aggregates test results into executive-friendly metrics.
 * Generates both JSON data and styled HTML dashboard.
 *
 * Usage: tsx scripts/generate-stakeholder-dashboard.ts
 */
import * as fs from 'fs';
import * as path from 'path';

// Types
interface LaneMetrics {
  passRate: number;
  totalTests: number;
  passed: number;
  failed: number;
  lastRun: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILING';
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
    regression: LaneMetrics;
    a11y: A11yMetrics;
  };
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
  };
}

// Helpers
function readJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath} - using fallback`);
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return fallback;
  }
}

function calculateStatus(passRate: number): LaneMetrics['status'] {
  if (passRate >= 98) return 'HEALTHY';
  if (passRate >= 90) return 'DEGRADED';
  return 'FAILING';
}

function calculateConfidence(lanes: DashboardData['lanes']): number {
  // Weighted: critical (40%), regression (25%), unit (20%), a11y (15%)
  const weights = { unit: 0.2, critical: 0.4, regression: 0.25, a11y: 0.15 };
  let confidence = 0;

  for (const [lane, weight] of Object.entries(weights)) {
    const metrics = lanes[lane as keyof typeof lanes];
    confidence += metrics.passRate * weight;
  }

  return Math.round(confidence * 10) / 10;
}

function determineRiskLevel(
  confidence: number,
  criticalPassRate: number,
): DashboardData['riskLevel'] {
  if (criticalPassRate < 90 || confidence < 70) return 'CRITICAL';
  if (criticalPassRate < 95 || confidence < 85) return 'HIGH';
  if (criticalPassRate < 98 || confidence < 95) return 'MEDIUM';
  return 'LOW';
}

function buildUnitMetrics(data: any): LaneMetrics {
  const overview = data?.overview || {};
  const passed = overview.passed || 0;
  const total = overview.totalTests || 0;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: total,
    passed,
    failed: total - passed,
    lastRun: overview.runDate || new Date().toISOString(),
    status: calculateStatus(passRate),
  };
}

function buildCriticalMetrics(data: any): LaneMetrics {
  const passed = data?.numPassedTests || 0;
  const total = data?.numTotalTests || 0;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: total,
    passed,
    failed: total - passed,
    lastRun: data?.startTime ? new Date(data.startTime).toISOString() : new Date().toISOString(),
    status: calculateStatus(passRate),
  };
}

function buildA11yMetrics(data: any): A11yMetrics {
  const totalViolations = data?.totalViolations || 0;
  const totalPasses = data?.totalPasses || 0;
  const total = totalViolations + totalPasses;
  const passRate = total > 0 ? (totalPasses / total) * 100 : 0;

  // Count violations by impact
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

  // Determine WCAG compliance
  let wcagCompliance: A11yMetrics['wcagCompliance'] = 'NON_COMPLIANT';
  if (criticalViolations === 0 && seriousViolations === 0) {
    wcagCompliance = 'AA';
  } else if (criticalViolations === 0) {
    wcagCompliance = 'A';
  }

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: data?.totalPages || 0,
    passed: totalPasses,
    failed: totalViolations,
    lastRun: data?.runDate || new Date().toISOString(),
    status:
      criticalViolations === 0 ? (seriousViolations === 0 ? 'HEALTHY' : 'DEGRADED') : 'FAILING',
    wcagCompliance,
    criticalViolations,
    seriousViolations,
  };
}

function buildRegressionMetrics(data: any): LaneMetrics {
  // Playwright JSON report structure has suites with specs
  if (!data || !data.suites) {
    return {
      passRate: 0,
      totalTests: 0,
      passed: 0,
      failed: 0,
      lastRun: new Date().toISOString(),
      status: 'FAILING',
    };
  }

  // Count tests recursively through suites
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  function countTests(suites: any[]): void {
    for (const suite of suites) {
      // Count specs in this suite
      if (suite.specs) {
        for (const spec of suite.specs) {
          // Filter for @regression tagged tests
          const isRegression =
            spec.title?.includes('@regression') ||
            spec.tags?.includes('@regression') ||
            suite.title?.includes('@regression');

          if (!isRegression) continue;

          for (const test of spec.tests || []) {
            const status = test.status || test.results?.[0]?.status;
            if (status === 'passed' || status === 'expected') {
              passed++;
            } else if (status === 'failed' || status === 'unexpected') {
              failed++;
            } else if (status === 'skipped') {
              skipped++;
            }
          }
        }
      }
      // Recurse into nested suites
      if (suite.suites) {
        countTests(suite.suites);
      }
    }
  }

  countTests(data.suites);

  const total = passed + failed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  return {
    passRate: Math.round(passRate * 10) / 10,
    totalTests: total,
    passed,
    failed,
    lastRun: data.stats?.startTime || new Date().toISOString(),
    status: calculateStatus(passRate),
  };
}

function generateHTML(data: DashboardData): string {
  const riskColors = {
    LOW: '#22c55e',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };

  const statusColors = {
    HEALTHY: '#22c55e',
    DEGRADED: '#eab308',
    FAILING: '#ef4444',
  };

  const wcagColors = {
    AA: '#22c55e',
    A: '#eab308',
    NON_COMPLIANT: '#ef4444',
  };

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
    }

    .confidence-card {
      text-align: center;
      padding: 2rem;
    }
    .confidence-value {
      font-size: 4rem;
      font-weight: bold;
      color: #58a6ff;
    }
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
    .stat-item { }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #f0f6fc; }
    .stat-label { font-size: 0.8rem; color: #8b949e; }

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
      <!-- Unit Tests -->
      <div class="card lane-card">
        <h3>
          Unit Tests
          <span class="status-dot" style="background: ${statusColors[data.lanes.unit.status]}"></span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            <div class="stat-value">${data.lanes.unit.passRate}%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${data.lanes.unit.totalTests}</div>
            <div class="stat-label">Total Tests</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: #22c55e">${data.lanes.unit.passed}</div>
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${data.lanes.unit.failed > 0 ? '#ef4444' : '#22c55e'}">${data.lanes.unit.failed}</div>
            <div class="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <!-- Critical Tests -->
      <div class="card lane-card">
        <h3>
          Critical Path (Financial)
          <span class="status-dot" style="background: ${statusColors[data.lanes.critical.status]}"></span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            <div class="stat-value">${data.lanes.critical.passRate}%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${data.lanes.critical.totalTests}</div>
            <div class="stat-label">Total Tests</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: #22c55e">${data.lanes.critical.passed}</div>
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${data.lanes.critical.failed > 0 ? '#ef4444' : '#22c55e'}">${data.lanes.critical.failed}</div>
            <div class="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <!-- Regression Tests (E2E) -->
      <div class="card lane-card">
        <h3>
          Regression (E2E)
          <span class="status-dot" style="background: ${statusColors[data.lanes.regression.status]}"></span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            <div class="stat-value">${data.lanes.regression.passRate}%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${data.lanes.regression.totalTests}</div>
            <div class="stat-label">Total Tests</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: #22c55e">${data.lanes.regression.passed}</div>
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${data.lanes.regression.failed > 0 ? '#ef4444' : '#22c55e'}">${data.lanes.regression.failed}</div>
            <div class="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <!-- Accessibility -->
      <div class="card lane-card">
        <h3>
          Accessibility (WCAG)
          <span class="wcag-badge" style="background: ${wcagColors[data.lanes.a11y.wcagCompliance]}">${data.lanes.a11y.wcagCompliance}</span>
        </h3>
        <div class="lane-stats">
          <div class="stat-item">
            <div class="stat-value">${data.lanes.a11y.passRate}%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${data.lanes.a11y.totalTests}</div>
            <div class="stat-label">Pages Scanned</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${data.lanes.a11y.criticalViolations > 0 ? '#ef4444' : '#22c55e'}">${data.lanes.a11y.criticalViolations}</div>
            <div class="stat-label">Critical Issues</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${data.lanes.a11y.seriousViolations > 0 ? '#eab308' : '#22c55e'}">${data.lanes.a11y.seriousViolations}</div>
            <div class="stat-label">Serious Issues</div>
          </div>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <a href="../a11y-compliance-report.html" style="color: #58a6ff; font-size: 0.85rem;">View Full WCAG Compliance Report</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>QA Automation Suite | <a href="../allure/">View Detailed Developer Report</a> | <a href="../">Dashboard Hub</a></p>
    </div>
  </div>
</body>
</html>`;
}

// Main
function generateDashboard(): void {
  console.log('Stakeholder Dashboard Generator');
  console.log('================================');

  const reportsDir = path.join(process.cwd(), 'reports');

  // Read data sources with fallbacks
  const unitSummary = readJsonSafe(path.join(reportsDir, 'unit-summary.json'), { overview: {} });
  const loanResults = readJsonSafe(path.join(reportsDir, 'loan-results.json'), {});
  const e2eResults = readJsonSafe(path.join(reportsDir, 'e2e-results.json'), {});
  const a11yResults = readJsonSafe(path.join(reportsDir, 'a11y-results.json'), {});

  // Build lane metrics
  const lanes: DashboardData['lanes'] = {
    unit: buildUnitMetrics(unitSummary),
    critical: buildCriticalMetrics(loanResults),
    regression: buildRegressionMetrics(e2eResults),
    a11y: buildA11yMetrics(a11yResults),
  };

  // Calculate overall metrics
  const overallConfidence = calculateConfidence(lanes);
  const riskLevel = determineRiskLevel(overallConfidence, lanes.critical.passRate);

  // Build dashboard data
  const dashboard: DashboardData = {
    generatedAt: new Date().toISOString(),
    overallConfidence,
    riskLevel,
    lanes,
    summary: {
      totalTests: lanes.unit.totalTests + lanes.critical.totalTests + lanes.regression.totalTests,
      totalPassed: lanes.unit.passed + lanes.critical.passed + lanes.regression.passed,
      totalFailed: lanes.unit.failed + lanes.critical.failed + lanes.regression.failed,
    },
  };

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write JSON
  const jsonPath = path.join(reportsDir, 'stakeholder-dashboard.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dashboard, null, 2));
  console.log(`JSON written: ${jsonPath}`);

  // Write HTML
  const htmlPath = path.join(reportsDir, 'stakeholder-dashboard.html');
  fs.writeFileSync(htmlPath, generateHTML(dashboard));
  console.log(`HTML written: ${htmlPath}`);

  // Summary
  console.log('\nDashboard Summary:');
  console.log(`  Confidence: ${dashboard.overallConfidence}%`);
  console.log(`  Risk Level: ${dashboard.riskLevel}`);
  console.log(
    `  Unit Tests: ${lanes.unit.passed}/${lanes.unit.totalTests} (${lanes.unit.passRate}%)`,
  );
  console.log(
    `  Critical Tests: ${lanes.critical.passed}/${lanes.critical.totalTests} (${lanes.critical.passRate}%)`,
  );
  console.log(
    `  Regression Tests: ${lanes.regression.passed}/${lanes.regression.totalTests} (${lanes.regression.passRate}%)`,
  );
  console.log(`  A11y: ${lanes.a11y.wcagCompliance} compliance`);
}

// Run
generateDashboard();
