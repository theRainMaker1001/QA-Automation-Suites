// basic health check

import assert from 'assert';

type GitHubAPIResponse = {
  current_user_url: string;
  [key: string]: unknown; // allow extra keys without strict failure
};

// ask GitHub API for data
async function runHealthCheck(): Promise<void> {
  const response: Response = await fetch('https://api.github.com');

  // see if returns exactly 200 / ok
  assert.strictEqual(response.status, 200, 'Did not get 200 response from API');

  // convert body of reply to JS object
  const data: GitHubAPIResponse = await response.json();

  // check the returned data fits known shape
  assert.ok(data.current_user_url, 'Data not a core Github field');

  // confirm healthy run
  console.log('✅ Health check passed with code:', response.status);
}

// Run the above. If anything threw an error, mark the process as failed (for CI)
runHealthCheck().catch((err: Error) => {
  console.error('❌ Health check failed with error message:', err.message);
  process.exit(1); // ping CI with non-zero code so it fails / flags
});
