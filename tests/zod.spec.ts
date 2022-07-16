import { test, expect } from '@playwright/test';
import {
	getPlaygroundLocator,
	getSubmission,
	clickSubmitButton,
	getConstraint,
} from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/zod');
});

test.describe('Native Constraint', () => {
	test('infer constraint correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const [name, remarks, score, grade] = await Promise.all([
			getConstraint(playground.locator('[name="name"]')),
			getConstraint(playground.locator('[name="remarks"]')),
			getConstraint(playground.locator('[name="score"]')),
			getConstraint(playground.locator('[name="grade"]')),
		]);

		expect({ name, remarks, score, grade }).toEqual({
			name: {
				required: true,
				minLength: 8,
				maxLength: 20,
				pattern: '^[0-9a-zA-Z]{8,20}$',
			},
			remarks: {},
			score: {
				min: '0',
				max: '100',
			},
			grade: {
				pattern: 'A|B|C|D|E|F',
			},
		});
	});
});

test.describe('Type Conversion', () => {
	test('convert values based on the preprocess setup', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Type Conversion');
		const account = playground.locator('[name="account"]');
		const amount = playground.locator('[name="amount"]');
		const timestamp = playground.locator('[name="timestamp"]');
		const verified = playground.locator('[name="verified"]');

		await account.type('DE91 1000 0000 0123 4567 89');
		await amount.type('123');
		await timestamp.type('2022-07-04T12:00Z');
		await verified.check();

		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			state: 'accepted',
			data: {
				account: 'DE91 1000 0000 0123 4567 89',
				amount: 123,
				timestamp: '2022-07-04T12:00:00.000Z',
				verified: true,
			},
			form: {
				value: {
					account: 'DE91 1000 0000 0123 4567 89',
					amount: '123',
					timestamp: '2022-07-04T12:00Z',
					verified: 'Yes',
				},
				error: {},
			},
		});
	});
});
