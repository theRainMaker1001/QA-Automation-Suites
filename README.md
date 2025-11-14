🎯 QA-Automation-Suites
[![CI (typecheck + eslint + Prettier + API)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)

Playwright and TypeScript / JavaScript-based automation suites with linting, formatting, and CI/CD integration.
This project demonstrates scalable automation architecture designed for end-to-end (E2E), API, and BDD testing using modern QA engineering standards (including solid ISTQB fundamentals).

🚀 Overview

QA-Automation-Suites is a testing portfolio showcasing multiple test suites built with:

🎭 Playwright for E2E and UI testing

🌐 JavaScript / TypeScript for API and integration tests

🧩 Cucumber (BDD) placeholder, ready for behavior-driven testing

⚙️ ESLint, Prettier, and Husky hooks for code quality and pre-commit enforcement

🧱 GitHub Actions for continuous integration and delivery (CI/CD)

Each suite follows modular, maintainable patterns with separate configurations and resources for clarity and scalability.

🧠 ISTQB-Aligned Strategy (best-practice, demonstrated here)

This repo demonstrates ISTQB best-practice testing in a practical and engineer-friendly way, including but not limited to:

⬅️ Shift-left & test-first: review requirements and test ideas early, run static checks in CI, and give fast feedback on every PR to cut rework.

⚖️ Risk-based focus: prioritise by likelihood × impact. Use tags to target effort: @smoke (fast checks on PRs), @critical (must-pass before release), @regression (broader scheduled runs).

🎯 Core test-design techniques (used only where they add value):
Equivalence Partitioning (EP), Boundary Value Analysis (BVA), Decision Tables, State Transitions, plus pairwise/combinatorial selection when options explode.

📊 Reporting granularity: presenting the right info for the right audience — developer (per-test + traces), team (trends/flake), stakeholder (release readiness). See this post for context on granularity as a paradigm:
<a href="https://www.linkedin.com/feed/update/urn:li:activity:7379430666712555520/">Granularity in test reporting (LinkedIn)</a>

🔁 After a fix: run confirmation tests first, then a targeted regression subset to protect nearby risk areas.

🔒 Static testing & code health: TypeScript types, ESLint rules, Prettier formatting, and Husky pre-commit hooks locally; the same gates enforced in CI.

See the Roadmap below for specifics (folders, tags, and workflows).

## 🧩 Project Structure

```bash
qa-automation-suites/
├─ README.md                      # High-level repo overview (what this project is)
├─ package.json                   # Workspace-level scripts (lint, build, etc)
├─ package-lock.json              # Locked dependency graph for CI reproducibility
├─ tsconfig.json                  # Root TS config (shared compiler rules)
├─ eslint.config.js               # ESLint + Prettier config for consistent style
├─ resources/                     # Supporting assets / docs (not executable code)
│  ├─ ISTQB_CTFL_Syllabus_v4.0.1.pdf
│
│
├─ .github/
│  └─ workflows/
│     └─ ci.yml                   # GitHub Actions pipeline (lint, typecheck, build, test)
│
├─ config/                        # Centralised config for each testing layer
│  ├─ api/                        # API test config (e.g. base URLs, tokens, headers)
│  ├─ bdd/                        # BDD/Cucumber config scaffolding
│  ├─ environments/               # Env profiles (dev/stage/prod-style separation)
│  ├─ playwright/                 # Playwright/browser/runtime config
│  └─ testdata/                   # Shared test data definitions / fixtures
│
├─ api/                           # API testing layer (TypeScript-first, tool-agnostic)
│  ├─ README.md                   # What the API test suite does and how to run it
│  ├─ tsconfig.json               # TS config for this package (src -> dist)
│  ├─ data/                       # Static payloads, request bodies, mock responses
│  ├─ helpers/                    # Reusable utilities for API tests
│  │  └─ fetchClient.ts           # Wrapper around fetch (adds base URL, headers, etc)
│  ├─ src/                        # Source .ts files
│  │  └─ tests/
│  │     └─ healthcheck.test.ts   # Example health check test
│  └─ dist/                       # (Generated) Compiled JS output after build:api
│                                 # CI runs tests from here using plain node
│
├─ e2e/                           # Playwright UI / end-to-end layer
│  ├─ fixtures/                   # Test fixtures / test context setup
│  │  └─ README.md
│  ├─ pages/                      # Page objects / app model abstraction
│  │  └─ README.md
│  ├─ tests/                      # Actual UI/E2E tests
│  │  ├─ README.md
│  │  └─ index.ts                 # (placeholder entry point / demo)
│  └─ utils/                      # Shared helpers for E2E tests
│     └─ README.md
│
├─ bdd/                           # Placeholder for BDD/Cucumber-style specs


## 🧰 Tech Stack

Category            | Tools & Notes
--                  | --
E2E/UI Testing      | 🎭 Playwright (scaffolded in `e2e/`)
API Testing         | 🌐 TypeScript + node-fetch (simple no-framework API check)
BDD                 | 🧩 Cucumber / BDD layer planned (`bdd/` placeholder ready)
Language            | 🦸‍♂️ TypeScript everywhere (strict, typed, modular)
Code Quality        | 🧹 ESLint (flat config v9) + Prettier + Husky + lint-staged + enforced on commit and in CI
CI/CD               | ⚙️ GitHub Actions (typecheck, lint, Prettier check, build, API healthcheck test)


```

⚡ Quick Start – Local Setup
1️⃣ Node.js & npm (required)

This project uses the Node.js version defined in .nvmrc (currently 20.11.0). Everyone should use that version so local runs match CI.

# Show the Node version this project expects (from .nvmrc)

cat .nvmrc

# Check your current Node version

node -v

# (Optional, if you use nvm / nvm-windows) install the required Node version

nvm install 20.11.0

# (Optional, if you use nvm / nvm-windows) switch this shell to that version

nvm use 20.11.0

# Confirm Node is now on the expected version

node -v

_If you don’t use nvm, just install Node.js 20.11.0 from the official Node.js website or your OS package manager, then re-run node -v to confirm._

2️⃣ Install dependencies (required, lockfile-based)

From the repo root, use npm ci so you get the exact same dependency tree as CI (from package-lock.json):

# Install exact dependency versions from package-lock.json (matches CI)

npm ci

3️⃣ Husky pre-commit hooks (run once per clone)

Husky is already configured to run ESLint + Prettier on staged files and block CRLF line endings on every commit.

On a fresh clone, run this once from the repo root:

# Install Husky git hooks for this repository

npm run prepare

After that, every git commit will automatically run the pre-commit checks; commits will fail if linting/formatting/line-endings don’t pass.

4️⃣ Static checks (run locally before pushing)

These are the core static gates you should run locally and that CI also enforces:

# Run TypeScript type checks (no files emitted)

npm run typecheck

# Run ESLint over the codebase

npm run lint

# Auto-format the codebase with Prettier (writes changes)

npm run fmt

5️⃣ API healthcheck suite (mirrors current CI)

CI builds the API test bundle and runs the compiled healthcheck from api/dist. To do the same locally:

# Build API tests: compile TypeScript (api/src) to JavaScript (api/dist)

npm run build:api

# Run the compiled API healthcheck test (this is what CI runs)

node api/dist/tests/healthcheck.test.js

Or, if you want to run the healthcheck directly in TypeScript (no build step):

# Run the API healthcheck test directly in TypeScript

npm run test:api

✨ Nice-to-have: stay perfectly in sync with CI

On any new machine or after big changes:

# See the required Node version for this repo

cat .nvmrc

# (Optional, with nvm) install & select that Node version

nvm install 20.11.0
nvm use 20.11.0

# Reinstall exact deps after dependency updates (uses package-lock.json)

npm ci

🏗️ Roadmap
General

<ul> <li>✅ TypeScript and Playwright base setup</li> <li>✅ ESLint, Prettier, Husky configuration (pre-commit auto-fix)</li> <li>✅ GitHub Actions CI/CD (lint + tests on push/PR)</li> <li>✅ API test suite scaffolding (JavaScript, no extra libs)</li> <li>⬜ BDD test suite scaffolding (Cucumber)</li> <li>⬜ Enhanced HTML/Allure reporting</li> </ul>
Playwright Testing Milestones
<ul> <li>⬜ Establish <b>Page Object Model (POM)</b> baseline (pages/, components/)</li> <li>⬜ Configure <b>env-specific</b> base URLs and timeouts (config/environments)</li> <li>⬜ Define <b>tags & suites</b>: <code>@smoke</code> (PR), <code>@regression</code> (scheduled), <code>@critical</code> (must-pass)</li> <li>⬜ Set up <b>cross-browser matrix</b>: Chromium, Firefox, WebKit</li> <li>⬜ Enable <b>artifacts</b>: traces, screenshots, videos on failure</li> <li>⬜ Add <b>auth/session fixtures</b> (logged-in state reuse)</li> <li>⬜ Implement <b>parallelisation & sharding</b> for faster builds</li> <li>⬜ Add <b>retries & flake detection</b> (CI-only)</li> <li>⬜ Introduce <b>network stubbing/mocking</b> for deterministic API interactions</li> <li>⬜ Integrate <b>accessibility checks</b> (axe or similar)</li> <li>⬜ Add <b>performance tracing & timing metrics</b></li> <li>⬜ Use <b>Playwright Test UI</b> for local triage</li> <li>⬜ Publish <b>HTML/Allure reports</b> as CI artifacts</li> </ul>
⬅️ Shift-Left & Quality Gates (where it lives in this repo)
<ul> <li>✅ <b>Static checks locally</b>: TypeScript types, ESLint rules, Prettier formatting via Husky pre-commit</li> <li>✅ <b>Static checks in CI</b>: <code>tsc --noEmit</code>, <code>eslint</code>, <code>prettier --check</code> before any tests run</li> <li>⬜ <b>PR fast feedback</b>: run <code>@smoke</code> subset + changed-area tests on every pull request</li> </ul>
🧪 Regression Strategy (exactly where it’s demonstrated here)
<ul> <li>⬜ <b>Tagging</b>: mark business-critical flows with <code>@regression</code> inside <code>e2e/tests/</code> and <code>api/tests/</code></li> <li>⬜ <b>Nightly job</b>: add <code>.github/workflows/regression.yml</code> to run full <code>@regression</code> across browsers and upload HTML/Allure reports</li> <li>⬜ <b>PR job</b>: keep <code>ci.yml</code> lean — run <code>@smoke</code> + artifacts (trace/video) for quick triage</li> <li>⬜ <b>Confirmation → targeted regression</b>: script a <code>test:confirm</code> task to rerun the failing spec(s) and nearby tagged tests after a fix</li> <li>⬜ <b>Flake controls</b>: enable CI-only retries and record flaky test list in report summary</li> </ul>
⚖️ Risk-Based Suite Design (Agile fit)
<ul> <li>⬜ Create <code>docs/risk-catalog.md</code> mapping features to risk (likelihood × impact) and to tags (<code>@smoke</code>, <code>@critical</code>, <code>@regression</code>)</li> <li>⬜ Align suites to SDLC moments: <b>@smoke</b> per PR, <b>@critical</b> on release candidates, <b>@regression</b> nightly or pre-release</li> <li>⬜ Keep suites small, focused, and maintainable so Agile iterations stay fast</li> </ul>
🧮 Test-Design Techniques (used where appropriate & effective)
<ul> <li>⬜ Add design notes/examples for <b>Equivalence Partitioning</b> and <b>Boundary Value Analysis</b> alongside form/input tests</li> <li>⬜ Use <b>Decision Tables</b> for permission/flag rules; attach the table snapshot in test docs</li> <li>⬜ Model critical flows with <b>State Transitions</b> (happy/invalid transitions) for login, checkout, session timeouts</li> <li>⬜ Apply <b>pairwise/combinatorial selection</b> when options explode to keep suites lean but high-coverage</li> </ul>
📊 Reporting Granularity (audience-aware)
<ul> <li>⬜ <b>Developer view</b>: per-test pass/fail + traces/videos in CI artifacts</li> <li>⬜ <b>Team view</b>: trend of failures/flake rate + slowest specs; short summary in PR comment</li> <li>⬜ <b>Stakeholder view</b>: release readiness summary (risks covered, critical paths green)</li> </ul> <p><i>Reference on thinking in levels of detail:</i> <a href="https://www.linkedin.com/feed/update/urn:li:activity:7379430666712555520/">Granularity in test reporting (LinkedIn)</a></p>
🔒 Static Testing & Code Health (demonstrated here)
<ul> <li>✅ <b>TypeScript</b> for early type errors and API/contract clarity</li> <li>✅ <b>ESLint</b> (flat config) to enforce consistent, safe patterns</li> <li>✅ <b>Prettier</b> for formatting; all run pre-commit via Husky</li> <li>✅ Mirror the same gates in CI before running any Playwright or API tests</li> </ul>

🔐 Environments & Resources

config/ holds environment JSON and shared settings

resources/ is gitignored for local data, screenshots, and private assets

🧩 Configuration Management

In line with ISTQB 4.0 principles on Configuration Management and Test Environment Consistency, this project has been updated to ensure version alignment across all stages of delivery.

💡 Node.js versioning is now controlled via NVM, guaranteeing that local and CI environments run identical runtime configurations: eliminating environment drift and supporting reproducible test outcomes.

⚙️ CI pipelines are synchronised to the same Node version declared locally, maintaining traceability and configuration integrity throughout the test process.

“Consistent environments are essential for reliable test results and controlled change management.” — ISTQB Foundation v4.0, Section 6.2.1

💬 Contact

📫 LinkedIn: https://www.linkedin.com/in/tom-cunningham-5a1869297/

💻 GitHub: https://github.com/theRainMaker1001

⭐ If you find this repo useful or inspiring, consider giving it a star!
