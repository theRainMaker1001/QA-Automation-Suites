/**
 * Post-test script to generate developer-friendly unit test summary.
 * Runs after Vitest completes.
 */

import { generateUnitReport } from './unit-test-reporter.js';

generateUnitReport();
