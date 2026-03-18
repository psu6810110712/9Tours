// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: 'on-first-retry',
  },
  webServer: process.env.CI ? undefined : [
    {
      command: 'npm --prefix backend run start:dev',
      url: 'http://127.0.0.1:3000/tours',
      reuseExistingServer: process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm --prefix frontend run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
