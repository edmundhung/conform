import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		// All the possibile input type
		text: form.locator('[name="text"]'),
		email: form.locator('[name="email"]'),
		password: form.locator('[name="password"]'),
		url: form.locator('[name="url"]'),
		tel: form.locator('[name="tel"]'),
		search: form.locator('[name="search"]'),
		number: form.locator('[name="number"]'),
		checkbox: form.locator('[name="checkbox"]'),
		file: form.locator('[name="file"]'),
		files: form.locator('[name="files"]'),
	};
}

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'',
		'required',
		'required',
		'',
		'',
		'required',
		'required',
		'',
		'required',
		'',
	]);

	await fieldset.text.type('a');
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'minlength',
		'pattern',
		'required',
		'required',
		'',
		'',
		'required',
		'required',
		'',
		'required',
		'',
	]);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/validitystate');
});

test.describe.only('With JS', () => {
	test('validation', async ({ page }) => {
		await runValidationScenario(page);
	});
});

test.describe.only('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await runValidationScenario(page);
	});
});
