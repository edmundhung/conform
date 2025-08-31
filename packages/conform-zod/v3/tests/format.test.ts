import { describe, test, expect } from 'vitest';
import { formatResult } from '../format';
import { z } from 'zod';

describe('formatResult', () => {
	test('returns null for successful validation', () => {
		const schema = z.object({ name: z.string() });
		const result = schema.safeParse({ name: 'John' });
		const formatted = formatResult(result);

		expect(formatted).toBeNull();
	});

	test('returns error and value with includeValue option', () => {
		const schema = z.object({ name: z.string(), age: z.number() });
		const result = schema.safeParse({ name: 'John', age: 25 });
		const formatted = formatResult(result, { includeValue: true });

		expect(formatted).toEqual({
			error: null,
			value: { name: 'John', age: 25 },
		});
	});

	test('formats field errors', () => {
		const schema = z.object({
			name: z.string().min(1, 'Name is required'),
			age: z.number().min(18, 'Must be at least 18'),
		});
		const result = schema.safeParse({ name: '', age: 16 });
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
		const schema = z.object({
			user: z.object({
				name: z.string().min(1, 'Name is required'),
				email: z.string().email('Invalid email'),
			}),
		});
		const result = schema.safeParse({
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
		const schema = z.object({
			items: z.array(z.string().min(1, 'Item cannot be empty')),
		});
		const result = schema.safeParse({ items: ['', 'valid', ''] });

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
		const schema = z
			.object({
				password: z.string(),
				confirmPassword: z.string(),
			})
			.refine((data) => data.password === data.confirmPassword, {
				message: 'Passwords do not match',
			});
		const result = schema.safeParse({
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
		const schema = z.object({
			name: z.string().min(1, 'Name is required'),
		});
		const result = schema.safeParse({ name: '' });

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
		const schema = z.object({
			name: z.string().min(1, 'Name is required'),
			age: z.number().min(18, 'Must be at least 18'),
		});
		const result = schema.safeParse({ name: '', age: 16 });

		const formatted = formatResult(result, {
			formatIssues: (issues, name) =>
				issues.map((issue) => ({
					message: issue.message,
					code: issue.code,
					field: name,
				})),
		});

		expect(formatted).toEqual({
			formErrors: [],
			fieldErrors: {
				name: [
					{
						message: 'Name is required',
						code: 'too_small',
						field: 'name',
					},
				],
				age: [
					{
						message: 'Must be at least 18',
						code: 'too_small',
						field: 'age',
					},
				],
			},
		});
	});

	test('combines custom formatIssues with includeValue', () => {
		const schema = z.object({
			email: z.string().email('Invalid email'),
		});
		const result = schema.safeParse({ email: 'invalid' });

		const formatted = formatResult(result, {
			includeValue: true,
			formatIssues: (issues) => issues.map((issue) => issue.code),
		});

		expect(formatted).toEqual({
			error: {
				formErrors: [],
				fieldErrors: {
					email: ['invalid_string'],
				},
			},
			value: undefined,
		});
	});

	test('aggregates multiple issues per field with custom formatIssues', () => {
		const schema = z.object({
			password: z
				.string()
				.min(8, 'Too short')
				.regex(/[A-Z]/, 'Must contain uppercase')
				.regex(/[0-9]/, 'Must contain number'),
		});
		const result = schema.safeParse({ password: 'abc' });

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
		const schema = z.string().refine(() => false, 'Always fails');
		const result = schema.safeParse('test');

		const formatted = formatResult(result);

		expect(formatted).toEqual({
			formErrors: ['Always fails'],
			fieldErrors: {},
		});
	});

	test('returns null for empty object validation', () => {
		const schema = z.object({});
		const result = schema.safeParse({});

		expect(formatResult(result)).toBeNull();
	});

	test('ignores formatIssues when validation succeeds', () => {
		const schema = z.object({ name: z.string() });
		const result = schema.safeParse({ name: 'John' });

		const formatted = formatResult(result, {
			formatIssues: () => ['Should not be called'],
		});

		expect(formatted).toBeNull();
	});
});
