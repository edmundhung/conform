import { type Page, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

async function setupField(page: Page, schema: object) {
	const playground = getPlayground(page);
	const field = playground.container.locator('[name="field"]');

	await page.goto(`/validitystate?schema=${JSON.stringify(schema)}`);

	return {
		...playground,
		field,
		async type(value: string) {
			await field.fill('');
			await field.type(value);
			await playground.submit.click();
		},
		async setRequired(flag = true) {
			await page.goto(
				`/validitystate?schema=${JSON.stringify({
					...schema,
					required: flag,
				})}`,
			);
			await playground.submit.click();
		},
		async updateSchema(changed: object) {
			await page.goto(
				`/validitystate?schema=${JSON.stringify({ ...schema, ...changed })}`,
			);
			await playground.submit.click();
		},
		async getSubmission() {
			return JSON.parse(await playground.submission.innerText());
		},
	};
}

function runTests(javaScriptEnabled: boolean) {
	test.use({ javaScriptEnabled });

	test('text input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'text',
				minLength: 3,
				pattern: '[A-Za-z]{3,10}',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('1');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('123');
		await expect(error).toHaveText(['pattern']);

		await type('Abc');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'Abc' },
				value: { field: 'Abc' },
				error: null,
			});
	});

	test('password input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'password',
				minLength: 5,
				pattern: '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).*',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('a');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('12345');
		await expect(error).toHaveText(['pattern']);

		await type('ABC1234z');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'ABC1234z' },
				value: { field: 'ABC1234z' },
				error: null,
			});
	});

	test('email input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'email',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('test');
		await expect(error).toHaveText(['type']);

		await type('test@');
		await expect(error).toHaveText(['type']);

		await type('test@example');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'test@example' },
				value: { field: 'test@example' },
				error: null,
			});
	});

	test('url input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'url',
				minLength: 2,
				pattern: 'https://.*',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('test');
		await expect(error).toHaveText(['type', 'pattern']);

		await type('http://');
		await expect(error).toHaveText(['type', 'pattern']);

		await type('http://example');
		await expect(error).toHaveText(['pattern']);

		await type('https://test');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'https://test' },
				value: { field: 'https://test' },
				error: null,
			});
	});

	test('tel input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'tel',
				minLength: 3,
				pattern: '[0-9]{3,10}',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('cc');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('test');
		await expect(error).toHaveText(['pattern']);

		await type('0123456');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '0123456' },
				value: { field: '0123456' },
				error: null,
			});
	});

	test('search input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'search',
				minLength: 3,
				pattern: '[A-Za-z0-9]{3,10}',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('no');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('hellow world');
		await expect(error).toHaveText(['pattern']);

		await type('anything');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'anything' },
				value: { field: 'anything' },
				error: null,
			});
	});

	test('number input', async ({ page }) => {
		const { submit, error, type, updateSchema, getSubmission } =
			await setupField(page, {
				type: 'number',
				min: 1,
				max: 5,
				step: 0.5,
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('0');
		await expect(error).toHaveText(['min']);

		await type('3');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '3' },
				value: { field: 3 },
				error: null,
			});

		await type('5.01');
		await expect(error).toHaveText(['max', 'step']);

		await type('1.2');
		await expect(error).toHaveText(['step']);

		await type('4.');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '4' },
				value: { field: 4 },
				error: null,
			});

		await type('5.0');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '5.0' },
				value: { field: 5 },
				error: null,
			});
	});

	test('range input', async ({ page }) => {
		const { submit, error, getSubmission } = await setupField(page, {
			type: 'range',
			min: 1,
			max: 100,
			step: 5,
		});

		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '51' },
				value: { field: 51 },
				error: null,
			});

		// Range input will always have a default value
		// @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#validation

		// TODO: Test updating range input value;
	});

	test('checkbox input', async ({ page }) => {
		const { submit, error, field, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'checkbox',
			});

		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: {},
				value: { field: false },
				error: null,
			});

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await field.check();
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'on' },
				value: { field: true },
				error: null,
			});

		await updateSchema({ value: 'ok' });
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: {},
				value: { field: false },
				error: null,
			});

		await updateSchema({ required: true, value: 'ok' });
		await field.check();
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'ok' },
				value: { field: true },
				error: null,
			});
	});
}

test.describe('With JS', () => runTests(true));
test.describe('No JS', () => runTests(false));
