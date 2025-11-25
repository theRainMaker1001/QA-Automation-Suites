/* eslint-env node */

import fsSync from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

/** ESM-friendly __dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Find the repo root (prefer Git, fall back to walking up) */
function findRepoRoot(startDir: string): string {
  // 1) Git toplevel if available
  try {
    const top = execSync('git rev-parse --show-toplevel', {
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: startDir,
    })
      .toString()
      .trim();
    if (top && fsSync.existsSync(path.join(top, 'package.json'))) return top;
  } catch {
    // not a git repo or git not on PATH – fall through to walk-up
    void 0;
  }

  // 2) Walk up to find package.json
  let dir = startDir;
  while (true) {
    if (fsSync.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 3) Fallback
  return process.cwd();
}

const rootDir = findRepoRoot(__dirname);
const pkgPath = path.join(rootDir, 'package.json');
const reportsDir = path.join(rootDir, 'reports');
const outputPath = path.join(reportsDir, 'tool-version-and-config-summary.md');

async function safeReadJson<T = unknown>(p: string): Promise<T | null> {
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

async function getPkg(): Promise<Record<string, unknown>> {
  const pkg = await safeReadJson<Record<string, unknown>>(pkgPath);
  if (!pkg) {
    console.log('⚠️  No package.json was found. This did not look like a Node project.');
    process.exit(0);
  }
  return pkg;
}

function getDepVersion(pkg: Record<string, any>, name: string): string | null {
  const allDeps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  };
  return allDeps[name] ?? null;
}

function getInstalledVersion(name: string): string | null {
  try {
    const json = execSync(`npm ls ${name} --json`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: rootDir,
    }).toString();
    const parsed = JSON.parse(json);
    const dep = parsed.dependencies?.[name];
    if (dep?.version) return dep.version as string;
  } catch {
    // not installed or no lockfile yet
    void 0;
  }
  return null;
}

function describeScript(name: string, command: string): string {
  const lower = name.toLowerCase();

  if (lower.includes('typecheck') || lower.includes('tsc')) {
    return 'Checked that all TypeScript code compiled without type errors.';
  }
  if (lower.includes('lint')) {
    return 'Scanned the codebase with ESLint for mistakes, risky patterns, and style issues.';
  }
  if (lower.includes('format') || lower.includes('prettier')) {
    return 'Used Prettier to keep code layout consistent (spacing, quotes, line breaks).';
  }
  if (lower.includes('test') && lower.includes('api')) {
    return 'Ran the API test suite.';
  }
  if (lower.includes('test') && lower.includes('e2e')) {
    return 'Ran end-to-end (E2E) tests.';
  }
  if (lower === 'test') {
    return 'Ran the main automated test suite.';
  }
  if (lower.includes('build')) {
    return 'Built/compiled the project for running or shipping.';
  }

  return `Was available to run: \`${command}\``;
}

/** SECTION BUILDERS */

function sectionNode(): string {
  let md = '## Node & Runtime\n\n';
  md += `- Local Node version: \`${process.version}\`.\n`;

  const nvmrcPath = path.join(rootDir, '.nvmrc');
  if (fsSync.existsSync(nvmrcPath)) {
    const pinned = fsSync.readFileSync(nvmrcPath, 'utf8').trim();
    if (pinned) {
      md += `- Requested Node (from \`.nvmrc\`): \`${pinned}\`.\n`;
      md += "  - Keeps local env aligned with CI/teammates, reducing 'works on my machine'.\n";
    }
  } else {
    md += '- No `.nvmrc` found.\n';
    md += '  - Different machines may use different Node versions, which can cause mismatches.\n';
  }

  md += '\n';
  return md;
}

function sectionScripts(pkg: Record<string, any>): string {
  let md = '## Project Scripts That Were Available\n\n';

  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  const entries = Object.entries(scripts);
  const interesting = entries.filter(([name]) =>
    /lint|format|prettier|test|typecheck|tsc|build/i.test(name),
  );

  if (interesting.length === 0) {
    md += '_No lint, format, typecheck, test, or build scripts were found in `package.json`._\n\n';
    return md;
  }

  md += 'These scripts were defined in `package.json` when this report was generated.\n\n';

  for (const [name, cmd] of interesting) {
    md += `### \`${name}\`\n\n`;
    md += `- Command: \`${cmd}\`.\n`;
    md += `- In plain language: ${describeScript(name, cmd)}\n\n`;
  }

  return md;
}

function sectionLinting(pkg: Record<string, any>): string {
  let md = '## ESLint (Code Quality & Static Checks)\n\n';

  const declared = getDepVersion(pkg, 'eslint');
  const installed = getInstalledVersion('eslint');

  if (!declared && !installed) {
    md += '- ESLint was **not** listed as a dependency.\n\n';
    return md;
  }

  md += `- ESLint version: \`${installed ?? declared ?? 'unknown'}\`.\n`;

  const eslintConfigPath = path.join(rootDir, 'eslint.config.js');
  if (fsSync.existsSync(eslintConfigPath)) {
    md += '- Flat config detected: `eslint.config.js`.\n';
  } else {
    md += '- No `eslint.config.js` found at repo root.\n';
  }

  md += '\n';
  return md;
}

