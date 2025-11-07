import {
	array,
	bigint,
	boolean,
	check,
	date,
	enum_,
	exactOptional,
	instance,
	intersect,
	literal,
	looseObject,
	maxLength,
	maxValue,
	minLength,
	minValue,
	nullish,
	number,
	object,
	objectWithRest,
	optional,
	pipe,
	strictObject,
	string,
	tuple,
	tupleWithRest,
	union,
	variant,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { getConstraint as getValibotConstraint } from '../constraint';

enum TestEnum {
	a = 'a',
	b = 'b',
	c = 'c',
}

describe('constraint', () => {
	test('getValibotConstraint', () => {
		const baseSchema = {
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
			bigint: pipe(
				bigint('required'),
				minValue(BigInt(1), 'min'),
				maxValue(BigInt(10), 'max'),
			),
			timestamp: optional(
				pipe(date(), minValue(new Date(1), 'min'), maxValue(new Date(), 'max')),
				new Date(),
			),
			flag: optional(boolean()),
			exactOptionalFlag: exactOptional(boolean()),
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
			tupleWithRest: tupleWithRest(
				[
					pipe(string(), minLength(3, 'min')),
					optional(pipe(number(), maxValue(100, 'max'))),
				],
				optional(pipe(number(), maxValue(100, 'max'))),
			),
			nullishString: nullish(string()),
		};
		const objectSchema = pipe(
			object(baseSchema),
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
			bigint: {
				required: true,
				min: 1n,
				max: 10n,
			},
			timestamp: {
				required: false,
			},
			flag: {
				required: false,
			},
			exactOptionalFlag: {
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
			tupleWithRest: {
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
			'tupleWithRest[0]': {
				required: true,
				minLength: 3,
			},
			'tupleWithRest[1]': {
				required: false,
				max: 100,
			},
			nullishString: {
				required: false,
			},
		};

		expect(getValibotConstraint(objectSchema)).toEqual(constraint);

		// objectWtthRest is supported
		expect(
			getValibotConstraint(objectWithRest(baseSchema, optional(number()))),
		).toEqual(constraint);

		// strictObject is supported
		expect(getValibotConstraint(strictObject(baseSchema))).toEqual(constraint);

		// looseObject is supported
		expect(getValibotConstraint(looseObject(baseSchema))).toEqual(constraint);

		// Non-object schemas will throw an error
		expect(() => getValibotConstraint(string())).toThrow();
		expect(() => getValibotConstraint(array(string()))).toThrow();

		// Non-Valibot schemas return null
		expect(getValibotConstraint(null)).toBe(null);
		expect(getValibotConstraint(undefined)).toBe(null);
		expect(getValibotConstraint({})).toBe(null);
		expect(getValibotConstraint({ foo: 'bar' })).toBe(null);
		expect(getValibotConstraint('string')).toBe(null);
		expect(getValibotConstraint(123)).toBe(null);

		// Intersection is supported
		expect(
			getValibotConstraint(
				intersect([
					objectSchema,
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
	});
});
