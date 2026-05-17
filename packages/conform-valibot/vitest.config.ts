import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	root,
	test: {
		projects: [
			{
				test: {
					name: 'conform-valibot',
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						fileParallelism: false,
						instances: [
							{ browser: 'chromium' },
							{ browser: 'firefox' },
							{ browser: 'webkit' },
						],
					},
					include: ['**/tests/**/*.test.{ts,tsx}'],
					exclude: ['**/node_modules/**', '**/tests/**/*.node.test.{ts,tsx}'],
					testTimeout: process.env.CI ? 30_000 : 5_000,
					expect: {
						poll: {
							timeout: process.env.CI ? 10_000 : 1_000,
						},
					},
				},
			},
			{
				test: {
					name: 'conform-valibot (node)',
					environment: 'node',
					typecheck: {
						enabled: true,
						tsconfig: './tests/tsconfig.json',
						include: ['**/tests/**/*.test-d.ts'],
					},
					include: ['**/tests/**/*.test.{ts,tsx}'],
					exclude: [
						'**/node_modules/**',
						'**/tests/**/*.browser.test.{ts,tsx}',
					],
					testTimeout: 1_000,
				},
			},
		],
	},
});
