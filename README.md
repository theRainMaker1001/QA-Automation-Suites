🎯 QA-Automation-Suites

Playwright and JavaScript-based automation suites with linting, formatting, and CI/CD integration.
This project demonstrates scalable automation architecture designed for end-to-end (E2E), API, and BDD testing using modern QA engineering standards.

🚀 Overview

QA-Automation-Suites is a professional testing portfolio showcasing multiple test suites built with:

🎭 Playwright for E2E and UI testing

🌐 JavaScript / TypeScript for API and integration tests

🧩 Cucumber (BDD) ready for behavior-driven testing

⚙️ ESLint, Prettier, and Husky for code quality and pre-commit enforcement

🧱 GitHub Actions for continuous integration and delivery (CI/CD)

Each suite follows modular, maintainable patterns with separate configurations and resources for clarity and scalability.

🧠 ISTQB-Aligned Practices

As a recent ISTQB Foundation Level graduate, I apply a pragmatic, “shift-left” approach across these suites:

⬅️ Shift-Left & Test-First: design tests early, perform static reviews, and run automated checks in CI to shorten feedback loops and reduce rework.

⚖️ Risk-Based Strategy: rank features by Likelihood × Impact (H/M/L). Map risks to tagged suites: @smoke for high-impact paths per PR, broader @regression nightly/release.

🎯 Black-Box Techniques applied in E2E/API:

Equivalence Partitioning (EP): group inputs into valid/invalid classes to avoid redundant tests. Example range 0–100 ⇒ valid [0..100], invalid (−∞..−1), (101..∞).

Boundary Value Analysis (BVA): exercise edges to catch off-by-one. For [1..10] test {0,1,2,9,10,11}. For length 1..255 test lengths {0,1,2,254,255,256}. Dates: 2024-02-28/29/03-01.

Decision Tables: cover rule combinations efficiently. With two booleans (e.g., isAdmin, featureFlag) there are 4 combos; scale to N rules using minimized tables (and constraints) rather than 2^N brute force.

State Transitions: verify allowed/blocked moves and timeouts (e.g., Login → MFA → Session → Timeout). Aim for 0-switch and 1-switch coverage to catch invalid jumps.

🔢 Combinatorial/Pairs: use pairwise/orthogonal arrays to reduce explosion. Example: 5 params × 4 values each ⇒ 4^5 = 1024 combos; pairwise typically ~20–30 tests with strong interaction coverage.

🧭 Traceability & Exit: map user stories/acceptance criteria → tagged tests; define entry/exit for suites; use confirmation after a fix, then targeted regression for nearby risk areas.

🧪 Experience-Based Heuristics: error guessing for common failures (off-by-one, null/empty, forbidden chars, locale/timezone quirks).

📊 Metrics: track pass rate, flake rate (<1% target), time-to-fix, and coverage vs. risks (feature/risk coverage > line coverage for E2E).

🧩 Project Structure
qa-automation-suites/
├─ e2e/         # Playwright UI/E2E tests
├─ api/         # Plain JavaScript API tests
├─ bdd/         # Cucumber BDD tests (future integration)
├─ config/      # Centralized config and environment files
├─ resources/   # Test data, fixtures, and private assets (gitignored)
└─ .github/     # CI/CD workflows

🧰 Tech Stack
Category	Tools & Frameworks
E2E/UI Testing	🎭 Playwright
API Testing	🌐 JavaScript (Fetch/Axios)
BDD	🧩 Cucumber (planned)
Language	🦸‍♂️ TypeScript
Code Quality	🧹 ESLint + Prettier + Husky
CI/CD	⚙️ GitHub Actions
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

General:

 TypeScript and Playwright base setup

 ESLint, Prettier, Husky configuration

 GitHub Actions CI/CD (lint + tests on push/PR)

 API test suite (JavaScript, no extra libs)

 BDD test suite with Cucumber

 Enhanced HTML/Allure reporting

Playwright testing milestones:

 Establish Page Object Model (POM) baseline (pages/, components/)

 Configure env-specific base URLs and timeouts (config/environments)

 Define tags & suites: @smoke, @regression, @critical

 Set up cross-browser matrix: Chromium, Firefox, WebKit

 Enable artifacts: traces, screenshots, videos on failure

 Add auth/session fixtures (logged-in state reuse)

 Parallelisation & sharding for faster builds

 Retries & flake detection (CI-friendly)

 Network stubbing for deterministic tests (mock APIs)

 Accessibility checks (optional: axe integration)

 Performance hints (timings, tracing for hotspots)

 Playwright Test UI usage docs for local triage

 Reporting: HTML report upload via CI artifacts

🔐 Environments & Resources

config/ holds environment JSON and shared settings

resources/ is gitignored for local data, screenshots, and private assets

💬 Contact

📫 LinkedIn: https://www.linkedin.com/in/tom-cunningham-5a1869297/

💻 GitHub: https://github.com/theRainMaker1001

⭐ If you find this repo useful or inspiring, consider giving it a star!