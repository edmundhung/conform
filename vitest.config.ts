import { defineConfig, TestProjectInlineConfiguration } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const defaultBrowsers = ['chromium', 'firefox', 'webkit'] as const;
const browsers = process.env.BROWSER
	? [process.env.BROWSER as (typeof defaultBrowsers)[number]]
	: [...defaultBrowsers];

export default defineConfig({
	test: {
		projects: [
			// legacy setup to be moved into the packages
			{
				test: {
					name: 'browser',
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }],
					},
					include: ['tests/*.spec.ts'],
				},
			},
			{
				test: {
					name: 'node',
					include: ['tests/conform-yup.spec.ts'],
					environment: 'node',
				},
			},
			...defineTests('conform-dom'),
			...defineTests('conform-react'),
			...defineTests('conform-zod'),
			...defineTests('conform-valibot'),
		],
	},
});

function defineTests(packageName: string): TestProjectInlineConfiguration[] {
	return [
		{
			test: {
				// We set the package name only as Vitest will use the browser name as a suffix
				name: packageName,
				browser: {
					enabled: true,
					headless: true,
					provider: playwright(),
					instances: browsers.map((browser) => ({ browser })),
				},
				// This covers both .browser.test.ts/tsx and .test.ts/tsx files
				include: [`packages/${packageName}/**/tests/**/*.test.{ts,tsx}`],
				exclude: [
					`**/node_modules/**`,
					`packages/${packageName}/**/tests/**/*.node.test.{ts,tsx}`,
				],
				testTimeout: process.env.CI ? 10_000 : 5_000,
			},
		},
		{
			test: {
				name: `${packageName} (node)`,
				environment: 'node',
				typecheck: {
					enabled: true,
					tsconfig: `./packages/${packageName}/tests/tsconfig.json`,
					include: [`packages/${packageName}/**/tests/**/*.test-d.ts`],
				},
				// This covers both .node.test.ts/tsx and .test.ts/tsx files
				include: [`packages/${packageName}/**/tests/**/*.test.{ts,tsx}`],
				exclude: [
					`**/node_modules/**`,
					`packages/${packageName}/**/tests/**/*.browser.test.{ts,tsx}`,
				],
				testTimeout: 1_000,
			},
		},
	];
}
