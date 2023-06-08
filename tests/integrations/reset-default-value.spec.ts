import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		name: form.locator('[name="name"]'),
		code: form.locator('[name="code"]'),
	};
}

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.container.getByText('Red').click();

	await expect(fieldset.name).toHaveValue('Red');
	await expect(fieldset.code).toHaveValue('#ff0000');

	await playground.container.getByText('Green').click();

	await expect(fieldset.name).toHaveValue('Green');
	await expect(fieldset.code).toHaveValue('#00ff00');

	await playground.container.getByText('Blue').click();

	await expect(fieldset.name).toHaveValue('Blue');
	await expect(fieldset.code).toHaveValue('#0000ff');

	await fieldset.name.fill('Yellow');
	await playground.submit.click();

	await expect(playground.error).toHaveText(['', 'The color is invalid']);

	await expect(fieldset.name).toHaveValue('Yellow');
	await expect(fieldset.code).toHaveValue('#0000ff');

	await fieldset.name.fill('Red');
	await fieldset.code.fill('#ff0000');
	await playground.submit.click();

	await expect(fieldset.name).toHaveValue('Blue');
	await expect(fieldset.code).toHaveValue('#0000ff');
}

test.beforeEach(async ({ page }) => {
	await page.goto('/reset-default-value');
});

test.describe('With JS', () => {
	test('Validation', async ({ page }) => {
		await runValidationScenario(page);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await runValidationScenario(page);
	});
});
