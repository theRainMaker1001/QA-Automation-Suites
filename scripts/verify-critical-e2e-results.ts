#!/usr/bin/env node
/**
 * Verifies critical E2E results for CI gate behaviour.
 *
 * Rule:
 * - Failing tests tagged/annotated as known defects are allowed.
 * - Any other unexpected failure fails the gate.
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

function walkSuites(
  suites: JsonValue[],
  parentTitles: string[],
  unexpectedFailures: FailureRecord[],
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

        if (outcome === 'skipped' || resultStatus === 'skipped') {
          counts.skipped++;
          continue;
        }

        if (outcome === 'unexpected') {
          if (isKnownDefect && resultStatus === 'failed') {
            counts.knownDefects++;
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
      walkSuites(suite.suites, suiteTitles, unexpectedFailures, counts);
    }
  }
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
  const counts = { passed: 0, knownDefects: 0, skipped: 0 };
  walkSuites(parsed?.suites || [], [], unexpectedFailures, counts);

  console.log('Critical E2E verification summary:');
  console.log(`  Passed: ${counts.passed}`);
  console.log(`  Known defects: ${counts.knownDefects}`);
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

  console.log('\nNo unexpected critical failures detected. Known defects are tracked and allowed.');
}

main();
