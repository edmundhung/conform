import type { ZodAny, output } from 'zod/v4';
import type {
	FormValue,
	FormError,
	ValidationAttributes,
} from '@conform-to/dom/future';
import { getZodConstraint } from './constraint';
import { formatResult } from './format';

/**
 * Type guard to check if a value is a Zod v4 schema.
 */
export function isSchema(schema: unknown): schema is ZodAny {
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
 * Validates form data against a Zod v4 schema.
 *
 * @param schema - The Zod v4 schema to validate against
 * @param payload - The form data payload
 */
type ValidationResult<Value> =
	| { error: FormError<string> | null; value?: Value }
	| Promise<{ error: FormError<string> | null; value?: Value }>;

export function validateSchema<Schema extends ZodAny>(
	schema: Schema,
	payload: Record<string, FormValue>,
): ValidationResult<output<Schema>> {
	try {
		const promise = schema.safeParseAsync(payload);
		return promise.then((result) =>
			formatResult(result, { includeValue: true }),
		);
	} catch {
		const result = schema.safeParse(payload);
		return formatResult(result, { includeValue: true });
	}
}

/**
 * Extracts HTML validation attributes from a Zod v4 schema.
 */
export function getConstraints<Schema extends ZodAny>(
	schema: Schema,
): Record<string, ValidationAttributes> {
	return getZodConstraint(schema);
}

/**
 * @deprecated Use `getConstraints` instead.
 */
export { getZodConstraint };
