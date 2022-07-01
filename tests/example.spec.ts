import { test, expect } from '@playwright/test';

test.describe('Search', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/search');
	});

	test('should work', async ({ page, browserName }) => {
		const url = page.url();

		await page.locator('button[type="submit"]').click();

		expect(page.url(), 'Submission should be blocked').toBe(url);

		const error = {
			keywordValueMissing: '',
			keywordTooShort: '',
			categoryValueMissing: '',
		};

		switch (browserName) {
			case 'chromium':
				error.keywordValueMissing = 'Please fill in this field.';
				error.keywordTooShort =
					'Please lengthen this text to 3 characters or more (you are currently using 2 characters).';
				error.categoryValueMissing = 'Please select an item in the list.';
				break;
			case 'firefox':
				error.keywordValueMissing = 'Please fill out this field.';
				error.keywordTooShort =
					'Please use at least 3 characters (you are currently using 2 characters).';
				error.categoryValueMissing = 'Please select an item in the list.';
				break;
			case 'webkit':
				error.keywordValueMissing = 'Fill out this field';
				error.keywordTooShort = 'Use at least 3 characters';
				error.categoryValueMissing = 'Select an item in the list';
				break;
		}

		await expect(
			page.locator('p'),
			'Both fields should be reported as value missing',
		).toHaveText([error.keywordValueMissing, error.categoryValueMissing], {
			useInnerText: true,
		});

		await page.locator('input[name="keyword"]').type('co');
		await expect(
			page.locator('p'),
			'Keyword should be reported as too short',
		).toHaveText([error.keywordTooShort, error.categoryValueMissing], {
			useInnerText: true,
		});

		await page.locator('input[name="keyword"]').type('conform');
		await expect(page.locator('p'), 'Keyword should now be valid').toHaveText(
			['', error.categoryValueMissing],
			{
				useInnerText: true,
			},
		);

		await page.locator('select[name="category"]').selectOption('book');
		await expect(page.locator('p'), 'Category should now be valid').toHaveText(
			['', ''],
			{
				useInnerText: true,
			},
		);
	});
});
