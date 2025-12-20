import type { ZodType, input, output } from 'zod';
import type { SchemaConfig } from '@conform-to/dom/future';
import { formatResult } from './format';

/**
 * Schema type key for Zod.
 */
const schemaType = 'zod/v3' as const;

/**
 * Zod schema configuration for use with defineFormHooks.
 * Provides Zod-specific type inference and validation.
 *
 * @example
 * ```ts
 * import { defineFormHooks } from '@conform-to/react/future';
 * import { zodSchema } from '@conform-to/zod/v3/future';
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
 * Augment SchemaTypeRegistry to add Zod-specific type inference.
 */
declare module '@conform-to/dom/future' {
	interface SchemaTypeRegistry<Schema> {
		[schemaType]: {
			type: ZodType;
			input: Schema extends ZodType ? input<Schema> : never;
			output: Schema extends ZodType ? output<Schema> : never;
		};
	}
}
