import {
	type Intent,
	type Submission,
	formatPaths,
	parse,
} from '@conform-to/dom';
import {
	type core,
	type ZodSafeParseResult,
	type ZodType,
	type ZodError,
	type input,
	type output,
} from 'zod';
import { coerceFormValue } from './coercion';

function getError<FormError>(
	zodError: ZodError,
	formatError: (issues: Array<core.$ZodIssue>) => FormError,
): Record<string, FormError | null> | null {
	const result: Record<string, core.$ZodIssue[] | null> = {};

	for (const issue of zodError.issues) {
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

export function parseWithZod<Schema extends ZodType>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
		error?: core.$ZodErrorMap;
		disableAutoCoercion?: boolean;
	},
): Submission<input<Schema>, string[], output<Schema>>;
export function parseWithZod<Schema extends ZodType, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
		error?: core.$ZodErrorMap;
		formatError: (issues: Array<core.$ZodIssue>) => FormError;
		disableAutoCoercion?: boolean;
	},
): Submission<input<Schema>, FormError, output<Schema>>;
export function parseWithZod<Schema extends ZodType>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
		error?: core.$ZodErrorMap;
		disableAutoCoercion?: boolean;
	},
): Promise<Submission<input<Schema>, string[], output<Schema>>>;
export function parseWithZod<Schema extends ZodType, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
		error?: core.$ZodErrorMap;
		formatError: (issues: Array<core.$ZodIssue>) => FormError;
		disableAutoCoercion?: boolean;
	},
): Promise<Submission<input<Schema>, FormError, output<Schema>>>;
export function parseWithZod<Schema extends ZodType, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: boolean;
		error?: core.$ZodErrorMap;
		formatError?: (issues: Array<core.$ZodIssue>) => FormError;
		disableAutoCoercion?: boolean;
	},
):
	| Submission<input<Schema>, FormError | string[], output<Schema>>
	| Promise<Submission<input<Schema>, FormError | string[], output<Schema>>> {
	return parse(payload, {
		resolve(payload, intent) {
			const error = options.error;
			const baseSchema =
				typeof options.schema === 'function'
					? options.schema(intent)
					: options.schema;
			const schema = !options.disableAutoCoercion
				? coerceFormValue(baseSchema)
				: baseSchema;

			const resolveSubmission = (
				result: ZodSafeParseResult<core.output<Schema>>,
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
						.safeParseAsync(payload, { error })
						.then((result) => resolveSubmission(result))
				: resolveSubmission(schema.safeParse(payload, { error }));
		},
	});
}

export const conformZodMessage = {
	VALIDATION_SKIPPED: '__skipped__',
	VALIDATION_UNDEFINED: '__undefined__',
};
