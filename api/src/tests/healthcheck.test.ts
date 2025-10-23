// basic health check

import assert from 'assert';
import fetch, { Response } from 'node-fetch';

type GitHubAPIResponse = {
  current_user_url: string;
  [key: string]: unknown;
};

// ask GitHub API for data
async function runHealthCheck(): Promise<void> {
  const response: Response = await fetch('https://api.github.com');

  assert.strictEqual(response.status, 200, 'Did not get 200 response from API');

  // explicitly cast JSON output to expected shape
  const data = (await response.json()) as GitHubAPIResponse;

  assert.ok(data.current_user_url, 'Data not a core Github field');

  console.log('✅ Health check passed with code:', response.status);
}

runHealthCheck().catch((err: Error) => {
  console.error('❌ Health check failed with error message:', err.message);
  process.exit(1);
});
