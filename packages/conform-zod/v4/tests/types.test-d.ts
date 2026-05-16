import type { Constraint, Submission } from '@conform-to/dom';
import type { FormError, ValidationAttributes } from '@conform-to/dom/future';
import { expectTypeOf, test } from 'vitest';
import { z, type ZodAny } from 'zod';
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4';
import {
	coerceFormValue,
	coerceStructure,
	configureCoercion,
	formatResult,
	getConstraints,
	isSchema,
} from '@conform-to/zod/v4/future';

const schema = z.object({
	age: z.number().optional(),
	subscribed: z.boolean(),
	publishedAt: z.date(),
});

const transformedSchema = z.object({
	age: z.string().transform((value) => Number(value)),
});

test('getZodConstraint', () => {
	expectTypeOf(getZodConstraint(schema)).toEqualTypeOf<
		Record<string, Constraint>
	>();
});

test('parseWithZod', () => {
	const submission = parseWithZod(new FormData(), {
		schema: transformedSchema,
	});
	const asyncSubmission = parseWithZod(new FormData(), {
		schema: transformedSchema,
		async: true,
	});

	expectTypeOf(submission).toEqualTypeOf<
		Submission<
			z.input<typeof transformedSchema>,
			string[],
			z.output<typeof transformedSchema>
		>
	>();
	expectTypeOf(asyncSubmission).toEqualTypeOf<
		Promise<
			Submission<
				z.input<typeof transformedSchema>,
				string[],
				z.output<typeof transformedSchema>
			>
		>
	>();
});

test('configureCoercion', () => {
	const custom = configureCoercion({
		type: {
			date(text) {
				return new Date(text);
			},
		},
	});
	const coerced = custom.coerceFormValue(transformedSchema);
	const structured = custom.coerceStructure(transformedSchema);

	expectTypeOf<z.output<typeof coerced>>().toEqualTypeOf<
		z.output<typeof transformedSchema>
	>();
	expectTypeOf<z.input<typeof coerced>>().toEqualTypeOf<
		z.input<typeof transformedSchema>
	>();
	expectTypeOf<z.output<typeof structured>>().toEqualTypeOf<
		z.input<typeof transformedSchema>
	>();
	expectTypeOf<z.input<typeof structured>>().toEqualTypeOf<
		z.input<typeof transformedSchema>
	>();
});

test('coerceFormValue', () => {
	const coerced = coerceFormValue(transformedSchema);

	expectTypeOf<z.output<typeof coerced>>().toEqualTypeOf<
		z.output<typeof transformedSchema>
	>();
	expectTypeOf<z.input<typeof coerced>>().toEqualTypeOf<
		z.input<typeof transformedSchema>
	>();
});

test('coerceStructure', () => {
	const structured = coerceStructure(transformedSchema);

	expectTypeOf<z.output<typeof structured>>().toEqualTypeOf<
		z.input<typeof transformedSchema>
	>();
	expectTypeOf<z.input<typeof structured>>().toEqualTypeOf<
		z.input<typeof transformedSchema>
	>();
});

test('formatResult', () => {
	const result = transformedSchema.safeParse({ age: '1' });
	const formatted = formatResult(result);
	const formattedWithValue = formatResult(result, { includeValue: true });
	const formattedWithCustomIssues = formatResult(result, {
		formatIssues(issues, name) {
			return {
				count: issues.length,
				name,
			};
		},
	});

	expectTypeOf(formatted).toEqualTypeOf<FormError<string[]> | null>();
	expectTypeOf(formattedWithValue).toEqualTypeOf<{
		error: FormError<string[]> | null;
		value: z.output<typeof transformedSchema> | undefined;
	}>();
	expectTypeOf(formattedWithCustomIssues).toEqualTypeOf<FormError<{
		count: number;
		name: string;
	}> | null>();
});

test('getConstraints', () => {
	expectTypeOf(getConstraints(schema)).toEqualTypeOf<
		Record<string, ValidationAttributes> | undefined
	>();
});

test('isSchema', () => {
	expectTypeOf(isSchema).toEqualTypeOf<(schema: unknown) => schema is ZodAny>();
});
