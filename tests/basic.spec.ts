import { type Page, test, expect } from '@playwright/test';

async function getValidationMessage(page: Page, name: string): Promise<string> {
	return page
		.locator(`[name="${name}"]`)
		.evaluate<
			string,
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>((field) => field.validationMessage);
}

async function getConstraint(page: Page, name: string) {
	return page
		.locator(`[name="${name}"]`)
		.evaluate((input: HTMLInputElement) => ({
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

test.describe('basic', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/basic');
	});

	test('configure all input fields correctly', async ({ page }) => {
		const [email, password, age] = await Promise.all([
			getConstraint(page, 'email'),
			getConstraint(page, 'password'),
			getConstraint(page, 'age'),
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

	test('report validation message on submit', async ({ page }) => {
		// Try submit
		await page.locator('button[type="submit"]').click();

		await expect(page.locator('label > p')).toHaveText(
			await Promise.all([
				getValidationMessage(page, 'email'),
				getValidationMessage(page, 'password'),
				getValidationMessage(page, 'age'),
			]),
			{
				useInnerText: true,
			},
		);

		await page.locator('[name="email"]').type('me@edmund.dev');
		await expect(page.locator('label > p')).toHaveText(
			await Promise.all([
				'',
				getValidationMessage(page, 'password'),
				getValidationMessage(page, 'age'),
			]),
			{
				useInnerText: true,
			},
		);

		await page.locator('input[name="password"]').type('conform!');
		await expect(page.locator('label > p')).toHaveText(
			await Promise.all([
				'',
				getValidationMessage(page, 'password'),
				getValidationMessage(page, 'age'),
			]),
			{
				useInnerText: true,
			},
		);

		await page.locator('[name="password"]').fill('');
		await page.locator('[name="password"]').type('constraintvalidation');
		await expect(page.locator('label > p')).toHaveText(
			await Promise.all(['', '', getValidationMessage(page, 'age')]),
			{
				useInnerText: true,
			},
		);

		await page.locator('[name="age"]').type('9');
		await expect(page.locator('label > p')).toHaveText(
			await Promise.all(['', '', getValidationMessage(page, 'age')]),
			{
				useInnerText: true,
			},
		);

		await page.locator('[name="age"]').type('1'); // 9 -> 91
		await expect(page.locator('label > p')).toHaveText(['', '', ''], {
			useInnerText: true,
		});

		expect(page.locator('pre')).not.toBeVisible();

		await page.locator('button[type="submit"]').click();
		await expect(page.locator('pre')).toHaveText(
			JSON.stringify(
				{
					email: 'me@edmund.dev',
					password: 'constraintvalidation',
					age: '91',
				},
				null,
				2,
			),
			{
				useInnerText: true,
			},
		);
	});
});
