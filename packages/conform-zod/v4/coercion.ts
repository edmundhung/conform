import type {
	$ZodDiscriminatedUnionDef,
	$ZodObjectDef,
	$ZodType,
	$ZodTypes,
	input,
	output,
} from 'zod/v4/core';
import { lazy, optional, pipe, transform } from 'zod/v4';
import type { ZodType } from 'zod/v4';

type CoercionFunction = (value: unknown) => unknown;

type CoercionKey = 'string' | 'file' | 'number' | 'boolean' | 'date' | 'bigint';

function coerceFile(file: unknown): unknown {
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

function defaultConvertNumber(text: string): number {
	return text.trim() === '' ? NaN : Number(text);
}

function defaultConvertBoolean(text: string): boolean {
	if (text === 'on') {
		return true;
	}

	throw new Error('Not a boolean');
}

function defaultConvertDate(text: string): Date {
	const date = new Date(text);

	if (isNaN(date.getTime())) {
		throw new Error('Invalid date');
	}

	return date;
}

function defaultConvertBigInt(text: string): bigint {
	if (text.trim() === '') {
		throw new Error('Empty bigint');
	}

	return BigInt(text);
}

function coerceString(value: unknown, fn: (text: string) => unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}

	return fn(value);
}

/**
 * strip → undefined stops, else convert, catch → original string
 */
function createValidationCoercion(
	strip: (value: string) => string | undefined,
	convert: (text: string) => unknown,
): CoercionFunction {
	return (value) =>
		coerceString(value, (text) => {
			const stripped = strip(text);

			if (stripped === undefined) {
				return undefined;
			}

			try {
				return convert(stripped);
			} catch {
				return stripped;
			}
		});
}

/**
 * On error returns the sentinel (e.g. NaN, false) so typeCheckTransform accepts it.
 */
function createStructuralCoercion(
	convert: (text: string) => unknown,
	emptySentinel: unknown,
): CoercionFunction {
	return (value) =>
		coerceString(value, (text) => {
			try {
				return convert(text);
			} catch {
				return emptySentinel;
			}
		});
}

function selectCoercion(
	type: $ZodType,
	defaultCoercion: Partial<Record<CoercionKey, CoercionFunction>>,
): CoercionFunction | undefined {
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
}

/**
 * Constrained types (enum, literal) should still be validated in structural
 * mode because their values come from constrained UI (select, radio, hidden
 * input) and an invalid value indicates a developer error.
 */
function isConstrainedType(type: $ZodType): boolean {
	const def = type._zod.def;
	return def.type === 'enum' || def.type === 'literal';
}

/**
 * Accepts sentinel values like NaN and Invalid Date since
 * `typeof NaN === 'number'` and `Invalid Date instanceof Date`.
 */
function getTypeCheckTarget(type: $ZodType): $ZodType {
	switch (type._zod.def.type) {
		case 'string':
		case 'number':
		case 'boolean':
		case 'date':
		case 'bigint':
			return typeCheckTransform(type._zod.def.type);
		default:
			return type;
	}
}

