import { describe, expect, it } from 'vitest';
import {
  buildE2eMetrics,
  generateHTML,
} from '../../../../scripts/generate-stakeholder-dashboard.js';

interface PlaywrightCase {
  title: string;
  status: 'expected' | 'unexpected' | 'skipped';
  resultStatus: 'passed' | 'failed' | 'skipped' | 'timedOut';
  message?: string;
  results?: Array<{
    status: 'passed' | 'failed' | 'skipped' | 'timedOut';
    message?: string;
  }>;
  tags?: string[];
  annotations?: Array<{ type: string; description?: string }>;
}

function playwrightReport(cases: PlaywrightCase[]) {
  return {
    stats: { startTime: '2026-05-13T05:38:29.000Z' },
    suites: [
      {
        title: 'bankProject',
        specs: cases.map((testCase, index) => ({
          title: testCase.title,
          file: 'bankProject/example.spec.ts',
          tags: testCase.tags || [],
          location: { file: 'bankProject/example.spec.ts', line: index + 1, column: 3 },
          tests: [
            {
              title: testCase.title,
              status: testCase.status,
              annotations: testCase.annotations || [],
              results: (
                testCase.results || [{ status: testCase.resultStatus, message: testCase.message }]
              ).map((result) => ({
                status: result.status,
                error: result.message ? { message: result.message } : undefined,
                errors: result.message ? [{ message: result.message }] : [],
              })),
            },
          ],
        })),
      },
    ],
  };
}

function lane(overrides: Record<string, unknown> = {}) {
  return {
    passRate: 100,
    totalTests: 1,
    passed: 1,
    failed: 0,
    lastRun: '2026-05-13T05:38:29.000Z',
    status: 'HEALTHY' as const,
    dataAvailable: true,
    ...overrides,
  };
}

