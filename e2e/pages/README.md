# Page Objects

All user-facing flows should interact through page objects rather than inline selectors.

Current pages:

- `BasePage`: shared navigation and utility wrappers.
- `LoginPage`: authentication state and login actions.
- `RegisterPage`: registration form actions and outcomes.
- `AccountsPage`: account overview interactions.
- `TransactionsPage`: transaction search workflows.

## RegisterPage — `gotoAndWaitForForm` return contract

`gotoAndWaitForForm` returns a `FormLoadStatus` string literal describing what happened
during navigation.

Callers that gate on registration page availability must handle all three values.
Callers that treat registration as an optional step (e.g. `state-transition.auth.spec.ts`)
may branch only on `'loaded'`; any other value means registration was unavailable and the
caller falls back to its default behaviour.

| Status          | Meaning                                                                              | Correct caller action                                                                                            |
| :-------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `'loaded'`      | Page rendered and all form inputs are visible                                        | Proceed with the test                                                                                            |
| `'unreachable'` | Every navigation attempt threw a network-level error — the host could not be reached | `test.skip()` — infrastructure outage, not an application defect                                                 |
| `'not-found'`   | Navigation succeeded but form inputs were absent after all retries                   | Skip on Firefox (known render flake); hard failure on Chromium — investigate `/register.htm` route or DOM change |

A `'not-found'` failure on Chromium fires with an explicit diagnostic message identifying
the route so the cause is immediately actionable in CI output.
