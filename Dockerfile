# ─────────────────────────────────────────────────────────────────────────────
# QA Nightly Regression Container
#
# Base image: mcr.microsoft.com/playwright:v1.58.0-noble
#   - Ubuntu 24.04 (Noble) with Chromium, Firefox, and WebKit pre-installed.
#   - No browser download at build or run time; image is cached after first pull.
#
# ⚠️  SYNC REQUIREMENT: The image tag version (v1.58.0) MUST match the
#   @playwright/test version installed by npm ci. A mismatch causes a hard
#   runtime failure: "current X, required Y". When upgrading Playwright,
#   update this tag to the new version. Verify the installed version with:
#     node -e "console.log(require('./node_modules/@playwright/test/package.json').version)"
#
# Node upgrade: the base image ships with Node 20; this project requires
# Node 24.11.1 (see .nvmrc). One apt layer installs Node 24 via NodeSource.
#
# Usage:
#   docker build -t qa-nightly:local .
#   docker compose run --rm nightly
#   npm run docker:build && npm run docker:run
# ─────────────────────────────────────────────────────────────────────────────

FROM mcr.microsoft.com/playwright:v1.58.0-noble

# Install Node 24 to match the project engine requirement (>= 24.11.1).
# NodeSource provides the official apt repository for Node 24 on Ubuntu Noble.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Dependency layer ──────────────────────────────────────────────────────────
# Copy package manifests before source so this layer is only invalidated when
# dependencies change - not on every source file change.
COPY package.json package-lock.json ./
COPY e2e/package.json ./e2e/package.json

# HUSKY=0 prevents the 'prepare' lifecycle script from attempting git hook
# installation inside the container (no .git directory present).
RUN HUSKY=0 npm ci

# ── Source ────────────────────────────────────────────────────────────────────
COPY . .

# Pre-create output directories so the test reporters have write targets even
# before bind mounts attach. When running with docker compose, these paths are
# replaced by host-side bind mounts; the mkdir is a safety net for bare docker
# run usage.
RUN mkdir -p reports allure-results/e2e e2e/.auth e2e/test-results e2e/playwright-report

# ── Runtime environment ───────────────────────────────────────────────────────
ENV CI=true \
    BANK_BASE_URL=https://parabank.parasoft.com/parabank \
    # Increase heap for matrix runs across three browser projects
    NODE_OPTIONS=--max-old-space-size=4096

# Default command: full nightly sequence (regression matrix → preserve → a11y → report)
CMD ["npx", "tsx", "scripts/run-nightly.ts"]