describe('stakeholder dashboard E2E classification', () => {
  it('classifies Cloudflare login blocking as upstream blocked, not action required', () => {
    const report = playwrightReport([
      {
        title: '@critical homepage renders login UI',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: ParaBank blocked the test runner before the login form rendered. classification=UPSTREAM_RATE_LIMITED technicalCause=Cloudflare HTTP 429 / Error 1015 rate limit',
      },
    ]);

    const metrics = buildE2eMetrics(report, true, {}, false);

    expect(metrics.upstreamBlocks).toBe(1);
    expect(metrics.unexpectedFailures).toBe(0);
    expect(metrics.failed).toBe(0);
    expect(metrics.status).toBe('DEGRADED');
  });

  it('keeps real E2E failures actionable when a separate upstream block exists', () => {
    const report = playwrightReport([
      {
        title: '@critical homepage renders login UI',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: classification=UPSTREAM_RATE_LIMITED technicalCause=Cloudflare HTTP 429 / Error 1015 rate limit',
      },
      {
        title: '@critical account overview shows balance',
        status: 'unexpected',
        resultStatus: 'failed',
        message: 'Expected account balance to be visible',
      },
    ]);

    const metrics = buildE2eMetrics(report, true, {}, false);

    expect(metrics.upstreamBlocks).toBe(1);
    expect(metrics.unexpectedFailures).toBe(1);
    expect(metrics.failed).toBe(1);
    expect(metrics.status).toBe('FAILING');
  });

  it('does not mix known defects or skips into upstream blocked counts', () => {
    const report = playwrightReport([
      {
        title: '@known-defect refresh after error returns to guest state',
        status: 'unexpected',
        resultStatus: 'failed',
        tags: ['@known-defect'],
        message: 'Known upstream behaviour reproduced',
      },
      {
        title: '@regression form unavailable on host outage',
        status: 'skipped',
        resultStatus: 'skipped',
        annotations: [{ type: 'skip', description: 'host unreachable from browser' }],
      },
    ]);

    const metrics = buildE2eMetrics(report, true, {}, false);

    expect(metrics.knownDefects).toBe(1);
    expect(metrics.skipped).toBe(1);
    expect(metrics.infrastructureSkips).toBe(1);
    expect(metrics.upstreamBlocks).toBe(0);
    expect(metrics.unexpectedFailures).toBe(0);
  });

  it('groups the latest blocked auth-state fallout with the direct upstream block', () => {
    const report = playwrightReport([
      {
        title: '@critical homepage renders login UI',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: classification=UPSTREAM_RATE_LIMITED technicalCause=Cloudflare HTTP 429 / Error 1015 rate limit',
      },
      {
        title: '@critical login form is reachable and interactive',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: classification=UPSTREAM_RATE_LIMITED technicalCause=Cloudflare HTTP 429 / Error 1015 rate limit',
      },
      {
        title: 'setup health check - credentials verified before state machine tests',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'beforeAll could not verify login - upstream registration or site may be unavailable',
      },
      {
        title: 'invalid credentials transition to error state',
        status: 'unexpected',
        resultStatus: 'failed',
        message: 'expect(received).toBe(expected) Expected: "GUEST" Received: "LOGIN_ERROR"',
      },
      {
        title: 'empty credentials show error',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'expect(received).toBe(expected) Expected value to be GUEST Received value LOGIN_ERROR',
      },
      {
        title: '@known-defect refresh after error returns to guest state',
        status: 'unexpected',
        resultStatus: 'failed',
        tags: ['@known-defect'],
        message: 'Known upstream behaviour reproduced',
      },
    ]);

    const metrics = buildE2eMetrics(report, true, {}, false);

    expect(metrics.upstreamBlocks).toBe(5);
    expect(metrics.unexpectedFailures).toBe(0);
    expect(metrics.knownDefects).toBe(1);
  });

  it('keeps auth guest mismatches actionable when there is no direct upstream block', () => {
    const report = playwrightReport([
      {
        title: 'invalid credentials transition to error state',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'expect(received).toBe(expected) Expected value to be GUEST Received value LOGIN_ERROR',
      },
    ]);

    const metrics = buildE2eMetrics(report, true, {}, false);

    expect(metrics.upstreamBlocks).toBe(0);
    expect(metrics.unexpectedFailures).toBe(1);
    expect(metrics.status).toBe('FAILING');
  });

  it('uses retry errors when the selected Playwright result is a generic timeout', () => {
    const report = playwrightReport([
      {
        title: '@critical homepage renders login UI',
        status: 'unexpected',
        resultStatus: 'timedOut',
        results: [
          {
            status: 'timedOut',
            message: 'Test timeout exceeded while collecting diagnostics after the page was closed',
          },
          {
            status: 'failed',
            message:
              'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: ParaBank blocked the test runner before the login form rendered. classification=UPSTREAM_RATE_LIMITED technicalCause=Cloudflare HTTP 429 / Error 1015 rate limit',
          },
        ],
      },
      {
        title: 'setup health check - credentials verified before state machine tests',
        status: 'unexpected',
        resultStatus: 'failed',
        message:
          'beforeAll could not verify login - upstream registration or site may be unavailable',
      },
    ]);

    const metrics = buildE2eMetrics(report, true, {}, false);

    expect(metrics.upstreamBlocks).toBe(2);
    expect(metrics.unexpectedFailures).toBe(0);
  });

  it('shows a plain-English blocked explanation in the visual dashboard', () => {
    const e2e = buildE2eMetrics(
      playwrightReport([
        {
          title: '@critical homepage renders login UI',
          status: 'unexpected',
          resultStatus: 'failed',
          message:
            'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: classification=UPSTREAM_RATE_LIMITED technicalCause=Cloudflare HTTP 429 / Error 1015 rate limit',
        },
      ]),
      true,
      {},
      false,
    );

    const html = generateHTML({
      generatedAt: '2026-05-13T05:38:29.000Z',
      overallConfidence: 86,
      riskLevel: 'MEDIUM',
      lanes: {
        unit: lane(),
        critical: lane(),
        e2e,
        a11y: {
          ...lane(),
          wcagCompliance: 'AA' as const,
          criticalViolations: 0,
          seriousViolations: 0,
          pagesScanned: 3,
        },
      },
      summary: {
        totalTests: 4,
        totalPassed: 3,
        totalFailed: 0,
        totalBlocked: 1,
      },
      completeness: {
        isPartial: false,
        missingSources: [],
      },
    });

    expect(html).toContain('Blocked by third-party access');
    expect(html).toContain('not a confirmed product defect');
    expect(html).toContain('Cloudflare HTTP 429 / Error 1015 rate limit');
  });
});
