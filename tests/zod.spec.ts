import { test, expect } from '@playwright/test';
import {
	getPlaygroundLocator,
	getFormResult,
	clickSubmitButton,
	getConstraint,
} from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/zod');
});

test.describe('Native Constraint', () => {
	test('infer constraint correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const [subject, remarks, grade] = await Promise.all([
			getConstraint(playground.locator('[name="subject"]')),
			getConstraint(playground.locator('[name="remarks"]')),
			getConstraint(playground.locator('[name="grade"]')),
		]);

		expect({ subject, remarks, grade }).toEqual({
			subject: {
				required: true,
				minLength: 8,
				maxLength: 20,
				min: '',
				max: '',
				step: '',
				multiple: false,
				pattern: '^[0-9a-zA-Z]{8,20}$',
			},
			remarks: {
				required: false,
				minLength: -1,
				maxLength: -1,
				min: '',
				max: '',
				step: '',
				multiple: false,
				pattern: '',
			},
			grade: {
				required: false,
				minLength: -1,
				maxLength: -1,
				min: '1',
				max: '100',
				step: '',
				multiple: false,
				pattern: '',
			},
		});
	});
});

test.describe('Type Conversion', () => {
	test('convert values based on the preprocess setup', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Type Conversion');
		const number = playground.locator('[name="number"]');
		const datetime = playground.locator('[name="datetime"]');
		const boolean = playground.locator('[name="boolean"]');

		await number.type('123');
		await datetime.type('2022-07-04T12:00Z');
		await boolean.type('Yes');

		await clickSubmitButton(playground);

		expect(await getFormResult(playground)).toEqual({
			number: 123,
			datetime: '2022-07-04T12:00:00.000Z',
			boolean: true,
		});
	});
});
