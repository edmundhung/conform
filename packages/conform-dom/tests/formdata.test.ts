import { describe, it, expect, test } from 'vitest';
import {
	getValueAtPath,
	setValueAtPath,
	getRelativePath,
	getPathSegments,
	formatPathSegments,
	isDirty,
	isPrefix,
	parseSubmission,
	report,
	DEFAULT_INTENT_NAME,
	serialize,
} from '../formdata';

function createFormData(
	entries: Array<[string, FormDataEntryValue]>,
): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

test('getPathSegments', () => {
	expect(getPathSegments(undefined)).toEqual([]);
	expect(getPathSegments('')).toEqual([]);
	expect(getPathSegments('title')).toEqual(['title']);
	expect(getPathSegments('123')).toEqual(['123']);
	expect(getPathSegments('amount.currency')).toEqual(['amount', 'currency']);
	expect(getPathSegments('[0]')).toEqual([0]);
	expect(getPathSegments('tasks[0]')).toEqual(['tasks', 0]);
	expect(getPathSegments('tasks[1].completed')).toEqual([
		'tasks',
		1,
		'completed',
	]);
	expect(getPathSegments('multiple[0][1][2]')).toEqual(['multiple', 0, 1, 2]);
	expect(getPathSegments('books[0].chapters[1]')).toEqual([
		'books',
		0,
		'chapters',
		1,
	]);
	expect(getPathSegments('[].array[].prop')).toEqual(['', 'array', '', 'prop']);
	expect(() => getPathSegments('a.b..c...d')).toThrow(
		'Invalid path syntax at position 3 in "a.b..c...d"',
	);
	expect(() => getPathSegments('.')).toThrow(
		'Invalid path syntax at position 0 in "."',
	);
	expect(() => getPathSegments('a[b]')).toThrow(
		'Invalid path syntax at position 1 in "a[b]"',
	);
	expect(() => getPathSegments('[a.b]')).toThrow(
		'Invalid path syntax at position 0 in "[a.b]"',
	);
	expect(() => getPathSegments('a[b].b')).toThrow(
		'Invalid path syntax at position 1 in "a[b].b"',
	);
	expect(() => getPathSegments('a[[]]')).toThrow(
		'Invalid path syntax at position 1 in "a[[]]"',
	);
});

test('formatPathSegments', () => {
	expect(formatPathSegments([])).toEqual('');
	expect(formatPathSegments([0])).toEqual('[0]');
	expect(formatPathSegments(['title'])).toEqual('title');
	expect(formatPathSegments(['amount', 'currency'])).toEqual('amount.currency');
	expect(formatPathSegments(['tasks', 0])).toEqual('tasks[0]');
	expect(formatPathSegments(['tasks', 1, 'completed'])).toEqual(
		'tasks[1].completed',
	);
	expect(formatPathSegments([''])).toEqual('[]');
	expect(formatPathSegments(['array', ''])).toEqual('array[]');
	expect(formatPathSegments(['a', 'b', 2, 'c', '', 'd'])).toEqual(
		'a.b[2].c[].d',
	);
	expect(formatPathSegments(['', '', ''])).toEqual('[][][]');
});

test('isPrefix', () => {
	expect(isPrefix('', '')).toBe(true);
	expect(isPrefix('address', '')).toBe(true);
	expect(isPrefix('address', 'address')).toBe(true);
	expect(isPrefix('address', 'address.city')).toBe(false);
	expect(isPrefix('address.city', '')).toBe(true);
	expect(isPrefix('address.city', 'address')).toBe(true);
	expect(isPrefix('address.city', 'address.city')).toBe(true);
	expect(isPrefix('address.city', 'address.street')).toBe(false);
	expect(isPrefix('address.city.zipcode', '')).toBe(true);
	expect(isPrefix('address.city.zipcode', 'address.city')).toBe(true);
	expect(isPrefix('tasks[0]', '')).toBe(true);
	expect(isPrefix('tasks[0]', 'tasks')).toBe(true);
	expect(isPrefix('tasks[0]', 'tasks[0]')).toBe(true);
	expect(isPrefix('tasks[0]', 'tasks[1]')).toBe(false);
	expect(isPrefix('tasks[0].content', '')).toBe(true);
	expect(isPrefix('tasks[0].content', 'tasks')).toBe(true);
	expect(isPrefix('tasks[0].content', 'tasks[0]')).toBe(true);
	expect(isPrefix('tasks[0].content', 'tasks[0].content')).toBe(true);
	expect(isPrefix('tasks[0].content', 'tasks[1].content')).toBe(false);
	expect(isPrefix('tasks[0].content', 'tasks[0].completed')).toBe(false);
});

