#!/usr/bin/env tsx
/**
 * Nightly Regression and A11y Orchestration
 *
 * Single source of truth for the nightly audit sequence used by both the
 * Docker container CMD and the playwright.yml nightly-audit job.
 *
 * Sequence:
 *   1. Unit tests (vitest)
 *   2. API integration tests (vitest)
 *   3. Loan decision table tests
 *   4. @critical E2E — chromium only (produces e2e-critical-results.json)
 *   5. @regression cross-browser matrix — chromium + firefox + webkit
 *   6. Preserve e2e-results.json → e2e-regression-results.json before
 *      the a11y run overwrites the shared output file
 *   7. @a11y audit — chromium only
 *   8. Generate a11y compliance markdown report
 *
 * Failure behaviour:
 *   - Steps 1–3 (vitest): failure is recorded in `vitestFailed` but never
 *     aborts later phases. All three suites run regardless of each other.
 *   - Step 4 (critical E2E): failure sets `criticalFailed` unless all failures
 *     are classified as third-party upstream blocks. The results file is always
 *     written in a finally block so the stakeholder dashboard is never left with
 *     a missing e2e-critical-results.json.
 *   - Step 5 (regression E2E): failure sets `regressionFailed` and preserves
 *     partial results, but does NOT skip a11y.
 *   - Step 7 (a11y): always runs — nightly is an audit lane, not fail-fast.
 *     Failure sets `a11yFailed`. A warning is printed if regression also
 *     failed so context is visible in CI output.
 *   - Step 8 (report generation): non-blocking warning on failure.
 *
 * Exit code: 1 if any step failed; 0 if all passed or critical E2E was only
 * blocked by third-party ParaBank access.
 *
 * Usage:
 *   npm run test:nightly          Run locally (requires local browser install)
 *   npm run docker:run            Run inside the Playwright Docker container
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { buildE2eMetrics } from './generate-stakeholder-dashboard.js';

const reportsDir = path.join(process.cwd(), 'reports');
const allureE2eDir = path.join(process.cwd(), 'allure-results', 'e2e');

// Ensure output directories exist. When bind mounts replace container dirs,
// Docker creates the host-side directory but not any subdirectories within it,
// so the mkdir call here guarantees write targets in all execution modes.
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(allureE2eDir, { recursive: true });

function run(cmd: string): void {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function isBlockedOnlyCriticalRun(reportPath: string): boolean {
  if (!fs.existsSync(reportPath)) return false;

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const metrics = buildE2eMetrics(report, true, {}, false);
    return metrics.upstreamBlocks > 0 && metrics.unexpectedFailures === 0;
  } catch (error) {
    console.warn('\nCould not classify critical E2E result:', error);
    return false;
  }
}

// Separate flags so each phase's outcome is reported independently.
// vitestFailed:   any of the three vitest suites failed
// criticalFailed: the @critical E2E run failed
// criticalBlocked: critical E2E was blocked by third-party access only
// regressionFailed: the @regression E2E matrix failed
// a11yFailed:     the @a11y run failed
// None of these abort subsequent phases — nightly is an audit lane, not a
// fail-fast gate. Full picture on bad nights matters more than early exit.
let vitestFailed = false;
let criticalFailed = false;
let criticalBlocked = false;
let regressionFailed = false;
let a11yFailed = false;

// ── 1–3. Vitest suites (soft-fail: all run regardless of each other) ─────────
// Each suite is independent. Failure records vitestFailed but does not
// prevent subsequent steps from running, including each other.
for (const [label, cmd] of [
  ['Unit tests', 'npm run test:unit'],
  ['API integration tests', 'npm run test:api'],
  ['Loan decision table', 'npm run test:loans'],
] as const) {
  try {
    run(cmd);
  } catch {
    vitestFailed = true;
    console.error(`\n${label} failed — continuing to next phase.`);
  }
}

// ── 4. @critical E2E (chromium — produces e2e-critical-results.json) ─────────
// Runs on every nightly so the stakeholder dashboard always has a fresh
// e2e-critical-results.json, independent of PR cadence. Uses chromium
// (not chromium-auth) to match the ci.yml critical-lane exactly — availability
// and login specs require an unauthenticated session. Authenticated specs load
// their own storage state via test.use({ storageState }) and work on any project.
try {
  run('npx playwright test -c e2e/playwright.config.ts --grep @critical --project=chromium');
} catch {
  criticalFailed = true;
  console.error('\nCritical E2E tests failed — writing partial results and continuing.');
} finally {
  // Always write the critical results file so the dashboard never shows
  // "Partial dataset: missing e2e-critical-results.json".
  const src = path.join(reportsDir, 'e2e-results.json');
  const dest = path.join(reportsDir, 'e2e-critical-results.json');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('\nPreserved: e2e-results.json → e2e-critical-results.json');
  }

  if (fs.existsSync(src) && criticalFailed && isBlockedOnlyCriticalRun(dest)) {
    criticalFailed = false;
    criticalBlocked = true;
    console.warn(
      '\nCritical E2E was blocked by third-party ParaBank access only. ' +
        'Publishing this nightly as blocked rather than a confirmed product failure.',
    );
  }
}

// ── 5. Cross-browser regression E2E matrix ───────────────────────────────────
try {
  run(
    'npx playwright test -c e2e/playwright.config.ts --grep @regression ' +
      '--project=chromium --project=firefox --project=webkit',
  );
} catch {
  regressionFailed = true;
  console.error('\nRegression tests failed — preserving partial results and continuing to a11y.');
} finally {
  // Always preserve regression results before the a11y run may overwrite the
  // shared e2e-results.json output file.
  const src = path.join(reportsDir, 'e2e-results.json');
  const dest = path.join(reportsDir, 'e2e-regression-results.json');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('\nPreserved: e2e-results.json → e2e-regression-results.json');
  }
}

// ── 6–7. A11y audit (always runs — nightly is an audit lane, not fail-fast) ──
// Running a11y even after regression failure gives the full picture on bad nights
// and avoids carrying stale a11y data forward into the stakeholder dashboard.
// Some a11y failures may be secondary fallout from broken UI — the label below
// makes that context visible in CI output.
if (regressionFailed) {
  console.warn(
    '\n⚠  Running @a11y after regression failure. ' +
      'Some a11y results may reflect upstream UI breakage rather than independent defects.',
  );
}

try {
  run('npx playwright test -c e2e/playwright.config.ts --grep @a11y --project=chromium');
} catch {
  a11yFailed = true;
}

// Generate compliance report even on partial a11y failure — partial data is
// better than no report for the stakeholder dashboard.
try {
  run('npx tsx scripts/generate-a11y-compliance-report.ts');
} catch (e) {
  console.warn('\nA11y compliance report generation failed (non-blocking):', e);
}

if (criticalBlocked) {
  console.warn('\nNightly classification: blocked by third-party ParaBank login access.');
}

process.exit(vitestFailed || criticalFailed || regressionFailed || a11yFailed ? 1 : 0);