function sectionPrettier(pkg: Record<string, any>): string {
  let md = '## Prettier (Automatic Code Formatting)\n\n';

  const declared = getDepVersion(pkg, 'prettier');
  const installed = getInstalledVersion('prettier');

  if (!declared && !installed) {
    md += '- Prettier was **not** listed as a dependency.\n\n';
    return md;
  }

  md += `- Prettier version: \`${installed ?? declared ?? 'unknown'}\`.\n`;

  const prettierrcPath = path.join(rootDir, '.prettierrc');
  md += fsSync.existsSync(prettierrcPath)
    ? '- `.prettierrc` detected.\n\n'
    : '- No `.prettierrc` at repo root.\n\n';

  return md;
}

function sectionHusky(pkg: Record<string, any>): string {
  let md = '## Husky (Git Hooks & Automation)\n\n';

  const declared = getDepVersion(pkg, 'husky');
  const installed = getInstalledVersion('husky');

  if (!declared && !installed) {
    md += '- Husky was **not** listed as a dependency.\n\n';
    return md;
  }

  md += `- Husky version: \`${installed ?? declared ?? 'unknown'}\`.\n\n`;

  const huskyDir = path.join(rootDir, '.husky');
  if (!fsSync.existsSync(huskyDir)) {
    md += '- `.husky` directory not found (no active hooks detected).\n\n';
    return md;
  }

  const hookFiles = fsSync
    .readdirSync(huskyDir)
    .filter((f) => !f.startsWith('_') && !f.endsWith('.md'));

  if (hookFiles.length === 0) {
    md += '- No hook files found in `.husky`.\n\n';
    return md;
  }

  md += '### Husky Hooks Configured\n\n';
  for (const file of hookFiles) {
    const fullPath = path.join(huskyDir, file);
    let content = '';
    try {
      content = fsSync.readFileSync(fullPath, 'utf8');
    } catch {
      // ignore unreadable hook file
      void 0;
    }
    const commands = content
      .split('\n')
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith('#') &&
          !l.startsWith('. "$(dirname "$0")/_/husky') &&
          !l.startsWith('#!'),
      );

    md += `#### Hook: \`${file}\`\n\n`;
    if (commands.length) {
      md += '- Runs:\n';
      for (const cmd of commands) md += `  - \`${cmd}\`\n`;
      md += '\n';
    } else {
      md += '- No additional commands (likely boilerplate only).\n\n';
    }
  }

  return md;
}

function sectionTypeScript(pkg: Record<string, any>): string {
  let md = '## TypeScript (Types & Safety)\n\n';

  const declared = getDepVersion(pkg, 'typescript');
  const installed = getInstalledVersion('typescript');

  if (!declared && !installed) {
    md += '- TypeScript was **not** listed as a dependency.\n\n';
    return md;
  }

  md += `- TypeScript version: \`${installed ?? declared ?? 'unknown'}\`.\n\n`;

  const candidates = [
    ['Root', path.join(rootDir, 'tsconfig.json')],
    ['API layer', path.join(rootDir, 'api', 'tsconfig.json')],
    ['E2E layer', path.join(rootDir, 'e2e', 'tsconfig.json')],
  ].filter(([, p]) => fsSync.existsSync(p));

  if (!candidates.length) {
    md += '- No `tsconfig.json` files were found in usual locations.\n\n';
    return md;
  }

  for (const [label, p] of candidates) {
    const text = fsSync.readFileSync(p, 'utf8');
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      void 0;
    }
    const compilerOptions = parsed?.compilerOptions ?? {};

    md += `### ${label} TypeScript Configuration (\`${path.relative(rootDir, p)}\`)\n\n`;

    if (typeof compilerOptions.strict === 'boolean') {
      md += `- \`strict\`: \`${compilerOptions.strict}\`.\n`;
    }
    if (compilerOptions.target) md += `- \`target\`: \`${compilerOptions.target}\`.\n`;
    if (compilerOptions.module) md += `- \`module\`: \`${compilerOptions.module}\`.\n`;
    if (compilerOptions.rootDir) md += `- \`rootDir\`: \`${compilerOptions.rootDir}\`.\n`;
    if (compilerOptions.outDir) md += `- \`outDir\`: \`${compilerOptions.outDir}\`.\n`;
    md += '\n';
  }

  return md;
}

/** MAIN */
async function main() {
  const pkg = await getPkg();

  await fs.mkdir(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString();

  let md = '';
  md += '# QA-Automation-Suites – Tool version & config snapshot\n\n';
  md += `_Generated locally at \`${timestamp}\`. This file is not committed unless you add it.\n\n`;

  md += sectionNode();
  md += sectionTypeScript(pkg);
  md += sectionScripts(pkg);
  md += sectionLinting(pkg);
  md += sectionPrettier(pkg);
  md += sectionHusky(pkg);

  await fs.writeFile(outputPath, md, 'utf8');

  console.log(`✅ Tooling summary written to: ${path.relative(rootDir, outputPath)}`);
}

main().catch((err) => {
  console.error('❌ Failed to generate tooling summary:', err);
  process.exit(1);
});
