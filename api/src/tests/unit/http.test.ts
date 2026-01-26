/**
 * Unit tests for HTTP client helper
 * Tests logic in isolation using mocked fetch — no network calls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, type Ms, type ApiError } from '../../helpers/http.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({
      baseUrl: 'https://api.example.com/v1',
      defaultHeaders: { 'X-Api-Key': 'test-key' },
      defaultTimeoutMs: 5000 as Ms,
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('URL building', () => {
    it('joins base URL and path correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1 }),
      });

      await client.get('/users/123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users/123',
        expect.any(Object),
      );
    });

    it('handles leading slashes in path', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await client.get('///accounts');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/accounts',
        expect.any(Object),
      );
    });

    it('appends query parameters correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve([]),
      });

      await client.get('/search', { q: 'test', limit: 10, active: true });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('active=true');
    });

    it('omits null and undefined query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve([]),
      });

      await client.get('/search', { q: 'test', filter: null, sort: undefined });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('q=test');
      expect(calledUrl).not.toContain('filter');
      expect(calledUrl).not.toContain('sort');
    });
  });

  describe('headers', () => {
    it('merges default headers with request headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await client.request({
        path: '/test',
        headers: { 'X-Custom': 'value' },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers).toMatchObject({
        'X-Api-Key': 'test-key',
        'X-Custom': 'value',
      });
    });

    it('request headers override default headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await client.request({
        path: '/test',
        headers: { 'X-Api-Key': 'override-key' },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['X-Api-Key']).toBe('override-key');
    });

    it('adds content-type header when body is present', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1 }),
      });

      await client.request({
        path: '/users',
        method: 'POST',
        body: { name: 'Test' },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['content-type']).toBe('application/json');
    });
  });

  describe('response handling', () => {
    it('returns ok:true with data on successful JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1, name: 'Test' }),
      });

      const result = await client.get<{ id: number; name: string }>('/users/1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ id: 1, name: 'Test' });
        expect(result.status).toBe(200);
        expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns text for non-JSON content types', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('Hello World'),
      });

      const result = await client.get<string>('/health');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('Hello World');
      }
    });
  });

  describe('error handling', () => {
    it('returns STATUS error for non-2xx responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await client.get('/notfound');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('STATUS');
        expect(result.status).toBe(404);
        expect(result.error.message).toContain('404');
      }
    });

    it('returns INVALID_JSON error when JSON parsing fails', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await client.get('/bad-json');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_JSON');
      }
    });

    it('returns NETWORK error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network unavailable'));

      const result = await client.get('/unreachable');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK');
        expect(result.error.message).toContain('Network unavailable');
      }
    });

    it('returns TIMEOUT error on abort', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await client.get('/slow');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT');
      }
    });
  });

  describe('method handling', () => {
    it('defaults to GET method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await client.request({ path: '/test' });

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('GET');
    });

    it('uses specified method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: () => Promise.resolve(''),
      });

      await client.request({ path: '/users/1', method: 'DELETE' });

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('DELETE');
    });

    it('serializes body as JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1 }),
      });

      await client.request({
        path: '/users',
        method: 'POST',
        body: { name: 'Test', email: 'test@example.com' },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.body).toBe('{"name":"Test","email":"test@example.com"}');
    });
  });
});
