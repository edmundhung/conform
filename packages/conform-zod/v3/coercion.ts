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
	lazy,
	any,
	ZodCatch,
	ZodBranded,
	ZodDefault,
} from 'zod/v3';
import type {
	ZodDiscriminatedUnionOption,
	ZodFirstPartySchemaTypes,
	ZodLiteral,
	ZodType,
	ZodTypeDef,
	ZodTypeAny,
	input,
	output,
} from 'zod/v3';

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function stripEmptyString(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	if (value === '') {
		return undefined;
	}

	return value;
}

/**
 * Helpers for coercing file
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

function coerceNumber(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	return value.trim() === '' ? value : Number(value);
}

function coerceBoolean(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	return value === 'on' ? true : value;
}

function coerceDate(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	const date = new Date(value);

	// z.date() does not expose a quick way to set invalid_date error
	// This gets around it by returning the original string if it's invalid
	// See https://github.com/colinhacks/zod/issues/1526
	if (isNaN(date.getTime())) {
		return value;
	}

	return date;
}

function coerceBigInt(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	if (value.trim() === '') {
		return value;
	}

	try {
		return BigInt(value);
	} catch {
		return value;
	}
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
	return (value: unknown) => {
		let result = stripEmptyString(value);

		if (typeof result === 'string') {
			result = fn(result);
		}

		return result;
	};
}

export type DefaultCoercionType =
	| 'string'
	| 'file'
	| 'number'
	| 'boolean'
	| 'date'
	| 'bigint';

export type CoercionFunction = (value: unknown) => unknown;

function compose(
	a: CoercionFunction,
	b: CoercionFunction,
	c: CoercionFunction = (i) => i,
): CoercionFunction {
	return (value) => c(b(a(value)));
}

function selectDefaultCoercion(
	type: ZodTypeAny,
	defaultCoercion: Record<DefaultCoercionType, CoercionFunction>,
): CoercionFunction | null {
	const def = (type as ZodFirstPartySchemaTypes)._def;

	if (
		def.typeName === 'ZodString' ||
		def.typeName === 'ZodEnum' ||
		def.typeName === 'ZodNativeEnum'
	) {
		return defaultCoercion.string;
	} else if (def.typeName === 'ZodLiteral') {
		const literalValue = (type as ZodLiteral<any>).value;

		if (typeof literalValue === 'number') {
			return defaultCoercion.number;
		}
		if (typeof literalValue === 'boolean') {
			return defaultCoercion.boolean;
		}
		if (typeof literalValue === 'bigint') {
			return defaultCoercion.bigint;
		}
		return defaultCoercion.string;
	} else if (
		def.typeName === 'ZodEffects' &&
		isFileSchema(type as ZodEffects<any, any, any>)
	) {
		return defaultCoercion.file;
	} else if (def.typeName === 'ZodNumber') {
		return defaultCoercion.number;
	} else if (def.typeName === 'ZodBoolean') {
		return defaultCoercion.boolean;
	} else if (def.typeName === 'ZodDate') {
		return defaultCoercion.date;
	} else if (def.typeName === 'ZodBigInt') {
		return defaultCoercion.bigint;
	}

	return null;
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This strips empty values to undefined and coerces string to the correct type
 */
