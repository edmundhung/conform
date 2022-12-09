import { type Page, test, expect } from '@playwright/test';

function getForm(page: Page) {
	return {
		baseInput: page.locator('[name="base-input"]'),
		nativeInput: page.locator('[name="native-input"]'),
		reset: page.locator('button:text("Reset")'),
		baseLogs: page.locator('ul#base-input > li'),
		nativeLogs: page.locator('ul#native-input > li'),
	};
}

test.beforeEach(async ({ page }) => {
	await page.goto('/base-input');
});

test.describe('BaseInput', () => {
	test('emits nothing on load', async ({ page }) => {
		const form = getForm(page);

		await expect(form.baseLogs).toHaveText(
			await form.nativeLogs.allInnerTexts(),
		);
		await expect(form.nativeLogs).toHaveText([]);
	});

	test('emits focus/blur event as native input', async ({ page }) => {
		const form = getForm(page);

		await form.nativeInput.focus();
		await expect(form.baseLogs).toHaveText(
			await form.nativeLogs.allInnerTexts(),
		);
		await expect(form.nativeLogs).toHaveText([
			'Capturing: focus',
			'Bubbling: focus',
		]);
	});
});
