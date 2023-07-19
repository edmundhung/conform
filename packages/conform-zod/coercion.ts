import {
	type ZodType,
	ZodString,
	ZodEnum,
	ZodLiteral,
	ZodNumber,
	ZodBoolean,
	ZodDate,
	ZodArray,
	ZodObject,
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
	preprocess,
	ZodBigInt,
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
	if (file instanceof File && file.name === '' && file.size === 0) {
		return undefined;
	}

	return file;
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
export function enhanceSchema<Type>(schema: ZodType<Type>): ZodType<Type> {
	/**
	 * We might be able to fix all type errors with function overloads
	 * But I'm not sure if it's worth the effort
	 */
	if (
		schema instanceof ZodString ||
		schema instanceof ZodEnum ||
		schema instanceof ZodLiteral
	) {
		// @ts-expect-error see message above
		return preprocess((value) => coerceString(value), schema);
	} else if (schema instanceof ZodNumber) {
		// @ts-expect-error see message above
		return preprocess((value) => coerceString(value, Number), schema);
	} else if (schema instanceof ZodBoolean) {
		// @ts-expect-error see message above
		return preprocess((value) => coerceString(value, Boolean), schema);
	} else if (schema instanceof ZodDate) {
		// @ts-expect-error see message above
		return preprocess(
			(value) =>
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
			schema,
		);
	} else if (schema instanceof ZodBigInt) {
		// @ts-expect-error see message above
		return preprocess((value) => coerceString(value, BigInt), schema);
	} else if (schema instanceof ZodArray) {
		// @ts-expect-error see message above
		return preprocess(
			(value) => {
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
			},
			new ZodArray({
				...schema._def,
				type: enhanceSchema(schema.element),
			}),
		);
	} else if (schema instanceof ZodObject) {
		const shape = Object.fromEntries(
			Object.entries(schema.shape).map(([key, def]) => [
				key,
				// @ts-expect-error see message above
				enhanceSchema(def),
			]),
		);
		return new ZodObject({
			...schema._def,
			shape: () => shape,
		});
	} else if (schema instanceof ZodIntersection) {
		// @ts-expect-error see message above
		return new ZodIntersection({
			...schema._def,
			left: enhanceSchema(schema._def.left),
			right: enhanceSchema(schema._def.right),
		});
	} else if (schema instanceof ZodUnion) {
		return new ZodUnion({
			...schema._def,
			options: schema.options.map(enhanceSchema),
		});
	} else if (schema instanceof ZodDiscriminatedUnion) {
		return new ZodDiscriminatedUnion({
			...schema._def,
			options: schema.options.map(enhanceSchema),
		});
	} else if (schema instanceof ZodTuple) {
		// @ts-expect-error see message above
		return new ZodTuple({
			...schema._def,
			items: schema.items.map(enhanceSchema),
		});
	} else if (schema instanceof ZodNullable) {
		// @ts-expect-error see message above
		return new ZodNullable({
			...schema._def,
			innerType: enhanceSchema(schema.unwrap()),
		});
	} else if (schema instanceof ZodPipeline) {
		// @ts-expect-error see message above
		return new ZodPipeline({
			...schema._def,
			in: enhanceSchema(schema._def.in),
		});
	} else if (schema instanceof ZodEffects) {
		// A file schema is usually defined as `instanceOf(File)`
		// which is implemented based on ZodAny with `superRefine`
		// You can check the `instanceOfType` function on zod for more info
		if (
			schema._def.effect.type === 'refinement' &&
			schema.innerType() instanceof ZodAny
		) {
			// @ts-expect-error see message above
			return preprocess((value) => coerceFile(value), schema);
		}

		return new ZodEffects({
			...schema._def,
			schema: enhanceSchema(schema.innerType()),
		});
	} else if (schema instanceof ZodOptional) {
		// @ts-expect-error see message above
		return new ZodOptional({
			...schema._def,
			innerType: enhanceSchema(schema.unwrap()),
		});
	} else if (schema instanceof ZodDefault) {
		// @ts-expect-error see message above
		return new ZodDefault({
			...schema._def,
			innerType: enhanceSchema(schema.removeDefault()),
		});
	}

	return schema;
}
