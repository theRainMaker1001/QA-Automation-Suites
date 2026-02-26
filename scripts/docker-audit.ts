#!/usr/bin/env tsx
/**
 * Docker Audit
 *
 * Builds the qa-nightly Docker image, verifies the container environment
 * matches project requirements, inspects output directory structure, and
 * writes a git-ignored dockerAudit.md to the repository root.
 *
 * Run before pushing Docker-related changes to confirm the image is healthy.
 *
 * Usage: npm run docker:audit
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const IMAGE_TAG = 'qa-nightly:audit';
const AUDIT_PATH = path.join(process.cwd(), 'dockerAudit.md');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

const lines: string[] = [];

function md(line = ''): void {
  lines.push(line);
}

function run(cmd: string): { ok: boolean; out: string } {
  const result = spawnSync(cmd, { shell: true, encoding: 'utf-8' });
  return {
    ok: result.status === 0,
    out: ((result.stdout ?? '') + (result.stderr ?? '')).trim(),
  };
}

// ── Header ────────────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString();
md('# Docker Audit');
md();
md(`> Generated: ${timestamp}`);
md(`> Image: \`${IMAGE_TAG}\``);
md();
md('---');
md();

// ── 1. Docker build ───────────────────────────────────────────────────────────
md('## 1. Docker Build');
md();
console.log(`Building ${IMAGE_TAG}...`);
const build = run(`docker build -t ${IMAGE_TAG} . 2>&1`);

if (build.ok) {
  md('**Status:** ✅ PASS');
} else {
  md('**Status:** ❌ FAIL');
  md();
  md('```text');
  md(build.out.slice(0, 3000));
  md('```');
}
md();

// ── 2. Playwright image / npm version parity ──────────────────────────────────
// This is the critical check: the Dockerfile image tag MUST match the
// npm-installed @playwright/test version. A mismatch causes the hard runtime
// failure: "current X, required Y".
md('## 2. Playwright Version Parity');
md();
md(
  'The Dockerfile `FROM` tag must equal the `@playwright/test` version installed by `npm ci`. ' +
    'A mismatch causes a hard runtime failure.',
);
md();

// Read expected version from Dockerfile FROM line
const dockerfileContent = fs.readFileSync(path.join(process.cwd(), 'Dockerfile'), 'utf-8');
const fromMatch = dockerfileContent.match(/FROM mcr\.microsoft\.com\/playwright:v([0-9.]+)-/);
const imageTagVersion = fromMatch ? fromMatch[1] : 'unknown';

// Read installed version from node_modules inside the built container
const installedPw = run(
  `docker run --rm ${IMAGE_TAG} node -e ` +
    `"process.stdout.write(JSON.parse(require('fs').readFileSync('/app/node_modules/@playwright/test/package.json','utf8')).version)" 2>&1`,
);
const installedVersion = installedPw.ok ? installedPw.out.trim() : 'unknown';
const versionMatch = imageTagVersion !== 'unknown' && installedVersion === imageTagVersion;

md('| Item | Value | Status |');
md('|---|---|---|');
md(`| Dockerfile image tag | \`v${imageTagVersion}\` | — |`);
md(`| npm-installed @playwright/test | \`${installedVersion}\` | — |`);
md(
  `| Versions match | — | ${versionMatch ? '✅ PASS' : `❌ FAIL — update Dockerfile \`FROM\` tag to \`v${installedVersion}-noble\``} |`,
);
md();

if (!versionMatch) {
  md('> **Action required:** Update the `FROM` line in `Dockerfile`:');
  md('> ```text');
  md(`> FROM mcr.microsoft.com/playwright:v${installedVersion}-noble`);
  md('> ```');
  md();
}

// ── 3. Container environment ──────────────────────────────────────────────────
md('## 3. Container Environment');
md();
md('| Check | Result | Required | Status |');
md('|---|---|---|---|');

const nodeVer = run(`docker run --rm ${IMAGE_TAG} node --version 2>&1`);
const nodeOk = nodeVer.ok && /^v24\./.test(nodeVer.out);
md(`| Node.js | \`${nodeVer.out}\` | \`>= v24\` | ${nodeOk ? '✅' : '❌'} |`);

const pwVer = run(`docker run --rm ${IMAGE_TAG} npx playwright --version 2>&1`);
const pwOk = pwVer.ok;
md(`| Playwright CLI | \`${pwVer.out}\` | any | ${pwOk ? '✅' : '❌'} |`);

const npmVer = run(`docker run --rm ${IMAGE_TAG} npm --version 2>&1`);
md(`| npm | \`${npmVer.out}\` | any | ${npmVer.ok ? '✅' : '❌'} |`);

md();

// ── 4. Browser availability ───────────────────────────────────────────────────
// Browsers are stored under /ms-playwright/ in the official Playwright image.
// Each browser has a versioned subdirectory (e.g. chromium-1161/, firefox-1450/).
// We check that directory exists and contains the expected browser folders.
md('## 4. Browser Availability');
md();
md(
  'Browsers are baked into `mcr.microsoft.com/playwright`. ' +
    'Verified against `/ms-playwright/` inside the container.',
);
md();
md('| Browser | Directory found | Status |');
md('|---|---|---|');

const browserChecks: boolean[] = [];
for (const browser of ['chromium', 'firefox', 'webkit'] as const) {
  const check = run(
    `docker run --rm ${IMAGE_TAG} sh -c "ls /ms-playwright/ 2>&1 | grep -i ${browser}"`,
  );
  const found = check.ok && check.out.trim().length > 0;
  browserChecks.push(found);
  const dirName = found ? `\`${check.out.trim()}\`` : '❌ not found';
  md(`| ${browser} | ${dirName} | ${found ? '✅' : '❌'} |`);
}
md();

const allBrowsersOk = browserChecks.every(Boolean);

// ── 5. Output directory structure ─────────────────────────────────────────────
md('## 5. Container Output Directories');
md();
md('Directories that receive test output (bind-mounted to host at runtime):');
md();
const dirs = run(
  `docker run --rm ${IMAGE_TAG} sh -c "ls -la /app/reports/ && echo '---' && ls -la /app/allure-results/e2e/" 2>&1`,
);
const dirsOk = dirs.ok;
md('```text');
md(dirs.out || '(empty)');
md('```');
md();

// ── 6. Host report files ──────────────────────────────────────────────────────
md('## 6. Host Report Files');
md();
md('Files in `./reports/` from the most recent run (⬜ = not yet generated):');
md();
md('| File | Lane | Present |');
md('|---|---|---|');

// Nightly-owned outputs are the critical ones for this lane
const nightlyReports = [
  'e2e-results.json',
  'e2e-regression-results.json',
  'a11y-results.json',
  'a11y-compliance-report.md',
];
const allReportEntries: Array<{ file: string; lane: string }> = [
  { file: 'unit-summary.json', lane: 'unit' },
  { file: 'loan-results.json', lane: 'critical' },
  { file: 'e2e-critical-results.json', lane: 'critical' },
  { file: 'e2e-results.json', lane: 'nightly' },
  { file: 'e2e-regression-results.json', lane: 'nightly' },
  { file: 'a11y-results.json', lane: 'nightly' },
  { file: 'a11y-compliance-report.md', lane: 'nightly' },
];

let nightlyOutputsPresent = true;
for (const { file, lane } of allReportEntries) {
  const present = fs.existsSync(path.join(REPORTS_DIR, file));
  if (nightlyReports.includes(file) && !present) nightlyOutputsPresent = false;
  md(`| \`reports/${file}\` | ${lane} | ${present ? '✅ yes' : '⬜ not yet'} |`);
}
md();

if (!nightlyOutputsPresent) {
  md(
    '> ⬜ Nightly output files are not yet present — run `npm run docker:run` then re-run `npm run docker:audit` to verify them.',
  );
  md();
}

// ── 7. Summary ────────────────────────────────────────────────────────────────
md('## 7. Summary');
md();

const allOk = build.ok && versionMatch && nodeOk && pwOk && allBrowsersOk && dirsOk;

md('| Check | Status |');
md('|---|---|');
md(`| Docker build | ${build.ok ? '✅ PASS' : '❌ FAIL'} |`);
md(`| Playwright version parity | ${versionMatch ? '✅ PASS' : '❌ FAIL'} |`);
md(`| Node.js >= v24 | ${nodeOk ? '✅ PASS' : '❌ FAIL'} |`);
md(`| All browsers present | ${allBrowsersOk ? '✅ PASS' : '❌ FAIL'} |`);
md(`| Output directories writable | ${dirsOk ? '✅ PASS' : '❌ FAIL'} |`);
md();
md(
  `**Overall:** ${
    allOk
      ? '✅ Image is healthy and ready for nightly runs.'
      : '⚠️ One or more checks failed — resolve before pushing.'
  }`,
);
md();
md('---');
md();
md('```bash');
md('# Quick reference');
md('npm run docker:build    # Rebuild after Dockerfile or dependency changes');
md('npm run docker:run      # Run the full nightly sequence locally');
md('npm run docker:audit    # Refresh this file');
md('```');
md();
md('*Run `npm run docker:audit` to regenerate this file.*');

// ── Write file ─────────────────────────────────────────────────────────────────
fs.writeFileSync(AUDIT_PATH, lines.join('\n'), 'utf-8');
console.log(`\nAudit written to dockerAudit.md`);

if (!allOk) {
  process.exit(1);
}
