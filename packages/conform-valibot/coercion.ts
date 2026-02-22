import {
	type BaseIssue,
	type GenericSchema,
	type GenericSchemaAsync,
	type InferInput,
	type InferOutput,
	type PipeItem,
	type SchemaWithPipe,
	type SchemaWithPipeAsync,
	type TransformAction,
	check,
	object as valibotObject,
	pipe,
	pipeAsync,
	transform as vTransform,
	unknown as valibotUnknown,
} from 'valibot';

export type CoercionFunction = (value: unknown) => unknown;

type CoercionKey = 'string' | 'file' | 'number' | 'boolean' | 'date' | 'bigint';

const OBJECT_SCHEMA_TYPES: string[] = [
	'object',
	'loose_object',
	'strict_object',
	'object_with_rest',
];

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
 * On error returns the sentinel (e.g. NaN, false) so typeCheckSchema accepts it.
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
	type: GenericSchema | GenericSchemaAsync,
	defaultCoercion: Partial<Record<CoercionKey, CoercionFunction>>,
): CoercionFunction | undefined {
	switch (type.type) {
		case 'string':
		case 'enum':
		case 'picklist':
		case 'undefined': {
			return defaultCoercion.string;
		}
		case 'literal': {
			// @ts-expect-error: literal schema has `literal` property not in GenericSchema
			switch (typeof type.literal) {
				case 'number':
					return defaultCoercion.number;
				case 'boolean':
					return defaultCoercion.boolean;
				case 'bigint':
					return defaultCoercion.bigint;
			}
			return defaultCoercion.string;
		}
		case 'file':
		case 'blob': {
			return defaultCoercion.file;
		}
		case 'number': {
			return defaultCoercion.number;
		}
		case 'boolean': {
			return defaultCoercion.boolean;
		}
		case 'date': {
			return defaultCoercion.date;
		}
		case 'bigint': {
			return defaultCoercion.bigint;
		}
	}
}

/**
 * Constrained types (enum, literal, picklist) should still be validated in
 * structural mode because their values come from constrained UI (select, radio,
 * hidden input) and an invalid value indicates a developer error.
 */
function isConstrainedType(type: GenericSchema | GenericSchemaAsync): boolean {
	return (
		type.type === 'enum' || type.type === 'literal' || type.type === 'picklist'
	);
}

/**
 * Accepts sentinel values like NaN and Invalid Date since
 * `typeof NaN === 'number'` and `Invalid Date instanceof Date`.
 */
function createTypeCheckSchema(expectedType: string): GenericSchema {
	const requirement =
		expectedType === 'date'
			? (value: unknown) => value instanceof Date
			: (value: unknown) => typeof value === expectedType;

	return pipe(
		valibotUnknown(),
		check(
			requirement,
			`Invalid input: expected ${expectedType}, received unknown`,
		),
	);
}

function getTypeCheckTarget(
	type: GenericSchema | GenericSchemaAsync,
): GenericSchema | GenericSchemaAsync {
	switch (type.type) {
		case 'string':
			return createTypeCheckSchema('string');
		case 'number':
			return createTypeCheckSchema('number');
		case 'boolean':
			return createTypeCheckSchema('boolean');
		case 'date':
			return createTypeCheckSchema('date');
		case 'bigint':
			return createTypeCheckSchema('bigint');
		default:
			return type;
	}
}

/**
 * Wrap a schema with pipe(unknown, transform, schema) for coercion.
 * Returns both the transform action (for propagation through wrappers)
 * and the composed schema.
 */
function coerce<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	transformFn: CoercionFunction,
) {
	// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnknownSchema` for coercion.
	const unknown = { ...valibotUnknown(), expects: type.expects };
	const transformAction = vTransform(transformFn);
	const schema = type.async
		? pipeAsync(unknown, transformAction, type)
		: pipe(unknown, transformAction, type);

	return { transformAction, schema };
}

/**
 * Wrap a schema in array coercion: single values → [value], undefined/empty → [].
 */
function coerceArray<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	stripEmptyValue?: CoercionFunction,
) {
	// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnknownSchema` for coercion.
	const unknown = { ...valibotUnknown(), expects: type.expects };
	const transformFunction = (output: unknown): unknown => {
		if (Array.isArray(output)) {
			return output;
		}

		if (
			typeof output === 'undefined' ||
			(stripEmptyValue && typeof stripEmptyValue(output) === 'undefined')
		) {
			return [];
		}

		return [output];
	};

	if (type.async) {
		return pipeAsync(unknown, vTransform(transformFunction), type);
	}

	return pipe(unknown, vTransform(transformFunction), type);
}

