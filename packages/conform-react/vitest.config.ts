import { fileURLToPath } from 'node:url';
import { defineConfig, defineProject } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const root = fileURLToPath(new URL('.', import.meta.url));

export const projects = [
	defineProject({
		root,
		optimizeDeps: {
			/**
			 * Prebundle the React dev JSX runtime so Vitest doesn't re-optimize it
			 * mid-run and reload large browser suites while they are being collected.
			 */
			include: ['react/jsx-dev-runtime'],
		},
		test: {
			name: 'conform-react',
			browser: {
				enabled: true,
				headless: true,
				provider: playwright(),
				api: 63317,
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
	}),
	defineProject({
		root,
		optimizeDeps: {
			include: ['react/jsx-dev-runtime'],
		},
		test: {
			name: 'conform-react (node)',
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
