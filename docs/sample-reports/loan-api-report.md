# Loan API Test Report

> **Generated**: 2026-01-26T06:47:25.765Z  
> **Status**: ✅ ALL TESTS PASSED

---

## Summary

| Metric      |  Value |
| ----------- | -----: |
| Total Tests |     41 |
| ✅ Passed   |     41 |
| ❌ Failed   |      0 |
| ⏭️ Skipped  |      0 |
| Pass Rate   | 100.0% |
| Duration    |     ?s |

---

## Test Technique Coverage

This suite implements **ISTQB Decision Table Testing** combined with **3-Value BVA**:

| Technique            | Tests | Description                        |
| -------------------- | ----: | ---------------------------------- |
| Decision Table Rules |     4 | All condition combinations (R1-R4) |
| Funds Check BVA      |     5 | -2, -1, 0, +1, +2 at boundary      |
| Ratio Check BVA      |     5 | -2, -1, 0, +1, +2 at 10% threshold |
| Loan Amount BVA      |     5 | -2, -1, 0, +1, +2 at zero          |
| Down Payment BVA     |     5 | -2, -1, 0, +1, +2 at zero          |
| Available Funds BVA  |     5 | -2, -1, 0, +1, +2 at zero          |
| Combined Boundaries  |     5 | Critical multi-boundary scenarios  |

---

## Detailed Results

### Decision Table Rules

| Test ID                                                                                  | Status |             Duration |
| ---------------------------------------------------------------------------------------- | :----: | -------------------: |
| [DT-R1] Rule 1: Sufficient funds AND sufficient down payment ratio → Approved            |   ✅   | 128.80910999999998ms |
| [DT-R2] Rule 2: Sufficient funds BUT insufficient down payment ratio → Denied            |   ✅   |  70.54468100000003ms |
| [DT-R3] Rule 3: Insufficient funds BUT sufficient ratio → Denied (funds checked first)   |   ✅   | 30.033326000000045ms |
| [DT-R4] Rule 4: Insufficient funds AND insufficient ratio → Denied (funds checked first) |   ✅   | 26.525410000000022ms |

### Funds Check BVA (-2 to +2)

| Test ID                                                                                       | Status |             Duration |
| --------------------------------------------------------------------------------------------- | :----: | -------------------: |
| [BVA-FUNDS-MINUS-2] Funds boundary [-2]: Available funds $0.02 BELOW down payment → Denied    |   ✅   |  28.68884399999996ms |
| [BVA-FUNDS-MINUS-1] Funds boundary [-1]: Available funds $0.01 BELOW down payment → Denied    |   ✅   | 27.249255000000005ms |
| [BVA-FUNDS-AT-0] Funds boundary [0]: Available funds EXACTLY EQUAL to down payment → Approved |   ✅   | 31.387721999999997ms |
| [BVA-FUNDS-PLUS-1] Funds boundary [+1]: Available funds $0.01 ABOVE down payment → Approved   |   ✅   | 27.548937000000024ms |
| [BVA-FUNDS-PLUS-2] Funds boundary [+2]: Available funds $0.02 ABOVE down payment → Approved   |   ✅   |  29.51667599999996ms |
| [BVA-FUNDS-AT-0] Funds boundary [0]: Available funds EXACTLY EQUAL to down payment → Approved |   ✅   | 29.742909999999938ms |

### Ratio Check BVA (-2 to +2)

| Test ID                                                                                   | Status |             Duration |
| ----------------------------------------------------------------------------------------- | :----: | -------------------: |
| [BVA-RATIO-MINUS-2] Ratio boundary [-2]: Down payment $0.02 BELOW 10% threshold → Denied  |   ✅   |  26.94566400000008ms |
| [BVA-RATIO-MINUS-1] Ratio boundary [-1]: Down payment $0.01 BELOW 10% threshold → Denied  |   ✅   |          28.738427ms |
| [BVA-RATIO-AT-0] Ratio boundary [0]: Down payment EXACTLY 10% of loan amount → Approved   |   ✅   |  26.01575099999991ms |
| [BVA-RATIO-PLUS-1] Ratio boundary [+1]: Down payment $0.01 ABOVE 10% threshold → Approved |   ✅   | 30.045258999999987ms |
| [BVA-RATIO-PLUS-2] Ratio boundary [+2]: Down payment $0.02 ABOVE 10% threshold → Approved |   ✅   | 26.069061000000033ms |
| [BVA-RATIO-AT-0] Ratio boundary [0]: Down payment EXACTLY 10% of loan amount → Approved   |   ✅   | 26.236646000000064ms |

### Loan Amount BVA (-2 to +2)