type EnableTypeCoercionOptions = {
	/** Map of original schema to its coerced version. Prevents re-processing and infinite recursion from v.lazy(). */
	resolved: Map<
		GenericSchema | GenericSchemaAsync,
		GenericSchema | GenericSchemaAsync
	>;
	/** Returns a coercion function for the given schema type, or null to skip. */
	coerce: (type: GenericSchema | GenericSchemaAsync) => CoercionFunction | null;
	/** Strip function for optional/default/array. `undefined` = no stripping. */
	stripEmptyValue?: CoercionFunction;
	/** Whether to replace the original schema with a type check for non-constrained leaves. */
	skipValidation?: boolean;
	/** Whether to skip default wrappers (recurse into inner). */
	skipDefaults?: boolean;
	/** Whether to skip transforms in pipe actions. */
	skipTransforms?: boolean;
};

/**
 * Generate a wrapped schema with coercion for wrapper types
 * (optional, nullable, nullish, undefinedable, non_optional, etc.).
 *
 * @param rewrap Whether the result schema should be rewrapped with the `type` schema.
 *   See <https://github.com/chimame/conform-to-valibot/issues/53> for cases that need rewrapping.
 */
function generateWrappedSchema<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	options: EnableTypeCoercionOptions,
	rewrap = false,
) {
	const { transformAction, schema: wrapSchema } = enableTypeCoercion(
		// @ts-expect-error: wrapper types have `wrapped` property
		type.wrapped,
		options,
	);

	// Structural mode: no stripping, skip defaults
	if (!options.stripEmptyValue) {
		const wrappedSchema = { ...type, wrapped: wrapSchema };
		if (rewrap) {
			// Re-create wrapper without default
			return {
				transformAction: undefined,
				schema: type.reference(wrappedSchema),
			};
		}
		return { transformAction: undefined, schema: wrappedSchema };
	}

	// Validation mode
	// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnknownSchema` for coercion.
	const unknown = { ...valibotUnknown(), expects: type.expects };
	const default_ = 'default' in type ? type.default : undefined;
	const wrappedSchema = { ...type, wrapped: wrapSchema };

	if (transformAction) {
		const schema = wrappedSchema.async
			? pipeAsync(unknown, transformAction, wrappedSchema)
			: pipe(unknown, transformAction, wrappedSchema);

		if (rewrap) {
			return {
				transformAction: undefined,
				schema: type.reference(schema, default_),
			};
		}

		return { transformAction, schema };
	}

	const stripTransform = vTransform(options.stripEmptyValue);
	const schema = wrappedSchema.async
		? pipeAsync(unknown, stripTransform, wrappedSchema)
		: pipe(unknown, stripTransform, wrappedSchema);

	if (rewrap) {
		return {
			transformAction: undefined,
			schema: type.reference(schema, default_),
		};
	}

	return {
		transformAction: undefined,
		schema,
	};
}

/**
 * Reconstruct the provided schema with additional preprocessing steps.
 * Coerces empty values to undefined and transforms strings to the correct type.
 */
