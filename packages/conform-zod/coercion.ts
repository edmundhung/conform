import {
	ZodArray,
	ZodObject,
	ZodIntersection,
	ZodUnion,
	ZodDiscriminatedUnion,
	ZodTuple,
	ZodPipeline,
	ZodEffects,
	ZodNullable,
	ZodOptional,
	ZodDefault,
	lazy,
	preprocess,
	ZodCatch,
	ZodBranded,
	ZodFirstPartyTypeKind,
} from 'zod';
import type {
	ZodDiscriminatedUnionOption,
	ZodFirstPartySchemaTypes,
	ZodType,
	ZodTypeAny,
	ZodTypeDef,
	input,
	output,
} from 'zod';

/**
 * A special string value to represent empty string
 * Used to prevent empty string from being stripped to undefined when using `.default()`
 */
const EMPTY_STRING = '__EMPTY_STRING__';

/**
 * Helpers for stripping empty string
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function stripEmptyString(
	value: unknown,
	coerceType?: (text: string) => unknown,
) {
	if (typeof value !== 'string') {
		return value;
	}

	if (value === '') {
		return undefined;
	}

	if (value === EMPTY_STRING) {
		return '';
	}

	if (typeof coerceType !== 'function') {
		return value;
	}

	return coerceType(value);
}

/**
 * Helpers for stripping empty file
 * Modify the value only if it's a file, otherwise return the value as-is
 */
function stripEmptyFile(file: unknown) {
	if (
		typeof File !== 'undefined' &&
		file instanceof File &&
		file.name === '' &&
		file.size === 0
	) {
		return undefined;
	}

	return file;
}

/**
 * A file schema is usually defined with `z.instanceof(File)`
 * which is implemented with `z.custom()` based on ZodAny with a `superRefine` check
 * @see https://github.com/colinhacks/zod/blob/eea05ae3dab628e7a834397414e5145e935e418b/src/types.ts#L5250-L5285
 */
function isFileSchema(schema: ZodEffects<any, any, any>): boolean {
	if (typeof File === 'undefined') {
		return false;
	}

	return (
		schema._def.effect.type === 'refinement' &&
		schema.innerType()._def.typeName === 'ZodAny' &&
		schema.safeParse(new File([], '')).success &&
		!schema.safeParse('').success
	);
}

/**
 * @deprecated Conform strip empty string by default
 */
export function ifNonEmptyString(fn: (text: string) => unknown) {
	return (value: unknown) => stripEmptyString(value, fn);
}

/**
 * Reconstruct the provided schema with additional preprocessing steps.
 * This strips empty values to undefined and coerces string to the correct type.
 */
