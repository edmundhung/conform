import type { ZodTypeAny, ZodErrorMap, output } from 'zod';
import type {
	FormValue,
	FormError,
	ValidationAttributes,
} from '@conform-to/dom/future';
import { getZodConstraint } from './constraint';
import { formatResult } from './format';

/**
 * Schema-specific options for Zod validation.
 */
export type ZodSchemaOptions = {
	/**
	 * Custom error map for Zod validation.
	 * @see https://zod.dev/ERROR_HANDLING?id=customizing-errors-with-zodissuecode
	 */
	errorMap?: ZodErrorMap;
};

/**
 * Type guard to check if a value is a Zod schema.
 */
export function isSchema(schema: unknown): schema is ZodTypeAny {
	return (
		typeof schema === 'object' &&
		schema !== null &&
		'~standard' in schema &&
		typeof schema['~standard'] === 'object' &&
		schema['~standard'] !== null &&
		'vendor' in schema['~standard'] &&
		schema['~standard'].vendor === 'zod'
	);
}

/**
 * Validates form data against a Zod schema.
 *
 * @param schema - The Zod schema to validate against
 * @param payload - The form data payload
 * @param options - Optional Zod-specific options (e.g., errorMap)
 */
type ValidationResult<Value> =
	| { error: FormError<string> | null; value?: Value }
	| Promise<{ error: FormError<string> | null; value?: Value }>;

export function validateSchema<Schema extends ZodTypeAny>(
	schema: Schema,
	payload: Record<string, FormValue>,
	options?: ZodSchemaOptions,
): ValidationResult<output<Schema>> {
	try {
		const promise = schema.safeParseAsync(payload, options);
		return promise.then((result) =>
			formatResult(result, { includeValue: true }),
		);
	} catch {
		const result = schema.safeParse(payload, options);
		return formatResult(result, { includeValue: true });
	}
}

/**
 * Extracts HTML validation attributes from a Zod schema.
 */
export function getConstraints<Schema extends ZodTypeAny>(
	schema: Schema,
): Record<string, ValidationAttributes> {
	return getZodConstraint(schema);
}

/**
 * @deprecated Use `getConstraints` instead.
 */
export { getZodConstraint };
