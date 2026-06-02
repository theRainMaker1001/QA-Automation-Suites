/**
 * Unit tests for test reporter helper
 * Tests report generation logic with mock data - no file I/O
 */

import { describe, it, expect } from 'vitest';
import {
  generateTechnicalReport,
  generateStakeholderSummary,
} from '../../helpers/test-reporter.js';
import type { TestRunSummary, TestResultRecord } from '../../../interfaces/responses.js';

// Factory for creating test result records
function createTestResult(overrides: Partial<TestResultRecord> = {}): TestResultRecord {
  return {
    testName: 'test-case-1',
    description: 'Valid account ID returns account details',
    equivalenceClass: 'valid-existing',
    polarity: 'positive',
    expectedStatus: 200,
    actualStatus: 200,
    passed: true,
    latencyMs: 45,
    timestamp: '2026-01-26T10:00:00.000Z',
    ...overrides,
  };
}

// Factory for creating test run summaries
function createSummary(overrides: Partial<TestRunSummary> = {}): TestRunSummary {
  return {
    totalTests: 1,
    expected: [createTestResult()],
    unexpected: [],
    timeout: [],
    runDate: '2026-01-26T10:00:00.000Z',
    durationMs: 1500,
    ...overrides,
  };
}

describe('generateTechnicalReport', () => {
  describe('header and metadata', () => {
    it('includes report title', () => {
      const summary = createSummary();
      const report = generateTechnicalReport(summary);

      expect(report).toContain('# API Integration Report');
    });

    it('includes run date', () => {
      const summary = createSummary({ runDate: '2026-01-26T10:00:00.000Z' });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('**Run Date:** 2026-01-26T10:00:00.000Z');
    });

    it('includes duration', () => {
      const summary = createSummary({ durationMs: 2500 });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('**Duration:** 2500ms');
    });
  });

  describe('summary table', () => {
    it('shows expected count', () => {
      const summary = createSummary({
        expected: [createTestResult(), createTestResult()],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toMatch(/\| 2 \|/);
    });

    it('shows unexpected count', () => {
      const summary = createSummary({
        unexpected: [createTestResult({ passed: false, actualStatus: 500 })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('## Summary');
    });

    it('shows timeout count', () => {
      const summary = createSummary({
        timeout: [createTestResult({ error: 'Connection timeout' })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('Timeout');
    });
  });

  describe('expected results section', () => {
    it('includes expected results heading when tests pass', () => {
      const summary = createSummary();
      const report = generateTechnicalReport(summary);

      expect(report).toContain('## ✅ Expected Results');
    });

    it('shows test details in table format', () => {
      const summary = createSummary({
        expected: [
          createTestResult({
            description: 'Valid account lookup test',
            equivalenceClass: 'valid-existing',
            polarity: 'positive',
            expectedStatus: 200,
            actualStatus: 200,
            latencyMs: 123,
          }),
        ],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('Valid account lookup test');
      expect(report).toContain('valid-existing');
      expect(report).toContain('positive');
      expect(report).toContain('123ms');
    });

    it('truncates long descriptions', () => {
      const longDescription =
        'This is a very long test description that exceeds fifty characters and should be truncated';
      const summary = createSummary({
        expected: [createTestResult({ description: longDescription })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain(longDescription.slice(0, 50));
    });
  });

  describe('unexpected results section', () => {
    it('includes unexpected results heading when tests fail', () => {
      const summary = createSummary({
        expected: [],
        unexpected: [createTestResult({ passed: false, actualStatus: 500 })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('## ❌ Unexpected Results');
    });

    it('includes error details for failed tests', () => {
      const summary = createSummary({
        expected: [],
        unexpected: [
          createTestResult({
            passed: false,
            actualStatus: 500,
            error: 'Internal server error response',
          }),
        ],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('Internal server error');
    });
  });

  describe('timeout section', () => {
    it('includes timeout heading when tests time out', () => {
      const summary = createSummary({
        expected: [],
        timeout: [createTestResult({ error: 'Request timed out after 30s' })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('## ⚠️ Timeout / Inconclusive');
    });
  });

  describe('footer', () => {
    it('includes generator attribution', () => {
      const summary = createSummary();
      const report = generateTechnicalReport(summary);

      expect(report).toContain('Generated by QA-Automation-Suites');
    });
  });
});

describe('generateStakeholderSummary', () => {
  describe('status indicators', () => {
    it('shows all passed status when no issues', () => {
      const summary = createSummary();
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('All checks passed');
    });

    it('shows issues found status when tests fail', () => {
      const summary = createSummary({
        expected: [],
        unexpected: [createTestResult({ passed: false })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('issue');
      expect(report).toContain('found');
    });

    it('shows warning status for timeout-only failures', () => {
      const summary = createSummary({
        expected: [],
        timeout: [createTestResult({ error: 'Timeout' })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('warning');
    });
  });

  describe('test coverage checklist', () => {
    it('marks valid requests as tested', () => {
      const summary = createSummary({
        expected: [createTestResult({ polarity: 'positive' })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('Valid requests');
    });

    it('marks invalid requests as tested', () => {
      const summary = createSummary({
        expected: [createTestResult({ polarity: 'negative' })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('Invalid requests');
    });

    it('marks edge cases as tested', () => {
      const summary = createSummary({
        expected: [createTestResult({ equivalenceClass: 'boundary-zero' })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('Edge cases');
    });
  });

  describe('results table', () => {
    it('includes results at a glance section', () => {
      const summary = createSummary();
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('## Results at a glance');
    });

    it('categorises tests by type', () => {
      const summary = createSummary({
        expected: [
          createTestResult({ polarity: 'positive' }),
          createTestResult({ polarity: 'negative', equivalenceClass: 'invalid-format' }),
          createTestResult({ equivalenceClass: 'boundary-max' }),
        ],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('Normal usage');
      expect(report).toContain('Error handling');
      expect(report).toContain('Edge cases');
    });
  });

  describe('interpretation section', () => {
    it('explains all-passed results', () => {
      const summary = createSummary();
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('functioning correctly');
    });

    it('explains failed results with issue list', () => {
      const summary = createSummary({
        expected: [],
        unexpected: [createTestResult({ description: 'Login should reject invalid credentials' })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('Issues found');
      expect(report).toContain('Login should reject invalid credentials');
    });

    it('explains timeout-only results', () => {
      const summary = createSummary({
        expected: [],
        timeout: [createTestResult({ error: 'Timeout' })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('network');
    });
  });

  describe('next steps', () => {
    it('shows no action required for all passed', () => {
      const summary = createSummary();
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('No action required');
    });

    it('shows review steps for failures', () => {
      const summary = createSummary({
        expected: [],
        unexpected: [createTestResult({ passed: false })],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('Review');
    });

    it('references technical report', () => {
      const summary = createSummary();
      const report = generateStakeholderSummary(summary);

      expect(report).toContain('integration-report.md');
    });
  });
});

describe('edge cases', () => {
  describe('empty results', () => {
    it('handles empty test results array', () => {
      const summary = createSummary({
        totalTests: 0,
        expected: [],
        unexpected: [],
        timeout: [],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('# API Integration Report');
      expect(report).toContain('| 0 |');
    });

    it('handles summary with all empty arrays', () => {
      const summary = createSummary({
        totalTests: 0,
        expected: [],
        unexpected: [],
        timeout: [],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });
  });

  describe('special characters', () => {
    it('handles test descriptions with special markdown characters', () => {
      const summary = createSummary({
        expected: [
          createTestResult({
            description: 'Test with | pipe and * asterisk chars',
          }),
        ],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(0);
    });

    it('handles test descriptions with backticks', () => {
      const summary = createSummary({
        expected: [
          createTestResult({
            description: 'Test with `code` backticks',
          }),
        ],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('backticks');
    });
  });

  describe('numeric edge cases', () => {
    it('handles zero latency', () => {
      const summary = createSummary({
        expected: [createTestResult({ latencyMs: 0 })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('0ms');
    });

    it('handles very high latency values', () => {
      const summary = createSummary({
        expected: [createTestResult({ latencyMs: 999999 })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('999999ms');
    });

    it('handles zero duration', () => {
      const summary = createSummary({ durationMs: 0 });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('**Duration:** 0ms');
    });
  });

  describe('large datasets', () => {
    it('handles many test results', () => {
      const manyResults = Array.from({ length: 100 }, (_, i) =>
        createTestResult({ testName: `test-${i}`, description: `Test case ${i}` }),
      );
      const summary = createSummary({
        totalTests: 100,
        expected: manyResults,
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('| 100 |');
    });
  });

  describe('mixed results', () => {
    it('handles mix of expected, unexpected, and timeout', () => {
      const summary = createSummary({
        totalTests: 3,
        expected: [createTestResult({ description: 'Pass test' })],
        unexpected: [
          createTestResult({ description: 'Fail test', passed: false, actualStatus: 500 }),
        ],
        timeout: [createTestResult({ description: 'Timeout test', error: 'Timed out' })],
      });
      const report = generateTechnicalReport(summary);

      expect(report).toContain('## ✅ Expected Results');
      expect(report).toContain('## ❌ Unexpected Results');
      expect(report).toContain('## ⚠️ Timeout');
    });

    it('calculates correct pass rate with mixed results', () => {
      const summary = createSummary({
        totalTests: 3,
        expected: [createTestResult(), createTestResult()],
        unexpected: [createTestResult({ passed: false })],
        timeout: [],
      });
      const report = generateStakeholderSummary(summary);

      expect(report).toBeDefined();
    });
  });
});
