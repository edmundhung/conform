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
} from 'zod';
import type {
	ZodDiscriminatedUnionOption,
	ZodFirstPartySchemaTypes,
	ZodTypeAny,
} from 'zod';

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function coerceString(value: unknown) {
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
		let result = coerceString(value);

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

function composeCoercion(
	a: CoercionFunction,
	b: CoercionFunction,
): CoercionFunction {
	return (value) => b(a(value));
}

export function getDefaultCoercion(
	type: ZodTypeAny,
	defaultCoercion: Record<DefaultCoercionType, CoercionFunction>,
): CoercionFunction | null {
	const def = (type as ZodFirstPartySchemaTypes)._def;

	if (
		def.typeName === 'ZodString' ||
		def.typeName === 'ZodLiteral' ||
		def.typeName === 'ZodEnum' ||
		def.typeName === 'ZodNativeEnum'
	) {
		return defaultCoercion.string;
	} else if (
		def.typeName === 'ZodEffects' &&
		isFileSchema(type as ZodEffects<any, any, any>)
	) {
		return defaultCoercion.file;
	} else if (def.typeName === 'ZodNumber') {
		return composeCoercion(defaultCoercion.string, defaultCoercion.number);
	} else if (def.typeName === 'ZodBoolean') {
		return composeCoercion(defaultCoercion.string, defaultCoercion.boolean);
	} else if (def.typeName === 'ZodDate') {
		return composeCoercion(defaultCoercion.string, defaultCoercion.date);
	} else if (def.typeName === 'ZodBigInt') {
		return composeCoercion(defaultCoercion.string, defaultCoercion.bigint);
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
		defaultCoercion: Record<DefaultCoercionType, CoercionFunction>;
		defineCoercion: (type: ZodTypeAny) => CoercionFunction | null;
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
	const coercion =
		options.defineCoercion(type) ??
		getDefaultCoercion(type, options.defaultCoercion);
	const coerceStringOrFile = composeCoercion(
		options.defaultCoercion.string,
		options.defaultCoercion.file,
	);

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
					typeof coerceStringOrFile(value) === 'undefined'
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
			.transform(coerceStringOrFile)
			.pipe(
				new ZodOptional({
					...def,
					innerType: enableTypeCoercion(def.innerType, options),
				}),
			);
	} else if (def.typeName === 'ZodDefault') {
		const defaultValue = def.defaultValue();
		schema = any()
			.transform(coerceStringOrFile)
			// Reconstruct `.default()` as `.optional().transform(value => value ?? defaultValue)`
			.pipe(enableTypeCoercion(def.innerType, options).optional())
			.transform((value) => value ?? defaultValue);
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
		defineCoercion?: (type: ZodTypeAny) => CoercionFunction | null;
	},
): Schema {
	const refineCoercion = (
		providedCoercion: CoercionFunction | boolean | undefined,
		defaultCoercion: CoercionFunction,
	): CoercionFunction => {
		if (typeof providedCoercion === 'function') {
			return providedCoercion;
		}

		// If the user explicitly disabled the coercion, return a noop function
		if (providedCoercion === false) {
			return (value) => value;
		}

		return defaultCoercion;
	};

	return enableTypeCoercion(type, {
		cache: new Map<ZodTypeAny, ZodTypeAny>(),
		defaultCoercion: {
			string: refineCoercion(options?.defaultCoercion?.string, coerceString),
			file: refineCoercion(options?.defaultCoercion?.file, coerceFile),
			number: refineCoercion(options?.defaultCoercion?.number, coerceNumber),
			boolean: refineCoercion(options?.defaultCoercion?.boolean, coerceBoolean),
			date: refineCoercion(options?.defaultCoercion?.date, coerceDate),
			bigint: refineCoercion(options?.defaultCoercion?.bigint, coerceBigInt),
		},
		defineCoercion: options?.defineCoercion ?? (() => null),
	}) as Schema;
}
