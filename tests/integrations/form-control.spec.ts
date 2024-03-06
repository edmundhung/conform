import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		name: form.locator('[name="name"]'),
		message: form.locator('[name="message"]'),
		number: form.locator('[name="number"]'),
		validateForm: form.locator('button:text("Validate Form")'),
		validateMessage: form.locator('button:text("Validate Message")'),
		updateMessage: form.locator('button:text("Update message")'),
		updateNumber: form.locator('button:text("Update number")'),
		clearMessage: form.locator('button:text("Clear message")'),
		resetMessage: form.locator('button:text("Reset message")'),
		resetForm: form.locator('button:text("Reset form")'),
		resetNumberWithMessageUpdated: form.locator(
			'button:text("Reset number with message updated")',
		),
	};
}

async function runTest(
	page: Page,
	options: {
		clientValidate?: boolean;
	} = {},
) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(playground.error).toHaveText(['', '', '']);

	await fieldset.validateMessage.click();
	await expect(playground.error).toHaveText(['', 'Message is required', '']);

	await fieldset.updateMessage.click();
	await expect(fieldset.name).toHaveValue('');
	await expect(fieldset.message).toHaveValue('Hello World');
	await expect(playground.error).toHaveText(['', '', '']);

	await fieldset.clearMessage.click();
	await expect(fieldset.name).toHaveValue('');
	await expect(fieldset.message).toHaveValue('');
	await expect(playground.error).toHaveText(['', 'Message is required', '']);

	await fieldset.resetMessage.click();
	await expect(fieldset.name).toHaveValue('');
	await expect(fieldset.message).toHaveValue('');
	await expect(playground.error).toHaveText(['', '', '']);

	await fieldset.updateNumber.click();
	await expect(fieldset.number).toHaveValue('123');

	await fieldset.validateForm.click();
	await expect(playground.error).toHaveText([
		'Name is required',
		'Message is required',
		'',
	]);

	await fieldset.resetForm.click();
	await expect(fieldset.name).toHaveValue('');
	await expect(fieldset.number).toHaveValue('');
	await expect(fieldset.message).toHaveValue('');
	await expect(playground.error).toHaveText(['', '', '']);

	if (options.clientValidate) {
		await fieldset.number.fill('123');
		await expect.poll(playground.result).toStrictEqual({
			number: '123',
		});

		await fieldset.resetNumberWithMessageUpdated.click();
		await expect(fieldset.number).toHaveValue('');
		await expect(fieldset.message).toHaveValue('Hello World');
		await expect.poll(playground.result).toStrictEqual({
			message: 'Hello World',
		});
	}
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/form-control');
		await runTest(page, {
			clientValidate: true,
		});
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/form-control?noClientValidate=yes');
		await runTest(page);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/form-control');
		await runTest(page);
	});
});
