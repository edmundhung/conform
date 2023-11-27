import {
	type Intent,
	type Submission,
	formatPaths,
	parse as baseParse,
} from '@conform-to/dom';
import {
	type IssueData,
	type SafeParseReturnType,
	type RefinementCtx,
	type ZodTypeAny,
	type ZodError,
	type ZodErrorMap,
	type input,
	type output,
	type ZodIssue,
	ZodIssueCode,
} from 'zod';
import { enableTypeCoercion } from './coercion';

function getError<Error>(
	zodError: ZodError,
	formatError: (issues: Array<ZodIssue>) => Error,
): Record<string, Error | null> | null {
	const result: Record<string, ZodIssue[] | null> = {};

	for (const issue of zodError.errors) {
		const name = formatPaths(issue.path);

		switch (issue.message) {
			case '__undefined__':
				return null;
			case '__skipped__':
				result[name] = null;
				break;
			default: {
				const issues = result[name];

				if (issues !== null) {
					if (issues) {
						result[name] = issues.concat(issue);
					} else {
						result[name] = [issue];
					}
				}
				break;
			}
		}
	}

	return Object.entries(result).reduce<Record<string, Error | null>>(
		(result, [name, issues]) => {
			result[name] = issues ? formatError(issues) : null;

			return result;
		},
		{},
	);
}

export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intents: Array<Intent> | null) => Schema);
		async?: false;
		errorMap?: ZodErrorMap;
	},
): Submission<input<Schema>, output<Schema>, string[]>;
export function parse<Schema extends ZodTypeAny, Error>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intents: Array<Intent> | null) => Schema);
		async?: false;
		errorMap?: ZodErrorMap;
		formatError: (issues: Array<ZodIssue>) => Error;
	},
): Submission<input<Schema>, output<Schema>, Error>;
export function parse<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intents: Array<Intent> | null) => Schema);
		async: true;
		errorMap?: ZodErrorMap;
	},
): Promise<Submission<input<Schema>, output<Schema>, string[]>>;
export function parse<Schema extends ZodTypeAny, Error>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intents: Array<Intent> | null) => Schema);
		async: true;
		errorMap?: ZodErrorMap;
		formatError: (issues: Array<ZodIssue>) => Error;
	},
): Promise<Submission<input<Schema>, output<Schema>, Error>>;
export function parse<Schema extends ZodTypeAny, Error>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intents: Array<Intent> | null) => Schema);
		async?: boolean;
		errorMap?: ZodErrorMap;
		formatError?: (issues: Array<ZodIssue>) => Error;
	},
):
	| Submission<input<Schema>, output<Schema>, Error | string[]>
	| Promise<Submission<input<Schema>, output<Schema>, Error | string[]>> {
	return baseParse(payload, {
		resolve(payload, intents) {
			const errorMap = options.errorMap;
			const schema = enableTypeCoercion(
				typeof options.schema === 'function'
					? options.schema(intents)
					: options.schema,
			);

			const resolveSubmission = <Input, Output>(
				result: SafeParseReturnType<Input, Output>,
			) => {
				return {
					value: result.success ? result.data : null,
					error: !result.success
						? getError<Error | string[]>(
								result.error,
								options.formatError ??
									((issues) => issues.map((issue) => issue.message)),
						  )
						: {},
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
			message: '__skipped__',
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
			message: '__undefined__',
			path: options.path,
			fatal: true,
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
