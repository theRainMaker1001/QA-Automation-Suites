# 🎯 QA-Automation-Suites

Playwright and JavaScript-based automation suites with linting, formatting, and CI/CD integration.  
This project demonstrates scalable automation architecture designed for **end-to-end (E2E)**, **API**, and **BDD** testing using modern QA engineering standards.

---

## 🚀 Overview

**QA-Automation-Suites** is a professional testing portfolio showcasing multiple test suites built with:
- 🎭 **Playwright** for E2E and UI testing  
- 🌐 **JavaScript / TypeScript** for API and integration tests  
- 🧩 **Cucumber (BDD)** ready for behavior-driven testing  
- ⚙️ **ESLint**, **Prettier**, and **Husky** for code quality and pre-commit enforcement  
- 🧱 **GitHub Actions** for continuous integration and delivery (CI/CD)

Each suite follows modular, maintainable patterns with separate configurations and resources for clarity and scalability.

---

## 🧠 ISTQB-Aligned Practices

As a recent **ISTQB Foundation Level** graduate, I apply a pragmatic, “shift-left” approach across these suites:

- ⬅️ **Shift-Left & Test-First**: design tests early, perform static reviews, and run automated checks in CI to shorten feedback loops and reduce rework.  
- ⚖️ **Risk-Based Strategy**: rank features by Likelihood × Impact (H/M/L). Map risks to tagged suites: `@smoke` for high-impact paths per PR, broader `@regression` nightly/release.  
- 🎯 **Black-Box Techniques** applied in E2E/API:  
  - **Equivalence Partitioning (EP)**: group inputs into valid/invalid classes to avoid redundant tests (e.g. valid [0–100], invalid <0 or >100).  
  - **Boundary Value Analysis (BVA)**: exercise edges to catch off-by-one errors (e.g. [1–10] ⇒ {0,1,2,9,10,11}).  
  - **Decision Tables**: cover rule combinations efficiently (e.g. role × featureFlag).  
  - **State Transitions**: validate legal flows (e.g. Login → MFA → Session → Timeout).  
- 🔢 **Combinatorial Reduction**: apply **pairwise testing** or orthogonal arrays to shrink large input sets while preserving interaction coverage.  
- 🧭 **Traceability & Exit**: link stories → test tags → results; use confirmation and targeted regression post-fix.  
- 🧪 **Experience-Based Heuristics**: off-by-one, empty/null, invalid type, locale/timezone boundaries.  
- 📊 **Metrics**: monitor pass rate, flake rate, coverage vs risk, and feedback time.

---

## 🧩 Project Structure

```
qa-automation-suites/
├─ e2e/         # Playwright UI/E2E tests
├─ api/         # Plain JavaScript API tests
├─ bdd/         # Cucumber BDD tests (future integration)
├─ config/      # Centralized config and environment files
├─ resources/   # Test data, fixtures, and private assets (gitignored)
└─ .github/     # CI/CD workflows
```

---

## 🧰 Tech Stack

| Category       | Tools & Frameworks                 |
| ------------- | ----------------------------------- |
| E2E/UI Testing | 🎭 Playwright                      |
| API Testing    | 🌐 JavaScript (Fetch/Axios)        |
| BDD            | 🧩 Cucumber (planned)              |
| Language       | 🦸‍♂️ TypeScript                    |
| Code Quality   | 🧹 ESLint + Prettier + Husky       |
| CI/CD          | ⚙️ GitHub Actions                  |

---

## 🧪 Quick Start

```bash
# install dependencies
npm install

# run lint checks
npm run lint

# run prettier
npm run fmt

# run all tests (Playwright)
npx playwright test
```

---

## 🧱 Linting & Formatting

- ESLint (flat config, v9) for code quality and best practices  
- Prettier for consistent formatting  
- Husky + lint-staged to auto-run fixes on commit

Run manually:

```bash
npx eslint . --ext .ts --format stylish
npx prettier --check .
npm run fmt
```

---

## 🏗️ Roadmap

### General

<ul>
  <li>✅ <b>TypeScript and Playwright base setup</b></li>
  <li>✅ ESLint, Prettier, Husky configuration</li>
  <li>⬜ GitHub Actions CI/CD (lint + tests on push/PR)</li>
  <li>⬜ API test suite (JavaScript, no extra libs)</li>
  <li>⬜ BDD test suite with Cucumber</li>
  <li>⬜ Enhanced HTML/Allure reporting</li>
</ul>

### Playwright Testing Milestones

<ul>
  <li>⬜ Establish <b>Page Object Model (POM)</b> baseline (pages/, components/)</li>
  <li>⬜ Configure <b>env-specific</b> base URLs and timeouts (config/environments)</li>
  <li>⬜ Define <b>tags & suites</b>: <code>@smoke</code>, <code>@regression</code>, <code>@critical</code></li>
  <li>⬜ Set up <b>cross-browser matrix</b>: Chromium, Firefox, WebKit</li>
  <li>⬜ Enable <b>artifacts</b>: traces, screenshots, videos on failure</li>
  <li>⬜ Add <b>auth/session fixtures</b> (logged-in state reuse)</li>
  <li>⬜ Implement <b>parallelisation & sharding</b> for faster builds</li>
  <li>⬜ Add <b>retries & flake detection</b> (CI-friendly)</li>
  <li>⬜ Introduce <b>network stubbing/mocking</b> for deterministic API tests</li>
  <li>⬜ Integrate <b>accessibility checks</b> (axe or similar)</li>
  <li>⬜ Add <b>performance tracing & timing metrics</b></li>
  <li>⬜ Use <b>Playwright Test UI</b> for local triage</li>
  <li>⬜ Publish <b>HTML/Allure reports</b> as CI artifacts</li>
</ul>

---

## 🔐 Environments & Resources

- `config/` holds environment JSON and shared settings  
- `resources/` is **gitignored** for local data, screenshots, and private assets

---

## 💬 Contact

- 📫 **LinkedIn:** https://www.linkedin.com/in/tom-cunningham-5a1869297/ 
- 💻 **GitHub:** https://github.com/theRainMaker1001

---

⭐ If you find this repo useful or inspiring, consider giving it a star!