test('getRelativePath', () => {
	expect(getRelativePath('foo.bar[0].qux', [])).toEqual([
		'foo',
		'bar',
		0,
		'qux',
	]);
	expect(getRelativePath('foo.bar[0].qux', ['foo'])).toEqual(['bar', 0, 'qux']);
	expect(getRelativePath('foo.bar[0].qux', ['foo', 'bar'])).toEqual([0, 'qux']);
	expect(getRelativePath('foo.bar[0].qux', ['foo', 'bar', 0])).toEqual(['qux']);
	expect(getRelativePath('foo.bar[0].qux', ['foo', 'bar', 0, 'qux'])).toEqual(
		[],
	);
	expect(getRelativePath('foo.bar[0].qux', ['foo', 'bar', 1])).toEqual(null);
	expect(getRelativePath('foo.bar[0].qux', ['bar'])).toEqual(null);
	expect(getRelativePath('foo.bar[0].qux', ['qux'])).toEqual(null);
	expect(getRelativePath('foo.bar[0].qux', ['bar', 0, 'qux'])).toEqual(null);
	expect(getRelativePath('', ['foo'])).toEqual(null);
	expect(getRelativePath('', [])).toEqual([]);
});

test('getValueAtPath', () => {
	const target = {
		foo: {
			bar: [
				{
					baz: 'qux',
				},
				{
					baz: 'quux',
				},
			],
		},
	};

	expect(getValueAtPath(target, '')).toBe(target);
	expect(getValueAtPath(target, 'foo')).toBe(target.foo);
	expect(getValueAtPath(target, ['foo', 'bar'])).toBe(target.foo.bar);
	expect(getValueAtPath(target, 'foo.bar[0]')).toBe(target.foo.bar[0]);
	expect(getValueAtPath(target, ['foo', 'bar', 1])).toBe(target.foo.bar[1]);
	expect(getValueAtPath(target, 'foo.bar[0].baz')).toBe(target.foo.bar[0]?.baz);
	expect(getValueAtPath(target, ['foo', 'bar', 1, 'baz'])).toBe(
		target.foo.bar[1]?.baz,
	);
	expect(getValueAtPath(target, 'foo.bar[2]')).toBe(undefined);
	expect(getValueAtPath(target, 'test')).toBe(undefined);
	expect(getValueAtPath(target, 'any')).toBe(undefined);
	expect(getValueAtPath(target, ['bar'])).toBe(undefined);
	expect(getValueAtPath(target, 'baz')).toBe(undefined);
	expect(getValueAtPath(target, ['bar', 0, 'baz'])).toBe(undefined);

	expect(() => getValueAtPath(target, 'foo.bar[]')).toThrowError();
});

