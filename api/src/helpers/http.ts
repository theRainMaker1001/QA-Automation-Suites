
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiError {
  code: 'NETWORK' | 'TIMEOUT' | 'STATUS' | 'INVALID_JSON' | 'SCHEMA' | 'UNEXPECTED';
  message: string;
  details?: unknown;
};

export type Result<Ok, Err = ApiError> =
  | { ok: true; data: Ok; status: number; latencyMs: number }
  | { ok: false; error: Err; status?: number; latencyMs?: number };

export type Ms = number & { readonly __brand: 'Ms' };

export interface RequestOptions {
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  method?: HttpMethod;
  timeoutMs?: Ms;
  body?: unknown;
};

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeoutMs?: Ms;
};

export class HttpClient {
  constructor(private readonly cfg: HttpClientConfig) {}

  private buildUrl(path: string, query?: RequestOptions['query']) {
    // Preserve any base path (e.g., /parabank) and append our route safely
    const base = new URL(this.cfg.baseUrl);
    const rel = path.replace(/^\/+/, '');
    base.pathname = `${base.pathname.replace(/\/+$/, '')}/${rel}`;
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        base.searchParams.set(k, String(v));
      }
    }
    return base.toString();
  };

  async request<T = unknown>(opts: RequestOptions): Promise<Result<T>> {
    const method = (opts.method ?? 'GET') as HttpMethod;
    const url = this.buildUrl(opts.path, opts.query);
    const timeoutMs = opts.timeoutMs ?? this.cfg.defaultTimeoutMs ?? (10_000 as Ms);

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    const started = performance.now();

    try {
      const res = await fetch(url, {
        method,
        headers: {
          accept: 'application/json, text/plain, */*',
          ...(opts.body ? { 'content-type': 'application/json' } : {}),
          ...(this.cfg.defaultHeaders ?? {}),
          ...(opts.headers ?? {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      const latencyMs = Math.round(performance.now() - started);

      if (!res.ok) {
        return {
          ok: false,
          error: { code: 'STATUS', message: `HTTP ${res.status} for ${method} ${url}` },
          status: res.status,
          latencyMs,
        };
      }

      const contentType = res.headers.get('content-type') ?? '';
      let data: unknown;
      try {
        data = contentType.includes('application/json') ? await res.json() : await res.text();
      } catch (e) {
        return {
          ok: false,
          error: { code: 'INVALID_JSON', message: 'Response is not valid JSON', details: e },
          status: res.status,
          latencyMs,
        };
      }

      return { ok: true, data: data as T, status: res.status, latencyMs };
    } catch (e: any) {
      const latencyMs = Math.round(performance.now() - started);
      const code: ApiError['code'] = e?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK';
      return { ok: false, error: { code, message: e?.message ?? 'Network/Timeout', details: e }, latencyMs };
    } finally {
      clearTimeout(to);
    }
  }

  get<T = unknown>(path: string, query?: RequestOptions['query'], opts?: Omit<RequestOptions, 'path' | 'query' | 'method'>) {
    return this.request<T>({ path, query, method: 'GET', ...(opts ?? {}) });
  }
};