function typeCheckTransform(defType: string): $ZodType {
	const check =
		defType === 'date'
			? (value: unknown): value is Date => value instanceof Date
			: (value: unknown) => typeof value === defType;

	return transform((value: unknown, ctx) => {
		if (!check(value)) {
			ctx!.issues.push({
				input: value,
				code: 'invalid_type' as const,
				expected: defType as 'number',
				received: typeof value as 'boolean',
				message: `Invalid input: expected ${defType}, received ${typeof value}`,
			});
		}
		return value;
	});
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * that strip empty values and coerce strings to the correct type.
 */
function coerceType(
	type: $ZodType,
	options: {
		/** Map of original schema to its coerced version. Prevents re-processing and infinite recursion from z.lazy(). */
		resolved: Map<$ZodType, $ZodType>;
		/** Schemas currently being resolved. Detects re-entrant calls from getter-based recursive schemas. */
		resolving: Set<$ZodType>;
		/** Returns a coercion function for the given schema type, or null to skip. */
		coerce: (type: $ZodType) => CoercionFunction | null;
		/** Strip function for optional/nonoptional/array. `undefined` = no stripping. */
		stripEmptyValue?: CoercionFunction;
		/** Whether to replace the original schema with a type check for non-constrained leaves. */
		skipValidation?: boolean;
		/** Whether to skip default/prefault wrappers (recurse into inner). */
		skipDefaults?: boolean;
		/** Whether to skip transforms in pipe (only process `def.in`). */
		skipTransforms?: boolean;
	},
): $ZodType {
	const result = options.resolved.get(type);

	if (result) {
		// Prevent infinite recursion from z.lazy()
		return result;
	}

	// Detect re-entrant calls caused by getter-based recursive schemas
	// (Zod v4's recommended pattern for recursive types).
	// Return a lazy wrapper to break the recursion; the inner call is
	// deferred to parse time, by which point the schema will be cached.
	if (options.resolving.has(type)) {
		return lazy(() => coerceType(type, options));
	}

	options.resolving.add(type);

	let schema: $ZodType = type;
	const zod = (type as unknown as $ZodTypes)._zod;
	const def = zod.def;
	const constr = zod.constr;

	const coercion = options.coerce(type);
	const target =
		options.skipValidation && !isConstrainedType(type)
			? getTypeCheckTarget(type)
			: type;

	if (coercion) {
		schema = pipe(transform(coercion), target);
	} else if (target !== type) {
		schema = target;
	} else if (def.type === 'array') {
		const arrayDef = options.skipValidation
			? { ...def, checks: undefined }
			: def;

		schema = pipe(
			transform((value) => {
				if (Array.isArray(value)) {
					return value;
				}

				if (
					typeof value === 'undefined' ||
					(options.stripEmptyValue &&
						typeof options.stripEmptyValue(value) === 'undefined')
				) {
					return [];
				}

				return [value];
			}),
			new constr({
				...arrayDef,
				element: coerceType(def.element, options),
			}) as $ZodType<unknown, []>,
		);
	} else if (def.type === 'object') {
		const objectDef = options.skipValidation
			? { ...def, catchall: undefined }
			: def;

		schema = pipe(
			transform((value) => {
				if (typeof value === 'undefined') {
					return {};
				}

				return value;
			}),
			new constr({
				...objectDef,
				shape: Object.fromEntries(
					Object.entries(def.shape).map(([key, def]) => [
						key,
						coerceType(def, options),
					]),
				),
			}) as $ZodType<unknown, {}>,
		);
	} else if (def.type === 'optional' || def.type === 'nonoptional') {
		const innerType = coerceType(def.innerType, options);
		const wrapped = new constr({ ...def, innerType });

		schema = options.stripEmptyValue
			? pipe(transform(options.stripEmptyValue), wrapped)
			: wrapped;
	} else if (def.type === 'default' || def.type === 'prefault') {
		if (options.skipDefaults) {
			schema = optional(coerceType(def.innerType, options));
		} else {
			const defaultValue = def.defaultValue;
			const innerType =
				defaultValue !== '' // Don't strip the empty string that IS the default
					? coerceType(def.innerType, options)
					: def.innerType;
			const wrapped = new constr({ ...def, innerType });

			schema = options.stripEmptyValue
				? pipe(transform(options.stripEmptyValue), wrapped)
				: wrapped;
		}
	} else if (def.type === 'catch') {
		schema = new constr({
			...def,
			innerType: coerceType(def.innerType, options),
		});
	} else if (def.type === 'intersection') {
		schema = new constr({
			...def,
			left: coerceType(def.left, options),
			right: coerceType(def.right, options),
		});
		// The `type` of `discriminatedUnion` is defined as 'union', so it can be determined from the class name used.
	} else if (
		def.type === 'union' &&
		[...zod.traits][0]?.includes('DiscriminatedUnion')
	) {
		schema = pipe(
			transform((value) => {
				if (typeof value === 'undefined') {
					return {};
				}

				return value;
			}),
			new constr({
				...def,
				options: def.options.map((item) => {
					const objectDef = item._zod.def as
						| $ZodObjectDef
						| $ZodDiscriminatedUnionDef;
					const setOriginalPropValues = (
						object: $ZodType<unknown, unknown>,
					) => {
						// The discriminate key is obtained from the defined Object.
						// If you regenerate the Object schema, the `propValues` property disappears. Therefore, set the one obtained from the original Object.
						// https://github.com/colinhacks/zod/blob/22ab436bc214d86d740e78f33ae6834d28ddc152/packages/zod/src/v4/core/schemas.ts#L1949-L1963
						object._zod.propValues = item._zod.propValues;
						// @ts-expect-error: The `disc` property was used up to version 3.25.34, but was changed to the `propValues` property from version 3.25.35 onwards.
						object._zod.disc = item._zod.disc;
						return object;
					};
					if (objectDef.type !== 'object') {
						return setOriginalPropValues(coerceType(item, options));
					}
					const innerDef = options.skipValidation
						? { ...objectDef, catchall: undefined }
						: objectDef;
					const object = new item._zod.constr({
						...innerDef,
						shape: Object.fromEntries(
							Object.entries(objectDef.shape).map(([key, def]) => {
								return [key, coerceType(def, options)];
							}),
						),
					}) as $ZodType<unknown, {}>;

					return setOriginalPropValues(object);
				}),
			}) as $ZodType<unknown, {}>,
		);
	} else if (def.type === 'union') {
		schema = new constr({
			...def,
			options: def.options.map((item: $ZodType) => coerceType(item, options)),
		});
	} else if (def.type === 'tuple') {
		schema = new constr({
			...def,
			items: def.items.map((item: $ZodType) => coerceType(item, options)),
		});
	} else if (def.type === 'nullable') {
		schema = new constr({
			...def,
			innerType: coerceType(def.innerType, options),
		});
	} else if (def.type === 'pipe') {
		if (options.skipTransforms) {
			schema = coerceType(def.in, options);
		} else {
			schema = new constr({
				...def,
				in: coerceType(def.in, options),
				out: coerceType(def.out, options),
			});
		}
	} else if (def.type === 'lazy') {
		const inner = def.getter();
		schema = lazy(() => coerceType(inner, options));
	}

	options.resolving.delete(type);

	if (type !== schema) {
		options.resolved.set(type, schema);
	}

	return schema;
}

/**
 * Creates configured coercion functions for form value parsing.
 *
 * @example
 *
 * ```tsx
 * import { configureCoercion } from '@conform-to/zod/v4/future';
 * import { z } from 'zod';
 *
 * const { coerceFormValue, coerceStructure } = configureCoercion({
 *   // Trim whitespace and treat whitespace-only as empty
 *   stripEmptyString: (value) => {
 *     const trimmed = value.trim();
 *     return trimmed === '' ? undefined : trimmed;
 *   },
 *   type: {
 *     // Custom number parsing: strip commas
 *     number: (text) => Number(text.replace(/,/g, '')),
 *   },
 * });
 *
 * const schema = z.object({ age: z.number(), name: z.string() });
 * const validationSchema = coerceFormValue(schema);
 * const structuralSchema = coerceStructure(schema);
 * ```
 */
export function configureCoercion(config?: {
	/**
	 * Validation only: determines what string values are "empty" → undefined.
	 * Receives a raw string and returns the string (possibly transformed) or
	 * `undefined` to indicate empty. Empty files are always stripped at the
	 * system level.
	 *
	 * @default (value) => value === '' ? undefined : value
	 */
	stripEmptyString?: (value: string) => string | undefined;

	/**
	 * Type-specific string → typed value conversion functions.
	 * Shared between validation and structural modes. The system handles
	 * non-string passthrough and per-mode empty handling.
	 *
	 * Defaults: number via `Number()`, boolean checks `'on'`, date via
	 * `new Date()`, bigint via `BigInt()` (not overridable here, use
	 * `customize` instead).
	 */
	type?: {
		number?: (text: string) => number;
		boolean?: (text: string) => boolean;
		date?: (text: string) => Date;
	};

	/**
	 * Per-schema escape hatch. Return a coercion function to override
	 * the default for a specific schema, or `null` to use the default.
	 * The coercion function receives the raw form value (string, File,
	 * array, etc.) and neither `stripEmptyString` nor `coerceString`
	 * is applied automatically.
	 */
	customize?: (type: $ZodType) => ((value: unknown) => unknown) | null;
}) {
	const stripEmptyString: (value: string) => string | undefined =
		config?.stripEmptyString ?? ((value) => (value === '' ? undefined : value));
	const convertNumber = config?.type?.number ?? defaultConvertNumber;
	const convertBoolean = config?.type?.boolean ?? defaultConvertBoolean;
	const convertDate = config?.type?.date ?? defaultConvertDate;
	const validationMap: Record<CoercionKey, CoercionFunction> = {
		string: (value) => coerceString(value, stripEmptyString),
		file: coerceFile,
		number: createValidationCoercion(stripEmptyString, convertNumber),
		boolean: createValidationCoercion(stripEmptyString, convertBoolean),
		date: createValidationCoercion(stripEmptyString, convertDate),
		bigint: createValidationCoercion(stripEmptyString, defaultConvertBigInt),
	};
	const structuralMap: Partial<Record<CoercionKey, CoercionFunction>> = {
		number: createStructuralCoercion(convertNumber, NaN),
		boolean: createStructuralCoercion(convertBoolean, false),
		date: createStructuralCoercion(convertDate, new Date('')),
		bigint: createStructuralCoercion(defaultConvertBigInt, 0n),
	};

	const coerce = (
		type: $ZodType,
		coercionMap: Partial<Record<CoercionKey, CoercionFunction>>,
	): CoercionFunction | null => {
		if (config?.customize) {
			const customFn = config.customize(type);

			if (customFn !== null) {
				return customFn;
			}
		}

		return selectCoercion(type, coercionMap) ?? null;
	};

	const validationCache = new WeakMap<$ZodType, $ZodType>();
	const structureCache = new WeakMap<$ZodType, $ZodType>();

	return {
		/**
		 * A helper that enhance the zod schema to strip empty value and coerce
		 * form value to the expected type with option to customize type coercion.
		 *
		 * @example
		 *
		 * ```tsx
		 * import { coerceFormValue } from '@conform-to/zod/v4/future';
		 * import { z } from 'zod';
		 *
		 * // Coerce the form value
		 * const schema = coerceFormValue(
		 *   z.object({
		 *     // ...
		 *   })
		 * );
		 * ```
		 */
		coerceFormValue<Schema extends $ZodType>(
			type: Schema,
		): ZodType<output<Schema>, input<Schema>> {
			let result = validationCache.get(type);

			if (!result) {
				result = coerceType(type, {
					resolved: new Map(),
					resolving: new Set(),
					stripEmptyValue(value) {
						return coerceFile(coerceString(value, stripEmptyString));
					},
					coerce(type) {
						return coerce(type, validationMap);
					},
				});
				validationCache.set(type, result);
			}

			return result as ZodType<output<Schema>, input<Schema>>;
		},

		/**
		 * Enhances a schema to convert form string values to their typed
		 * equivalents without validation. Useful for reading current form values
		 * as typed data.
		 *
		 * Skips schema validation (min/max/regex/etc.), defaults, transforms,
		 * and refinements. Empty strings are preserved (not stripped).
		 *
		 * Results are cached per schema, so this can be called inline.
		 */
		coerceStructure<Schema extends $ZodType>(
			type: Schema,
		): ZodType<input<Schema>, input<Schema>> {
			let result = structureCache.get(type);

			if (!result) {
				result = coerceType(type, {
					resolved: new Map(),
					resolving: new Set(),
					coerce(type) {
						return coerce(type, structuralMap);
					},
					skipValidation: true,
					skipDefaults: true,
					skipTransforms: true,
				});
				structureCache.set(type, result);
			}

			return result as ZodType<input<Schema>, input<Schema>>;
		},
	};
}

export const { coerceFormValue, coerceStructure } = configureCoercion();
