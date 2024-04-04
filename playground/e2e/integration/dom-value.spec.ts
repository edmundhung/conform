import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		messageType: form.getByLabel('message', { exact: true }),
		titleType: form.getByLabel('title', { exact: true }),
		message: form.getByLabel('Message', { exact: true }),
		title: form.getByLabel('Title', { exact: true }),
	};
}

async function runTest(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect.poll(playground.result).toEqual({
		value: {
			type: 'message',
			message: 'Hello',
		},
	});

	await fieldset.message.fill('Test');
	await expect.poll(playground.result).toEqual({
		value: {
			type: 'message',
			message: 'Test',
		},
	});

	await fieldset.titleType.click();
	await expect.poll(playground.result).toEqual({
		value: {
			type: 'title',
		},
	});

	await fieldset.title.pressSequentially('foobar');
	await expect.poll(playground.result).toEqual({
		value: {
			type: 'title',
			title: 'foobar',
		},
	});

	await fieldset.messageType.click();
	await expect.poll(playground.result).toEqual({
		value: {
			type: 'message',
			message: 'Hello',
		},
	});
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/dom-value');
		await runTest(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/dom-value?noClientValidate=yes');
		await runTest(page);
	});
});
