import {
	type Intent,
	type Submission,
	formatPaths,
	parse,
} from '@conform-to/dom';
import {
	type SafeParseReturnType,
	type ZodTypeAny,
	type ZodError,
	type ZodErrorMap,
	type input,
	type output,
	type ZodIssue,
} from 'zod';
import { enableTypeCoercion } from './coercion';

function getError<FormError>(
	zodError: ZodError,
	formatError: (issues: Array<ZodIssue>) => FormError,
): Record<string, FormError | null> | null {
	const result: Record<string, ZodIssue[] | null> = {};

	for (const issue of zodError.errors) {
		const name = formatPaths(issue.path);

		switch (issue.message) {
			case conformZodMessage.VALIDATION_UNDEFINED:
				return null;
			case conformZodMessage.VALIDATION_SKIPPED:
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

	return Object.entries(result).reduce<Record<string, FormError | null>>(
		(result, [name, issues]) => {
			result[name] = issues ? formatError(issues) : null;

			return result;
		},
		{},
	);
}

export function parseWithZod<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
		errorMap?: ZodErrorMap;
	},
): Submission<input<Schema>, string[], output<Schema>>;
export function parseWithZod<Schema extends ZodTypeAny, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
		errorMap?: ZodErrorMap;
		formatError: (issues: Array<ZodIssue>) => FormError;
	},
): Submission<input<Schema>, FormError, output<Schema>>;
export function parseWithZod<Schema extends ZodTypeAny>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
		errorMap?: ZodErrorMap;
	},
): Promise<Submission<input<Schema>, string[], output<Schema>>>;
export function parseWithZod<Schema extends ZodTypeAny, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
		errorMap?: ZodErrorMap;
		formatError: (issues: Array<ZodIssue>) => FormError;
	},
): Promise<Submission<input<Schema>, FormError, output<Schema>>>;
export function parseWithZod<Schema extends ZodTypeAny, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: boolean;
		errorMap?: ZodErrorMap;
		formatError?: (issues: Array<ZodIssue>) => FormError;
	},
):
	| Submission<input<Schema>, FormError | string[], output<Schema>>
	| Promise<Submission<input<Schema>, FormError | string[], output<Schema>>> {
	return parse(payload, {
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
					value: result.success ? result.data : undefined,
					error: !result.success
						? getError<FormError | string[]>(
								result.error,
								options.formatError ??
									((issues) => issues.map((issue) => issue.message)),
							)
						: undefined,
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

export const conformZodMessage = {
	VALIDATION_SKIPPED: '__skipped__',
	VALIDATION_UNDEFINED: '__undefined__',
};
