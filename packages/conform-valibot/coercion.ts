import {
	type BaseIssue,
	type GenericSchema,
	type GenericSchemaAsync,
	type PipeItem,
	type SchemaWithPipe,
	type SchemaWithPipeAsync,
	type TransformAction,
	pipe,
	pipeAsync,
	transform as vTransform,
	unknown as valibotUnknown,
} from 'valibot';

export type CoercionFunction = (value: unknown) => unknown;

export type DefaultCoercionType =
	| 'string'
	| 'file'
	| 'number'
	| 'boolean'
	| 'date'
	| 'bigint';

type EnableTypeCoercionOptions = {
	defaultCoercion: Record<DefaultCoercionType, CoercionFunction>;
	customize: (
		type: GenericSchema | GenericSchemaAsync,
	) => CoercionFunction | null;
};

const OBJECT_SCHEMA_TYPES: string[] = [
	'object',
	'loose_object',
	'strict_object',
	'object_with_rest',
];

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 * @param type The schema to be coerced
 * @param transform The transformation function
 * @returns The transform action and the coerced schema
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
 * Strip empty strings and convert them to undefined.
 *
 * @param value The value to be checked and coerced.
 * @returns The coerced value or undefined if the input is an empty string.
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
 * Strip empty files and convert them to undefined.
 *
 * @param file The file to be checked and coerced.
 * @returns The coerced value or undefined if the input is an empty file.
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
 * Helpers for coercing number value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function coerceNumber(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	return value.trim() === '' ? value : Number(value);
}

/**
 * Helpers for coercing boolean value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function coerceBoolean(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	return value === 'on' ? true : value;
}

/**
 * Helpers for coercing date value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function coerceDate(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date;
}

/**
 * Helpers for coercing bigint value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
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
 * Helpers for coercing array value
 * Modify the value only if it's an array, otherwise return the value as-is
 */
