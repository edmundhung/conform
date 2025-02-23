import { beforeEach, vi, describe, test, expect } from 'vitest';
import {
	getZodConstraint,
	parseWithZod,
	unstable_coerceFormValue as coerceFormValue,
	conformZodMessage,
} from '@conform-to/zod';
import { SafeParseReturnType, z } from 'zod';
import { createFormData } from './helpers';
import { formatPaths } from '@conform-to/dom';

beforeEach(() => {
	vi.unstubAllGlobals();
});

function getResult<Output>(
	result: SafeParseReturnType<any, Output>,
):
	| { success: false; error: Record<string, string[]> }
	| { success: true; data: Output } {
	if (result.success) {
		return { success: true, data: result.data };
	}

	const error: Record<string, string[]> = {};

	for (const issue of result.error.issues) {
		const name = formatPaths(issue.path);

		error[name] ??= [];
		error[name].push(issue.message);
	}

	return { success: false, error };
}

describe('conform-zod', () => {
	test('getZodConstraint', () => {
		const schema = z
			.object({
				text: z
					.string({ required_error: 'required' })
					.min(10, 'min')
					.max(100, 'max')
					.refine(() => false, 'refine'),
				number: z
					.number({ required_error: 'required' })
					.min(1, 'min')
					.max(10, 'max')
					.step(2, 'step'),
				timestamp: z
					.date()
					.min(new Date(1), 'min')
					.max(new Date(), 'max')
					.default(new Date()),
				flag: z.boolean().optional(),
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
				files: z
					.array(z.instanceof(File, { message: 'Invalid file' }))
					.min(1, 'required'),
				tuple: z.tuple([
					z.string().min(3, 'min'),
					z.number().max(100, 'max').optional(),
				]),
			})
			.refine(() => false, 'refine');
		const constraint = {
			text: {
				required: true,
				minLength: 10,
				maxLength: 100,
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
				multiple: true,
			},
			'options[]': {
				required: true,
				pattern: 'a|b|c',
			},
			files: {
				required: true,
				multiple: true,
			},
			'files[]': {
				required: true,
			},
			nested: {
				required: true,
			},
			'nested.key': {
				required: true,
			},
			list: {
				required: true,
				multiple: true,
			},
			'list[]': {
				required: true,
			},
			'list[].key': {
				required: true,
			},
			tuple: {
				required: true,
			},
			'tuple[0]': {
				required: true,
				minLength: 3,
			},
			'tuple[1]': {
				required: false,
				max: 100,
			},
		};

		expect(getZodConstraint(schema)).toEqual(constraint);

		// Non-object schemas will throw an error
		expect(() => getZodConstraint(z.string())).toThrow();
		expect(() => getZodConstraint(z.array(z.string()))).toThrow();

		// Intersection is supported
		expect(
			getZodConstraint(
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
			getZodConstraint(
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
			getZodConstraint(
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

		// // Recursive schema should be supported too
		// const baseCategorySchema = z.object({
		// 	name: z.string(),
		//   });

		// type Category = z.infer<typeof baseCategorySchema> & {
		// 	subcategories: Category[];
		// };

		// const categorySchema: z.ZodType<Category> = baseCategorySchema.extend({
		// 	subcategories: z.lazy(() => categorySchema.array()),
		// });

		// expect(
		// 	getZodConstraint(categorySchema),
		// ).toEqual({
		// 	name: {
		// 		required: true,
		// 	},
		// 	subcategories: {
		// 		required: true,
		// 		multiple: true,
		// 	},

		// 	'subcategories[].name': {
		// 		required: true,
		// 	},
		// 	'subcategories[].subcategories': {
		// 		required: true,
		// 		multiple: true,
		// 	},

		// 	'subcategories[].subcategories[].name': {
		// 		required: true,
		// 	},
		// 	'subcategories[].subcategories[].subcategories': {
		// 		required: true,
		// 		multiple: true,
		// 	},
		// });

		// type Condition = { type: 'filter' } | { type: 'group', conditions: Condition[] }

		// const ConditionSchema: z.ZodType<Condition> = z.discriminatedUnion('type', [
		// 	z.object({
		// 		type: z.literal('filter')
		// 	}),
		// 	z.object({
		// 		type: z.literal('group'),
		// 		conditions: z.lazy(() => ConditionSchema.array()),
		// 	}),
		// ]);

		// const FilterSchema = z.object({
		// 	type: z.literal('group'),
		// 	conditions: ConditionSchema.array(),
		// })

		// expect(
		// 	getZodConstraint(FilterSchema),
		// ).toEqual({
		// 	type: {
		// 		required: true,
		// 	},
		// 	conditions: {
		// 		required: true,
		// 		multiple: true,
		// 	},

		// 	'conditions[].type': {
		// 		required: true,
		// 	},
		// 	'conditions[].conditions': {
		// 		required: true,
		// 		multiple: true,
		// 	},

		// 	'conditions[].conditions[].type': {
		// 		required: true,
		// 	},
		// 	'conditions[].conditions[].conditions': {
		// 		required: true,
		// 		multiple: true,
		// 	},
		// });
	});

	describe('coerceFormValue', () => {
		test('z.string', () => {
			const schema = z
				.string({ required_error: 'required', invalid_type_error: 'invalid' })
				.min(10, 'min')
				.max(100, 'max')
				.regex(/^[A-Z]{1,100}$/, 'regex')
				.refine((value) => value !== 'error', 'refine');
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('error'))).toEqual({
				success: false,
				error: {
					'': ['min', 'regex', 'refine'],
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse('ABCDEFGHIJ')),
			).toEqual({
				success: true,
				data: 'ABCDEFGHIJ',
			});
		});

		test('z.number', () => {
			const schema = z
				.number({ required_error: 'required', invalid_type_error: 'invalid' })
				.min(1, 'min')
				.max(10, 'max')
				.step(2, 'step');
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('abc'))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('5'))).toEqual({
				success: false,
				error: {
					'': ['step'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(' '))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('6'))).toEqual({
				success: true,
				data: 6,
			});
		});

		test('z.bigint', () => {
			const schema = z
				.bigint({ required_error: 'required', invalid_type_error: 'invalid' })
				.min(1n, 'min')
				.max(10n, 'max')
				.multipleOf(2n, 'step');
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('abc'))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(' '))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('5'))).toEqual({
				success: false,
				error: {
					'': ['step'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('4'))).toEqual({
				success: true,
				data: 4n,
			});
		});

		test('z.date', () => {
			const schema = z
				.date({
					required_error: 'required',
					invalid_type_error: 'invalid',
				})
				.min(new Date(1), 'min')
				.max(new Date(10), 'max');
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('abc'))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(' '))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse(new Date(0).toISOString())),
			).toEqual({
				success: false,
				error: {
					'': ['min'],
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse(new Date(5).toISOString())),
			).toEqual({
				success: true,
				data: new Date(5),
			});
		});

		test('z.boolean', () => {
			const schema = z.boolean({
				required_error: 'required',
				invalid_type_error: 'invalid',
			});
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('true'))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('on'))).toEqual({
				success: true,
				data: true,
			});
		});

		test('z.object', () => {
			const schema = z.object({
				a: z.object({
					text: z.string({
						required_error: 'required',
					}),
					flag: z
						.boolean({
							required_error: 'required',
						})
						.optional(),
				}),
				b: z
					.object({
						text: z.string({
							required_error: 'required',
						}),
						flag: z.boolean({
							required_error: 'required',
						}),
					})
					.optional(),
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					'a.text': ['required'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						b: {
							text: '',
						},
					}),
				),
			).toEqual({
				success: false,
				error: {
					'a.text': ['required'],
					'b.text': ['required'],
					'b.flag': ['required'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: {
							text: 'foo',
						},
						b: {
							text: 'bar',
							flag: 'on',
						},
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: {
						text: 'foo',
					},
					b: {
						text: 'bar',
						flag: true,
					},
				},
			});
		});

		test('z.array', () => {
			const createSchema = (
				element: z.ZodTypeAny = z.string({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
			) =>
				z
					.array(element, {
						required_error: 'required',
						invalid_type_error: 'invalid',
					})
					.min(1, 'min')
					.max(1, 'max');

			// Scenario: Multiple select (default option is empty string)
			expect(getResult(coerceFormValue(createSchema()).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['min'],
				},
			});
			// Scenario: Checkbox group (Checked only one item)
			expect(getResult(coerceFormValue(createSchema()).safeParse('a'))).toEqual(
				{
					success: true,
					data: ['a'],
				},
			);
			// Scenario: Checkbox group (Checked at least two items)
			expect(
				getResult(coerceFormValue(createSchema()).safeParse(['a', 'b'])),
			).toEqual({
				success: false,
				error: {
					'': ['max'],
				},
			});
			// Scenario: File upload (No file selected)
			const emptyFile = new File([], '');
			const textFile = new File(['helloword'], 'example.txt');

			expect(
				getResult(
					coerceFormValue(createSchema(z.instanceof(File))).safeParse(
						emptyFile,
					),
				),
			).toEqual({
				success: false,
				error: {
					'': ['min'],
				},
			});
			// Scenario: File upload (Only one file selected)
			expect(
				getResult(
					coerceFormValue(createSchema(z.instanceof(File))).safeParse(textFile),
				),
			).toEqual({
				success: true,
				data: [textFile],
			});
			// Scenario: File upload (At least two files selected)
			expect(
				getResult(
					coerceFormValue(createSchema(z.instanceof(File))).safeParse([
						textFile,
						textFile,
					]),
				),
			).toEqual({
				success: false,
				error: {
					'': ['max'],
				},
			});
			// Scenario: Only one input with the specific name
			expect(
				getResult(coerceFormValue(createSchema()).safeParse([''])),
			).toEqual({
				success: false,
				error: {
					'[0]': ['required'],
				},
			});
			// Scenario: Group of inputs with the same name
			expect(
				getResult(coerceFormValue(createSchema()).safeParse(['a', ''])),
			).toEqual({
				success: false,
				error: {
					'': ['max'],
					'[1]': ['required'],
				},
			});
		});

		test('z.instanceof(file)', () => {
			const schema = z.instanceof(File, { message: 'required' });
			const emptyFile = new File([], '');
			const txtFile = new File(['hello', 'world'], 'example.txt');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse('helloworld')),
			).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(emptyFile))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(txtFile))).toEqual({
				success: true,
				data: txtFile,
			});
		});

		test('z.preprocess', () => {
			const schemaWithNoPreprocess = z.number({
				invalid_type_error: 'invalid',
			});
			const schemaWithCustomPreprocess = z.preprocess(
				(value) => {
					if (typeof value !== 'string') {
						return value;
					} else if (value === '') {
						return undefined;
					} else {
						return value.replace(/,/g, '');
					}
				},
				z.number({ invalid_type_error: 'invalid' }),
			);

			expect(
				getResult(coerceFormValue(schemaWithNoPreprocess).safeParse('1,234.5')),
			).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithCustomPreprocess).safeParse('1,234.5'),
				),
			).toEqual({
				success: true,
				data: 1234.5,
			});
		});

		test('z.optional', () => {
			const schema = z.object({
				a: z.string().optional(),
				b: z.number().optional(),
				c: z.boolean().optional(),
				d: z.date().optional(),
				e: z.instanceof(File).optional(),
				f: z.array(z.string().optional()),
				g: z.array(z.string()).optional(),
			});
			const emptyFile = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
						g: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});

			// To test if File is not defined in certain environment
			vi.stubGlobal('File', undefined);

			expect(() =>
				getResult(coerceFormValue(schema).safeParse({})),
			).not.toThrow();
		});

		test('z.default', () => {
			const defaultFile = new File(['hello', 'world'], 'example.txt');
			const defaultDate = new Date(0);
			const schema = z.object({
				a: z.string().default('text'),
				b: z.number().default(123),
				c: z.boolean().default(true),
				d: z.date().default(defaultDate),
				e: z.instanceof(File).default(defaultFile),
				f: z.array(z.string()).default(['foo', 'bar']),
				g: z.string().nullable().default(null),
				h: z.string().default(''),
			});
			const emptyFile = new File([], '');

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'text',
					b: 123,
					c: true,
					d: defaultDate,
					e: defaultFile,
					f: ['foo', 'bar'],
					g: null,
					h: '',
				},
			});

			const today = new Date();
			const schema2 = z.object({
				a: z.string().email('invalid').default(''),
				b: z.number().gt(10, 'invalid').default(0),
				c: z
					.boolean()
					.refine((value) => !!value, 'invalid')
					.default(false),
				d: z.date().min(today, 'invalid').default(defaultDate),
				e: z
					.instanceof(File)
					.refine((file) => file.size > 100, 'invalid')
					.default(defaultFile),
			});

			expect(getResult(coerceFormValue(schema2).safeParse({}))).toEqual({
				success: false,
				error: {
					a: ['invalid'],
					b: ['invalid'],
					c: ['invalid'],
					d: ['invalid'],
					e: ['invalid'],
				},
			});
		});

		test('z.catch', () => {
			const defaultFile = new File(['hello', 'world'], 'example.txt');
			const userFile = new File(['foo', 'bar'], 'foobar.txt');
			const defaultDate = new Date(0);
			const userDate = new Date(1);
			const schema = z.object({
				a: z.string().catch('text'),
				b: z.number().catch(123),
				c: z.boolean().catch(true),
				d: z.date().catch(defaultDate),
				e: z.instanceof(File).catch(defaultFile),
				f: z.array(z.string()).min(1).catch(['foo', 'bar']),
			});
			const emptyFile = new File([], '');

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'text',
					b: 123,
					c: true,
					d: defaultDate,
					e: defaultFile,
					f: ['foo', 'bar'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: 'othertext',
						b: '456',
						c: 'on',
						d: userDate.toISOString(),
						e: userFile,
						f: ['hello', 'world'],
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'othertext',
					b: 456,
					c: true,
					d: userDate,
					e: userFile,
					f: ['hello', 'world'],
				},
			});
		});

		test('z.lazy', () => {
			const category = z.object({
				name: z.string({ required_error: 'required' }),
				subcategories: z.lazy(() => z.array(category)),
			});
			const node = z.object({
				name: z.string({ required_error: 'required' }),
				left: z.lazy(() => node).optional(),
				right: z.lazy(() => node.optional()),
			});
			const schema = z.object({
				category,
				node,
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						category: {
							name: '',
							subcategories: [
								{
									name: '',
									subcategories: [
										{
											name: '',
										},
									],
								},
								{
									name: '',
								},
							],
						},
						node: {
							name: '',
							left: {
								name: '',
								left: {
									name: '',
								},
								right: {
									name: '',
								},
							},
							right: {
								name: '',
								right: {
									name: '',
								},
							},
						},
					}),
				),
			).toEqual({
				success: false,
				error: {
					'category.name': ['required'],
					'category.subcategories[0].name': ['required'],
					'category.subcategories[0].subcategories[0].name': ['required'],
					'category.subcategories[1].name': ['required'],
					'node.name': ['required'],
					'node.left.name': ['required'],
					'node.left.left.name': ['required'],
					'node.left.right.name': ['required'],
					'node.right.name': ['required'],
					'node.right.right.name': ['required'],
				},
			});
		});

		test('z.discriminatedUnion', () => {
			const schema = z.discriminatedUnion('type', [
				z.object({
					type: z.literal('a'),
					number: z.number(),
				}),
				z.object({
					type: z.literal('b'),
					boolean: z.boolean(),
				}),
			]);

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						type: 'a',
						number: '1',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'a',
					number: 1,
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						type: 'b',
						boolean: 'on',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'b',
					boolean: true,
				},
			});
		});

		test('z.brand', () => {
			const schema = z
				.object({
					a: z.string().brand(),
					b: z.number().brand(),
					c: z.boolean().brand(),
					d: z.date().brand(),
					e: z.bigint().brand(),
					f: z.instanceof(File).brand(),
					g: z.string().optional().brand(),
					h: z.string().brand().optional(),
				})
				.brand();
			const defaultFile = new File(['hello', 'world'], 'example.txt');

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: '',
						f: '',
						g: '',
						h: '',
					}),
				),
			).toEqual({
				success: false,
				error: {
					a: ['Required'],
					b: ['Required'],
					c: ['Required'],
					d: ['Required'],
					e: ['Required'],
					f: ['Input not instance of File'],
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: 'hello world',
						b: '42',
						c: 'on',
						d: '1970-01-01',
						e: '0x1fffffffffffff',
						f: defaultFile,
						g: '',
						h: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: 'hello world',
					b: 42,
					c: true,
					d: new Date('1970-01-01'),
					e: BigInt('0x1fffffffffffff'),
					f: defaultFile,
					g: undefined,
					h: undefined,
				},
			});
		});

		test('skipCoercion', () => {
			const Payment = z.object({
				date: z.date({ invalid_type_error: 'invalid' }),
				confirmed: z.boolean({ invalid_type_error: 'invalid' }),
			});
			const schema = z.object({
				title: z.string({ required_error: 'required' }),
				count: z.number({ invalid_type_error: 'invalid' }),
				amount: z.bigint({ required_error: 'required' }),
				payment: Payment,
			});

			expect(
				getResult(
					coerceFormValue(schema, {
						skipCoercion: (type) =>
							type instanceof z.ZodNumber || type === Payment,
					}).safeParse({
						title: '',
						count: '',
						amount: '',
						payment: {
							date: '',
							confirmed: '',
						},
					}),
				),
			).toEqual({
				success: false,
				error: {
					title: ['required'],
					amount: ['required'],
					count: ['invalid'],
					'payment.confirmed': ['invalid'],
					'payment.date': ['invalid'],
				},
			});
		});
	});

	test('parseWithZod with errorMap', () => {
		const schema = z.object({
			text: z.string().min(5),
		});
		const formData = createFormData([['text', 'abc']]);

		expect(
			parseWithZod(formData, {
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
			status: 'error',
			payload: {
				text: 'abc',
			},
			error: {
				text: ['The field is too short'],
			},
			reply: expect.any(Function),
		});
	});

	test('parseWithZod with custom message', async () => {
		const createSchema = (
			validate?: (email: string) => Promise<boolean>,
			when = true,
		) =>
			z.object({
				email: z
					.string()
					.email()
					.superRefine((email, ctx) => {
						if (!when) {
							ctx.addIssue({
								code: 'custom',
								message: conformZodMessage.VALIDATION_SKIPPED,
							});
							return;
						}

						if (typeof validate === 'undefined') {
							ctx.addIssue({
								code: 'custom',
								message: conformZodMessage.VALIDATION_UNDEFINED,
							});
							return;
						}

						return validate(email).then((valid) => {
							if (!valid) {
								ctx.addIssue({
									code: 'custom',
									message: 'Email is invalid',
								});
							}
						});
					}),
			});
		const formData = createFormData([['email', 'test@example.com']]);
		const submission = {
			payload: {
				email: 'test@example.com',
			},
			reply: expect.any(Function),
		};

		expect(parseWithZod(formData, { schema: createSchema() })).toEqual({
			...submission,
			status: 'error',
			error: null,
		});
		expect(
			await parseWithZod(formData, {
				schema: createSchema(() => Promise.resolve(false)),
				async: true,
			}),
		).toEqual({
			...submission,
			status: 'error',
			error: {
				email: ['Email is invalid'],
			},
		});
		expect(
			await parseWithZod(formData, {
				schema: createSchema(() => Promise.resolve(true)),
				async: true,
			}),
		).toEqual({
			...submission,
			status: 'success',
			value: submission.payload,
		});
		expect(
			await parseWithZod(formData, {
				schema: createSchema(() => Promise.resolve(true), false),
				async: true,
			}),
		).toEqual({
			...submission,
			status: 'error',
			error: {
				email: null,
			},
		});
		expect(
			await parseWithZod(formData, {
				schema: createSchema(() => Promise.resolve(false), false),
				async: true,
			}),
		).toEqual({
			...submission,
			status: 'error',
			error: {
				email: null,
			},
		});
		expect(
			await parseWithZod(formData, {
				schema: createSchema(() => Promise.resolve(false), true),
				async: true,
			}),
		).toEqual({
			...submission,
			status: 'error',
			error: {
				email: ['Email is invalid'],
			},
		});
		expect(
			await parseWithZod(formData, {
				schema: createSchema(() => Promise.resolve(true), true),
				async: true,
			}),
		).toEqual({
			...submission,
			status: 'success',
			value: submission.payload,
		});
	});

	test('parseWithZod with disableAutoCoercion', async () => {
		const schema = z.object({
			text: z.string(),
			number: z.number({ invalid_type_error: 'invalid' }),
			boolean: z.boolean({ invalid_type_error: 'invalid' }),
			bigint: z.bigint({ invalid_type_error: 'invalid' }),
			date: z.date({ invalid_type_error: 'invalid' }),
			file: z.instanceof(File, { message: 'invalid' }),
		});
		const formData = createFormData([
			['text', 'abc'],
			['number', '1'],
			['boolean', 'on'],
			['bigint', '1'],
			['date', '1970-01-01'],
			['file', new File([], '')],
		]);

		expect(
			parseWithZod(formData, {
				schema,
				disableAutoCoercion: true,
			}),
		).toEqual({
			status: 'error',
			payload: {
				text: 'abc',
				number: '1',
				boolean: 'on',
				bigint: '1',
				date: '1970-01-01',
				file: new File([], ''),
			},
			error: {
				number: ['invalid'],
				boolean: ['invalid'],
				bigint: ['invalid'],
				date: ['invalid'],
			},
			reply: expect.any(Function),
		});
	});
});
