# 🏦 FinTech Quality Engineering Framework
### *High-Confidence Automation & Risk-Based Testing for ParaBank*

[![Quality Gate](https://img.shields.io/badge/Quality_Gate-Passing-success?style=for-the-badge&logo=github)](https://github.com/theRainMaker1001/QA-Automation-Suites/actions)
[![ISTQB Certified](https://img.shields.io/badge/ISTQB_Foundation-92.5%25-blue?style=for-the-badge)](https://www.istqb.org/)
[![Tech Stack](https://img.shields.io/badge/Stack-Playwright_%7C_Vitest_%7C_TypeScript-blueviolet?style=for-the-badge)](./docs/TECHNICAL_DETAILS.md)
[![Status](https://img.shields.io/badge/Availability-Feb_16th-orange?style=for-the-badge)](https://www.linkedin.com/in/tom-cunningham-5b6823103/)

---

## 🎯 Executive Summary
This repository demonstrates a **production-ready quality ecosystem** engineered specifically for the high-risk FinTech sector. It moves beyond standard scripting to provide a comprehensive **Risk Intelligence Platform**.

The framework bridges the gap between technical execution and stakeholder visibility, ensuring that "Quality" is a measurable metric, not just a feeling.

### **Strategic Value:**
* **🛡️ Risk-Based Lanes:** Prioritizes critical financial flows (Loans, Transfers) over cosmetic checks.
* **⚖️ Regulatory Compliance:** Automated **WCAG 2.1 AA** auditing to mitigate legal accessibility risks.
* **💸 Financial Precision:** Custom logic to eliminate JavaScript floating-point errors (`0.1 + 0.2 != 0.3`).
* **👁️ Total Visibility:** Live dashboards providing "Release Confidence" metrics to non-technical stakeholders.

---

## 📊 Live Dashboards

| Dashboard | Audience | Link |
|-----------|----------|------|
| **Stakeholder Dashboard** | PMs, Leadership | [View Executive Summary](https://therainmaker1001.github.io/QA-Automation-Suites/stakeholder/) |
| **Developer Dashboard** | QA, Developers | [View Allure Report](https://therainmaker1001.github.io/QA-Automation-Suites/allure/) |

### Stakeholder Dashboard Features
* **Confidence Score:** Weighted aggregate of all test lane pass rates
* **Risk Level Indicator:** LOW / MEDIUM / HIGH / CRITICAL based on critical path results
* **WCAG Compliance Badge:** Real-time accessibility status (AA / A / Non-Compliant)

### Developer Dashboard Features (Allure)
* **Trend Analysis:** Historical pass rates across runs
* **Failure Categorization:** Distinguish *Product Bugs* from *Environment Noise*
* **Visual Evidence:** Video recordings and screenshots on every failed test
* **Full Test Details:** Steps, assertions, timing, and attachments

---

## 🧪 The Quality Strategy (Risk Lanes)
We utilize a **5-Tag Taxonomy** to ensure the right tests run at the right time.

| Lane | Trigger | Purpose | Business Impact |
| :--- | :--- | :--- | :--- |
| **@smoke** | Every PR | Connectivity & Auth | "Is the bank open?" |
| **@critical** | Every PR | Core Financial Logic | "Can we process a loan?" |
| **@regression** | Nightly | Full Feature Parity | "Did we break legacy features?" |
| **@a11y** | Nightly | Accessibility Audit | "Are we legally compliant?" |
| **@heartbeat**| Hourly | API Health Monitor | "Is Production stable?" |

---

## ✅ System Capabilities Delivered
*This framework is fully operational and implements the following advanced engineering modules:*

### **1. Advanced Test Design (ISTQB)**
- [x] **Combinatorial Decision Tables:** Validating 47 distinct Loan Eligibility scenarios using Boundary Value Analysis (BVA).
- [x] **State Machine Architecture:** Finite state modeling for Authentication flows (Login -> Timeout -> Lockout).
- [x] **Schema Contracts:** Zod-based validation to ensure API responses match strict banking data types.

### **2. Pipeline Maturity (CI/CD)**
- [x] **Zero-Gate Governance:** Husky pre-commit hooks prevent linting errors from entering the repo.
- [x] **Lane Orchestration:** Separation of "Fast Feedback" (Smoke) vs "Deep Coverage" (Regression) pipelines.
- [x] **Automated Reporting:** Zero-touch deployment of Allure dashboards to GitHub Pages.

### **3. Compliance & Risk**
- [x] **Accessibility Auditing:** Automated `axe-core` scans on critical user journeys.
- [x] **Flakiness Mitigation:** Self-healing locators and retry-backoff logic for stable execution.

---

## 🔗 Documentation
* **[Technical Implementation Details](./docs/TECHNICAL_DETAILS.md)** - *Deep dive into Architecture, Test Design, and CI/CD.*
* **[Loan Decision Logic](./docs/test-design/loan-approval-decision-table.md)** - *The ISTQB logic behind the testing.*

---

## 📬 Contact & Hire
**Tom Cunningham** – *Quality Engineer / Automation Engineer*

* **Contract Availability:** Available to start from **Feb 16th**.
* **Fiscal Year Offer:** *Preferential day rates available for contracts booked for the remainder of the 2025/2026 financial year (Feb 16th - April 5th).*
* **Permanent Roles:** Open to discussion regarding Permanent SDET or Quality Engineering positions.

[**Connect on LinkedIn**](https://www.linkedin.com/in/tom-cunningham-5b6823103/)