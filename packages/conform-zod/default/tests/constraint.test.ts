import { describe, test, expect } from 'vitest';
import { getZodConstraint } from '../constraint';
import { z } from 'zod';

describe('getZodConstraint', () => {
	test('basic constraints', () => {
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
				nullableNumber: z
					.number({ required_error: 'required' })
					.min(1, 'min')
					.max(10, 'max')
					.nullable(),
				timestamp: z
					.date()
					.min(new Date(1), 'min')
					.max(new Date(), 'max')
					.default(new Date()),
				flag: z.boolean().optional(),
				literalFlag: z.literal(true),
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
				transform: z
					.object({
						key: z.string(),
					})
					.transform((val) => val),
				preprocess: z.preprocess(
					(value) => value,
					z.object({
						key: z.string(),
					}),
				),
				pipe: z
					.object({
						key: z.string(),
					})
					.pipe(
						z.object({
							key: z.string(),
							key2: z.string().optional(),
						}),
					),
			})
			.refine(() => false, 'refine');

		expect(getZodConstraint(schema)).toEqual({
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
			nullableNumber: {
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
			literalFlag: {
				required: true,
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
			transform: {
				required: true,
			},
			'transform.key': {
				required: true,
			},
			preprocess: {
				required: true,
			},
			'preprocess.key': {
				required: true,
			},
			pipe: {
				required: true,
			},
			'pipe.key': {
				required: true,
			},
			'pipe.key2': {
				required: false,
			},
		});
	});

	test('index normalization', () => {
		const schema = z.object({
			options: z.array(z.enum(['a', 'b', 'c'])),
			list: z.array(z.object({ key: z.string() })),
			tuple: z.tuple([
				z.string().min(3, 'min'),
				z.number().max(100, 'max').optional(),
			]),
		});
		const constraint = getZodConstraint(schema);

		expect(constraint['options[0]']).toEqual({
			required: true,
			pattern: 'a|b|c',
		});
		expect(constraint['list[0]']).toEqual({ required: true });
		expect(constraint['list[0].key']).toEqual({ required: true });
		expect(constraint['list[5].key']).toEqual({ required: true });
		expect(constraint['tuple[0]']).toEqual({ required: true, minLength: 3 });
		expect(constraint['tuple[1]']).toEqual({ required: false, max: 100 });

		// No match returns undefined
		expect(constraint['nonexistent']).toBeUndefined();
		expect(constraint['list[0].missing']).toBeUndefined();
	});

	test('non-object schemas', () => {
		expect(() => getZodConstraint(z.string())).toThrow();
		expect(() => getZodConstraint(z.array(z.string()))).toThrow();
	});

	test('intersection', () => {
		const schema = z.object({
			text: z.string().min(10, 'min').max(100, 'max'),
			number: z.number().min(1, 'min').max(10, 'max'),
		});

		expect(
			getZodConstraint(
				schema.and(
					z.object({ text: z.string().optional(), something: z.string() }),
				),
			),
		).toEqual({
			text: { required: false },
			number: { required: true, min: 1, max: 10 },
			something: { required: true },
		});
	});

	test('union', () => {
		const baseSchema = z.object({
			qux: z.string().min(1, 'min'),
		});

		expect(
			getZodConstraint(
				z.union([
					baseSchema.extend({
						type: z.literal('a'),
						foo: z.string().min(1, 'min'),
						baz: z.string().min(1, 'min'),
					}),
					baseSchema.extend({
						type: z.literal('b'),
						bar: z.string().min(1, 'min'),
						baz: z.string().min(1, 'min').optional(),
					}),
				]),
			),
		).toEqual({
			type: { required: true },
			foo: { required: false, minLength: 1 },
			bar: { required: false, minLength: 1 },
			baz: { minLength: 1 },
			qux: { required: true, minLength: 1 },
		});
	});

	test('discriminated union', () => {
		const baseSchema = z.object({
			qux: z.string().min(1, 'min'),
		});

		expect(
			getZodConstraint(
				z.discriminatedUnion('type', [
					baseSchema.extend({
						type: z.literal('a'),
						foo: z.string().min(1, 'min'),
						baz: z.string().min(1, 'min'),
					}),
					baseSchema.extend({
						type: z.literal('b'),
						bar: z.string().min(1, 'min'),
						baz: z.string().min(1, 'min').optional(),
					}),
				]),
			),
		).toEqual({
			type: { required: true },
			foo: { required: false, minLength: 1 },
			bar: { required: false, minLength: 1 },
			baz: { minLength: 1 },
			qux: { required: true, minLength: 1 },
		});
	});

	test('z.lazy() based recursive schema', () => {
		const baseCategorySchema = z.object({
			name: z.string(),
		});

		type Category = z.infer<typeof baseCategorySchema> & {
			subcategories: Category[];
		};

		const categorySchema: z.ZodType<Category> = baseCategorySchema.extend({
			subcategories: z.lazy(() => categorySchema.array()),
		});

		const constraint = getZodConstraint(categorySchema);

		// Static keys
		expect(constraint).toEqual({
			name: { required: true },
			subcategories: { required: true, multiple: true },
		});

		// Recursive alias collapse
		expect(constraint['subcategories[0].name']).toEqual({ required: true });
		expect(constraint['subcategories[0].subcategories']).toEqual({
			required: true,
			multiple: true,
		});
		expect(constraint['subcategories[0].subcategories[1].name']).toEqual({
			required: true,
		});
		expect(
			constraint['subcategories[0].subcategories[1].subcategories[2].name'],
		).toEqual({ required: true });
	});

	test('z.lazy() with discriminated union', () => {
		type Condition =
			| { type: 'filter' }
			| { type: 'group'; conditions: Condition[] };

		const ConditionSchema: z.ZodType<Condition> = z.discriminatedUnion('type', [
			z.object({
				type: z.literal('filter'),
			}),
			z.object({
				type: z.literal('group'),
				conditions: z.lazy(() => ConditionSchema.array()),
			}),
		]);

		const FilterSchema = z.object({
			type: z.literal('group'),
			conditions: ConditionSchema.array(),
		});

		const constraint = getZodConstraint(FilterSchema);

		// Static keys — both union options are traversed; recursion is
		// caught when z.lazy() re-encounters ConditionSchema.
		// conditions[].conditions only exists in "group", so required: false.
		expect(constraint).toEqual({
			type: { required: true },
			conditions: { required: true, multiple: true },
			'conditions[]': { required: true },
			'conditions[].type': { required: true },
			'conditions[].conditions': { required: false, multiple: true },
		});

		// Index normalization
		expect(constraint['conditions[0].type']).toEqual({ required: true });
		expect(constraint['conditions[0].conditions']).toEqual({
			required: false,
			multiple: true,
		});

		// Recursive alias collapse
		expect(constraint['conditions[0].conditions[1].type']).toEqual({
			required: true,
		});
		expect(
			constraint['conditions[0].conditions[1].conditions[2].type'],
		).toEqual({ required: true });
	});
});
