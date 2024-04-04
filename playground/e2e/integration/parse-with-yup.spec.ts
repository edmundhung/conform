import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getUsernameInput(container: Locator) {
	return container.locator('[name="username"]');
}

async function runTest(page: Page) {
	const playground = getPlayground(page);
	const username = getUsernameInput(playground.container);

	await playground.submit.click();

	await expect(playground.error).toHaveText(['Username is required']);

	await username.type('@');
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Min. 5 characters',
		'At least 1 lowercase character',
		'At least 1 uppercase character',
		'At least 1 number',
	]);

	await username.press('Control+a');
	await username.press('ArrowRight');
	await username.type('C');

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Min. 5 characters',
		'At least 1 lowercase character',
		'At least 1 number',
	]);

	await username.press('Control+a');
	await username.press('ArrowRight');
	await username.type('on');
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Min. 5 characters',
		'At least 1 number',
	]);

	await username.press('Control+a');
	await username.press('ArrowRight');
	await username.type('form');
	await playground.submit.click();
	await expect(playground.error).toHaveText(['At least 1 number']);

	await username.press('Control+a');
	await username.press('ArrowRight');
	await username.type('2023');
	await playground.submit.click();
	await expect(playground.error).toHaveText(['']);
	await expect.poll(playground.result).toStrictEqual({
		status: 'success',
		initialValue: {
			username: '@Conform2023',
		},
		fields: ['username'],
	});
}

test.describe('Parse with yup', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/parse-with-yup');
		await runTest(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/parse-with-yup?noClientValidate=yes');
		await runTest(page);
	});
});

test('Form reset', async ({ page }) => {
	await page.goto('/parse-with-yup');

	const playground = getPlayground(page);
	const username = getUsernameInput(playground.container);

	await username.type('?');
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Min. 5 characters',
		'At least 1 lowercase character',
		'At least 1 uppercase character',
		'At least 1 number',
	]);

	await playground.reset.click();
	await expect(playground.error).toHaveText(['']);
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test.skip('Validation', async ({ page }) => {
		await page.goto('/parse-with-yup');
		await runTest(page);
	});
});
