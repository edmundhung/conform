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
} from 'zod';
import type {
	ZodDiscriminatedUnionOption,
	ZodFirstPartySchemaTypes,
	ZodType,
	ZodTypeAny,
	output,
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
	cache = new Map<ZodTypeAny, ZodTypeAny>(),
): ZodType<output<Schema>> {
	const result = cache.get(type);

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
					text.trim() === '' ? Number.NaN : Number(text),
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
	} else if (def.typeName === 'ZodBigInt') {
		schema = any()
			.transform((value) => coerceString(value, BigInt))
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
					type: enableTypeCoercion(def.type, cache),
				}),
			);
	} else if (def.typeName === 'ZodObject') {
		const shape = Object.fromEntries(
			Object.entries(def.shape()).map(([key, def]) => [
				key,
				// @ts-expect-error see message above
				enableTypeCoercion(def, cache),
			]),
		);
		schema = new ZodObject({
			...def,
			shape: () => shape,
		});
	} else if (def.typeName === 'ZodEffects') {
		if (isFileSchema(type as unknown as ZodEffects<any, any, any>)) {
			schema = any()
				.transform((value) => coerceFile(value))
				.pipe(type);
		} else {
			schema = new ZodEffects({
				...def,
				schema: enableTypeCoercion(def.schema, cache),
			});
		}
	} else if (def.typeName === 'ZodOptional') {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
				new ZodOptional({
					...def,
					innerType: enableTypeCoercion(def.innerType, cache),
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
					innerType: enableTypeCoercion(def.innerType, cache),
				}),
			);
	} else if (def.typeName === 'ZodCatch') {
		schema = new ZodCatch({
			...def,
			innerType: enableTypeCoercion(def.innerType, cache),
		});
	} else if (def.typeName === 'ZodIntersection') {
		schema = new ZodIntersection({
			...def,
			left: enableTypeCoercion(def.left, cache),
			right: enableTypeCoercion(def.right, cache),
		});
	} else if (def.typeName === 'ZodUnion') {
		schema = new ZodUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, cache),
			),
		});
	} else if (def.typeName === 'ZodDiscriminatedUnion') {
		schema = new ZodDiscriminatedUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				enableTypeCoercion(option, cache),
			),
			optionsMap: new Map(
				Array.from(def.optionsMap.entries()).map(([discriminator, option]) => [
					discriminator,
					enableTypeCoercion(option, cache) as ZodDiscriminatedUnionOption<any>,
				]),
			),
		});
	} else if (def.typeName === 'ZodTuple') {
		schema = new ZodTuple({
			...def,
			items: def.items.map((item: ZodTypeAny) =>
				enableTypeCoercion(item, cache),
			),
		});
	} else if (def.typeName === 'ZodNullable') {
		schema = new ZodNullable({
			...def,
			innerType: enableTypeCoercion(def.innerType, cache),
		});
	} else if (def.typeName === 'ZodPipeline') {
		schema = new ZodPipeline({
			...def,
			in: enableTypeCoercion(def.in, cache),
			out: enableTypeCoercion(def.out, cache),
		});
	} else if (def.typeName === 'ZodLazy') {
		const inner = def.getter();
		schema = lazy(() => enableTypeCoercion(inner, cache));
	}

	if (type !== schema) {
		cache.set(type, schema);
	}

	return schema;
}
