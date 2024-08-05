import { beforeEach, vi, describe, test, expect } from 'vitest';
import {
	getZodConstraint,
	parseWithZod,
	conformZodMessage,
} from '@conform-to/zod';
import { z } from 'zod';
import { createFormData } from './helpers';

beforeEach(() => {
	vi.unstubAllGlobals();
});

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

	describe('parseWithZod', () => {
		test('z.string', () => {
			const schema = z.object({
				test: z
					.string({ required_error: 'required', invalid_type_error: 'invalid' })
					.min(10, 'min')
					.max(100, 'max')
					.regex(/^[A-Z]{1-100}$/, 'regex')
					.refine(() => false, 'refine'),
			});
			const file = new File([], '');

			expect(parseWithZod(createFormData([]), { schema })).toEqual({
				status: 'error',
				payload: {},
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				status: 'error',

				payload: { test: '' },
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: file },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', 'xyz']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: 'xyz' },
				error: { test: ['min', 'regex', 'refine'] },
				reply: expect.any(Function),
			});
		});

		test('z.number', () => {
			const schema = z.object({
				test: z
					.number({ required_error: 'required', invalid_type_error: 'invalid' })
					.min(1, 'min')
					.max(10, 'max')
					.step(2, 'step'),
			});
			const file = new File([], '');

			expect(parseWithZod(createFormData([]), { schema })).toEqual({
				status: 'error',
				payload: {},
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: '' },
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', 'abc']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: 'abc' },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: file },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', '5']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: '5' },
				error: { test: ['step'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', ' ']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: ' ' },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
		});

		test('z.date', () => {
			const schema = z.object({
				test: z
					.date({
						required_error: 'required',
						invalid_type_error: 'invalid',
					})
					.min(new Date(1), 'min')
					.max(new Date(10), 'max'),
			});
			const file = new File([], '');

			expect(parseWithZod(createFormData([]), { schema })).toEqual({
				status: 'error',
				payload: {},
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: '' },
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', 'abc']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: 'abc' },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: file },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', new Date(0).toISOString()]]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: new Date(0).toISOString() },
				error: { test: ['min'] },
				reply: expect.any(Function),
			});
		});

		test('z.boolean', () => {
			const schema = z.object({
				test: z.boolean({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
			});
			const file = new File([], '');

			expect(parseWithZod(createFormData([]), { schema })).toEqual({
				status: 'error',
				payload: {},
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: '' },
				error: { test: ['required'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: file },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', 'abc']]), {
					schema,
				}),
			).toEqual({
				status: 'error',
				payload: { test: 'abc' },
				error: { test: ['invalid'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', 'on']]), {
					schema,
				}),
			).toEqual({
				status: 'success',
				payload: { test: 'on' },
				value: {
					test: true,
				},
				reply: expect.any(Function),
			});
		});

		test('z.object', () => {
			const schema = z.object({
				a: z.object({
					text: z.string({
						required_error: 'required',
					}),
					flag: z.boolean({
						required_error: 'required',
					}),
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

			expect(parseWithZod(createFormData([]), { schema })).toEqual({
				status: 'error',
				payload: {},
				error: {
					'a.text': ['required'],
					'a.flag': ['required'],
				},
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['b.text', '']]), { schema }),
			).toEqual({
				status: 'error',
				payload: {
					b: {
						text: '',
					},
				},
				error: {
					'a.text': ['required'],
					'a.flag': ['required'],
					'b.text': ['required'],
					'b.flag': ['required'],
				},
				reply: expect.any(Function),
			});
		});

		test('z.array', () => {
			const createSchema = (
				element: z.ZodTypeAny = z.string({
					required_error: 'required',
					invalid_type_error: 'invalid',
				}),
			) =>
				z.object({
					test: z
						.array(element, {
							required_error: 'required',
							invalid_type_error: 'invalid',
						})
						.min(1, 'min')
						.max(1, 'max'),
				});

			expect(
				parseWithZod(createFormData([]), { schema: createSchema() }),
			).toEqual({
				status: 'error',
				payload: {},
				error: { test: ['min'] },
				reply: expect.any(Function),
			});
			// Scenario: Multiple select (default option is empty string)
			expect(
				parseWithZod(createFormData([['test', '']]), {
					schema: createSchema(),
				}),
			).toEqual({
				status: 'error',
				payload: {
					test: '',
				},
				error: {
					test: ['min'],
				},
				reply: expect.any(Function),
			});
			// Scenario: Checkbox group (Checked only one item)
			expect(
				parseWithZod(createFormData([['test', 'a']]), {
					schema: createSchema(),
				}),
			).toEqual({
				status: 'success',
				payload: { test: 'a' },
				value: { test: ['a'] },
				reply: expect.any(Function),
			});
			// Scenario: Checkbox group (Checked at least two items)
			expect(
				parseWithZod(
					createFormData([
						['test', 'a'],
						['test', 'b'],
					]),
					{
						schema: createSchema(),
					},
				),
			).toEqual({
				status: 'error',
				payload: { test: ['a', 'b'] },
				error: {
					test: ['max'],
				},
				reply: expect.any(Function),
			});
			// Scenario: File upload (No file selected)
			const emptyFile = new File([], '');
			const textFile = new File(['helloword'], 'example.txt');

			expect(
				parseWithZod(createFormData([['test', emptyFile]]), {
					schema: createSchema(z.instanceof(File)),
				}),
			).toEqual({
				status: 'error',
				payload: { test: emptyFile },
				error: {
					test: ['min'],
				},
				reply: expect.any(Function),
			});
			// Scenario: File upload (Only one file selected)
			expect(
				parseWithZod(createFormData([['test', textFile]]), {
					schema: createSchema(z.instanceof(File)),
				}),
			).toEqual({
				status: 'success',
				payload: { test: textFile },
				value: {
					test: [textFile],
				},
				reply: expect.any(Function),
			});
			// Scenario: File upload (At least two files selected)
			expect(
				parseWithZod(
					createFormData([
						['test', textFile],
						['test', textFile],
					]),
					{
						schema: createSchema(z.instanceof(File)),
					},
				),
			).toEqual({
				status: 'error',
				payload: { test: [textFile, textFile] },
				error: {
					test: ['max'],
				},
				reply: expect.any(Function),
			});
			// Scenario: Only one input with the specific name
			expect(
				parseWithZod(createFormData([['test[0]', '']]), {
					schema: createSchema(),
				}),
			).toEqual({
				status: 'error',
				payload: { test: [''] },
				error: {
					'test[0]': ['required'],
				},
				reply: expect.any(Function),
			});
			// Scenario: Group of inputs with the same name
			expect(
				parseWithZod(
					createFormData([
						['test', 'foo'],
						['test', ''],
					]),
					{
						schema: createSchema(),
					},
				),
			).toEqual({
				status: 'error',
				payload: { test: ['foo', ''] },
				error: {
					test: ['max'],
					'test[1]': ['required'],
				},
				reply: expect.any(Function),
			});
		});

		test('z.instanceof(file)', () => {
			const schema = z.object({
				test: z.instanceof(File, { message: 'message' }),
			});
			const emptyFile = new File([], '');
			const txtFile = new File(['hello', 'world'], 'example.txt');

			expect(parseWithZod(createFormData([]), { schema })).toEqual({
				status: 'error',
				payload: {},
				error: { test: ['message'] },
				reply: expect.any(Function),
			});
			expect(parseWithZod(createFormData([['test', '']]), { schema })).toEqual({
				status: 'error',
				payload: {
					test: '',
				},
				error: { test: ['message'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', 'helloworld']]), { schema }),
			).toEqual({
				status: 'error',
				payload: {
					test: 'helloworld',
				},
				error: { test: ['message'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', emptyFile]]), { schema }),
			).toEqual({
				status: 'error',
				payload: {
					test: emptyFile,
				},
				error: { test: ['message'] },
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(createFormData([['test', txtFile]]), { schema }),
			).toEqual({
				status: 'success',
				payload: {
					test: txtFile,
				},
				value: {
					test: txtFile,
				},
				reply: expect.any(Function),
			});
		});

		test('z.preprocess', () => {
			const schemaWithNoPreprocess = z.object({
				test: z.number({ invalid_type_error: 'invalid' }),
			});
			const schemaWithCustomPreprocess = z.object({
				test: z.preprocess(
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
				),
			});
			const formData = createFormData([['test', '1,234.5']]);

			expect(
				parseWithZod(formData, {
					schema: schemaWithNoPreprocess,
				}),
			).toEqual({
				status: 'error',
				payload: {
					test: '1,234.5',
				},
				error: {
					test: ['invalid'],
				},
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(formData, {
					schema: schemaWithCustomPreprocess,
				}),
			).toEqual({
				status: 'success',
				payload: {
					test: '1,234.5',
				},
				value: {
					test: 1234.5,
				},
				reply: expect.any(Function),
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

			expect(
				parseWithZod(
					createFormData([
						['a', ''],
						['b', ''],
						['c', ''],
						['d', ''],
						['e', emptyFile],
						['f', ''],
						['g', ''],
					]),
					{ schema },
				),
			).toEqual({
				status: 'success',
				payload: {
					a: '',
					b: '',
					c: '',
					d: '',
					e: emptyFile,
					f: '',
					g: '',
				},
				value: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
				reply: expect.any(Function),
			});

			// To test if File is not defined in certain environment
			vi.stubGlobal('File', undefined);

			expect(() => parseWithZod(createFormData([]), { schema })).not.toThrow();
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
			});
			const emptyFile = new File([], '');

			expect(
				parseWithZod(
					createFormData([
						['a', ''],
						['b', ''],
						['c', ''],
						['d', ''],
						['e', emptyFile],
						['f', ''],
					]),
					{ schema },
				),
			).toEqual({
				status: 'success',
				payload: {
					a: '',
					b: '',
					c: '',
					d: '',
					e: emptyFile,
					f: '',
				},
				value: {
					a: 'text',
					b: 123,
					c: true,
					d: defaultDate,
					e: defaultFile,
					f: ['foo', 'bar'],
				},
				reply: expect.any(Function),
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
				parseWithZod(
					createFormData([
						['a', ''],
						['b', ''],
						['c', ''],
						['d', ''],
						['e', emptyFile],
						['f', ''],
					]),
					{ schema },
				),
			).toEqual({
				status: 'success',
				payload: {
					a: '',
					b: '',
					c: '',
					d: '',
					e: emptyFile,
					f: '',
				},
				value: {
					a: 'text',
					b: 123,
					c: true,
					d: defaultDate,
					e: defaultFile,
					f: ['foo', 'bar'],
				},
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(
					createFormData([
						['a', 'othertext'],
						['b', '456'],
						['c', 'on'],
						['d', userDate.toISOString()],
						['e', userFile],
						['f', 'hello'],
						['f', 'world'],
					]),
					{ schema },
				),
			).toEqual({
				status: 'success',
				payload: {
					a: 'othertext',
					b: '456',
					c: 'on',
					d: userDate.toISOString(),
					e: userFile,
					f: ['hello', 'world'],
				},
				value: {
					a: 'othertext',
					b: 456,
					c: true,
					d: userDate,
					e: userFile,
					f: ['hello', 'world'],
				},
				reply: expect.any(Function),
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
				parseWithZod(
					createFormData([
						['category.name', ''],
						['category.subcategories[0].name', ''],
						['category.subcategories[0].subcategories[0].name', ''],
						['category.subcategories[1].name', ''],
						['node.name', ''],
						['node.left.name', ''],
						['node.left.left.name', ''],
						['node.left.right.name', ''],
						['node.right.name', ''],
						['node.right.right.name', ''],
					]),
					{ schema },
				),
			).toEqual({
				status: 'error',
				payload: {
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
				},
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
				reply: expect.any(Function),
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
				parseWithZod(
					createFormData([
						['type', 'a'],
						['number', '1'],
					]),
					{ schema },
				),
			).toEqual({
				status: 'success',
				payload: {
					type: 'a',
					number: '1',
				},
				value: {
					type: 'a',
					number: 1,
				},
				reply: expect.any(Function),
			});
			expect(
				parseWithZod(
					createFormData([
						['type', 'b'],
						['boolean', 'on'],
					]),
					{ schema },
				),
			).toEqual({
				status: 'success',
				payload: {
					type: 'b',
					boolean: 'on',
				},
				value: {
					type: 'b',
					boolean: true,
				},
				reply: expect.any(Function),
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
});
