import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // One app at a time. Each launch has a profile of its own (support/launch.ts), but specs run side
  // by side failed under the load of two or three apps at once - hover cards, drags, file watches
  // (measured 2026-10-24, docs/e2e-design.md section 6.5) - so the suite stays serial for now.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // A test that passed only on its retry fails the run on CI rather than hiding there.
  failOnFlakyTests: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // reporter.ts: on a failure, whether an elecdex runs outside the tests (logged).
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['./tests/e2e/reporter.ts']]
    : [['list'], ['./tests/e2e/reporter.ts']],
  use: {
    trace: 'retain-on-failure',
  },
  // `npx playwright test` runs both: every test, then what measures the CPU (@perf) last, on a
  // machine the other tests have stopped loading. `--project=e2e` leaves the measuring out.
  projects: [
    { name: 'e2e', grepInvert: /@perf/ },
    { name: 'perf', grep: /@perf/, dependencies: ['e2e'] },
  ],
})
