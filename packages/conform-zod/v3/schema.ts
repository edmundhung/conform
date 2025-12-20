import type { ZodType, ZodErrorMap, input, output } from 'zod';
import type { SchemaConfig } from '@conform-to/dom/future';
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
 * Zod schema configuration for use with configureForms.
 * Provides Zod-specific type inference and validation.
 *
 * @example
 * ```ts
 * import { configureForms } from '@conform-to/react/future';
 * import { zodSchema } from '@conform-to/zod/v3/future';
 *
 * const { useForm } = configureForms({
 *   schemas: [zodSchema],
 * });
 * ```
 */
export const zodSchema: SchemaConfig<ZodType> = {
	isSchema: (schema): schema is ZodType =>
		schema != null &&
		typeof schema === 'object' &&
		'_def' in schema &&
		typeof (schema as ZodType).safeParse === 'function',
	validate(schema, payload, options) {
		try {
			const promise = schema.safeParseAsync(payload, options);
			return promise.then((result) =>
				formatResult(result, { includeValue: true }),
			);
		} catch {
			const result = schema.safeParse(payload, options);
			return formatResult(result, { includeValue: true });
		}
	},
	getConstraint(schema) {
		return getZodConstraint(schema);
	},
};

/**
 * Augment SchemaTypeRegistry to add Zod-specific type inference.
 */
declare module '@conform-to/dom/future' {
	interface SchemaTypeRegistry<Schema> {
		'zod/v3': {
			type: ZodType;
			input: Schema extends ZodType ? input<Schema> : never;
			output: Schema extends ZodType ? output<Schema> : never;
			options: ZodSchemaOptions;
		};
	}
}
