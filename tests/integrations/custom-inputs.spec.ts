import { type Page, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Language is required',
		'Please accept the terms of service',
	]);

	await playground.reset.click();
	await expect(playground.error).toHaveText(['', '']);

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Language is required',
		'Please accept the terms of service',
	]);

	await playground.container.getByText('Please select').click();
	await playground.container.getByText('Deutsch').click();
	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'',
		'Please accept the terms of service',
	]);

	await playground.container.getByText('I accept the terms of service').click();
	await playground.submit.click();

	await expect(playground.error).toHaveText(['', '']);

	await expect(playground.submission).toHaveText(
		JSON.stringify(
			{
				intent: 'submit',
				payload: {
					language: 'de',
					tos: 'on',
				},
				error: {},
			},
			null,
			2,
		),
	);
}

test('Client Validation', async ({ page }) => {
	await page.goto('/custom-inputs');
	await runValidationScenario(page);
});

test('Server Validation', async ({ page }) => {
	await page.goto('/custom-inputs?noClientValidate=yes');
	await runValidationScenario(page);
});
