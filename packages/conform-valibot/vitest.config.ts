import { fileURLToPath } from 'node:url';
import { defineConfig, defineProject } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const defaultBrowsers = ['chromium', 'firefox', 'webkit'] as const;
const browsers = process.env.BROWSER
	? [process.env.BROWSER as (typeof defaultBrowsers)[number]]
	: [...defaultBrowsers];
const runMultipleBrowsers = browsers.length > 1;
const root = fileURLToPath(new URL('.', import.meta.url));

export const projects = [
	defineProject({
		root,
		test: {
			name: 'conform-valibot',
			browser: {
				enabled: true,
				headless: true,
				provider: playwright(
					runMultipleBrowsers ? { actionTimeout: 1_000 } : undefined,
				),
				api: 63319,
				fileParallelism: false,
				instances: browsers.map((browser) => ({ browser })),
			},
			include: ['**/tests/**/*.test.{ts,tsx}'],
			exclude: ['**/node_modules/**', '**/tests/**/*.node.test.{ts,tsx}'],
			testTimeout: process.env.CI
				? 30_000
				: runMultipleBrowsers
					? 15_000
					: 5_000,
			expect: {
				poll: {
					timeout: process.env.CI
						? 10_000
						: runMultipleBrowsers
							? 5_000
							: 1_000,
				},
			},
		},
	}),
	defineProject({
		root,
		test: {
			name: 'conform-valibot (node)',
			environment: 'node',
			typecheck: {
				enabled: true,
				tsconfig: './tests/tsconfig.json',
				include: ['**/tests/**/*.test-d.ts'],
			},
			include: ['**/tests/**/*.test.{ts,tsx}'],
			exclude: ['**/node_modules/**', '**/tests/**/*.browser.test.{ts,tsx}'],
			testTimeout: 1_000,
		},
	}),
];

export default defineConfig({
	test: {
		projects,
	},
});
