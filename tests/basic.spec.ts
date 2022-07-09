import { type Page, type Locator, test, expect } from '@playwright/test';

function getPlaygroundLocator(page: Page, title: string): Locator {
	return page.locator(`[data-playground="${title}"]`);
}

async function clickSubmitButton(playground: Locator): Promise<void> {
	return playground.locator('button[type="submit"]').click();
}

async function getValidationMessage(field: Locator): Promise<string> {
	return field.evaluate<
		string,
		HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
	>((field) => field.validationMessage);
}

async function getErrorMessages(playground: Locator): Promise<string[]> {
	return playground.locator('label > p').allInnerTexts();
}

async function getConstraint(field: Locator) {
	return field.evaluate((input: HTMLInputElement) => ({
		required: input.required,
		minLength: input.minLength,
		maxLength: input.maxLength,
		min: input.min,
		max: input.max,
		step: input.step,
		multiple: input.multiple,
		pattern: input.pattern,
	}));
}

async function getFormResult(playground: Locator): Promise<unknown> {
	const result = await playground.locator('pre').innerText();
	const data = JSON.parse(result);

	return data;
}

test.beforeEach(async ({ page }) => {
	await page.goto('/basic');
});

test.describe('Native Constraint', () => {
	test('configure all input fields correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const [email, password, age] = await Promise.all([
			getConstraint(playground.locator('[name="email"]')),
			getConstraint(playground.locator('[name="password"]')),
			getConstraint(playground.locator('[name="age"]')),
		]);

		expect({ email, password, age }).toEqual({
			email: {
				required: true,
				minLength: -1,
				maxLength: -1,
				min: '',
				max: '',
				step: '',
				multiple: false,
				pattern: '',
			},
			password: {
				required: true,
				minLength: 8,
				maxLength: 20,
				min: '',
				max: '',
				step: '',
				multiple: false,
				pattern: '[0-9a-zA-Z]{8,20}',
			},
			age: {
				required: false,
				minLength: -1,
				maxLength: -1,
				min: '1',
				max: '100',
				step: '10',
				multiple: false,
				pattern: '',
			},
		});
	});

	test('report error message provided by the browser vendor', async ({
		page,
	}) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const email = playground.locator('[name="email"]');
		const password = playground.locator('[name="password"]');
		const age = playground.locator('[name="age"]');

		await clickSubmitButton(playground);

		expect(await getErrorMessages(playground)).toEqual(
			await Promise.all([
				getValidationMessage(email),
				getValidationMessage(password),
				getValidationMessage(age),
			]),
		);

		await email.type('me@edmund.dev');
		expect(await getErrorMessages(playground)).toEqual(
			await Promise.all([
				'',
				getValidationMessage(password),
				getValidationMessage(age),
			]),
		);

		await password.type('conform!');
		expect(await getErrorMessages(playground)).toEqual(
			await Promise.all([
				'',
				getValidationMessage(password),
				getValidationMessage(age),
			]),
		);

		await password.fill('');
		await password.type('constraintvalidation');
		expect(await getErrorMessages(playground)).toEqual(
			await Promise.all(['', '', getValidationMessage(age)]),
		);

		await age.type('9');
		expect(await getErrorMessages(playground)).toEqual(
			await Promise.all(['', '', getValidationMessage(age)]),
		);

		await age.type('1'); // 9 -> 91
		expect(await getErrorMessages(playground)).toEqual(['', '', '']);

		await clickSubmitButton(playground);
		expect(await getFormResult(playground)).toEqual({
			email: 'me@edmund.dev',
			password: 'constraintvalidation',
			age: '91',
		});
	});
});
