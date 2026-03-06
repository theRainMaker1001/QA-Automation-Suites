# Utilities

## `auth-session.ts`

Shared authentication/session helpers used by:

- `e2e/global.setup.ts` for storage state creation.
- `e2e/fixtures/auth.fixture.ts` for authenticated test contexts.
- Auth-dependent specs that need a consistent login bootstrap.

## `network-errors.ts`

Pure function `isNetworkError(error)` with no Playwright dependency. Returns `true`
when a navigation threw because the host was unreachable at the network level (DNS
failure, refused connection, or timeout), and `false` for all other error types.

Covered by Vitest unit tests (`e2e/utils/network-errors.test.ts`). This is the only
E2E utility intentionally listed in `vitest.unit.config.ts` — do not add other files
from this directory to that config unless they are equally free of Playwright imports.
