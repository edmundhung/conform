import {
	type Submission,
	getName,
	parse as baseParse,
	VALIDATION_SKIPPED,
	VALIDATION_UNDEFINED,
} from '@conform-to/dom';
import {
	type input,
	type output,
	type RefinementCtx,
	type SafeParseReturnType,
	type ZodTypeAny,
	type ZodErrorMap,
	type IssueData,
	ZodIssueCode,
	ZodCustomIssue,
} from 'zod';
import { enableTypeCoercion } from './coercion';

export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
		async?: false;
		errorMap?: ZodErrorMap;
	},
): Submission<output<Schema>>;
export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
		async: true;
		errorMap?: ZodErrorMap;
	},
): Promise<Submission<output<Schema>>>;
export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
		async?: boolean;
		errorMap?: ZodErrorMap;
	},
): Submission<output<Schema>> | Promise<Submission<output<Schema>>> {
	return baseParse<output<Schema>>(payload, {
		resolve(payload, intent) {
			const schema = enableTypeCoercion(
				typeof config.schema === 'function'
					? config.schema(intent)
					: config.schema,
			);

			const resolveResult = (
				result: SafeParseReturnType<input<Schema>, output<Schema>>,
			): { value: output<Schema> } | { error: Record<string, string[]> } => {
				if (result.success) {
					return {
						value: result.data,
					};
				}

				return {
					error: result.error.errors.reduce<Record<string, string[]>>(
						(result, e) => {
							const name = getName(e.path);

							result[name] = [...(result[name] ?? []), e.message];

							return result;
						},
						{},
					),
				};
			};

			return config.async
				? schema
						.safeParseAsync(payload, { errorMap: config.errorMap })
						.then(resolveResult)
				: resolveResult(
						schema.safeParse(payload, { errorMap: config.errorMap }),
				  );
		},
	});
}

/**
 * A helper function to define a custom constraint on a superRefine check.
 * Mainly used for async validation.
 *
 * @see https://conform.guide/api/zod#refine
 */
export function refine(
	ctx: RefinementCtx,
	options: {
		/**
		 * A validate function. If the function returns `undefined`,
		 * it will fallback to server validation.
		 */
		validate: () => boolean | Promise<boolean> | undefined;
		/**
		 * Define when the validation should be run. If the value is `false`,
		 * the validation will be skipped.
		 */
		when?: boolean;
		/**
		 * The message displayed when the validation fails.
		 */
		message?: string;
		/**
		 * The path set to the zod issue.
		 */
		path?: IssueData['path'];
		/**
		 * Custom parameters
		 */
		params?: ZodCustomIssue['params'];
	},
): void | Promise<void> {
	if (typeof options.when !== 'undefined' && !options.when) {
		ctx.addIssue({
			code: ZodIssueCode.custom,
			message: VALIDATION_SKIPPED,
			path: options.path,
			params: options.params,
		});
		return;
	}

	// Run the validation
	const result = options.validate();

	if (typeof result === 'undefined') {
		// Validate only if the constraint is defined
		ctx.addIssue({
			code: ZodIssueCode.custom,
			message: VALIDATION_UNDEFINED,
			path: options.path,
			params: options.params,
		});
		return;
	}

	const reportInvalid = (valid: boolean) => {
		if (valid) {
			return;
		}

		ctx.addIssue({
			code: ZodIssueCode.custom,
			message: options.message,
			path: options.path,
			params: options.params,
		});
	};

	return typeof result === 'boolean'
		? reportInvalid(result)
		: result.then(reportInvalid);
}
