import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		name: form.locator('[name="name"]'),
		message: form.locator('[name="message"]'),
		validateName: form.locator('button:text("Validate Name")'),
		validateMessage: form.locator('button:text("Validate Message")'),
	};
}

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(playground.error).toHaveText(['', '']);

	await fieldset.validateName.click();
	await expect(playground.error).toHaveText(['Name is required', '']);

	await fieldset.name.type('Conform');
	await fieldset.validateName.click();
	await expect(playground.error).toHaveText(['', '']);

	await fieldset.validateMessage.click();
	await expect(playground.error).toHaveText(['', 'Message is required']);

	await fieldset.message.type('A form validation library');
	await fieldset.validateMessage.click();
	await expect(playground.error).toHaveText(['', '']);

	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '']);

	await expect.poll(playground.result).toStrictEqual({
		status: 'success',
		initialValue: {
			name: 'Conform',
			message: 'A form validation library',
		},
		state: {
			validated: {
				name: true,
				message: true,
			},
		},
	});
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

		await fieldset.validateMessage.click();
		await expect(playground.error).toHaveText(['', 'Message is required']);

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