function coerceArray<T extends GenericSchema | GenericSchemaAsync>(type: T) {
	// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
	const unknown = { ...valibotUnknown(), expects: type.expects };
	const transformFunction = (output: unknown): unknown => {
		if (Array.isArray(output)) {
			return output;
		}

		if (
			typeof output === 'undefined' ||
			typeof stripEmptyFile(stripEmptyString(output)) === 'undefined'
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

/**
 * Compose two coercion functions
 * @param a The first coercion function
 * @param b The second coercion function
 * @returns The composed coercion function
 */
function compose(a: CoercionFunction, b: CoercionFunction): CoercionFunction {
	return (value) => b(a(value));
}

/**
 * Generate a piped schema with coercion
 * @param type The schema to be coerced
 * @param options The options for coercion
 * @returns The coerced schema
 */
function generatePipedSchema<T extends GenericSchema | GenericSchemaAsync>(
	type: T extends GenericSchema
		? SchemaWithPipe<[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]>
		: SchemaWithPipeAsync<
				[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
			>,
	options: EnableTypeCoercionOptions,
): {
	transformAction: TransformAction<unknown, unknown> | undefined;
	schema: GenericSchema | GenericSchemaAsync;
} {
	const { transformAction, schema: coercedSchema } =
		'pipe' in type.pipe[0]
			? // @ts-expect-error
				generatePipedSchema(type.pipe[0], options)
			: enableTypeCoercion(type.pipe[0], options);
	const schema = type.async
		? pipeAsync(coercedSchema, ...type.pipe.slice(1))
		: // @ts-expect-error `coercedSchema` must be sync here but TypeScript can't infer that.
			pipe(coercedSchema, ...type.pipe.slice(1));

	return { transformAction, schema };
}

/**
 * Generate a wrapped schema with coercion
 * @param type The schema to be coerced
 * @param options The options for coercion
 * @param rewrap Whether the result schema should be rewrapped with the `type` schema.
 *   See <https://github.com/chimame/conform-to-valibot/issues/53> for cases that need rewrapping.
 * @returns The coerced schema
 */
function generateWrappedSchema<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	options: EnableTypeCoercionOptions,
	rewrap = false,
) {
	const { transformAction, schema: wrapSchema } = enableTypeCoercion(
		// @ts-expect-error
		type.wrapped,
		options,
	);

	// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
	const unknown = { ...valibotUnknown(), expects: type.expects };
	const default_ = 'default' in type ? type.default : undefined;
	if (transformAction) {
		const schema = type.async
			? pipeAsync(unknown, transformAction, type)
			: pipe(unknown, transformAction, type);

		if (rewrap) {
			return {
				transformAction: undefined,
				schema: type.reference(schema, default_),
			};
		}

		return { transformAction, schema };
	}

	const wrappedSchema = {
		...type,
		wrapped: wrapSchema,
	};
	const transformActionForStripEmptyString = vTransform(stripEmptyString);
	const schema = wrappedSchema.async
		? pipeAsync(unknown, transformActionForStripEmptyString, wrappedSchema)
		: pipe(unknown, transformActionForStripEmptyString, wrappedSchema);

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
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
function enableTypeCoercion<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	options: EnableTypeCoercionOptions,
): {
	transformAction: TransformAction<unknown, unknown> | undefined;
	// If we use just `T` for type of `schema`, `enableTypeCoercion<GenericSchema<string, string>>` will return
	// `GenericSchema<string, string>`. However, we want it to return `GenericSchema<unknown, string>`.
	schema: T extends GenericSchema<unknown, infer Output, infer Issue>
		? GenericSchema<unknown, Output, Issue>
		: T extends GenericSchemaAsync<unknown, infer OutputAsync, infer IssueAsync>
			? GenericSchemaAsync<unknown, OutputAsync, IssueAsync>
			: never;
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
	const customizeFn = options.customize(type);

	if (customizeFn) {
		return coerce(type, customizeFn);
	}

	switch (type.type) {
		case 'string':
		case 'literal':
		case 'enum':
		case 'undefined': {
			return coerce(type, options.defaultCoercion.string);
		}
		case 'number': {
			return coerce(type, options.defaultCoercion.number);
		}
		case 'boolean': {
			return coerce(type, options.defaultCoercion.boolean);
		}
		case 'date': {
			return coerce(type, options.defaultCoercion.date);
		}
		case 'bigint': {
			return coerce(type, options.defaultCoercion.bigint);
		}
		case 'file':
		case 'blob': {
			return coerce(type, options.defaultCoercion.file);
		}
		case 'array': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			const arraySchema = {
				...type,
				// @ts-expect-error
				item: enableTypeCoercion(type.item, options).schema,
			};
			return {
				transformAction: undefined,
				schema: coerceArray(arraySchema),
			};
		}
		case 'exact_optional': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			// @ts-expect-error
			const { schema: wrapSchema } = enableTypeCoercion(type.wrapped, options);

			const exactOptionalSchema = {
				...type,
				wrapped: wrapSchema,
			};

			return {
				transformAction: undefined,
				schema: exactOptionalSchema,
			};
		}
		case 'nullish':
		case 'optional': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			return generateWrappedSchema(type, options, true);
		}
		case 'undefinedable':
		case 'nullable':
		case 'non_optional':
		case 'non_nullish':
		case 'non_nullable': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			return generateWrappedSchema(type, options);
		}
		case 'union':
		case 'intersect': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			const unionSchema = {
				...type,
				// @ts-expect-error
				options: type.options.map(
					// @ts-expect-error
					(option) =>
						enableTypeCoercion(option as GenericSchema, options).schema,
				),
			};
			return {
				transformAction: undefined,
				schema: unionSchema,
			};
		}
		case 'variant': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			const variantSchema = {
				...type,
				// @ts-expect-error
				options: type.options.map(
					// @ts-expect-error
					(option) => {
						// In the case of `object` schema, `pipe` like the following cannot be defined. Therefore, `enableTypeCoercion` cannot be executed, so only object property conversion is performed.
						// variant('type', [
						//   pipe(unknown(), transform(v => v), object({ type: literal('a'), a: string() })),
						//   object({ type: literal('b'), b: number() }),
						// ]);
						if (OBJECT_SCHEMA_TYPES.includes(option.type)) {
							return {
								...option,
								entries: Object.fromEntries(
									Object.entries(option.entries).map(([key, def]) => [
										key,
										enableTypeCoercion(def as GenericSchema, options).schema,
									]),
								),
								rest:
									'rest' in option
										? enableTypeCoercion(option.rest, options).schema
										: undefined,
							};
						}
						return enableTypeCoercion(option as GenericSchema, options).schema;
					},
				),
			};
			return {
				transformAction: undefined,
				schema: variantSchema,
			};
		}
		case 'tuple': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			const tupleSchema = {
				...type,
				// @ts-expect-error
				items: type.items.map(
					// @ts-expect-error
					(option) => enableTypeCoercion(option, options).schema,
				),
			};
			return {
				transformAction: undefined,
				schema: tupleSchema,
			};
		}
		case 'tuple_with_rest': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			const tupleWithRestSchema = {
				...type,
				// @ts-expect-error
				items: type.items.map(
					// @ts-expect-error
					(option) => enableTypeCoercion(option, options).schema,
				),
				// @ts-expect-error
				rest: enableTypeCoercion(type.rest, options).schema,
			};
			return {
				transformAction: undefined,
				schema: tupleWithRestSchema,
			};
		}
		case 'loose_object':
		case 'strict_object':
		case 'object_with_rest':
		case 'object': {
			if ('pipe' in type) {
				return generatePipedSchema(type, options);
			}

			const childObjectSchemaKeys: string[] = [];
			const objectSchema = {
				...type,
				entries: Object.fromEntries(
					// @ts-expect-error
					Object.entries(type.entries).map(
						// @ts-expect-error
						([key, def]: [string, GenericSchema]) => {
							if (OBJECT_SCHEMA_TYPES.includes(def.type)) {
								childObjectSchemaKeys.push(key);
							}
							return [key, enableTypeCoercion(def, options).schema];
						},
					),
				),
				// `object_with_rest` schema requires conversion of `rest` property
				rest:
					'rest' in type
						? // @ts-expect-error
							enableTypeCoercion(type.rest, options).schema
						: undefined,
			};
			return {
				schema: coerce(objectSchema, (value) => {
					const ret: { [key: string]: unknown } = (value ?? {}) as {
						[key: string]: unknown;
					};
					for (const key of childObjectSchemaKeys) {
						if (!(key in ret)) {
							ret[key] = {};
						}
					}

					return ret;
				}).schema,
				transformAction: undefined,
			};
		}
	}

	return coerce(type, (value) => value);
}