export function enableTypeCoercion<Schema extends ZodTypeAny>(
	type: Schema,
	options: {
		cache: Map<ZodTypeAny, ZodTypeAny>;
		coerce: (type: ZodTypeAny) => CoercionFunction | null;
		stripEmptyValue: CoercionFunction;
	},
): ZodTypeAny {
	const result = options.cache.get(type);

	// Return the cached schema if it's already processed
	// This is to prevent infinite recursion caused by z.lazy()
	if (result) {
		return result;
	}

	let schema: ZodTypeAny = type;
	const def = (type as ZodFirstPartySchemaTypes)._def;
	const coercion = options.coerce(type);

	if (coercion) {
		schema = any().transform(coercion).pipe(type);
	} else if (def.typeName === 'ZodArray') {
		schema = any()
			.transform((value) => {
				// No preprocess needed if the value is already an array
				if (Array.isArray(value)) {
					return value;
				}

				if (
					typeof value === 'undefined' ||
					typeof options.stripEmptyValue(value) === 'undefined'
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
		schema = new ZodEffects({
			...def,
			schema: enableTypeCoercion(def.schema, options),
		});
	} else if (def.typeName === 'ZodOptional') {
		schema = any()
			.transform(options.stripEmptyValue)
			.pipe(
				new ZodOptional({
					...def,
					innerType: enableTypeCoercion(def.innerType, options),
				}),
			);
	} else if (def.typeName === 'ZodDefault') {
		const defaultValue = def.defaultValue();
		schema = any()
			.transform(options.stripEmptyValue)
			.pipe(
				new ZodDefault({
					...def,
					innerType:
						defaultValue !== ''
							? enableTypeCoercion(def.innerType, options)
							: def.innerType,
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
		schema = any()
			.transform((value) => {
				if (typeof value === 'undefined') {
					// Defaults it to an empty object
					return {};
				}

				return value;
			})
			.pipe(
				new ZodDiscriminatedUnion({
					...def,
					options: def.options.map((option: ZodTypeAny) =>
						enableTypeCoercion(option, options),
					),
					optionsMap: new Map(
						Array.from(def.optionsMap.entries()).map(
							([discriminator, option]) => [
								discriminator,
								enableTypeCoercion(
									option,
									options,
								) as ZodDiscriminatedUnionOption<any>,
							],
						),
					),
				}),
			);
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
 * import { coerceFormValue } from '@conform-to/zod/v3/future'; // Or import `@conform-to/zod/v4/future`.
 * import { z } from 'zod/v3';
 *
 * // Coerce the form value with default behaviour
 * const schema = coerceFormValue(
 *   z.object({
 *     // ...
 *   })
 * );
 *
 * // Coerce the form value with default coercion overrided
 * const schema = coerceFormValue(
 *   z.object({
 *     ref: z.number()
 *     date: z.date(),
 *     amount: z.number(),
 *     confirm: z.boolean(),
 *   }),
 *   {
 *     // Trim the value for all string-based fields
 *     // e.g. `z.string()`, `z.number()` or `z.boolean()`
 *     string: (value) => {
 *       if (typeof value !== 'string') {
 *          return value;
 *       }
 *
 *       const result = value.trim();
 *
 *       // Treat it as `undefined` if the value is empty
 *       if (result === '') {
 *         return undefined;
 *       }
 *
 *       return result;
 *     },
 *
 *     // Override the default coercion with `z.number()`
 *     number: (value) => {
 *       // Pass the value as is if it's not a string
 *       if (typeof value !== 'string') {
 *         return value;
 *       }
 *
 *       // Trim and remove commas before casting it to number
 *       return Number(value.trim().replace(/,/g, ''));
 *     },
 *
 *     // Disable coercion for `z.boolean()`
 *     boolean: false,
 *   },
 * );
 * ```
 */
export function coerceFormValue<Schema extends ZodTypeAny>(
	type: Schema,
	options?: {
		defaultCoercion?: {
			[key in DefaultCoercionType]?: CoercionFunction | boolean;
		};
		customize?: (type: ZodTypeAny) => CoercionFunction | null;
	},
): ZodType<output<Schema>, ZodTypeDef, input<Schema>> {
	const getCoercion = (
		type: DefaultCoercionType,
		fallbackCoercion?: CoercionFunction,
	): CoercionFunction => {
		const providedCoercion = options?.defaultCoercion?.[type];

		if (typeof providedCoercion === 'function') {
			return providedCoercion;
		}

		// If the user explicitly disabled the coercion or no fallback coercion, return a noop function
		if (providedCoercion === false || !fallbackCoercion) {
			return (value: unknown) => value;
		}

		return fallbackCoercion;
	};
	const defaultCoercion = {
		string: compose(stripEmptyString, getCoercion('string')),
		file: compose(stripEmptyFile, getCoercion('file')),
		number: compose(
			stripEmptyString,
			getCoercion('string'),
			getCoercion('number', coerceNumber),
		),
		boolean: compose(
			stripEmptyString,
			getCoercion('string'),
			getCoercion('boolean', coerceBoolean),
		),
		date: compose(
			stripEmptyString,
			getCoercion('string'),
			getCoercion('date', coerceDate),
		),
		bigint: compose(
			stripEmptyString,
			getCoercion('string'),
			getCoercion('bigint', coerceBigInt),
		),
	};

	return enableTypeCoercion(type, {
		cache: new Map<ZodTypeAny, ZodTypeAny>(),
		stripEmptyValue: compose(defaultCoercion.string, defaultCoercion.file),
		coerce: (type) => {
			let coercion = options?.customize?.(type) ?? null;

			if (coercion === null) {
				coercion = selectDefaultCoercion(type, defaultCoercion);
			}

			return coercion;
		},
	}) as ZodType<output<Schema>, ZodTypeDef, input<Schema>>;
}
