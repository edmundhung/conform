import type { FormError } from '@conform-to/dom/future';
import type { StandardSchemaV1 } from './standard-schema';

/**
 * Resolves a StandardSchema validation result to conform's format.
 */
function resolveStandardSchemaResult<Value>(
	result: StandardSchemaV1.Result<Value>,
): { error: FormError<string> | null; value?: Value } {
	if (!result.issues) {
		return { error: null, value: result.value };
	}

	const error: FormError<string> = { formErrors: [], fieldErrors: {} };

	for (const issue of result.issues) {
		const name = issue.path
			?.map((item) => (typeof item === 'object' ? item.key : item))
			.join('.');

		if (name) {
			error.fieldErrors[name] ??= [];
			error.fieldErrors[name].push(issue.message);
		} else {
			error.formErrors.push(issue.message);
		}
	}

	return { error };
}

/**
 * Default schema configuration using StandardSchema.
 * This is used when no specific schema library is configured.
 *
 * @example
 * ```ts
 * import { configureForms, standardSchema } from '@conform-to/react/future';
 *
 * const { useForm } = configureForms({
 *   schemas: [standardSchema],
 * });
 * ```
 */
export const standardSchema = {
	isSchema: (schema: unknown): schema is StandardSchemaV1 =>
		schema != null && typeof schema === 'object' && '~standard' in schema,
	validateSchema: <Schema extends StandardSchemaV1>(
		schema: Schema,
		payload: Record<string, unknown>,
	) => {
		const result = schema['~standard'].validate(payload);

		if (result instanceof Promise) {
			return result.then((actualResult) =>
				resolveStandardSchemaResult(actualResult),
			) as any;
		}

		return resolveStandardSchemaResult(result) as any;
	},
};
