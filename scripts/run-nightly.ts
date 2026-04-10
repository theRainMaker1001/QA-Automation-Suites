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
 *   4. @regression cross-browser matrix — chromium + firefox + webkit
 *   5. Preserve e2e-results.json → e2e-regression-results.json before
 *      the a11y run overwrites the shared output file
 *   6. @a11y audit — chromium only
 *   7. Generate a11y compliance markdown report
 *
 * Failure behaviour:
 *   - Steps 1–3 (vitest): failure is recorded in `vitestFailed` but never
 *     aborts later phases. All three suites run regardless of each other.
 *   - Step 4 (regression E2E): failure sets `regressionFailed` and preserves
 *     partial results, but does NOT skip a11y.
 *   - Step 6 (a11y): always runs — nightly is an audit lane, not fail-fast.
 *     Failure sets `a11yFailed`. A warning is printed if regression also
 *     failed so context is visible in CI output.
 *   - Step 7 (report generation): non-blocking warning on failure.
 *
 * Exit code: 1 if any step failed; 0 if all passed.
 *
 * Usage:
 *   npm run test:nightly          Run locally (requires local browser install)
 *   npm run docker:run            Run inside the Playwright Docker container
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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

// Separate flags so each phase's outcome is reported independently.
// vitestFailed: any of the three vitest suites failed
// regressionFailed: the @regression E2E matrix failed
// a11yFailed: the @a11y run failed
// None of these abort subsequent phases — nightly is an audit lane, not a
// fail-fast gate. Full picture on bad nights matters more than early exit.
let vitestFailed = false;
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

// ── 4. Cross-browser regression E2E matrix ───────────────────────────────────
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

// ── 5–6. A11y audit (always runs — nightly is an audit lane, not fail-fast) ──
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

process.exit(vitestFailed || regressionFailed || a11yFailed ? 1 : 0);
