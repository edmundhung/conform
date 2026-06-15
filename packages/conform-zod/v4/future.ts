import type { Constraint } from '@conform-to/dom';
import type { ValidationAttributes } from '@conform-to/dom/future';
import type { $ZodType } from 'zod/v4/core';
import { configureCoercion as baseConfigureCoercion } from './coercion';
import { getZodConstraint as baseGetZodConstraint } from './constraint';
import { isSchema } from './schema';

/**
 * @deprecated Use `getConstraints` instead.
 */
export function getZodConstraint(schema: $ZodType): Record<string, Constraint> {
	return baseGetZodConstraint(schema, false);
}

export function getConstraints(
	schema: unknown,
): Record<string, ValidationAttributes> | undefined {
	if (!isSchema(schema)) {
		return undefined;
	}

	return baseGetZodConstraint(schema, false);
}

export { formatResult } from './format';
export { isSchema } from './schema';

function defaultDate(text: string): Date {
	const date = new Date(shouldAppendUtcSuffix(text) ? `${text}Z` : text);

	if (isNaN(date.getTime())) {
		throw new Error('Invalid date');
	}

	return date;
}

function shouldAppendUtcSuffix(datetimeString: string): boolean {
	if (datetimeString.includes(' ')) {
		return false;
	}

	const separatorIndex = datetimeString.indexOf('T');

	if (separatorIndex < 0) {
		return false;
	}

	const time = datetimeString.slice(separatorIndex + 1);

	return !(
		time.toUpperCase().endsWith('Z') ||
		time.includes('+') ||
		time.includes('-')
	);
}

export function configureCoercion(
	config?: Parameters<typeof baseConfigureCoercion>[0],
): ReturnType<typeof baseConfigureCoercion> {
	return baseConfigureCoercion({
		...config,
		type: {
			...config?.type,
			date: config?.type?.date ?? defaultDate,
		},
	});
}

const defaultCoercion = configureCoercion();

/**
 * Enhances a schema to coerce form values and strip empty values before validation.
 * Use `configureCoercion` to override empty-string handling and type-specific coercion.
 *
 * Results are cached per schema, so this can be called inline.
 *
 * **Example:**
 *
 * ```tsx
 * import { coerceFormValue } from '@conform-to/zod/v4/future';
 * import { z } from 'zod';
 *
 * const schema = coerceFormValue(z.object({
 *   age: z.number().optional(),
 *   subscribe: z.boolean(),
 * }));
 *
 * schema.parse({ age: '', subscribe: 'on' });
 * // { age: undefined, subscribe: true }
 * ```
 */
export const coerceFormValue = defaultCoercion.coerceFormValue;

/**
 * Enhances a schema to coerce form values without running validation.
 * This is useful for reading current form values as typed data.
 *
 * It skips validation, defaults, transforms, and refinements, and does not strip
 * empty strings to `undefined`.
 *
 * For number, boolean, date, and bigint schemas, empty strings and other failed
 * string coercions still become fallback values:
 *
 * - `z.number()` -> `NaN`
 * - `z.boolean()` -> `false`
 * - `z.date()` -> `Invalid Date`
 * - `z.bigint()` -> `0n`
 *
 * Use `configureCoercion` to override type-specific coercion.
 *
 * Results are cached per schema, so this can be called inline.
 *
 * **Example:**
 *
 * ```tsx
 * import { coerceStructure } from '@conform-to/zod/v4/future';
 * import { z } from 'zod';
 *
 * const schema = coerceStructure(z.object({
 *   age: z.number().min(10),
 * }));
 *
 * schema.parse({ age: '3' });
 * // { age: 3 }
 * ```
 */
export const coerceStructure = defaultCoercion.coerceStructure;
