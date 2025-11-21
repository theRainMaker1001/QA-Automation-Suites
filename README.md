````md
# 🎯 QA-Automation-Suites

[![CI](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![Playwright E2E](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/playwright.yml)
[![Bank Critical Smoke](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-smoke.yml/badge.svg?branch=main&cacheBust=1)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/bank-critical-smoke.yml)

Playwright + TypeScript / JavaScript automation suites with linting, formatting, and CI/CD.  
Design goal: **clean, scalable suites** for E2E, API, and BDD that apply modern QA engineering principles alongside **ISTQB-aligned** best practice.

---

## 🚀 Overview

This repo showcases multiple suites built with:

- 🎭 **Playwright** for E2E/UI
- 🌐 **TypeScript/JavaScript** for API & integration
- 🧩 **BDD (Cucumber)**
- 🧹 **ESLint + Prettier + Husky** for code health (local & CI)
- ⚙️ **GitHub Actions** for CI/CD

Each suite follows modular patterns with clear separation of concerns and reproducible CI.

---

## 🧠 ISTQB-aligned testing (practical, lean)

- **Shift-left & test-first**: static checks (TS/ESLint/Prettier) run locally and in CI; fast feedback on every PR.
- **Risk-based focus**: prioritize by _likelihood and impact_; use tags:
  - `@smoke` (fast PR checks)
  - `@critical` (must-pass uptime/entry checks; continuous)
  - `@regression` (broader scheduled runs)
- **Core test techniques** (where they add value): EP, BVA, Decision Tables, State-Transition.
- **Reporting granularity**: developer (traces), team (trends/flake), stakeholder (readiness). See:  
  _Granularity in test reporting_ → <a href="https://www.linkedin.com/feed/update/urn:li:activity:7379430666712555520/">LinkedIn post</a>
- **After a fix**: confirmation → targeted regression to protect nearby risk.

---

## 🧩 Current Project Structure

```bash
QA-Automation-Suites/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                      # typecheck/lint/build + API check(s)
│     ├─ playwright.yml              # Playwright E2E workflow
│     └─ bank-critical-smoke.yml     # (new) lightweight uptime/entry checks
├─ .husky/                           # pre-commit hooks
├─ api/
│  ├─ src/
│  │  └─ tests/
│  │     └─ healthcheck.test.ts
│  ├─ helpers/                       # e.g., fetchClient.ts
│  ├─ data/                          # payloads, mocks
│  ├─ tsconfig.json
│  └─ dist/                          # built JS (CI can run from here)
├─ config/                           # env/config scaffolding (api/bdd/playwright/testdata)
├─ e2e/
│  ├─ tests/
│  │  ├─ index.ts                    # placeholder / demo
│  │  └─ bank/                       # (new) banking mini-project specs
│  │     ├─ smoke.header.spec.ts
│  │     ├─ critical.availability.spec.ts
│  │     └─ critical.login.spec.ts
│  ├─ fixtures/
│  ├─ pages/
│  ├─ utils/
│  └─ playwright.config.ts           # reads BANK_BASE_URL from e2e/.env
├─ .gitattributes
├─ .gitignore
├─ .nvmrc
├─ .prettierrc
├─ eslint.config.js
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ README.md
```
````

> **Note:** Banking tests are intentionally small and tagged to keep PRs fast while providing continuous uptime signals.

---

## 🏦 Banking mini-project (ParaBank) — @critical uptime & entry checks

**Scenario:** We simulate a new client with intermittent **server issues**. We add a tiny `@critical` smoke lane that runs continuously to provide **granular failure signals** (infra vs backend vs UI).

### Why this matters (ISTQB)

- **Risk-based**: highest-impact failures first (availability + basic entry to the app).
- **Monitoring & reporting**: clear signals support triage/decision-making (CTFL “test monitoring & reporting”).
- **Granularity**: different failure labels → faster diagnosis (see granularity post above).

### What the `@critical` lane checks (fast, read-only)

- `NETWORK_DOWN` — DNS/connectivity outage (cannot reach `/`)
- `SERVER_5XX` — server responds with 5xx
- `APP_BROKEN_UI` — page renders but essential login elements missing

### Run locally

Create `e2e/.env`:

```env
BANK_BASE_URL=https://parabank.parasoft.com/parabank
```

Then:

```bash
cd e2e
npx playwright test --project=chromium --grep @critical
```

> **Docker (optional)**: run `parasoft/parabank` on port 8080 and flip
> `BANK_BASE_URL=http://localhost:8080/parabank` — no test code changes needed.

### CI (continuous heartbeat)

A small workflow (scheduled + on push to `main`) runs only the `@critical` suite in Chromium and uploads the HTML report artifact.
Badge at the top of this README reflects the job status.

---

## 🧪 E2E quick start (smoke)

1. Ensure `e2e/.env` has `BANK_BASE_URL=...`
2. Run:

```bash
cd e2e
npx playwright test --grep @smoke
```

Headed / debug:

```bash
npx playwright test --project=chromium --headed --grep @smoke
PWDEBUG=1 npx playwright test --project=chromium --grep @smoke
npx playwright show-report
```

---

## 🧰 Tech Stack

| Category     | Tools & Notes                                  |
| ------------ | ---------------------------------------------- |
| E2E/UI       | Playwright (scaffolded in `e2e/`)              |
| API          | TypeScript + light util (no heavy framework)   |
| BDD          | Cucumber placeholder (`bdd/`)                  |
| Language     | TypeScript (strict)                            |
| Code Quality | ESLint (flat v9), Prettier, Husky (pre-commit) |
| CI/CD        | GitHub Actions (static gates + E2E + API)      |

---

## 🧪 API Healthcheck (matches CI)

```bash
npm run build:api
node api/dist/tests/healthcheck.test.js
# or
npm run test:api
```

### Local smoke debugging (intentional failures)

Use this **local-only** script to intentionally trigger common failure modes and see clear error messages.  
⚠️ **Do not** add to CI — it uses `|| true` so the script doesn’t stop on failures! ⚠️

```bash

# Run failure scenarios sequentially

(
  echo "=== FAIL: Non-200 Status (404) ==="
  HEALTH_URL=https://api.github.com/does-not-exist npm run test:api || true
  echo

  echo "=== FAIL: Wrong JSON Field ==="
  EXPECT_FIELD=definitely_not_here npm run test:api || true
  echo

  echo "=== FAIL: Timeout (abort quickly) ==="
  TIMEOUT_MS=1 npm run test:api || true
  echo

  echo "=== FAIL: Latency Budget (too slow) ==="
  MAX_LATENCY_MS=1 npm run test:api || true
  echo

  echo "=== FAIL: Wrong Content-Type (HTML, not JSON) ==="
  HEALTH_URL=https://example.com npm run test:api || true
  echo

  echo "=== FAIL: Auth Happy Path (invalid token) ==="
  CHECK_AUTH=true AUTH_URL=https://api.github.com/user AUTH_TOKEN=invalid npm run test:api || true
  echo

  echo "=== ALL FAILURE SCENARIOS COMPLETE ==="
)

```

Covers: non-200 status, missing JSON field, timeout, latency budget, wrong content-type, and invalid-auth “happy path”.
💡 To stop on the first failure, remove each || true.

Windows tip: run this in Git Bash or WSL; PowerShell syntax differs.

---

## 🧭 Environments

- **Local/UI**: `e2e/.env` → `BANK_BASE_URL=...`
- **CI/UI**: set `BANK_BASE_URL` in repo **Variables/Secrets**; the E2E job passes it to Playwright.
- Node version: `.nvmrc` (keep local == CI)

---

## 🗺️ Full Roadmap

**General**

- ✅ TypeScript + Playwright base
- ✅ ESLint, Prettier, Husky (pre-commit auto-fix)
- ✅ GitHub Actions CI/CD (static gates + tests)
- ✅ API suite scaffold + healthcheck in CI
- ⬜ BDD suite scaffold (Cucumber)
- ⬜ Enhanced HTML/Allure reporting

**Playwright milestones**

- ✅ Env-specific baseURL via `.env` (public demo or Docker)
- ✅ Tags & lanes: `@smoke` (PR), `@critical` (continuous), `@regression` (scheduled)
- ✅ Artifacts on failure (trace, screenshots, videos in CI)
- ⬜ Page Object Model baseline (`e2e/pages/`, components as needed)
- ⬜ Cross-browser matrix (Chromium/Firefox/WebKit) on nightly
- ⬜ Auth/session fixtures (reuse storage state)
- ⬜ Parallelisation & sharding (CI speed)
- ⬜ Network stubbing/mocking for deterministic interactions
- ⬜ Accessibility checks (axe)
- ⬜ Perf smoke (basic timing budgets)

**Shift-left & Quality gates**

- ✅ Local static checks (TS/ESLint/Prettier) with Husky
- ✅ CI static gates before any tests
- ⬜ PR fast feedback: run `@smoke` subset + changed-area tests

**Regression strategy**

- ⬜ Tag business-critical flows `@regression`
- ⬜ Nightly job: full `@regression` across browsers; publish HTML/Allure
- ⬜ PR job: `@smoke` only + artifacts
- ⬜ Confirmation → targeted regression
- ⬜ Flake controls (CI retries + flaky list)

**Risk-based design**

- ⬜ `docs/risk-catalog.md` mapping features → risk → tags
- ⬜ Align lanes to SDLC moments (`@smoke` PR, `@critical` heartbeat/release, `@regression` nightly)

**Test Technique Library **

- ⬜ EP/BVA examples alongside form/input specs
- ⬜ Decision Tables for rules/permissions
- ⬜ State-Transition for auth/session/flows

---

## 🔒 Configuration & Environment Consistency

We apply ISTQB principles for configuration management and stable environments: same Node version via `.nvmrc`, same static gates locally and in CI, and environment-driven URLs for UI tests. Consistency → reproducibility → reliable results.

---

## 💬 Contact

- LinkedIn: [https://www.linkedin.com/in/tom-cunningham-5a1869297/](https://www.linkedin.com/in/tom-cunningham-5a1869297/)
- GitHub: [https://github.com/theRainMaker1001](https://github.com/theRainMaker1001)

⭐ If this repo helps you, please star it.

```

```