describe('setValueAtPath', () => {
	it('mutates the target object and sets a value at a given path by default', () => {
		const target: Record<string, any> = {
			foo: {
				bar: [
					{
						baz: 'qux',
					},
				],
			},
		};

		const result = setValueAtPath(target, 'example', 'test');

		expect(result).toBe(target);
		expect(result).toEqual({
			foo: {
				bar: [
					{
						baz: 'qux',
					},
				],
			},
			example: 'test',
		});

		const result2 = setValueAtPath(target, 'foo.bar[0].baz', 'new value');

		expect(result2).toBe(target);
		expect(result2).toEqual({
			foo: {
				bar: [
					{
						baz: 'new value',
					},
				],
			},
			example: 'test',
		});

		const result3 = setValueAtPath(
			target,
			['foo', 'bar', 1, 'baz'],
			'another value',
		);

		expect(result3).toBe(target);
		expect(result3).toEqual({
			foo: {
				bar: [
					{
						baz: 'new value',
					},
					{
						baz: 'another value',
					},
				],
			},
			example: 'test',
		});

		const result4 = setValueAtPath(target, 'foo.test', 'test value');

		expect(result4).toBe(target);
		expect(result4).toEqual({
			foo: {
				test: 'test value',
				bar: [
					{
						baz: 'new value',
					},
					{
						baz: 'another value',
					},
				],
			},
			example: 'test',
		});

		const result5 = setValueAtPath(target, 'foo.bar[0].baz.qux', 'hello world');

		expect(result5).toBe(target);
		expect(result5).toEqual({
			foo: {
				test: 'test value',
				bar: [
					{
						baz: {
							qux: 'hello world',
						},
					},
					{
						baz: 'another value',
					},
				],
			},
			example: 'test',
		});
	});

	it('clones the target object and all ancestors along the path if the clone option is enabled', () => {
		const target: Record<string, any> = {
			foo: {
				bar: [
					{
						baz: 'qux',
					},
				],
			},
		};

		const result = setValueAtPath(target, 'example', 'test', { clone: true });

		expect(result).not.toBe(target);
		expect(result.example).toBe('test');
		expect(result.foo).toBe(target.foo);

		const result2 = setValueAtPath(target, 'foo.bar[1]', 'new value', {
			clone: true,
		});

		expect(result2).not.toBe(target);
		expect(result2.foo).not.toBe(target.foo);
		expect(result2.foo.bar).not.toBe(target.foo.bar);
		expect(result2.foo.bar[0]).toBe(target.foo.bar[0]);
		expect(result2.foo.bar[1]).toBe('new value');

		const result3 = setValueAtPath(target, 'foo.bar[]', 'another value', {
			clone: true,
		});

		expect(result3).not.toBe(target);
		expect(result3.foo).not.toBe(target.foo);
		expect(result3.foo.bar).not.toBe(target.foo.bar);
		expect(result3.foo.bar[0]).toBe(target.foo.bar[0]);
		expect(result3.foo.bar[1]).toBe('another value');

		const result4 = setValueAtPath(
			target,
			'foo.bar[0].baz.qux',
			'hello world',
			{
				clone: true,
			},
		);

		expect(result4).not.toBe(target);
		expect(result4.foo).not.toBe(target.foo);
		expect(result4.foo.bar).not.toBe(target.foo.bar);
		expect(result4.foo.bar[0]).not.toBe(target.foo.bar[0]);
		expect(result4.foo.bar[0].baz).not.toBe(target.foo.bar[0].baz);
		expect(result4.foo.bar[0].baz).toEqual({ qux: 'hello world' });
	});

	it('throws when the path is invalid unless the silent option is enabled', () => {
		const target: Record<string, any> = {
			foo: {
				bar: [
					{
						baz: 'qux',
					},
				],
			},
		};

		expect(() => setValueAtPath(target, '', 'test')).toThrowError();
		expect(() =>
			setValueAtPath(target, '', 'test', { silent: true }),
		).not.toThrowError();
		expect(() => setValueAtPath(target, 'foo..bar', 'test')).toThrowError();
		expect(() =>
			setValueAtPath(target, 'foo..bar', 'test', { silent: true }),
		).not.toThrowError();
		expect(() =>
			setValueAtPath(target, 'foo.bar[].baz', 'test'),
		).toThrowError();
		expect(() =>
			setValueAtPath(target, 'foo.bar[].baz', 'test', { silent: true }),
		).not.toThrowError();
	});
});

