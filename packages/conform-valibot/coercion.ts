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

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
export function coerceString(
	value: unknown,
	transform?: (text: string) => unknown,
) {
	if (typeof value !== 'string') {
		return value;
	}

	if (value === '') {
		return undefined;
	}

	if (typeof transform !== 'function') {
		return value;
	}

	try {
		return transform(value);
	} catch {
		return undefined;
	}
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 * @param type The schema to be coerced
 * @param transform The transformation function
 * @returns The transform action and the coerced schema
 */
function coerce<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	transform?: (text: string) => unknown,
) {
	// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
	const unknown = { ...valibotUnknown(), expects: type.expects };
	const transformAction = vTransform((output: unknown) =>
		type.type === 'blob' || type.type === 'file'
			? coerceFile(output)
			: coerceString(output, transform),
	);
	const schema = type.async
		? pipeAsync(unknown, transformAction, type)
		: pipe(unknown, transformAction, type);

	return { transformAction, schema };
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
			typeof coerceFile(coerceString(output)) === 'undefined'
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
 * Generate a wrapped schema with coercion
 * @param type The schema to be coerced
 * @param rewrap Whether the result schema should be rewrapped with the `type` schema.
 *   See <https://github.com/chimame/conform-to-valibot/issues/53> for cases that need rewrapping.
 * @returns The coerced schema
 */
function generateWrappedSchema<T extends GenericSchema | GenericSchemaAsync>(
	type: T,
	rewrap = false,
) {
	const { transformAction, schema: wrapSchema } = enableTypeCoercion(
		// @ts-expect-error
		type.wrapped,
	);

	if (transformAction) {
		// `expects` is required to generate error messages for `TupleSchema`, so it is passed to `UnkonwSchema` for coercion.
		const unknown = { ...valibotUnknown(), expects: type.expects };
		const schema = type.async
			? pipeAsync(unknown, transformAction, type)
			: pipe(unknown, transformAction, type);

		const default_ = 'default' in type ? type.default : undefined;
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

	return {
		transformAction: undefined,
		schema: wrappedSchema,
	};
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<
	T extends GenericSchema | GenericSchemaAsync,
>(
	type: T,
): {
	transformAction: TransformAction<unknown, unknown> | undefined;
	// If we use just `T` for type of `schema`, `enabltTypeCoercion<GenericSchema<string, string>>` will return
	// `GenericSchema<string, string>`. However, we want it to return `GenericSchema<unknown, string>`.
	schema: T extends GenericSchema<unknown, infer Output, infer Issue>
		? GenericSchema<unknown, Output, Issue>
		: T extends GenericSchemaAsync<unknown, infer OutputAsync, infer IssueAsync>
			? GenericSchemaAsync<unknown, OutputAsync, IssueAsync>
			: never;
};
export function enableTypeCoercion<
	T extends GenericSchema | GenericSchemaAsync,
>(
	type:
		| T
		| (T extends GenericSchema
				? SchemaWithPipe<
						[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
					>
				: SchemaWithPipeAsync<
						[T, ...PipeItem<unknown, unknown, BaseIssue<unknown>>[]]
					>),
): {
	transformAction: TransformAction<unknown, unknown> | undefined;
	schema: GenericSchema | GenericSchemaAsync;
} {
	if ('pipe' in type) {
		const { transformAction, schema: coercedSchema } = enableTypeCoercion(
			type.pipe[0],
		);
		const schema = type.async
			? pipeAsync(coercedSchema, ...type.pipe.slice(1))
			: // @ts-expect-error `coercedSchema` must be sync here but TypeScript can't infer that.
				pipe(coercedSchema, ...type.pipe.slice(1));

		return { transformAction, schema };
	}

	switch (type.type) {
		case 'string':
		case 'literal':
		case 'enum':
		case 'undefined': {
			return coerce(type);
		}
		case 'number': {
			return coerce(type, Number);
		}
		case 'boolean': {
			return coerce(type, (text) => (text === 'on' ? true : text));
		}
		case 'date': {
			return coerce(type, (timestamp) => {
				const date = new Date(timestamp);
				if (Number.isNaN(date.getTime())) {
					return timestamp;
				}

				return date;
			});
		}
		case 'bigint': {
			return coerce(type, BigInt);
		}
		case 'file':
		case 'blob': {
			return coerce(type);
		}
		case 'array': {
			const arraySchema = {
				...type,
				// @ts-expect-error
				item: enableTypeCoercion(type.item).schema,
			};
			return {
				transformAction: undefined,
				schema: coerceArray(arraySchema),
			};
		}
		case 'exact_optional': {
			// @ts-expect-error
			const { schema: wrapSchema } = enableTypeCoercion(type.wrapped);

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
			return generateWrappedSchema(type, true);
		}
		case 'undefinedable':
		case 'nullable':
		case 'non_optional':
		case 'non_nullish':
		case 'non_nullable': {
			return generateWrappedSchema(type);
		}
		case 'union':
		case 'intersect': {
			const unionSchema = {
				...type,
				// @ts-expect-error
				options: type.options.map(
					// @ts-expect-error
					(option) => enableTypeCoercion(option as GenericSchema).schema,
				),
			};
			return {
				transformAction: undefined,
				schema: unionSchema,
			};
		}
		case 'variant': {
			const variantSchema = {
				...type,
				// @ts-expect-error
				options: type.options.map(
					// @ts-expect-error
					(option) => enableTypeCoercion(option as GenericSchema).schema,
				),
			};
			return {
				transformAction: undefined,
				schema: variantSchema,
			};
		}
		case 'tuple': {
			const tupleSchema = {
				...type,
				// @ts-expect-error
				items: type.items.map(
					// @ts-expect-error
					(option) => enableTypeCoercion(option).schema,
				),
			};
			return {
				transformAction: undefined,
				schema: tupleSchema,
			};
		}
		case 'tuple_with_rest': {
			const tupleWithRestSchema = {
				...type,
				// @ts-expect-error
				items: type.items.map(
					// @ts-expect-error
					(option) => enableTypeCoercion(option).schema,
				),
				// @ts-expect-error
				rest: enableTypeCoercion(type.rest).schema,
			};
			return {
				transformAction: undefined,
				schema: tupleWithRestSchema,
			};
		}
		case 'loose_object':
		case 'strict_object':
		case 'object': {
			const objectSchema = {
				...type,
				entries: Object.fromEntries(
					// @ts-expect-error
					Object.entries(type.entries).map(([key, def]) => [
						key,
						enableTypeCoercion(def as GenericSchema).schema,
					]),
				),
			};

			return {
				transformAction: undefined,
				schema: objectSchema,
			};
		}
		case 'object_with_rest': {
			const objectWithRestSchema = {
				...type,
				entries: Object.fromEntries(
					// @ts-expect-error
					Object.entries(type.entries).map(([key, def]) => [
						key,
						enableTypeCoercion(def as GenericSchema).schema,
					]),
				),
				// @ts-expect-error
				rest: enableTypeCoercion(type.rest).schema,
			};

			return {
				transformAction: undefined,
				schema: objectWithRestSchema,
			};
		}
	}

	return coerce(type);
}
