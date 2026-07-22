import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : undefined,
	use: {
		trace: 'on-first-retry',
		timezoneId: 'UTC',
	},
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
	webServer: {
		command: 'pnpm run build && pnpm run preview --port 4176',
		port: 4176,
		reuseExistingServer: !process.env.CI,
	},
});
