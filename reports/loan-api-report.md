# Loan API Test Report

> **Generated**: 2026-01-25T13:11:51.696Z  
> **Status**: ✅ ALL TESTS PASSED

---

## Summary

| Metric | Value |
|--------|------:|
| Total Tests | 34 |
| ✅ Passed | 0 |
| ❌ Failed | 0 |
| ⏭️ Skipped | 0 |
| Pass Rate | 0.0% |
| Duration | ?s |

---

## Test Technique Coverage

This suite implements **ISTQB Decision Table Testing** combined with **3-Value BVA**:

| Technique | Tests | Description |
|-----------|------:|-------------|
| Decision Table Rules | 4 | All condition combinations (R1-R4) |
| Funds Check BVA | 5 | -2, -1, 0, +1, +2 at boundary |
| Ratio Check BVA | 5 | -2, -1, 0, +1, +2 at 10% threshold |
| Loan Amount BVA | 5 | -2, -1, 0, +1, +2 at zero |
| Down Payment BVA | 5 | -2, -1, 0, +1, +2 at zero |
| Available Funds BVA | 5 | -2, -1, 0, +1, +2 at zero |
| Combined Boundaries | 5 | Critical multi-boundary scenarios |

---

## Detailed Results

---

📖 **Test Design**: See [loan-approval-decision-table.md](../docs/test-design/loan-approval-decision-table.md)
