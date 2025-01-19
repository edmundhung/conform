import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			provider: 'playwright',
			name: 'chromium',
			headless: true,
		},
		include: ['test/**/*.test.ts'],
	},
});
