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

type CoercionFunction = (value: unknown) => unknown;

type CoercionKey = 'string' | 'file' | 'number' | 'boolean' | 'date' | 'bigint';

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
 * Constrained types (enum, literal, nativeEnum) should still be validated in
 * structural mode because their values come from constrained UI (select, radio,
 * hidden input) and an invalid value indicates a developer error.
 */
function isConstrainedType(type: ZodTypeAny): boolean {
	const def = (type as ZodFirstPartySchemaTypes)._def;
	return (
		def.typeName === 'ZodEnum' ||
		def.typeName === 'ZodLiteral' ||
		def.typeName === 'ZodNativeEnum'
	);
}

/**
 * Accepts sentinel values like NaN and Invalid Date since
 * `typeof NaN === 'number'` and `Invalid Date instanceof Date`.
 */
function createTypeCheckTransform(
	expectedType: 'string' | 'number' | 'boolean' | 'date' | 'bigint',
): ZodTypeAny {
	const check =
		expectedType === 'date'
			? (value: unknown): value is Date => value instanceof Date
			: (value: unknown) => typeof value === expectedType;

	return any().superRefine((value, ctx) => {
		if (!check(value)) {
			ctx.addIssue({
				code: 'invalid_type',
				expected: expectedType,
				received: typeof value,
				message: `Invalid input: expected ${expectedType}, received ${typeof value}`,
			});
		}
	});
}

function getTypeCheckTarget(type: ZodTypeAny): ZodTypeAny {
	const def = (type as ZodFirstPartySchemaTypes)._def;
	switch (def.typeName) {
		case 'ZodString':
			return createTypeCheckTransform('string');
		case 'ZodNumber':
			return createTypeCheckTransform('number');
		case 'ZodBoolean':
			return createTypeCheckTransform('boolean');
		case 'ZodDate':
			return createTypeCheckTransform('date');
		case 'ZodBigInt':
			return createTypeCheckTransform('bigint');
		default:
			return type;
	}
}

