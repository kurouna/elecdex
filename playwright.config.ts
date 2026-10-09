import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // Electron app instances are heavyweight and share a single userData dir.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // reporter.ts: on a failure, whether an elecdex runs outside the tests (logged).
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['./tests/e2e/reporter.ts']]
    : [['list'], ['./tests/e2e/reporter.ts']],
  use: {
    trace: 'retain-on-failure',
  },
})