export function enableTypeCoercion<Schema extends ZodTypeAny>(
	type: Schema,
	options: {
		coerce?: (
			type: 'boolean' | 'number' | 'date' | 'bigint',
			value: string,
			defaultResult: unknown,
		) => unknown;
		cache: Map<ZodTypeAny, ZodTypeAny>;
	},
): ZodType<output<Schema>, ZodTypeDef, input<Schema>> {
	const result = options.cache.get(type);

	// Return the cached schema if it's already processed
	// This is to prevent infinite recursion caused by z.lazy()
	if (result) {
		return result;
	}

	let schema: ZodTypeAny = type;
	const def = (type as ZodFirstPartySchemaTypes)._def;

	if (
		def.typeName === ZodFirstPartyTypeKind.ZodString ||
		def.typeName === ZodFirstPartyTypeKind.ZodLiteral ||
		def.typeName === ZodFirstPartyTypeKind.ZodEnum ||
		def.typeName === ZodFirstPartyTypeKind.ZodNativeEnum
	) {
		schema = preprocess((value) => stripEmptyString(value), type);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodNumber) {
		schema = preprocess(
			(value) =>
				stripEmptyString(value, (text) => {
					const defaultResult = text.trim() === '' ? text : Number(text);
					return (
						options.coerce?.('number', text, defaultResult) ?? defaultResult
					);
				}),
			type,
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodBoolean) {
		schema = preprocess(
			(value) =>
				stripEmptyString(value, (text) => {
					const defaultResult = text === 'on' ? true : text;
					return (
						options.coerce?.('boolean', text, defaultResult) ?? defaultResult
					);
				}),
			type,
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodDate) {
		schema = preprocess(
			(value) =>
				stripEmptyString(value, (text) => {
					const date = new Date(text);
					// z.date() does not expose a quick way to set invalid_date error
					// This gets around it by returning the original string if it's invalid
					// See https://github.com/colinhacks/zod/issues/1526
					const defaultResult = isNaN(date.getTime()) ? text : date;
					return options.coerce?.('date', text, defaultResult) ?? defaultResult;
				}),
			type,
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodBigInt) {
		schema = preprocess(
			(value) =>
				stripEmptyString(value, (text) => {
					let defaultResult: unknown = text;

					if (text.trim() !== '') {
						try {
							defaultResult = BigInt(text);
						} catch {
							// Ignore BigInt parsing error
						}
					}

					return (
						options.coerce?.('bigint', text, defaultResult) ?? defaultResult
					);
				}),
			type,
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodArray) {
		schema = preprocess(
			(value) => {
				// No preprocess needed if the value is already an array
				if (Array.isArray(value)) {
					return value;
				}

				if (
					typeof value === 'undefined' ||
					typeof stripEmptyFile(stripEmptyString(value)) === 'undefined'
				) {
					return [];
				}

				// Wrap it in an array otherwise
				return [value];
			},
			new ZodArray({
				...def,
				type: enableTypeCoercion(def.type, options),
			}),
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodObject) {
		schema = preprocess(
			(value) => {
				if (typeof value === 'undefined') {
					// Defaults it to an empty object
					return {};
				}

				return value;
			},
			new ZodObject({
				...def,
				shape: () =>
					Object.fromEntries(
						Object.entries(def.shape()).map(([key, def]) => [
							key,
							// @ts-expect-error see message above
							enableTypeCoercion(def, options),
						]),
					),
			}),
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodEffects) {
		if (isFileSchema(type as unknown as ZodEffects<any, any, any>)) {
			schema = preprocess((value) => stripEmptyFile(value), type);
		} else {
			schema = new ZodEffects({
				...def,
				schema: enableTypeCoercion(def.schema, options),
			});
		}
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodOptional) {
		schema = preprocess(
			(value) => stripEmptyFile(stripEmptyString(value)),
			new ZodOptional({
				...def,
				innerType: enableTypeCoercion(def.innerType, options),
			}),
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodDefault) {
		schema = preprocess(
			(value) => stripEmptyFile(stripEmptyString(value)),
			new ZodDefault({
				...def,
				defaultValue: () => {
					const value = def.defaultValue();

					if (value === '') {
						return EMPTY_STRING;
					}

					return value;
				},
				innerType: enableTypeCoercion(def.innerType, options),
			}),
		);
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodCatch) {
		schema = new ZodCatch({
			...def,
			innerType: enableTypeCoercion(def.innerType, options),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodIntersection) {
		schema = new ZodIntersection({
			...def,
			left: enableTypeCoercion(def.left, options),
			right: enableTypeCoercion(def.right, options),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodUnion) {
		schema = new ZodUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, options),
			),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodDiscriminatedUnion) {
		schema = new ZodDiscriminatedUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, options),
			),
			optionsMap: new Map(
				Array.from(def.optionsMap.entries()).map(([discriminator, option]) => [
					discriminator,
					enableTypeCoercion(
						option,
						options,
					) as ZodDiscriminatedUnionOption<any>,
				]),
			),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodBranded) {
		schema = new ZodBranded({
			...def,
			type: enableTypeCoercion(def.type, options),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodTuple) {
		schema = new ZodTuple({
			...def,
			items: def.items.map((item: ZodTypeAny) =>
				enableTypeCoercion(item, options),
			),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodNullable) {
		schema = new ZodNullable({
			...def,
			innerType: enableTypeCoercion(def.innerType, options),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodPipeline) {
		schema = new ZodPipeline({
			...def,
			in: enableTypeCoercion(def.in, options),
			out: enableTypeCoercion(def.out, options),
		});
	} else if (def.typeName === ZodFirstPartyTypeKind.ZodLazy) {
		const inner = def.getter();
		schema = lazy(() => enableTypeCoercion(inner, options));
	}

	if (type !== schema) {
		options.cache.set(type, schema);
	}

	return schema;
}

/**
 * A helper that enhance the zod schema to strip empty value and coerce form value to the expected type with option to customize type coercion.
 * @example
 *
 * ```tsx
 * import { parseWithZod, unstable_zodFormValue as zodFormValue } from '@conform-to/zod';
 * import { z } from 'zod';
 *
 * // To coerce the form value with default behaviour
 * const schema = zodFormValue(
 *   z.object({
 *     ref: z.number()
 *     date: z.date(),
 *     amount: z.number(),
 *     confirm: z.boolean(),
 *   })
 * );
 *
 * // To coerce the form value with custom coercion logic
 * const schema = zodFormValue(
 *   z.object({
 *     ref: z.number()
 *     date: z.date(),
 *     amount: z.number(),
 *     confirm: z.boolean(),
 *   }),
 *   {
 *     coerce(type, value, defaultResult) {
 *       switch (type) {
 *         case 'number':
 *           return Number(value.trim().replace(/,/g, ''));
 *         case 'boolean':
 *           return value === 'yes';
 *         default:
 *           // Fallback to default coercion result if the type is not handled
 *           return defaultResult;
 *       }
 *     }
 *   },
 * );
 * ```
 */
export function zodFormValue<Schema extends ZodTypeAny>(
	type: Schema,
	options?: {
		coerce?: (
			type: 'boolean' | 'number' | 'date' | 'bigint',
			value: string,
			defaultResult: unknown,
		) => unknown;
	},
): Schema {
	return enableTypeCoercion(type, {
		cache: new Map<ZodTypeAny, ZodTypeAny>(),
		coerce: options?.coerce,
	}) as Schema;
}
