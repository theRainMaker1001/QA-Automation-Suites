#!/usr/bin/env node
/**
 * Allure History Preservation Script
 *
 * Copies history from previous report generation to maintain trends.
 * Run BEFORE generating new Allure report to preserve test history.
 *
 * Usage: tsx scripts/preserve-allure-history.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ALLURE_REPORT = path.join(process.cwd(), 'allure-report');
const ALLURE_RESULTS = path.join(process.cwd(), 'allure-results');
const HISTORY_DIR = path.join(ALLURE_REPORT, 'history');
const RESULTS_HISTORY = path.join(ALLURE_RESULTS, 'history');

function preserveHistory(): void {
  console.log('Allure History Preservation');
  console.log('===========================');

  // Check if previous report exists with history
  if (!fs.existsSync(HISTORY_DIR)) {
    console.log('No previous history found at:', HISTORY_DIR);
    console.log('This is likely the first run - skipping history preservation.');
    return;
  }

  // Ensure allure-results directory exists
  if (!fs.existsSync(ALLURE_RESULTS)) {
    fs.mkdirSync(ALLURE_RESULTS, { recursive: true });
    console.log('Created allure-results directory');
  }

  // Remove old history in results if exists
  if (fs.existsSync(RESULTS_HISTORY)) {
    fs.rmSync(RESULTS_HISTORY, { recursive: true });
    console.log('Removed old history from results');
  }

  // Copy history from report to results
  fs.cpSync(HISTORY_DIR, RESULTS_HISTORY, { recursive: true });
  console.log(`History preserved: ${HISTORY_DIR} -> ${RESULTS_HISTORY}`);

  // Count history files
  const historyFiles = fs.readdirSync(RESULTS_HISTORY);
  console.log(`Preserved ${historyFiles.length} history files`);
}

// Run
preserveHistory();
