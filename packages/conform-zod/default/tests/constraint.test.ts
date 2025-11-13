import { describe, test, expect } from 'vitest';
import { getZodConstraint } from '../constraint';
import { z } from 'zod';

describe('constraint', () => {
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
});
