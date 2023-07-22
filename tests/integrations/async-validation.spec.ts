import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		email: form.locator('[name="email"]'),
		title: form.locator('[name="title"]'),
	};
}

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await page.route('**', (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const body = request.postData();
		const headers = request.headers();

		if (
			request.method() !== 'POST' ||
			!url.searchParams.has('_data') ||
			!body ||
			headers['content-type'] !== 'application/x-www-form-urlencoded'
		) {
			return route.continue();
		}

		const value = Object.fromEntries(new URLSearchParams(body));

		// When validting the email field
		if (
			value['__intent__'] === 'validate/email' &&
			[
				'hey@conform.gu',
				'hey@conform.gui',
				'hey@conform.guid',
				'hey@conform.guide',
			].includes(value.email)
		) {
			return route.continue();
		}

		// When clicking on the submit button
		if (typeof value['__intent__'] === 'undefined') {
			return route.continue();
		}

		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				payload: {},
				error: [['', 'Request forbidden']],
			}),
		});
	});

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is required',
		'Title is required',
	]);

	await fieldset.email.type('hey@conform.g');
	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Title is required',
	]);

	await fieldset.email.press('Control+a');
	await fieldset.email.press('ArrowRight');
	await fieldset.email.type('u');
	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is already used',
		'Title is required',
	]);

	await fieldset.email.press('Control+a');
	await fieldset.email.press('ArrowRight');
	await fieldset.email.type('i');
	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is already used',
		'Title is required',
	]);

	await fieldset.email.press('Control+a');
	await fieldset.email.press('ArrowRight');
	await fieldset.email.type('d');
	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is already used',
		'Title is required',
	]);

	await fieldset.title.type('Software Developer');
	await playground.submit.click();

	await expect(playground.error).toHaveText(['Email is already used', '']);

	await fieldset.email.press('Control+a');
	await fieldset.email.press('ArrowRight');
	await fieldset.email.type('e');
	await playground.submit.click();

	await expect(playground.error).toHaveText(['', '']);

	await expect(playground.submission).toHaveText(
		JSON.stringify(
			{
				intent: 'submit',
				payload: {
					email: 'hey@conform.guide',
					title: 'Software Developer',
				},
				error: {},
			},
			null,
			2,
		),
	);
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/async-validation');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/async-validation?noClientValidate=yes');
		await runValidationScenario(page);
	});

	test('Form reset', async ({ page }) => {
		await page.goto('/async-validation');

		const playground = getPlayground(page);
		const fieldset = getFieldset(playground.container);

		await fieldset.email.type('hello@world.test');
		await playground.submit.click();
		// This check is intentional to verify how Conform
		// handles VALIDATION_UNDEFINED on submit
		await expect(playground.error).toHaveText([
			'Email is already used',
			'Title is required',
		]);

		await fieldset.email.type('abcd');
		await expect(playground.error).toHaveText([
			'Email is already used',
			'Title is required',
		]);

		await playground.reset.click();
		await expect(playground.error).toHaveText(['', '']);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/async-validation');
		await runValidationScenario(page);
	});
});
