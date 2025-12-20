import { type ZodAny, type input, type output } from 'zod/v4';
import type { SchemaConfig } from '@conform-to/dom/future';
import { formatResult } from './format';

/**
 * Schema type key for Zod v4.
 */
const schemaType = 'zod/v4' as const;

/**
 * Zod v4 schema configuration for use with defineFormHooks.
 * Provides Zod v4-specific type inference and validation.
 *
 * @example
 * ```ts
 * import { defineFormHooks } from '@conform-to/react/future';
 * import { zodSchema } from '@conform-to/zod/v4/future';
 *
 * const { useForm } = defineFormHooks({
 *   schema: zodSchema,
 * });
 * ```
 */
export const zodSchema: SchemaConfig<typeof schemaType> = {
	type: schemaType,
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
};

/**
 * Augment SchemaTypeRegistry to add Zod v4-specific type inference.
 */
declare module '@conform-to/dom/future' {
	interface SchemaTypeRegistry<Schema> {
		[schemaType]: {
			type: ZodAny;
			input: Schema extends ZodAny ? input<Schema> : never;
			output: Schema extends ZodAny ? output<Schema> : never;
		};
	}
}
