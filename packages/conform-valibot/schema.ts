import type {
	GenericSchema,
	GenericSchemaAsync,
	InferOutput,
	Config,
} from 'valibot';
import { safeParse, safeParseAsync } from 'valibot';
import type {
	FormValue,
	FormError,
	ValidationAttributes,
} from '@conform-to/dom/future';
import { getValibotConstraint } from './constraint';
import { formatResult } from './format';

type ValibotSchema = GenericSchema | GenericSchemaAsync;

/**
 * Schema-specific options for Valibot validation.
 */
export type ValibotSchemaOptions = Config<any>;

/**
 * Type guard to check if a value is a Valibot schema.
 */
export function isSchema(schema: unknown): schema is ValibotSchema {
	return (
		typeof schema === 'object' &&
		schema !== null &&
		'~standard' in schema &&
		typeof schema['~standard'] === 'object' &&
		schema['~standard'] !== null &&
		'vendor' in schema['~standard'] &&
		schema['~standard'].vendor === 'valibot'
	);
}

/**
 * Validates form data against a Valibot schema.
 *
 * @param schema - The Valibot schema to validate against
 * @param payload - The form data payload
 * @param options - Optional Valibot-specific config options
 */
type ValidationResult<Value> =
	| { error: FormError<string> | null; value?: Value }
	| Promise<{ error: FormError<string> | null; value?: Value }>;

export function validateSchema<Schema extends ValibotSchema>(
	schema: Schema,
	payload: Record<string, FormValue>,
	options?: ValibotSchemaOptions,
): ValidationResult<InferOutput<Schema>> {
	if (schema.async === true) {
		return safeParseAsync(schema, payload, options).then((result) =>
			formatResult(result, { includeValue: true }),
		) as any;
	}

	const result = safeParse(schema, payload, options);
	return formatResult(result, { includeValue: true }) as any;
}

/**
 * Extracts HTML validation attributes from a Valibot schema.
 *
 * @param schema - The Valibot schema to extract constraints from
 */
export function getConstraint<Schema extends ValibotSchema>(
	schema: Schema,
): Record<string, ValidationAttributes> {
	return getValibotConstraint(schema);
}

/**
 * @deprecated Use `getConstraint` instead.
 */
export { getValibotConstraint };
