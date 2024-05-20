import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from './helpers';

function getFieldset(form: Locator) {
	return {
		options: form.getByLabel(/Option #[0-9]+/),
		addItem: form.getByRole('button', { name: 'Add item' }),
		addOption: form.getByRole('button', { name: 'Add option' }),
		deleteOption: form.getByRole('button', { name: 'Delete option' }),
	};
}

async function runTest(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(fieldset.options).toHaveCount(0);

	await fieldset.addItem.click();
	await expect(fieldset.options).toHaveCount(1);

	await fieldset.options.nth(0).fill('First');
	await fieldset.addOption.nth(0).click();
	await fieldset.options.nth(1).fill('Second');
	await fieldset.addOption.nth(0).click();
	await fieldset.options.nth(2).fill('Third');

	await expect(fieldset.options.nth(0)).toHaveValue('First');
	await expect(fieldset.options.nth(1)).toHaveValue('Second');
	await expect(fieldset.options.nth(2)).toHaveValue('Third');

	await fieldset.addItem.click();
	await expect(fieldset.options).toHaveCount(4);
	await expect(fieldset.options.nth(0)).toHaveValue('First');
	await expect(fieldset.options.nth(1)).toHaveValue('Second');
	await expect(fieldset.options.nth(2)).toHaveValue('Third');
	await expect(fieldset.options.nth(3)).toHaveValue('');

	await fieldset.options.nth(3).fill('Another item');
	await fieldset.deleteOption.nth(1).click();
	await expect(fieldset.options).toHaveCount(3);
	await expect(fieldset.options.nth(0)).toHaveValue('First');
	await expect(fieldset.options.nth(1)).toHaveValue('Third');
	await expect(fieldset.options.nth(2)).toHaveValue('Another item');
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/nested-list');
		await runTest(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/nested-list?noClientValidate=yes');
		await runTest(page);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/nested-list');
		await runTest(page);
	});
});