/**
 * A helper that enhance the valibot schema to strip empty value and coerce form value to the expected type with option to customize type coercion.
 * @example
 *
 * ```tsx
 * import { parseWithValibot, unstable_coerceFormValue as coerceFormValue } from '@conform-to/valibot';
 * import { object, number, date, boolean } from 'valibot';
 *
 * // To coerce the form value with default behaviour
 * const schema = coerceFormValue(
 *   object({
 *     ref: number(),
 *     date: date(),
 *     amount: number(),
 *     confirm: boolean(),
 *   })
 * );
 *
 * // To coerce the form value with number type disabled
 * const schema = coerceFormValue(
 *   object({
 *     ref: number(),
 *     date: date(),
 *     amount: number(),
 *     confirm: boolean(),
 *   }),
 *   {
 *     defaultCoercion: {
 *       number: false,
 *     },
 *     customize: (schema) => {
 *       if (schema.type === 'string') {
 *         return (value) => value.trim();
 *       }
 *       return null;
 *     },
 *   },
 * );
 * ```
 */
export function coerceFormValue<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	options?: {
		defaultCoercion?: {
			[key in DefaultCoercionType]?: CoercionFunction | boolean;
		};
		customize?: (
			type: GenericSchema | GenericSchemaAsync,
		) => CoercionFunction | null;
	},
): T extends GenericSchema ? GenericSchema : GenericSchemaAsync {
	return enableTypeCoercion(type, {
		defaultCoercion: {
			string: compose(
				stripEmptyString,
				getCoercion(options?.defaultCoercion?.string),
			),
			file: compose(
				stripEmptyFile,
				getCoercion(options?.defaultCoercion?.file),
			),
			number: compose(
				stripEmptyString,
				getCoercion(options?.defaultCoercion?.number, coerceNumber),
			),
			boolean: compose(
				stripEmptyString,
				getCoercion(options?.defaultCoercion?.boolean, coerceBoolean),
			),
			date: compose(
				stripEmptyString,
				getCoercion(options?.defaultCoercion?.date, coerceDate),
			),
			bigint: compose(
				stripEmptyString,
				getCoercion(options?.defaultCoercion?.bigint, coerceBigInt),
			),
		},
		customize: options?.customize ?? (() => null),
	}).schema;
}

/**
 * Get the coercion function from the provided coercion option
 * @param providedCoercion The provided coercion option
 * @param fallbackCoercion The fallback coercion function
 * @returns The coercion function
 */
const getCoercion = (
	providedCoercion: CoercionFunction | boolean | undefined,
	fallbackCoercion?: CoercionFunction,
): CoercionFunction => {
	if (typeof providedCoercion === 'function') {
		return providedCoercion;
	}

	// If the user explicitly disabled the coercion or no fallback coercion, return a noop function
	if (providedCoercion === false || fallbackCoercion === undefined) {
		return (value) => value;
	}

	return fallbackCoercion;
};
