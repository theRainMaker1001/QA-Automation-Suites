#!/usr/bin/env node
/**
 * Verifies critical E2E results for CI gate behaviour.
 *
 * Rule:
 * - Failing tests tagged/annotated as known defects are allowed.
 * - Third-party upstream blocks are reported separately.
 * - Any other unexpected failure fails the gate.
 * - Upstream blocks only pass when ALLOW_UPSTREAM_BLOCKED=true is set by the caller.
 *
 * Input:
 * - reports/e2e-results.json (default), or PLAYWRIGHT_JSON_REPORT env override.
 */
import * as fs from 'fs';
import * as path from 'path';

type JsonValue = Record<string, any>;

interface FailureRecord {
  title: string;
  file: string;
  outcome: string;
  resultStatus: string;
}

function reportPath(): string {
  return (
    process.env.PLAYWRIGHT_JSON_REPORT || path.join(process.cwd(), 'reports', 'e2e-results.json')
  );
}

function normaliseTag(tag: unknown): string {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
}

function hasKnownDefectMarker(spec: JsonValue, test: JsonValue, firstResult: JsonValue): boolean {
  const tags = [...(spec?.tags || []), ...(test?.tags || [])].map(normaliseTag);
  if (tags.includes('known-defect')) return true;

  const annotations = [...(test?.annotations || []), ...(firstResult?.annotations || [])];
  return annotations.some((annotation) => {
    const type = String(annotation?.type || '').toLowerCase();
    const description = String(annotation?.description || '').toLowerCase();
    return type === 'known-defect' || description.includes('known defect');
  });
}

