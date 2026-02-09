import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Look for test files in the "tests" directory, relative to this configuration file.
	testDir: 'tests',
	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,
	// Retry on CI only.
	retries: process.env.CI ? 2 : 0,
	// Opt out of parallel tests on CI.
	workers: process.env.CI ? 1 : undefined,
	// Reporter to use
	reporter: process.env.CI ? 'github' : undefined,
	use: {
		// Collect trace when retrying the failed test.
		trace: 'on-first-retry',
		// To avoid timezone issues
		timezoneId: 'UTC',
	},
	// Configure projects for major browsers.
	projects: [
		{
			name: 'chromium',
			use: devices['Desktop Chrome'],
		},

		{
			name: 'firefox',
			use: devices['Desktop Firefox'],
		},

		{
			name: 'webkit',
			use: devices['Desktop Safari'],
		},
	],
	// Run your local dev server before starting the tests.
	webServer: {
		command: 'pnpm run build && pnpm run preview --port 5678',
		port: 5678,
		reuseExistingServer: !process.env.CI,
	},
});
