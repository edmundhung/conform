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

test.beforeEach(() => {
	installGlobals();
});

test.describe('conform-zod', () => {
	test('getFieldsetConstraint', () => {
		const schema = z
			.object({
				text: z
					.string({ required_error: 'required' })
					.min(10, 'min')
					.max(100, 'max')
					.regex(/^[A-Z]{1-100}$/, 'regex')
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
			})
			.refine(() => false, 'refine');
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

	test.describe('parse', () => {
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

			expect(parse(createFormData([]), { schema })).toEqual({
				intent: 'submit',
				payload: {},
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: '' },
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: file },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', 'xyz']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: 'xyz' },
				error: { test: ['min', 'regex', 'refine'] },
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

			expect(parse(createFormData([]), { schema })).toEqual({
				intent: 'submit',
				payload: {},
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: '' },
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', 'abc']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: 'abc' },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: file },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', '5']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: '5' },
				error: { test: ['step'] },
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

			expect(parse(createFormData([]), { schema })).toEqual({
				intent: 'submit',
				payload: {},
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: '' },
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', 'abc']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: 'abc' },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: file },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', new Date(0).toISOString()]]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: new Date(0).toISOString() },
				error: { test: ['min'] },
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

			expect(parse(createFormData([]), { schema })).toEqual({
				intent: 'submit',
				payload: {},
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', '']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: '' },
				error: { test: ['required'] },
			});
			expect(
				parse(createFormData([['test', file]]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: file },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', 'abc']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: 'abc' },
				error: { test: ['invalid'] },
			});
			expect(
				parse(createFormData([['test', 'on']]), {
					schema,
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: 'on' },
				error: {},
				value: {
					test: true,
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
				z.object({
					test: z
						.array(element, {
							required_error: 'required',
							invalid_type_error: 'invalid',
						})
						.min(1, 'min')
						.max(1, 'max'),
				});

			expect(parse(createFormData([]), { schema: createSchema() })).toEqual({
				intent: 'submit',
				payload: {},
				error: { test: ['min'] },
			});
			// Scenario: Checkbox group (Checked only one item)
			expect(
				parse(createFormData([['test', 'a']]), {
					schema: createSchema(),
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: 'a' },
				error: {},
				value: { test: ['a'] },
			});
			// Scenario: Checkbox group (Checked at least two items)
			expect(
				parse(
					createFormData([
						['test', 'a'],
						['test', 'b'],
					]),
					{
						schema: createSchema(),
					},
				),
			).toEqual({
				intent: 'submit',
				payload: { test: ['a', 'b'] },
				error: {
					test: ['max'],
				},
			});
			// Scenario: File upload (No file selected)
			const emptyFile = new File([], '');
			const textFile = new File(['helloword'], 'example.txt');

			expect(
				parse(createFormData([['test', emptyFile]]), {
					schema: createSchema(z.instanceof(File)),
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: emptyFile },
				error: {
					test: ['min'],
				},
			});
			// Scenario: File upload (Only one file selected)
			expect(
				parse(createFormData([['test', textFile]]), {
					schema: createSchema(z.instanceof(File)),
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: textFile },
				error: {},
				value: {
					test: [textFile],
				},
			});
			// Scenario: File upload (At least two files selected)
			expect(
				parse(
					createFormData([
						['test', textFile],
						['test', textFile],
					]),
					{
						schema: createSchema(z.instanceof(File)),
					},
				),
			).toEqual({
				intent: 'submit',
				payload: { test: [textFile, textFile] },
				error: {
					test: ['max'],
				},
			});
			// Scenario: Only one input with the specific name
			expect(
				parse(createFormData([['test', '']]), {
					schema: createSchema(),
				}),
			).toEqual({
				intent: 'submit',
				payload: { test: '' },
				error: {
					'test[0]': ['required'],
				},
			});
			// Scenario: Group of inputs with the same name
			expect(
				parse(
					createFormData([
						['test', 'foo'],
						['test', ''],
					]),
					{
						schema: createSchema(),
					},
				),
			).toEqual({
				intent: 'submit',
				payload: { test: ['foo', ''] },
				error: {
					test: ['max'],
					'test[1]': ['required'],
				},
			});
		});

		test('z.instanceof(file)', () => {
			const schema = z.object({
				test: z.instanceof(File, { message: 'message' }),
			});
			const emptyFile = new File([], '');
			const txtFile = new File(['hello', 'world'], 'example.txt');

			expect(parse(createFormData([]), { schema })).toEqual({
				intent: 'submit',
				payload: {},
				error: { test: ['message'] },
			});
			expect(parse(createFormData([['test', '']]), { schema })).toEqual({
				intent: 'submit',
				payload: {
					test: '',
				},
				error: { test: ['message'] },
			});
			expect(
				parse(createFormData([['test', 'helloworld']]), { schema }),
			).toEqual({
				intent: 'submit',
				payload: {
					test: 'helloworld',
				},
				error: { test: ['message'] },
			});
			expect(parse(createFormData([['test', emptyFile]]), { schema })).toEqual({
				intent: 'submit',
				payload: {
					test: emptyFile,
				},
				error: { test: ['message'] },
			});
			expect(parse(createFormData([['test', txtFile]]), { schema })).toEqual({
				intent: 'submit',
				payload: {
					test: txtFile,
				},
				error: {},
				value: {
					test: txtFile,
				},
			});
		});

		test('z.preprocess', () => {
			const schemaWithNoPreprocess = z.object({
				test: z.number({ invalid_type_error: 'invalid' }),
			});
			const schemaWithCustomPreprocess = z.object({
				test: z.preprocess((value) => {
					if (typeof value !== 'string') {
						return value;
					} else if (value === '') {
						return undefined;
					} else {
						return value.replace(/,/g, '');
					}
				}, z.number({ invalid_type_error: 'invalid' })),
			});
			const formData = createFormData([['test', '1,234.5']]);

			expect(
				parse(formData, {
					schema: schemaWithNoPreprocess,
				}),
			).toEqual({
				intent: 'submit',
				payload: {
					test: '1,234.5',
				},
				error: {
					test: ['invalid'],
				},
			});
			expect(
				parse(formData, {
					schema: schemaWithCustomPreprocess,
				}),
			).toEqual({
				intent: 'submit',
				payload: {
					test: '1,234.5',
				},
				error: {},
				value: {
					test: 1234.5,
				},
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
				parse(
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
				intent: 'submit',
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
					f: [undefined],
					// Ideally, this should be `[undefined]` as well similar to `f` above.
					// However, the preprocess on optional array casts it to undefined before the array preprocess is called
					// As it is still unclear when we wants an optional array, we are not going to fix this for now.
					g: undefined,
				},
				error: {},
			});

			// @ts-expect-error To test if File is not defined in certain environment
			delete global.File;

			expect(() => parse(createFormData([]), { schema })).not.toThrow();
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
				parse(
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
				intent: 'submit',
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
				error: {},
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
				parse(
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
				intent: 'submit',
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
				parse(
					createFormData([
						['type', 'a'],
						['number', '1'],
					]),
					{ schema },
				),
			).toEqual({
				intent: 'submit',
				payload: {
					type: 'a',
					number: '1',
				},
				value: {
					type: 'a',
					number: 1,
				},
				error: {},
			});
			expect(
				parse(
					createFormData([
						['type', 'b'],
						['boolean', 'on'],
					]),
					{ schema },
				),
			).toEqual({
				intent: 'submit',
				payload: {
					type: 'b',
					boolean: 'on',
				},
				value: {
					type: 'b',
					boolean: true,
				},
				error: {},
			});
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
				text: ['The field is too short'],
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
				email: ['__undefined__'],
			},
		});
		expect(parse(formData, { schema: createSchema(() => false) })).toEqual({
			...submission,
			error: {
				email: ['Email is invalid'],
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
				email: ['__skipped__'],
			},
		});
		expect(
			parse(formData, { schema: createSchema(() => false, false) }),
		).toEqual({
			...submission,
			error: {
				email: ['__skipped__'],
			},
		});
		expect(
			parse(formData, { schema: createSchema(() => false, true) }),
		).toEqual({
			...submission,
			error: {
				email: ['Email is invalid'],
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
