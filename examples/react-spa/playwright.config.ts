import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : undefined,
	use: {
		baseURL: 'http://127.0.0.1:4175',
		trace: 'on-first-retry',
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
		command: 'pnpm run build && pnpm run preview --host 127.0.0.1 --port 4175',
		port: 4175,
		reuseExistingServer: !process.env.CI,
		timeout: 30_000,
	},
});
