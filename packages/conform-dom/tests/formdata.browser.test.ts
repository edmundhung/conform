import { describe, it, expect } from 'vitest';
import { isDirty, parseSubmission } from '../formdata';

function createFormData(
	entries: Array<[string, FormDataEntryValue]>,
): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

describe('parseSubmission', () => {
	it('parses FormData', () => {
		const emptyFile = new File([], 'example.txt');
		const emptyFile2 = new File([], 'example2.txt');

		// Empty form data
		expect(parseSubmission(createFormData([]))).toEqual({
			value: {},
			fields: [],
			intent: null,
		});

		// Form data with nested fields
		expect(
			parseSubmission(
				createFormData([
					['email', 'hello@world.com'],
					['password', 'secret'],
					['task[0]', 'taskname0'],
					['task[1].stage[0]', 'in progress'],
					// ['task[0].stage[0]', 'in progress'],
					['intent', 'login'],
					['file', emptyFile],
					['file', emptyFile2],
					['file2', emptyFile2],
				]),
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'secret',
				task: [
					'taskname0',
					{
						stage: ['in progress'],
					},
				],
				intent: 'login',
				file: [emptyFile, emptyFile2],
				file2: emptyFile2,
			},
			fields: [
				'email',
				'password',
				'task[0]',
				'task[1].stage[0]',
				'intent',
				'file',
				'file2',
			],
			intent: null,
		});

		// Default intentName
		expect(
			parseSubmission(
				createFormData([
					['email', 'hello@world.com'],
					['password', 'superSecret1234'],
					['__intent__', 'register'],
				]),
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'superSecret1234',
			},
			fields: ['email', 'password'],
			intent: 'register',
		});

		// Custom intentName
		expect(
			parseSubmission(
				createFormData([
					['email', 'hello@world.com'],
					['password', 'secret'],
					['intent', 'login'],
					['intent', 'update'],
				]),
				{
					intentName: 'intent',
				},
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'secret',
			},
			fields: ['email', 'password'],
			intent: 'login',
		});

		// File intent will be ignored
		expect(
			parseSubmission(createFormData([['__intent__', emptyFile]])),
		).toEqual({
			value: {},
			fields: [],
			intent: null,
		});
	});

	it('parses URLSearchParams', () => {
		// Empty URLSearchParams
		expect(parseSubmission(new URLSearchParams())).toEqual({
			value: {},
			fields: [],
			intent: null,
		});

		// URLSearchParams with nested fields
		expect(
			parseSubmission(
				new URLSearchParams([
					['email', 'hello@world.com'],
					['password', 'secret'],
					['task[0]', 'taskname0'],
					['task[1].stage[0]', 'in progress'],
					['intent', 'login'],
				]),
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'secret',
				task: [
					'taskname0',
					{
						stage: ['in progress'],
					},
				],
				intent: 'login',
			},
			fields: ['email', 'password', 'task[0]', 'task[1].stage[0]', 'intent'],
			intent: null,
		});

		// Default intentName
		expect(
			parseSubmission(
				new URLSearchParams([
					['email', 'hello@world.com'],
					['password', 'superSecret1234'],
					['__intent__', 'register'],
				]),
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'superSecret1234',
			},
			fields: ['email', 'password'],
			intent: 'register',
		});

		// Custom intentName
		expect(
			parseSubmission(
				new URLSearchParams([
					['email', 'hello@world.com'],
					['password', 'secret'],
					['intent', 'login'],
					['intent', 'update'],
				]),
				{
					intentName: 'intent',
				},
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'secret',
			},
			fields: ['email', 'password'],
			intent: 'login',
		});
	});

	it('skips form data entry based on the "skipEntry" option', () => {
		expect(
			parseSubmission(
				new URLSearchParams([
					['email', 'hello@world.com'],
					['password', 'secret'],
					['task[0]', 'taskname0'],
					['task[1].stage[0]', 'in progress'],
					['intent', 'login'],
				]),
				{
					intentName: 'intent',
					skipEntry(name) {
						return name.startsWith('task');
					},
				},
			),
		).toEqual({
			value: {
				email: 'hello@world.com',
				password: 'secret',
			},
			fields: ['email', 'password'],
			intent: 'login',
		});
	});
});