| Test ID                                                                                 | Status |             Duration |
| --------------------------------------------------------------------------------------- | :----: | -------------------: |
| [BVA-LOAN-MINUS-2] Loan amount boundary [-2]: Negative loan amount (-$0.02) → Edge case |   ✅   | 30.236456999999973ms |
| [BVA-LOAN-MINUS-1] Loan amount boundary [-1]: Negative loan amount (-$0.01) → Edge case |   ✅   |  26.23393999999996ms |
| [BVA-LOAN-AT-0] Loan amount boundary [0]: Zero loan amount → Division by zero risk      |   ✅   | 30.899781000000075ms |
| [BVA-LOAN-PLUS-1] Loan amount boundary [+1]: Minimum positive loan ($0.01)              |   ✅   | 25.519390000000044ms |
| [BVA-LOAN-PLUS-2] Loan amount boundary [+2]: Small positive loan ($0.02)                |   ✅   | 29.900425999999925ms |
| [BVA-LOAN-AT-0] Loan amount boundary [0]: Zero loan amount → Division by zero risk      |   ✅   | 29.975427999999965ms |

### Down Payment BVA (-2 to +2)

| Test ID                                                                                           | Status |             Duration |
| ------------------------------------------------------------------------------------------------- | :----: | -------------------: |
| [BVA-DOWNPMT-MINUS-2] Down payment boundary [-2]: Negative down payment (-$0.02) → Edge case      |   ✅   | 26.112078999999994ms |
| [BVA-DOWNPMT-MINUS-1] Down payment boundary [-1]: Negative down payment (-$0.01) → Edge case      |   ✅   |          30.419219ms |
| [BVA-DOWNPMT-AT-0] Down payment boundary [0]: Zero down payment → Denied (0% < 10%)               |   ✅   | 24.152807000000053ms |
| [BVA-DOWNPMT-PLUS-1] Down payment boundary [+1]: Minimum positive ($0.01) → Denied (0.001% < 10%) |   ✅   | 30.282702000000086ms |
| [BVA-DOWNPMT-PLUS-2] Down payment boundary [+2]: Small positive ($0.02) → Denied (0.002% < 10%)   |   ✅   | 25.518488000000048ms |
| [BVA-DOWNPMT-AT-0] Down payment boundary [0]: Zero down payment → Denied (0% < 10%)               |   ✅   | 25.212152999999944ms |

### Available Funds BVA (-2 to +2)

| Test ID                                                                                           | Status |             Duration |
| ------------------------------------------------------------------------------------------------- | :----: | -------------------: |
| [BVA-AVAIL-MINUS-2] Available funds boundary [-2]: Overdraft (-$0.02) → Denied                    |   ✅   | 28.520855000000097ms |
| [BVA-AVAIL-MINUS-1] Available funds boundary [-1]: Overdraft (-$0.01) → Denied                    |   ✅   |  25.43284799999992ms |
| [BVA-AVAIL-AT-0] Available funds boundary [0]: Zero funds → Denied                                |   ✅   |  28.95564400000012ms |
| [BVA-AVAIL-PLUS-1] Available funds boundary [+1]: Minimal funds ($0.01) → Denied (< down payment) |   ✅   | 25.526273000000174ms |
| [BVA-AVAIL-PLUS-2] Available funds boundary [+2]: Small funds ($0.02) → Denied (< down payment)   |   ✅   |  28.46263900000008ms |
| [BVA-AVAIL-AT-0] Available funds boundary [0]: Zero funds → Denied                                |   ✅   |  31.09677899999997ms |

### Combined Boundaries

| Test ID                                                                                                          | Status |             Duration |
| ---------------------------------------------------------------------------------------------------------------- | :----: | -------------------: |
| [BVA-COMBINED-BOTH-AT-0] Combined [0,0]: Funds exactly equal AND ratio exactly 10% → Approved (barely)           |   ✅   |  27.46625999999992ms |
| [BVA-COMBINED-FUNDS-0-RATIO-MINUS-1] Combined [0,-1]: Funds exactly equal BUT ratio $0.01 below → Denied (ratio) |   ✅   | 28.751142000000073ms |
| [BVA-COMBINED-FUNDS-MINUS-1-RATIO-0] Combined [-1,0]: Funds $0.01 below BUT ratio exactly 10% → Denied (funds)   |   ✅   |  25.57164799999987ms |
| [BVA-COMBINED-BOTH-PLUS-1] Combined [+1,+1]: Both $0.01 above boundary → Approved                                |   ✅   | 30.096403999999893ms |
| [BVA-COMBINED-BOTH-MINUS-1] Combined [-1,-1]: Both $0.01 below boundary → Denied (funds checked first)           |   ✅   |  25.87992600000007ms |
| [BVA-COMBINED-BOTH-AT-0] Combined [0,0]: Funds exactly equal AND ratio exactly 10% → Approved (barely)           |   ✅   | 25.580314000000044ms |

### Other

| Test ID                                      | Status |             Duration |
| -------------------------------------------- | :----: | -------------------: |
| should have complete decision table coverage |   ✅   | 1.5850920000000315ms |

---

📖 **Test Design**: See [loan-approval-decision-table.md](../docs/test-design/loan-approval-decision-table.md)
