import type { ZodType } from 'zod/v4';
import type { ZodMiniType } from 'zod/v4/mini';
import type { ValidationAttributes } from '@conform-to/dom/future';
import { getZodConstraint } from './constraint';

/**
 * Type guard to check if a value is a Zod v4 schema.
 */
export function isSchema(schema: unknown): schema is ZodType | ZodMiniType {
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
 * Extracts HTML validation attributes from a Zod v4 schema.
 */
export function getConstraints(
	schema: unknown,
): Record<string, ValidationAttributes> | undefined {
	if (!isSchema(schema)) {
		return undefined;
	}

	return getZodConstraint(schema);
}
