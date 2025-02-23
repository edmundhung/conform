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
	any,
	ZodCatch,
	ZodBranded,
} from 'zod';
import type {
	ZodDiscriminatedUnionOption,
	ZodFirstPartySchemaTypes,
	ZodTypeAny,
} from 'zod';

/**
 * A special string value to represent empty string
 * Used to prevent empty string from being stripped to undefined when using `.default()`
 */
const EMPTY_STRING = '__EMPTY_STRING__';

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function coerceString(value: unknown, transform?: (text: string) => unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	if (value === '') {
		return undefined;
	}

	if (value === EMPTY_STRING) {
		return '';
	}

	if (typeof transform !== 'function') {
		return value;
	}

	return transform(value);
}

/**
 * Helpers for coercing file
 * Modify the value only if it's a file, otherwise return the value as-is
 */
function coerceFile(file: unknown) {
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
 * @deprecated Conform strip empty string to undefined by default
 */
export function ifNonEmptyString(fn: (text: string) => unknown) {
	return (value: unknown) => coerceString(value, fn);
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This strips empty values to undefined and coerces string to the correct type
 */
export function enableTypeCoercion<Schema extends ZodTypeAny>(
	type: Schema,
	options: {
		cache: Map<ZodTypeAny, ZodTypeAny>;
		skipCoercion?: (schema: ZodTypeAny) => boolean;
	},
): ZodTypeAny {
	if (options.skipCoercion?.(type)) {
		return type;
	}

	const result = options.cache.get(type);

	// Return the cached schema if it's already processed
	// This is to prevent infinite recursion caused by z.lazy()
	if (result) {
		return result;
	}

	let schema: ZodTypeAny = type;
	const def = (type as ZodFirstPartySchemaTypes)._def;

	if (
		def.typeName === 'ZodString' ||
		def.typeName === 'ZodLiteral' ||
		def.typeName === 'ZodEnum' ||
		def.typeName === 'ZodNativeEnum'
	) {
		schema = any()
			.transform((value) => coerceString(value))
			.pipe(type);
	} else if (def.typeName === 'ZodNumber') {
		schema = any()
			.transform((value) =>
				coerceString(value, (text) =>
					text.trim() === '' ? text : Number(text),
				),
			)
			.pipe(type);
	} else if (def.typeName === 'ZodBoolean') {
		schema = any()
			.transform((value) =>
				coerceString(value, (text) => (text === 'on' ? true : text)),
			)
			.pipe(type);
	} else if (def.typeName === 'ZodDate') {
		schema = any()
			.transform((value) =>
				coerceString(value, (text) => {
					const date = new Date(text);

					// z.date() does not expose a quick way to set invalid_date error
					// This gets around it by returning the original string if it's invalid
					// See https://github.com/colinhacks/zod/issues/1526
					if (isNaN(date.getTime())) {
						return text;
					}

					return date;
				}),
			)
			.pipe(type);
	} else if (def.typeName === 'ZodBigInt') {
		schema = any()
			.transform((value) =>
				coerceString(value, (text) => {
					if (text.trim() === '') {
						return text;
					}
					try {
						return BigInt(text);
					} catch {
						return text;
					}
				}),
			)
			.pipe(type);
	} else if (def.typeName === 'ZodArray') {
		schema = any()
			.transform((value) => {
				// No preprocess needed if the value is already an array
				if (Array.isArray(value)) {
					return value;
				}

				if (
					typeof value === 'undefined' ||
					typeof coerceFile(coerceString(value)) === 'undefined'
				) {
					return [];
				}

				// Wrap it in an array otherwise
				return [value];
			})
			.pipe(
				new ZodArray({
					...def,
					type: enableTypeCoercion(def.type, options),
				}),
			);
	} else if (def.typeName === 'ZodObject') {
		schema = any()
			.transform((value) => {
				if (typeof value === 'undefined') {
					// Defaults it to an empty object
					return {};
				}

				return value;
			})
			.pipe(
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
	} else if (def.typeName === 'ZodEffects') {
		if (isFileSchema(type as unknown as ZodEffects<any, any, any>)) {
			schema = any()
				.transform((value) => coerceFile(value))
				.pipe(type);
		} else {
			schema = new ZodEffects({
				...def,
				schema: enableTypeCoercion(def.schema, options),
			});
		}
	} else if (def.typeName === 'ZodOptional') {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
				new ZodOptional({
					...def,
					innerType: enableTypeCoercion(def.innerType, options),
				}),
			);
	} else if (def.typeName === 'ZodDefault') {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
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
	} else if (def.typeName === 'ZodCatch') {
		schema = new ZodCatch({
			...def,
			innerType: enableTypeCoercion(def.innerType, options),
		});
	} else if (def.typeName === 'ZodIntersection') {
		schema = new ZodIntersection({
			...def,
			left: enableTypeCoercion(def.left, options),
			right: enableTypeCoercion(def.right, options),
		});
	} else if (def.typeName === 'ZodUnion') {
		schema = new ZodUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, options),
			),
		});
	} else if (def.typeName === 'ZodDiscriminatedUnion') {
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
	} else if (def.typeName === 'ZodBranded') {
		schema = new ZodBranded({
			...def,
			type: enableTypeCoercion(def.type, options),
		});
	} else if (def.typeName === 'ZodTuple') {
		schema = new ZodTuple({
			...def,
			items: def.items.map((item: ZodTypeAny) =>
				enableTypeCoercion(item, options),
			),
		});
	} else if (def.typeName === 'ZodNullable') {
		schema = new ZodNullable({
			...def,
			innerType: enableTypeCoercion(def.innerType, options),
		});
	} else if (def.typeName === 'ZodPipeline') {
		schema = new ZodPipeline({
			...def,
			in: enableTypeCoercion(def.in, options),
			out: enableTypeCoercion(def.out, options),
		});
	} else if (def.typeName === 'ZodLazy') {
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
 * import { parseWithZod, unstable_coerceFormValue as coerceFormValue } from '@conform-to/zod';
 * import { z } from 'zod';
 *
 * // To coerce the form value with default behaviour
 * const schema = coerceFormValue(
 *   z.object({
 *     ref: z.number()
 *     date: z.date(),
 *     amount: z.number(),
 *     confirm: z.boolean(),
 *   })
 * );
 *
 * // To coerce the form value with number type disabled
 * const schema = coerceFormValue(
 *   z.object({
 *     ref: z.number()
 *     date: z.date(),
 *     amount: z.number(),
 *     confirm: z.boolean(),
 *   }),
 *   {
 *     skipCoercion(type) {
 *       return type instanceof z.ZodNumber;
 *     }
 *   },
 * );
 * ```
 */
export function coerceFormValue<Schema extends ZodTypeAny>(
	type: Schema,
	options?: {
		skipCoercion?: (schema: ZodTypeAny) => boolean;
	},
): Schema {
	return enableTypeCoercion(type, {
		cache: new Map<ZodTypeAny, ZodTypeAny>(),
		skipCoercion: options?.skipCoercion,
	}) as Schema;
}
