import { test, expect } from '@playwright/test';
import {
	getPlaygroundLocator,
	getSubmission,
	clickSubmitButton,
	getConstraint,
	getPaymentFieldset,
	getStudentFieldset,
} from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/yup');
});

test.describe('Native Constraint', () => {
	test('infer constraint correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const fieldset = getStudentFieldset(playground);
		const [name, remarks, score, grade] = await Promise.all([
			getConstraint(fieldset.name),
			getConstraint(fieldset.remarks),
			getConstraint(fieldset.score),
			getConstraint(fieldset.grade),
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
		const { account, amount, timestamp, verified } =
			getPaymentFieldset(playground);

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
