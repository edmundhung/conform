import { type Page, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);

	await playground.submit.click();

	await expect(playground.error).toHaveText(['Required', 'Required']);

	await playground.container.getByLabel('Y').click();
	await playground.submit.click();

	await expect(playground.error).toHaveText(['', 'Required']);

	await playground.container.getByLabel('C').click();
	await playground.submit.click();

	await expect(playground.error).toHaveText(['', '']);
	await expect.poll(playground.result).toStrictEqual({
		status: 'success',
		initialValue: {
			singleChoice: 'y',
			multipleChoice: 'c',
		},
		state: {
			validated: {
				singleChoice: true,
				multipleChoice: true,
			},
		},
	});

	await playground.container.getByLabel('A').click();
	await playground.submit.click();

	await expect(playground.error).toHaveText(['', '']);
	await expect.poll(playground.result).toStrictEqual({
		status: 'success',
		initialValue: {
			singleChoice: 'y',
			multipleChoice: ['a', 'c'],
		},
		state: {
			validated: {
				singleChoice: true,
				multipleChoice: true,
			},
		},
	});
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/collection');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/collection?noClientValidate=yes');
		await runValidationScenario(page);
	});

	test('Form reset', async ({ page }) => {
		await page.goto('/collection');

		const playground = getPlayground(page);

		await playground.submit.click();
		await expect(playground.error).toHaveText(['Required', 'Required']);

		await playground.reset.click();
		await expect(playground.error).toHaveText(['', '']);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/collection');
		await runValidationScenario(page);
	});
});
