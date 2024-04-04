import { type Page, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

async function setupField(page: Page, constraint: object, secret?: any) {
	const playground = getPlayground(page);
	const field = playground.container.locator('[name="field"]');
	const searchParams = new URLSearchParams([
		['constraint', JSON.stringify(constraint)],
	]);

	if (typeof secret !== 'undefined') {
		searchParams.set('secret', JSON.stringify(secret));
	}

	await page.goto(`/validitystate?${searchParams}`);

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
		async updateSecret(secret: any) {
			const searchParams = new URLSearchParams([
				['constraint', JSON.stringify(constraint)],
				['secret', JSON.stringify(secret)],
			]);

			await page.goto(`/validitystate?${searchParams}`);
			await playground.submit.click();
		},
		async updateSchema(changed: object) {
			const searchParams = new URLSearchParams([
				['constraint', JSON.stringify({ ...constraint, ...changed })],
			]);

			if (typeof secret !== 'undefined') {
				searchParams.set('secret', JSON.stringify(secret));
			}

			await page.goto(`/validitystate?${searchParams}`);
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
			await setupField(
				page,
				{
					type: 'text',
					minLength: 3,
					pattern: '[A-Za-z]{3,10}',
				},
				'abc',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('1');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('123');
		await expect(error).toHaveText(['pattern']);

		await type('abc');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'password',
					minLength: 5,
					pattern: '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).*',
				},
				'A12345z',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('a');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('12345');
		await expect(error).toHaveText(['pattern']);

		await type('A12345z');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'email',
				},
				'test@secret',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('test');
		await expect(error).toHaveText(['type']);

		await type('test@');
		await expect(error).toHaveText(['type']);

		await type('test@secret');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'url',
					minLength: 2,
					pattern: 'https://.*',
				},
				'https://example',
			);

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

		await type('https://example');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'tel',
					minLength: 3,
					pattern: '[0-9]{3,10}',
				},
				'1234',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('cc');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('test');
		await expect(error).toHaveText(['pattern']);

		await type('1234');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'search',
					minLength: 3,
					pattern: '[A-Za-z0-9]{3,10}',
				},
				'abc',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('no');
		await expect(error).toHaveText(['minlength', 'pattern']);

		await type('hellow world');
		await expect(error).toHaveText(['pattern']);

		await type('abc');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'number',
					min: 1,
					max: 5,
					step: 0.5,
				},
				2.5,
			);

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

		// This doesn't work on safari which consider it valueMissing
		// Fortunately, this is acceptable as the formdata is also presented as empty string
		// which aligns with the behavior on the server side
		// await type('4.');
		// await expect(error).toHaveText(['']);
		// await expect
		// 	.poll(() => getSubmission())
		// 	.toEqual({
		// 		payload: { field: '4' },
		// 		value: { field: 4 },
		// 		error: null,
		// 	});

		await type('2.5');
		await expect(error).toHaveText(['secret']);

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
		const { submit, error, field, getSubmission, updateSchema, updateSecret } =
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

		await updateSecret(false);
		await expect(error).toHaveText(['secret']);

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
		const { submit, error, field, getSubmission, updateSchema, updateSecret } =
			await setupField(page, {
				type: 'radio',
			});

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSecret('on');
		await field.check();
		await submit.click();
		await expect(error).toHaveText(['secret']);

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
		const { submit, error, fill, getSubmission } = await setupField(
			page,
			{
				type: 'color',
			},
			'#123456',
		);

		await submit.click();
		await expect(error).toHaveText(['']);

		// color input will always have a default value

		await fill('#123456');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'datetime-local',
					min: '2023-01-01T00:00',
					max: '2023-12-31T23:59',
					step: 60 * 30, // 30 minutes
				},
				'2023-04-07T15:00',
			);

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

		await fill('2023-04-07T15:00');
		await expect(error).toHaveText(['secret']);

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
			await setupField(
				page,
				{
					type: 'date',
					min: '2023-01-01',
					max: '2023-12-31',
					step: 7, // 7 days
				},
				'2023-05-07',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await fill('2022-06-01');
		await expect(error).toHaveText(['min', 'step']);

		await fill('2024-02-14');
		await expect(error).toHaveText(['max', 'step']);

		await fill('2023-05-07');
		await expect(error).toHaveText(['secret']);

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

	// month input is not supported by Firefix and Safari yet
	test.skip('month input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'month',
				min: '2023-01',
				max: '2023-12',
				step: 2, // 2 months
			});

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

	// week input is not supported by Firefix and Safari yet
	test.skip('week input', async ({ page }) => {
		const { submit, error, fill, getSubmission, updateSchema } =
			await setupField(page, {
				type: 'week',
				min: '2023-W01',
				max: '2023-W52',
				step: 2, // 2 weeks
			});

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
			await setupField(
				page,
				{
					type: 'time',
					min: '09:00',
					max: '18:00',
					step: 60 * 3, // 3 minutes
				},
				'15:15',
			);

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

		await fill('15:15');
		await expect(error).toHaveText(['secret']);

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

	test('select', async ({ page }) => {
		const { submit, error, field, getSubmission, updateSchema } =
			await setupField(
				page,
				{
					type: 'select',
				},
				['a', 'b', 'c'],
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await field.selectOption('a');
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'a' },
				value: { field: 'a' },
				error: null,
			});

		await updateSchema({ multiple: true });
		await expect(error).toHaveText(['']);

		await updateSchema({ multiple: true, required: true });
		await expect(error).toHaveText(['required']);

		await field.selectOption(['a', 'b', 'c']);
		await submit.click();
		await expect(error).toHaveText(['secret']);

		await field.selectOption(['b', 'c']);
		await submit.click();
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: ['b', 'c'] },
				value: { field: ['b', 'c'] },
				error: null,
			});
	});

	test('textarea', async ({ page }) => {
		const { submit, error, type, getSubmission, updateSchema } =
			await setupField(
				page,
				{
					type: 'textarea',
					minLength: 10,
				},
				'This is a secret',
			);

		await submit.click();
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true });
		await expect(error).toHaveText(['required']);

		await type('hello');
		await expect(error).toHaveText(['minlength']);

		await type('This is a secret');
		await expect(error).toHaveText(['secret']);

		await type('This is a long paragraph');
		await expect(error).toHaveText(['']);
		await expect
			.poll(() => getSubmission())
			.toEqual({
				payload: { field: 'This is a long paragraph' },
				value: { field: 'This is a long paragraph' },
				error: null,
			});
	});

	test('file input', async ({ page }) => {
		const { submit, error, field, getSubmission, updateSchema } =
			await setupField(
				page,
				{
					type: 'file',
				},
				'secret.json',
			);

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

		await field.setInputFiles([
			{
				name: 'secret.json',
				mimeType: 'application/json',
				buffer: Buffer.from('{}'),
			},
		]);
		await submit.click();
		await expect(error).toHaveText(['secret']);

		await updateSchema({ multiple: true });
		await expect(error).toHaveText(['']);

		await updateSchema({ required: true, multiple: true });
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
