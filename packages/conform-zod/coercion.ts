import {
	type ZodType,
	type ZodTypeAny,
	type output,
	ZodString,
	ZodEnum,
	ZodLiteral,
	ZodNumber,
	ZodBoolean,
	ZodDate,
	ZodArray,
	ZodBigInt,
	ZodNativeEnum,
	ZodObject,
	ZodLazy,
	ZodIntersection,
	ZodUnion,
	ZodDiscriminatedUnion,
	ZodTuple,
	ZodPipeline,
	ZodEffects,
	ZodAny,
	ZodNullable,
	ZodOptional,
	ZodDefault,
	lazy,
	any,
	ZodCatch,
} from 'zod';

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

	return transform(value);
}

/**
 * Helpers for coercing file
 * Modify the value only if it's a file, otherwise return the value as-is
 */
export function coerceFile(file: unknown) {
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
 * A file schema is usually defined as `z.instanceof(File)`
 * which is implemented based on ZodAny with `superRefine`
 * Check the `instanceOfType` function on zod for more info
 */
export function isFileSchema(schema: ZodEffects<any, any, any>): boolean {
	if (typeof File === 'undefined') {
		return false;
	}

	return (
		schema._def.effect.type === 'refinement' &&
		schema.innerType() instanceof ZodAny &&
		schema.safeParse(new File([], '')).success &&
		!schema.safeParse('').success
	);
}

/**
 * @deprecated Conform coerce empty strings to undefined by default
 */
export function ifNonEmptyString(fn: (text: string) => unknown) {
	return (value: unknown) => coerceString(value, fn);
}

/**
 * Reconstruct the provided schema with additional preprocessing steps
 * This coerce empty values to undefined and transform strings to the correct type
 */
export function enableTypeCoercion<Schema extends ZodTypeAny>(
	type: Schema,
	cache = new Map<ZodTypeAny, ZodTypeAny>(),
): ZodType<output<Schema>> {
	const result = cache.get(type);

	// Return the cached schema if it's already processed
	// This is to prevent infinite recursion caused by z.lazy()
	if (result) {
		return result;
	}

	let schema: ZodTypeAny = type;

	if (
		type instanceof ZodString ||
		type instanceof ZodLiteral ||
		type instanceof ZodEnum ||
		type instanceof ZodNativeEnum
	) {
		schema = any()
			.transform((value) => coerceString(value))
			.pipe(type);
	} else if (type instanceof ZodNumber) {
		schema = any()
			.transform((value) =>
				coerceString(value, (text) =>
					text.trim() === '' ? Number.NaN : Number(text),
				),
			)
			.pipe(type);
	} else if (type instanceof ZodBoolean) {
		schema = any()
			.transform((value) =>
				coerceString(value, (text) => (text === 'on' ? true : text)),
			)
			.pipe(type);
	} else if (type instanceof ZodDate) {
		schema = any()
			.transform((value) =>
				coerceString(value, (timestamp) => {
					const date = new Date(timestamp);

					// z.date() does not expose a quick way to set invalid_date error
					// This gets around it by returning the original string if it's invalid
					// See https://github.com/colinhacks/zod/issues/1526
					if (isNaN(date.getTime())) {
						return timestamp;
					}

					return date;
				}),
			)
			.pipe(type);
	} else if (type instanceof ZodBigInt) {
		schema = any()
			.transform((value) => coerceString(value, BigInt))
			.pipe(type);
	} else if (type instanceof ZodArray) {
		schema = any()
			.transform((value) => {
				// No preprocess needed if the value is already an array
				if (Array.isArray(value)) {
					return value;
				}

				if (
					typeof value === 'undefined' ||
					typeof coerceFile(value) === 'undefined'
				) {
					return [];
				}

				// Wrap it in an array otherwise
				return [value];
			})
			.pipe(
				new ZodArray({
					...type._def,
					type: enableTypeCoercion(type.element, cache),
				}),
			);
	} else if (type instanceof ZodObject) {
		const shape = Object.fromEntries(
			Object.entries(type.shape).map(([key, def]) => [
				key,
				// @ts-expect-error see message above
				enableTypeCoercion(def, cache),
			]),
		);
		schema = new ZodObject({
			...type._def,
			shape: () => shape,
		});
	} else if (type instanceof ZodEffects) {
		if (isFileSchema(type)) {
			schema = any()
				.transform((value) => coerceFile(value))
				.pipe(type);
		} else {
			schema = new ZodEffects({
				...type._def,
				schema: enableTypeCoercion(type.innerType(), cache),
			});
		}
	} else if (type instanceof ZodOptional) {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
				new ZodOptional({
					...type._def,
					innerType: enableTypeCoercion(type.unwrap(), cache),
				}),
			);
	} else if (type instanceof ZodDefault) {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
				new ZodDefault({
					...type._def,
					innerType: enableTypeCoercion(type.removeDefault(), cache),
				}),
			);
	} else if (type instanceof ZodCatch) {
		schema = new ZodCatch({
			...type._def,
			innerType: enableTypeCoercion(type.removeCatch(), cache),
		});
	} else if (type instanceof ZodIntersection) {
		schema = new ZodIntersection({
			...type._def,
			left: enableTypeCoercion(type._def.left, cache),
			right: enableTypeCoercion(type._def.right, cache),
		});
	} else if (type instanceof ZodUnion) {
		schema = new ZodUnion({
			...type._def,
			options: type.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, cache),
			),
		});
	} else if (type instanceof ZodDiscriminatedUnion) {
		schema = new ZodDiscriminatedUnion({
			...type._def,
			options: type.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, cache),
			),
			optionsMap: new Map(
				Array.from(type.optionsMap.entries()).map(([discriminator, option]) => [
					discriminator,
					enableTypeCoercion(option, cache),
				]),
			),
		});
	} else if (type instanceof ZodTuple) {
		schema = new ZodTuple({
			...type._def,
			items: type.items.map((item: ZodTypeAny) =>
				enableTypeCoercion(item, cache),
			),
		});
	} else if (type instanceof ZodNullable) {
		schema = new ZodNullable({
			...type._def,
			innerType: enableTypeCoercion(type.unwrap(), cache),
		});
	} else if (type instanceof ZodPipeline) {
		schema = new ZodPipeline({
			...type._def,
			in: enableTypeCoercion(type._def.in, cache),
			out: enableTypeCoercion(type._def.out, cache),
		});
	} else if (type instanceof ZodLazy) {
		schema = lazy(() => enableTypeCoercion(type.schema, cache));
	}

	if (type !== schema) {
		cache.set(type, schema);
	}

	return schema;
}
