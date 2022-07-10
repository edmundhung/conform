import { test, expect } from '@playwright/test';
import {
	getPlaygroundLocator,
	getFormResult,
	clickSubmitButton,
} from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/zod');
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
