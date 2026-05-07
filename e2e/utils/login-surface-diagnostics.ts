import type { Page, TestInfo } from '@playwright/test';

const DEFAULT_BASE_URL = 'https://parabank.parasoft.com/parabank';
const LOGIN_PANEL_SELECTOR = '#loginPanel, #leftPanel';
const USERNAME_SELECTOR = 'input[name="username"], input#username';
const PASSWORD_SELECTOR = 'input[name="password"], input#password';
const LOGIN_BUTTON_SELECTOR = 'input[value="Log In"], button:has-text("Log In")';
const BODY_SNIPPET_LIMIT = 500;

export interface LoginSurfaceDiagnostics {
  reason: string;
  timestamp: string;
  baseUrl: string;
  currentUrl: string;
  title: string;
  indexStatus: number | null;
  indexRequestError: string | null;
  loginPanelCount: number;
  usernameInputCount: number;
  passwordInputCount: number;
  loginButtonCount: number;
  knownParaBankErrorDetected: boolean;
  visibleErrorText: string;
  bodyTextSnippet: string;
}

interface CollectLoginSurfaceDiagnosticsOptions {
  reason?: string;
  baseUrl?: string;
}

function getBaseUrl(): string {
  return process.env.BANK_BASE_URL ?? DEFAULT_BASE_URL;
}

function normaliseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function safeCount(page: Page, selector: string): Promise<number> {
  try {
    return await page.locator(selector).count();
  } catch {
    return -1;
  }
}

async function safeTitle(page: Page): Promise<string> {
  try {
    return await page.title();
  } catch (error) {
    return `TITLE_UNAVAILABLE: ${errorMessage(error)}`;
  }
}

async function visibleErrorText(page: Page): Promise<string> {
  try {
    const text = await page.locator('.error:visible, [class*="error"]:visible').allTextContents();
    return normaliseWhitespace(text.join(' ')).slice(0, BODY_SNIPPET_LIMIT);
  } catch {
    return '';
  }
}

async function bodyTextSnippet(page: Page): Promise<string> {
  try {
    const text = await page.locator('body').innerText({ timeout: 1000 });
    return normaliseWhitespace(text).slice(0, BODY_SNIPPET_LIMIT);
  } catch (error) {
    return `BODY_TEXT_UNAVAILABLE: ${errorMessage(error)}`;
  }
}

async function indexStatus(
  page: Page,
  baseUrl: string,
): Promise<{ status: number | null; error: string | null }> {
  try {
    const response = await page.context().request.get(`${baseUrl}/index.htm`, {
      failOnStatusCode: false,
      timeout: 5000,
    });
    return { status: response.status(), error: null };
  } catch (error) {
    return { status: null, error: errorMessage(error) };
  }
}

export async function collectLoginSurfaceDiagnostics(
  page: Page,
  options: CollectLoginSurfaceDiagnosticsOptions = {},
): Promise<LoginSurfaceDiagnostics> {
  const baseUrl = options.baseUrl ?? getBaseUrl();
  const [title, index, loginPanelCount, usernameInputCount, passwordInputCount, loginButtonCount] =
    await Promise.all([
      safeTitle(page),
      indexStatus(page, baseUrl),
      safeCount(page, LOGIN_PANEL_SELECTOR),
      safeCount(page, USERNAME_SELECTOR),
      safeCount(page, PASSWORD_SELECTOR),
      safeCount(page, LOGIN_BUTTON_SELECTOR),
    ]);

  const [errors, body] = await Promise.all([visibleErrorText(page), bodyTextSnippet(page)]);
  const combinedText = `${errors} ${body}`.toLowerCase();

  return {
    reason: options.reason ?? 'login form did not render',
    timestamp: new Date().toISOString(),
    baseUrl,
    currentUrl: page.url(),
    title,
    indexStatus: index.status,
    indexRequestError: index.error,
    loginPanelCount,
    usernameInputCount,
    passwordInputCount,
    loginButtonCount,
    knownParaBankErrorDetected:
      combinedText.includes('an internal error has occurred') ||
      combinedText.includes('temporarily unavailable') ||
      combinedText.includes('error has occurred'),
    visibleErrorText: errors,
    bodyTextSnippet: body,
  };
}

export async function attachLoginSurfaceDiagnostics(
  page: Page,
  testInfo: TestInfo,
  options: CollectLoginSurfaceDiagnosticsOptions = {},
): Promise<LoginSurfaceDiagnostics> {
  const diagnostics = await collectLoginSurfaceDiagnostics(page, options);

  await testInfo.attach('login-surface-diagnostics', {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json',
  });

  return diagnostics;
}

export function formatLoginSurfaceUnavailableError(diagnostics: LoginSurfaceDiagnostics): string {
  const summary =
    diagnostics.indexStatus === null
      ? 'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: ParaBank login form did not render and /index.htm status was unavailable.'
      : 'UPSTREAM_LOGIN_SURFACE_UNAVAILABLE: ParaBank responded but the login form did not render.';

  return [
    summary,
    `currentUrl=${diagnostics.currentUrl}`,
    `indexStatus=${diagnostics.indexStatus ?? 'unavailable'}`,
    `title=${diagnostics.title || '(empty)'}`,
    `loginPanelCount=${diagnostics.loginPanelCount}`,
    `usernameInputCount=${diagnostics.usernameInputCount}`,
  ].join(' ');
}
