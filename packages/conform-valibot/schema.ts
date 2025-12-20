import type {
	GenericSchema,
	GenericSchemaAsync,
	InferInput,
	InferOutput,
	Config,
} from 'valibot';
import { safeParse, safeParseAsync } from 'valibot';
import type { SchemaConfig } from '@conform-to/dom/future';
import { getValibotConstraint } from './constraint';
import { formatResult } from './format';

type ValibotSchema = GenericSchema | GenericSchemaAsync;

/**
 * Schema type key for Valibot.
 */
const schemaType = 'valibot/v1' as const;

/**
 * Schema-specific options for Valibot validation.
 */
export type ValibotSchemaOptions = Config<any>;

/**
 * Augment SchemaTypeRegistry to add Valibot-specific type inference.
 */
declare module '@conform-to/dom/future' {
	interface SchemaTypeRegistry<Schema> {
		[schemaType]: {
			type: ValibotSchema;
			input: Schema extends ValibotSchema ? InferInput<Schema> : never;
			output: Schema extends ValibotSchema ? InferOutput<Schema> : never;
			options: ValibotSchemaOptions;
		};
	}
}

/**
 * Valibot schema configuration for use with configureForms.
 * Provides Valibot-specific type inference and validation.
 *
 * @example
 * ```ts
 * import { configureForms } from '@conform-to/react/future';
 * import { valibotSchema } from '@conform-to/valibot/future';
 *
 * const { useForm } = configureForms({
 *   schema: valibotSchema,
 * });
 * ```
 */
export const valibotSchema: SchemaConfig<typeof schemaType> = {
	type: schemaType,
	validate(schema, payload, options) {
		if (schema.async === true) {
			return safeParseAsync(schema, payload, options).then((result) =>
				formatResult(result, { includeValue: true }),
			) as any;
		}

		const result = safeParse(schema, payload, options);
		return formatResult(result, { includeValue: true }) as any;
	},
	getConstraint(schema) {
		return getValibotConstraint(schema);
	},
};
