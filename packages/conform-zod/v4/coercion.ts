import type { $ZodObjectDef, $ZodType, $ZodTypes } from 'zod/v4/core';
import { lazy, pipe, transform } from 'zod/v4-mini';

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
	type: $ZodType,
	defaultCoercion: Record<DefaultCoercionType, CoercionFunction>,
): CoercionFunction | null {
	const def = type._zod.def;

	if (
		def.type === 'string' ||
		def.type === 'enum' // || def.type === 'nativeEnum'
	) {
		return defaultCoercion.string;
	} else if (def.type === 'literal') {
		if (!('values' in def)) {
			return defaultCoercion.string;
		}

		const literalValue = [...(def.values as Set<unknown>)][0];
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
	} else if (def.type === 'file') {
		return defaultCoercion.file;
	} else if (def.type === 'number') {
		return defaultCoercion.number;
	} else if (def.type === 'boolean') {
		return defaultCoercion.boolean;
	} else if (def.type === 'date') {
		return defaultCoercion.date;
	} else if (def.type === 'bigint') {
		return defaultCoercion.bigint;
	}

	return null;
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This strips empty values to undefined and coerces string to the correct type
 */
export function enableTypeCoercion<Schema extends $ZodType>(
	type: Schema,
	options: {
		cache: Map<$ZodType, $ZodType>;
		coerce: (type: $ZodType) => CoercionFunction | null;
		stripEmptyValue: CoercionFunction;
	},
): $ZodType {
	const result = options.cache.get(type);

	// Return the cached schema if it's already processed
	// This is to prevent infinite recursion caused by z.lazy()
	if (result) {
		return result;
	}

	let schema: $ZodType = type;
	const zod = (type as unknown as $ZodTypes)._zod;
	const def = zod.def;
	const constr = zod.constr;

	const coercion = options.coerce(type);

	if (coercion) {
		schema = pipe(transform(coercion), type);
	} else if (def.type === 'array') {
		schema = pipe(
			transform((value) => {
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
			}),
			new constr({
				...def,
				element: enableTypeCoercion(def.element, options),
			}) as $ZodType<unknown, []>,
		);
	} else if (def.type === 'object') {
		schema = pipe(
			transform((value) => {
				if (typeof value === 'undefined') {
					// Defaults it to an empty object
					return {};
				}

				return value;
			}),
			new constr({
				...def,
				shape: Object.fromEntries(
					Object.entries(def.shape).map(([key, def]) => [
						key,
						enableTypeCoercion(def, options),
					]),
				),
			}) as $ZodType<unknown, {}>,
		);
	} else if (def.type === 'optional') {
		schema = pipe(
			transform(options.stripEmptyValue),
			new constr({
				...def,
				innerType: enableTypeCoercion(def.innerType, options),
			}),
		);
	} else if (def.type === 'default') {
		schema = pipe(
			transform(options.stripEmptyValue),
			new constr({
				...def,
				innerType: enableTypeCoercion(def.innerType, options),
			}),
		);
	} else if (def.type === 'catch') {
		schema = new constr({
			...def,
			innerType: enableTypeCoercion(def.innerType, options),
		});
	} else if (def.type === 'intersection') {
		schema = new constr({
			...def,
			left: enableTypeCoercion(def.left, options),
			right: enableTypeCoercion(def.right, options),
		});
		// The `type` of `discriminatedUnion` is defined as 'union', so it can be determined from the class name used.
	} else if (
		def.type === 'union' &&
		[...zod.traits][0]?.includes('DiscriminatedUnion')
	) {
		schema = pipe(
			transform((value) => {
				if (typeof value === 'undefined') {
					// Defaults it to an empty object
					return {};
				}

				return value;
			}),
			new constr({
				...def,
				options: def.options.map((item, index) => {
					const objectDef = item._zod.def as $ZodObjectDef;
					const object = new item._zod.constr({
						...objectDef,
						shape: Object.fromEntries(
							Object.entries(objectDef.shape).map(([key, def]) => {
								return [key, enableTypeCoercion(def, options)];
							}),
						),
					}) as $ZodType<unknown, {}>;

					// The discriminate key is obtained from the defined Object.
					// If you regenerate the Object schema, the `disc` property disappears. Therefore, set the one obtained from the original Object.
					// https://github.com/colinhacks/zod/blob/94871b708300ab67c4964025354c5199d335e55a/packages/zod/src/v4/core/schemas.ts#L2055-L2070
					object._zod.disc = def.options[index]?._zod.disc;
					return object;
				}),
			}) as $ZodType<unknown, {}>,
		);
	} else if (def.type === 'union') {
		schema = new constr({
			...def,
			options: def.options.map((item: $ZodType) =>
				enableTypeCoercion(item, options),
			),
		});
	} else if (def.type === 'tuple') {
		schema = new constr({
			...def,
			items: def.items.map((item: $ZodType) =>
				enableTypeCoercion(item, options),
			),
		});
	} else if (def.type === 'nullable') {
		schema = new constr({
			...def,
			innerType: enableTypeCoercion(def.innerType, options),
		});
	} else if (def.type === 'pipe') {
		schema = new constr({
			...def,
			in: enableTypeCoercion(def.in, options),
			out: enableTypeCoercion(def.out, options),
		});
	} else if (def.type === 'lazy') {
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
export function coerceFormValue<Schema extends $ZodType>(
	type: Schema,
	options?: {
		defaultCoercion?: {
			[key in DefaultCoercionType]?: CoercionFunction | boolean;
		};
		customize?: (type: $ZodType) => CoercionFunction | null;
	},
): Schema {
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
		cache: new Map<$ZodType, $ZodType>(),
		stripEmptyValue: compose(defaultCoercion.string, defaultCoercion.file),
		coerce: (type) => {
			let coercion = options?.customize?.(type) ?? null;

			if (coercion === null) {
				coercion = selectDefaultCoercion(type, defaultCoercion);
			}

			return coercion;
		},
	}) as Schema;
}