function selectCoercion(
	type: ZodTypeAny,
	defaultCoercion: Partial<Record<CoercionKey, CoercionFunction>>,
): CoercionFunction | undefined {
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
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This strips empty values to undefined and coerces string to the correct type
 */
function coerceType<Schema extends ZodTypeAny>(
	type: Schema,
	options: {
		/** Map of original schema to its coerced version. Prevents re-processing and infinite recursion from z.lazy(). */
		resolved: Map<ZodTypeAny, ZodTypeAny>;
		/** Returns a coercion function for the given schema type, or null to skip. */
		coerce: (type: ZodTypeAny) => CoercionFunction | null;
		/** Strip function for optional/default/array. `undefined` = no stripping. */
		stripEmptyValue?: CoercionFunction;
		/** Whether to replace the original schema with a type check for non-constrained leaves. */
		skipValidation?: boolean;
		/** Whether to skip default wrappers (recurse into inner). */
		skipDefaults?: boolean;
		/** Whether to skip transforms in pipe and effects. */
		skipTransforms?: boolean;
	},
): ZodTypeAny {
	const result = options.resolved.get(type);

	if (result) {
		// Prevent infinite recursion from z.lazy()
		return result;
	}

	let schema: ZodTypeAny = type;
	const def = (type as ZodFirstPartySchemaTypes)._def;
	const coercion = options.coerce(type);
	const target =
		options.skipValidation && !isConstrainedType(type)
			? getTypeCheckTarget(type)
			: type;

	if (coercion) {
		schema = any().transform(coercion).pipe(target);
	} else if (target !== type) {
		schema = target;
	} else if (def.typeName === 'ZodArray') {
		const arrayDef = options.skipValidation
			? { ...def, minLength: null, maxLength: null, exactLength: null }
			: def;

		schema = any()
			.transform((value) => {
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
			})
			.pipe(
				new ZodArray({
					...arrayDef,
					type: coerceType(def.type, options),
				}),
			);
	} else if (def.typeName === 'ZodObject') {
		const objectDef = options.skipValidation
			? { ...def, unknownKeys: 'strip' }
			: def;

		schema = any()
			.transform((value) => {
				if (typeof value === 'undefined') {
					return {};
				}

				return value;
			})
			.pipe(
				new ZodObject({
					...objectDef,
					shape: () =>
						Object.fromEntries(
							Object.entries(def.shape()).map(([key, def]) => [
								key,
								// @ts-expect-error ZodTypeAny vs shape value type mismatch
								coerceType(def, options),
							]),
						),
				}),
			);
	} else if (def.typeName === 'ZodEffects') {
		if (
			(options.skipTransforms &&
				(def.effect.type === 'transform' ||
					def.effect.type === 'preprocess')) ||
			(options.skipValidation && def.effect.type === 'refinement')
		) {
			schema = coerceType(def.schema, options);
		} else {
			schema = new ZodEffects({
				...def,
				schema: coerceType(def.schema, options),
			});
		}
	} else if (def.typeName === 'ZodOptional') {
		const innerType = coerceType(def.innerType, options);
		const wrapped = new ZodOptional({ ...def, innerType });

		schema = options.stripEmptyValue
			? any().transform(options.stripEmptyValue).pipe(wrapped)
			: wrapped;
	} else if (def.typeName === 'ZodDefault') {
		if (options.skipDefaults) {
			schema = coerceType(def.innerType, options).optional();
		} else {
			const defaultValue = def.defaultValue();
			const innerType =
				defaultValue !== '' // Don't strip the empty string that IS the default
					? coerceType(def.innerType, options)
					: def.innerType;
			const wrapped = new ZodDefault({ ...def, innerType });

			schema = options.stripEmptyValue
				? any().transform(options.stripEmptyValue).pipe(wrapped)
				: wrapped;
		}
	} else if (def.typeName === 'ZodCatch') {
		schema = new ZodCatch({
			...def,
			innerType: coerceType(def.innerType, options),
		});
	} else if (def.typeName === 'ZodIntersection') {
		schema = new ZodIntersection({
			...def,
			left: coerceType(def.left, options),
			right: coerceType(def.right, options),
		});
	} else if (def.typeName === 'ZodUnion') {
		schema = new ZodUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				coerceType(option, options),
			),
		});
	} else if (def.typeName === 'ZodDiscriminatedUnion') {
		schema = any()
			.transform((value) => {
				if (typeof value === 'undefined') {
					return {};
				}

				return value;
			})
			.pipe(
				new ZodDiscriminatedUnion({
					...def,
					options: def.options.map((option: ZodTypeAny) =>
						coerceType(option, options),
					),
					optionsMap: new Map(
						Array.from(def.optionsMap.entries()).map(
							([discriminator, option]) => [
								discriminator,
								coerceType(option, options) as ZodDiscriminatedUnionOption<any>,
							],
						),
					),
				}),
			);
	} else if (def.typeName === 'ZodBranded') {
		schema = new ZodBranded({
			...def,
			type: coerceType(def.type, options),
		});
	} else if (def.typeName === 'ZodTuple') {
		schema = new ZodTuple({
			...def,
			items: def.items.map((item: ZodTypeAny) => coerceType(item, options)),
		});
	} else if (def.typeName === 'ZodNullable') {
		schema = new ZodNullable({
			...def,
			innerType: coerceType(def.innerType, options),
		});
	} else if (def.typeName === 'ZodPipeline') {
		if (options.skipTransforms) {
			schema = coerceType(def.in, options);
		} else {
			schema = new ZodPipeline({
				...def,
				in: coerceType(def.in, options),
				out: coerceType(def.out, options),
			});
		}
	} else if (def.typeName === 'ZodLazy') {
		const inner = def.getter();
		schema = lazy(() => coerceType(inner, options));
	}

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
 * import { configureCoercion } from '@conform-to/zod/v3/future';
 * import { z } from 'zod';
 *
 * const { coerceFormValue, coerceStructure } = configureCoercion({
 *   // Trim whitespace and treat whitespace-only as empty
 *   stripEmptyString: (value) => {
 *     const trimmed = value.trim();
 *     return trimmed === '' ? undefined : trimmed;
 *   },
 *   type: {
 *     // Strip commas from numbers like "1,000" before converting
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
	 * Determines what string values are "empty" → undefined.
	 * Receives a raw string and returns the string (possibly transformed) or
	 * `undefined` to indicate empty.
	 *
	 * @default (value) => value === '' ? undefined : value
	 * @example Treat whitespace-only strings as empty:
	 *
	 * ```ts
	 * stripEmptyString: (value) => {
	 *   const trimmed = value.trim();
	 *   return trimmed === '' ? undefined : trimmed;
	 * }
	 * ```
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
	customize?: (type: ZodTypeAny) => ((value: unknown) => unknown) | null;
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
		type: ZodTypeAny,
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

	const validationCache = new WeakMap<ZodTypeAny, ZodTypeAny>();
	const structureCache = new WeakMap<ZodTypeAny, ZodTypeAny>();

	return {
		/**
		 * A helper that enhance the zod schema to strip empty value and coerce
		 * form value to the expected type with option to customize type coercion.
		 *
		 * @example
		 *
		 * ```tsx
		 * import { coerceFormValue } from '@conform-to/zod/v3/future';
		 * import { z } from 'zod';
		 *
		 * const schema = coerceFormValue(
		 *   z.object({
		 *     // ...
		 *   })
		 * );
		 * ```
		 */
		coerceFormValue<Schema extends ZodTypeAny>(
			type: Schema,
		): ZodType<output<Schema>, ZodTypeDef, input<Schema>> {
			let result = validationCache.get(type);

			if (!result) {
				result = coerceType(type, {
					resolved: new Map<ZodTypeAny, ZodTypeAny>(),
					stripEmptyValue(value) {
						return coerceFile(coerceString(value, stripEmptyString));
					},
					coerce(type) {
						return coerce(type, validationMap);
					},
				});
				validationCache.set(type, result);
			}

			return result as ZodType<output<Schema>, ZodTypeDef, input<Schema>>;
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
		coerceStructure<Schema extends ZodTypeAny>(
			type: Schema,
		): ZodType<input<Schema>, ZodTypeDef, input<Schema>> {
			let result = structureCache.get(type);

			if (!result) {
				result = coerceType(type, {
					resolved: new Map<ZodTypeAny, ZodTypeAny>(),
					coerce(type) {
						return coerce(type, structuralMap);
					},
					skipValidation: true,
					skipDefaults: true,
					skipTransforms: true,
				});
				structureCache.set(type, result);
			}

			return result as ZodType<input<Schema>, ZodTypeDef, input<Schema>>;
		},
	};
}

export const { coerceFormValue, coerceStructure } = configureCoercion();
