#!/usr/bin/env node
/**
 * A11y Compliance Report Generator
 *
 * Reads a11y-results.json and produces a11y-compliance-report.md.
 * Can be called standalone (no test execution) or imported by other scripts.
 *
 * Usage: npx tsx scripts/generate-a11y-compliance-report.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface A11yViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: number;
}

export interface PageResult {
  page: string;
  url: string;
  violations: A11yViolation[];
  passes: number;
  timestamp: string;
}

export interface A11yResults {
  runDate: string;
  totalPages: number;
  totalViolations: number;
  totalPasses: number;
  pageResults: PageResult[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getImpactEmoji(impact: string): string {
  switch (impact.toLowerCase()) {
    case 'critical':
      return '🔴';
    case 'serious':
      return '🟠';
    case 'moderate':
      return '🟡';
    case 'minor':
      return '🟢';
    default:
      return '⚪';
  }
}

export function getComplianceStatus(violations: A11yViolation[]): {
  status: string;
  emoji: string;
  recommendation: string;
} {
  const critical = violations.filter((v) => v.impact === 'critical').length;
  const serious = violations.filter((v) => v.impact === 'serious').length;

  if (critical > 0) {
    return {
      status: 'NON-COMPLIANT',
      emoji: '🔴',
      recommendation:
        'Immediate remediation required. Critical barriers prevent users with disabilities from accessing content.',
    };
  }

  if (serious > 0) {
    return {
      status: 'PARTIAL COMPLIANCE',
      emoji: '🟠',
      recommendation:
        'Remediation recommended within 30 days. Serious barriers significantly impact user experience.',
    };
  }

  if (violations.length > 0) {
    return {
      status: 'SUBSTANTIAL COMPLIANCE',
      emoji: '🟡',
      recommendation: 'Minor issues detected. Address in regular maintenance cycle.',
    };
  }

  return {
    status: 'FULLY COMPLIANT',
    emoji: '✅',
    recommendation: 'No WCAG violations detected in tested areas. Continue monitoring.',
  };
}

// ─── Report Generator ────────────────────────────────────────────────────────

export function generateComplianceReport(results: A11yResults): string {
  const timestamp = results.runDate || new Date().toISOString();
  const formattedDate = new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Collect all violations
  const allViolations: A11yViolation[] = results.pageResults.flatMap((p) => p.violations);

  // Deduplicate by violation ID
  const uniqueViolations = Array.from(new Map(allViolations.map((v) => [v.id, v])).values());

  const compliance = getComplianceStatus(uniqueViolations);

  // Group violations by category
  const categories = {
    'Form Labels': uniqueViolations.filter((v) =>
      ['label', 'label-title-only', 'form-field-multiple-labels', 'aria-input-field-name'].includes(
        v.id,
      ),
    ),
    'Keyboard Navigation': uniqueViolations.filter((v) =>
      ['tabindex', 'focus-order-semantics', 'scrollable-region-focusable'].includes(v.id),
    ),
    'Focus Indicators': uniqueViolations.filter((v) =>
      ['focus-visible', 'link-in-text-block'].includes(v.id),
    ),
    'Screen Reader Compatibility': uniqueViolations.filter((v) =>
      [
        'aria-allowed-attr',
        'aria-hidden-body',
        'aria-hidden-focus',
        'aria-required-attr',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'document-title',
        'html-has-lang',
        'image-alt',
        'button-name',
        'link-name',
      ].includes(v.id),
    ),
    'Other WCAG Issues': uniqueViolations.filter(
      (v) =>
        ![
          'label',
          'label-title-only',
          'form-field-multiple-labels',
          'aria-input-field-name',
          'tabindex',
          'focus-order-semantics',
          'scrollable-region-focusable',
          'focus-visible',
          'link-in-text-block',
          'aria-allowed-attr',
          'aria-hidden-body',
          'aria-hidden-focus',
          'aria-required-attr',
          'aria-roles',
          'aria-valid-attr',
          'aria-valid-attr-value',
          'document-title',
          'html-has-lang',
          'image-alt',
          'button-name',
          'link-name',
        ].includes(v.id),
    ),
  };

  let md = `# Accessibility Compliance Report

> **Assessment Date:** ${formattedDate}
> **Standard:** WCAG 2.1 Level AA
> **System:** ParaBank Web Application

---

## Executive Summary

| Metric | Result |
|--------|--------|
| **Compliance Status** | ${compliance.emoji} ${compliance.status} |
| **Pages Tested** | ${results.totalPages} |
| **Unique Violations** | ${uniqueViolations.length} |
| **Accessibility Checks Passed** | ${results.totalPasses} |

**Recommendation:** ${compliance.recommendation}

---

## Compliance Overview

`;

  // Add category breakdown
  md += `### Violation Breakdown by Category

| Category | Issues | Impact Level |
|----------|:------:|--------------|
`;

  for (const [category, violations] of Object.entries(categories)) {
    if (violations.length > 0) {
      const highestImpact = violations.reduce((highest, v) => {
        const impacts = ['minor', 'moderate', 'serious', 'critical'];
        return impacts.indexOf(v.impact) > impacts.indexOf(highest) ? v.impact : highest;
      }, 'minor');

      md += `| ${category} | ${violations.length} | ${getImpactEmoji(highestImpact)} ${highestImpact.charAt(0).toUpperCase() + highestImpact.slice(1)} |\n`;
    } else {
      md += `| ${category} | 0 | ✅ None |\n`;
    }
  }

  md += `
---

## Pages Tested

| Page | URL | Violations | Status |
|------|-----|:----------:|--------|
`;

  for (const page of results.pageResults) {
    const status = page.violations.length === 0 ? '✅ Pass' : `⚠️ ${page.violations.length} issues`;
    md += `| ${page.page} | ${page.url} | ${page.violations.length} | ${status} |\n`;
  }

  // Detailed violations section
  if (uniqueViolations.length > 0) {
    md += `
---

## Detailed Findings

`;

    // Group by impact
    const byImpact = {
      critical: uniqueViolations.filter((v) => v.impact === 'critical'),
      serious: uniqueViolations.filter((v) => v.impact === 'serious'),
      moderate: uniqueViolations.filter((v) => v.impact === 'moderate'),
      minor: uniqueViolations.filter((v) => v.impact === 'minor'),
    };

    for (const [impact, violations] of Object.entries(byImpact)) {
      if (violations.length === 0) continue;

      md += `### ${getImpactEmoji(impact)} ${impact.charAt(0).toUpperCase() + impact.slice(1)} Issues

`;

      for (const v of violations) {
        md += `#### ${v.id}

**Description:** ${v.description}

**Affected Elements:** ${v.nodes} instance(s) found

**Remediation:** See [axe-core documentation](${v.helpUrl})

---

`;
      }
    }
  }

  // Legal compliance section
  md += `
## Legal Compliance Reference

### Applicable Standards

| Standard | Requirement | Status |
|----------|-------------|--------|
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines | ${compliance.status} |
| **Section 508** | US Federal accessibility requirements | ${compliance.status} |
| **EN 301 549** | EU accessibility standard | ${compliance.status} |
| **ADA Title III** | Americans with Disabilities Act | ${compliance.status} |

### Impact Assessment

`;

  if (uniqueViolations.length === 0) {
    md += `No accessibility barriers were detected during this assessment. The tested pages meet WCAG 2.1 Level AA success criteria.

`;
  } else {
    const critical = uniqueViolations.filter((v) => v.impact === 'critical').length;
    const serious = uniqueViolations.filter((v) => v.impact === 'serious').length;

    md += `| Impact Level | Count | User Effect |
|--------------|:-----:|-------------|
| Critical | ${critical} | Users cannot complete essential tasks |
| Serious | ${serious} | Significant difficulty completing tasks |
| Moderate | ${uniqueViolations.filter((v) => v.impact === 'moderate').length} | Some difficulty but workarounds exist |
| Minor | ${uniqueViolations.filter((v) => v.impact === 'minor').length} | Minimal impact on user experience |

`;

    if (critical > 0 || serious > 0) {
      md += `**Risk Assessment:** ${critical > 0 ? 'HIGH' : 'MEDIUM'} - Potential legal liability and user exclusion.

`;
    }
  }

  md += `---

## Methodology

This assessment was conducted using automated testing with [axe-core](https://github.com/dequelabs/axe-core), an industry-standard accessibility testing engine. Tests covered:

- **Form Labels:** Proper association between labels and inputs
- **Keyboard Navigation:** Tab order, focus management, no keyboard traps
- **Focus Indicators:** Visible focus states for interactive elements
- **Screen Reader Support:** ARIA attributes, semantic HTML, alt text
- **Error Handling:** Accessible error messages and form validation

**Limitations:** Automated testing detects approximately 30-50% of accessibility issues. Manual testing with assistive technologies is recommended for full compliance verification.

---

## Recommendations

`;

  if (uniqueViolations.length === 0) {
    md += `1. **Maintain Current Standards** - Continue regular accessibility testing
2. **User Testing** - Consider testing with actual assistive technology users
3. **Documentation** - Maintain accessibility statement and feedback mechanism
`;
  } else {
    md += `1. **Immediate:** Address all critical and serious violations within 30 days
2. **Short-term:** Remediate moderate issues within 90 days
3. **Ongoing:** Implement accessibility checks in CI/CD pipeline
4. **Training:** Consider developer accessibility training
`;
  }

  md += `
---

*Report generated by QA-Automation-Suites accessibility testing framework*
*For questions about this report, contact the QA team*
`;

  return md;
}

// ─── Main (standalone execution) ─────────────────────────────────────────────

function main(): void {
  const reportsDir = path.join(process.cwd(), 'reports');
  const jsonPath = path.join(reportsDir, 'a11y-results.json');
  const mdPath = path.join(reportsDir, 'a11y-compliance-report.md');

  if (!fs.existsSync(jsonPath)) {
    console.log(`No a11y results found at ${jsonPath} - skipping report generation.`);
    process.exit(0);
  }

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const results: A11yResults = JSON.parse(raw);

    const report = generateComplianceReport(results);

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(mdPath, report);
    console.log(`A11y compliance report generated: ${mdPath}`);
  } catch (e) {
    console.error('Failed to generate a11y compliance report:', e);
    process.exit(1);
  }
}

main();
