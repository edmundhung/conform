import { type Page, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);

	await playground.submit.click();

	await expect(playground.error).toHaveText(['Required']);

	await playground.container.locator('[name="answer"][value="b"]').click();
	await playground.submit.click();

	await expect(playground.error).toHaveText(['']);
	await expect(playground.submission).toHaveText(
		JSON.stringify(
			{
				intent: 'submit',
				payload: {
					answer: 'b',
				},
				error: {},
				value: {
					answer: 'b',
				},
			},
			null,
			2,
		),
	);
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/radio-buttons');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/radio-buttons?noClientValidate=yes');
		await runValidationScenario(page);
	});

	test('Form reset', async ({ page }) => {
		await page.goto('/radio-buttons');

		const playground = getPlayground(page);

		await playground.submit.click();
		await expect(playground.error).toHaveText(['Required']);

		await playground.reset.click();
		await expect(playground.error).toHaveText(['']);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/radio-buttons');
		await runValidationScenario(page);
	});
});
