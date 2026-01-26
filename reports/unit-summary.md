# Unit Test Report

> **Generated**: 2026-01-26T06:11:53.988Z
> **Status**: ✅ ALL TESTS PASSED

---

## Overview

| Metric | Value |
|--------|------:|
| Total Tests | 50 |
| ✅ Passed | 50 |
| ❌ Failed | 0 |
| ⏭️ Skipped | 0 |
| Pass Rate | 100.0% |
| Total Duration | 189.21ms |

---

## Suite Breakdown

| Suite | Tests | Passed | Failed | Status |
|-------|------:|-------:|-------:|:------:|
| http > HttpClient > URL building | 4 | 4 | 0 | ✅ |
| http > HttpClient > headers | 3 | 3 | 0 | ✅ |
| http > HttpClient > response handling | 2 | 2 | 0 | ✅ |
| http > HttpClient > error handling | 4 | 4 | 0 | ✅ |
| http > HttpClient > method handling | 3 | 3 | 0 | ✅ |
| retry > withRetry > successful calls | 2 | 2 | 0 | ✅ |
| retry > withRetry > exhausted retries | 2 | 2 | 0 | ✅ |
| retry > withRetry > default config | 2 | 2 | 0 | ✅ |
| retry > sleep | 1 | 1 | 0 | ✅ |
| test-reporter > generateTechnicalReport > header and metadata | 3 | 3 | 0 | ✅ |
| test-reporter > generateTechnicalReport > summary table | 3 | 3 | 0 | ✅ |
| test-reporter > generateTechnicalReport > expected results section | 3 | 3 | 0 | ✅ |
| test-reporter > generateTechnicalReport > unexpected results section | 2 | 2 | 0 | ✅ |
| test-reporter > generateTechnicalReport > timeout section | 1 | 1 | 0 | ✅ |
| test-reporter > generateTechnicalReport > footer | 1 | 1 | 0 | ✅ |
| test-reporter > generateStakeholderSummary > status indicators | 3 | 3 | 0 | ✅ |
| test-reporter > generateStakeholderSummary > test coverage checklist | 3 | 3 | 0 | ✅ |
| test-reporter > generateStakeholderSummary > results table | 2 | 2 | 0 | ✅ |
| test-reporter > generateStakeholderSummary > interpretation section | 3 | 3 | 0 | ✅ |
| test-reporter > generateStakeholderSummary > next steps | 3 | 3 | 0 | ✅ |

---

## All Test Results

### http > HttpClient > URL building

| Test | Status | Duration |
|------|:------:|---------:|
| joins base URL and path correctly | ✅ | 27.03ms |
| handles leading slashes in path | ✅ | 0.93ms |
| appends query parameters correctly | ✅ | 0.88ms |
| omits null and undefined query parameters | ✅ | 0.67ms |

### http > HttpClient > headers

| Test | Status | Duration |
|------|:------:|---------:|
| merges default headers with request headers | ✅ | 0.97ms |
| request headers override default headers | ✅ | 0.34ms |
| adds content-type header when body is present | ✅ | 0.26ms |

### http > HttpClient > response handling

| Test | Status | Duration |
|------|:------:|---------:|
| returns ok:true with data on successful JSON response | ✅ | 0.46ms |
| returns text for non-JSON content types | ✅ | 0.28ms |

### http > HttpClient > error handling

| Test | Status | Duration |
|------|:------:|---------:|
| returns STATUS error for non-2xx responses | ✅ | 0.40ms |
| returns INVALID_JSON error when JSON parsing fails | ✅ | 0.31ms |
| returns NETWORK error on fetch failure | ✅ | 0.27ms |
| returns TIMEOUT error on abort | ✅ | 0.18ms |

### http > HttpClient > method handling

| Test | Status | Duration |
|------|:------:|---------:|
| defaults to GET method | ✅ | 0.17ms |
| uses specified method | ✅ | 0.14ms |
| serializes body as JSON | ✅ | 0.16ms |

### retry > withRetry > successful calls

| Test | Status | Duration |
|------|:------:|---------:|
| returns result on first attempt | ✅ | 1.85ms |
| returns result after retry | ✅ | 20.55ms |

### retry > withRetry > exhausted retries

| Test | Status | Duration |
|------|:------:|---------:|
| throws after all attempts exhausted | ✅ | 30.70ms |
| includes the last error | ✅ | 14.82ms |

### retry > withRetry > default config

| Test | Status | Duration |
|------|:------:|---------:|
| uses default maxAttempts of 2 | ✅ | 0.23ms |
| uses default delayMs of 500 | ✅ | 0.14ms |

### retry > sleep

| Test | Status | Duration |
|------|:------:|---------:|
| resolves after specified delay | ✅ | 62.42ms |

### test-reporter > generateTechnicalReport > header and metadata

| Test | Status | Duration |
|------|:------:|---------:|
| includes report title | ✅ | 1.33ms |
| includes run date | ✅ | 0.17ms |
| includes duration | ✅ | 0.14ms |

### test-reporter > generateTechnicalReport > summary table

| Test | Status | Duration |
|------|:------:|---------:|
| shows expected count | ✅ | 0.24ms |
| shows unexpected count | ✅ | 0.17ms |
| shows timeout count | ✅ | 0.12ms |

### test-reporter > generateTechnicalReport > expected results section

| Test | Status | Duration |
|------|:------:|---------:|
| includes expected results heading when tests pass | ✅ | 0.12ms |
| shows test details in table format | ✅ | 0.23ms |
| truncates long descriptions | ✅ | 0.13ms |

### test-reporter > generateTechnicalReport > unexpected results section

| Test | Status | Duration |
|------|:------:|---------:|
| includes unexpected results heading when tests fail | ✅ | 0.18ms |
| includes error details for failed tests | ✅ | 0.11ms |

### test-reporter > generateTechnicalReport > timeout section

| Test | Status | Duration |
|------|:------:|---------:|
| includes timeout heading when tests time out | ✅ | 0.10ms |

### test-reporter > generateTechnicalReport > footer

| Test | Status | Duration |
|------|:------:|---------:|
| includes generator attribution | ✅ | 0.07ms |

### test-reporter > generateStakeholderSummary > status indicators

| Test | Status | Duration |
|------|:------:|---------:|
| shows all passed status when no issues | ✅ | 18.94ms |
| shows issues found status when tests fail | ✅ | 0.31ms |
| shows warning status for timeout-only failures | ✅ | 0.23ms |

### test-reporter > generateStakeholderSummary > test coverage checklist

| Test | Status | Duration |
|------|:------:|---------:|
| marks valid requests as tested | ✅ | 0.22ms |
| marks invalid requests as tested | ✅ | 0.26ms |
| marks edge cases as tested | ✅ | 0.24ms |

### test-reporter > generateStakeholderSummary > results table

| Test | Status | Duration |
|------|:------:|---------:|
| includes results at a glance section | ✅ | 0.25ms |
| categorises tests by type | ✅ | 0.29ms |

### test-reporter > generateStakeholderSummary > interpretation section

| Test | Status | Duration |
|------|:------:|---------:|
| explains all-passed results | ✅ | 0.21ms |
| explains failed results with issue list | ✅ | 0.22ms |
| explains timeout-only results | ✅ | 0.19ms |

### test-reporter > generateStakeholderSummary > next steps

| Test | Status | Duration |
|------|:------:|---------:|
| shows no action required for all passed | ✅ | 0.18ms |
| shows review steps for failures | ✅ | 0.20ms |
| references technical report | ✅ | 0.19ms |

---

*Generated by QA-Automation-Suites unit test runner*
