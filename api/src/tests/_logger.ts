import fs from 'node:fs';
import path from 'node:path';

const REPORT_DIR = path.resolve(process.cwd(), '.reports');
const LOG_FILE = path.join(REPORT_DIR, 'api-heartbeat.jsonl');
const SUMMARY_FILE = path.join(REPORT_DIR, 'heartbeat-summary.md');

export function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
}

export function logJsonLine(line: unknown) {
  ensureReportDir();
  fs.appendFileSync(LOG_FILE, JSON.stringify(line) + '\n', 'utf8');
}

export function writeSummary(md: string) {
  ensureReportDir();
  fs.writeFileSync(SUMMARY_FILE, md, 'utf8');
}

export const paths = { REPORT_DIR, LOG_FILE, SUMMARY_FILE };
