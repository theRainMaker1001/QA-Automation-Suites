import { describe, it, expect, afterAll } from 'vitest';
import { HttpClient } from '../../helpers/http.js';
import { env } from '../_env.js';
import { z } from 'zod';
import { logJsonLine, writeSummary } from '../_logger.js';

// Minimal runtime schemas (catch contract drift when JSON / basic confirmation of data shape)
const CustomerSchema = z
  .object({
    id: z.number(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .passthrough();

const AccountSchema = z.object({
  id: z.number(),
  type: z.string(),
  balance: z.number(),
});
const AccountsResponseSchema = z.array(AccountSchema);

// No leading "/" so base path (/parabank) is preserved
const routes = {
  customer: (id: string) => `services/bank/customers/${id}`,
  accounts: (id: string) => `services/bank/customers/${id}/accounts`,
  nonsense: `services/bank/this-should-404`,
} as const;

const client = new HttpClient({
  baseUrl: env.BANK_BASE_URL,
  // Cast to the branded Ms type: (number) & { __brand: "Ms" }
  defaultTimeoutMs: env.HEARTBEAT_TIMEOUT_MS as unknown as number & {
    readonly __brand: 'Ms';
  },
});

// Conversion for Product Owner summary
let okCustomerRead = false;
let okRouting404 = false;
let okVerbGuard = false;

async function getDiag(path: string) {
  const res = await client.get<unknown>(path);
  const status = res.status;
  const snippet = res.ok
    ? (typeof res.data === 'string' ? res.data : JSON.stringify(res.data)).slice(0, 140)
    : JSON.stringify(res.error).slice(0, 140);

  // Structured log (dev-friendly JSONL)
  logJsonLine({
    ts: new Date().toISOString(),
    baseUrl: env.BANK_BASE_URL,
    path,
    ok: res.ok,
    status,
    latencyMs: res.latencyMs ?? -1,
  });

  // Console line (for CI output)
  console.log(`[HB] GET ${path} -> ${status} in ${res.latencyMs ?? -1}ms :: ${snippet}`);
  return res;
}

describe('@critical API heartbeat', () => {
  it('Public-safe data: GET /customer (fallback to /accounts) within budget; minimally validate JSON when JSON', async () => {
    // Try public friendly endpoint first
    let res = await getDiag(routes.customer(env.BANK_CUSTOMER_ID));

    // If that still fails, try accounts
    if (!res.ok) {
      res = await getDiag(routes.accounts(env.BANK_CUSTOMER_ID));
    }

    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error(`[${res.error.code}] status ${res.status}`);

    expect(res.status).toBe(200);
    expect(res.latencyMs).toBeLessThanOrEqual(env.API_LATENCY_MS);

    // If JSON, validate lightly;. If XML/text, 200 + budget is enough for heartbeat
    if (typeof res.data !== 'string') {
      const cust = CustomerSchema.safeParse(res.data);
      const accs = AccountsResponseSchema.safeParse(res.data);
      const ok = cust.success || accs.success;
      expect(ok).toBe(true);
      if (!ok) throw new Error('API_CONTRACT_DRIFT: unexpected JSON shape');
    }

    okCustomerRead = true;
  });

  it('Negative: unknown route returns 404 (not 200)', async () => {
    const res = await getDiag(routes.nonsense);
    if (res.ok) throw new Error('Expected 404 but got 200 OK');
    expect(res.status).toBe(404);
    okRouting404 = true;
  });

  it('Negative: wrong method on a GET endpoint should not return 200', async () => {
    const res = await client.request<unknown>({
      path: routes.customer(env.BANK_CUSTOMER_ID),
      method: 'POST',
      body: { bogus: true },
    });
    if (res.ok) throw new Error('Expected non-200 for POST to a GET-only endpoint');
    expect((res.status ?? 0) >= 400).toBe(true);
    okVerbGuard = true;
  });
});

// Product Owner summary
afterAll(() => {
  const now = new Date();

  // Overall status header
  const failures: string[] = [];
  if (!okCustomerRead) failures.push('Customer read');
  if (!okRouting404) failures.push('404 routing');
  if (!okVerbGuard) failures.push('Verb guard');

  const allOk = failures.length === 0;
  const statusEmoji = allOk ? '✅' : '❌';
  const statusLine = allOk
    ? `# # ${statusEmoji} All heartbeat checks passed!`
    : `# # ${statusEmoji} ${failures.length} Heartbeat failures: ${failures.join(', ')}`;
  const brief = allOk
    ? 'API reachable, latency within budget, basic safety gates held.'
    : 'See failed checks below; service may be degraded or misconfigured.';

  const lines: string[] = [];

  lines.push('# Daily Heartbeat — Parabank Product Summary');
  lines.push('');
  lines.push(`**Status:** ${statusLine}`);
  lines.push(brief);
  lines.push('');
  lines.push(`**Run time:** ${now.toLocaleString()}  \n**Timestamp (UTC):** ${now.toISOString()}`);
  lines.push(`**Environment:** ${env.BANK_BASE_URL}`);
  lines.push('');
  lines.push('## Results');
  lines.push(`- Customer data can be read: **${okCustomerRead ? 'Works' : 'Failed'}**`);
  if (!okCustomerRead) {
    lines.push('  - *Implication:* The service may be down, protected, or too slow to respond.');
  }
  lines.push(`- Bad links are rejected (Not Found): **${okRouting404 ? 'Works' : 'Failed'}**`);
  if (!okRouting404) {
    lines.push('  - *Implication:* Routing may be misconfigured; real pages could be affected.');
  }
  lines.push(`- Wrong request types are blocked: **${okVerbGuard ? 'Works' : 'Failed'}**`);
  if (!okVerbGuard) {
    lines.push(
      '  - *Implication:* Safety rules at the API boundary may be off; risk of unintended changes.',
    );
  }
  lines.push('');
  lines.push('**Next steps:** Detailed logs have been shared with Devs.');

  writeSummary(lines.join('\n'));
});
