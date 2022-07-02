import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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
			['Keyword is required', await getValidationMessage(page, 'category')],
			{
				useInnerText: true,
			},
		);

		await page.locator('input[name="keyword"]').type('co');
		await expect(page.locator('p')).toHaveText(
			[
				'Please fill in at least 3 characters',
				await getValidationMessage(page, 'category'),
			],
			{
				useInnerText: true,
			},
		);

		await page.locator('input[name="keyword"]').type('conform');
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
