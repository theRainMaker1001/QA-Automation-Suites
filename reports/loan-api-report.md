# Loan API Test Report

> **Generated**: 2026-01-25T15:49:30.726Z  
> **Status**: ✅ ALL TESTS PASSED

---

## Summary

| Metric | Value |
|--------|------:|
| Total Tests | 41 |
| ✅ Passed | 41 |
| ❌ Failed | 0 |
| ⏭️ Skipped | 0 |
| Pass Rate | 100.0% |
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

### Decision Table Rules

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [DT-R1] Rule 1: Sufficient funds AND sufficient down payment ratio → Approved | ✅ | 164.00457100000003ms |
| [DT-R2] Rule 2: Sufficient funds BUT insufficient down payment ratio → Denied | ✅ | 61.25041599999997ms |
| [DT-R3] Rule 3: Insufficient funds BUT sufficient ratio → Denied (funds checked first) | ✅ | 43.710541999999975ms |
| [DT-R4] Rule 4: Insufficient funds AND insufficient ratio → Denied (funds checked first) | ✅ | 48.500383ms |

### Funds Check BVA (-2 to +2)

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [BVA-FUNDS-MINUS-2] Funds boundary [-2]: Available funds $0.02 BELOW down payment → Denied | ✅ | 43.377148999999974ms |
| [BVA-FUNDS-MINUS-1] Funds boundary [-1]: Available funds $0.01 BELOW down payment → Denied | ✅ | 43.314255ms |
| [BVA-FUNDS-AT-0] Funds boundary [0]: Available funds EXACTLY EQUAL to down payment → Approved | ✅ | 42.30045599999994ms |
| [BVA-FUNDS-PLUS-1] Funds boundary [+1]: Available funds $0.01 ABOVE down payment → Approved | ✅ | 46.229468ms |
| [BVA-FUNDS-PLUS-2] Funds boundary [+2]: Available funds $0.02 ABOVE down payment → Approved | ✅ | 42.50165599999991ms |
| [BVA-FUNDS-AT-0] Funds boundary [0]: Available funds EXACTLY EQUAL to down payment → Approved | ✅ | 53.3582100000001ms |

### Ratio Check BVA (-2 to +2)

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [BVA-RATIO-MINUS-2] Ratio boundary [-2]: Down payment $0.02 BELOW 10% threshold → Denied | ✅ | 43.751556999999934ms |
| [BVA-RATIO-MINUS-1] Ratio boundary [-1]: Down payment $0.01 BELOW 10% threshold → Denied | ✅ | 41.42161599999997ms |
| [BVA-RATIO-AT-0] Ratio boundary [0]: Down payment EXACTLY 10% of loan amount → Approved | ✅ | 40.91694199999995ms |
| [BVA-RATIO-PLUS-1] Ratio boundary [+1]: Down payment $0.01 ABOVE 10% threshold → Approved | ✅ | 41.158815000000004ms |
| [BVA-RATIO-PLUS-2] Ratio boundary [+2]: Down payment $0.02 ABOVE 10% threshold → Approved | ✅ | 42.73028399999998ms |
| [BVA-RATIO-AT-0] Ratio boundary [0]: Down payment EXACTLY 10% of loan amount → Approved | ✅ | 44.35443400000008ms |

### Loan Amount BVA (-2 to +2)

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [BVA-LOAN-MINUS-2] Loan amount boundary [-2]: Negative loan amount (-$0.02) → Edge case | ✅ | 42.74454800000001ms |
| [BVA-LOAN-MINUS-1] Loan amount boundary [-1]: Negative loan amount (-$0.01) → Edge case | ✅ | 42.261425999999915ms |
| [BVA-LOAN-AT-0] Loan amount boundary [0]: Zero loan amount → Division by zero risk | ✅ | 39.68424799999991ms |
| [BVA-LOAN-PLUS-1] Loan amount boundary [+1]: Minimum positive loan ($0.01) | ✅ | 41.715826000000106ms |
| [BVA-LOAN-PLUS-2] Loan amount boundary [+2]: Small positive loan ($0.02) | ✅ | 40.126636999999846ms |
| [BVA-LOAN-AT-0] Loan amount boundary [0]: Zero loan amount → Division by zero risk | ✅ | 39.477133000000094ms |

