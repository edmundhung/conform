import type { GenericSchema, GenericSchemaAsync } from 'valibot';
import type { ValidationAttributes } from '@conform-to/dom/future';
import { getValibotConstraint } from './constraint';

type ValibotSchema = GenericSchema | GenericSchemaAsync;

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
 * Extracts HTML validation attributes from a Valibot schema.
 */
export function getConstraints(
	schema: unknown,
): Record<string, ValidationAttributes> | undefined {
	if (!isSchema(schema)) {
		return undefined;
	}

	return getValibotConstraint(schema);
}

/**
 * @deprecated Use `getConstraints` instead.
 */
export { getValibotConstraint };
