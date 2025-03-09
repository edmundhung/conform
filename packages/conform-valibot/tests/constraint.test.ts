import {
	array,
	boolean,
	check,
	date,
	enum_,
	instance,
	intersect,
	literal,
	maxLength,
	maxValue,
	minLength,
	minValue,
	nullish,
	number,
	object,
	optional,
	pipe,
	string,
	tuple,
	union,
	variant,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { getValibotConstraint } from '../constraint';

enum TestEnum {
	a = 'a',
	b = 'b',
	c = 'c',
}

describe('constraint', () => {
	test('getValibotConstraint', () => {
		const schema = pipe(
			object({
				text: pipe(
					string('required'),
					minLength(10, 'min'),
					maxLength(100, 'max'),
					check(() => false, 'refine'),
				),
				number: pipe(
					number('required'),
					minValue(1, 'min'),
					maxValue(10, 'max'),
					check((v) => v % 2 === 0, 'step'),
				),
				timestamp: optional(
					pipe(
						date(),
						minValue(new Date(1), 'min'),
						maxValue(new Date(), 'max'),
					),
					new Date(),
				),
				flag: optional(boolean()),
				options: pipe(array(enum_(TestEnum)), minLength(3, 'min')),
				nested: pipe(
					object({
						key: pipe(
							string(),
							check(() => false, 'refine'),
						),
					}),
					check(() => false, 'refine'),
				),
				list: pipe(
					array(
						object({
							key: pipe(
								string('required'),
								check(() => false, 'refine'),
							),
						}),
					),
					maxLength(0, 'max'),
				),
				files: pipe(
					array(instance(Date, 'Invalid file')),
					minLength(1, 'required'),
				),
				tuple: tuple([
					pipe(string(), minLength(3, 'min')),
					optional(pipe(number(), maxValue(100, 'max'))),
				]),
				nullishString: nullish(string()),
			}),
			check(() => false, 'refine'),
		);
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
			nullishString: {
				required: false,
			},
		};

		expect(getValibotConstraint(schema)).toEqual(constraint);

		// Non-object schemas will throw an error
		expect(() => getValibotConstraint(string())).toThrow();
		expect(() => getValibotConstraint(array(string()))).toThrow();

		// Intersection is supported
		expect(
			getValibotConstraint(
				intersect([
					schema,
					object({ text: optional(string()), something: string() }),
				]),
			),
		).toEqual({
			...constraint,
			text: { required: false },
			something: { required: true },
		});

		// Union is supported
		expect(
			getValibotConstraint(
				intersect([
					union([
						object({
							type: literal('a'),
							foo: pipe(string(), minLength(1, 'min')),
							baz: pipe(string(), minLength(1, 'min')),
						}),
						object({
							type: literal('b'),
							bar: pipe(string(), minLength(1, 'min')),
							baz: pipe(string(), minLength(1, 'min')),
						}),
					]),
					object({
						qux: pipe(string(), minLength(1, 'min')),
					}),
				]),
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
			getValibotConstraint(
				intersect([
					variant('type', [
						object({
							type: literal('a'),
							foo: pipe(string(), minLength(1, 'min')),
							baz: pipe(string(), minLength(1, 'min')),
						}),
						object({
							type: literal('b'),
							bar: pipe(string(), minLength(1, 'min')),
							baz: pipe(string(), minLength(1, 'min')),
						}),
					]),
					object({
						qux: pipe(string(), minLength(1, 'min')),
					}),
				]),
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
