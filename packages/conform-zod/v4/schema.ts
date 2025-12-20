import { type ZodAny, type input, type output } from 'zod/v4';
import type { SchemaConfig } from '@conform-to/dom/future';
import { getZodConstraint } from './constraint';
import { formatResult } from './format';

/**
 * Zod v4 schema configuration for use with configureForms.
 * Provides Zod v4-specific type inference and validation.
 *
 * @example
 * ```ts
 * import { configureForms } from '@conform-to/react/future';
 * import { zodSchema } from '@conform-to/zod/v4/future';
 *
 * const { useForm } = configureForms({
 *   schemas: [zodSchema],
 * });
 * ```
 */
export const zodSchema: SchemaConfig<ZodAny> = {
	isSchema: (schema): schema is ZodAny =>
		schema != null &&
		typeof schema === 'object' &&
		'~standard' in schema &&
		typeof (schema as ZodAny).safeParse === 'function',
	validate(schema, payload) {
		try {
			const promise = schema.safeParseAsync(payload);
			return promise.then((result) =>
				formatResult(result, { includeValue: true }),
			);
		} catch {
			const result = schema.safeParse(payload);
			return formatResult(result, { includeValue: true });
		}
	},
	getConstraint(schema) {
		return getZodConstraint(schema);
	},
};

/**
 * Augment SchemaTypeRegistry to add Zod v4-specific type inference.
 */
declare module '@conform-to/dom/future' {
	interface SchemaTypeRegistry<Schema> {
		'zod/v4': {
			type: ZodAny;
			input: Schema extends ZodAny ? input<Schema> : never;
			output: Schema extends ZodAny ? output<Schema> : never;
			options: never;
		};
	}
}
