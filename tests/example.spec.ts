import { type Page, test, expect } from '@playwright/test';

async function getValidationMessage(page: Page, name: string): Promise<string> {
	return page
		.locator(`[name="${name}"]`)
		.evaluate<
			string,
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>((field) => field.validationMessage);
}

test.describe('Search Form', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/search');
	});

	test('validate user input properly', async ({ page }) => {
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('p')).toHaveText(
			['', await getValidationMessage(page, 'category')],
			{
				useInnerText: true,
			},
		);

		await page.locator('input[name="keyword"]').type('con');
		await expect(page.locator('p')).toHaveText(
			[
				'Please fill in at least 4 characters',
				await getValidationMessage(page, 'category'),
			],
			{
				useInnerText: true,
			},
		);

		await page.locator('input[name="keyword"]').type('form');
		await expect(page.locator('p')).toHaveText(
			['', await getValidationMessage(page, 'category')],
			{
				useInnerText: true,
			},
		);

		await page.locator('select[name="category"]').selectOption('book');
		await expect(page.locator('p')).toHaveText(['', ''], {
			useInnerText: true,
		});
	});
});
