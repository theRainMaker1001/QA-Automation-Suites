#!/usr/bin/env node
/**
 * Test Tag Validation Script
 *
 * Ensures all E2E tests are tagged for risk-based test lanes.
 * Tests without tags will bypass CI quality gates.
 *
 * Valid tags: @smoke, @critical, @regression, @a11y, @negative, @state-transition
 *
 * Usage: tsx scripts/validate-test-tags.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const E2E_TESTS_DIR = path.join(process.cwd(), 'e2e', 'tests');
const VALID_TAGS = [
  '@smoke',
  '@critical',
  '@regression',
  '@a11y',
  '@negative',
  '@state-transition',
];
const TAG_PATTERN = new RegExp(`(${VALID_TAGS.map((t) => t.replace('@', '@')).join('|')})`, 'g');

interface ValidationResult {
  file: string;
  untaggedDescribes: string[];
}

function findSpecFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function validateFile(filePath: string): ValidationResult | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Find top-level test.describe blocks only (not nested ones)
  // Top-level describes start at column 0 or have only whitespace before them at line start
  const lines = content.split('\n');
  const untaggedDescribes: string[] = [];

  for (const line of lines) {
    // Match test.describe at the start of a line (allowing for no indentation)
    const topLevelMatch = line.match(/^test\.describe\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (topLevelMatch) {
      const describeName = topLevelMatch[1];
      // Check if the describe name contains a valid tag
      if (!TAG_PATTERN.test(describeName)) {
        untaggedDescribes.push(describeName);
      }
      // Reset the tag pattern lastIndex
      TAG_PATTERN.lastIndex = 0;
    }
  }

  if (untaggedDescribes.length > 0) {
    return { file: relativePath, untaggedDescribes };
  }

  return null;
}

function main(): void {
  console.log('E2E Test Tag Validation');
  console.log('=======================\n');
  console.log(`Valid tags: ${VALID_TAGS.join(', ')}\n`);

  if (!fs.existsSync(E2E_TESTS_DIR)) {
    console.error(`Error: E2E tests directory not found at ${E2E_TESTS_DIR}`);
    process.exit(1);
  }

  const specFiles = findSpecFiles(E2E_TESTS_DIR);
  console.log(`Found ${specFiles.length} spec files\n`);

  const violations: ValidationResult[] = [];

  for (const file of specFiles) {
    const result = validateFile(file);
    if (result) {
      violations.push(result);
    }
  }

  if (violations.length === 0) {
    console.log('✓ All test.describe blocks have valid tags');
    process.exit(0);
  }

  console.error('✗ Found untagged test.describe blocks:\n');

  for (const violation of violations) {
    console.error(`  ${violation.file}:`);
    for (const describe of violation.untaggedDescribes) {
      console.error(`    - "${describe}"`);
    }
    console.error('');
  }

  console.error(`\nFix: Add a tag to each describe block name, e.g.:`);
  console.error(`  test.describe('@regression My Test Suite', () => { ... })\n`);

  process.exit(1);
}

main();
