import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		projects: [
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
		],
	},
});