describe('parseSubmission', () => {
	it('parses FormData', () => {
		const emptyFile = new File([], 'example.txt');
		const emptyFile2 = new File([], 'example2.txt');

		// Empty form data
		expect(parseSubmission(createFormData([]))).toEqual({
			payload: {},
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
			payload: {
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
					[DEFAULT_INTENT_NAME, 'register'],
				]),
			),
		).toEqual({
			payload: {
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
			payload: {
				email: 'hello@world.com',
				password: 'secret',
			},
			fields: ['email', 'password'],
			intent: 'login',
		});

		// File intent will be ignored
		expect(
			parseSubmission(createFormData([[DEFAULT_INTENT_NAME, emptyFile]])),
		).toEqual({
			payload: {},
			fields: [],
			intent: null,
		});
	});

	it('parses URLSearchParams', () => {
		// Empty URLSearchParams
		expect(parseSubmission(new URLSearchParams())).toEqual({
			payload: {},
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
			payload: {
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
					[DEFAULT_INTENT_NAME, 'register'],
				]),
			),
		).toEqual({
			payload: {
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
			payload: {
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
			payload: {
				email: 'hello@world.com',
				password: 'secret',
			},
			fields: ['email', 'password'],
			intent: 'login',
		});
	});
});

describe('report', () => {
	it('creates a basic submission result with default options', () => {
		const submission = {
			payload: { name: 'John', email: 'john@example.com' },
			fields: ['name', 'email'],
			intent: null,
		};
		const result = report(submission);

		expect(result).toEqual({
			submission: {
				payload: { name: 'John', email: 'john@example.com' },
				fields: ['name', 'email'],
				intent: null,
			},
			intendedValue: undefined,
			error: undefined,
		});
	});

	it('supports resetting form state', () => {
		const submission = {
			payload: { name: 'John', email: 'john@example.com' },
			fields: ['name', 'email'],
			intent: null,
		};
		const result = report(submission, {
			reset: true,
		});

		expect(result).toEqual({
			submission,
			intendedValue: null,
			error: undefined,
		});
	});

	it('handles form errors', () => {
		const submission = {
			payload: { name: '', email: 'invalid' },
			fields: ['name', 'email'],
			intent: null,
		};
		const result = report(submission, {
			error: {
				formErrors: ['Form is invalid', 'Please check all fields'],
			},
		});

		expect(result).toEqual({
			submission,
			intendedValue: undefined,
			error: {
				formErrors: ['Form is invalid', 'Please check all fields'],
				fieldErrors: {},
			},
		});

		// Test with null error
		const resultWithNull = report(submission, { error: null });
		expect(resultWithNull).toEqual({
			submission,
			intendedValue: undefined,
			error: null,
		});
	});

	it('handles field errors', () => {
		const submission = {
			payload: { name: '', email: 'invalid' },
			fields: ['name', 'email'],
			intent: null,
		};

		const result = report(submission, {
			error: {
				fieldErrors: {
					name: ['Name is required'],
					email: ['Invalid email format'],
				},
			},
		});

		expect(result).toEqual({
			submission,
			intendedValue: undefined,
			error: {
				formErrors: [],
				fieldErrors: {
					name: ['Name is required'],
					email: ['Invalid email format'],
				},
			},
		});
	});

	it('handles file stripping based on keepFiles option', () => {
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		const submission = {
			payload: { name: 'John', avatar: file, docs: [file, file] },
			fields: ['name', 'avatar', 'docs'],
			intent: null,
		};

		// Default behavior - strips files
		const defaultResult = report(submission);
		expect(defaultResult).toEqual({
			submission: {
				...submission,
				payload: { name: 'John', docs: [null, null] },
			},
			intendedValue: undefined,
			error: undefined,
		});

		// keepFiles: false - explicit file stripping
		const stripResult = report(submission, { keepFiles: false });
		expect(stripResult).toEqual({
			submission: {
				...submission,
				payload: { name: 'John', docs: [null, null] },
			},
			intendedValue: undefined,
			error: undefined,
		});

		// keepFiles: true - keeps files
		const keepResult = report(submission, { keepFiles: true });
		expect(keepResult).toEqual({
			submission,
			intendedValue: undefined,
			error: undefined,
		});
	});

	it('supports hiding specific fields from the result', () => {
		const submission = {
			payload: {
				name: 'John',
				email: 'john@example.com',
				password: 'secret123',
			},
			fields: ['name', 'email', 'password'],
			intent: null,
		};

		// Test hiding fields from payload only
		const result = report(submission, {
			hideFields: ['password'],
		});

		expect(result).toEqual({
			submission: {
				...submission,
				payload: {
					...submission.payload,
					password: undefined,
				},
			},
			intendedValue: undefined,
			error: undefined,
		});

		// Test hiding fields from both payload and intendedValue
		const resultWithIntendedValue = report(submission, {
			hideFields: ['password', 'email'],
			intendedValue: {
				name: 'Jane',
				email: 'jane@example.com',
				password: 'newsecret',
			},
		});

		expect(resultWithIntendedValue).toEqual({
			submission: {
				...submission,
				payload: {
					...submission.payload,
					email: undefined,
					password: undefined,
				},
			},
			intendedValue: {
				name: 'Jane',
				email: undefined,
				password: undefined,
			},
			error: undefined,
		});
	});

	it('supports specifying an intended value', () => {
		const submission = {
			payload: { name: 'John', email: 'john@example.com' },
			fields: ['name', 'email'],
			intent: null,
		};

		// Test with different intended value
		const result = report(submission, {
			intendedValue: { name: 'Jane', email: 'jane@example.com' },
		});

		expect(result).toEqual({
			submission,
			intendedValue: {
				name: 'Jane',
				email: 'jane@example.com',
			},
			error: undefined,
		});

		// Edge case: when intended value equals payload reference, should be undefined
		const resultEqual = report(submission, {
			intendedValue: submission.payload,
		});

		expect(resultEqual).toEqual({
			submission,
			intendedValue: undefined,
			error: undefined,
		});

		// Test with undefined value option (should be undefined)
		const resultUndefined = report(submission);
		expect(resultUndefined).toEqual({
			submission,
			intendedValue: undefined,
			error: undefined,
		});

		// Test with keepFiles and intended value (should strip files from intended value)
		const file = new File(['content'], 'test.txt');
		const submissionWithFile = {
			payload: { name: 'John', file },
			fields: ['name', 'file'],
			intent: null,
		};

		const resultWithFiles = report(submissionWithFile, {
			keepFiles: false,
			intendedValue: { name: 'Jane', file },
		});

		expect(resultWithFiles).toEqual({
			submission: {
				...submissionWithFile,
				payload: { name: 'John' },
			},
			intendedValue: {
				name: 'Jane',
			},
			error: undefined,
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
						return '';
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

		expect(isDirty(submission.payload)).toBe(false);
	});
});

test('serialize', () => {
	const txtFile = new File(['hello', 'world'], 'example.txt');
	const svgFile = new File(['<svg></svg>'], 'example.svg', {
		type: 'image/svg+xml',
	});

	expect(serialize('test')).toBe('test');
	expect(serialize(true)).toBe('on');
	expect(serialize(false)).toBe('');
	expect(serialize(123)).toBe('123');
	expect(serialize(987654321n)).toBe('987654321');
	expect(serialize(new Date(12345))).toBe(new Date(12345).toISOString());
	expect(serialize(new Map())).toBeUndefined();
	expect(serialize(new Set())).toBeUndefined();
	expect(serialize(txtFile)).toBe(txtFile);
	expect(serialize([txtFile, svgFile])).toEqual([txtFile, svgFile]);
	expect(serialize(null)).toBe('');
	expect(serialize(undefined)).toBeUndefined();
	expect(serialize({ a: 1, b: 2, c: 3 })).toBeUndefined();
	expect(serialize(['foo', 'bar'])).toEqual(['foo', 'bar']);
	expect(serialize([{ foo: 'bar' }])).toBeUndefined();
});
