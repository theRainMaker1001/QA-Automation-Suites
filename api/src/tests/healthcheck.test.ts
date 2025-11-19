// basic health + auth smoke checks

import assert from 'assert';

// optional Env Var Config

const HEALTH_URL = process.env.HEALTH_URL ?? 'https://api.github.com';
const EXPECT_FIELD = process.env.EXPECT_FIELD ?? 'current_user_url';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 5000);
const MAX_LATENCY_MS = Number(process.env.MAX_LATENCY_MS ?? 1000);
const EXPECT_CONTENT_TYPE = process.env.EXPECT_CONTENT_TYPE ?? 'application/json';

// Optional auth checks

const CHECK_AUTH = (process.env.CHECK_AUTH ?? '').toLowerCase() === 'true';
const AUTH_URL = process.env.AUTH_URL; // e.g. https://api.github.com/user
const AUTH_TOKEN = process.env.AUTH_TOKEN; // e.g. GitHub PAT

// Performance Utils

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const res: Response = await fetch(url, { ...init, signal });
    return res;
  } finally {
    clear();
  }
}

function assertContentType(res: Response, expectedContains: string) {
  const ct = res.headers.get('content-type') || '';
  assert.ok(
    ct.toLowerCase().includes(expectedContains.toLowerCase()),
    `Expected Content-Type to include "${expectedContains}", but got "${ct || '(none)'}"`,
  );
}

// Healthcheck

async function runHealthCheck(): Promise<void> {
  const headers: Record<string, string> = {
    'User-Agent': 'ci-healthcheck',
    Accept: 'application/vnd.github+json',
  };

  const t0 = Date.now();
  const response = await fetchWithTimeout(HEALTH_URL, { headers }, TIMEOUT_MS);
  const latency = Date.now() - t0;

  // Status
  assert.strictEqual(
    response.status,
    200,
    `Expected 200 from ${HEALTH_URL}, but got ${response.status}`,
  );

  // Latency
  assert.ok(
    latency <= MAX_LATENCY_MS,
    `Latency ${latency}ms exceeded our set threshold of ${MAX_LATENCY_MS}ms`,
  );

  // Content-Type
  assertContentType(response, EXPECT_CONTENT_TYPE);

  // Minimal JSON shape

  const data: Record<string, unknown> = await response.json();
  if (!(EXPECT_FIELD in data)) {
    throw new Error(`Missing expected field "${EXPECT_FIELD}" at ${HEALTH_URL}`);
  }

  console.log(
    [
      '✅ API SMOKE CHECKS PASSED',
      `url is ${HEALTH_URL}`,
      `status is ${response.status}`,
      `latency_ms was ${latency}`,
      `expect_field is "${EXPECT_FIELD}" and present`,
      `content_type is "${response.headers.get('content-type') || '(none)'}"`,
      `timeout limit is set to ${TIMEOUT_MS}`,
      `latency limit is set to ${MAX_LATENCY_MS}`,
      `exact date and time was ${new Date().toISOString()}`,
    ].join(' | '),
  );

  // Optional auth happy and sad path

  if (CHECK_AUTH) {
    assert.ok(AUTH_URL, 'CHECK_AUTH=true but AUTH_URL not set');
    // Happy path (with token)
    const authHeaders = { ...headers };
    assert.ok(AUTH_TOKEN, 'CHECK_AUTH=true but AUTH_TOKEN not set');
    authHeaders['Authorization'] = `Bearer ${AUTH_TOKEN}`;

    const authRes = await fetchWithTimeout(AUTH_URL!, { headers: authHeaders }, TIMEOUT_MS);
    assert.strictEqual(
      authRes.status,
      200,
      `Auth happy path failed: expected 200 from ${AUTH_URL}, but got ${authRes.status}`,
    );
    assertContentType(authRes, EXPECT_CONTENT_TYPE);
    console.log('✅ Auth happy path OK (200 with token)');

    // Sad path (without token)
    const sadRes = await fetchWithTimeout(AUTH_URL!, { headers }, TIMEOUT_MS);
    assert.ok(
      sadRes.status === 401 || sadRes.status === 403,
      `Auth sad path failed: expected 401/403 from ${AUTH_URL}, but got ${sadRes.status}`,
    );
    console.log(`✅ Auth sad path OK (${sadRes.status} without token)`);
  }
}

runHealthCheck().catch((err: Error) => {
  console.error('❌ Health check failed:', err.message);
  process.exit(1);
});