### Down Payment BVA (-2 to +2)

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [BVA-DOWNPMT-MINUS-2] Down payment boundary [-2]: Negative down payment (-$0.02) → Edge case | ✅ | 39.63957400000004ms |
| [BVA-DOWNPMT-MINUS-1] Down payment boundary [-1]: Negative down payment (-$0.01) → Edge case | ✅ | 45.68231700000001ms |
| [BVA-DOWNPMT-AT-0] Down payment boundary [0]: Zero down payment → Denied (0% < 10%) | ✅ | 41.60030000000006ms |
| [BVA-DOWNPMT-PLUS-1] Down payment boundary [+1]: Minimum positive ($0.01) → Denied (0.001% < 10%) | ✅ | 47.856833999999935ms |
| [BVA-DOWNPMT-PLUS-2] Down payment boundary [+2]: Small positive ($0.02) → Denied (0.002% < 10%) | ✅ | 39.303728999999976ms |
| [BVA-DOWNPMT-AT-0] Down payment boundary [0]: Zero down payment → Denied (0% < 10%) | ✅ | 41.0959069999999ms |

### Available Funds BVA (-2 to +2)

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [BVA-AVAIL-MINUS-2] Available funds boundary [-2]: Overdraft (-$0.02) → Denied | ✅ | 41.461573000000044ms |
| [BVA-AVAIL-MINUS-1] Available funds boundary [-1]: Overdraft (-$0.01) → Denied | ✅ | 41.3090830000001ms |
| [BVA-AVAIL-AT-0] Available funds boundary [0]: Zero funds → Denied | ✅ | 41.518246999999974ms |
| [BVA-AVAIL-PLUS-1] Available funds boundary [+1]: Minimal funds ($0.01) → Denied (< down payment) | ✅ | 43.096164000000044ms |
| [BVA-AVAIL-PLUS-2] Available funds boundary [+2]: Small funds ($0.02) → Denied (< down payment) | ✅ | 40.2667120000001ms |
| [BVA-AVAIL-AT-0] Available funds boundary [0]: Zero funds → Denied | ✅ | 41.16884100000016ms |

### Combined Boundaries

| Test ID | Status | Duration |
|---------|:------:|---------:|
| [BVA-COMBINED-BOTH-AT-0] Combined [0,0]: Funds exactly equal AND ratio exactly 10% → Approved (barely) | ✅ | 39.7628850000001ms |
| [BVA-COMBINED-FUNDS-0-RATIO-MINUS-1] Combined [0,-1]: Funds exactly equal BUT ratio $0.01 below → Denied (ratio) | ✅ | 40.45637099999999ms |
| [BVA-COMBINED-FUNDS-MINUS-1-RATIO-0] Combined [-1,0]: Funds $0.01 below BUT ratio exactly 10% → Denied (funds) | ✅ | 44.09552499999995ms |
| [BVA-COMBINED-BOTH-PLUS-1] Combined [+1,+1]: Both $0.01 above boundary → Approved | ✅ | 42.427963999999974ms |
| [BVA-COMBINED-BOTH-MINUS-1] Combined [-1,-1]: Both $0.01 below boundary → Denied (funds checked first) | ✅ | 40.582344999999805ms |
| [BVA-COMBINED-BOTH-AT-0] Combined [0,0]: Funds exactly equal AND ratio exactly 10% → Approved (barely) | ✅ | 43.277344000000085ms |

### Other

| Test ID | Status | Duration |
|---------|:------:|---------:|
| should have complete decision table coverage | ✅ | 1.6309680000001663ms |

---

📖 **Test Design**: See [loan-approval-decision-table.md](../docs/test-design/loan-approval-decision-table.md)
