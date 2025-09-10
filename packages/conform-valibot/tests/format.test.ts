import { describe, test, expect } from 'vitest';
import { formatResult } from '../format';
import * as v from 'valibot';

describe('formatResult', () => {
	test('returns null for successful validation', () => {
		const schema = v.object({ name: v.string() });
		const result = v.safeParse(schema, { name: 'John' });
		const formatted = formatResult(result);

		expect(formatted).toBeNull();
	});

	test('returns error and value with includeValue option', () => {
		const schema = v.object({ name: v.string(), age: v.number() });
		const result = v.safeParse(schema, { name: 'John', age: 25 });
		const formatted = formatResult(result, { includeValue: true });

		expect(formatted).toEqual({
			error: null,
			value: { name: 'John', age: 25 },
		});
	});

	test('formats field errors', () => {
		const schema = v.object({
			name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
			age: v.pipe(v.number(), v.minValue(18, 'Must be at least 18')),
		});
		const result = v.safeParse(schema, { name: '', age: 16 });
		const formatted = formatResult(result);

		expect(formatted).toEqual({
			formErrors: [],
			fieldErrors: {
				name: ['Name is required'],
				age: ['Must be at least 18'],
			},
		});
	});

	test('formats nested field errors', () => {
		const schema = v.object({
			user: v.object({
				name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
				email: v.pipe(v.string(), v.email('Invalid email')),
			}),
		});
		const result = v.safeParse(schema, {
			user: { name: '', email: 'invalid' },
		});
		const formatted = formatResult(result);

		expect(formatted).toEqual({
			formErrors: [],
			fieldErrors: {
				'user.name': ['Name is required'],
				'user.email': ['Invalid email'],
			},
		});
	});

	test('formats array field errors', () => {
		const schema = v.object({
			items: v.array(
				v.pipe(v.string(), v.minLength(1, 'Item cannot be empty')),
			),
		});
		const result = v.safeParse(schema, { items: ['', 'valid', ''] });

		const formatted = formatResult(result);

		expect(formatted).toEqual({
			formErrors: [],
			fieldErrors: {
				'items[0]': ['Item cannot be empty'],
				'items[2]': ['Item cannot be empty'],
			},
		});
	});

	test('formats form-level errors', () => {
		const schema = v.pipe(
			v.object({
				password: v.string(),
				confirmPassword: v.string(),
			}),
			v.check(
				(data) => data.password === data.confirmPassword,
				'Passwords do not match',
			),
		);
		const result = v.safeParse(schema, {
			password: 'secret',
			confirmPassword: 'different',
		});
		const formatted = formatResult(result);

		expect(formatted).toEqual({
			formErrors: ['Passwords do not match'],
			fieldErrors: {},
		});
	});

	test('includes value with includeValue when validation fails', () => {
		const schema = v.object({
			name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
		});
		const result = v.safeParse(schema, { name: '' });

		const formatted = formatResult(result, { includeValue: true });

		expect(formatted).toEqual({
			error: {
				formErrors: [],
				fieldErrors: {
					name: ['Name is required'],
				},
			},
			value: undefined,
		});
	});

	test('uses custom formatIssues function', () => {
		const schema = v.object({
			name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
			age: v.pipe(v.number(), v.minValue(18, 'Must be at least 18')),
		});
		const result = v.safeParse(schema, { name: '', age: 16 });

		const formatted = formatResult(result, {
			formatIssues: (issues, name) =>
				issues.map((issue) => ({
					message: issue.message,
					expected: issue.expected,
					field: name,
				})),
		});

		expect(formatted).toEqual({
			formErrors: [],
			fieldErrors: {
				name: [
					{
						message: 'Name is required',
						expected: '>=1',
						field: 'name',
					},
				],
				age: [
					{
						message: 'Must be at least 18',
						expected: '>=18',
						field: 'age',
					},
				],
			},
		});
	});

	test('combines custom formatIssues with includeValue', () => {
		const schema = v.object({
			email: v.pipe(v.string(), v.email('Invalid email')),
		});
		const result = v.safeParse(schema, { email: 'invalid' });

		const formatted = formatResult(result, {
			includeValue: true,
			formatIssues: (issues) => issues.map((issue) => issue.received),
		});

		expect(formatted).toEqual({
			error: {
				formErrors: [],
				fieldErrors: {
					email: ['"invalid"'],
				},
			},
			value: undefined,
		});
	});

	test('aggregates multiple issues per field with custom formatIssues', () => {
		const schema = v.object({
			password: v.pipe(
				v.string(),
				v.minLength(8, 'Too short'),
				v.regex(/[A-Z]/, 'Must contain uppercase'),
				v.regex(/[0-9]/, 'Must contain number'),
			),
		});
		const result = v.safeParse(schema, { password: 'abc' });

		const formatted = formatResult(result, {
			formatIssues: (issues, fieldName) => [
				`${fieldName} has ${issues.length} errors: ${issues.map((i) => i.message).join(', ')}`,
			],
		});

		expect(formatted).toEqual({
			formErrors: [],
			fieldErrors: {
				password: [
					'password has 3 errors: Too short, Must contain uppercase, Must contain number',
				],
			},
		});
	});

	test('preserves form-level error structure when no field errors exist', () => {
		const schema = v.pipe(
			v.string(),
			v.check(() => false, 'Always fails'),
		);
		const result = v.safeParse(schema, 'test');

		const formatted = formatResult(result);

		expect(formatted).toEqual({
			formErrors: ['Always fails'],
			fieldErrors: {},
		});
	});

	test('returns null for empty object validation', () => {
		const schema = v.object({});
		const result = v.safeParse(schema, {});

		expect(formatResult(result)).toBeNull();
	});

	test('ignores formatIssues when validation succeeds', () => {
		const schema = v.object({ name: v.string() });
		const result = v.safeParse(schema, { name: 'John' });

		const formatted = formatResult(result, {
			formatIssues: () => ['Should not be called'],
		});

		expect(formatted).toBeNull();
	});
});
