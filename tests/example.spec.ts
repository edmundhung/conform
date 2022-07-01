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

test.describe('Search', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/search');
	});

	test('should work', async ({ page }) => {
		let url = page.url();

		await page.locator('button[type="submit"]').click();

		expect(page.url(), 'Submission should be blocked').toBe(url);

		let keywordError: string;
		let categoryError: string;

		[keywordError, categoryError] = await Promise.all([
			getValidationMessage(page, 'keyword'),
			getValidationMessage(page, 'category'),
		]);

		await expect(page.locator('p')).toHaveText([keywordError, categoryError], {
			useInnerText: true,
		});

		expect(keywordError).not.toBe('');
		expect(categoryError).not.toBe('');

		await page.locator('input[name="keyword"]').type('co');

		[keywordError, categoryError] = await Promise.all([
			getValidationMessage(page, 'keyword'),
			getValidationMessage(page, 'category'),
		]);

		await expect(page.locator('p')).toHaveText([keywordError, categoryError], {
			useInnerText: true,
		});

		expect(keywordError).not.toBe('');
		expect(categoryError).not.toBe('');

		await page.locator('input[name="keyword"]').type('conform');

		[keywordError, categoryError] = await Promise.all([
			getValidationMessage(page, 'keyword'),
			getValidationMessage(page, 'category'),
		]);

		await expect(page.locator('p')).toHaveText([keywordError, categoryError], {
			useInnerText: true,
		});

		expect(keywordError).toBe('');
		expect(categoryError).not.toBe('');

		await page.locator('select[name="category"]').selectOption('book');

		[keywordError, categoryError] = await Promise.all([
			getValidationMessage(page, 'keyword'),
			getValidationMessage(page, 'category'),
		]);

		await expect(page.locator('p')).toHaveText([keywordError, categoryError], {
			useInnerText: true,
		});

		expect(keywordError).toBe('');
		expect(categoryError).toBe('');
	});
});
