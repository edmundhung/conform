import { fileURLToPath } from 'node:url';
import { defineConfig, defineProject } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const root = fileURLToPath(new URL('.', import.meta.url));

export const projects = [
	defineProject({
		root,
		test: {
			name: 'conform-zod',
			browser: {
				enabled: true,
				headless: true,
				provider: playwright(),
				api: 63318,
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
		test: {
			name: 'conform-zod (node, zod v3)',
			environment: 'node',
			typecheck: {
				enabled: true,
				tsconfig: './v3/tests/tsconfig.json',
				include: ['v3/tests/types.test-d.ts'],
			},
			include: [
				'default/tests/**/*.test.{ts,tsx}',
				'v3/tests/**/*.test.{ts,tsx}',
			],
			exclude: ['**/node_modules/**', '**/tests/**/*.browser.test.{ts,tsx}'],
			testTimeout: 1_000,
		},
	}),
	defineProject({
		root,
		test: {
			name: 'conform-zod (node, zod v4)',
			environment: 'node',
			typecheck: {
				enabled: true,
				tsconfig: './v4/tests/tsconfig.json',
				include: ['v4/tests/types.test-d.ts'],
			},
			include: ['v4/tests/**/*.test.{ts,tsx}'],
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
