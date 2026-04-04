import { configureCoercion as baseConfigureCoercion } from './coercion';

/**
 * @deprecated Use `getConstraints` instead.
 */
export { getZodConstraint } from './constraint';
export { formatResult } from './format';
export { isSchema, getConstraints } from './schema';

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
 * @example
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
 * It skips validation, defaults, transforms, and refinements, and preserves
 * empty strings. Use `configureCoercion` to override type-specific coercion.
 *
 * Results are cached per schema, so this can be called inline.
 *
 * @example
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
