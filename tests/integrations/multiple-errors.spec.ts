import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getUsernameInput(container: Locator) {
	return container.locator('[name="username"]');
}

async function runValidationScenario(page: Page) {
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
	await expect(playground.submission).toHaveText(
		JSON.stringify(
			{
				intent: 'submit',
				payload: {
					username: '@Conform2023',
				},
				error: {},
			},
			null,
			2,
		),
	);
}

test.describe('Custom Validation', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/multiple-errors');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/multiple-errors?noClientValidate=yes');
		await runValidationScenario(page);
	});
});

test.describe('Zod', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/multiple-errors?validator=zod');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/multiple-errors?validator=zod&noClientValidate=yes');
		await runValidationScenario(page);
	});
});

test.describe('Yup', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/multiple-errors?validator=yup');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/multiple-errors?validator=yup&noClientValidate=yes');
		await runValidationScenario(page);
	});
});

test('Form reset', async ({ page }) => {
	await page.goto('/multiple-errors');

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

	test('Custom Validation', async ({ page }) => {
		await page.goto('/multiple-errors');
		await runValidationScenario(page);
	});

	test('Zod', async ({ page }) => {
		await page.goto('/multiple-errors?validator=zod');
		await runValidationScenario(page);
	});

	test('Yup', async ({ page }) => {
		await page.goto('/multiple-errors?validator=yup');
		await runValidationScenario(page);
	});
});
