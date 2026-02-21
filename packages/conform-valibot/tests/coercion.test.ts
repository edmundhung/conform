import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import {
	coerceFormValue,
	coerceStructure,
	configureCoercion,
} from '../coercion';
import { getResult } from './helpers/valibot';

describe('coercion', () => {
	describe('coerceFormValue', () => {
		test('default behavior', () => {
			const schema = v.object({
				text: v.string(),
				num: v.number(),
				flag: v.boolean(),
				timestamp: v.date(),
				bigNumber: v.bigint(),
			});

			const coercedSchema = coerceFormValue(schema);
			const result = v.safeParse(coercedSchema, {
				text: 'hello',
				num: '123',
				flag: 'on',
				timestamp: '2023-01-01',
				bigNumber: '9007199254740991',
			});
			expect(getResult(result)).toEqual({
				success: true,
				data: {
					text: 'hello',
					num: 123,
					flag: true,
					timestamp: new Date('2023-01-01'),
					bigNumber: BigInt('9007199254740991'),
				},
			});
		});

		test('lazy', () => {
			type Tree = {
				value: number;
				children: Tree[];
			};

			const treeSchema: v.GenericSchema<Tree> = v.object({
				value: v.number(),
				children: v.array(v.lazy(() => treeSchema)),
			});

			const coercedSchema = coerceFormValue(treeSchema);

			// string coercion in nested lazy structure
			const result = v.safeParse(coercedSchema, {
				value: '42',
				children: [{ value: '1', children: [] }],
			});
			expect(getResult(result)).toEqual({
				success: true,
				data: {
					value: 42,
					children: [{ value: 1, children: [] }],
				},
			});

			// empty string stripped to undefined (validation fails)
			const failResult = v.safeParse(coercedSchema, {
				value: '',
				children: [],
			});
			expect(failResult.success).toBe(false);
		});
	});

	describe('coerceStructure', () => {
		test('number', () => {
			const schema = coerceStructure(
				v.pipe(v.number(), v.minValue(1), v.maxValue(10)),
			);

			// string
			expect(v.parse(schema, '6')).toBe(6);
			expect(v.parse(schema, 'abc')).toBeNaN();
			expect(v.parse(schema, '')).toBeNaN();
			expect(v.parse(schema, ' ')).toBeNaN();
			expect(v.parse(schema, '0')).toBe(0);
			expect(v.parse(schema, '100')).toBe(100);

			// number
			expect(v.parse(schema, 42)).toBe(42);
			expect(v.parse(schema, NaN)).toBeNaN();

			// invalid type
			expect(() => v.parse(schema, true)).toThrow();
		});

		test('string', () => {
			const schema = coerceStructure(
				v.pipe(v.string(), v.minLength(3), v.email()),
			);

			// string
			expect(v.parse(schema, 'hi')).toBe('hi');
			expect(v.parse(schema, 'x')).toBe('x');
			expect(v.parse(schema, 'not-an-email')).toBe('not-an-email');
			expect(v.parse(schema, '')).toBe('');

			// invalid type
			expect(() => v.parse(schema, 42)).toThrow();
		});

		test('boolean', () => {
			const schema = coerceStructure(v.boolean());

			// string
			expect(v.parse(schema, 'on')).toBe(true);
			expect(v.parse(schema, '')).toBe(false);
			expect(v.parse(schema, 'true')).toBe(false);
			expect(v.parse(schema, 'false')).toBe(false);
			expect(v.parse(schema, 'other')).toBe(false);

			// boolean
			expect(v.parse(schema, true)).toBe(true);
			expect(v.parse(schema, false)).toBe(false);

			// invalid type
			expect(() => v.parse(schema, 42)).toThrow();
		});

		test('date', () => {
			const schema = coerceStructure(
				v.pipe(v.date(), v.minValue(new Date(1)), v.maxValue(new Date(10))),
			);

			// string
			expect(v.parse(schema, new Date(5).toISOString())).toEqual(new Date(5));
			expect(v.parse(schema, new Date(0).toISOString())).toEqual(new Date(0));
			const invalidDate = v.parse(schema, 'abc');
			expect(invalidDate).toBeInstanceOf(Date);
			expect(invalidDate.getTime()).toBeNaN();
			const emptyDate = v.parse(schema, '');
			expect(emptyDate).toBeInstanceOf(Date);
			expect(emptyDate.getTime()).toBeNaN();

			// date
			const validDate = new Date(5);
			expect(v.parse(schema, validDate)).toEqual(validDate);

			// invalid type
			expect(() => v.parse(schema, 42)).toThrow();
		});

		test('bigint', () => {
			const schema = coerceStructure(v.bigint());

			// string
			expect(v.parse(schema, '123')).toBe(123n);
			expect(v.parse(schema, 'abc')).toBe(0n);
			expect(v.parse(schema, '')).toBe(0n);

			// bigint
			expect(v.parse(schema, 123n)).toBe(123n);

			// invalid type
			expect(() => v.parse(schema, 42)).toThrow();
		});

		test('enum', () => {
			const schema = coerceStructure(v.picklist(['active', 'inactive']));

			// string (valid)
			expect(v.parse(schema, 'active')).toBe('active');
			expect(v.parse(schema, 'inactive')).toBe('inactive');

			// string (invalid) — constrained type, keeps original schema
			expect(() => v.parse(schema, 'bogus')).toThrow();

			// invalid type — constrained type, throws
			expect(() => v.parse(schema, 42)).toThrow();
		});

		test('literal', () => {
			// string
			expect(v.parse(coerceStructure(v.literal('a')), 'a')).toBe('a');
			expect(() => v.parse(coerceStructure(v.literal('a')), 'b')).toThrow();
			expect(v.parse(coerceStructure(v.literal(0)), '0')).toBe(0);
			expect(() => v.parse(coerceStructure(v.literal(0)), '1')).toThrow();
			expect(v.parse(coerceStructure(v.literal(true)), 'on')).toBe(true);

			// corresponding type
			expect(v.parse(coerceStructure(v.literal(0)), 0)).toBe(0);
			expect(v.parse(coerceStructure(v.literal(true)), true)).toBe(true);

			// invalid type — constrained type, throws
			expect(() => v.parse(coerceStructure(v.literal('a')), 42)).toThrow();
			expect(() => v.parse(coerceStructure(v.literal(0)), true)).toThrow();
		});

		test('object', () => {
			const schema = coerceStructure(
				v.object({
					name: v.pipe(v.string(), v.minLength(3)),
					age: v.pipe(v.number(), v.minValue(0)),
					email: v.pipe(v.string(), v.email()),
				}),
			);

			// string values coerced within object
			expect(
				v.parse(schema, { name: 'Jo', age: 'abc', email: 'not-an-email' }),
			).toEqual({ name: 'Jo', age: NaN, email: 'not-an-email' });

			// nested object defaults undefined to {}
			const nested = coerceStructure(
				v.object({
					inner: v.object({ text: v.optional(v.string()) }),
				}),
			);
			expect(v.parse(nested, {})).toEqual({ inner: {} });

			// missing array field in object should be coerced to []
			const withArray = coerceStructure(
				v.object({
					title: v.string(),
					tasks: v.pipe(
						v.array(v.object({ content: v.string() })),
						v.minLength(1),
					),
				}),
			);
			expect(v.parse(withArray, { title: 'hello' })).toEqual({
				title: 'hello',
				tasks: [],
			});

			// strictObject should not reject extra keys in structural mode
			const strict = coerceStructure(
				v.strictObject({
					name: v.pipe(v.string(), v.minLength(3)),
				}),
			);
			expect(v.parse(strict, { name: 'hi', extra: 'key' })).toEqual({
				name: 'hi',
			});
		});

		test('array', () => {
			const schema = coerceStructure(
				v.pipe(v.array(v.pipe(v.number(), v.minValue(0))), v.minLength(1)),
			);

			// string values coerced within array
			expect(v.parse(schema, ['1', 'abc', '3'])).toEqual([1, NaN, 3]);

			// single string wrapped into array
			expect(v.parse(schema, '5')).toEqual([5]);

			// undefined becomes empty array
			expect(v.parse(schema, undefined)).toEqual([]);

			// empty array (constraints like minLength are stripped)
			expect(v.parse(schema, [])).toEqual([]);

			// array of correct type
			expect(v.parse(schema, [1, 2, 3])).toEqual([1, 2, 3]);
		});

		test('optional', () => {
			const schema = coerceStructure(v.optional(v.number()));

			// string
			expect(v.parse(schema, '5')).toBe(5);

			// number
			expect(v.parse(schema, 42)).toBe(42);

			// undefined
			expect(v.parse(schema, undefined)).toBeUndefined();

			// invalid type
			expect(() => v.parse(schema, true)).toThrow();
		});

		test('nullable', () => {
			const schema = coerceStructure(v.nullable(v.number()));

			// string
			expect(v.parse(schema, '5')).toBe(5);

			// number
			expect(v.parse(schema, 42)).toBe(42);

			// null
			expect(v.parse(schema, null)).toBeNull();

			// invalid type
			expect(() => v.parse(schema, true)).toThrow();
		});

		test('transform', () => {
			expect(
				v.parse(
					coerceStructure(
						v.pipe(
							v.string(),
							v.transform((s) => s.trim()),
						),
					),
					'  hello  ',
				),
			).toBe('  hello  ');

			const stringToNumber = v.pipe(
				v.string(),
				v.transform((s) => Number(s)),
				v.number(),
				v.minValue(5),
			);

			expect(v.parse(coerceStructure(stringToNumber), '3')).toBe('3');
		});

		test('default', () => {
			// optional + default: undefined passes through without applying default
			expect(
				v.parse(coerceStructure(v.optional(v.string(), 'N/A')), undefined),
			).toBeUndefined();
			expect(
				v.parse(coerceStructure(v.optional(v.number(), 0)), undefined),
			).toBeUndefined();
		});

		test('union', () => {
			// primitive union
			const primitiveSchema = coerceStructure(
				v.union([
					v.pipe(v.string(), v.minLength(1)),
					v.pipe(v.number(), v.minValue(0)),
				]),
			);

			// string coercion
			expect(v.parse(primitiveSchema, '')).toBe('');
			expect(v.parse(primitiveSchema, 'hello')).toBe('hello');

			// number coercion
			expect(v.parse(primitiveSchema, 42)).toBe(42);

			// object union with type coercion
			const objectSchema = coerceStructure(
				v.union([
					v.object({
						type: v.literal('number'),
						value: v.number(),
					}),
					v.object({
						type: v.literal('string'),
						value: v.string(),
					}),
				]),
			);

			// Number branch
			const numberResult = v.parse(objectSchema, {
				type: 'number',
				value: '42',
			});
			expect(numberResult).toEqual({ type: 'number', value: 42 });

			// String branch - value stays as string
			const stringResult = v.parse(objectSchema, {
				type: 'string',
				value: 'hello',
			});
			expect(stringResult).toEqual({ type: 'string', value: 'hello' });

			// Invalid number becomes NaN but union still resolves
			const invalidNumber = v.parse(objectSchema, {
				type: 'number',
				value: 'abc',
			});
			expect(invalidNumber.value).toBeNaN();
		});

		test('lazy', () => {
			type Tree = {
				value: number;
				children: Tree[];
			};

			const treeSchema: v.GenericSchema<Tree> = v.object({
				value: v.number(),
				children: v.array(v.lazy(() => treeSchema)),
			});

			const schema = coerceStructure(treeSchema);

			// string coercion in nested lazy structure
			expect(
				v.parse(schema, {
					value: '42',
					children: [{ value: '1', children: [] }],
				}),
			).toEqual({
				value: 42,
				children: [{ value: 1, children: [] }],
			});

			// invalid coercion produces NaN
			expect(v.parse(schema, { value: 'abc', children: [] })).toEqual({
				value: NaN,
				children: [],
			});

			// correct types pass through
			expect(
				v.parse(schema, {
					value: 5,
					children: [{ value: 10, children: [] }],
				}),
			).toEqual({ value: 5, children: [{ value: 10, children: [] }] });
		});
	});

	describe('configureCoercion', () => {
		const schema = v.object({
			title: v.pipe(v.string(), v.nonEmpty('required')),
			count: v.pipe(v.number(), v.integer('invalid')),
			amount: v.bigint(),
			date: v.date(),
			confirmed: v.boolean(),
			file: v.file(),
		});

		test('stripEmptyString', () => {
			const exampleFile = new File(['hello', 'world'], 'example.txt');

			expect(
				getResult(
					v.safeParse(
						configureCoercion({
							stripEmptyString: (value) => {
								const trimmed = value.trim();
								return trimmed === '' ? undefined : trimmed;
							},
						}).coerceFormValue(schema),
						{
							title: ' ',
							count: ' ',
							amount: ' ',
							date: ' ',
							confirmed: ' ',
							file: exampleFile,
						},
					),
				),
			).toEqual({
				success: false,
				error: {
					title: expect.any(Array), // stripped to undefined → invalid type
					count: expect.any(Array),
					amount: expect.any(Array),
					date: expect.any(Array),
					confirmed: expect.any(Array),
				},
			});
		});

		test('type', () => {
			const exampleFile = new File(['hello', 'world'], 'example.txt');

			expect(
				getResult(
					v.safeParse(
						configureCoercion({
							type: {
								number: (text) => Number(text.trim().replace(/,/g, '')),
								boolean: (text) => text === 'true',
							},
						}).coerceFormValue(schema),
						{
							title: ' example ',
							count: ' 123,456 ',
							amount: '9876543210',
							date: '1970-01-01',
							confirmed: 'true',
							file: exampleFile,
						},
					),
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
			const Payment = v.object({
				count: v.pipe(v.number(), v.integer('invalid')),
				amount: v.bigint(),
				date: v.date(),
				confirmed: v.boolean(),
			});
			const paymentSchema = v.object({
				title: v.pipe(v.string(), v.nonEmpty('required')),
				payment: Payment,
			});

			expect(
				getResult(
					v.safeParse(
						configureCoercion({
							customize(type) {
								if (type === Payment) {
									return (text) => JSON.parse(text);
								}

								return null;
							},
						}).coerceFormValue(paymentSchema),
						{
							title: 'Test',
							payment: JSON.stringify({
								count: 123,
								confirmed: true,
								amount: '123456',
							}),
						},
					),
				),
			).toEqual({
				success: false,
				error: {
					'payment.amount': expect.any(Array),
					'payment.date': expect.any(Array),
				},
			});
		});
	});
});
