import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		name: form.locator('[name="name"]'),
		message: form.locator('[name="message"]'),
		validateName: form.locator('button:text("Validate Name")'),
		validateForm: form.locator('button:text("Validate Form")'),
	};
}

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(playground.error).toHaveText(['', '']);

	await fieldset.validateName.click();
	await expect(playground.error).toHaveText(['Name is required', '']);
	await expect(fieldset.name).toBeFocused();

	await fieldset.name.type('Conform');
	await fieldset.validateName.click();
	await expect(playground.error).toHaveText(['', '']);

	await fieldset.validateForm.click();
	await expect(playground.error).toHaveText(['', 'Message is required']);
	await expect(fieldset.message).toBeFocused();

	await fieldset.message.type('A form validation library');
	await fieldset.validateForm.click();
	await expect(playground.error).toHaveText(['', '']);

	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '']);
	await expect(playground.submission).toHaveText(
		JSON.stringify(
			{
				intent: 'submit',
				value: {
					name: 'Conform',
					message: 'A form validation library',
				},
				error: [],
			},
			null,
			2,
		),
	);
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/validate');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/validate?noClientValidate=yes');
		await runValidationScenario(page);
	});

	test('Form reset', async ({ page }) => {
		await page.goto('/validate');

		const playground = getPlayground(page);
		const fieldset = getFieldset(playground.container);

		await fieldset.validateName.click();
		await expect(playground.error).toHaveText(['Name is required', '']);

		await playground.reset.click();
		await expect(playground.error).toHaveText(['', '']);

		await fieldset.validateForm.click();
		await expect(playground.error).toHaveText([
			'Name is required',
			'Message is required',
		]);

		await playground.reset.click();
		await expect(playground.error).toHaveText(['', '']);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/validate');
		await runValidationScenario(page);
	});
});
