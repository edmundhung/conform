import { defineConfig, TestProjectInlineConfiguration } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const defaultBrowsers = ['chromium', 'firefox', 'webkit'] as const;
const browsers = process.env.BROWSER
	? [process.env.BROWSER as (typeof defaultBrowsers)[number]]
	: [...defaultBrowsers];
const runMultipleBrowsers = browsers.length > 1;

if (runMultipleBrowsers) {
	// Multi-browser runs add enough process listeners through Vitest/Playwright
	// startup that Node's default limit warns even though this is expected here.
	process.setMaxListeners(20);
}

export default defineConfig({
	test: {
		deps: {
			optimizer: {
				client: {
					/**
					 * Prebundle the React dev JSX runtime so Vitest doesn't re-optimize it
					 * mid-run and reload large browser suites while they are being collected.
					 */
					include: ['react/jsx-dev-runtime'],
				},
			},
		},
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
			...defineTests('conform-dom', { browserApiPort: 63316 }),
			...defineTests('conform-react', { browserApiPort: 63317 }),
			...defineTests('conform-zod', { browserApiPort: 63318 }),
			...defineTests('conform-valibot', { browserApiPort: 63319 }),
		],
	},
});

function defineTests(
	packageName: string,
	options: {
		browserApiPort: number;
	},
): TestProjectInlineConfiguration[] {
	return [
		{
			test: {
				// We set the package name only as Vitest will use the browser name as a suffix
				name: packageName,
				browser: {
					enabled: true,
					headless: true,
					provider: playwright(
						runMultipleBrowsers ? { actionTimeout: 1_000 } : undefined,
					),
					api: options.browserApiPort,
					instances: browsers.map((browser) => ({ browser })),
				},
				// This covers both .browser.test.ts/tsx and .test.ts/tsx files
				include: [`packages/${packageName}/**/tests/**/*.test.{ts,tsx}`],
				exclude: [
					`**/node_modules/**`,
					`packages/${packageName}/**/tests/**/*.node.test.{ts,tsx}`,
				],
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
