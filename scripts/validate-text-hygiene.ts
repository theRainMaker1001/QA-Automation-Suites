import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

interface TextCheck {
  label: string;
  matches: (line: string) => boolean;
}

const useCachedFiles = process.argv.includes('--cached');
const files = execFileSync(
  'git',
  useCachedFiles
    ? ['ls-files', '--cached', '-z']
    : ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {
    encoding: 'utf8',
  },
)
  .split('\0')
  .filter(Boolean);

const checks: TextCheck[] = [
  {
    label: 'U+2014 em dash',
    matches: (line) => line.includes('\u2014'),
  },
  {
    label: 'tool-labelled ownership or delivery wording',
    matches: (line) =>
      /\b(?:AI|ChatGPT|Claude|Codex|OpenAI|Copilot)(?:['\u2019]s)?\s+(?:delivery|implementation|output|authorship|ownership)\b/i.test(
        line,
      ),
  },
  {
    label: 'AI owner label',
    matches: (line) => /\bowner\s*:\s*(?:AI|ChatGPT|Claude|Codex|OpenAI|Copilot)\b/i.test(line),
  },
  {
    label: 'AI-generated attribution',
    matches: (line) =>
      /\bgenerated\s+by\s+(?:AI|ChatGPT|Claude|Codex|OpenAI|Copilot)\b/i.test(line),
  },
  {
    label: 'AI co-author trailer',
    matches: (line) =>
      /\bco-authored-by\s*:\s*(?:AI|ChatGPT|Claude|Codex|OpenAI|Copilot)\b/i.test(line),
  },
];

const violations: string[] = [];

for (const file of files) {
  if (!useCachedFiles && !existsSync(file)) {
    continue;
  }

  const contents = useCachedFiles
    ? execFileSync('git', ['show', `:${file}`], { maxBuffer: 10 * 1024 * 1024 })
    : readFileSync(file);

  if (contents.includes(0)) {
    continue;
  }

  const lines = contents.toString('utf8').split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    for (const check of checks) {
      if (check.matches(line)) {
        violations.push(`${file}:${index + 1}: ${check.label}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Text hygiene validation failed:');
  console.error(violations.map((violation) => `- ${violation}`).join('\n'));
  process.exitCode = 1;
} else {
  const source = useCachedFiles ? 'staged' : 'tracked and unignored';
  console.log(`Text hygiene validation passed for ${files.length} ${source} files.`);
}
