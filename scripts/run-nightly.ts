#!/usr/bin/env tsx
/**
 * Nightly Regression and A11y Orchestration
 *
 * Single source of truth for the nightly audit sequence used by both the
 * Docker container CMD and the updated playwright.yml nightly-audit job.
 *
 * Sequence (mirrors playwright.yml nightly-audit exactly):
 *   1. @regression cross-browser matrix — chromium + firefox + webkit
 *   2. Preserve e2e-results.json → e2e-regression-results.json before
 *      the a11y run overwrites the shared output file
 *   3. @a11y audit — chromium only
 *   4. Generate a11y compliance markdown report
 *
 * Exit behaviour:
 *   - Regression failure: preserves partial results, skips a11y, exits 1
 *   - A11y failure: generates report from partial data, exits 1
 *   - A11y report generation failure: non-blocking warning, exits with
 *     whatever code the test runs produced
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

let failed = false;

// ── 1. Cross-browser regression matrix ───────────────────────────────────────
try {
  run(
    'npx playwright test -c e2e/playwright.config.ts --grep @regression ' +
      '--project=chromium --project=firefox --project=webkit',
  );
} catch {
  failed = true;
  console.error('\nRegression tests failed — preserving partial results.');
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

// ── 2. A11y audit (skipped if regression failed) ─────────────────────────────
if (!failed) {
  try {
    run('npx playwright test -c e2e/playwright.config.ts --grep @a11y --project=chromium');
  } catch {
    failed = true;
  }

  // Generate compliance report even on partial a11y failure — partial data is
  // better than no report for the stakeholder dashboard.
  try {
    run('npx tsx scripts/generate-a11y-compliance-report.ts');
  } catch (e) {
    console.warn('\nA11y compliance report generation failed (non-blocking):', e);
  }
}

process.exit(failed ? 1 : 0);