function collectResultText(spec: JsonValue, test: JsonValue, firstResult: JsonValue): string {
  const results = test?.results?.length ? test.results : [firstResult];
  const resultMessages = results
    .map((result: JsonValue) => {
      const errors = result?.errors || [];
      const errorMessages = errors
        .map((error: JsonValue) => [error?.message, error?.stack].filter(Boolean).join(' '))
        .join(' ');
      const resultAnnotations = (result?.annotations || [])
        .map(
          (annotation: JsonValue) => `${annotation?.type || ''} ${annotation?.description || ''}`,
        )
        .join(' ');

      return [
        result?.status,
        result?.error?.message,
        result?.error?.stack,
        errorMessages,
        resultAnnotations,
      ]
        .filter(Boolean)
        .join(' ');
    })
    .join(' ');
  const annotations = [...(spec?.annotations || []), ...(test?.annotations || [])]
    .map((annotation: JsonValue) => `${annotation?.type || ''} ${annotation?.description || ''}`)
    .join(' ');

  return [spec?.title, test?.title, test?.status, resultMessages, annotations]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isUpstreamBlockedResult(resultText: string): boolean {
  return (
    resultText.includes('upstream_login_surface_unavailable') ||
    resultText.includes('upstream_rate_limited') ||
    (resultText.includes('cloudflare') &&
      (resultText.includes('429') || resultText.includes('error 1015'))) ||
    resultText.includes('you are being rate limited')
  );
}

function isAuthSetupCascadeResult(resultText: string): boolean {
  return (
    resultText.includes('beforeall could not verify login') ||
    resultText.includes('global setup login may have failed') ||
    resultText.includes('storage state has no cookies') ||
    resultText.includes('auth-dependent tests will be skipped') ||
    (resultText.includes('waiting for locator') && resultText.includes('input[name="username"]')) ||
    (resultText.includes('expected: "guest"') && resultText.includes('received: "login_error"'))
  );
}

function walkSuites(
  suites: JsonValue[],
  parentTitles: string[],
  unexpectedFailures: FailureRecord[],
  upstreamBlocks: FailureRecord[],
  hasDirectUpstreamBlock: boolean,
  counts: { passed: number; knownDefects: number; skipped: number },
): void {
  for (const suite of suites || []) {
    const suiteTitles = suite?.title ? [...parentTitles, String(suite.title)] : parentTitles;

    for (const spec of suite?.specs || []) {
      const specTitle = String(spec?.title || '');
      const locationFile = String(spec?.file || '');

      for (const test of spec?.tests || []) {
        const outcome = String(test?.status || '');
        const firstResult =
          test?.results?.find(
            (result: JsonValue) => result?.status && result.status !== 'skipped',
          ) ||
          test?.results?.[0] ||
          {};
        const resultStatus = String(firstResult?.status || '');
        const isKnownDefect = hasKnownDefectMarker(spec, test, firstResult);
        const fullTitle = [...suiteTitles, specTitle].filter(Boolean).join(' > ');
        const file = locationFile || String(test?.location?.file || '');
        const resultText = collectResultText(spec, test, firstResult);
        const isUpstreamBlock =
          isUpstreamBlockedResult(resultText) ||
          (hasDirectUpstreamBlock && isAuthSetupCascadeResult(resultText));

        if (outcome === 'skipped' || resultStatus === 'skipped') {
          counts.skipped++;
          continue;
        }

        if (outcome === 'unexpected') {
          if (isKnownDefect && resultStatus === 'failed') {
            counts.knownDefects++;
          } else if (isUpstreamBlock) {
            upstreamBlocks.push({
              title: fullTitle || '(untitled test)',
              file: file || '(unknown file)',
              outcome: outcome || '(unknown outcome)',
              resultStatus: resultStatus || '(unknown result)',
            });
          } else {
            unexpectedFailures.push({
              title: fullTitle || '(untitled test)',
              file: file || '(unknown file)',
              outcome: outcome || '(unknown outcome)',
              resultStatus: resultStatus || '(unknown result)',
            });
          }
          continue;
        }

        // Backward compatibility for old expected-fail encoding.
        if (outcome === 'expected' && resultStatus === 'failed') {
          counts.knownDefects++;
          continue;
        }

        counts.passed++;
      }
    }

    if (suite?.suites?.length) {
      walkSuites(
        suite.suites,
        suiteTitles,
        unexpectedFailures,
        upstreamBlocks,
        hasDirectUpstreamBlock,
        counts,
      );
    }
  }
}

function hasDirectUpstreamBlock(suites: JsonValue[]): boolean {
  for (const suite of suites || []) {
    for (const spec of suite?.specs || []) {
      for (const test of spec?.tests || []) {
        const firstResult =
          test?.results?.find(
            (result: JsonValue) => result?.status && result.status !== 'skipped',
          ) ||
          test?.results?.[0] ||
          {};
        const resultText = collectResultText(spec, test, firstResult);
        if (String(test?.status || '') === 'unexpected' && isUpstreamBlockedResult(resultText)) {
          return true;
        }
      }
    }

    if (suite?.suites?.length && hasDirectUpstreamBlock(suite.suites)) return true;
  }

  return false;
}

function main(): void {
  const filePath = reportPath();
  if (!fs.existsSync(filePath)) {
    console.error(`Critical E2E verification failed: missing report ${filePath}`);
    process.exit(1);
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as JsonValue;
  } catch (error) {
    console.error(`Critical E2E verification failed: invalid JSON at ${filePath}`);
    console.error(error);
    process.exit(1);
  }

  const unexpectedFailures: FailureRecord[] = [];
  const upstreamBlocks: FailureRecord[] = [];
  const counts = { passed: 0, knownDefects: 0, skipped: 0 };
  const directUpstreamBlock = hasDirectUpstreamBlock(parsed?.suites || []);
  walkSuites(
    parsed?.suites || [],
    [],
    unexpectedFailures,
    upstreamBlocks,
    directUpstreamBlock,
    counts,
  );

  console.log('Critical E2E verification summary:');
  console.log(`  Passed: ${counts.passed}`);
  console.log(`  Known defects: ${counts.knownDefects}`);
  console.log(`  Upstream blocked: ${upstreamBlocks.length}`);
  console.log(`  Skipped: ${counts.skipped}`);
  console.log(`  Unexpected failures: ${unexpectedFailures.length}`);

  if (unexpectedFailures.length > 0) {
    console.error('\nUnexpected critical failures detected:');
    for (const failure of unexpectedFailures) {
      console.error(
        `- ${failure.title} [${failure.resultStatus}/${failure.outcome}] (${failure.file})`,
      );
    }
    process.exit(1);
  }

  if (upstreamBlocks.length > 0) {
    console.error('\nCritical E2E blocked by third-party ParaBank access:');
    for (const failure of upstreamBlocks) {
      console.error(
        `- ${failure.title} [${failure.resultStatus}/${failure.outcome}] (${failure.file})`,
      );
    }

    if (process.env.ALLOW_UPSTREAM_BLOCKED === 'true') {
      console.warn('\nNo product regression detected. Upstream blocks were explicitly allowed.');
    } else {
      console.error(
        '\nSet ALLOW_UPSTREAM_BLOCKED=true only for non-release monitoring lanes that should publish blocked results without failing.',
      );
      process.exit(1);
    }
  }

  console.log('\nNo unexpected critical failures detected. Known defects are tracked and allowed.');
}

main();
