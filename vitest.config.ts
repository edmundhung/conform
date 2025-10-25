import { defineConfig, TestProjectInlineConfiguration } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		projects: [
			// legacy setup to be moved into the packages
			{
				test: {
					name: 'browser',
					browser: {
						enabled: true,
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
					instances: [{ browser: 'chromium' }],
				},
				// This covers both .browser.test.ts/tsx and .test.ts/tsx files
				include: [`packages/${packageName}/**/tests/**/*.test.{ts,tsx}`],
				exclude: [
					`**/node_modules/**`,
					`packages/${packageName}/**/tests/**/*.node.test.{ts,tsx}`,
				],
			},
		},
		{
			test: {
				name: `${packageName} (node)`,
				environment: 'node',
				typecheck: {
					enabled: true,
					tsconfig: `./packages/${packageName}/tsconfig.json`,
					include: [`packages/${packageName}/**/tests/**/*.test-d.ts`],
				},
				// This covers both .node.test.ts/tsx and .test.ts/tsx files
				include: [`packages/${packageName}/**/tests/**/*.test.{ts,tsx}`],
				exclude: [
					`**/node_modules/**`,
					`packages/${packageName}/**/tests/**/*.browser.test.{ts,tsx}`,
				],
			},
		},
	];
}
