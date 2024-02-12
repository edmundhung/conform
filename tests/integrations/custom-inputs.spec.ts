import { type Page, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

async function runTest(page: Page) {
	const playground = getPlayground(page);

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Color is required',
		'Languages is required',
		'Please accept the terms of service',
		'At least one option is required',
	]);

	await playground.reset.click();
	await expect(playground.error).toHaveText(['', '', '', '']);

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Color is required',
		'Languages is required',
		'Please accept the terms of service',
		'At least one option is required',
	]);

	await playground.container.getByText('Select a color').click();
	await playground.container.getByText('blue').click();
	await expect(playground.error).toHaveText([
		'',
		'Languages is required',
		'Please accept the terms of service',
		'At least one option is required',
	]);

	await playground.container.getByText('Select languages').click();
	await playground.container.getByText('French').click();
	await playground.container.getByText('Spanish').click();
	await playground.container.click();
	await expect(playground.error).toHaveText([
		'',
		'',
		'Please accept the terms of service',
		'At least one option is required',
	]);

	await playground.container.getByText('I accept the terms of service').click();
	await expect(playground.error).toHaveText([
		'',
		'',
		'',
		'At least one option is required',
	]);

	await playground.container.getByText('d', { exact: true }).click();
	await playground.container.getByText('b', { exact: true }).click();
	await expect(playground.error).toHaveText(['', '', '', '']);

	await playground.submit.click();
	await expect.poll(playground.result).toStrictEqual({
		status: 'success',
		initialValue: {
			color: 'blue',
			languages: expect.arrayContaining(['French', 'Spanish']),
			tos: 'on',
			options: expect.arrayContaining(['d', 'b']),
		},
		state: {
			validated: {
				color: true,
				languages: true,
				tos: true,
				options: true,
			},
		},
	});
}

test('Client Validation: useInputControl', async ({ page }) => {
	await page.goto('/custom-inputs');
	await runTest(page);
});

test('Server Validation: useInputControl', async ({ page }) => {
	await page.goto('/custom-inputs?noClientValidate=yes');
	await runTest(page);
});

test('Client Validation: useControl', async ({ page }) => {
	await page.goto('/custom-inputs?manualSetup=yes');
	await runTest(page);
});

test('Server Validation: useControl', async ({ page }) => {
	await page.goto('/custom-inputs?manualSetup=yes&noClientValidate=yes');
	await runTest(page);
});
