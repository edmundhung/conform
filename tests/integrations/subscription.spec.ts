import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		logs: form.locator('li'),
		name: form.locator('[name="name"]'),
		message: form.locator('[name="message"]'),
		resetMessage: form.locator('button:text("Reset message")'),
	};
}

async function runTest(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 1',
		'form.key: 1',
		'form.dirty: 1',
		'form.valid: 1',
		'form.errors: 1',
		'form.allErrors: 1',
		'name.initialValue: 1',
		'name.value: 1',
		'name.key: 1',
		'name.dirty: 1',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 1',
		'message.key: 1',
		'message.dirty: 1',
		'message.valid: 1',
		'message.errors: 1',
	]);

	await fieldset.name.pressSequentially('Edmund');
	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 7',
		'form.key: 1',
		'form.dirty: 2',
		'form.valid: 1',
		'form.errors: 1',
		'form.allErrors: 1',
		'name.initialValue: 1',
		'name.value: 7',
		'name.key: 1',
		'name.dirty: 2',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 1',
		'message.key: 1',
		'message.dirty: 1',
		'message.valid: 1',
		'message.errors: 1',
	]);

	await playground.submit.click();
	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 7',
		'form.key: 1',
		'form.dirty: 2',
		'form.valid: 2',
		'form.errors: 1',
		'form.allErrors: 2',
		'name.initialValue: 1',
		'name.value: 7',
		'name.key: 1',
		'name.dirty: 2',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 1',
		'message.key: 1',
		'message.dirty: 1',
		'message.valid: 2',
		'message.errors: 2',
	]);

	await fieldset.message.pressSequentially('How are you?');
	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 19',
		'form.key: 1',
		'form.dirty: 2',
		'form.valid: 2',
		'form.errors: 1',
		'form.allErrors: 2',
		'name.initialValue: 1',
		'name.value: 7',
		'name.key: 1',
		'name.dirty: 2',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 13',
		'message.key: 1',
		'message.dirty: 2',
		'message.valid: 2',
		'message.errors: 2',
	]);

	await playground.submit.click();
	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 19',
		'form.key: 1',
		'form.dirty: 2',
		'form.valid: 2',
		'form.errors: 2',
		'form.allErrors: 3',
		'name.initialValue: 1',
		'name.value: 7',
		'name.key: 1',
		'name.dirty: 2',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 13',
		'message.key: 1',
		'message.dirty: 2',
		'message.valid: 3',
		'message.errors: 3',
	]);

	await fieldset.resetMessage.click();
	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 20',
		'form.key: 1',
		'form.dirty: 2',
		'form.valid: 3',
		'form.errors: 3',
		'form.allErrors: 4',
		'name.initialValue: 1',
		'name.value: 7',
		'name.key: 1',
		'name.dirty: 2',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 14',
		'message.key: 2',
		'message.dirty: 3',
		'message.valid: 3',
		'message.errors: 3',
	]);

	await playground.reset.click();
	await expect(fieldset.logs).toHaveText([
		'form.initialValue: 1',
		'form.value: 21',
		'form.key: 2',
		'form.dirty: 3',
		'form.valid: 3',
		'form.errors: 3',
		'form.allErrors: 4',
		'name.initialValue: 1',
		'name.value: 8',
		'name.key: 2',
		'name.dirty: 3',
		'name.valid: 1',
		'name.errors: 1',
		'message.initialValue: 1',
		'message.value: 14',
		'message.key: 3',
		'message.dirty: 3',
		'message.valid: 3',
		'message.errors: 3',
	]);
}
test.describe('Subscription', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/subscription');
		await runTest(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/subscription?noClientValidate=yes');
		await runTest(page);
	});
});
