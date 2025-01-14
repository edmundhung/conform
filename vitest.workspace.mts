import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	{
		test: {
			name: 'chromium',
			browser: {
				enabled: true,
				provider: 'playwright',
				name: 'chromium',
			},
			include: ['tests/*.spec.ts'],
		},
	},
	{
		test: {
			name: 'firefox',
			browser: {
				enabled: true,
				provider: 'playwright',
				name: 'firefox',
			},
			include: ['tests/*.spec.ts'],
		},
	},
	{
		test: {
			name: 'webkit',
			browser: {
				enabled: true,
				provider: 'playwright',
				name: 'webkit',
			},
			include: ['tests/*.spec.ts'],
		},
	},
	{
		test: {
			name: 'node',
			include: [
				'tests/conform-yup.spec.ts',
				'tests/conform-zod.spec.ts',
			],
			environment: 'node',
		},
	},
]);
