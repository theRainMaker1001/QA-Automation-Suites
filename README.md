# 🏦 FinTech Quality Engineering - Reduce Quality Costs and Risks
### *High-Confidence Automation & Risk-Based Testing for a banking system*

[![CI Status](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml/badge.svg)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions/workflows/ci.yml)
[![ISTQB Certified Engineer](https://img.shields.io/badge/ISTQB_Certified_Engineer-92.5%25-success?style=for-the-badge)](https://atsqa.org/certified-testers/profile/f1ce81a04b174d65bfbac2f82a80af39)
[![Tech Stack (Click for detailed approach)](https://img.shields.io/badge/Tech_Stack-Playwright_%7C_Vitest_%7C_TypeScript-blueviolet?style=for-the-badge)](./docs/TECHNICAL-DESIGN.MD)
[![Engineer Available](https://img.shields.io/badge/Engineer_Available-Feb_16th-orange?style=for-the-badge)](https://www.linkedin.com/in/tom-cunningham-5a1869297/)

## 📊 Live Quality Dashboards

👉 [**View LIVE project Dashboard**](https://therainmaker1001.github.io/QA-Automation-Suites/) 👈

See the system in action. These dashboards provide real-time visibility into the current health of the application.

| Dashboard | Audience | Link |
|-----------|----------|------|
| **Stakeholder Dashboard** | **PMs & Leadership** | [View Executive Summary](https://therainmaker1001.github.io/QA-Automation-Suites/stakeholder/) |
| **Developer Dashboard** | **QA & Engineering** | [View Technical Allure Report](https://therainmaker1001.github.io/QA-Automation-Suites/allure/) |

---

## 🏗️ Architecture & Engineering Design

🧱 [**Technical Design & Architecture**](./docs/TECHNICAL-DESIGN.MD)  
🧰 [**Loan Approval Decision Tables / 3-Value BVA**](./docs/test-design/loan-approval-decision-table.md)

---

## 🚀 Summary: Why This Suite Exists

This is not just a collection of test scripts. It is a **Risk Intelligence Platform** designed for the high-stakes FinTech sector.

In an industry where a single calculation error, or security gap, can cost millions 'the code works' is not enough. This framework delivers **mitigation against failure** by combining rigorous financial logic validation with automated compliance audits and software tests.

**The Bottom Line:**

*   **🛡️ Zero 'Money Leaks':** 34+ combinatorial scenarios ensure loan logic is mathematically perfect.
*   **⚖️ Legal Compliance:** Automated WCAG 2.1 AA audits protect against accessibility lawsuits.
*   **💰 40% Lower CI Costs:** Smart 'Risk Lanes' run only the necessary tests at any given time, saving cloud compute.

---

## 1. The Business 'Safety Net' (Risk Mitigation)

Technical product owners need reliability. This suite ensures the **financial logic** is bulletproof before code ever reaches production.

### 💸 Combinatorial Logic Coverage

*   **RISK:** Edge-case money leaks where invalid loans might be approved due to boundary errors (e.g., $0.00 down payment).
*   **SOLUTION:** We don't guess; we prove. Using **Decision Table Testing and 3-Value BVA** this suite validates **34 unique loan approval scenarios**.

### 🔐 State Transition Test Coverage

*   **RISK:** Users bypassing security screens or accessing protected data while in a `Guest` or `LoginError` state.
*   **SOLUTION:** Authentication flows are validated using **ISTQB State Transition Testing**, systematically verifying that all 7 valid state transitions behave correctly across 3 observable states (Guest, LoggedIn, LoginError).

### ⚖️ Legal & Compliance Guardrails

*   **RISK:** Compliance violations and potential lawsuits.
*   **SOLUTION:** Automated **Accessibility (a11y)** tests run nightly against WCAG 2.1 AA standards, acting as a legal shield.

---

## 2. ROI & Efficiency (Cost Savings)

Software development is expensive. Set this sort of framework up right and you have a forever asset that prevents flakiness and drift in your software product. It also helps developers with clarity on issues causing failures.

### 🚦 Risk-Based Tagging ('The Lanes')

Instead of running every test on every change, we use intelligent tagging:

*   `@smoke`: Fast connectivity checks (Push & PR).
*   `@critical`: Core money logic (PRs only).
*   `@regression`: Full suite (Nightly).

*   **Impact:** Reduces CI/CD cloud costs by up to **40%** by running expensive tests only when necessary.

### 🛡️ Shift-Left Quality Gates

Using **Husky** and **Prettier**, quality is enforced at the developer's desk.
*   **Impact:** Prevents bad code from ever reaching the expensive build servers, saving developer time on failed builds and debugging.

### ⚡ Storage State Reuse
Login sessions are captured once and reused across tests (`storageState`).
*   **Impact:** Drastically shortens the feedback loop, allowing engineers to deploy fixes faster.

---

## 3. Long-term Thinking

How does it continue to add value after it's deployed?

*   **⏱️ Performance SLA Assertions:** Tests automatically fail if API responses exceed **5000ms**, ensuring customer experience never degrades silently.
*   **📸 Evidence on Failure:** Every failure captures **Video, Screenshots, and Traces**. Developers spend zero time 'reproducing' bugs, they just watch the replay or follow the trace.
*   **📝 API Contract Safety:** **Zod Schema Validation** catches backend changes instantly, preventing silent API breaks from crashing the frontend.


---

## 4. ISTQB Optimised Design

### The Testing Pyramid (Stability First)
We avoid the 'Ice Cream Cone' anti-pattern. This suite is built on a stable foundation of fast, reliable, tests aligning with ISTQB best practice.

```text
                  / \
                 /   \
                /  E2E  \             👉 Playwright (46 Tests)
               /---------\               User Journeys & A11y
              /           \
             / Integration \          👉 Vitest + Fetch (84 Tests)
            /---------------\            API & Business Rules
           /                 \
          /       Unit        \       👉 Vitest (189 Tests)
         /---------------------\         Isolated Maths & Logic
```
---

## 📬 Contact & Availability
**Tom Cunningham** – *Quality Engineer, Automation*
tombpcunningham@icloud.com

*   **Contract Availability:** Available to start from **Feb 16th**.
*   **Limited time offer!** *Discounted day rates are available for contracts booked for the remainder of the 2025/2026 financial year (Feb 16th – April 5th, 2026 - Inclusive).*

**Connect on LinkedIn**
https://www.linkedin.com/in/tom-cunningham-5a1869297/

---