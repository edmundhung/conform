import {
	type Submission,
	formatPaths,
	parse as baseParse,
} from '@conform-to/dom';
import {
	type IssueData,
	type SafeParseReturnType,
	type output,
	type RefinementCtx,
	type ZodTypeAny,
	type ZodError,
	type ZodErrorMap,
	ZodIssueCode,
} from 'zod';
import { enableTypeCoercion } from './coercion';

function getError({ errors }: ZodError): Record<string, string[]> {
	return errors.reduce<Record<string, string[]>>((result, error) => {
		const name = formatPaths(error.path);
		const messages = result[name] ?? [];

		messages.push(error.message);

		result[name] = messages;

		return result;
	}, {});
}

export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: string) => Schema);
		async?: false;
		errorMap?: ZodErrorMap;
	},
): Submission<output<Schema>>;
export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: string) => Schema);
		async: true;
		errorMap?: ZodErrorMap;
	},
): Promise<Submission<output<Schema>>>;
export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: string) => Schema);
		async?: boolean;
		errorMap?: ZodErrorMap;
	},
): Submission<output<Schema>> | Promise<Submission<output<Schema>>> {
	return baseParse(payload, {
		resolve(payload, intent) {
			const errorMap = options.errorMap;
			const schema = enableTypeCoercion(
				typeof options.schema === 'function'
					? options.schema(intent)
					: options.schema,
			);

			const resolveSubmission = <Input, Output>(
				result: SafeParseReturnType<Input, Output>,
			) => {
				return {
					value: result.success ? result.data : null,
					error: !result.success ? getError(result.error) : {},
				};
			};

			return options.async
				? schema
						.safeParseAsync(payload, { errorMap })
						.then((result) => resolveSubmission(result))
				: resolveSubmission(schema.safeParse(payload, { errorMap }));
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
		message: string;
		/**
		 * The path set to the zod issue.
		 */
		path?: IssueData['path'];
	},
): void | Promise<void> {
	if (typeof options.when !== 'undefined' && !options.when) {
		ctx.addIssue({
			code: ZodIssueCode.custom,
			message: '__VALIDATION_SKIPPED__',
			path: options.path,
		});
		return;
	}

	// Run the validation
	const result = options.validate();

	if (typeof result === 'undefined') {
		// Validate only if the constraint is defined
		ctx.addIssue({
			code: ZodIssueCode.custom,
			message: `__VALIDATION_UNDEFINED__`,
			path: options.path,
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
		});
	};

	return typeof result === 'boolean'
		? reportInvalid(result)
		: result.then(reportInvalid);
}
