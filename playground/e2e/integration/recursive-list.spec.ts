import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		name: form.getByLabel('Name'),
		add: form.getByRole('button', { name: 'Add' }),
		delete: form.getByRole('button', { name: 'Delete' }),
	};
}

async function runTest(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(fieldset.name).toHaveCount(1);

	await fieldset.add.click();
	await expect(fieldset.name).toHaveCount(3);

	await fieldset.name.nth(0).fill('First');
	await fieldset.name.nth(1).fill('Second');
	await fieldset.name.nth(2).fill('Third');

	// Fix #493: To test if the value are persisted after adding a new field on a nested list
	await fieldset.add.nth(1).click();
	await expect(fieldset.name.nth(0)).toHaveValue('First');
	await expect(fieldset.name.nth(1)).toHaveValue('Second');
	await expect(fieldset.name.nth(2)).toHaveValue('Third');
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/recursive-list');
		await runTest(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/recursive-list?noClientValidate=yes');
		await runTest(page);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/recursive-list');
		await runTest(page);
	});
});
