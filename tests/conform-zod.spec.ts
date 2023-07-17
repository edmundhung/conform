import { test, expect } from '@playwright/test';
import { getFieldsetConstraint, parse, refine } from '@conform-to/zod';
import { z } from 'zod';
import { installGlobals } from '@remix-run/node';

function createFormData(entries: Array<[string, string | File]>): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

function createSchema() {
	return z
		.object({
			text: z
				.string({ required_error: 'required' })
				.min(10, 'min')
				.max(100, 'max')
				.regex(/^[A-Z]{1-100}$/, 'regex')
				.refine(() => false, 'refine'),
			number: z
				.string({ required_error: 'required' })
				.pipe(z.coerce.number().min(1, 'min').max(10, 'max').step(2, 'step')),
			timestamp: z
				.string()
				.optional()
				.pipe(
					z.coerce
						.date()
						.min(new Date(1), 'min')
						.max(new Date(), 'max')
						.default(new Date()),
				),
			flag: z.coerce.boolean().optional(),
			options: z
				.array(z.enum(['a', 'b', 'c']).refine(() => false, 'refine'))
				.min(3, 'min'),
			nested: z
				.object({
					key: z.string().refine(() => false, 'refine'),
				})
				.refine(() => false, 'refine'),
			list: z
				.array(
					z
						.object({
							key: z
								.string({ required_error: 'required' })
								.refine(() => false, 'refine'),
						})
						.refine(() => false, 'refine'),
				)
				.max(0, 'max'),
			files: z.preprocess(
				(value) => (!value || Array.isArray(value) ? value : [value]),
				z.array(z.instanceof(File, { message: 'file message' }), {
					required_error: 'required',
				}),
			),
		})
		.refine(() => false, 'refine');
}

test.beforeAll(() => {
	installGlobals();
});

