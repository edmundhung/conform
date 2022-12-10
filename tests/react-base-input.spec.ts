import { type Page, type Locator, test, expect } from '@playwright/test';

async function getForm(page: Page, defaultValue?: string) {
	await page.goto(`/base-input?defaultValue=${defaultValue ?? ''}`);

	return {
		baseInput: page.locator('[name="base-input"]'),
		nativeInput: page.locator('[name="native-input"]'),
		reset: page.locator('button:text("Reset")'),
		baseLogs: page.locator('ul#base-input > li'),
		nativeLogs: page.locator('ul#native-input > li'),
	};
}

function createLog(type: string, eventPhase: number) {
	return JSON.stringify({
		eventPhase,
		type,
		bubbles: true,
		cancelable: false,
	});
}

async function expectToHaveSameTexts(
	baseLogs: Locator,
	nativeLogs: Locator,
): Promise<void> {
	const [base, native] = await Promise.all([
		baseLogs.allInnerTexts(),
		nativeLogs.allInnerTexts(),
	]);

	expect(base).toEqual(native);
}

test.describe.only('BaseInput', () => {
	test('emits nothing on load', async ({ page }) => {
		const form = await getForm(page);

		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([]);
	});

	test('emits events as native input', async ({ page }) => {
		const form = await getForm(page);

		await form.nativeInput.focus();
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
		]);

		await form.nativeInput.type('test');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
		]);

		await page.click('body');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('blur', 1),
			createLog('blur', 3),
		]);
	});

	test('works with keyboard events', async ({ page }) => {
		const form = await getForm(page);

		// Change event will be emitted first before the focus event
		// if we type without focus on webkit (headless mode only)
		// This might be a bug from playwright
		await form.nativeInput.focus();

		// Type 'abc'
		await form.nativeInput.type('abc');

		// Highlight 'c'
		await form.nativeInput.press('Shift+ArrowLeft');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
		]);

		// Cut out 'c'
		await form.nativeInput.press('Control+x');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
		]);

		// Paste the 'c' back
		await form.nativeInput.press('Control+v');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
		]);

		// Select all text
		await form.nativeInput.press('Control+a');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
		]);

		// Delete all text
		await form.nativeInput.press('Backspace');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('input', 3),
			createLog('change', 3),
		]);
	});

	test('works with reset event', async ({ page }) => {
		const form = await getForm(page, 'abc');

		await form.reset.click();
		await expect(form.nativeInput).toHaveValue('abc');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([]);

		await form.nativeInput.focus();
		await form.nativeInput.type('d');
		await form.reset.click();
		await expect(form.nativeInput).toHaveValue('abc');
		await expectToHaveSameTexts(form.baseLogs, form.nativeLogs);
		await expect(form.nativeLogs).toHaveText([
			createLog('focus', 1),
			createLog('focus', 3),
			createLog('input', 3),
			createLog('change', 3),
			createLog('blur', 1),
			createLog('blur', 3),
		]);
	});
});
