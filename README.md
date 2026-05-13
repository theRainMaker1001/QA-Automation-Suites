# FinTech Quality Engineering

**High-Confidence Automation and Risk-Based Testing for a Banking System**

[![CI Status](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![ISTQB Certified Engineer](https://img.shields.io/badge/ISTQB_Certified_Engineer-92.5%25-success?style=for-the-badge)](https://atsqa.org/certified-testers/profile/f1ce81a04b174d65bfbac2f82a80af39)
[![Tech Stack (Click for detailed approach)](https://img.shields.io/badge/Tech_Stack-Playwright_%7C_Vitest_%7C_TypeScript-blueviolet?style=for-the-badge)](./docs/TECHNICAL-DESIGN.md)
[![Engineer Available](https://img.shields.io/badge/Engineer_Available-Now-orange?style=for-the-badge)](https://www.linkedin.com/in/tom-cunningham-orionai/)

## Live Quality Dashboards

### 👉 [**View the Live Project Dashboard**](https://therainmaker1001.github.io/QA-Automation-Suites/) 👈
Real-time visibility into the current health of the system.

| Dashboard | Audience | Shows | Link |
|-----------|----------|-------|------|
| **Stakeholder Dashboard** | **PMs & Leadership** | Confidence score, risk level, known defects, upstream blocks, WCAG compliance | [View Executive Summary](https://therainmaker1001.github.io/QA-Automation-Suites/stakeholder/) |
| **Developer Dashboard** | **QA Staff & Developers** | Full test details, real failure trends, screenshots, traces | [View Technical Allure Report](https://therainmaker1001.github.io/QA-Automation-Suites/allure/) |

Dashboard totals policy:
*   Stakeholder summary totals include all four lanes, including WCAG/a11y.
*   Developer Allure is intentionally more comprehensive and can include overlapping lane executions for diagnostic redundancy.

---

## Architecture & Engineering Design

Full engineering decisions and test design artefacts are documented on the pages linked below.

🧱 [**Technical Design & Architecture**](./docs/TECHNICAL-DESIGN.md)
🧰 [**Loan Approval Decision Tables / 3-Value BVA**](./docs/test-design/loan-approval-decision-table.md)

---

## What This Suite Delivers

This is not a collection of test scripts. It is a **Risk Intelligence Platform** built for the high-stakes FinTech sector.

In an industry where a single calculation error or security gap can cost millions, "the code works" is not enough. This framework delivers active mitigation against failure by combining rigorous financial logic validation with automated compliance audits and software tests.

**Core guarantees:**

*   **Zero money leaks:** 34+ combinatorial scenarios ensure loan logic is mathematically sound.
*   **Legal compliance:** Automated WCAG 2.1 AA audits protect against accessibility violations.
*   **40% lower CI costs:** Smart risk lanes run only the necessary tests at any given time, reducing cloud compute spend.

---

## 1. The Business Safety Net

Technical product owners need reliability. This suite ensures the financial logic is sound before code reaches production.

### Combinatorial Logic Coverage

*   **Risk:** Edge-case money leaks where invalid loans might be approved due to boundary errors (e.g., a £0.00 down payment).
*   **Solution:** Using Decision Table Testing and 3-Value BVA, this suite validates **34 unique loan approval scenarios**, proven not estimated.

### State Transition Coverage

*   **Risk:** Users bypassing security screens or accessing protected data whilst in a `Guest` or `LoginError` state.
*   **Solution:** Authentication flows are validated using **ISTQB State Transition Testing**, systematically verifying all 11 valid state transitions across 3 observable states (Guest, LoggedIn, LoginError).

### Legal & Compliance Guardrails

*   **Risk:** Compliance violations and potential legal liability.
*   **Solution:** Automated **accessibility (a11y)** tests run nightly against WCAG 2.1 AA standards, acting as a continuous compliance guardrail.

---

## 2. ROI & Efficiency

A well-structured framework is a long-term asset. It prevents flakiness and drift whilst providing developers with precise failure diagnostics.

### 🚦 Risk-Based Tagging: The Lanes

Rather than running every test on every change, intelligent tagging focuses execution:

*   `@smoke`: Fast connectivity checks (Push & PR).
*   `@critical`: Core money logic (PRs & Dispatch).
*   `@regression`: Cross-browser user journeys (Nightly).
*   `@a11y`: WCAG compliance checks (Nightly).
*   `@known-defect`: Tracked upstream defects that remain visible in Allure and are separated in stakeholder metrics.
*   Report-only `upstream-blocked`: Third-party access or availability blocked a check before the product journey could be observed; shown separately from product failures.
*   Local developer gate defaults to Chromium for determinism; full browser matrix runs nightly or via `npm run test:e2e:matrix`.

**Impact:** Reduces CI/CD cloud costs by up to 40% by running expensive tests only when necessary.

### Shift-Left Quality Gates

Using **Husky** and **Prettier**, quality is enforced at the developer's desk.

**Impact:** Prevents malformed code from reaching build servers, reducing time lost to failed builds and debugging cycles.

### Storage State Reuse

Login sessions are captured once and reused across tests (`storageState`).

**Impact:** Shortens the feedback loop, allowing engineers to deploy fixes faster.

### Critical Login-Surface Diagnostics

The critical E2E lane keeps ParaBank login-surface outages visible without mixing
them into confirmed product defects. When the server responds but the login form
is absent, the failure is classified as `UPSTREAM_LOGIN_SURFACE_UNAVAILABLE`; if
Cloudflare rate limits the runner, the dashboard shows this as
`Blocked by third-party access` with the technical cause
`Cloudflare HTTP 429 / Error 1015 rate limit`.

**Impact:** Separates third-party UI/auth availability from API latency, local
selector drift, and genuine product regressions.

### Containerised Nightly Audit

The nightly regression and a11y lanes run inside the [official Playwright Docker image](https://playwright.dev/docs/docker), both locally and in CI, using `mcr.microsoft.com/playwright`. Chromium, Firefox, and WebKit are baked into the image — no browser download occurs at run time. Docker layer caching in CI means the image is only rebuilt when the `Dockerfile` or `package-lock.json` changes.

*   `npm run docker:build` — build once, then cache.
*   `npm run docker:run` — run the full nightly sequence with outputs on the host.
*   `npm run docker:audit` — verify the image and write a local health summary.

**Impact:** Reduces browser version drift between developer machines and the build server. When the Dockerfile image tag is kept in sync with the installed `@playwright/test` version, the nightly environment is consistent between local and CI runs. Run `npm run docker:audit` to verify parity before pushing.

---

## 3. Long-Term Thinking

*   **⏱️ Performance SLA assertions:** Tests automatically fail if API responses exceed 5000ms, ensuring customer experience never degrades silently.
*   **📸 Evidence on failure:** Every failure captures video, screenshots, and traces. Developers spend no time reproducing bugs; they watch the replay or follow the trace.
*   **📝 API contract safety:** **Zod Schema Validation** catches backend changes instantly, preventing silent API breaks from reaching the frontend.

---

## 4. ISTQB Optimised Design

### The Testing Pyramid (Stability First)
We avoid the 'Ice Cream Cone' anti-pattern. This suite is built on a stable foundation of fast, reliable, tests aligning with ISTQB best practice.

```text
                  / \
                 /   \
                /  E2E  \             👉 Playwright (48 Tests)
               /---------\               User Journeys & A11y
              /           \
             / Integration \          👉 Vitest + Fetch (84 Tests)
            /---------------\            API & Business Rules
           /                 \
          /       Unit        \       👉 Vitest (199 Tests)
         /---------------------\         Isolated Maths & Logic
```
*(Counts as of 2026-04-10. E2E excludes the 2 `@negative` artifact-demo tests that only run in the demo lane.)*

---

## Contract & Consulting

**Tom Cunningham** | Quality Engineering Consultant | [tom@orionqa.co.uk](mailto:tom@orionqa.co.uk)

[![Available Now](https://img.shields.io/badge/Available-Now-brightgreen?style=for-the-badge)](mailto:tom@orionqa.co.uk)

Specialising in risk-based automation frameworks for FinTech and regulated industries.

*   **Contract:** Outside IR35 preferred though open to all engagements.
*   **Permanent:** Open to roles with ownership of quality strategy.

Good QA pays for itself.

**Consultancy Website** [**orionqa.co.uk**](https://orionqa.co.uk/)

**LinkedIn** [**Connect on LinkedIn**](https://www.linkedin.com/in/tom-cunningham-orionai/)

---