test.describe('conform-zod', () => {
	test('getFieldsetConstraint', () => {
		const schema = createSchema();
		const constraint = {
			text: {
				required: true,
				minLength: 10,
				maxLength: 100,
				pattern: '^[A-Z]{1-100}$',
			},
			number: {
				required: true,
				min: 1,
				max: 10,
			},
			timestamp: {
				required: false,
			},
			flag: {
				required: false,
			},
			options: {
				required: true,
				pattern: 'a|b|c',
				multiple: true,
			},
			files: {
				required: true,
				multiple: true,
			},
			nested: {
				required: true,
			},
			list: {
				required: true,
				multiple: true,
			},
		};

		expect(getFieldsetConstraint(schema)).toEqual(constraint);

		// Non-object schemas will be ignored
		expect(getFieldsetConstraint(z.string())).toEqual({});
		expect(getFieldsetConstraint(z.string().array())).toEqual({});

		// Intersection is supported
		expect(
			getFieldsetConstraint(
				schema.and(
					z.object({ text: z.string().optional(), something: z.string() }),
				),
			),
		).toEqual({
			...constraint,
			text: { required: false },
			something: { required: true },
		});

		// Union is supported
		expect(
			getFieldsetConstraint(
				z
					.union([
						z.object({
							type: z.literal('a'),
							foo: z.string().min(1, 'min'),
							baz: z.string().min(1, 'min'),
						}),
						z.object({
							type: z.literal('b'),
							bar: z.string().min(1, 'min'),
							baz: z.string().min(1, 'min'),
						}),
					])
					.and(
						z.object({
							qux: z.string().min(1, 'min'),
						}),
					),
			),
		).toEqual({
			type: { required: true },
			foo: { required: false, minLength: 1 },
			bar: { required: false, minLength: 1 },
			baz: { required: true, minLength: 1 },
			qux: { required: true, minLength: 1 },
		});

		// Discriminated union is also supported
		expect(
			getFieldsetConstraint(
				z
					.discriminatedUnion('type', [
						z.object({
							type: z.literal('a'),
							foo: z.string().min(1, 'min'),
							baz: z.string().min(1, 'min'),
						}),
						z.object({
							type: z.literal('b'),
							bar: z.string().min(1, 'min'),
							baz: z.string().min(1, 'min'),
						}),
					])
					.and(
						z.object({
							qux: z.string().min(1, 'min'),
						}),
					),
			),
		).toEqual({
			type: { required: true },
			foo: { required: false, minLength: 1 },
			bar: { required: false, minLength: 1 },
			baz: { required: true, minLength: 1 },
			qux: { required: true, minLength: 1 },
		});
	});

	test('parse with empty value stripped', () => {
		const schema = createSchema();
		const formData = createFormData([
			['text', 'xyz'],
			['number', '3'],
			['timestamp', new Date(0).toISOString()],
			['flag', 'no'],
			['options[0]', 'a'],
			['options[1]', 'b'],
			['nested.key', 'foobar'],
			['list[0].key', ''],
			['files', new File([''], '')],
		]);
		const payload = {
			text: 'xyz',
			number: '3',
			timestamp: new Date(0).toISOString(),
			flag: 'no',
			options: ['a', 'b'],
			files: undefined,
			nested: { key: 'foobar' },
			list: [{ key: undefined }],
		};
		const error = {
			text: ['min', 'regex', 'refine'],
			number: 'step',
			timestamp: 'min',
			options: 'min',
			'options[0]': 'refine',
			'options[1]': 'refine',
			'nested.key': 'refine',
			files: 'required',
			nested: 'refine',
			list: 'max',
			'list[0].key': 'required',
		};

		expect(parse(formData, { schema, stripEmptyValue: true })).toEqual({
			intent: 'submit',
			payload,
			error,
		});
	});

	test('parse without empty value stripped', () => {
		const schema = createSchema();
		const emptyFile = new File([''], '');
		const formData = createFormData([
			['text', 'xyz'],
			['number', '3'],
			['timestamp', new Date(0).toISOString()],
			['flag', 'no'],
			['options[0]', 'a'],
			['options[1]', 'b'],
			['nested.key', 'foobar'],
			['list[0].key', ''],
			['files', emptyFile],
		]);
		const payload = {
			text: 'xyz',
			number: '3',
			timestamp: new Date(0).toISOString(),
			flag: 'no',
			options: ['a', 'b'],
			files: emptyFile,
			nested: { key: 'foobar' },
			list: [{ key: '' }],
		};
		const error = {
			text: 'min',
			number: 'step',
			timestamp: 'min',
			options: 'min',
			'options[0]': 'refine',
			'options[1]': 'refine',
			'nested.key': 'refine',
			nested: 'refine',
			list: 'max',
			'list[0].key': 'refine',
			'list[0]': 'refine',
			'': 'refine',
		};

		expect(parse(formData, { schema, stripEmptyValue: false })).toEqual({
			intent: 'submit',
			payload,
			error,
		});
	});

	test('parse with errorMap', () => {
		const schema = z.object({
			text: z.string().min(5),
		});
		const formData = createFormData([['text', 'abc']]);

		expect(
			parse(formData, {
				schema,
				errorMap(error, ctx) {
					if (error.code === 'too_small' && error.minimum === 5) {
						return { message: 'The field is too short' };
					}

					// fall back to default message!
					return { message: ctx.defaultError };
				},
			}),
		).toEqual({
			intent: 'submit',
			payload: {
				text: 'abc',
			},
			error: {
				text: 'The field is too short',
			},
		});
	});

	test('parse with refine', () => {
		const createSchema = (
			validate?: (email) => Promise<boolean> | boolean,
			when?: boolean,
		) =>
			z.object({
				email: z
					.string()
					.email()
					.superRefine((email, ctx) =>
						refine(ctx, {
							validate: () => validate?.(email),
							when,
							message: 'Email is invalid',
						}),
					),
			});
		const formData = createFormData([['email', 'test@example.com']]);
		const submission = {
			intent: 'submit',
			payload: {
				email: 'test@example.com',
			},
		};

		expect(parse(formData, { schema: createSchema() })).toEqual({
			...submission,
			error: {
				email: '__undefined__',
			},
		});
		expect(parse(formData, { schema: createSchema(() => false) })).toEqual({
			...submission,
			error: {
				email: 'Email is invalid',
			},
		});
		expect(parse(formData, { schema: createSchema(() => true) })).toEqual({
			...submission,
			error: {},
			value: submission.payload,
		});
		expect(
			parse(formData, { schema: createSchema(() => true, false) }),
		).toEqual({
			...submission,
			error: {
				email: '__skipped__',
			},
		});
		expect(
			parse(formData, { schema: createSchema(() => false, false) }),
		).toEqual({
			...submission,
			error: {
				email: '__skipped__',
			},
		});
		expect(
			parse(formData, { schema: createSchema(() => false, true) }),
		).toEqual({
			...submission,
			error: {
				email: 'Email is invalid',
			},
		});
		expect(parse(formData, { schema: createSchema(() => true, true) })).toEqual(
			{
				...submission,
				error: {},
				value: submission.payload,
			},
		);
	});
});