describe('isDirty', () => {
	it('returns undefined if no form data is provided', () => {
		expect(isDirty(null)).toBeUndefined();
		expect(isDirty(null, { defaultValue: { foo: 'bar' } })).toBeUndefined();
	});

	it('parse the form data and compares it with the default value', () => {
		const emptyFile = new File([], '');
		const txtFile = new File(['Hello World'], 'example.txt', {
			type: 'text/plain',
		});

		// Empty form data
		expect(isDirty(createFormData([]))).toBe(false);

		// Empty default value
		expect(
			isDirty(
				createFormData([
					['name', ''],
					['file', emptyFile],
				]),
			),
		).toBe(false);
		expect(
			isDirty(
				createFormData([
					['name', ''],
					['file', emptyFile],
				]),
				{
					defaultValue: {},
				},
			),
		).toBe(false);
		expect(
			isDirty(
				createFormData([
					['name', ''],
					['file', emptyFile],
				]),
				{
					defaultValue: {
						name: '',
						file: null,
						description: undefined,
						object: {},
						array: [],
					},
				},
			),
		).toBe(false);

		// Non empty form data with empty default value
		expect(
			isDirty(
				createFormData([
					['name', 'foobar'],
					['file', txtFile],
				]),
			),
		).toBe(true);
		expect(
			isDirty(
				createFormData([
					['name', 'foobar'],
					['file', txtFile],
				]),
				{
					defaultValue: {},
				},
			),
		).toBe(true);
		expect(
			isDirty(
				createFormData([
					['name', 'foobar'],
					['file', txtFile],
				]),
				{
					defaultValue: {
						name: '',
						file: null,
					},
				},
			),
		).toBe(true);

		// Array
		expect(
			isDirty(createFormData([['items', '']]), {
				defaultValue: { items: [''] },
			}),
		).toBe(false);
		expect(
			isDirty(createFormData([['items', 'foo']]), {
				defaultValue: { items: ['foo'] },
			}),
		).toBe(false);
		expect(
			isDirty(
				createFormData([
					['items', 'foo'],
					['items', 'bar'],
				]),
				{
					defaultValue: { items: ['foo', 'bar'] },
				},
			),
		).toBe(false);
		expect(
			isDirty(createFormData([['items', 'foo']]), {
				defaultValue: { items: [''] },
			}),
		).toBe(true);
		expect(
			isDirty(
				createFormData([
					['items', 'foo'],
					['items', 'bar'],
				]),
				{
					defaultValue: { items: ['bar'] },
				},
			),
		).toBe(true);

		// Object
		expect(
			isDirty(createFormData([['object.key', '']]), {
				defaultValue: { object: { key: '' } },
			}),
		).toBe(false);
		expect(
			isDirty(createFormData([['object.key', '']]), {
				defaultValue: { object: { key: 'bar' } },
			}),
		).toBe(true);
		expect(
			isDirty(createFormData([['object.key', 'foo']]), {
				defaultValue: { object: { key: '' } },
			}),
		).toBe(true);
	});

	it('supports custom parse options', () => {
		const emptyFile = new File([], '');
		const formData = createFormData([
			['name', ''],
			['file', emptyFile],
			['crsf-token', 'g3wb5tg645g3'],
		]);

		expect(
			isDirty(formData, {
				skipEntry(name) {
					return name === 'crsf-token';
				},
			}),
		).toBe(false);
	});

	it('supports custom serialize function before comparing the values', () => {
		// Default serializer
		expect(
			isDirty(createFormData([['checked', 'on']]), {
				defaultValue: {
					checked: true,
					unchecked: false,
				},
			}),
		).toBe(false);
		expect(
			isDirty(createFormData([['datetime', '1970-01-01T00:00:00.000Z']]), {
				defaultValue: {
					datetime: new Date(0),
				},
			}),
		).toBe(false);

		// Custom serializer
		expect(
			isDirty(createFormData([['datetime', '']]), {
				defaultValue: {
					datetime: new Date(0),
				},
				serialize(value, defaultSerialize) {
					if (value instanceof Date && value.valueOf() === 0) {
						return;
					}

					return defaultSerialize(value);
				},
			}),
		).toBe(false);
	});

	it('supports parsed submission value', () => {
		const emptyFile = new File([], '');
		const formData = createFormData([
			['name', ''],
			['file', emptyFile],
		]);
		const submission = parseSubmission(formData);

		expect(isDirty(submission.value)).toBe(false);
	});
});
