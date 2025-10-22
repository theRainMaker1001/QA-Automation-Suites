🎯 QA-Automation-Suites
[![CI (typecheck + eslint)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)

Playwright and JavaScript-based automation suites with linting, formatting, and CI/CD integration.
This project demonstrates scalable automation architecture designed for end-to-end (E2E), API, and BDD testing using modern QA engineering standards (and solid ISTQB fundamentals).

🚀 Overview

QA-Automation-Suites is a professional testing portfolio showcasing multiple test suites built with:

🎭 Playwright for E2E and UI testing

🌐 JavaScript / TypeScript for API and integration tests

🧩 Cucumber (BDD) ready for behavior-driven testing

⚙️ ESLint, Prettier, and Husky for code quality and pre-commit enforcement

🧱 GitHub Actions for continuous integration and delivery (CI/CD)

Each suite follows modular, maintainable patterns with separate configurations and resources for clarity and scalability.

🧠 ISTQB-Aligned Strategy (best-practice, demonstrated here)

This repo demonstrates ISTQB best-practice testing in a practical, engineer-friendly way:

⬅️ Shift-left & test-first: review requirements and test ideas early, run static checks in CI, and give fast feedback on every PR to cut rework.

⚖️ Risk-based focus: prioritise by likelihood × impact. Use tags to target effort: @smoke (fast checks on PRs), @critical (must-pass before release), @regression (broader scheduled runs).

🎯 Core test-design techniques (used where they add value):
Equivalence Partitioning (EP), Boundary Value Analysis (BVA), Decision Tables, State Transitions, plus pairwise/combinatorial selection when options explode.

📊 Reporting granularity: present the right info for the right audience — developer (per-test + traces), team (trends/flake), stakeholder (release readiness). See this post for context:
<a href="https://www.linkedin.com/feed/update/urn:li:activity:7379430666712555520/">Granularity in test reporting (LinkedIn)</a>

🔁 After a fix: run confirmation tests first, then a targeted regression subset to protect nearby risk areas.

🔒 Static testing & code health: TypeScript types, ESLint rules, Prettier formatting, and Husky pre-commit hooks locally; the same gates enforced in CI.

See the Roadmap below for exactly where each of these show up (folders, tags, and workflows).

🧩 Project Structure
qa-automation-suites/
├─ e2e/ # Playwright UI/E2E tests
├─ api/ # Plain JavaScript API tests
├─ bdd/ # Cucumber BDD tests (future integration)
├─ config/ # Centralized config and environment files
├─ resources/ # Test data, fixtures, and private assets (gitignored)
└─ .github/ # CI/CD workflows

🧰 Tech Stack
Category Tools & Frameworks
E2E/UI Testing 🎭 Playwright
API Testing 🌐 JavaScript (Fetch/Axios)
BDD 🧩 Cucumber (planned)
Language 🦸‍♂️ TypeScript
Code Quality 🧹 ESLint + Prettier + Husky
CI/CD ⚙️ GitHub Actions
🧪 Quick Start

# install dependencies

npm install

# run lint checks

npm run lint

# run prettier

npm run fmt

# run all tests (Playwright)

npx playwright test

🧱 Linting & Formatting

ESLint (flat config, v9) for code quality and best practices

Prettier for consistent formatting

Husky + lint-staged to auto-run fixes on commit

Run manually:

npx eslint . --ext .ts --format stylish
npx prettier --check .
npm run fmt

🏗️ Roadmap
General

<ul> <li>✅ <b>TypeScript and Playwright base setup</b></li> <li>✅ ESLint, Prettier, Husky configuration (pre-commit auto-fix)</li> <li>✅ GitHub Actions CI/CD (lint + tests on push/PR)</li> <li>⬜ API test suite scaffolding (JavaScript, no extra libs)</li> <li>⬜ BDD test suite scaffolding (Cucumber)</li> <li>⬜ Enhanced HTML/Allure reporting</li> </ul>
Playwright Testing Milestones
<ul> <li>⬜ Establish <b>Page Object Model (POM)</b> baseline (pages/, components/)</li> <li>⬜ Configure <b>env-specific</b> base URLs and timeouts (config/environments)</li> <li>⬜ Define <b>tags & suites</b>: <code>@smoke</code> (PR), <code>@regression</code> (scheduled), <code>@critical</code> (must-pass)</li> <li>⬜ Set up <b>cross-browser matrix</b>: Chromium, Firefox, WebKit</li> <li>⬜ Enable <b>artifacts</b>: traces, screenshots, videos on failure</li> <li>⬜ Add <b>auth/session fixtures</b> (logged-in state reuse)</li> <li>⬜ Implement <b>parallelisation & sharding</b> for faster builds</li> <li>⬜ Add <b>retries & flake detection</b> (CI-only)</li> <li>⬜ Introduce <b>network stubbing/mocking</b> for deterministic API interactions</li> <li>⬜ Integrate <b>accessibility checks</b> (axe or similar)</li> <li>⬜ Add <b>performance tracing & timing metrics</b></li> <li>⬜ Use <b>Playwright Test UI</b> for local triage</li> <li>⬜ Publish <b>HTML/Allure reports</b> as CI artifacts</li> </ul>
⬅️ Shift-Left & Quality Gates (where it lives in this repo)
<ul> <li>✅ <b>Static checks locally</b>: TypeScript types, ESLint rules, Prettier formatting via Husky pre-commit</li> <li>⬜ <b>Static checks in CI</b>: <code>tsc --noEmit</code>, <code>eslint</code>, <code>prettier --check</code> before any tests run</li> <li>⬜ <b>PR fast feedback</b>: run <code>@smoke</code> subset + changed-area tests on every pull request</li> </ul>
🧪 Regression Strategy (exactly where it’s demonstrated here)
<ul> <li>⬜ <b>Tagging</b>: mark business-critical flows with <code>@regression</code> inside <code>e2e/tests/</code> and <code>api/tests/</code></li> <li>⬜ <b>Nightly job</b>: add <code>.github/workflows/regression.yml</code> to run full <code>@regression</code> across browsers and upload HTML/Allure reports</li> <li>⬜ <b>PR job</b>: keep <code>ci.yml</code> lean — run <code>@smoke</code> + artifacts (trace/video) for quick triage</li> <li>⬜ <b>Confirmation → targeted regression</b>: script a <code>test:confirm</code> task to rerun the failing spec(s) and nearby tagged tests after a fix</li> <li>⬜ <b>Flake controls</b>: enable CI-only retries and record flaky test list in report summary</li> </ul>
⚖️ Risk-Based Suite Design (Agile fit)
<ul> <li>⬜ Create <code>docs/risk-catalog.md</code> mapping features to risk (likelihood × impact) and to tags (<code>@smoke</code>, <code>@critical</code>, <code>@regression</code>)</li> <li>⬜ Align suites to SDLC moments: <b>@smoke</b> per PR, <b>@critical</b> on release candidates, <b>@regression</b> nightly or pre-release</li> <li>⬜ Keep suites small, focused, and maintainable so Agile iterations stay fast</li> </ul>
🧮 Test-Design Techniques (used where appropriate & effective)
<ul> <li>⬜ Add design notes/examples for <b>Equivalence Partitioning</b> and <b>Boundary Value Analysis</b> alongside form/input tests</li> <li>⬜ Use <b>Decision Tables</b> for permission/flag rules; attach the table snapshot in test docs</li> <li>⬜ Model critical flows with <b>State Transitions</b> (happy/invalid transitions) for login, checkout, session timeouts</li> <li>⬜ Apply <b>pairwise/combinatorial selection</b> when options explode to keep suites lean but high-coverage</li> </ul>
📊 Reporting Granularity (audience-aware)
<ul> <li>⬜ <b>Developer view</b>: per-test pass/fail + traces/videos in CI artifacts</li> <li>⬜ <b>Team view</b>: trend of failures/flake rate + slowest specs; short summary in PR comment</li> <li>⬜ <b>Stakeholder view</b>: release readiness summary (risks covered, critical paths green)</li> </ul> <p><i>Reference on thinking in levels of detail:</i> <a href="https://www.linkedin.com/feed/update/urn:li:activity:7379430666712555520/">Granularity in test reporting (LinkedIn)</a></p>
🔒 Static Testing & Code Health (demonstrated here)
<ul> <li>✅ <b>TypeScript</b> for early type errors and API/contract clarity</li> <li>✅ <b>ESLint</b> (flat config) to enforce consistent, safe patterns</li> <li>✅ <b>Prettier</b> for formatting; all run pre-commit via Husky</li> <li>⬜ Mirror the same gates in CI before running any Playwright or API tests</li> </ul>
🔐 Environments & Resources

config/ holds environment JSON and shared settings

resources/ is gitignored for local data, screenshots, and private assets

💬 Contact

📫 LinkedIn: https://www.linkedin.com/in/tom-cunningham-5a1869297/

💻 GitHub: https://github.com/theRainMaker1001

⭐ If you find this repo useful or inspiring, consider giving it a star!
