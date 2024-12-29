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
	SafeParseReturnType,
	ZodDiscriminatedUnionOption,
	ZodFirstPartySchemaTypes,
	ZodIssue,
	ZodTypeAny,
} from 'zod';
import { formatPaths } from './conform-dom';
import type { FormError } from './conform-dom';

/**
 * Helpers for coercing string value
 * Modify the value only if it's a string, otherwise return the value as-is
 */
function coerceString(value: unknown, transform?: (text: string) => unknown) {
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
 * A file schema is usually defined as `z.instanceof(File)`
 * which is implemented based on ZodAny with `superRefine`
 * Check the `instanceOfType` function on zod for more info
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
 * Reconstruct the provided zod schema with extra preprocessing logic for form data
 * Includes stripping empty string and automatic type coercion
 */
export function coerceZodFormData<Schema extends ZodTypeAny>(
	type: Schema,
	cache = new Map<ZodTypeAny, ZodTypeAny>(),
): Schema {
	const result = cache.get(type);

	// Returns the cached schema if it's already processed
	// To prevent infinite recursion caused by z.lazy()
	if (result) {
		return result as Schema;
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
					type: coerceZodFormData(def.type, cache),
				}),
			);
	} else if (def.typeName === 'ZodObject') {
		const shape = Object.fromEntries(
			Object.entries(def.shape()).map(([key, def]) => [
				key,
				// @ts-expect-error see message above
				coerceZodFormData(def, cache),
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
				schema: coerceZodFormData(def.schema, cache),
			});
		}
	} else if (def.typeName === 'ZodOptional') {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
				new ZodOptional({
					...def,
					innerType: coerceZodFormData(def.innerType, cache),
				}),
			);
	} else if (def.typeName === 'ZodDefault') {
		schema = any()
			.transform((value) => coerceFile(coerceString(value)))
			.pipe(
				new ZodDefault({
					...def,
					innerType: coerceZodFormData(def.innerType, cache),
				}),
			);
	} else if (def.typeName === 'ZodCatch') {
		schema = new ZodCatch({
			...def,
			innerType: coerceZodFormData(def.innerType, cache),
		});
	} else if (def.typeName === 'ZodIntersection') {
		schema = new ZodIntersection({
			...def,
			left: coerceZodFormData(def.left, cache),
			right: coerceZodFormData(def.right, cache),
		});
	} else if (def.typeName === 'ZodUnion') {
		schema = new ZodUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				coerceZodFormData(option, cache),
			),
		});
	} else if (def.typeName === 'ZodDiscriminatedUnion') {
		schema = new ZodDiscriminatedUnion({
			...def,
			options: def.options.map((option: ZodTypeAny) =>
				coerceZodFormData(option, cache),
			),
			optionsMap: new Map(
				Array.from(def.optionsMap.entries()).map(([discriminator, option]) => [
					discriminator,
					coerceZodFormData(option, cache) as ZodDiscriminatedUnionOption<any>,
				]),
			),
		});
	} else if (def.typeName === 'ZodTuple') {
		schema = new ZodTuple({
			...def,
			items: def.items.map((item: ZodTypeAny) =>
				coerceZodFormData(item, cache),
			),
		});
	} else if (def.typeName === 'ZodNullable') {
		schema = new ZodNullable({
			...def,
			innerType: coerceZodFormData(def.innerType, cache),
		});
	} else if (def.typeName === 'ZodPipeline') {
		schema = new ZodPipeline({
			...def,
			in: coerceZodFormData(def.in, cache),
			out: coerceZodFormData(def.out, cache),
		});
	} else if (def.typeName === 'ZodLazy') {
		const inner = def.getter();
		schema = lazy(() => coerceZodFormData(inner, cache));
	}

	if (type !== schema) {
		cache.set(type, schema);
	}

	return schema as Schema;
}

export function flattenZodError<Schema>(
	result: SafeParseReturnType<Schema, any>,
): FormError<Schema, string[]> | null;
export function flattenZodError<Schema, ErrorShape>(
	result: SafeParseReturnType<Schema, any>,
	formatIssue: (issue: ZodIssue) => ErrorShape,
): FormError<Schema, ErrorShape[]> | null;
export function flattenZodError<Schema, ErrorShape>(
	result: SafeParseReturnType<Schema, any>,
	formatIssue?: (issue: ZodIssue) => ErrorShape,
): FormError<Schema, Array<string | ErrorShape>> | null {
	if (result.success) {
		return null;
	}

	const { '': formError = null, ...fieldError } = result.error.issues.reduce<
		Record<string, Array<string | ErrorShape>>
	>((result, issue) => {
		const name = formatPaths(issue.path);
		const prevValue = result[name] ?? [];

		result[name] = prevValue.concat(formatIssue?.(issue) ?? issue.message);

		return result;
	}, {});

	return {
		formError,
		fieldError,
	};
}
