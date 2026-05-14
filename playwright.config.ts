import { defineConfig, devices } from '@playwright/test';

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : { channel: 'msedge' }),
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        ...(process.env.CI ? {} : { channel: 'msedge' }),
      },
    },
    // WebKit/mobile Safari is intentionally not enabled in CI yet because this project
    // currently installs only Chromium browsers for faster, more stable checks.
  ],
  webServer: {
    command: process.env.CI
      ? 'npm run preview -- --host 127.0.0.1 --port 4173'
      : 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
  },
});
