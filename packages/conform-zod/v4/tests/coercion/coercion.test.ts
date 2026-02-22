import { describe, test, expect } from 'vitest';
import {
	coerceFormValue,
	coerceStructure,
	configureCoercion,
} from '../../coercion';
import { z } from 'zod-v4';
import { getResult } from '../../../tests/helpers/zod';

describe('coercion', () => {
	describe('coerceFormValue', () => {
		test('getter-based recursive schema', () => {
			const ConditionNodeSchema = z.object({
				type: z.literal('condition'),
				value: z.string(),
			});

			const LogicalGroupNodeSchema = z.object({
				type: z.literal('group'),
				operator: z.enum(['AND', 'OR']),
				get children(): z.ZodArray<
					z.ZodDiscriminatedUnion<
						[typeof LogicalGroupNodeSchema, typeof ConditionNodeSchema]
					>
				> {
					return z.array(
						z.discriminatedUnion('type', [
							LogicalGroupNodeSchema,
							ConditionNodeSchema,
						]),
					);
				},
			});

			const schema = coerceFormValue(
				z.object({
					filter: LogicalGroupNodeSchema,
				}),
			);

			expect(
				getResult(
					schema.safeParse({
						filter: {
							type: 'group',
							operator: 'AND',
							children: [
								{ type: 'condition', value: 'test' },
								{
									type: 'group',
									operator: 'OR',
									children: [{ type: 'condition', value: 'nested' }],
								},
							],
						},
					}),
				),
			).toEqual({
				success: true,
				data: {
					filter: {
						type: 'group',
						operator: 'AND',
						children: [
							{ type: 'condition', value: 'test' },
							{
								type: 'group',
								operator: 'OR',
								children: [{ type: 'condition', value: 'nested' }],
							},
						],
					},
				},
			});

			expect(
				getResult(
					schema.safeParse({
						filter: {
							type: 'group',
							operator: 'AND',
							children: [{ type: 'condition', value: '' }],
						},
					}),
				),
			).toEqual({
				success: false,
				error: {
					'filter.children[0].value': expect.any(Array),
				},
			});
		});
	});

	describe('coerceStructure', () => {
		test('number', () => {
			const schema = coerceStructure(z.number().min(1).max(10));

			// string
			expect(schema.parse('6')).toBe(6);
			expect(schema.parse('abc')).toBeNaN();
			expect(schema.parse('')).toBeNaN();
			expect(schema.parse(' ')).toBeNaN();
			expect(schema.parse('0')).toBe(0);
			expect(schema.parse('100')).toBe(100);

			// number
			expect(schema.parse(42)).toBe(42);
			expect(schema.parse(NaN)).toBeNaN();

			// invalid type
			expect(() => schema.parse(true)).toThrow();
		});

		test('string', () => {
			const schema = coerceStructure(z.string().min(3).email());

			// string
			expect(schema.parse('hi')).toBe('hi');
			expect(schema.parse('x')).toBe('x');
			expect(schema.parse('not-an-email')).toBe('not-an-email');
			expect(schema.parse('')).toBe('');

			// invalid type
			expect(() => schema.parse(42)).toThrow();
		});

		test('boolean', () => {
			const schema = coerceStructure(z.boolean());

			// string
			expect(schema.parse('on')).toBe(true);
			expect(schema.parse('')).toBe(false);
			expect(schema.parse('true')).toBe(false);
			expect(schema.parse('false')).toBe(false);
			expect(schema.parse('other')).toBe(false);

			// boolean
			expect(schema.parse(true)).toBe(true);
			expect(schema.parse(false)).toBe(false);

			// invalid type
			expect(() => schema.parse(42)).toThrow();
		});

		test('date', () => {
			const schema = coerceStructure(
				z.date().min(new Date(1)).max(new Date(10)),
			);

			// string
			expect(schema.parse(new Date(5).toISOString())).toEqual(new Date(5));
			expect(schema.parse(new Date(0).toISOString())).toEqual(new Date(0));
			const invalidDate = schema.parse('abc');
			expect(invalidDate).toBeInstanceOf(Date);
			expect(invalidDate.getTime()).toBeNaN();
			const emptyDate = schema.parse('');
			expect(emptyDate).toBeInstanceOf(Date);
			expect(emptyDate.getTime()).toBeNaN();

			// date
			const validDate = new Date(5);
			expect(schema.parse(validDate)).toBe(validDate);

			// invalid type
			expect(() => schema.parse(42)).toThrow();
		});

		test('bigint', () => {
			const schema = coerceStructure(z.bigint());

			// string
			expect(schema.parse('123')).toBe(123n);
			expect(schema.parse('abc')).toBe(0n);
			expect(schema.parse('')).toBe(0n);

			// bigint
			expect(schema.parse(123n)).toBe(123n);

			// invalid type
			expect(() => schema.parse(42)).toThrow();
		});

		test('enum', () => {
			const schema = coerceStructure(z.enum(['active', 'inactive']));

			// string (valid)
			expect(schema.parse('active')).toBe('active');
			expect(schema.parse('inactive')).toBe('inactive');

			// string (invalid) — constrained type, keeps original schema
			expect(() => schema.parse('bogus')).toThrow();

			// invalid type — constrained type, throws
			expect(() => schema.parse(42)).toThrow();
		});

		test('literal', () => {
			// string
			expect(coerceStructure(z.literal('a')).parse('a')).toBe('a');
			expect(() => coerceStructure(z.literal('a')).parse('b')).toThrow();
			expect(coerceStructure(z.literal(0)).parse('0')).toBe(0);
			expect(() => coerceStructure(z.literal(0)).parse('1')).toThrow();
			expect(coerceStructure(z.literal(true)).parse('on')).toBe(true);

			// corresponding type
			expect(coerceStructure(z.literal(0)).parse(0)).toBe(0);
			expect(coerceStructure(z.literal(true)).parse(true)).toBe(true);

			// invalid type — constrained type, throws
			expect(() => coerceStructure(z.literal('a')).parse(42)).toThrow();
			expect(() => coerceStructure(z.literal(0)).parse(true)).toThrow();
		});

		test('object', () => {
			const schema = coerceStructure(
				z.object({
					name: z.string().min(3),
					age: z.number().min(0),
					email: z.string().email(),
				}),
			);

			// string values coerced within object
			expect(
				schema.parse({ name: 'Jo', age: 'abc', email: 'not-an-email' }),
			).toEqual({ name: 'Jo', age: NaN, email: 'not-an-email' });

			// nested object defaults undefined to {}
			const nested = coerceStructure(
				z.object({ inner: z.object({ text: z.string().optional() }) }),
			);
			expect(nested.parse({})).toEqual({ inner: {} });

			// .strict() should not reject extra keys in structural mode
			const strict = coerceStructure(
				z.object({ name: z.string().min(3) }).strict(),
			);
			expect(strict.parse({ name: 'hi', extra: 'key' })).toEqual({
				name: 'hi',
			});

			// invalid type
			expect(() => schema.parse('not-an-object')).toThrow();
			expect(() => schema.parse(42)).toThrow();
		});

		test('array', () => {
			const schema = coerceStructure(z.array(z.number().min(0)).nonempty());

			// string values coerced within array
			expect(schema.parse(['1', 'abc', '3'])).toEqual([1, NaN, 3]);

			// single string wrapped into array
			expect(schema.parse('5')).toEqual([5]);

			// undefined becomes empty array
			expect(schema.parse(undefined)).toEqual([]);

			// empty array (constraints like .nonempty() are stripped)
			expect(schema.parse([])).toEqual([]);

			// array of correct type
			expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);

			// invalid type
			expect(() => schema.parse(true)).toThrow();
		});

		test('optional', () => {
			const schema = coerceStructure(z.number().optional());

			// string
			expect(schema.parse('5')).toBe(5);

			// number
			expect(schema.parse(42)).toBe(42);

			// undefined
			expect(schema.parse(undefined)).toBeUndefined();

			// invalid type
			expect(() => schema.parse(true)).toThrow();
		});

		test('nullable', () => {
			const schema = coerceStructure(z.number().nullable());

			// string
			expect(schema.parse('5')).toBe(5);

			// number
			expect(schema.parse(42)).toBe(42);

			// null
			expect(schema.parse(null)).toBeNull();

			// invalid type
			expect(() => schema.parse(true)).toThrow();
		});

		test('transform', () => {
			expect(
				coerceStructure(z.string().transform((s) => s.trim())).parse(
					'  hello  ',
				),
			).toBe('  hello  ');

			const stringToNumber = coerceStructure(
				z
					.string()
					.transform((s) => Number(s))
					.pipe(z.number().min(5)),
			);

			expect(stringToNumber.parse('3')).toBe('3');
		});

		test('default', () => {
			// .default() implies the field can be absent; undefined passes through
			expect(
				coerceStructure(z.string().optional().default('N/A')).parse(undefined),
			).toBeUndefined();
			expect(
				coerceStructure(z.number().optional().default(0)).parse(undefined),
			).toBeUndefined();
			expect(
				coerceStructure(z.string().default('N/A')).parse(undefined),
			).toBeUndefined();
			expect(
				coerceStructure(z.number().default(0)).parse(undefined),
			).toBeUndefined();
			expect(
				coerceStructure(z.boolean().default(false)).parse(undefined),
			).toBeUndefined();
		});

		test('error', () => {
			const schema = coerceStructure(z.number());
			const result = schema.safeParse(true);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual([
					{
						code: 'invalid_type',
						expected: 'number',
						received: 'boolean',
						path: [],
						message: 'Invalid input: expected number, received boolean',
					},
				]);
			}

			const dateSchema = coerceStructure(z.date());
			const dateResult = dateSchema.safeParse(42);

			expect(dateResult.success).toBe(false);
			if (!dateResult.success) {
				expect(dateResult.error.issues).toEqual([
					{
						code: 'invalid_type',
						expected: 'date',
						received: 'number',
						path: [],
						message: 'Invalid input: expected date, received number',
					},
				]);
			}
		});

		test('lazy', () => {
			type Tree = {
				value: number;
				children: Tree[];
			};

			const treeSchema: z.ZodType<Tree> = z.object({
				value: z.number(),
				children: z.lazy(() => treeSchema).array(),
			});

			const schema = coerceStructure(treeSchema);

			// string coercion in nested lazy structure
			expect(
				schema.parse({
					value: '42',
					children: [{ value: '1', children: [] }],
				}),
			).toEqual({
				value: 42,
				children: [{ value: 1, children: [] }],
			});

			// invalid coercion produces NaN
			expect(schema.parse({ value: 'abc', children: [] })).toEqual({
				value: NaN,
				children: [],
			});

			// correct types pass through
			expect(
				schema.parse({ value: 5, children: [{ value: 10, children: [] }] }),
			).toEqual({ value: 5, children: [{ value: 10, children: [] }] });

			// invalid type in nested structure
			expect(() =>
				schema.parse({ value: 5, children: [{ value: true, children: [] }] }),
			).toThrow();
		});

		test('union', () => {
			// discriminated union
			const discriminatedSchema = coerceStructure(
				z.discriminatedUnion('type', [
					z.object({ type: z.literal('text'), value: z.string().min(1) }),
					z.object({ type: z.literal('number'), value: z.number().min(0) }),
				]),
			);

			// coercion within variants
			expect(discriminatedSchema.parse({ type: 'text', value: '' })).toEqual({
				type: 'text',
				value: '',
			});
			expect(
				discriminatedSchema.parse({ type: 'number', value: 'abc' }),
			).toEqual({
				type: 'number',
				value: NaN,
			});

			// invalid discriminator
			expect(() =>
				discriminatedSchema.parse({ type: 'bogus', value: '' }),
			).toThrow();

			// invalid type
			expect(() => discriminatedSchema.parse('not-an-object')).toThrow();

			// regular union with object types
			const objectUnionSchema = coerceStructure(
				z.union([
					z.object({ type: z.literal('number'), value: z.number() }),
					z.object({ type: z.literal('string'), value: z.string() }),
				]),
			);

			// Number branch
			const numberResult = objectUnionSchema.parse({
				type: 'number',
				value: '42',
			});
			expect(numberResult).toEqual({ type: 'number', value: 42 });

			// String branch - value stays as string
			const stringResult = objectUnionSchema.parse({
				type: 'string',
				value: 'hello',
			});
			expect(stringResult).toEqual({ type: 'string', value: 'hello' });

			// Invalid number becomes NaN but union still resolves
			const invalidNumber = objectUnionSchema.parse({
				type: 'number',
				value: 'abc',
			});
			expect(invalidNumber.value).toBeNaN();
		});
	});

	describe('configureCoercion', () => {
		const schema = z.object({
			title: z.string({ message: 'required' }),
			count: z.number({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}),
			amount: z.bigint({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}),
			date: z.date({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}),
			confirmed: z.boolean({
				error: (ctx) => {
					if (ctx.input === undefined) {
						return 'required';
					}
					return 'invalid';
				},
			}),
			file: z.file({ message: 'message' }),
		});

		test('stripEmptyString', () => {
			const exampleFile = new File(['hello', 'world'], 'example.txt');

			expect(
				getResult(
					configureCoercion({
						stripEmptyString: (value) => {
							const trimmed = value.trim();
							return trimmed === '' ? undefined : trimmed;
						},
					})
						.coerceFormValue(schema)
						.safeParse({
							title: ' ',
							count: ' ',
							amount: ' ',
							date: ' ',
							confirmed: ' ',
							file: exampleFile,
						}),
				),
			).toEqual({
				success: false,
				error: {
					title: ['required'],
					amount: ['required'],
					count: ['required'],
					date: ['required'],
					confirmed: ['required'],
				},
			});
		});

		test('type', () => {
			const exampleFile = new File(['hello', 'world'], 'example.txt');

			expect(
				getResult(
					configureCoercion({
						type: {
							number: (text) => Number(text.trim().replace(/,/g, '')),
							boolean: (text) => text === 'true',
						},
					})
						.coerceFormValue(schema)
						.safeParse({
							title: ' example ',
							count: ' 123,456 ',
							amount: '9876543210',
							date: '1970-01-01',
							confirmed: 'true',
							file: exampleFile,
						}),
				),
			).toEqual({
				success: true,
				data: {
					title: ' example ',
					count: 123456,
					amount: 9876543210n,
					date: new Date('1970-01-01'),
					confirmed: true,
					file: exampleFile,
				},
			});
		});

		test('customize', () => {
			const Payment = z.object({
				count: z.number({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				}),
				amount: z.bigint({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				}),
				date: z.date({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}
						return 'invalid';
					},
				}),
				confirmed: z.boolean({ message: 'invalid' }),
			});
			const paymentSchema = z.object({
				title: z.string({ message: 'required' }),
				payment: Payment,
			});

			expect(
				getResult(
					configureCoercion({
						customize(type) {
							if (type === Payment) {
								return (value) => {
									if (typeof value !== 'string') {
										throw new Error('Expected string input for payment');
									}

									return JSON.parse(value);
								};
							}

							return null;
						},
					})
						.coerceFormValue(paymentSchema)
						.safeParse({
							title: 'Test',
							payment: JSON.stringify({
								count: 123,
								confirmed: true,
								amount: '123456',
							}),
						}),
				),
			).toEqual({
				success: false,
				error: {
					'payment.amount': ['invalid'],
					'payment.date': ['required'],
				},
			});
		});
	});
});
