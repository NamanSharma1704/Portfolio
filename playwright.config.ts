import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for the production build (tests/smoke.spec.ts).
 *
 * Build first, then run: `npm run build && npm run test:e2e`. The tests start
 * `next start` themselves, or reuse one already on the port. For a build in
 * another folder, set NEXT_DIST_DIR as for the build.
 *
 * Locally, Chrome is the installed browser (no download). Firefox and WebKit
 * come from `npx playwright install firefox webkit`. On some Windows
 * machines Smart App Control refuses WebKit's unsigned build; the CI
 * workflow runs it on Linux instead (.github/workflows/smoke.yml).
 */

const PORT = Number(process.env.PORT ?? 3100);
const CI = Boolean(process.env.CI);

// The installed Chrome locally; Playwright's own Chromium in CI.
const chrome = CI ? {} : { channel: 'chrome' as const };

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: CI,
    retries: CI ? 1 : 0,
    reporter: CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
    },
    webServer: {
        command: `npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !CI,
        timeout: 60_000,
    },
    projects: [
        { name: 'chrome', use: { ...devices['Desktop Chrome'], ...chrome } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'phone', use: { ...devices['Pixel 7'], ...chrome } },
        { name: 'iphone', use: { ...devices['iPhone 15'] } },
    ],
});