function enableTypeCoercion<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	options: EnableTypeCoercionOptions,
): {
	transformAction: TransformAction<unknown, unknown> | undefined;
	schema: T;
};
function enableTypeCoercion<T extends GenericSchema | GenericSchemaAsync>(
	type:
		| T
		| (T extends GenericSchema
				? SchemaWithPipe<
						[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
					>
				: SchemaWithPipeAsync<
						[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
					>),
	options: EnableTypeCoercionOptions,
): {
	transformAction: TransformAction<unknown, unknown> | undefined;
	schema: GenericSchema | GenericSchemaAsync;
} {
	const cached = options.resolved.get(type);
	if (cached) {
		return { transformAction: undefined, schema: cached };
	}

	if ('pipe' in type) {
		if (options.skipTransforms) {
			// Structural mode: skip pipe actions (validations, transforms, refinements)
			return enableTypeCoercion(type.pipe[0], options);
		}

		const { transformAction, schema: coercedSchema } = enableTypeCoercion(
			type.pipe[0],
			options,
		);

		if (transformAction) {
			// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnknownSchema` for coercion.
			const unknown = { ...valibotUnknown(), expects: type.expects };
			// Reuse `type` to preserve behavior added by Valibot `config` and/or `fallback` methods.
			const schema = type.async
				? pipeAsync(unknown, transformAction, type)
				: pipe(unknown, transformAction, type);

			return { transformAction, schema };
		}

		const schema = type.async
			? pipeAsync(coercedSchema, ...type.pipe.slice(1))
			: // @ts-expect-error: `coercedSchema` must be sync here but TypeScript can't infer that.
				pipe(coercedSchema, ...type.pipe.slice(1));

		return { transformAction, schema };
	}

	const coercion = options.coerce(type);
	const target =
		options.skipValidation && !isConstrainedType(type)
			? getTypeCheckTarget(type)
			: type;

	if (coercion) {
		const result = coerce(target, coercion);
		if (type !== result.schema) {
			options.resolved.set(type, result.schema);
		}
		return result;
	}

	if (target !== type) {
		options.resolved.set(type, target);
		return { transformAction: undefined, schema: target };
	}

	let schema: GenericSchema | GenericSchemaAsync = type;

	switch (type.type) {
		case 'array': {
			const arraySchema = {
				...type,
				// @ts-expect-error: array schema has `item` property
				item: enableTypeCoercion(type.item, options).schema,
			};
			schema = coerceArray(arraySchema, options.stripEmptyValue);
			break;
		}
		case 'exact_optional': {
			const { schema: wrapSchema } = enableTypeCoercion(
				// @ts-expect-error: exact_optional schema has `wrapped` property
				type.wrapped,
				options,
			);

			schema = {
				...type,
				wrapped: wrapSchema,
			} as typeof type;
			break;
		}
		case 'nullish':
		case 'optional': {
			const result = generateWrappedSchema(type, options, true);
			schema = result.schema;
			break;
		}
		case 'undefinedable':
		case 'nullable':
		case 'non_optional':
		case 'non_nullish':
		case 'non_nullable': {
			const result = generateWrappedSchema(type, options);
			schema = result.schema;
			break;
		}
		case 'union':
		case 'intersect': {
			schema = {
				...type,
				// @ts-expect-error: union/intersect schema has `options` property
				options: type.options.map(
					(option: GenericSchema) => enableTypeCoercion(option, options).schema,
				),
			};
			break;
		}
		case 'variant': {
			schema = {
				...type,
				// @ts-expect-error: variant schema has `options` property
				options: type.options.map((option: GenericSchema) => {
					// Object schemas in variant can't be piped, so only convert entries
					if (OBJECT_SCHEMA_TYPES.includes(option.type)) {
						const coercedEntries = Object.fromEntries(
							Object.entries(
								// @ts-expect-error: object schema has `entries` property
								option.entries as Record<string, GenericSchema>,
							).map(([key, def]) => [
								key,
								enableTypeCoercion(def, options).schema,
							]),
						);

						if (options.skipValidation && option.type === 'strict_object') {
							return valibotObject(coercedEntries);
						}

						return {
							...option,
							entries: coercedEntries,
							rest:
								'rest' in option
									? enableTypeCoercion(option.rest as GenericSchema, options)
											.schema
									: undefined,
						};
					}
					return enableTypeCoercion(option, options).schema;
				}),
			};
			break;
		}
		case 'tuple': {
			schema = {
				...type,
				// @ts-expect-error: tuple schema has `items` property
				items: type.items.map(
					(option: GenericSchema) => enableTypeCoercion(option, options).schema,
				),
			};
			break;
		}
		case 'tuple_with_rest': {
			schema = {
				...type,
				// @ts-expect-error: tuple_with_rest schema has `items` property
				items: type.items.map(
					(option: GenericSchema) => enableTypeCoercion(option, options).schema,
				),
				// @ts-expect-error: tuple_with_rest schema has `rest` property
				rest: enableTypeCoercion(type.rest, options).schema,
			};
			break;
		}
		case 'loose_object':
		case 'strict_object':
		case 'object_with_rest':
		case 'object': {
			const prefillKeys: string[] = [];
			const coercedEntries = Object.fromEntries(
				// @ts-expect-error: object schema has `entries` property
				Object.entries(type.entries).map(
					// @ts-expect-error: entry type is [string, GenericSchema]
					([key, def]: [string, GenericSchema]) => {
						if (
							OBJECT_SCHEMA_TYPES.includes(def.type) ||
							def.type === 'array'
						) {
							prefillKeys.push(key);
						}
						return [key, enableTypeCoercion(def, options).schema];
					},
				),
			);
			const objectSchema =
				options.skipValidation && type.type === 'strict_object'
					? valibotObject(coercedEntries)
					: {
							...type,
							entries: coercedEntries,
							// `object_with_rest` schema requires conversion of `rest` property
							rest:
								'rest' in type
									? // @ts-expect-error: object_with_rest schema has `rest` property
										enableTypeCoercion(type.rest, options).schema
									: undefined,
						};
			schema = coerce(objectSchema, (value) => {
				const ret: { [key: string]: unknown } = (value ?? {}) as {
					[key: string]: unknown;
				};
				for (const key of prefillKeys) {
					if (!(key in ret)) {
						ret[key] = undefined;
					}
				}

				return ret;
			}).schema;
			break;
		}
		case 'lazy': {
			// @ts-expect-error: lazy schema has `getter` property
			const getter = type.getter;
			schema = type.reference((input: unknown) => {
				return enableTypeCoercion(getter(input), options).schema;
			});
			break;
		}
	}

	if (type !== schema) {
		options.resolved.set(type, schema);
	}

	return { transformAction: undefined, schema };
}

/**
 * Creates configured coercion functions for form value parsing.
 *
 * @example
 *
 * ```tsx
 * import { configureCoercion } from '@conform-to/valibot/future';
 * import * as v from 'valibot';
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
 * const schema = v.object({ age: v.number(), name: v.string() });
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
	customize?: (
		type: GenericSchema | GenericSchemaAsync,
	) => ((value: unknown) => unknown) | null;
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

	const selectCoerce = (
		type: GenericSchema | GenericSchemaAsync,
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

	const validationCache = new WeakMap<
		GenericSchema | GenericSchemaAsync,
		GenericSchema | GenericSchemaAsync
	>();
	const structureCache = new WeakMap<
		GenericSchema | GenericSchemaAsync,
		GenericSchema | GenericSchemaAsync
	>();

	return {
		/**
		 * A helper that enhances the valibot schema to strip empty values and
		 * coerce form values to the expected type.
		 *
		 * @example
		 *
		 * ```tsx
		 * import { coerceFormValue } from '@conform-to/valibot/future';
		 * import * as v from 'valibot';
		 *
		 * const schema = coerceFormValue(
		 *   v.object({
		 *     // ...
		 *   })
		 * );
		 * ```
		 */
		coerceFormValue<Schema extends GenericSchema | GenericSchemaAsync>(
			type: Schema,
		): Schema extends GenericSchemaAsync
			? GenericSchemaAsync<InferInput<Schema>, InferOutput<Schema>>
			: GenericSchema<InferInput<Schema>, InferOutput<Schema>> {
			let result = validationCache.get(type);

			if (!result) {
				result = enableTypeCoercion(type, {
					resolved: new Map(),
					stripEmptyValue(value) {
						return coerceFile(coerceString(value, stripEmptyString));
					},
					coerce(type) {
						return selectCoerce(type, validationMap);
					},
				}).schema;
				validationCache.set(type, result);
			}

			return result as Schema extends GenericSchemaAsync
				? GenericSchemaAsync<InferInput<Schema>, InferOutput<Schema>>
				: GenericSchema<InferInput<Schema>, InferOutput<Schema>>;
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
		coerceStructure<Schema extends GenericSchema | GenericSchemaAsync>(
			type: Schema,
		): Schema extends GenericSchemaAsync
			? GenericSchemaAsync<
					InferInput<Schema>,
					InferInput<Schema>,
					BaseIssue<unknown>
				>
			: GenericSchema<
					InferInput<Schema>,
					InferInput<Schema>,
					BaseIssue<unknown>
				> {
			let result = structureCache.get(type);

			if (!result) {
				result = enableTypeCoercion(type, {
					resolved: new Map(),
					coerce(type) {
						return selectCoerce(type, structuralMap);
					},
					skipValidation: true,
					skipDefaults: true,
					skipTransforms: true,
				}).schema;
				structureCache.set(type, result);
			}

			return result as Schema extends GenericSchemaAsync
				? GenericSchemaAsync<
						InferInput<Schema>,
						InferInput<Schema>,
						BaseIssue<unknown>
					>
				: GenericSchema<
						InferInput<Schema>,
						InferInput<Schema>,
						BaseIssue<unknown>
					>;
		},
	};
}

export const { coerceFormValue, coerceStructure } = configureCoercion();
