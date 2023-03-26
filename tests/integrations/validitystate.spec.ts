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
		async fill(value: string) {
			await field.fill(value);
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

	test('radio input', async ({ page }) => {
		const { submit, error, field, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'radio',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await field.check();
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'on' },
				value: { field: 'on' },
				error: null,
			});
	});

	test('color input', async ({ page }) => {
		const { submit, error, fill, getSubmission } = await setupField(page, {
			type: 'color',
		});

		await submit.click();
		await expect(error).toHaveText(['']);

		// color input will always have a default value

		await fill('#000000');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '#000000' },
				value: { field: '#000000' },
				error: null,
			});
	});

	test('datetime-local input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'datetime-local',
				min: '2023-01-01T00:00',
				max: '2023-12-31T23:59',
				step: 60 * 30, // 30 minutes
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await fill('2022-06-01T00:01');
		await expect(error).toHaveText(['min', 'step']);

		await fill('2022-09-10T14:30');
		await expect(error).toHaveText(['min']);

		await fill('2024-02-14T18:00');
		await expect(error).toHaveText(['max']);

		await fill('2023-03-26T12:30');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '2023-03-26T12:30' },
				value: { field: '2023-03-26T12:30' },
				error: null,
			});
	});

	test('date input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'date',
				min: '2023-01-01',
				max: '2023-12-31',
				step: 7, // 7 days
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await fill('2022-06-01');
		await expect(error).toHaveText(['min', 'step']);

		await fill('2024-02-14');
		await expect(error).toHaveText(['max', 'step']);

		await fill('2023-01-08');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '2023-01-08' },
				value: { field: '2023-01-08' },
				error: null,
			});
	});

	test('month input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'month',
				min: '2023-01',
				max: '2023-12',
				step: 2, // 2 months
			});

		if (!javaScriptEnabled) {
			// Skip test until month input is implemented
			return;
		}

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await fill('2022-06');
		await expect(error).toHaveText(['min', 'step']);

		await fill('2024-02');
		await expect(error).toHaveText(['max', 'step']);

		await fill('2023-02');
		await expect(error).toHaveText(['step']);

		await fill('2023-03');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '2023-03' },
				value: { field: '2023-03' },
				error: null,
			});
	});

	test('week input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'week',
				min: '2023-W01',
				max: '2023-W52',
				step: 2, // 2 weeks
			});

		if (!javaScriptEnabled) {
			// Skip test until week input is implemented
			return;
		}

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await fill('2022-W28');
		await expect(error).toHaveText(['min', 'step']);

		await fill('2024-W02');
		await expect(error).toHaveText(['max', 'step']);

		await fill('2023-W02');
		await expect(error).toHaveText(['step']);

		await fill('2023-W03');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '2023-W03' },
				value: { field: '2023-W03' },
				error: null,
			});
	});

	test('time input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'time',
				min: '09:00',
				max: '18:00',
				step: 60 * 3, // 3 minutes
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await fill('08:55');
		await expect(error).toHaveText(['min', 'step']);

		await fill('23:59');
		await expect(error).toHaveText(['max', 'step']);

		await fill('12:14');
		await expect(error).toHaveText(['step']);

		await fill('15:30');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: '15:30' },
				value: { field: '15:30' },
				error: null,
			});
	});

	test('file input', async ({ page }) => {
		const { submit, error, field, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'file',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await field.setInputFiles({
			name: 'example.json',
			mimeType: 'application/json',
			buffer: Buffer.from('{}'),
		});
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: {},
				value: {
					field: {
						_lastModified: expect.any(Number),
						_name: 'example.json',
					},
				},
				error: null,
			});

		await updateSchema({ multiple: true });
		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true, multiple: true });
		await submit.click();
		await expect(error).toHaveText(['required']);

		await field.setInputFiles([
			{
				name: 'example.json',
				mimeType: 'application/json',
				buffer: Buffer.from('{}'),
			},
			{
				name: 'example.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('Hello World!'),
			},
		]);
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: {},
				value: {
					field: [
						{
							_lastModified: expect.any(Number),
							_name: 'example.json',
						},
						{
							_lastModified: expect.any(Number),
							_name: 'example.txt',
						},
					],
				},
				error: null,
			});
	});
}

test.describe('With JS', () => runTests(true));
test.describe('No JS', () => runTests(false));
