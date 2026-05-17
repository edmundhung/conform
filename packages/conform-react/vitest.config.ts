import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	root,
	optimizeDeps: {
		/**
		 * Prebundle the React dev JSX runtime so Vitest doesn't re-optimize it
		 * mid-run and reload large browser suites while they are being collected.
		 */
		include: ['react/jsx-dev-runtime'],
	},
	test: {
		projects: [
			{
				test: {
					name: 'conform-react',
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
					name: 'conform-react (node)',
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
