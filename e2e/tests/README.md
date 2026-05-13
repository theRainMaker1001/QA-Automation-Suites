# Test Specs

Specs should keep flow logic thin and delegate reusable selectors/actions to page
objects.

## Critical Login Surface

`critical.availability.spec.ts` and `critical.login.spec.ts` pass Playwright
`testInfo` into `LoginPage.expectLoginFormVisible()`. If the login form is absent,
the test fails with `UPSTREAM_LOGIN_SURFACE_UNAVAILABLE` and includes a
`login-surface-diagnostics` JSON attachment.

Do not convert this condition to a skip. The server may be reachable while the
user-facing login surface is broken or blocked by third-party access. The
stakeholder dashboard separates those blocked runs from confirmed product defects.

## Auth State Preconditions

State-transition specs that expect unauthenticated `GUEST` state must call the
`LoginPage` guest-surface guard before asserting state or submitting credentials.
This keeps Cloudflare/access-denied pages from being read as ParaBank
`LOGIN_ERROR` pages and preserves real app-state failures as actionable defects.
