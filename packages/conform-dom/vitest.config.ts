import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			headless: true,
			provider: 'playwright',
			name: 'chromium',
		},
		include: ['tests/*.test.ts'],
	},
});
